"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRegionSeries } from "@/lib/hooks";
import type { RegionSeries } from "@/lib/patterns-analytics";

const RANGES = [30, 60, 90] as const;
type Range = (typeof RANGES)[number];

export function RegionCharts() {
  const t = useTranslations("patterns");
  const tRegion = useTranslations("painRegion");
  const tSide = useTranslations("painSide");
  const [range, setRange] = useState<Range>(30);
  const [showInactive, setShowInactive] = useState(false);
  const series = useRegionSeries(range);

  if (series === undefined) {
    return <div className="h-40 rounded-md border border-border bg-bg-elev" />;
  }

  if (series.length === 0) {
    return (
      <div className="rounded-md border border-border bg-bg-elev px-4 py-6 text-center">
        <p className="text-sm text-fg-muted">{t("noRegionsLogged")}</p>
      </div>
    );
  }

  const active = series.filter((s) => s.active);
  const inactive = series.filter((s) => !s.active);
  const visible = showInactive ? series : active;

  if (active.length === 0 && !showInactive) {
    return (
      <div className="rounded-md border border-border bg-bg-elev px-4 py-6 text-center">
        <p className="text-sm text-fg-muted">{t("noActiveRegions")}</p>
        {inactive.length > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive(true)}
            className="mt-3 text-xs text-fg-muted hover:text-fg underline"
          >
            {t("showInactive", { count: inactive.length })}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t("regionsTitle")}</div>
        <div className="inline-flex rounded-md border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={[
                "rounded px-2 py-0.5 text-xs",
                range === r ? "bg-bg text-fg" : "text-fg-muted",
              ].join(" ")}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((s) => (
          <RegionMiniChart
            key={s.key}
            series={s}
            label={
              tRegion(s.region) +
              (s.side !== "center" ? ` (${tSide(s.side)})` : "")
            }
          />
        ))}
      </div>

      {!showInactive && inactive.length > 0 && (
        <button
          type="button"
          onClick={() => setShowInactive(true)}
          className="w-full rounded-md border border-dashed border-border px-3 py-2 text-xs text-fg-muted hover:border-fg-muted"
        >
          + {t("showInactive", { count: inactive.length })}
        </button>
      )}
      {showInactive && inactive.length > 0 && (
        <button
          type="button"
          onClick={() => setShowInactive(false)}
          className="w-full text-xs text-fg-muted hover:text-fg underline"
        >
          {t("hideInactive")}
        </button>
      )}
    </div>
  );
}

function RegionMiniChart({
  series,
  label,
}: {
  series: RegionSeries;
  label: string;
}) {
  const w = 300;
  const h = 80;
  const padding = { top: 10, right: 4, bottom: 14, left: 18 };
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const xFor = (i: number) =>
    padding.left + (i / Math.max(1, series.points.length - 1)) * innerW;
  const yFor = (v: number) => padding.top + (1 - v / 10) * innerH;

  type Segment = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    interpolated: boolean;
  };
  const segments: Segment[] = [];

  let prev: { idx: number; value: number } | null = null;
  for (let i = 0; i < series.points.length; i++) {
    const p = series.points[i];
    if (p.intensity === null) continue;
    if (prev !== null) {
      segments.push({
        x1: xFor(prev.idx),
        y1: yFor(prev.value),
        x2: xFor(i),
        y2: yFor(p.intensity),
        interpolated: i - prev.idx > 1,
      });
    }
    prev = { idx: i, value: p.intensity };
  }

  const loggedPoints = series.points
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.intensity !== null);

  const avg =
    loggedPoints.length > 0
      ? Math.round(
          (loggedPoints.reduce((acc, x) => acc + (x.p.intensity as number), 0) /
            loggedPoints.length) *
            10,
        ) / 10
      : null;

  return (
    <div
      className={[
        "rounded-md border bg-bg-elev px-3 py-2",
        series.active ? "border-border" : "border-border/50 opacity-70",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium">{label}</div>
        {avg !== null && (
          <div className="text-xs text-fg-muted tabular-nums">
            ⌀ {avg}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-1 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        {/* Y baseline at 0 and 10 */}
        {[0, 10].map((y) => (
          <line
            key={y}
            x1={padding.left}
            x2={w - padding.right}
            y1={yFor(y)}
            y2={yFor(y)}
            stroke="var(--border)"
          />
        ))}
        <text
          x={padding.left - 4}
          y={yFor(10) + 3}
          fontSize="8"
          textAnchor="end"
          fill="var(--fg-muted)"
        >
          10
        </text>
        <text
          x={padding.left - 4}
          y={yFor(0) + 3}
          fontSize="8"
          textAnchor="end"
          fill="var(--fg-muted)"
        >
          0
        </text>

        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={seg.interpolated ? "var(--fg-muted)" : "var(--accent)"}
            strokeWidth={seg.interpolated ? 1 : 1.5}
            opacity={seg.interpolated ? 0.6 : 1}
          />
        ))}

        {loggedPoints.map(({ p, i }) => (
          <circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.intensity as number)}
            r={1.8}
            fill="var(--accent)"
          />
        ))}
      </svg>
    </div>
  );
}