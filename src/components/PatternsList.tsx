"use client";

import { useTranslations } from "next-intl";
import { usePatterns } from "@/lib/hooks";

export function PatternsList() {
  const t = useTranslations("patterns");
  const patterns = usePatterns();

  if (patterns === undefined) {
    return <div className="mt-6 text-fg-muted text-sm">…</div>;
  }

  const userPatterns = patterns.filter((p) => !p.is_preset);

  if (userPatterns.length === 0) {
    return <p className="mt-6 text-fg-muted">{t("empty")}</p>;
  }

  return (
    <ul className="mt-6 space-y-2">
      {userPatterns.map((p) => (
        <li
          key={p.id}
          className="rounded-md border border-border bg-bg-elev px-4 py-3"
        >
          <div className="font-medium">{p.name}</div>
        </li>
      ))}
    </ul>
  );
}