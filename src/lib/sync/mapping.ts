import type { Workout, Exercise, WorkoutSet, LibraryExercise, Pattern, CheckIn, Preferences } from "@/lib/db";

/**
 * Convert a local Dexie row to a cloud-shape row for push.
 * The `user_id` field is added by the worker (it's the auth uid, not
 * carried by Dexie rows).
 */
export function toCloud(
  table: string,
  row: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  if (table === "preferences") {
  const p = row as unknown as Partial<Preferences>;
  return {
    id: userId,
    display_name: p.display_name ?? "",
    rest_default_s: p.rest_default_s ?? 90,
    week_start: p.weekStart ?? "mon",
    units: p.units ?? "metric",
    kind_mode: p.kindMode ?? false,
    kind_soft_language: p.kindSoftLanguage ?? false,
    kind_reduced_motion: p.kindReducedMotion ?? false,
    kind_larger_text: p.kindLargerText ?? false,
    kind_hide_totals: p.kindHideTotals ?? false,
    kind_hide_counts: p.kindHideCounts ?? false,
    kind_word_check_in: p.kindWordCheckIn ?? false,
    updated_at: p.updated_at,
    synced_at: p.synced_at ?? null,
    deleted_at: p.deleted_at ?? null,
  };
}

  // For all other tables, the local and cloud shapes match — just add user_id.
  return {
    ...row,
    user_id: userId,
  };
}