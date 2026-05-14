import type { Units } from "./db";

const KG_PER_LB = 0.45359237;
const LB_PER_KG = 1 / KG_PER_LB;

/**
 * Convert internal kg to the user's display units.
 * Imperial display rounds to 0.5 lb — gym plates come in 2.5/5 lb increments,
 * so fractional precision is false precision.
 */
export function kgToDisplay(kg: number, units: Units): number {
  if (units === "metric") return kg;
  const lb = kg * LB_PER_KG;
  return Math.round(lb * 2) / 2;
}

/**
 * Convert a user-entered display value back to kg for storage.
 */
export function displayToKg(value: number, units: Units): number {
  if (units === "metric") return value;
  return value * KG_PER_LB;
}

/**
 * Format a kg value for display, with the unit suffix.
 * Locale-aware decimal separator.
 */
export function formatWeight(
  kg: number,
  units: Units,
  locale: string,
): string {
  const display = kgToDisplay(kg, units);
  const formatted = display.toLocaleString(locale, {
    maximumFractionDigits: 1,
  });
  return `${formatted} ${unitLabel(units)}`;
}

/**
 * Format a kg value with no unit suffix — for use inside summaries where
 * the unit appears once at the end (e.g. "70–85 kg" not "70 kg–85 kg").
 */
export function formatWeightValue(
  kg: number,
  units: Units,
  locale: string,
): string {
  const display = kgToDisplay(kg, units);
  return display.toLocaleString(locale, {
    maximumFractionDigits: 1,
  });
}

export function unitLabel(units: Units): string {
  return units === "metric" ? "kg" : "lb";
}