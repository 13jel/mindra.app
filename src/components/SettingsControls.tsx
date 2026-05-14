"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LOCALES, type Locale } from "@/i18n/locale";
import { setLocale as setLocaleAction } from "@/i18n/setLocale";
import { usePreferences } from "@/lib/hooks";
import { updatePreferences } from "@/lib/preferences";
import type { Units, WeekStart } from "@/lib/db";

export function SettingsControls() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const currentLocale = useLocale();
  const prefs = usePreferences();
  const [isPending, startTransition] = useTransition();

  const onLocale = (next: Locale) => {
    if (next === currentLocale) return;
    startTransition(async () => {
      try {
        await setLocaleAction(next);
        toast.success(tCommon("saved"));
        // The server reads the cookie on next render, so we need a reload
        // for messages to swap. Existing pattern from /profile.
        window.location.reload();
      } catch {
        toast.error(tCommon("error"));
      }
    });
  };

  const onUnits = async (next: Units) => {
    if (prefs && prefs.units === next) return;
    try {
      await updatePreferences({ units: next });
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("error"));
    }
  };

  const onWeekStart = async (next: WeekStart) => {
    if (prefs && prefs.weekStart === next) return;
    try {
      await updatePreferences({ weekStart: next });
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("error"));
    }
  };

  return (
    <div className="space-y-6">
      <Section title={t("language")}>
        <RadioRow
          options={LOCALES.map((l) => ({ value: l, label: t(`locale_${l}`) }))}
          value={currentLocale}
          onChange={(v) => onLocale(v as Locale)}
          disabled={isPending}
        />
      </Section>

      <Section title={t("units")}>
        <RadioRow
          options={[
            { value: "metric", label: t("units_metric") },
            { value: "imperial", label: t("units_imperial") },
          ]}
          value={prefs?.units ?? "metric"}
          onChange={(v) => onUnits(v as Units)}
          disabled={!prefs}
        />
        <p className="mt-2 text-sm text-fg-muted">{t("units_blurb")}</p>
      </Section>

      <Section title={t("weekStart")}>
        <RadioRow
          options={[
            { value: "mon", label: t("weekStart_mon") },
            { value: "sun", label: t("weekStart_sun") },
          ]}
          value={prefs?.weekStart ?? "mon"}
          onChange={(v) => onWeekStart(v as WeekStart)}
          disabled={!prefs}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-fg-muted">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RadioRow({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            data-tap
            className={[
              "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
              active
                ? "border-accent bg-accent/10 font-medium"
                : "border-border bg-bg-elev hover:border-fg-muted",
              disabled ? "opacity-50" : "",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}