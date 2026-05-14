"use client";

import { forwardRef } from "react";
import type { Exercise, Units, Workout, WorkoutSet } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  formatWeight,
  kgToDisplay,
  unitLabel,
} from "@/lib/format-weight";

type Group = { exercise: Exercise; sets: WorkoutSet[] };
export type HeadlineMode = "date" | "quote" | "both";

type Props = {
  workout: Workout;
  groups: Group[];
  locale: string;
  units: Units;
  includeNote?: boolean;
  headlineMode: HeadlineMode;
  quote: string | null;
  hideTotals?: boolean;
  hideCounts?: boolean;
};

export const ShareCard = forwardRef<HTMLDivElement, Props>(
  function ShareCard(
  {
    workout,
    groups,
    locale,
    units,
    includeNote = false,
    headlineMode,
    quote,
    hideTotals = false,
    hideCounts = false,
  },
  ref,
) {
    const totalVolume = computeVolume(groups);
    const showNote = includeNote && workout.note.trim().length > 0;
    const n = groups.length;

    const dateHeadlineSize =
      n <= 4 ? 72 : n <= 6 ? 64 : n <= 9 ? 56 : n <= 12 ? 48 : 44;
    const quoteHeadlineSize =
      n <= 4 ? 56 : n <= 6 ? 50 : n <= 9 ? 44 : n <= 12 ? 38 : 34;
    const bothDateSize =
      n <= 4 ? 60 : n <= 6 ? 54 : n <= 9 ? 48 : n <= 12 ? 42 : 38;
    const bothQuoteSize =
      n <= 4 ? 32 : n <= 6 ? 28 : n <= 9 ? 26 : n <= 12 ? 22 : 20;

    const headlineRendered =
      headlineMode === "date"
        ? dateHeadlineSize
        : headlineMode === "quote"
          ? Math.ceil(quoteHeadlineSize * 1.8)
          : bothDateSize + 16 + Math.ceil(bothQuoteSize * 1.8);
    const volumeHeight = totalVolume !== null && !hideTotals ? (n <= 9 ? 42 : 36) : 0;    const noteHeight = showNote ? 140 : 0;
    const headerHeight = headlineRendered + 8 + volumeHeight + noteHeight;

    const footerHeight = 72;
    const gridGap = 48 * 2;
    const cardInner = 1080 - 80 - 80;
    const listHeight = cardInner - headerHeight - footerHeight - gridGap;
    const rowBudget = listHeight / Math.max(1, n);
    const rowFontSize = Math.max(18, Math.min(56, Math.floor(rowBudget * 0.62)));
    const rowPadding = Math.max(4, Math.min(22, Math.floor(rowBudget * 0.16)));
    const summaryFontSize = Math.max(14, Math.floor(rowFontSize * 0.78));

    const dateLabel = formatDate(workout.date, locale);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: "var(--bg)",
          color: "var(--fg)",
          fontFamily: "var(--font-sans)",
          padding: 80,
          boxSizing: "border-box",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          rowGap: 48,
        }}
      >
        {/* HEADER */}
        <div>
          {headlineMode === "date" && (
            <div
              style={{
                fontSize: dateHeadlineSize,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {dateLabel}
            </div>
          )}

          {headlineMode === "quote" && quote && (
            <div
              style={{
                fontSize: quoteHeadlineSize,
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                fontStyle: "italic",
              }}
            >
              {quote}
            </div>
          )}

          {headlineMode === "both" && (
            <>
              <div
                style={{
                  fontSize: bothDateSize,
                  fontWeight: 600,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {dateLabel}
              </div>
              {quote && (
                <div
                  style={{
                    marginTop: 16,
                    fontSize: bothQuoteSize,
                    color: "var(--fg-muted)",
                    lineHeight: 1.3,
                    fontStyle: "italic",
                  }}
                >
                  {quote}
                </div>
              )}
            </>
          )}

          {totalVolume !== null && !hideTotals && (
            <div
              style={{
                marginTop: 16,
                fontSize: 32,
                color: "var(--fg-muted)",
              }}
            >
              {formatWeight(totalVolume, units, locale)} total
            </div>
          )}

          {showNote && (
            <div
              style={{
                marginTop: 28,
                fontSize: 26,
                color: "var(--fg-muted)",
                lineHeight: 1.4,
                fontStyle: "italic",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {workout.note}
            </div>
          )}
        </div>

        {/* LIST */}
        <div
          style={{
            overflow: "hidden",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {groups.map((g) => {
              const summary = summarizeGroup(g, locale, units);
              return (
                <li
                  key={g.exercise.id}
                  style={{
                    fontSize: rowFontSize,
                    lineHeight: 1,
                    padding: `${rowPadding}px 0`,
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.exercise.name}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 16,
                      flexShrink: 0,
                    }}
                  >
                    {summary && (
                      <span
                        style={{
                          fontSize: summaryFontSize,
                          color: "var(--fg-muted)",
                          opacity: 0.85,
                        }}
                      >
                        {summary}
                      </span>
                    )}
                    {!hideCounts && (
                      <span style={{ color: "var(--fg-muted)" }}>
                        × {g.sets.length}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: 56,
              height: 4,
              borderRadius: 2,
              background: "var(--accent)",
            }}
          />
          <div
            style={{
              fontSize: 28,
              color: "var(--fg-muted)",
              letterSpacing: "0.18em",
              fontWeight: 500,
            }}
          >
            mindra
          </div>
        </div>
      </div>
    );
  },
);

function computeVolume(groups: Group[]): number | null {
  let total = 0;
  let counted = 0;
  for (const g of groups) {
    for (const s of g.sets) {
      if (s.reps !== null && s.weight_kg !== null) {
        total += s.reps * s.weight_kg;
        counted++;
      }
    }
  }
  return counted > 0 ? Math.round(total) : null;
}

function summarizeGroup(
  g: Group,
  locale: string,
  units: Units,
): string | null {
  const reps = g.sets.map((s) => s.reps).filter((r): r is number => r !== null);
  const weights = g.sets
    .map((s) => s.weight_kg)
    .filter((w): w is number => w !== null);

  if (reps.length === 0 && weights.length === 0) return null;

  const repPart = reps.length > 0 ? formatRange(reps) : null;
  const weightPart =
    weights.length > 0
      ? `${formatRange(
          weights.map((w) => kgToDisplay(w, units)),
          locale,
        )} ${unitLabel(units)}`
      : null;

  if (repPart && weightPart) return `${repPart} × ${weightPart}`;
  if (repPart) return `${repPart} reps`;
  if (weightPart) return weightPart;
  return null;
}

function formatRange(values: number[], locale?: string): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const fmt = (n: number) =>
    locale ? n.toLocaleString(locale) : n.toString();
  if (min === max) return fmt(min);
  return `${fmt(min)}–${fmt(max)}`;
}