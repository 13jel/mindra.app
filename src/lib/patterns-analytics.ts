import { db } from "./db";
import type { CheckIn } from "./db";
import { addDays } from "./format";
import { todayDate } from "./workouts";

export type DayPoint = {
  date: string;     
  pain: number | null; 
  isRest: boolean;
  hasWorkout: boolean;
};

export async function getDailySeries(days: number): Promise<DayPoint[]> {
  const end = todayDate();
  const start = addDays(end, -(days - 1));

  const checkIns = await db.check_ins
    .where("date")
    .between(start, end, true, true)
    .toArray();
  const workouts = await db.workouts
    .where("date")
    .between(start, end, true, true)
    .toArray();

  const ciByDate = new Map<string, CheckIn>();
  for (const c of checkIns) {
    if (c.deleted_at !== null) continue;
    ciByDate.set(c.date, c);
  }
  const workoutDates = new Set<string>();
  for (const w of workouts) {
    if (w.deleted_at !== null) continue;
    workoutDates.add(w.date);
  }

  const points: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const ci = ciByDate.get(date);
    points.push({
      date,
      pain: ci ? ci.pain : null,
      isRest: ci?.is_rest_day === true,
      hasWorkout: workoutDates.has(date),
    });
  }
  return points;
}

export type Stats = {
  avgPainLast7: number | null;
  avgPainPrev7: number | null;
  workoutsLast7: number;
  restLast7: number;
  loggedDaysLast7: number;
};

export async function getStats(): Promise<Stats> {
  const series = await getDailySeries(14);
  const last7 = series.slice(-7);
  const prev7 = series.slice(0, 7);

  const avg = (pts: DayPoint[]): number | null => {
    const withPain = pts.filter((p) => p.pain !== null) as (DayPoint & { pain: number })[];
    if (withPain.length === 0) return null;
    const sum = withPain.reduce((acc, p) => acc + p.pain, 0);
    return Math.round((sum / withPain.length) * 10) / 10;
  };

  return {
    avgPainLast7: avg(last7),
    avgPainPrev7: avg(prev7),
    workoutsLast7: last7.filter((p) => p.hasWorkout).length,
    restLast7: last7.filter((p) => p.isRest).length,
    loggedDaysLast7: last7.filter((p) => p.pain !== null).length,
  };
}

import type { PainRegionKey, PainSide } from "./pain-regions";
import { readPainSites } from "./checkins";

export type RegionKey = string; 

export function makeRegionKey(region: PainRegionKey, side: PainSide): RegionKey {
  return `${region}:${side}`;
}

export function parseRegionKey(key: RegionKey): { region: PainRegionKey; side: PainSide } {
  const [region, side] = key.split(":");
  return { region: region as PainRegionKey, side: side as PainSide };
}

export type RegionDayPoint = {
  date: string;
  intensity: number | null; 
};

export type RegionSeries = {
  key: RegionKey;
  region: PainRegionKey;
  side: PainSide;
  points: RegionDayPoint[];
  active: boolean;
};

export async function getRegionSeries(
  days: number,
  activeWindow = 14,
): Promise<RegionSeries[]> {
  const end = todayDate();
  const start = addDays(end, -(days - 1));
  const activeStart = addDays(end, -(activeWindow - 1));

  const checkIns = await db.check_ins
    .where("date")
    .between(start, end, true, true)
    .toArray();

  const ciByDate = new Map<string, (typeof checkIns)[number]>();
  for (const c of checkIns) {
    if (c.deleted_at !== null) continue;
    ciByDate.set(c.date, c);
  }

  const allKeys = new Set<RegionKey>();
  const activeKeys = new Set<RegionKey>();
  for (const c of checkIns) {
    if (c.deleted_at !== null) continue;
    const sites = readPainSites(c);
    for (const s of sites) {
      const k = makeRegionKey(s.region, s.side);
      allKeys.add(k);
      if (c.date >= activeStart) activeKeys.add(k);
    }
  }

  const result: RegionSeries[] = [];
  for (const key of allKeys) {
    const { region, side } = parseRegionKey(key);
    const points: RegionDayPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      const ci = ciByDate.get(date);
      if (!ci) {
        points.push({ date, intensity: null });
        continue;
      }
      const sites = readPainSites(ci);
      const match = sites.find(
        (s) => makeRegionKey(s.region, s.side) === key,
      );
      points.push({
        date,
        intensity: match ? match.intensity : null,
      });
    }
    result.push({
      key,
      region,
      side,
      points,
      active: activeKeys.has(key),
    });
  }

  result.sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    const aLast = lastLoggedDate(a) ?? "";
    const bLast = lastLoggedDate(b) ?? "";
    return bLast.localeCompare(aLast);
  });

  return result;
}

function lastLoggedDate(s: RegionSeries): string | null {
  for (let i = s.points.length - 1; i >= 0; i--) {
    if (s.points[i].intensity !== null) return s.points[i].date;
  }
  return null;
}