"use client";

import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SYNC_TABLES, type SyncTable, type SyncableRow } from "./types";
import { toCloud } from "./mapping";
import { runBackfill } from "./backfill";
import { pullChanges } from "./pull";

const PUSH_TICK_MS = 3000;
const PULL_TICK_MS = 60_000;
const MAX_PER_TICK = 50;

let running = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullTimer: ReturnType<typeof setTimeout> | null = null;
let listeners = new Set<(state: SyncState) => void>();

export type SyncState = {
  status: "idle" | "syncing" | "pulling" | "error" | "offline";
  pendingCount: number;
  lastError: string | null;
  lastSyncedAt: string | null;
  lastPulledAt: string | null;
};

let state: SyncState = {
  status: "idle",
  pendingCount: 0,
  lastError: null,
  lastSyncedAt: null,
  lastPulledAt: null,
};

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSync(listener: (s: SyncState) => void): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Start the sync worker. Performs a bootstrap pull on first start
 * (so new-device sign-ins get cloud data before push starts), then
 * runs both push and pull on independent timers.
 *
 * Idempotent — calling again while running is a no-op.
 */
export async function startSyncWorker() {
  if (running) return;
  running = true;

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (userId) {
      // Bootstrap: pull first so we don't push stale local defaults over
      // cloud data on a fresh-device sign-in.
      setState({ status: "pulling" });
      try {
        const result = await pullChanges(userId);
        setState({
          lastPulledAt: new Date().toISOString(),
          lastError: null,
        });
        if (result.conflicts.length > 0) {
          console.log("[mindra] pull conflicts", result.conflicts);
        }
      } catch (err) {
        // Non-fatal — push can still proceed. Worker will retry pull.
        console.error("[mindra] bootstrap pull failed", err);
        setState({
          status: "error",
          lastError: err instanceof Error ? err.message : String(err),
        });
      }

      // Backfill remains relevant only when local has data that's never
      // been seen by cloud. On a fresh-device sign-in where bootstrap pull
      // brought everything in, backfill is a no-op (local already synced).
      try {
        const result = await runBackfill(userId);
        void result;
      } catch (err) {
        console.error("[mindra] backfill orchestration failed", err);
      }

      setState({ status: "idle", lastError: null });
    }
  } catch (err) {
    console.error("[mindra] startup failed", err);
  }

  schedulePush();
  schedulePull();
}

export function stopSyncWorker() {
  running = false;
  if (pushTimer) clearTimeout(pushTimer);
  if (pullTimer) clearTimeout(pullTimer);
  pushTimer = null;
  pullTimer = null;
  setState({ status: "idle" });
}

function schedulePush(delayMs: number = PUSH_TICK_MS) {
  if (!running) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushTick, delayMs);
}

function schedulePull(delayMs: number = PULL_TICK_MS) {
  if (!running) return;
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(pullTick, delayMs);
}

async function pushTick() {
  if (!running) return;

  const supabase = getSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    setState({ status: "idle" });
    running = false;
    return;
  }

  try {
    const totalPending = await countAllPending();
    if (totalPending === 0) {
      setState({ status: "idle", pendingCount: 0, lastError: null });
      schedulePush();
      return;
    }

    setState({ status: "syncing", pendingCount: totalPending });

    for (const table of SYNC_TABLES) {
      const dirty = await findDirty(table, MAX_PER_TICK);
      if (dirty.length === 0) continue;
      await pushBatch(table, dirty, userId);
    }

    setState({
      status: "idle",
      pendingCount: 0,
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err) {
    setState({
      status: "error",
      lastError: err instanceof Error ? err.message : String(err),
    });
  }

  schedulePush();
}

async function pullTick() {
  if (!running) return;

  const supabase = getSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    setState({ status: "idle" });
    running = false;
    return;
  }

  try {
    // Don't disturb push status — pull happens in background.
    const wasIdle = state.status === "idle";
    if (wasIdle) setState({ status: "pulling" });

    const result = await pullChanges(userId);

    setState({
      status: "idle",
      lastPulledAt: new Date().toISOString(),
      lastError: null,
    });

    if (result.conflicts.length > 0) {
      console.log("[mindra] pull conflicts", result.conflicts);
    }
  } catch (err) {
    // Pull failure: log, don't escalate to error status (push may still
    // be working fine). Retry next tick.
    console.error("[mindra] pull failed", err);
  }

  schedulePull();
}

async function countAllPending(): Promise<number> {
  let total = 0;
  for (const table of SYNC_TABLES) {
    const t = db.table(table);
    const rows = (await t.toArray()) as SyncableRow[];
    total += rows.filter(isDirty).length;
  }
  return total;
}

function isDirty(row: SyncableRow): boolean {
  if (row.synced_at === null) return true;
  return row.synced_at < row.updated_at;
}

async function findDirty(
  table: SyncTable,
  limit: number,
): Promise<SyncableRow[]> {
  const t = db.table(table);
  const all = (await t.toArray()) as SyncableRow[];
  const dirty = all.filter(isDirty).slice(0, limit);
  return dirty;
}

async function pushBatch(
  table: SyncTable,
  rows: SyncableRow[],
  userId: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const cloudRows = rows.map((r) =>
    toCloud(table, r as unknown as Record<string, unknown>, userId),
  );

  const { error } = await supabase
    .from(table)
    .upsert(cloudRows, { onConflict: "id" });

  if (error) {
    throw new Error(`push ${table}: ${error.message}`);
  }

  const localTable = db.table(table);
  await db.transaction("rw", localTable, async () => {
    for (const r of rows) {
      const fresh = await localTable.get(r.id);
      if (!fresh) continue;
      if (fresh.updated_at !== r.updated_at) continue;
      await localTable.update(r.id, { synced_at: r.updated_at });
    }
  });
}