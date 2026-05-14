"use client";

import { useTranslations } from "next-intl";
import { useStats } from "@/lib/hooks";

export function StatsRow() {
  const t = useTranslations("patterns");
  const stats = useStats();

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-md border border-border bg-bg-elev"
          />
        ))}
      </div>
    );
  }

  const trend =
    stats.avgPainLast7 !== null && stats.avgPainPrev7 !== null
      ? Math.round((stats.avgPainLast7 - stats.avgPainPrev7) * 10) / 10
      : null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Card label={t("avgPain7")} value={stats.avgPainLast7 !== null ? stats.avgPainLast7.toString() : "—"}>
        {trend !== null && (
          <span
            className={[
              "text-xs",
              trend < 0
                ? "text-success"
                : trend > 0
                  ? "text-danger"
                  : "text-fg-muted",
            ].join(" ")}
          >
            {trend > 0 ? `+${trend}` : trend === 0 ? "±0" : trend}
          </span>
        )}
      </Card>
      <Card label={t("workouts7")} value={stats.workoutsLast7.toString()} />
      <Card label={t("rest7")} value={stats.restLast7.toString()} />
    </div>
  );
}

function Card({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-bg-elev px-3 py-3">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {children}
    </div>
  );
}