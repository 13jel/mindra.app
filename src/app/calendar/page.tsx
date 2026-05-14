"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { addMonths, buildMonthGrid, endOfMonth, monthLabel, startOfMonth, weekdayLabels } from "@/lib/calendar-utils";
import { todayDate } from "@/lib/workouts";
import { useDateFlags, usePreferences } from "@/lib/hooks";

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const router = useRouter();

  const today = todayDate();
  const [monthIso, setMonthIso] = useState<string>(startOfMonth(today));

  const prefs = usePreferences();
  const weekStartsOn: 0 | 1 = prefs?.weekStart === "sun" ? 0 : 1;

  const cells = buildMonthGrid(monthIso, weekStartsOn);
  const weekdays = weekdayLabels(locale, weekStartsOn);
  const rangeStart = cells[0].date;
  const rangeEnd = cells[cells.length - 1].date;
  const flags = useDateFlags(rangeStart, rangeEnd);

  const isFutureBlocked = monthIso >= startOfMonth(today);

  const onTap = (date: string) => {
    if (date > today) return;
    router.push(`/today?date=${date}`);
  };

  return (
    <section className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthIso(addMonths(monthIso, -1))}
          aria-label={t("prevMonth")}
          className="rounded-md border border-border bg-bg-elev px-3 py-2 text-sm hover:border-fg-muted"
          data-tap
        >
          ←
        </button>
        <div className="text-sm font-medium capitalize">
          {monthLabel(monthIso, locale)}
        </div>
        <button
          type="button"
          onClick={() => setMonthIso(addMonths(monthIso, 1))}
          disabled={isFutureBlocked}
          aria-label={t("nextMonth")}
          className="rounded-md border border-border bg-bg-elev px-3 py-2 text-sm hover:border-fg-muted disabled:opacity-40 disabled:hover:border-border"
          data-tap
        >
          →
        </button>
      </div>

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-fg-muted">
        {weekdays.map((w, i) => (
          <div key={i} className="py-1 capitalize">{w}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const day = Number(c.date.slice(8, 10));
          const isToday = c.date === today;
          const isFuture = c.date > today;
          const f = flags?.get(c.date);
          const muted = !c.inMonth;

          return (
            <button
              key={c.date}
              type="button"
              onClick={() => onTap(c.date)}
              disabled={isFuture}
              data-tap
              className={[
                "relative aspect-square rounded-md text-sm",
                "flex flex-col items-center justify-center gap-1",
                isToday
                  ? "border-2 border-accent"
                  : "border border-border",
                f?.isRest ? "bg-bg" : "bg-bg-elev",
                isFuture ? "opacity-30 cursor-not-allowed" : "hover:border-fg-muted",
                muted ? "text-fg-muted/60" : "",
              ].join(" ")}
            >
              <span className={isToday ? "font-semibold" : ""}>{day}</span>
              <DotRow flags={f} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2 text-xs text-fg-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span>{t("legendWorkout")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-fg-muted" />
          <span>{t("legendCheckIn")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-border bg-bg" />
          <span>{t("legendRest")}</span>
        </div>
      </div>
    </section>
  );
}

function DotRow({ flags }: { flags: { hasWorkout: boolean; hasCheckIn: boolean } | undefined }) {
  if (!flags || (!flags.hasWorkout && !flags.hasCheckIn)) {
    return <div className="h-1.5" />; // reserve space for layout stability
  }
  return (
    <div className="flex items-center gap-0.5">
      {flags.hasWorkout && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      )}
      {flags.hasCheckIn && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-fg-muted" />
      )}
    </div>
  );
}