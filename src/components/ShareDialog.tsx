"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { Exercise, Workout, WorkoutSet } from "@/lib/db";
import { ShareCard } from "./ShareCard";
import { pickQuoteId } from "@/lib/quotes";
import type { HeadlineMode } from "./ShareCard";
import { usePreferences, useKindFlags } from "@/lib/hooks";

type Group = { exercise: Exercise; sets: WorkoutSet[] };

type Props = {
  workout: Workout;
  groups: Group[];
  open: boolean;
  onClose: () => void;
};

export function ShareDialog({ workout, groups, open, onClose }: Props) {
  const t = useTranslations("share");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const prefs = usePreferences();
  const units = prefs?.units ?? "metric";
  const kindFlags = useKindFlags();
  const hideTotals = kindFlags?.hideTotals ?? false;
  const hideCounts = kindFlags?.hideCounts ?? false;

  const cardRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [includeNote, setIncludeNote] = useState(false);

  const [headlineMode, setHeadlineMode] = useState<HeadlineMode>("date");
  const [quoteId, setQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (open && quoteId === null) {
      setQuoteId(pickQuoteId());
    }
    if (!open) {
      setQuoteId(null);
    }
  }, [open, quoteId]);

  const tQuotes = useTranslations("quotes");
  const quote = quoteId
    ? tQuotes(quoteId as Parameters<typeof tQuotes>[0])
    : null;

  const hasNote = workout.note.trim().length > 0;

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setGenerating(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (cancelled || !cardRef.current) return;
        try {
          const dataUrl = await toPng(cardRef.current, {
            pixelRatio: 1,
            cacheBust: true,
          });
          if (!cancelled) setPreviewUrl(dataUrl);
        } catch (err) {
          console.error("[mindra] share render failed", err);
          if (!cancelled) toast.error(tCommon("error"));
        } finally {
          if (!cancelled) setGenerating(false);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    groups,
    workout,
    tCommon,
    includeNote,
    headlineMode,
    quoteId,
    units,
    hideTotals,
    hideCounts,
  ]);

  const onDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `mindra-${workout.date}.png`;
    a.click();
  };

  const onNativeShare = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], `mindra-${workout.date}.png`, {
        type: "image/png",
      });
      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });
      if (canShareFiles) {
        await navigator.share({ files: [file] });
      } else {
        onDownload();
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[mindra] share failed", err);
      toast.error(tCommon("error"));
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <ShareCard
          ref={cardRef}
          workout={workout}
          groups={groups}
          locale={locale}
          units={units}
          includeNote={includeNote}
          headlineMode={headlineMode}
          quote={quote}
          hideTotals={hideTotals}
          hideCounts={hideCounts}
        />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-t-xl bg-bg border border-border p-4 sm:rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t("title")}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-fg-muted hover:text-fg"
              aria-label={tCommon("cancel")}
            >
              ×
            </button>
          </div>

          <div className="mt-4 aspect-square overflow-hidden rounded-md border border-border bg-bg-elev">
            {generating || !previewUrl ? (
              <div className="flex h-full items-center justify-center text-fg-muted text-sm">
                {t("generating")}
              </div>
            ) : (
              <img
                src={previewUrl}
                alt={t("title")}
                className="h-full w-full object-contain"
              />
            )}
          </div>

          <div className="mt-4 rounded-md border border-border bg-bg-elev p-3">
            <div className="text-sm font-medium">{t("headlineLabel")}</div>
            <div className="mt-2 flex gap-3 text-sm">
              {(["date", "quote", "both"] as const).map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="headlineMode"
                    value={mode}
                    checked={headlineMode === mode}
                    onChange={() => setHeadlineMode(mode)}
                  />
                  <span>{t(`headline_${mode}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {hasNote && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={includeNote}
                onChange={(e) => setIncludeNote(e.target.checked)}
                className="h-4 w-4"
              />
              <span>{t("includeNote")}</span>
            </label>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onDownload}
              disabled={!previewUrl}
              data-tap
              className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              {t("download")}
            </button>
            <button
              type="button"
              onClick={onNativeShare}
              disabled={!previewUrl}
              data-tap
              className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-50"
            >
              {t("share")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}