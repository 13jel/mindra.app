"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteWorkout, readPainPost, readPainPre, updateWorkoutDate, updateWorkoutNote } from "@/lib/workouts";
import { useWorkout, useWorkoutAllSets, useWorkoutExercises } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { ExerciseCard } from "@/components/ExerciseCard";
import { AddExerciseForm } from "@/components/AddExerciseForm";
import { ShareDialog } from "@/components/ShareDialog";
import { CopyWorkoutDialog } from "@/components/CopyWorkoutDialog";
import { PostWorkoutPainCard } from "@/components/PostWorkoutPainCard";
import { PainComparisonView } from "@/components/PainComparisonView";
import { SaveAsTemplateDialog } from "@/components/SaveAsTemplateDialog";

export function WorkoutDetail({ id }: { id: string }) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const tShare = useTranslations("share");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from");

  const workout = useWorkout(id);
  const exercises = useWorkoutExercises(id);
  const allSets = useWorkoutAllSets(id);

  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  if (workout === undefined) {
    return <div className="mt-6 text-fg-muted text-sm">…</div>;
  }
  if (workout === null) {
    return <p className="mt-6 text-fg-muted">{t("notFound")}</p>;
  }

  const note = noteDraft ?? workout.note;
  const prePain = readPainPre(workout);
  const postPain = readPainPost(workout);
  const totalSets = (allSets ?? []).reduce((acc, e) => acc + e.sets.length, 0);
  const canShare = totalSets > 0;
  const showPostPrompt =
    prePain.length > 0 && postPain.length === 0 && totalSets > 0;
  const showComparison = prePain.length > 0 && postPain.length > 0;

  const onNoteBlur = async () => {
    if (noteDraft === null) return;
    if (noteDraft === workout.note) {
      setNoteDraft(null);
      return;
    }
    try {
      await updateWorkoutNote(id, noteDraft);
      setNoteDraft(null);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const onDelete = () => {
    if (!confirm(t("deleteConfirm"))) return;
    startDelete(async () => {
      try {
        await deleteWorkout(id);
        if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
          router.push(`/today?date=${from}`);
        } else {
          router.back();
        }
      } catch {
        toast.error(tCommon("error"));
      }
    });
  };

  return (
    <>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <DateField workout={workout} locale={locale} />
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={!canShare}
            className="text-sm text-fg-muted hover:text-fg disabled:opacity-40"
          >
            {tShare("button")}
          </button>
          <button
            type="button"
            onClick={() => setSaveTemplateOpen(true)}
            disabled={(exercises?.length ?? 0) === 0}
            className="text-sm text-fg-muted hover:text-fg disabled:opacity-40"
          >
            {t("templateAction")}
          </button>
          <button
            type="button"
            onClick={() => setCopyOpen(true)}
            className="text-sm text-fg-muted hover:text-fg"
          >
            {t("copy")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-sm text-fg-muted hover:text-danger disabled:opacity-50"
          >
            {tCommon("delete")}
          </button>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNoteDraft(e.target.value)}
        onBlur={onNoteBlur}
        placeholder={t("notePlaceholder")}
        rows={2}
        className="mt-4 w-full resize-none rounded-md border border-border bg-bg-elev px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />

      {showPostPrompt && (
        <div className="mt-4">
          <PostWorkoutPainCard workoutId={id} prePain={prePain} />
        </div>
      )}

      {showComparison && (
        <div className="mt-4">
          <PainComparisonView pre={prePain} post={postPain} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-fg-muted">{t("exercises")}</h2>
        {exercises === undefined ? (
          <div className="mt-2 text-fg-muted text-sm">…</div>
        ) : exercises.length === 0 ? (
          <p className="mt-2 text-fg-muted text-sm">{t("noExercises")}</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {exercises.map((ex) => (
              <li key={ex.id}>
                <ExerciseCard exercise={ex} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <AddExerciseForm workoutId={id} />
      </div>

      <ShareDialog
        workout={workout}
        groups={allSets ?? []}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <CopyWorkoutDialog
        sourceId={id}
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
      />

      <SaveAsTemplateDialog
        sourceId={id}
        defaultName={formatDate(workout.date, locale)}
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
      />
    </>
  );
}

function DateField({
  workout,
  locale,
}: {
  workout: { id: string; date: string };
  locale: string;
}) {
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(workout.date);

  const onSave = async () => {
    if (draft === workout.date) {
      setEditing(false);
      return;
    }
    try {
      await updateWorkoutDate(workout.id, draft);
      setEditing(false);
    } catch {
      toast.error(tCommon("error"));
      setDraft(workout.date);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") {
            setDraft(workout.date);
            setEditing(false);
          }
        }}
        autoFocus
        className="rounded border border-border bg-bg-elev px-2 py-1 text-2xl font-semibold tracking-tight"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-left text-2xl font-semibold tracking-tight hover:text-accent"
    >
      {formatDate(workout.date, locale)}
    </button>
  );
}