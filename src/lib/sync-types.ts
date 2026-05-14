export type SyncMeta = {
  id: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

export type WithSyncMeta<T> = T & SyncMeta;

export type WithoutSyncMeta<T> = Omit<T, keyof SyncMeta>;

export function nowIso(): string {
  return new Date().toISOString();
}

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function newId(): string {
  const time = Date.now();
  let timePart = "";
  let t = time;
  for (let i = 0; i < 10; i++) {
    timePart = ALPHABET[t % 32] + timePart;
    t = Math.floor(t / 32);
  }
  let randPart = "";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 10; i++) {
    randPart += ALPHABET[bytes[i] % 32];
  }
  return timePart + randPart;
}

export function touch<T extends SyncMeta>(row: T): T {
  return { ...row, updated_at: nowIso() };
}