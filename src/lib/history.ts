import { db } from "./db";

export type LastTime = {
  date: string;          
  reps: number | null;
  weight_kg: number | null;
  fromMultiple: boolean;
};

export async function getLastTimeFor(
  exerciseName: string,
  currentWorkoutId: string,
): Promise<LastTime | null> {
  const target = exerciseName.trim().toLowerCase();
  if (!target) return null;

  const allExercises = await db.exercises.toArray();
  const matching = allExercises.filter(
    (e) =>
      e.deleted_at === null &&
      e.workout_id !== currentWorkoutId &&
      e.name.trim().toLowerCase() === target,
  );
  if (matching.length === 0) return null;

  const enriched: { exerciseId: string; date: string }[] = [];
  for (const ex of matching) {
    const w = await db.workouts.get(ex.workout_id);
    if (!w || w.deleted_at !== null) continue;
    enriched.push({ exerciseId: ex.id, date: w.date });
  }
  if (enriched.length === 0) return null;

  enriched.sort((a, b) => b.date.localeCompare(a.date));
  const mostRecent = enriched[0];

  const sets = await db.sets
    .where("[exercise_id+position]")
    .between([mostRecent.exerciseId, 0], [mostRecent.exerciseId, Infinity])
    .toArray();
  const aliveSets = sets.filter((s) => s.deleted_at === null);
  if (aliveSets.length === 0) return null;

  const score = (s: { weight_kg: number | null; reps: number | null }) => {
    const w = s.weight_kg ?? -Infinity;
    const r = s.reps ?? -Infinity;
    return w * 1000 + r;
  };
  aliveSets.sort((a, b) => score(b) - score(a));
  const top = aliveSets[0];

  return {
    date: mostRecent.date,
    reps: top.reps,
    weight_kg: top.weight_kg,
    fromMultiple: aliveSets.length > 1,
  };
}