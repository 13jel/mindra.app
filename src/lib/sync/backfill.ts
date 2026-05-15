"use client";

import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SYNC_TABLES } from "./types";

const HAS_RUN_KEY = "mindra:backfill:has_run";

function userKey(userId: string): string {
  return `mindra:backfill:${userId}`;
}

export type BackfillState =
  | { kind: "not_started" }
  | { kind: "in_progress" }
  | { kind: "done" }
  | { kind: "skipped"; reason: "cloud_not_empty" | "device_already_backfilled" }
  | { kind: "error"; message: string };

/**
 * Read current backfill state for this user.
 * If `has_run` is set globally on this device but not for this user,
 * we treat it as skipped — protects against pushing one account's
 * data into another account's cloud from the same browser.
 */
export function getBackfillState(userId: string): BackfillState {
  if (typeof window === "undefined") return { kind: "not_started" };

  const userState = window.localStorage.getItem(userKey(userId));
  if (userState === "done") return { kind: "done" };
  if (userState === "skipped:cloud_not_empty") {
    return { kind: "skipped", reason: "cloud_not_empty" };
  }
  if (userState === "in_progress") return { kind: "in_progress" };

  const hasRunGlobally = window.localStorage.getItem(HAS_RUN_KEY) === "1";
  if (hasRunGlobally) {
    return { kind: "skipped", reason: "device_already_backfilled" };
  }

  return { kind: "not_started" };
}

function setState(userId: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userKey(userId), value);
}

function setGlobalHasRun() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HAS_RUN_KEY, "1");
}

/**
 * Check whether the cloud has any non-deleted rows for this user across
 * all tables. Returns true on the first table that has any data.
 *
 * Conservative: if any table has data, refuse to backfill. Matches our
 * push-only Phase 3 design — we can't merge yet, so we refuse to clobber.
 */
async function cloudHasAnyData(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  for (const table of SYNC_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);
    if (error) {
      throw new Error(`probe ${table}: ${error.message}`);
    }
    if ((count ?? 0) > 0) return true;
  }
  return false;
}

/**
 * Local Dexie doesn't enforce FK constraints, so orphan references can
 * accumulate (e.g., a workout's pattern_id pointing to a deleted pattern).
 * Postgres does enforce FKs and will reject pushes. Null out orphan refs
 * before backfill runs.
 */
async function nullOrphanReferences(): Promise<void> {
  // workouts → patterns
  await db.transaction("rw", db.workouts, db.patterns, async () => {
    const livePatternIds = new Set(
      (await db.patterns.toArray())
        .filter((p) => p.deleted_at === null)
        .map((p) => p.id),
    );
    const workouts = await db.workouts.toArray();
    for (const w of workouts) {
      if (w.pattern_id !== null && !livePatternIds.has(w.pattern_id)) {
        await db.workouts.update(w.id, {
          pattern_id: null,
          updated_at: new Date().toISOString(),
          synced_at: null,
        });
      }
    }
  });
}

/**
 * Mark every non-deleted local row across all sync tables as dirty
 * (synced_at = null). The worker will then push them on its next tick.
 *
 * This doesn't push directly — pushing is the worker's job. We just
 * stage the work for it.
 */
async function markAllLocalDirty(): Promise<number> {
  let count = 0;
  const now = new Date().toISOString();
  for (const table of SYNC_TABLES) {
    const t = db.table(table);
    await db.transaction("rw", t, async () => {
      const rows = await t.toArray();
      for (const row of rows) {
        if ((row as { deleted_at: string | null }).deleted_at !== null) continue;
        await t.update(
          (row as { id: string | "default" }).id,
          { synced_at: null, updated_at: now },
        );
        count++;
      }
    });
  }
  return count;
}

/**
 * Run backfill for the given user. Idempotent — safe to call multiple
 * times; subsequent calls no-op if already done/skipped.
 *
 * Caller is responsible for stopping the worker before calling and
 * restarting it after.
 */
export async function runBackfill(
  userId: string,
): Promise<BackfillState> {
  const current = getBackfillState(userId);
  if (current.kind === "done") return current;
  if (current.kind === "skipped") return current;

  setState(userId, "in_progress");

  try {
    const cloudPopulated = await cloudHasAnyData();
    if (cloudPopulated) {
      setState(userId, "skipped:cloud_not_empty");
      setGlobalHasRun();
      return { kind: "skipped", reason: "cloud_not_empty" };
    }

    await nullOrphanReferences();

    const dirtied = await markAllLocalDirty();
    console.log(`[mindra] backfill marked ${dirtied} rows dirty`);

    setState(userId, "done");
    setGlobalHasRun();
    return { kind: "done" };
  } catch (err) {
    // Leave state as `in_progress` so a retry happens on next sign-in.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mindra] backfill failed", err);
    return { kind: "error", message };
  }
}

/**
 * Subscribe to backfill state changes for a user. Polls localStorage
 * every 2 seconds; lightweight and avoids needing a custom event bus.
 *
 * Returns an unsubscribe function. Listener receives initial state
 * immediately.
 */
export function subscribeBackfill(
  userId: string,
  listener: (state: BackfillState) => void,
): () => void {
  let lastSerialized = "";

  const tick = () => {
    const state = getBackfillState(userId);
    const ser = JSON.stringify(state);
    if (ser !== lastSerialized) {
      lastSerialized = ser;
      listener(state);
    }
  };

  tick(); // emit initial state
  const interval = setInterval(tick, 2000);

  return () => clearInterval(interval);
}