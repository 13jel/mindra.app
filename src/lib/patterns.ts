import { db, newRow } from "./db";
import type { Pattern } from "./db";
import { addExercise, addSet, createWorkout, todayDate } from "./workouts";
import { clearRestDayFlag } from "./checkins";
import { PRESETS, type PresetBody } from "./preset-data";

export async function seedPresets(): Promise<void> {
  const all = await db.patterns.toArray();

  const aliveSlugs = new Set(
    all
      .filter((p) => p.is_preset && p.deleted_at === null)
      .map((p) => (p.body as { slug?: string })?.slug)
      .filter((s): s is string => typeof s === "string"),
  );

  const tombstonedSlugs = new Set(
    all
      .filter((p) => p.is_preset && p.deleted_at !== null)
      .map((p) => (p.body as { slug?: string })?.slug)
      .filter((s): s is string => typeof s === "string"),
  );

  for (const seed of PRESETS) {
    if (aliveSlugs.has(seed.slug)) continue;
    if (tombstonedSlugs.has(seed.slug)) continue;
    const row = newRow<Omit<Pattern, "id" | "updated_at" | "synced_at" | "deleted_at">>({
      name: seed.name_key,
      is_preset: true,
      body: { slug: seed.slug, ...seed.body },
    });
    await db.patterns.add(row);
  }
}

export async function listPatterns(): Promise<Pattern[]> {
  const all = await db.patterns.toArray();
  const alive = all.filter((p) => p.deleted_at === null);

  const presetOrder = new Map(PRESETS.map((p, i) => [p.slug, i]));
  return alive.sort((a, b) => {
    if (a.is_preset && !b.is_preset) return -1;
    if (!a.is_preset && b.is_preset) return 1;
    if (a.is_preset && b.is_preset) {
      const aSlug = (a.body as { slug?: string })?.slug ?? "";
      const bSlug = (b.body as { slug?: string })?.slug ?? "";
      return (presetOrder.get(aSlug) ?? 99) - (presetOrder.get(bSlug) ?? 99);
    }
    return a.name.localeCompare(b.name);
  });
}

export async function applyPattern(
  pattern_id: string,
  options?: { date?: string },
): Promise<string> {  const pattern = await db.patterns.get(pattern_id);
  if (!pattern || pattern.deleted_at !== null) {
    throw new Error("Pattern not found");
  }
  const body = pattern.body as PresetBody & { slug?: string };
  if (!body || !Array.isArray(body.exercises)) {
    throw new Error("Pattern body invalid");
  }

  const today = todayDate();
  const dailyCheckIn = await db.check_ins.where("date").equals(today).first();
  const pain_pre =
    dailyCheckIn && dailyCheckIn.deleted_at === null && Array.isArray(dailyCheckIn.pain_sites)
      ? dailyCheckIn.pain_sites.map((s) => ({ ...s }))
      : [];

const targetDate = options?.date ?? today;
  const isBackfill = targetDate !== today;
  if (!isBackfill) await clearRestDayFlag(today);
  const workout = await createWorkout({
    date: targetDate,
    pattern_id,
    pain_pre: isBackfill ? [] : pain_pre,
  });
    for (const ex of body.exercises) {
    const exercise = await addExercise(workout.id, ex.exercise);
    for (let i = 0; i < ex.sets; i++) {
      await addSet(exercise.id, {
        reps: ex.default_reps,
        weight_kg: null,
        duration_s: null,
        rpe: null,
      });
    }
  }
  return workout.id;
}

export async function saveWorkoutAsTemplate(
  workout_id: string,
  name: string,
): Promise<Pattern> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Template name required");

  const workout = await db.workouts.get(workout_id);
  if (!workout || workout.deleted_at !== null) {
    throw new Error("Workout not found");
  }

  const exercises = await db.exercises
    .where("[workout_id+position]")
    .between([workout_id, 0], [workout_id, Infinity])
    .toArray();
  const aliveExercises = exercises
    .filter((e) => e.deleted_at === null)
    .sort((a, b) => a.position - b.position);

  if (aliveExercises.length === 0) {
    throw new Error("Workout has no exercises to template");
  }

  const bodyExercises: { exercise: string; sets: number; default_reps: number | null }[] = [];

  for (const ex of aliveExercises) {
    const sets = await db.sets
      .where("[exercise_id+position]")
      .between([ex.id, 0], [ex.id, Infinity])
      .toArray();
    const aliveSets = sets.filter((s) => s.deleted_at === null);

    const repsValues = aliveSets
      .map((s) => s.reps)
      .filter((r): r is number => r !== null);

    bodyExercises.push({
      exercise: ex.name,
      sets: aliveSets.length === 0 ? 1 : aliveSets.length,
      default_reps: repsValues.length === 0 ? null : median(repsValues),
    });
  }

  const row = newRow<Omit<Pattern, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    name: trimmed,
    is_preset: false,
    body: { exercises: bodyExercises },
  });
  await db.patterns.add(row);
  return row;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

export async function renameTemplate(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = await db.patterns.get(id);
  if (!existing || existing.deleted_at !== null) return;
  if (existing.is_preset) return; 
  await db.patterns.put({
    ...existing,
    name: trimmed,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const existing = await db.patterns.get(id);
  if (!existing || existing.deleted_at !== null) return;
  const now = new Date().toISOString();
  await db.patterns.put({
    ...existing,
    deleted_at: now,
    updated_at: now,
  });
}