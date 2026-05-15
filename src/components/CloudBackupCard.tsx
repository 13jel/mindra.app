"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthUser } from "@/lib/auth";

export function CloudBackupCard() {
  const t = useTranslations("cloud");
  const tCommon = useTranslations("common");
  const user = useAuthUser();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  if (user === undefined) {
    return (
      <div className="rounded-md border border-border bg-bg-elev p-4 text-sm text-fg-muted">
        …
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-md border border-border bg-bg-elev p-4">
        <div className="text-sm font-medium">{t("signedInTitle")}</div>
        <div className="mt-1 text-xs text-fg-muted">{user.email}</div>
        <p className="mt-3 text-sm text-fg-muted">{t("signedInBlurb")}</p>
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