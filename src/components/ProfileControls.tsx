"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePreferences } from "@/lib/hooks";
import { updatePreferences } from "@/lib/preferences";
import { useEffect, useState } from "react";
import { DENSITIES, PALETTES, type Density, type Palette, useUIStore } from "@/lib/store";

export function ProfileControls() {
  const t = useTranslations("profile");
  const tPalette = useTranslations("palette");
  const tDensity = useTranslations("density");
  const tCommon = useTranslations("common");
  const tTheme = useTranslations("theme");

  const palette = useUIStore((s) => s.palette);
  const density = useUIStore((s) => s.density);
  const setPalette = useUIStore((s) => s.setPalette);
  const setDensity = useUIStore((s) => s.setDensity);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefs = usePreferences();
  const kindMode = prefs?.kindMode ?? false;

  const onToggleKind = async () => {
    if (!prefs) return;
    try {
      await updatePreferences({ kindMode: !prefs.kindMode } as any);
    } catch {
      alert(tCommon("error"));
    }
  };

  return (
    <div className="mt-6 space-y-8">
      <Field
        label={t("kindMode")}
        description={t("kindModeDescription")}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={kindMode}
            onClick={onToggleKind}
            disabled={!prefs}
            data-tap
            className={[
              "inline-flex h-7 w-12 items-center rounded-full border border-border transition-colors",
              kindMode ? "bg-accent" : "bg-bg-elev",
              !prefs ? "opacity-50" : "",
            ].join(" ")}
          >
            <span
              className={[
                "block h-5 w-5 rounded-full bg-bg shadow transition-transform",
                kindMode ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
          <Link
            href="/profile/kind-mode"
            className="text-sm text-fg-muted hover:text-fg underline-offset-2 hover:underline"
          >
            {t("kindModeCustomize")} →
          </Link>
        </div>
      </Field>

      <Field label={t("theme")}>
        <SegmentedRow>
          {(["light", "dark", "system"] as const).map((mode) => (
            <Segment
              key={mode}
              active={mounted && theme === mode}
              onClick={() => setTheme(mode)}
            >
              {tTheme(mode)}
            </Segment>
          ))}
        </SegmentedRow>
      </Field>

      <Field label={t("palette")}>
        <SegmentedRow>
          {PALETTES.map((p: Palette) => (
            <Segment
              key={p}
              active={palette === p}
              onClick={() => setPalette(p)}
            >
              {tPalette(p)}
            </Segment>
          ))}
        </SegmentedRow>
      </Field>

      <Field label={t("density")}>
        <SegmentedRow>
          {DENSITIES.map((d: Density) => (
            <Segment
              key={d}
              active={density === d}
              onClick={() => setDensity(d)}
            >
              {tDensity(d)}
            </Segment>
          ))}
        </SegmentedRow>
      </Field>
    </div>
  );
}

/* ---------- bits ---------- */

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-fg-muted">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function SegmentedRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-elev p-1">
      {children}
    </div>
  );
}

function Segment({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tap
      className={[
        "rounded px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-bg text-fg shadow-sm"
          : "text-fg-muted hover:text-fg",
        disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}