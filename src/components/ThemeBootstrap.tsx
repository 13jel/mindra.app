"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/lib/store";
import { seedIfEmpty } from "@/lib/seed";
import { seedPresets } from "@/lib/patterns";
import { seedLibrary } from "@/lib/library";

export function ThemeBootstrap() {
  const palette = useUIStore((s) => s.palette);
  const density = useUIStore((s) => s.density);
  const kindMode = useUIStore((s) => s.kindMode);

  const tExercises = useTranslations("exercises");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = palette;
    root.dataset.density = density;
    root.dataset.kind = kindMode ? "on" : "off";
  }, [palette, density, kindMode]);

  useEffect(() => {
    (async () => {
      try {
        await seedIfEmpty();
        await seedPresets();
        await seedLibrary((key) => {
          try {
            return tExercises(key as never);
          } catch {
            return key;
          }
        });
      } catch (err) {
        console.error("[mindra] seed failed", err);
      }
    })();
  }, []);

  return null;
}