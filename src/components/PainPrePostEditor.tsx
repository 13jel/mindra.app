"use client";

import { useTranslations } from "next-intl";
import type { PainSite } from "@/lib/pain-regions";

export function PainPrePostEditor({
  sites,
  onChange,
}: {
  sites: PainSite[];
  onChange: (next: PainSite[]) => void;
}) {
  const tRegion = useTranslations("painRegion");
  const tSide = useTranslations("painSide");

  const setIntensity = (idx: number, intensity: number) => {
    onChange(sites.map((s, i) => (i === idx ? { ...s, intensity } : s)));
  };

  return (
    <div className="space-y-2">
      {sites.map((site, idx) => (
        <div
          key={`${site.region}-${site.side}-${idx}`}
          className="rounded border border-border bg-bg px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">{tRegion(site.region)}</span>
              {site.side !== "center" && (
                <span className="ml-2 text-fg-muted text-xs">
                  {tSide(site.side)}
                </span>
              )}
            </div>
            <span className="text-sm font-medium tabular-nums">
              {site.intensity}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={site.intensity}
            onChange={(e) => setIntensity(idx, Number(e.target.value))}
            className="mt-2 w-full accent-(--accent)"
          />
        </div>
      ))}
    </div>
  );
}