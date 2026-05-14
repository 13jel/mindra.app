"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Suspense } from "react";
import { todayDate } from "@/lib/workouts";
import { formatDate } from "@/lib/format";
import { StartWorkoutFlow } from "@/components/StartWorkoutFlow";
import { TemplatesList } from "@/components/TemplatesList";

function isValidDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayDate();
}

function NewWorkoutInner() {
  const t = useTranslations("workoutNew");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useSearchParams();
  const dateParam = params.get("date");
  const targetDate = isValidDate(dateParam) ? dateParam : todayDate();
  const isToday = targetDate === todayDate();

  return (
    <section className="px-4 pt-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={isToday ? "/today" : `/today?date=${targetDate}`}
          aria-label={tCommon("cancel")}
          className="text-fg-muted hover:text-fg"
        >
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {!isToday && (
        <p className="text-sm text-fg-muted">
          {t("forDate", { date: formatDate(targetDate, locale) })}
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium text-fg-muted">{t("templatesSection")}</h2>
        <TemplatesList targetDate={isToday ? undefined : targetDate} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-fg-muted">{t("blankSection")}</h2>
        <p className="mt-2 text-sm text-fg-muted">{t("blurb")}</p>
        <div className="mt-3">
          <StartWorkoutFlow
            label={t("create")}
            date={isToday ? undefined : targetDate}
          />
        </div>
      </div>
    </section>
  );
}

export default function WorkoutNewPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6 text-fg-muted text-sm">…</div>}>
      <NewWorkoutInner />
    </Suspense>
  );
}