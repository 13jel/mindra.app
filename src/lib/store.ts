import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Palette = "peach" | "calm" | "soft";
export type Density = "calm" | "standard" | "compact";
export type LibrarySort = "recent" | "alpha" | "category";

export const PALETTES: readonly Palette[] = ["peach", "calm", "soft"] as const;
export const DENSITIES: readonly Density[] = ["calm", "standard", "compact"] as const;
export const LIBRARY_SORTS: readonly LibrarySort[] = ["recent", "alpha", "category"] as const;

type UIState = {
  palette: Palette;
  density: Density;
  kindMode: boolean;
  librarySort: LibrarySort;
  setPalette: (p: Palette) => void;
  setDensity: (d: Density) => void;
  setKindMode: (on: boolean) => void;
  setLibrarySort: (s: LibrarySort) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      palette: "peach",
      density: "standard",
      kindMode: false,
      librarySort: "recent",
      setPalette: (palette) => set({ palette }),
      setDensity: (density) => set({ density }),
      setKindMode: (kindMode) => set({ kindMode }),
      setLibrarySort: (librarySort) => set({ librarySort }),
    }),
    {
      name: "mindra-ui",
      storage: createJSONStorage(() => localStorage),
      version: 2,
    },
  ),
);