"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDailySeries } from "@/lib/hooks";

const RANGES = [30, 60, 90] as const;
type Range = (typeof RANGES)[number];

export function PainLineChart() {
  const t = useTranslations("patterns");
  const [range, setRange] = useState<Range>(30);
  const series = useDailySeries(range);

  if (series === undefined) {
    return <div className="h-40 rounded-md border border-border bg-bg-elev" />;
  }

  const withPain = series.filter((p) => p.pain !== null);
  if (withPain.length < 3) {
    return (
      <div className="rounded-md border border-border bg-bg-elev px-4 py-6 text-center">
        <p className="text-sm text-fg-muted">{t("needMoreData")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-elev p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t("chartTitle")}</div>
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

      <ChartSvg series={series} />
    </div>
  );
}

function ChartSvg({
  series,
}: {
  series: { date: string; pain: number | null }[];
}) {
  // Layout
  const w = 600;
  const h = 140;
  const padding = { top: 12, right: 8, bottom: 18, left: 24 };
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const xFor = (i: number) =>
    padding.left + (i / Math.max(1, series.length - 1)) * innerW;
  const yFor = (pain: number) =>
    padding.top + (1 - pain / 10) * innerH;

  type Segment = { x1: number; y1: number; x2: number; y2: number; interpolated: boolean };
  const segments: Segment[] = [];

  let prev: { idx: number; pain: number } | null = null;
  for (let i = 0; i < series.length; i++) {
    const p = series[i];
    if (p.pain === null) continue;
    if (prev !== null) {
      segments.push({
        x1: xFor(prev.idx),
        y1: yFor(prev.pain),
        x2: xFor(i),
        y2: yFor(p.pain),
        interpolated: i - prev.idx > 1,
      });
    }
    prev = { idx: i, pain: p.pain };
  }

  const yTicks = [0, 5, 10];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Pain trend"
    >
      {/* Y gridlines */}
      {yTicks.map((y) => (
        <g key={y}>
          <line
            x1={padding.left}
            x2={w - padding.right}
            y1={yFor(y)}
            y2={yFor(y)}
            stroke="var(--border)"
            strokeDasharray={y === 5 ? "2 4" : undefined}
          />
          <text
            x={padding.left - 6}
            y={yFor(y) + 4}
            fontSize="10"
            textAnchor="end"
            fill="var(--fg-muted)"
          >
            {y}
          </text>
        </g>
      ))}

      {/* Line segments */}
      {segments.map((seg, i) => (
        <line
          key={i}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke={seg.interpolated ? "var(--fg-muted)" : "var(--accent)"}
          strokeWidth={seg.interpolated ? 1.5 : 2}
          opacity={seg.interpolated ? 0.6 : 1}
        />
      ))}

      {/* Dots — only on real logged days */}
      {series.map((p, i) =>
        p.pain === null ? null : (
          <circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.pain)}
            r={2.5}
            fill="var(--accent)"
          />
        ),
      )}
    </svg>
  );
}