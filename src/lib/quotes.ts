const STORAGE_KEY = "mindra:quotes:recent";
const COOLDOWN_DAYS = 7;
const QUOTE_COUNT = 30;

type RecentEntry = { id: string; usedAt: number };

function readRecent(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof e.id === "string" &&
        typeof e.usedAt === "number",
    );
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
  }
}

export function pickQuoteId(): string {
  const now = Date.now();
  const cutoff = now - COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  const recent = readRecent().filter((e) => e.usedAt >= cutoff);
  const recentIds = new Set(recent.map((e) => e.id));

  const allIds = Array.from({ length: QUOTE_COUNT }, (_, i) => `q${i + 1}`);
  const available = allIds.filter((id) => !recentIds.has(id));
  const pool = available.length > 0 ? available : allIds;

  const picked = pool[Math.floor(Math.random() * pool.length)];

  writeRecent([...recent, { id: picked, usedAt: now }]);

  return picked;
}