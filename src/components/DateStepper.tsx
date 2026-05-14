"use client";

import { useLocale, useTranslations } from "next-intl";
import { addDays, formatDateRelative, isSameDate } from "@/lib/format";
import { todayDate } from "@/lib/workouts";

export function DateStepper({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("today");
  const locale = useLocale();
  const today = todayDate();
  const isToday = date === today;
  const isFutureBlocked = date >= today;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        aria-label={t("prevDay")}
        className="rounded-md border border-border bg-bg-elev px-3 py-2 text-sm hover:border-fg-muted"
        data-tap
      >
        ←
      </button>

      <div className="flex-1 text-center">
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            onChange(v > today ? today : v);
          }}
          className="w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm text-center"
        />
        <div className="mt-1 text-xs text-fg-muted">
          {isToday ? t("dayToday") : formatDateRelative(date, locale)}
          {!isToday && isSameDate(addDays(today, -1), new Date(date + "T12:00:00")) && (
            <> · {t("dayYesterday")}</>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={isFutureBlocked}
        aria-label={t("nextDay")}
        className="rounded-md border border-border bg-bg-elev px-3 py-2 text-sm hover:border-fg-muted disabled:opacity-40 disabled:hover:border-border"
        data-tap
      >
        →
      </button>

      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
          data-tap
        >
          {t("dayToday")}
        </button>
      )}
    </div>
  );
}