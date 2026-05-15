"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth";
import { subscribeSync, type SyncState } from "@/lib/sync/worker";
import { subscribeBackfill, type BackfillState } from "@/lib/sync/backfill";

/**
 * A small persistent dot in the upper-right corner showing sync state.
 * Invisible when signed-in and idle+synced (the default happy state).
 * Visible only during active sync transitions or error states.
 *
 * Clicking navigates to Profile where full status lives.
 */
export function SyncIndicator() {
  const user = useAuthUser();
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [backfillState, setBackfillState] = useState<BackfillState | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubSync = subscribeSync(setSyncState);
    const unsubBackfill = subscribeBackfill(user.id, setBackfillState);
    return () => {
      unsubSync();
      unsubBackfill();
    };
  }, [user]);

  if (!user) return null;

  const indicator = pickIndicator(syncState, backfillState);
  if (!indicator) return null;

  return (
    <Link
      href="/profile"
      aria-label={indicator.ariaLabel}
      className="fixed top-3 right-3 z-50 flex h-6 w-6 items-center justify-center"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${indicator.dotClass}`}
        style={
          indicator.pulse
            ? { animation: "sync-pulse 1.6s ease-in-out infinite" }
            : undefined
        }
      />
      <style jsx>{`
        @keyframes sync-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </Link>
  );
}

type IndicatorVisual = {
  dotClass: string;
  pulse: boolean;
  ariaLabel: string;
};

function pickIndicator(
  sync: SyncState | null,
  backfill: BackfillState | null,
): IndicatorVisual | null {
  if (backfill?.kind === "in_progress") {
    return {
      dotClass: "bg-fg-muted",
      pulse: true,
      ariaLabel: "Backing up your data",
    };
  }

  if (!sync) return null;

  if (sync.status === "error") {
    const isNetwork =
      sync.lastError?.toLowerCase().includes("network") ||
      sync.lastError?.toLowerCase().includes("fetch") ||
      sync.lastError?.toLowerCase().includes("offline");
    return {
      dotClass: isNetwork ? "bg-warning" : "bg-danger",
      pulse: false,
      ariaLabel: isNetwork ? "Offline — sync will retry" : "Sync error",
    };
  }

  if (sync.status === "syncing" && sync.pendingCount > 0) {
    return {
      dotClass: "bg-fg-muted",
      pulse: true,
      ariaLabel: `Syncing ${sync.pendingCount} items`,
    };
  }

  return null;
}