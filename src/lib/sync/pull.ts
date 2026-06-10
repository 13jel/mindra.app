"use client";

import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SYNC_TABLES, type SyncTable } from "./types";

/**
 * localStorage key for the last-pull-at timestamp per user.
 * We track the high-water mark of `updated_at` we've seen from cloud
 * so subsequent pulls only fetch newer rows.
 */
function lastPulledKey(userId: string): string {
  return `mindra:lastPulledAt:${userId}`;
}

export function getLastPulledAt(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(lastPulledKey(userId));
}

export function setLastPulledAt(userId: string, iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lastPulledKey(userId), iso);
}

/**
 * Cloud rows have user_id and the column-renamed shape that toCloud
 * produced. Convert back to the local Dexie shape before writing.
 */
function fromCloud(table: SyncTable, cloudRow: Record<string, unknown>): Record<string, unknown> {
  if (table === "preferences") {
    return {
      id: "default",
      display_name: cloudRow.display_name ?? "",
      rest_default_s: cloudRow.rest_default_s ?? 90,
      weekStart: cloudRow.week_start ?? "mon",
      units: cloudRow.units ?? "metric",
      kindMode: cloudRow.kind_mode ?? false,
      kindSoftLanguage: cloudRow.kind_soft_language ?? false,
      kindReducedMotion: cloudRow.kind_reduced_motion ?? false,
      kindLargerText: cloudRow.kind_larger_text ?? false,
      kindHideTotals: cloudRow.kind_hide_totals ?? false,
      kindHideCounts: cloudRow.kind_hide_counts ?? false,
      kindWordCheckIn: cloudRow.kind_word_check_in ?? false,
      updated_at: cloudRow.updated_at,
      synced_at: cloudRow.updated_at, // pulled rows are by definition synced
      deleted_at: cloudRow.deleted_at ?? null,
    };
  }

  // For other tables, the shapes match; strip user_id (local doesn't carry it).
  const { user_id: _userId, ...rest } = cloudRow;
  return {
    ...rest,
    synced_at: cloudRow.updated_at as string, // mark synced
  };
}

export type PullResult = {
  pulled: Record<SyncTable, number>;
  conflicts: { table: SyncTable; id: string; winner: "local" | "cloud" }[];
  newHighWaterMark: string | null;
};

/**
 * Pull cloud changes for this user, applying LWW conflict resolution.
 *
 * Strategy:
 * 1. Fetch all rows from each cloud table with updated_at > lastPulledAt
 *    (or all rows if first pull).
 * 2. For each row, check local for a matching id.
 *    - No local row → write the cloud row (insert).
 *    - Local row exists, local.updated_at <= cloud.updated_at → cloud
 *      wins, overwrite local entirely.
 *    - Local row exists, local.updated_at > cloud.updated_at → local
 *      wins, leave it alone. The local row's existing dirty state means
 *      the next push tick will send it.
 * 3. Track the highest updated_at seen this pull as the new high-water
 *    mark.
 *
 * Soft-deletes: deleted_at != null rows are pulled like any other row
 * and overwrite local (subject to LWW). Local rows with the deleted_at
 * field set will read as soft-deleted by the rest of the app.
 *
 * Vanished rows: a local row with synced_at set but no matching cloud
 * row is left alone. Likely means cloud was manually edited (e.g., wipe
 * during testing). The dirty check (synced_at < updated_at) won't fire,
 * so the row sits idle locally. If the user edits it, push will re-create
 * it in cloud. We accept this drift in exchange for not silently deleting
 * data.
 */
export async function pullChanges(userId: string): Promise<PullResult> {
  const supabase = getSupabaseBrowserClient();
  const since = getLastPulledAt(userId);

  const pulled: Record<SyncTable, number> = {
    preferences: 0,
    library: 0,
    patterns: 0,
    workouts: 0,
    exercises: 0,
    sets: 0,
    check_ins: 0,
  };
  const conflicts: PullResult["conflicts"] = [];
  let highWater: string | null = since;

  for (const table of SYNC_TABLES) {
    let query = supabase
        .from(table)
        .select("*")
        .order("updated_at", { ascending: true });

        // preferences uses the user uid as its primary id, no user_id column.
        if (table === "preferences") {
        query = query.eq("id", userId);
        } else {
        query = query.eq("user_id", userId);
        }

    const { data, error } = await query;
    if (error) {
      throw new Error(`pull ${table}: ${error.message}`);
    }
    if (!data || data.length === 0) continue;

    const localTable = db.table(table);

    await db.transaction("rw", localTable, async () => {
      for (const cloudRow of data) {
        const cloudUpdated = cloudRow.updated_at as string;
        const localId = table === "preferences" ? "default" : (cloudRow.id as string);
        const localRow = await localTable.get(localId);

        if (!localRow) {
          // Pure insert.
          const localShape = fromCloud(table, cloudRow);
          await localTable.put(localShape);
          pulled[table]++;
        } else {
          // Conflict resolution: LWW by updated_at.
            const localUpdated = (localRow as { updated_at: string }).updated_at;
            const localMs = new Date(localUpdated).getTime();
            const cloudMs = new Date(cloudUpdated).getTime();
            if (localMs > cloudMs) {            // Local wins. Leave alone — its existing dirty state (if any)
            // ensures next push tick will resolve it.
            conflicts.push({ table, id: localId, winner: "local" });
          } else {
            // Cloud wins (or tie). Overwrite local entirely.
            const localShape = fromCloud(table, cloudRow);
            await localTable.put(localShape);
            pulled[table]++;
            if (localMs !== cloudMs) {
            conflicts.push({ table, id: localId, winner: "cloud" });
            }
          }
        }

            // Normalize cloud's "+00:00" to "Z" suffix so the watermark string
            // compares cleanly against future cloud timestamps (cloud always
            // returns the same +00:00 format; we normalize for safety and to
            // keep it identical to local format).
            const normalizedCloudUpdated = new Date(cloudUpdated).toISOString();
            if (highWater === null || normalizedCloudUpdated > highWater) {
            highWater = normalizedCloudUpdated;
            }        
      }
    });
  }

  if (highWater !== null) {
    setLastPulledAt(userId, highWater);
  }

  return { pulled, conflicts, newHighWaterMark: highWater };
}

/**
 * Clear pull state for a user — used when switching accounts or for
 * recovery. Forces the next pull to be a full pull.
 */
export function clearPullState(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(lastPulledKey(userId));
}