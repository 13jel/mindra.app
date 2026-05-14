import { db, newRow, softDelete } from "./db";
import type { Exercise, Workout, WorkoutSet } from "./db";
import { nowIso, touch } from "./sync-types";
import type { PainSite } from "./pain-regions";

export function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function createWorkout(input?: {
  date?: string;
  note?: string;
  pattern_id?: string | null;
  pain_pre?: PainSite[];
}): Promise<Workout> {
  const row = newRow<Omit<Workout, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    date: input?.date ?? todayDate(),
    note: input?.note ?? "",
    pattern_id: input?.pattern_id ?? null,
    pain_pre: input?.pain_pre ?? [],
    pain_post: [],
  });
  await db.workouts.add(row);
  return row;
}

export async function copyWorkout(
  source_id: string,
  options?: { date?: string },
): Promise<string> {
  const source = await db.workouts.get(source_id);
  if (!source || source.deleted_at !== null) {
    throw new Error("Source workout not found");
  }

  const newWorkout = await createWorkout({
    date: options?.date ?? todayDate(),
    note: "",
    pattern_id: null,
  });

  const sourceExercises = await db.exercises
    .where("[workout_id+position]")
    .between([source_id, 0], [source_id, Infinity])
    .toArray();
  const aliveExercises = sourceExercises.filter((e) => e.deleted_at === null);

  for (const srcEx of aliveExercises) {
    const newEx = await addExercise(newWorkout.id, srcEx.name);

    const sourceSets = await db.sets
      .where("[exercise_id+position]")
      .between([srcEx.id, 0], [srcEx.id, Infinity])
      .toArray();
    const aliveSets = sourceSets.filter((s) => s.deleted_at === null);

    for (const srcSet of aliveSets) {
      await addSet(newEx.id, {
        reps: srcSet.reps,
        weight_kg: srcSet.weight_kg,
        duration_s: srcSet.duration_s,
        rpe: srcSet.rpe,
      });
    }
  }

  return newWorkout.id;
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  const w = await db.workouts.get(id);
  if (!w || w.deleted_at !== null) return undefined;
  return w;
}

export async function updateWorkoutDate(id: string, date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format");
  }
  const existing = await db.workouts.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.workouts.put(touch({ ...existing, date }));
}

export async function updateWorkoutNote(id: string, note: string): Promise<void> {
  const existing = await db.workouts.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.workouts.put(touch({ ...existing, note }));
}

export async function updateWorkoutPainPre(
  id: string,
  pain_pre: PainSite[],
): Promise<void> {
  const existing = await db.workouts.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.workouts.put(touch({ ...existing, pain_pre }));
}

export async function updateWorkoutPainPost(
  id: string,
  pain_post: PainSite[],
): Promise<void> {
  const existing = await db.workouts.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.workouts.put(touch({ ...existing, pain_post }));
}

export function readPainPre(w: Workout | null | undefined): PainSite[] {
  if (!w) return [];
  return Array.isArray(w.pain_pre) ? w.pain_pre : [];
}
export function readPainPost(w: Workout | null | undefined): PainSite[] {
  if (!w) return [];
  return Array.isArray(w.pain_post) ? w.pain_post : [];
}

export async function deleteWorkout(id: string): Promise<void> {
  await softDelete(db.workouts, id);

  const exercises = await db.exercises.where("workout_id").equals(id).toArray();
  for (const ex of exercises) {
    if (ex.deleted_at !== null) continue;
    await softDelete(db.exercises, ex.id);
    const sets = await db.sets.where("exercise_id").equals(ex.id).toArray();
    for (const s of sets) {
      if (s.deleted_at === null) await softDelete(db.sets, s.id);
    }
  }
}

export async function getWorkoutByDate(date: string): Promise<Workout | undefined> {
  const rows = await db.workouts.where("date").equals(date).toArray();
  return rows.find((r) => r.deleted_at === null);
}

export async function addExercise(
  workout_id: string,
  name: string,
): Promise<Exercise> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Exercise name required");

  const existing = await db.exercises
    .where("[workout_id+position]")
    .between([workout_id, 0], [workout_id, Infinity])
    .toArray();
  const alive = existing.filter((e) => e.deleted_at === null);
  const nextPosition =
    alive.length === 0 ? 1 : Math.max(...alive.map((e) => e.position)) + 1;

  const row = newRow<Omit<Exercise, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    workout_id,
    position: nextPosition,
    name: trimmed,
  });
  await db.exercises.add(row);

  const workout = await db.workouts.get(workout_id);
  if (workout && workout.deleted_at === null) {
    await db.workouts.put(touch(workout));
  }

  return row;
}

export async function renameExercise(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = await db.exercises.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.exercises.put(touch({ ...existing, name: trimmed }));
}

export async function deleteExercise(id: string): Promise<void> {
  const existing = await db.exercises.get(id);
  if (!existing) return;
  await softDelete(db.exercises, id);

  const sets = await db.sets.where("exercise_id").equals(id).toArray();
  for (const s of sets) {
    if (s.deleted_at === null) await softDelete(db.sets, s.id);
  }

  const workout = await db.workouts.get(existing.workout_id);
  if (workout && workout.deleted_at === null) {
    await db.workouts.put(touch(workout));
  }
}

export type SetInput = {
  reps: number | null;
  weight_kg: number | null;
  duration_s: number | null;
  rpe: number | null;
};

export async function addSet(
  exercise_id: string,
  input: SetInput,
): Promise<WorkoutSet> {
  const existing = await db.sets
    .where("[exercise_id+position]")
    .between([exercise_id, 0], [exercise_id, Infinity])
    .toArray();
  const alive = existing.filter((s) => s.deleted_at === null);
  const nextPosition =
    alive.length === 0 ? 1 : Math.max(...alive.map((s) => s.position)) + 1;

  const row = newRow<Omit<WorkoutSet, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    exercise_id,
    position: nextPosition,
    ...input,
  });
  await db.sets.add(row);

  const exercise = await db.exercises.get(exercise_id);
  if (exercise && exercise.deleted_at === null) {
    await db.exercises.put(touch(exercise));
    const workout = await db.workouts.get(exercise.workout_id);
    if (workout && workout.deleted_at === null) {
      await db.workouts.put(touch(workout));
    }
  }

  return row;
}

export async function addSets(
  exercise_id: string,
  count: number,
  input: SetInput,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await addSet(exercise_id, input);
  }
}

export async function updateSet(
  id: string,
  patch: Partial<SetInput>,
): Promise<void> {
  const existing = await db.sets.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.sets.put(touch({ ...existing, ...patch }));
}

export async function deleteSet(id: string): Promise<void> {
  const existing = await db.sets.get(id);
  if (!existing) return;
  await softDelete(db.sets, id);

  const exercise = await db.exercises.get(existing.exercise_id);
  if (exercise && exercise.deleted_at === null) {
    await db.exercises.put(touch(exercise));
    const workout = await db.workouts.get(exercise.workout_id);
    if (workout && workout.deleted_at === null) {
      await db.workouts.put(touch(workout));
    }
  }
}