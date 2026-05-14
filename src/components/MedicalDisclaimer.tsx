"use client";

import { useTranslations } from "next-intl";

type Props = {
  variant?: "card" | "footer";
};

export function MedicalDisclaimer({ variant = "card" }: Props) {
  const t = useTranslations("disclaimer");

  if (variant === "footer") {
    return (
      <p className="text-xs text-fg-muted leading-relaxed">
        {t("short")}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
      <div className="text-sm font-medium">{t("title")}</div>
      <p className="mt-2 text-sm text-fg-muted leading-relaxed">
        {t("body")}
      </p>
      <p className="mt-2 text-sm text-fg-muted leading-relaxed">
        {t("body2")}
      </p>
    </div>
  );
}