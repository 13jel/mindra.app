"use client";

import { useTranslations } from "next-intl";
import type { PainSite } from "@/lib/pain-regions";

export function PainComparisonView({
  pre,
  post,
}: {
  pre: PainSite[];
  post: PainSite[];
}) {
  const t = useTranslations("postPain");
  const tRegion = useTranslations("painRegion");
  const tSide = useTranslations("painSide");

  return (
    <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
      <div className="text-sm font-medium">{t("comparisonTitle")}</div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {pre.map((p, i) => {
          const matched = post.find(
            (q) => q.region === p.region && q.side === p.side,
          );
          const delta = matched ? matched.intensity - p.intensity : null;
          return (
            <li key={i} className="flex items-baseline justify-between gap-2">
              <span>
                <span className="font-medium">{tRegion(p.region)}</span>
                {p.side !== "center" && (
                  <span className="ml-1 text-fg-muted text-xs">
                    ({tSide(p.side)})
                  </span>
                )}
              </span>
              <span className="tabular-nums text-fg-muted">
                {p.intensity}
                {matched ? ` → ${matched.intensity}` : ""}
                {delta !== null && (
                  <span
                    className={[
                      "ml-2 text-xs",
                      delta < 0
                        ? "text-success"
                        : delta > 0
                          ? "text-danger"
                          : "text-fg-muted",
                    ].join(" ")}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}