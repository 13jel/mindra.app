"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BILATERAL_REGIONS, CENTRAL_REGIONS, REGION_ORDER, isBilateral, type PainRegionKey, type PainSide } from "@/lib/pain-regions";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (region: PainRegionKey, side: PainSide) => void;
  existing: { region: PainRegionKey; side: PainSide }[];
};

export function PainSitePicker({ open, onClose, onAdd, existing }: Props) {
  const t = useTranslations("painPicker");
  const tRegion = useTranslations("painRegion");
  const tSide = useTranslations("painSide");
  const tCommon = useTranslations("common");

  const [pendingRegion, setPendingRegion] = useState<PainRegionKey | null>(null);

  if (!open) return null;

  const isAlreadyAdded = (region: PainRegionKey, side: PainSide) =>
    existing.some((e) => e.region === region && e.side === side);

  const onPickRegion = (region: PainRegionKey) => {
    if (isBilateral(region)) {
      setPendingRegion(region);
    } else {
      onAdd(region, "center");
      onClose();
    }
  };

  const onPickSide = (side: PainSide) => {
    if (!pendingRegion) return;
    onAdd(pendingRegion, side);
    setPendingRegion(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={() => {
        setPendingRegion(null);
        onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-xl bg-bg border border-border p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {pendingRegion ? tRegion(pendingRegion) : t("title")}
          </h2>
          <button
            type="button"
            onClick={() => {
              setPendingRegion(null);
              onClose();
            }}
            className="text-fg-muted hover:text-fg"
            aria-label={tCommon("cancel")}
          >
            ×
          </button>
        </div>

        {pendingRegion ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-fg-muted">{t("pickSide")}</p>
            <div className="grid grid-cols-3 gap-2">
              <SideButton
                label={tSide("left")}
                disabled={isAlreadyAdded(pendingRegion, "left")}
                onClick={() => onPickSide("left")}
              />
              <SideButton
                label={tSide("right")}
                disabled={isAlreadyAdded(pendingRegion, "right")}
                onClick={() => onPickSide("right")}
              />
              <SideButton
                label={tSide("both")}
                disabled={isAlreadyAdded(pendingRegion, "both")}
                onClick={() => onPickSide("both")}
              />
            </div>
            <button
              type="button"
              onClick={() => setPendingRegion(null)}
              className="mt-2 text-xs text-fg-muted hover:text-fg"
            >
              ← {t("backToRegions")}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {REGION_ORDER.map((region) => {
              const fullyAdded = isBilateral(region)
                ? (["left", "right", "both"] as PainSide[]).every((s) =>
                    isAlreadyAdded(region, s),
                  )
                : isAlreadyAdded(region, "center");

              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => onPickRegion(region)}
                  disabled={fullyAdded}
                  data-tap
                  className="rounded-full border border-border bg-bg-elev px-3 py-2 text-sm hover:border-accent disabled:opacity-40 disabled:hover:border-border"
                >
                  {tRegion(region)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SideButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tap
      className="rounded-md border border-border bg-bg-elev px-3 py-3 text-sm hover:border-accent disabled:opacity-40 disabled:hover:border-border"
    >
      {label}
    </button>
  );
}