"use client";

import { useEffect } from "react";
import { useKindFlags } from "@/lib/hooks";

/**
 * Mirrors active kind-mode flags onto <html> as data attributes so CSS
 * rules can target them. Mounted once near the root layout.
 *
 * Attributes set:
 *   data-reduce-motion="on" | (absent)
 *   data-font-size="large" | (absent)
 *
 * Flags that affect React-rendered content (hide totals/counts, word
 * check-in, soft language) are handled by the components themselves
 * via useKindFlags(), not via CSS.
 */
export function KindModeApplier() {
  const flags = useKindFlags();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (flags?.reducedMotion) {
      root.setAttribute("data-reduce-motion", "on");
    } else {
      root.removeAttribute("data-reduce-motion");
    }

    if (flags?.largerText) {
      root.setAttribute("data-font-size", "large");
    } else {
      root.removeAttribute("data-font-size");
    }
  }, [flags?.reducedMotion, flags?.largerText]);

  return null;
}