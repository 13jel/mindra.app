"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { copyWorkout, todayDate } from "@/lib/workouts";

type Props = {
  sourceId: string;
  open: boolean;
  onClose: () => void;
};

export function CopyWorkoutDialog({ sourceId, open, onClose }: Props) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [date, setDate] = useState<string>(todayDate());
  const [isCopying, startCopy] = useTransition();

  const onConfirm = () => {
    startCopy(async () => {
      try {
        const newId = await copyWorkout(sourceId, { date });
        toast.success(tCommon("saved"));
        onClose();
        router.push(`/workout/${newId}`);
      } catch {
        toast.error(tCommon("error"));
      }
    });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("copyTitle")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-xl bg-bg border border-border p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("copyTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg"
            aria-label={tCommon("cancel")}
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-sm text-fg-muted">{t("copyBlurb")}</p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setDate(todayDate())}
            className={[
              "w-full rounded-md border px-4 py-3 text-left text-sm",
              date === todayDate()
                ? "border-accent bg-accent/10"
                : "border-border bg-bg-elev",
            ].join(" ")}
            data-tap
          >
            <div className="font-medium">{t("copyToday")}</div>
          </button>

          <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
            <label className="block text-sm font-medium">
              {t("copyPickDate")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded border border-border bg-bg px-2 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-medium"
            data-tap
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCopying || !date}
            className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-50"
            data-tap
          >
            {t("copyConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}