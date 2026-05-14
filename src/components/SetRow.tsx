"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePreferences } from "@/lib/hooks";
import {
  displayToKg,
  kgToDisplay,
  unitLabel,
} from "@/lib/format-weight";
import { deleteSet, updateSet } from "@/lib/workouts";
import type { WorkoutSet } from "@/lib/db";
import { formatSetSummary } from "@/lib/format";

export function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);

  const prefs = usePreferences();
  const units = prefs?.units ?? "metric";
  const locale = useLocale();

  if (editing) {
    return <SetEditor set={set} onClose={() => setEditing(false)} />;
  }

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("deleteSetConfirm"))) return;
    try {
      await deleteSet(set.id);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const summary = formatSetSummary(set, units, locale);

  return (
    <li>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-bg"
        data-tap
      >
        <div className="flex items-baseline gap-3">
          <span className="text-fg-muted text-xs w-6 shrink-0">#{index}</span>
          <span className="text-sm">{summary || "—"}</span>
        </div>
        <span
          role="button"
          aria-label={tCommon("delete")}
          onClick={onDelete}
          className="text-fg-muted hover:text-danger px-2 text-sm"
        >
          ×
        </span>
      </button>
    </li>
  );
}

function SetEditor({
  set,
  onClose,
}: {
  set: WorkoutSet;
  onClose: () => void;
}) {
  const tCommon = useTranslations("common");
  const t = useTranslations("workoutDetail");

  const prefs = usePreferences();
  const units = prefs?.units ?? "metric";

  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [weight, setWeight] = useState(
    set.weight_kg !== null && set.weight_kg !== undefined
      ? String(kgToDisplay(set.weight_kg, units))
      : "",
  );
  const [duration, setDuration] = useState(set.duration_s?.toString() ?? "");
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");

  const onSave = async () => {
    try {
      await updateSet(set.id, {
        reps: reps === "" ? null : Number(reps),
        weight_kg:
          weight === "" ? null : displayToKg(Number(weight), units),
        duration_s: duration === "" ? null : Number(duration),
        rpe: rpe === "" ? null : Number(rpe),
      });
      onClose();
    } catch {
      toast.error(tCommon("error"));
    }
  };

  return (
    <li className="rounded border border-border bg-bg p-2">
      <div className="grid grid-cols-2 gap-2">
        <NumField value={reps} onChange={setReps} placeholder={t("reps")} />
        <NumField
          value={weight}
          onChange={setWeight}
          placeholder={unitLabel(units)}
          step="0.5"
        />
        <NumField value={duration} onChange={setDuration} placeholder={t("duration")} />
        <NumField value={rpe} onChange={setRpe} placeholder={t("rpe")} step="0.5" min="0" max="10" />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1 text-sm text-fg-muted hover:text-fg"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded bg-accent px-3 py-1 text-sm font-medium text-accent-fg"
        >
          {tCommon("save")}
        </button>
      </div>
    </li>
  );
}

function NumField({
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      className="w-full rounded border border-border bg-bg-elev px-2 py-1 text-sm"
    />
  );
}