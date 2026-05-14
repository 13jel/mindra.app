"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDailySeries } from "@/lib/hooks";

export function PainStrip({ days = 30 }: { days?: number }) {
  const t = useTranslations("patterns");
  const locale = useLocale();
  const router = useRouter();
  const series = useDailySeries(days);

  if (series === undefined) {
    return <div className="h-12 rounded-md border border-border bg-bg-elev" />;
  }

  return (
    <div>
      <div className="flex h-12 gap-0.5">
        {series.map((p) => {
          const intensity = p.pain ?? 0;
          const bg =
            p.pain === null
              ? "var(--bg)"
              : `color-mix(in oklch, var(--danger) ${
                  10 + intensity * 7
                }%, var(--bg-elev))`;
          return (
            <button
              key={p.date}
              type="button"
              onClick={() => router.push(`/today?date=${p.date}`)}
              aria-label={t("cellLabel", {
                date: new Date(p.date + "T12:00:00").toLocaleDateString(locale),
                pain: p.pain ?? 0,
              })}
              className={[
                "flex-1 rounded-sm border transition-colors",
                p.isRest ? "border-fg-muted" : "border-border",
              ].join(" ")}
              style={{ background: bg }}
            >
              {p.hasWorkout && (
                <span
                  className="block mx-auto mt-1 h-1 w-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-fg-muted">
        <span>
          {new Date(series[0].date + "T12:00:00").toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>{t("today")}</span>
      </div>
    </div>
  );
}