"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase/browser";
import { startSyncWorker, stopSyncWorker } from "./sync/worker";

/**
 * Returns the current authenticated user, or null. Undefined while loading.
 * Subscribes to auth state changes for live updates (e.g., after magic
 * link click in another tab).
 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUser(data.user);
        if (data.user) startSyncWorker();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        startSyncWorker();
      } else {
        stopSyncWorker();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}