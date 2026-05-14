"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { RestReason } from "@/lib/db";

const REASONS: RestReason[] = ["planned", "forced", "skipped"];

export function RestDayToggle({
  isRest,
  reason,
  onChange,
  hideReason = false,
}: {
  isRest: boolean;
  reason: RestReason | null;
  onChange: (isRest: boolean, reason: RestReason | null) => void;
  /**
   * When true (kind mode), the reason picker is hidden unless a reason is
   * already set OR the user explicitly expands it via "Add reason?".
   */
  hideReason?: boolean;
}) {
  const t = useTranslations("restDay");

  // Expand state for the kind-mode "Add reason?" affordance. Starts open
  // if a reason already exists (so editing an existing rest with a reason
  // doesn't hide it).
  const [reasonOpen, setReasonOpen] = useState(reason !== null);

  // In kind mode, the toggle no longer auto-picks "planned" when flipped
  // on — that would force a reason where we're trying to allow none.
  const onToggle = () => {
    if (hideReason) {
      onChange(!isRest, !isRest ? null : null);
    } else {
      onChange(!isRest, !isRest ? "planned" : null);
    }
  };

  const showReasonPicker = isRest && (!hideReason || reasonOpen || reason !== null);

  return (
    <div>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{t("label")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={isRest}
          onClick={onToggle}
          data-tap
          className={[
            "inline-flex h-7 w-12 items-center rounded-full border border-border transition-colors",
            isRest ? "bg-accent" : "bg-bg",
          ].join(" ")}
        >
          <span
            className={[
              "block h-5 w-5 rounded-full bg-bg-elev shadow transition-transform",
              isRest ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </label>

      {isRest && hideReason && !reasonOpen && reason === null && (
        <button
          type="button"
          onClick={() => setReasonOpen(true)}
          className="mt-3 text-xs text-fg-muted hover:text-fg"
        >
          + {t("addReason")}
        </button>
      )}

      {showReasonPicker && (
        <div className="mt-3 flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange(true, r)}
              data-tap
              className={[
                "rounded-full border px-3 py-1.5 text-xs",
                reason === r
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg",
              ].join(" ")}
            >
              {t(`reason.${r}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}