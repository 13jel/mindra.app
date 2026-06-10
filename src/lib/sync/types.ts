// types.ts
import type { Workout, Exercise, WorkoutSet, LibraryExercise, Pattern, CheckIn, Preferences } from "@/lib/db";

/**
 * Tables that participate in sync. Each entry maps a Dexie table name to
 * the corresponding Postgres table name (they happen to match for now,
 * but the indirection lets us rename without coupling).
 *
 * Order matters for backfill: parents before children to satisfy FK
 * constraints. workouts before exercises before sets, etc.
 */
export const SYNC_TABLES = [
  "preferences",
  "library",
  "patterns",
  "workouts",
  "exercises",
  "sets",
  "check_ins",
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];

/**
 * Per-row sync state. A row is "dirty" if synced_at is null OR
 * synced_at < updated_at. Worker selects dirty rows for push.
 */
export type SyncableRow = {
  id: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

/**
 * Result of pushing one row. The worker records this for retry logic.
 */
export type PushResult =
  | { kind: "ok"; id: string }
  | { kind: "skipped"; id: string; reason: string }
  | { kind: "error"; id: string; error: string };