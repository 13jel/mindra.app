import { db, newRow } from "./db";
import { nowIso } from "./sync-types";

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.profile.get("me");
  if (existing) return;

  await db.profile.put({
    ...newRow({
      display_name: "",
      units: "metric",
      rest_default_s: 90,
    }),
    id: "me", 
    updated_at: nowIso(),
  });
}