// calendar-utils.ts
import { addDays } from "./format";

export function dateToIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfMonth(monthIso: string): string {
  return `${monthIso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return dateToIso(new Date(y, m, 0)); // day 0 of next month = last of this
}

export function addMonths(iso: string, n: number): string {
  const [y, m] = iso.split("-").map(Number);
  return dateToIso(new Date(y, m - 1 + n, 1));
}


export function buildMonthGrid(
  monthIso: string,
  weekStartsOn: number = 1,
): { date: string; inMonth: boolean }[] {
  const first = startOfMonth(monthIso);
  const [y, m] = first.split("-").map(Number);
  const firstDate = new Date(y, m - 1, 1);
  const firstDayOfWeek = firstDate.getDay(); // 0..6, Sun=0
  const leading = (firstDayOfWeek - weekStartsOn + 7) % 7;

  const gridStart = addDays(first, -leading);
  const cells: { date: string; inMonth: boolean }[] = [];
  const focusMonth = m;
  for (let i = 0; i < 42; i++) {
    const iso = addDays(gridStart, i);
    const cellMonth = Number(iso.slice(5, 7));
    cells.push({ date: iso, inMonth: cellMonth === focusMonth });
  }
  return cells;
}

export function weekdayLabels(
  locale: string,
  weekStartsOn: number = 1,
): string[] {
  const sundayRef = new Date(2024, 0, 7);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sundayRef);
    d.setDate(sundayRef.getDate() + ((i + weekStartsOn) % 7));
    return fmt.format(d);
  });
}

export function monthLabel(monthIso: string, locale: string): string {
  const [y, m] = monthIso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}