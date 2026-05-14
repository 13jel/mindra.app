"use client";

import { useLocale, useTranslations } from "next-intl";
import { useLastTime } from "@/lib/hooks";
import { formatDateRelative } from "@/lib/format";

export function LastTimeHint({
  exerciseName,
  currentWorkoutId,
}: {
  exerciseName: string;
  currentWorkoutId: string;
}) {
  const t = useTranslations("lastTime");
  const locale = useLocale();
  const last = useLastTime(exerciseName, currentWorkoutId);

  if (!last) return null;

  const parts: string[] = [];
  if (last.reps !== null && last.weight_kg !== null) {
    parts.push(`${last.reps} × ${last.weight_kg}kg`);
  } else if (last.reps !== null) {
    parts.push(`${last.reps} reps`);
  } else if (last.weight_kg !== null) {
    parts.push(`${last.weight_kg}kg`);
  }
  if (parts.length === 0) return null;

  const valueText = parts.join(", ");
  const dateText = formatDateRelative(last.date, locale);

  return (
    <div className="mt-1 text-xs text-fg-muted">
      {t("label", { date: dateText, value: valueText })}
      {last.fromMultiple && <span className="ml-1 opacity-70">({t("topSet")})</span>}
    </div>
  );
}