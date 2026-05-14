"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Preferences } from "./db";
import { ensurePreferences, readPreferences } from "./preferences";
import type { CheckIn, Exercise, LibraryExercise, Pattern, Workout, WorkoutSet } from "./db";
import { listLibrary, listLibraryAlpha, listLibraryByCategory } from "./library";
import { listPatterns } from "./patterns";
import { getDailySeries, getStats, getRegionSeries } from "./patterns-analytics";


export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.workouts.orderBy("date").reverse().toArray();
    return rows.filter((r) => r.deleted_at === null);
  }, []);
}

export function useWorkout(id: string | undefined): Workout | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    const w = await db.workouts.get(id);
    if (!w || w.deleted_at !== null) return null;
    return w;
  }, [id]);
}

export function useWorkoutExercises(
  workout_id: string | undefined,
): Exercise[] | undefined {
  return useLiveQuery(async () => {
    if (!workout_id) return [];
    const rows = await db.exercises
      .where("[workout_id+position]")
      .between([workout_id, 0], [workout_id, Infinity])
      .toArray();
    return rows.filter((e) => e.deleted_at === null);
  }, [workout_id]);
}

export function useExerciseSets(
  exercise_id: string | undefined,
): WorkoutSet[] | undefined {
  return useLiveQuery(async () => {
    if (!exercise_id) return [];
    const rows = await db.sets
      .where("[exercise_id+position]")
      .between([exercise_id, 0], [exercise_id, Infinity])
      .toArray();
    return rows.filter((s) => s.deleted_at === null);
  }, [exercise_id]);
}

export function useWorkoutAllSets(
  workout_id: string | undefined,
): { exercise: Exercise; sets: WorkoutSet[] }[] | undefined {
  return useLiveQuery(async () => {
    if (!workout_id) return [];
    const exercises = await db.exercises
      .where("[workout_id+position]")
      .between([workout_id, 0], [workout_id, Infinity])
      .toArray();
    const aliveExercises = exercises.filter((e) => e.deleted_at === null);

    const result: { exercise: Exercise; sets: WorkoutSet[] }[] = [];
    for (const ex of aliveExercises) {
      const sets = await db.sets
        .where("[exercise_id+position]")
        .between([ex.id, 0], [ex.id, Infinity])
        .toArray();
      result.push({
        exercise: ex,
        sets: sets.filter((s) => s.deleted_at === null),
      });
    }
    return result;
  }, [workout_id]);
}

export function useTodayWorkouts(): Workout[] | undefined {
  return useLiveQuery(async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const date = `${yyyy}-${mm}-${dd}`;
    const rows = await db.workouts.where("date").equals(date).toArray();
    return rows
      .filter((r) => r.deleted_at === null)
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  }, []);
}

export function usePatterns(): Pattern[] | undefined {
  return useLiveQuery(() => listPatterns(), []);
}

export function usePresets(): Pattern[] | undefined {
  return useLiveQuery(async () => {
    const all = await listPatterns();
    return all.filter((p) => p.is_preset);
  }, []);
}

export function useCheckIn(date: string | undefined): CheckIn | null | undefined {
  return useLiveQuery(async () => {
    if (!date) return null;
    const row = await db.check_ins.where("date").equals(date).first();
    if (!row || row.deleted_at !== null) return null;
    return row;
  }, [date]);
}

export function useWorkoutsByDate(date: string | undefined): Workout[] | undefined {
  return useLiveQuery(async () => {
    if (!date) return [];
    const rows = await db.workouts.where("date").equals(date).toArray();
    return rows
      .filter((r) => r.deleted_at === null)
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  }, [date]);
}

export type DayFlags = {
  hasWorkout: boolean;
  hasCheckIn: boolean;
  isRest: boolean;
};

export function useDateFlags(
  startDate: string | undefined,
  endDate: string | undefined,
): Map<string, DayFlags> | undefined {
  return useLiveQuery(async () => {
    if (!startDate || !endDate) return new Map<string, DayFlags>();

    const workouts = await db.workouts
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
    const checkIns = await db.check_ins
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();

    const map = new Map<string, DayFlags>();

    for (const w of workouts) {
      if (w.deleted_at !== null) continue;
      const f = map.get(w.date) ?? {
        hasWorkout: false,
        hasCheckIn: false,
        isRest: false,
      };
      f.hasWorkout = true;
      map.set(w.date, f);
    }
    for (const c of checkIns) {
      if (c.deleted_at !== null) continue;
      const f = map.get(c.date) ?? {
        hasWorkout: false,
        hasCheckIn: false,
        isRest: false,
      };
      f.hasCheckIn = true;
      if (c.is_rest_day === true) f.isRest = true;
      map.set(c.date, f);
    }

    return map;
  }, [startDate, endDate]);
}

export function useLibrary(): LibraryExercise[] | undefined {
  return useLiveQuery(() => listLibrary(), []);
}

export function useLibraryAlpha(): LibraryExercise[] | undefined {
  return useLiveQuery(() => listLibraryAlpha(), []);
}

export function useLibraryByCategory(): { category: string | null; items: LibraryExercise[] }[] | undefined {
  return useLiveQuery(() => listLibraryByCategory(), []);
}

export function useDailySeries(days: number): Awaited<ReturnType<typeof getDailySeries>> | undefined {
  return useLiveQuery(() => getDailySeries(days), [days]);
}

export function useStats(): Awaited<ReturnType<typeof getStats>> | undefined {
  return useLiveQuery(() => getStats(), []);
}

export function useRegionSeries(days: number) {
  return useLiveQuery(() => getRegionSeries(days), [days]);
}

import type { LastTime } from "./history";
import { getLastTimeFor } from "./history";

export function useLastTime(
  exerciseName: string | undefined,
  currentWorkoutId: string | undefined,
): LastTime | null | undefined {
  return useLiveQuery(async () => {
    if (!exerciseName || !currentWorkoutId) return null;
    return await getLastTimeFor(exerciseName, currentWorkoutId);
  }, [exerciseName, currentWorkoutId]);
}

export function usePreferences(): Preferences | undefined | null {
  const locale = useLocale();

  // Ensure the default row exists. Fires once per mount; idempotent if
  // already there. Lives outside the live query so it can write.
  useEffect(() => {
    void ensurePreferences(locale);
  }, [locale]);

  // Pure read inside the live query. Returns null until the ensure-write
  // lands, then the row. The live query re-runs on Dexie change events,
  // so once ensurePreferences writes, we get the row on next tick.
  return useLiveQuery(async () => {
    return await readPreferences();
  }, []);
}

/**
 * Returns the *active* kind-mode flags for use in components.
 * When master kindMode is on, every flag returns true regardless of its
 * individual value. When master is off, each flag returns its own value.
 *
 * Returns null while prefs are still loading.
 */
export function useKindFlags(): {
  softLanguage: boolean;
  reducedMotion: boolean;
  largerText: boolean;
  hideTotals: boolean;
  hideCounts: boolean;
  wordCheckIn: boolean;
} | null {
  const prefs = usePreferences();
  if (!prefs) return null;
  const master = prefs.kindMode;
  return {
    softLanguage: master || prefs.kindSoftLanguage,
    reducedMotion: master || prefs.kindReducedMotion,
    largerText: master || prefs.kindLargerText,
    hideTotals: master || prefs.kindHideTotals,
    hideCounts: master || prefs.kindHideCounts,
    wordCheckIn: master || prefs.kindWordCheckIn,
  };
}