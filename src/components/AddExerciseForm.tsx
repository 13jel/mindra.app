"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { addExercise } from "@/lib/workouts";
import { useLibrary } from "@/lib/hooks";
import { findOrCreateLibraryExercise, markLibraryUsed } from "@/lib/library";

export function AddExerciseForm({ workoutId }: { workoutId: string }) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const library = useLibrary();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const trimmed = query.trim();
  const filtered = trimmed && library
    ? library.filter((e) =>
        e.name.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : library ?? [];
  const exactMatch = library?.find(
    (e) => e.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  // Up to 8 chips shown; if user types, results shrink to filter matches.
  const chips = (trimmed ? filtered : library ?? []).slice(0, 8);

  const onPickFromLibrary = async (name: string, libraryId: string) => {
    setBusy(true);
    try {
      await addExercise(workoutId, name);
      await markLibraryUsed(libraryId);
      setQuery("");
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const onCreateAndAdd = async () => {
    if (!trimmed) return;
    setBusy(true);
    try {
      const libEntry = await findOrCreateLibraryExercise(trimmed);
      await addExercise(workoutId, trimmed);
      await markLibraryUsed(libEntry.id);
      setQuery("");
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("exercisePlaceholder")}
          className="flex-1 rounded-md border border-border bg-bg-elev px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        {trimmed && !exactMatch && (
          <button
            type="button"
            onClick={onCreateAndAdd}
            disabled={busy}
            data-tap
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
          >
            {t("addExercise")}
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onPickFromLibrary(e.name, e.id)}
              disabled={busy}
              data-tap
              className="rounded-full border border-border bg-bg-elev px-3 py-1.5 text-xs hover:border-accent disabled:opacity-50"
            >
              {e.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}