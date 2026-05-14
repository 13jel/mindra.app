"use client";

import { useTranslations } from "next-intl";
import { useKindFlags } from "./hooks";

/**
 * Drop-in replacement for next-intl's useTranslations that returns a
 * function preferring soft-language variants when kind-mode's soft-language
 * flag is active. For a key "foo", it tries "foo_kind" first; falls back
 * to "foo" if the kind variant doesn't exist or soft-language is off.
 *
 * Usage: const t = useKindT("today"); t("empty");
 */
export function useKindT(namespace: string) {
  const t = useTranslations(namespace);
  const flags = useKindFlags();
  const soft = flags?.softLanguage ?? false;

  return (key: string, values?: Record<string, string | number>) => {
    if (soft) {
      try {
        // next-intl throws (or logs) if the key is missing. We treat any
        // throw as "no kind variant; fall through".
        const kindKey = `${key}_kind`;
        const result = (t as (k: string, v?: unknown) => string)(kindKey, values);
        // next-intl's missing-message behavior may return the key path
        // ("namespace.key_kind") rather than throw. Detect that.
        if (!result.endsWith("_kind") && !result.includes(`.${kindKey}`)) {
          return result;
        }
      } catch {
        // fall through
      }
    }
    return (t as (k: string, v?: unknown) => string)(key, values);
  };
}