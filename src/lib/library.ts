import { db, newRow, softDelete } from "./db";
import type { LibraryExercise } from "./db";
import { nowIso, touch } from "./sync-types";
import { EXERCISE_SEEDS, CATEGORY_ORDER, ExerciseCategory } from "./exercise-data";

export async function seedLibrary(getName: (key: string) => string): Promise<void> {
  const existing = await db.library.toArray();
  const existingNames = new Set(
    existing
      .filter((e) => e.deleted_at === null)
      .map((e) => normalize(e.name)),
  );

  for (const seed of EXERCISE_SEEDS) {
    const name = getName(seed.name_key);
    if (existingNames.has(normalize(name))) continue;

    const row = newRow<Omit<LibraryExercise, "id" | "updated_at" | "synced_at" | "deleted_at">>({
      name,
      is_standard: true,
      category: seed.category,
      last_used: null,
    });
    await db.library.add(row);
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export async function listLibrary(): Promise<LibraryExercise[]> {
  const all = await db.library.toArray();
  const alive = all.filter((e) => e.deleted_at === null);

  const categoryIndex = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));

  return alive.sort((a, b) => {
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 14);
    const recentIso = recentCutoff.toISOString();

    const aRecent = a.last_used !== null && a.last_used >= recentIso;
    const bRecent = b.last_used !== null && b.last_used >= recentIso;

    if (aRecent && !bRecent) return -1;
    if (!aRecent && bRecent) return 1;
    if (aRecent && bRecent) {
      return (b.last_used ?? "").localeCompare(a.last_used ?? "");
    }

    const aCat = a.category ? categoryIndex.get(a.category as ExerciseCategory) ?? 99 : 99;
    const bCat = b.category ? categoryIndex.get(b.category as ExerciseCategory) ?? 99 : 99;
    if (aCat !== bCat) return aCat - bCat;
    return a.name.localeCompare(b.name);
  });
}

export async function findOrCreateLibraryExercise(name: string): Promise<LibraryExercise> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");

  const all = await db.library.toArray();
  const existing = all.find(
    (e) => e.deleted_at === null && normalize(e.name) === normalize(trimmed),
  );
  if (existing) return existing;

  const row = newRow<Omit<LibraryExercise, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    name: trimmed,
    is_standard: false,
    category: null,
    last_used: null,
  });
  await db.library.add(row);
  return row;
}

export async function renameLibraryExercise(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = await db.library.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.library.put(touch({ ...existing, name: trimmed }));
}

export async function deleteLibraryExercise(id: string): Promise<void> {
  await softDelete(db.library, id);
}

export async function markLibraryUsed(id: string): Promise<void> {
  const existing = await db.library.get(id);
  if (!existing || existing.deleted_at !== null) return;
  await db.library.put(touch({ ...existing, last_used: nowIso() }));
}

export async function listLibraryAlpha(): Promise<LibraryExercise[]> {
  const all = await db.library.toArray();
  return all
    .filter((e) => e.deleted_at === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listLibraryByCategory(): Promise<{ category: string | null; items: LibraryExercise[] }[]> {
  const all = await db.library.toArray();
  const alive = all.filter((e) => e.deleted_at === null);

  const buckets = new Map<string | null, LibraryExercise[]>();
  for (const e of alive) {
    const key = e.category ?? null;
    const list = buckets.get(key) ?? [];
    list.push(e);
    buckets.set(key, list);
  }

  const groups: { category: string | null; items: LibraryExercise[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = buckets.get(cat);
    if (items && items.length > 0) {
      groups.push({
        category: cat,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }
  const other = buckets.get(null);
  if (other && other.length > 0) {
    groups.push({
      category: null,
      items: other.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  return groups;
}