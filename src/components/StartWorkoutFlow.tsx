"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createWorkout, todayDate } from "@/lib/workouts";
import { useCheckIn } from "@/lib/hooks";
import { clearRestDayFlag, readPainSites } from "@/lib/checkins";
import type { PainSite } from "@/lib/pain-regions";
import { PainPrePostEditor } from "@/components/PainPrePostEditor";

type Props = {
  label: string;
  className?: string;
  onCreated?: (id: string) => void;
  date?: string;
};

export function StartWorkoutFlow({
  label,
  className,
  onCreated,
  date,
}: Props) {
  const t = useTranslations("startFlow");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const today = useCheckIn(todayDate());
  const dailySites = readPainSites(today);
  const isBackfill = !!date && date !== todayDate();
  const workoutDate = date ?? todayDate();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PainSite[]>([]);
  const [pending, startTransition] = useTransition();

  const navigateAfter = (id: string) => {
    if (onCreated) onCreated(id);
    else router.push(`/workout/${id}`);
  };

  const onClick = () => {
    if (isBackfill || dailySites.length === 0) {
      startTransition(async () => {
        try {
          if (!isBackfill) await clearRestDayFlag(todayDate());
          const w = await createWorkout({ date: workoutDate });
          navigateAfter(w.id);
        } catch {
          toast.error(tCommon("error"));
        }
      });
      return;
    }
    setDraft(dailySites.map((s) => ({ ...s })));
    setOpen(true);
  };

  const onSkip = () => {
    setOpen(false);
    startTransition(async () => {
      try {
        await clearRestDayFlag(todayDate());
        const w = await createWorkout({ date: workoutDate });
        navigateAfter(w.id);
      } catch {
        toast.error(tCommon("error"));
      }
    });
  };

  const onConfirm = () => {
    setOpen(false);
    startTransition(async () => {
      try {
        await clearRestDayFlag(todayDate());
        const w = await createWorkout({ date: workoutDate, pain_pre: draft });
        navigateAfter(w.id);
      } catch {
        toast.error(tCommon("error"));
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        data-tap
        className={
          className ??
          "rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-50"
        }
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("preTitle")}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={onSkip}
        >
          <div
            className="w-full max-w-md rounded-t-xl bg-bg border border-border p-4 sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t("preTitle")}</h2>
              <button
                type="button"
                onClick={onSkip}
                className="text-fg-muted hover:text-fg"
                aria-label={tCommon("cancel")}
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-fg-muted">{t("preBlurb")}</p>

            <div className="mt-4">
              <PainPrePostEditor sites={draft} onChange={setDraft} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-md border border-border px-3 py-2 text-sm"
                data-tap
              >
                {t("skip")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
                data-tap
              >
                {t("startWorkout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}