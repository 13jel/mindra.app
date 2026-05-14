import { formatWeight } from "./format-weight";
import type { Units, WorkoutSet } from "./db";

export function formatSetSummary(
  set: WorkoutSet,
  units: Units,
  locale: string,
): string {
  const parts: string[] = [];
  if (set.reps !== null) parts.push(`${set.reps} reps`);
  if (set.weight_kg !== null) parts.push(formatWeight(set.weight_kg, units, locale));
  if (set.duration_s !== null) parts.push(`${set.duration_s}s`);
  if (set.rpe !== null) parts.push(`RPE ${set.rpe}`);
  return parts.join(" · ");
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatDate(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dt);
}

export function isSameDate(iso: string, other: Date = new Date()): boolean {
  const yyyy = other.getFullYear();
  const mm = String(other.getMonth() + 1).padStart(2, "0");
  const dd = String(other.getDate()).padStart(2, "0");
  return iso === `${yyyy}-${mm}-${dd}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateRelative(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(dt);
}