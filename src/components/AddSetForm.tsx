//AddSetForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePreferences } from "@/lib/hooks";
import { displayToKg, unitLabel } from "@/lib/format-weight";
import { addSet, addSets } from "@/lib/workouts";

export function AddSetForm({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("workoutDetail");
  const tCommon = useTranslations("common");
  const prefs = usePreferences();
  const units = prefs?.units ?? "metric";
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setReps("");
    setWeight("");
    setDuration("");
    setRpe("");
    setCount("1");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const n = Math.max(1, Math.min(20, Number(count) || 1));
      const input = {
        reps: reps === "" ? null : Number(reps),
        weight_kg: weight === "" ? null : displayToKg(Number(weight), units),
        duration_s: duration === "" ? null : Number(duration),
        rpe: rpe === "" ? null : Number(rpe),
      };
      if (n === 1) {
        await addSet(exerciseId, input);
      } else {
        await addSets(exerciseId, n, input);
      }
      reset();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded border border-border bg-bg p-2">
      <div className="grid grid-cols-2 gap-2">
        <NumField value={reps} onChange={setReps} placeholder={t("reps")} />
        <NumField value={weight} onChange={setWeight} placeholder={unitLabel(units)} step="0.5"/>
        <NumField value={duration} onChange={setDuration} placeholder={t("duration")} />
        <NumField value={rpe} onChange={setRpe} placeholder={t("rpe")} step="0.5" min="0" max="10" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          {t("addNTimes")}
          <input
            type="number"
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min="1"
            max="20"
            className="w-12 rounded border border-border bg-bg-elev px-2 py-1 text-sm"
          />
        </label>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={busy}
          data-tap
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {t("addSet")}
        </button>
      </div>
    </form>
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
      className="w-full rounded border border-border bg-bg-elev px-2 py-1.5 text-sm"
    />
  );
}