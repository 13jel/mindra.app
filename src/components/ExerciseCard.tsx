"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteExercise, renameExercise } from "@/lib/workouts";
import type { Exercise } from "@/lib/db";
import { useExerciseSets } from "@/lib/hooks";
import { SetRow } from "@/components/SetRow";
import { AddSetForm } from "@/components/AddSetForm";
import { LastTimeHint } from "@/components/LastTimeHint";

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const sets = useExerciseSets(exercise.id);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(exercise.name);

  const onRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === exercise.name) {
      setEditing(false);
      setNameDraft(exercise.name);
      return;
    }
    try {
      await renameExercise(exercise.id, trimmed);
      setEditing(false);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const onDelete = async () => {
    if (!confirm(t("deleteExerciseConfirm"))) return;
    try {
      await deleteExercise(exercise.id);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  return (
    <div className="rounded-md border border-border bg-bg-elev p-3">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename();
              if (e.key === "Escape") {
                setNameDraft(exercise.name);
                setEditing(false);
              }
            }}
            autoFocus
            className="flex-1 rounded border border-border bg-bg px-2 py-1 text-base font-medium"
          />
        ) : (
          <div className="flex-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-left text-base font-medium hover:text-accent"
            >
              {exercise.name}
            </button>
            <LastTimeHint
              exerciseName={exercise.name}
              currentWorkoutId={exercise.workout_id}
            />
          </div>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={tCommon("delete")}
          className="text-fg-muted hover:text-danger px-2"
        >
          ×
        </button>
      </div>

      {sets === undefined ? (
        <div className="mt-2 text-fg-muted text-sm">…</div>
      ) : sets.length === 0 ? (
        <p className="mt-2 text-fg-muted text-sm">{t("noSetsForExercise")}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {sets.map((s, i) => (
            <SetRow key={s.id} set={s} index={i + 1} />
          ))}
        </ul>
      )}

      <div className="mt-3">
        <AddSetForm exerciseId={exercise.id} />
      </div>
    </div>
  );
}