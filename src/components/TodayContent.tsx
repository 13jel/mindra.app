"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useCheckIn,
  useKindFlags,
  useWorkoutAllSets,
  useWorkoutsByDate,
  usePreferences,
} from "@/lib/hooks";
import { readIsRestDay, readRestReason } from "@/lib/checkins";
import { todayDate } from "@/lib/workouts";
import type { Workout } from "@/lib/db";

export function TodayContent({ date }: { date: string }) {
  const t = useTranslations("today");
  const tRest = useTranslations("restDay");
  const workouts = useWorkoutsByDate(date);
  const checkIn = useCheckIn(date);
  const prefs = usePreferences();
  const flags = useKindFlags();
  const kindMasterOn = prefs?.kindMode ?? false;
  const hideCounts = flags?.hideCounts ?? false;
  const isRest = readIsRestDay(checkIn);
  const restReason = readRestReason(checkIn);
  const isToday = date === todayDate();

  const newHref = isToday ? "/workout/new" : `/workout/new?date=${date}`;

  if (workouts === undefined) {
    return <div className="mt-6 text-fg-muted text-sm">…</div>;
  }

  if (isRest && workouts.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-border bg-bg-elev px-4 py-6 text-center">
        <div className="text-sm font-medium">
          {isToday ? tRest("dayBadge") : tRest("badge")}
        </div>
        {restReason && (
          <div className="mt-1 text-xs text-fg-muted">
            {tRest(`reason.${restReason}`)}
          </div>
        )}
        {isToday && (
          <div className="mt-4">
            <Link
              href={newHref}
              className="inline-block rounded-md border border-border px-4 py-2 text-sm hover:border-fg-muted"
              data-tap
            >
              {tRest("trainAnyway")}
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-fg-muted">
          {isToday ? t("empty") : t("emptyOther")}
        </p>
        <div className="mt-4">
          {kindMasterOn ? (
            <Link
              href={newHref}
              className="inline-block rounded-md border border-border px-4 py-2 text-sm text-fg-muted hover:text-fg hover:border-fg-muted"
              data-tap
            >
              {tRest("trainAnyway")}
            </Link>
          ) : (
            <Link
              href={newHref}
              className="inline-block rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
              data-tap
            >
              {isToday ? t("start") : t("backfill")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {workouts.map((w, i) => (
        <DayCard
          key={w.id}
          workout={w}
          label={
            workouts.length === 1
              ? isToday
                ? t("inProgress")
                : t("workoutSingular")
              : t("sessionN", { n: i + 1 })
          }
          hideCounts={hideCounts}
        />
      ))}
      <Link
        href={newHref}
        className="block w-full text-center rounded-md border border-dashed border-border px-4 py-3 text-sm text-fg-muted hover:border-fg-muted hover:text-fg"
        data-tap
      >
        {isToday ? t("startAnother") : t("backfillAnother")}
      </Link>
    </div>
  );
}

function DayCard({
  workout,
  label,
  hideCounts,
}: {
  workout: Workout;
  label: string;
  hideCounts: boolean;
}) {
  return (
    <Link
      href={`/workout/${workout.id}?from=${workout.date}`}
      className="block rounded-md border border-border bg-bg-elev px-4 py-4 hover:border-fg-muted"
      data-tap
    >
      <div className="font-medium">{label}</div>
      {workout.note && (
        <div className="mt-1 text-sm text-fg-muted line-clamp-2">
          {workout.note}
        </div>
      )}
      {!hideCounts && (
        <div className="mt-3 text-sm text-fg-muted">
          <CardSummary workoutId={workout.id} />
        </div>
      )}
    </Link>
  );
}

function CardSummary({ workoutId }: { workoutId: string }) {
  const t = useTranslations("today");
  const groups = useWorkoutAllSets(workoutId);
  if (groups === undefined) return <>…</>;
  const exerciseCount = groups.length;
  const setCount = groups.reduce((acc, g) => acc + g.sets.length, 0);
  if (exerciseCount === 0) return <>{t("noSetsYet")}</>;
  return <>{t("summary", { exercises: exerciseCount, sets: setCount })}</>;
}