"use client";

import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SYNC_TABLES, type SyncTable, type SyncableRow } from "./types";
import { toCloud } from "./mapping";
import { runBackfill } from "./backfill";

const TICK_MS = 3000; // how often the worker wakes up
const MAX_PER_TICK = 50; // cap per push batch to avoid huge requests

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let listeners = new Set<(state: SyncState) => void>();

export type SyncState = {
  status: "idle" | "syncing" | "error" | "offline";
  pendingCount: number;
  lastError: string | null;
  lastSyncedAt: string | null;
};

let state: SyncState = {
  status: "idle",
  pendingCount: 0,
  lastError: null,
  lastSyncedAt: null,
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
  listener(state); // emit current state immediately
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Start the sync worker loop. Idempotent — safe to call multiple times.
 * Stops automatically if the user signs out.
 */
export async function startSyncWorker() {
  if (running) return;
  running = true;

  // Run backfill before the regular tick loop. Backfill marks local rows
  // dirty; the subsequent tick(s) will push them. We don't push from
  // within backfill to keep responsibilities separate.
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const result = await runBackfill(userId);
      setState({ status: "idle", lastError: null });
      // result reported via getBackfillState() for UI; not surfaced here.
      void result;
    }
  } catch (err) {
    console.error("[mindra] backfill orchestration failed", err);
    // Continue to tick loop anyway — partial state is recoverable.
  }

  schedule();
}

export function stopSyncWorker() {
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
  setState({ status: "idle" });
}

function schedule(delayMs: number = TICK_MS) {
  if (!running) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(tick, delayMs);
}

async function tick() {
  if (!running) return;

  const supabase = getSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    // Signed out; stop ticking until startSyncWorker is called again.
    setState({ status: "idle" });
    running = false;
    return;
  }

  try {
    const totalPending = await countAllPending();
    if (totalPending === 0) {
      setState({ status: "idle", pendingCount: 0, lastError: null });
      schedule();
      return;
    }

    setState({ status: "syncing", pendingCount: totalPending });

    // Process tables in declared order. Parent tables first so child
    // pushes don't fail FK constraints when the parent doesn't exist yet
    // in the cloud.
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
    // Network-level failure (offline, server down, etc). Try again on
    // next tick. Don't burn the queue — rows stay dirty.
    setState({
      status: "error",
      lastError: err instanceof Error ? err.message : String(err),
    });
  }

  schedule();
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

  // Mark each pushed row as synced. Use updated_at at push time, not now,
  // so subsequent edits between push and mark-clean still appear dirty.
  const localTable = db.table(table);
  await db.transaction("rw", localTable, async () => {
    for (const r of rows) {
      const fresh = await localTable.get(r.id);
      if (!fresh) continue;
      // If the row was edited again between findDirty and now, leave it
      // dirty. Compare updated_at.
      if (fresh.updated_at !== r.updated_at) continue;
      await localTable.update(r.id, { synced_at: r.updated_at });
    }
  });
}