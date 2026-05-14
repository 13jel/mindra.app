export type PainRegionKey =
  | "shoulder" | "elbow" | "wrist" | "hand"
  | "hip" | "knee" | "ankle" | "foot"
  | "neck" | "upperBack" | "midBack" | "lowerBack"
  | "chest" | "abdomen" | "head";

export type PainSide = "left" | "right" | "both" | "center";

export const BILATERAL_REGIONS: PainRegionKey[] = [
  "shoulder", "elbow", "wrist", "hand",
  "hip", "knee", "ankle", "foot",
];

export const CENTRAL_REGIONS: PainRegionKey[] = [
  "neck", "upperBack", "midBack", "lowerBack",
  "chest", "abdomen", "head",
];

export function isBilateral(region: PainRegionKey): boolean {
  return (BILATERAL_REGIONS as PainRegionKey[]).includes(region);
}

export const REGION_ORDER: PainRegionKey[] = [
  "head", "neck",
  "shoulder", "chest", "upperBack",
  "elbow", "midBack", "abdomen",
  "wrist", "hand", "lowerBack",
  "hip", "knee", "ankle", "foot",
];

export type PainSite = {
  region: PainRegionKey;
  side: PainSide;
  intensity: number; // 0-10
};