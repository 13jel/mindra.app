import { db, type Preferences, type Units, type WeekStart } from "./db";

const PREF_ID = "default" as const;

/**
 * Locale-derived defaults for first-run users who never visit settings.
 */
function deriveDefaults(locale: string): {
  weekStart: WeekStart;
  units: Units;
} {
  const isSwedish = locale.startsWith("sv");
  return {
    weekStart: isSwedish ? "mon" : "sun",
    units: "metric",
  };
}

/**
 * Pure read. Returns the row or null. Safe to call inside useLiveQuery
 * (no writes). Backfills fields for rows written before they existed,
 * so existing users don't see undefined when fields were added in a
 * later schema version.
 */
export async function readPreferences(): Promise<Preferences | null> {
  const row = await db.preferences.get(PREF_ID);
  if (!row || row.deleted_at !== null) return null;
  return {
    ...row,
    display_name: row.display_name ?? "",
    rest_default_s: row.rest_default_s ?? 90,
    kindMode: row.kindMode ?? false,
    kindSoftLanguage: row.kindSoftLanguage ?? false,
    kindReducedMotion: row.kindReducedMotion ?? false,
    kindLargerText: row.kindLargerText ?? false,
    kindHideTotals: row.kindHideTotals ?? false,
    kindHideCounts: row.kindHideCounts ?? false,
    kindWordCheckIn: row.kindWordCheckIn ?? false,
  };
}

/**
 * Ensure the default preferences row exists. Idempotent — safe to call
 * multiple times. Must NOT be called from inside useLiveQuery (it writes).
 */
export async function ensurePreferences(locale: string): Promise<Preferences> {
  const existing = await readPreferences();
  if (existing) return existing;

  const defaults = deriveDefaults(locale);
  const now = new Date().toISOString();
  const row: Preferences = {
    id: PREF_ID,
    display_name: "",
    rest_default_s: 90,
    weekStart: defaults.weekStart,
    units: defaults.units,
    kindMode: false,
    kindSoftLanguage: false,
    kindReducedMotion: false,
    kindLargerText: false,
    kindHideTotals: false,
    kindHideCounts: false,
    kindWordCheckIn: false,
    updated_at: now,
    synced_at: null,
    deleted_at: null,
  };
  await db.preferences.put(row);
  return row;
}

export async function updatePreferences(
  patch: Partial<
    Pick<
      Preferences,
      | "display_name"
      | "rest_default_s"
      | "weekStart"
      | "units"
      | "kindMode"
      | "kindSoftLanguage"
      | "kindReducedMotion"
      | "kindLargerText"
      | "kindHideTotals"
      | "kindHideCounts"
      | "kindWordCheckIn"
    >
  >,
): Promise<void> {
  const existing = await db.preferences.get(PREF_ID);
  const now = new Date().toISOString();
  if (!existing) {
    await db.preferences.put({
      id: PREF_ID,
      display_name: patch.display_name ?? "",
      rest_default_s: patch.rest_default_s ?? 90,
      weekStart: patch.weekStart ?? "mon",
      units: patch.units ?? "metric",
      kindMode: patch.kindMode ?? false,
      kindSoftLanguage: patch.kindSoftLanguage ?? false,
      kindReducedMotion: patch.kindReducedMotion ?? false,
      kindLargerText: patch.kindLargerText ?? false,
      kindHideTotals: patch.kindHideTotals ?? false,
      kindHideCounts: patch.kindHideCounts ?? false,
      kindWordCheckIn: patch.kindWordCheckIn ?? false,
      updated_at: now,
      synced_at: null,
      deleted_at: null,
    });
    return;
  }
  await db.preferences.put({
    ...existing,
    ...patch,
    updated_at: now,
    synced_at: null,
  });
}