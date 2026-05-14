"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveWorkoutAsTemplate } from "@/lib/patterns";

type Props = {
  sourceId: string;
  defaultName: string;
  open: boolean;
  onClose: () => void;
};

export function SaveAsTemplateDialog({
  sourceId,
  defaultName,
  open,
  onClose,
}: Props) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(defaultName);
  const [busy, startSave] = useTransition();

  const onConfirm = () => {
    if (!name.trim()) return;
    startSave(async () => {
      try {
        await saveWorkoutAsTemplate(sourceId, name);
        toast.success(tCommon("saved"));
        onClose();
      } catch (err) {
        console.error("[mindra] save as template failed", err);
        toast.error(tCommon("error"));
      }
    });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("saveAsTemplate")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-xl bg-bg border border-border p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("saveAsTemplate")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg"
            aria-label={tCommon("cancel")}
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-sm text-fg-muted">{t("saveAsTemplateBlurb")}</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="mt-4 w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm"
            data-tap
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !name.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
            data-tap
          >
            {tCommon("save")}
          </button>
        </div>
      </div>
    </div>
  );
}