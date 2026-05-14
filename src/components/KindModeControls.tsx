"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePreferences } from "@/lib/hooks";
import { updatePreferences } from "@/lib/preferences";
import type { Preferences } from "@/lib/db";

type FlagKey =
  | "kindSoftLanguage"
  | "kindReducedMotion"
  | "kindLargerText"
  | "kindHideTotals"
  | "kindHideCounts"
  | "kindWordCheckIn";

const FLAG_KEYS: FlagKey[] = [
  "kindSoftLanguage",
  "kindReducedMotion",
  "kindLargerText",
  "kindHideTotals",
  "kindHideCounts",
  "kindWordCheckIn",
];

export function KindModeControls() {
  const t = useTranslations("kindMode");
  const tCommon = useTranslations("common");
  const prefs = usePreferences();

  const onToggleMaster = async () => {
    if (!prefs) return;
    try {
      await updatePreferences({ kindMode: !prefs.kindMode });
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const onToggleFlag = async (key: FlagKey) => {
    if (!prefs) return;
    try {
      await updatePreferences({ [key]: !prefs[key] } as Partial<Preferences>);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const masterOn = prefs?.kindMode ?? false;

  return (
    <div className="space-y-6">
      <ToggleRow
        title={t("masterTitle")}
        description={t("masterDescription")}
        checked={masterOn}
        onChange={onToggleMaster}
        disabled={!prefs}
        emphasized
      />

      <div className="space-y-1">
        <div className="text-sm font-medium text-fg-muted">
          {t("individualTitle")}
        </div>
        <p className="text-xs text-fg-muted">{t("individualBlurb")}</p>
      </div>

      <div className="space-y-3">
        {FLAG_KEYS.map((key) => {
          const flagValue = prefs?.[key] ?? false;
          const effective = masterOn || flagValue;
          return (
            <ToggleRow
              key={key}
              title={t(`${key}_title` as Parameters<typeof t>[0])}
              description={t(`${key}_description` as Parameters<typeof t>[0])}
              checked={flagValue}
              effectiveOverride={masterOn && !flagValue ? effective : undefined}
              onChange={() => onToggleFlag(key)}
              disabled={!prefs || masterOn}
            />
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  emphasized,
  effectiveOverride,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  emphasized?: boolean;
  effectiveOverride?: boolean;
}) {
  // When master is on, individual toggles are visually "active" but
  // disabled (their stored value doesn't change). Show this state by
  // dimming the switch but rendering it as on.
  const visualOn = effectiveOverride !== undefined ? effectiveOverride : checked;

  return (
    <div
      className={[
        "flex items-start justify-between gap-3 rounded-md border bg-bg-elev p-3",
        emphasized ? "border-accent" : "border-border",
      ].join(" ")}
    >
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-fg-muted mt-1">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={visualOn}
        onClick={onChange}
        disabled={disabled}
        data-tap
        className={[
          "inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-border transition-colors",
          visualOn ? "bg-accent" : "bg-bg",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        <span
          className={[
            "block h-5 w-5 rounded-full bg-bg shadow transition-transform",
            visualOn ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}