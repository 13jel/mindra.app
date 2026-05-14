import { db, newRow } from "./db";
import type { CheckIn, RestReason } from "./db";
import { nowIso, touch } from "./sync-types";
import { todayDate } from "./workouts";
import type { PainSite } from "./pain-regions";

export async function saveCheckIn(input: {
  date?: string;
  pain: number;
  note?: string;
  pain_sites?: PainSite[];
  is_rest_day?: boolean;
  rest_reason?: RestReason | null;
}): Promise<CheckIn> {
  const date = input.date ?? todayDate();
  const pain = clampPain(input.pain);
  const note = (input.note ?? "").trim();
  const pain_sites = (input.pain_sites ?? []).map((s) => ({
    region: s.region,
    side: s.side,
    intensity: clampPain(s.intensity),
  }));
  const is_rest_day = input.is_rest_day ?? false;
  const rest_reason = is_rest_day ? (input.rest_reason ?? null) : null;

  const existing = await db.check_ins.where("date").equals(date).first();

  if (existing && existing.deleted_at === null) {
    const updated = touch({
      ...existing,
      pain,
      note,
      pain_sites,
      is_rest_day,
      rest_reason,
    });
    await db.check_ins.put(updated);
    return updated;
  }

  const row = newRow<Omit<CheckIn, "id" | "updated_at" | "synced_at" | "deleted_at">>({
    date,
    pain,
    note,
    pain_sites,
    is_rest_day,
    rest_reason,
  });
  await db.check_ins.add(row);
  return row;
}

export async function clearRestDayFlag(date: string): Promise<void> {
  const existing = await db.check_ins.where("date").equals(date).first();
  if (!existing || existing.deleted_at !== null) return;
  if (!existing.is_rest_day) return; // nothing to do
  await db.check_ins.put(
    touch({ ...existing, is_rest_day: false, rest_reason: null }),
  );
}

export async function deleteCheckIn(date: string): Promise<void> {
  const existing = await db.check_ins.where("date").equals(date).first();
  if (!existing) return;
  const now = nowIso();
  await db.check_ins.put({
    ...existing,
    deleted_at: now,
    updated_at: now,
  });
}

export function readPainSites(checkIn: CheckIn | null | undefined): PainSite[] {
  if (!checkIn) return [];
  return Array.isArray(checkIn.pain_sites) ? checkIn.pain_sites : [];
}

export function readIsRestDay(checkIn: CheckIn | null | undefined): boolean {
  if (!checkIn) return false;
  return checkIn.is_rest_day === true;
}

export function readRestReason(
  checkIn: CheckIn | null | undefined,
): RestReason | null {
  if (!checkIn) return null;
  return checkIn.rest_reason ?? null;
}

function clampPain(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}