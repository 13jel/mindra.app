import Dexie, { type EntityTable } from "dexie";
import type { SyncMeta, WithSyncMeta } from "./sync-types";
import { newId, nowIso } from "./sync-types";
import type { PainSite } from "./pain-regions";

export type Workout = WithSyncMeta<{
  date: string;
  pattern_id: string | null;
  note: string;
  pain_pre: PainSite[];   
  pain_post: PainSite[];
}>;

export type Exercise = WithSyncMeta<{
  workout_id: string;
  position: number;
  name: string;
}>;

export type LibraryExercise = WithSyncMeta<{
  name: string;
  is_standard: boolean;
  category: string | null;
  last_used: string | null;
}>;

export type WorkoutSet = WithSyncMeta<{
  exercise_id: string;
  position: number;
  reps: number | null;
  weight_kg: number | null;
  duration_s: number | null;
  rpe: number | null;
}>;

export type Pattern = WithSyncMeta<{
  name: string;
  is_preset: boolean;
  body: unknown;
}>;

export type Profile = WithSyncMeta<{
  display_name: string;
  units: "metric" | "imperial";
  rest_default_s: number;
}>;

export type RestReason = "planned" | "forced" | "skipped";

export type CheckIn = WithSyncMeta<{
  date: string;
  pain: number;
  note: string;
  pain_sites: PainSite[];
  is_rest_day: boolean;
  rest_reason: RestReason | null;
}>;

/* ---------- Dexie ---------- */

export type WeekStart = "sun" | "mon";
export type Units = "metric" | "imperial";

export interface Preferences {
  id: "default";
  display_name: string;
  rest_default_s: number;
  weekStart: WeekStart;
  units: Units;
  kindMode: boolean;
  kindSoftLanguage: boolean;
  kindReducedMotion: boolean;
  kindLargerText: boolean;
  kindHideTotals: boolean;
  kindHideCounts: boolean;
  kindWordCheckIn: boolean;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
}

class MindraDB extends Dexie {
  workouts!: EntityTable<Workout, "id">;
  library!: EntityTable<LibraryExercise, "id">;
  exercises!: EntityTable<Exercise, "id">;
  sets!: EntityTable<WorkoutSet, "id">;
  patterns!: EntityTable<Pattern, "id">;
  profile!: EntityTable<Profile, "id">;
  check_ins!: EntityTable<CheckIn, "id">;
  preferences!: EntityTable<Preferences, "id">;

  constructor() {
    super("mindra");

    // v1:
    this.version(1).stores({
      workouts: "&id, date, updated_at, synced_at, pattern_id",
      sets: "&id, workout_id, [workout_id+position], updated_at, synced_at",
      patterns: "&id, name, is_preset, updated_at, synced_at",
      profile: "&id, updated_at, synced_at",
    });

    // v2:
    this.version(2)
      .stores({
        workouts: "&id, date, updated_at, synced_at, pattern_id",
        exercises:
          "&id, workout_id, [workout_id+position], updated_at, synced_at",
        sets: "&id, exercise_id, [exercise_id+position], updated_at, synced_at",
        patterns: "&id, name, is_preset, updated_at, synced_at",
        profile: "&id, updated_at, synced_at",
      })
      .upgrade(async (tx) => {
        await tx.table("sets").clear();
      });

      // v3: 
    this.version(3).stores({
      workouts: "&id, date, updated_at, synced_at, pattern_id",
      exercises:
        "&id, workout_id, [workout_id+position], updated_at, synced_at",
      sets: "&id, exercise_id, [exercise_id+position], updated_at, synced_at",
      patterns: "&id, name, is_preset, updated_at, synced_at",
      profile: "&id, updated_at, synced_at",
      check_ins: "&id, &date, updated_at, synced_at",
    });

    // v4:
    this.version(4).stores({
      workouts: "&id, date, updated_at, synced_at, pattern_id",
      exercises:
        "&id, workout_id, [workout_id+position], updated_at, synced_at",
      sets: "&id, exercise_id, [exercise_id+position], updated_at, synced_at",
      patterns: "&id, name, is_preset, updated_at, synced_at",
      profile: "&id, updated_at, synced_at",
      check_ins: "&id, &date, updated_at, synced_at",
      library: "&id, name, is_standard, last_used, updated_at, synced_at",
    });

    this.version(5).stores({
      preferences: "id, updated_at",
    });

    this.version(6).stores({
      preferences: "id, updated_at",
    });

    this.version(7).stores({
      preferences: "id, updated_at",
    }).upgrade(async (tx) => {
      await tx.table("preferences").toCollection().modify((row) => {
        if (row.display_name === undefined) row.display_name = "";
        if (row.rest_default_s === undefined) row.rest_default_s = 90;
        if (row.kindMode === undefined) row.kindMode = false;
        if (row.kindSoftLanguage === undefined) row.kindSoftLanguage = false;
        if (row.kindReducedMotion === undefined) row.kindReducedMotion = false;
        if (row.kindLargerText === undefined) row.kindLargerText = false;
        if (row.kindHideTotals === undefined) row.kindHideTotals = false;
        if (row.kindHideCounts === undefined) row.kindHideCounts = false;
        if (row.kindWordCheckIn === undefined) row.kindWordCheckIn = false;
      });
    });

    }
}

export const db = new MindraDB();

/* ---------- Helpers ---------- */

export function newRow<T extends object>(data: T): T & SyncMeta {
  return {
    ...data,
    id: newId(),
    updated_at: nowIso(),
    synced_at: null,
    deleted_at: null,
  };
}

export async function softDelete<T extends SyncMeta>(
  table: EntityTable<T, "id">,
  id: string,
): Promise<void> {
  const now = nowIso();
  await table.update(id as never, {
    deleted_at: now,
    updated_at: now,
  } as never);
}

export function alive<T extends SyncMeta>(rows: T[]): T[] {
  return rows.filter((r) => r.deleted_at === null);
}