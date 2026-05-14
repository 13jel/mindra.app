"use client";

import { useTranslations } from "next-intl";
import type { PainSite } from "@/lib/pain-regions";
import { isBilateral } from "@/lib/pain-regions";

export function PainSiteRow({
  site,
  onIntensityChange,
  onRemove,
}: {
  site: PainSite;
  onIntensityChange: (n: number) => void;
  onRemove: () => void;
}) {
  const tRegion = useTranslations("painRegion");
  const tSide = useTranslations("painSide");
  const tCommon = useTranslations("common");

  const showSide = isBilateral(site.region) && site.side !== "center";

  return (
    <div className="rounded border border-border bg-bg px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{tRegion(site.region)}</span>
          {showSide && (
            <span className="ml-2 text-fg-muted text-xs">
              {tSide(site.side)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tabular-nums">{site.intensity}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={tCommon("delete")}
            className="text-fg-muted hover:text-danger px-1"
          >
            ×
          </button>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={site.intensity}
        onChange={(e) => onIntensityChange(Number(e.target.value))}
        className="mt-2 w-full accent-(--accent)"
      />
    </div>
  );
}