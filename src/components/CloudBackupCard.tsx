"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthUser } from "@/lib/auth";
import { startSyncWorker, subscribeSync, type SyncState } from "@/lib/sync/worker";
import { subscribeBackfill, type BackfillState } from "@/lib/sync/backfill";
import { useKindFlags } from "@/lib/hooks";

export function CloudBackupCard() {
  const t = useTranslations("cloud");
  const tSync = useTranslations("sync");
  const tCommon = useTranslations("common");
  const user = useAuthUser();
  const kindFlags = useKindFlags();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const onSendLink = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Redirect URL after magic link click. Must match a URL in
          // Supabase dashboard → Authentication → URL Configuration.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setLinkSent(true);
    } catch (err) {
      console.error("[mindra] magic link send failed", err);
      toast.error(tCommon("error"));
    } finally {
      setSending(false);
    }
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success(t("signedOut"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSigningOut(false);
    }
  };

  const onRetry = () => {
    void startSyncWorker();
  };

  if (user === undefined) {
    return (
      <div className="rounded-md border border-border bg-bg-elev p-4 text-sm text-fg-muted">
        …
      </div>
    );
  }

  if (user) {
    const kind = kindFlags?.softLanguage ?? false;    
    return (
      <div className="rounded-md border border-border bg-bg-elev p-4">
        <div className="text-sm font-medium">{t("signedInTitle")}</div>
        <div className="mt-1 text-xs text-fg-muted">{user.email}</div>
        <p className="mt-3 text-sm text-fg-muted">{t("signedInBlurb")}</p>

        <div className="mt-3 border-t border-border pt-3">
          <SyncStatus
            syncState={syncState}
            backfillState={backfillState}
            kind={kind}
            tSync={tSync}
          />
          {syncState?.status === "error" && (
            <button
              type="button"
              onClick={onRetry}
              data-tap
              className="mt-2 rounded-md border border-border px-3 py-1 text-xs hover:border-fg-muted"
            >
              {tSync("retry")}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          data-tap
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm hover:border-fg-muted disabled:opacity-50"
        >
          {t("signOut")}
        </button>
      </div>
    );
  }

  if (linkSent) {
    return (
      <div className="rounded-md border border-accent bg-accent/5 p-4">
        <div className="text-sm font-medium">{t("linkSentTitle")}</div>
        <p className="mt-1 text-sm text-fg-muted">
          {t("linkSentBlurb", { email })}
        </p>
        <button
          type="button"
          onClick={() => {
            setLinkSent(false);
            setEmail("");
          }}
          className="mt-3 text-xs text-fg-muted hover:text-fg"
        >
          {t("useDifferentEmail")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-elev p-4">
      <div className="text-sm font-medium">{t("title")}</div>
      <p className="mt-1 text-sm text-fg-muted">{t("blurb")}</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSendLink();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          required
          autoComplete="email"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !email.trim()}
          data-tap
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {sending ? t("sending") : t("sendLink")}
        </button>
      </form>
    </div>
  );
}

function SyncStatus({
  syncState,
  backfillState,
  kind,
  tSync,
}: {
  syncState: SyncState | null;
  backfillState: BackfillState | null;
  kind: boolean;
  tSync: ReturnType<typeof useTranslations>;
}) {
  if (backfillState?.kind === "in_progress") {
    return <p className="text-sm text-fg-muted">{tSync("backingUp")}</p>;
  }

  if (!syncState) {
    return <p className="text-sm text-fg-muted">…</p>;
  }

  if (syncState.status === "error") {
    if (kind) {
      return (
        <p className="text-sm text-danger">{tSync("error_kind")}</p>
      );
    }
    return (
      <p className="text-sm text-danger">
        {tSync("error", { message: syncState.lastError ?? "" })}
      </p>
    );
  }

  if (syncState.status === "syncing" && syncState.pendingCount > 0) {
    if (kind) {
      return <p className="text-sm text-fg-muted">{tSync("syncing_kind")}</p>;
    }
    return (
      <p className="text-sm text-fg-muted">
        {tSync("syncing", { count: syncState.pendingCount })}
      </p>
    );
  }

  // Idle / all synced
  if (kind) {
    return <p className="text-sm text-fg-muted">{tSync("allSynced_kind")}</p>;
  }
  const time = syncState.lastSyncedAt
    ? new Date(syncState.lastSyncedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  return (
    <p className="text-sm text-fg-muted">
      {tSync("allSynced", { time })}
    </p>
  );
}