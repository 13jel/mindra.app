"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { readIsRestDay, readPainSites, readRestReason, saveCheckIn } from "@/lib/checkins";
import { useCheckIn, useKindFlags, usePreferences } from "@/lib/hooks";
import { todayDate } from "@/lib/workouts";
import type { PainRegionKey, PainSide, PainSite } from "@/lib/pain-regions";
import type { RestReason } from "@/lib/db";
import { PainSiteRow } from "@/components/PainSiteRow";
import { PainSitePicker } from "@/components/PainSitePicker";
import { RestDayToggle } from "@/components/RestDayToggle";

const WORD_OPTIONS: Array<{ key: "good" | "okay" | "tough"; value: number }> = [
  { key: "good", value: 0 },
  { key: "okay", value: 4 },
  { key: "tough", value: 8 },
];

export function CheckInCard({ date }: { date: string }) {
  const t = useTranslations("checkin");
  const tCommon = useTranslations("common");
  const tRegion = useTranslations("painRegion");
  const tRest = useTranslations("restDay");

  const existing = useCheckIn(date);
  const kindFlags = useKindFlags();
  const wordCheckIn = kindFlags?.wordCheckIn ?? false;

  const [pain, setPain] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [showNote, setShowNote] = useState(false);
  const [sites, setSites] = useState<PainSite[]>([]);
  const [isRest, setIsRest] = useState(false);
  const [restReason, setRestReason] = useState<RestReason | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const prefs = usePreferences();
  const kindMasterOn = prefs?.kindMode ?? false;

  useEffect(() => {
    if (existing === undefined) return;
    if (existing) {
      setPain(existing.pain);
      setNote(existing.note);
      setShowNote(existing.note.length > 0);
      setSites(readPainSites(existing));
      setIsRest(readIsRestDay(existing));
      setRestReason(readRestReason(existing));
    } else {
      setPain(0);
      setNote("");
      setShowNote(false);
      setSites([]);
      setIsRest(kindMasterOn);
      setRestReason(null);
    }
    setEditing(false);
  }, [existing, date, kindMasterOn]);

  const isToday = date === todayDate();

  const onSave = async () => {
    setBusy(true);
    try {
      await saveCheckIn({
        date,
        pain,
        note,
        pain_sites: sites,
        is_rest_day: isRest,
        rest_reason: restReason,
      });
      setEditing(false);
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const onAddSite = (region: PainRegionKey, side: PainSide) => {
    setSites((prev) => [...prev, { region, side, intensity: 5 }]);
  };
  const onRemoveSite = (idx: number) => {
    setSites((prev) => prev.filter((_, i) => i !== idx));
  };
  const onSiteIntensity = (idx: number, intensity: number) => {
    setSites((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, intensity } : s)),
    );
  };

  return (
    <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
      <div className="text-sm font-medium">
        {isToday ? t("title") : t("titleOther")}
      </div>

      {existing === undefined ? (
        <div className="mt-3 text-fg-muted text-sm">…</div>
      ) : existing && !editing ? (
        <LoggedView
          pain={existing.pain}
          note={existing.note}
          sites={readPainSites(existing)}
          isRest={readIsRestDay(existing)}
          restReason={readRestReason(existing)}
          tRegion={tRegion}
          tRest={tRest}
          t={t}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <>
          <div className="mt-4">
            <RestDayToggle
              isRest={isRest}
              reason={restReason}
              onChange={(next, r) => {
                setIsRest(next);
                setRestReason(r);
              }}
              hideReason={kindMasterOn}
            />
          </div>

          <div className={isRest ? "mt-6 opacity-90" : "mt-4"}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-fg-muted">{t("painLabel")}</span>
              {!wordCheckIn && (
                <span className="text-sm font-medium tabular-nums">{pain}</span>
              )}
            </div>

            {wordCheckIn ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {WORD_OPTIONS.map((opt) => {
                  const active = pain === opt.value;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPain(opt.value)}
                      data-tap
                      className={[
                        "rounded-md border px-3 py-3 text-sm transition-colors",
                        active
                          ? "border-accent bg-accent/10 font-medium"
                          : "border-border bg-bg hover:border-fg-muted",
                      ].join(" ")}
                    >
                      {t(`word_${opt.key}`)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={pain}
                  onChange={(e) => setPain(Number(e.target.value))}
                  className="mt-2 w-full accent-(--accent)"
                  aria-label={t("painLabel")}
                />
                <div className="mt-1 flex justify-between text-xs text-fg-muted">
                  <span>{t("anchorLow")}</span>
                  <span>{t("anchorHigh")}</span>
                </div>
              </>
            )}

            {sites.length > 0 && (
              <div className="mt-4 space-y-2">
                {sites.map((site, idx) => (
                  <PainSiteRow
                    key={`${site.region}-${site.side}-${idx}`}
                    site={site}
                    onIntensityChange={(n) => onSiteIntensity(idx, n)}
                    onRemove={() => onRemoveSite(idx)}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-3 text-xs text-fg-muted hover:text-fg"
            >
              + {t("addPainSite")}
            </button>

            {showNote ? (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("notePlaceholder")}
                rows={2}
                className="mt-3 w-full resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="mt-3 ml-3 text-xs text-fg-muted hover:text-fg"
              >
                + {t("addNote")}
              </button>
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            {existing && (
              <button
                type="button"
                onClick={() => {
                  if (existing) {
                    setPain(existing.pain);
                    setNote(existing.note);
                    setShowNote(existing.note.length > 0);
                    setSites(readPainSites(existing));
                    setIsRest(readIsRestDay(existing));
                    setRestReason(readRestReason(existing));
                  }
                  setEditing(false);
                }}
                className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
              >
                {tCommon("cancel")}
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              data-tap
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg disabled:opacity-50"
            >
              {existing ? tCommon("save") : t("logCta")}
            </button>
          </div>
        </>
      )}

      <PainSitePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={onAddSite}
        existing={sites.map(({ region, side }) => ({ region, side }))}
      />
    </div>
  );
}

function LoggedView({
  pain,
  note,
  sites,
  isRest,
  restReason,
  tRegion,
  tRest,
  t,
  onEdit,
}: {
  pain: number;
  note: string;
  sites: PainSite[];
  isRest: boolean;
  restReason: RestReason | null;
  tRegion: (k: string) => string;
  tRest: (k: string) => string;
  t: (k: string, vars?: Record<string, string | number | Date>) => string;
  onEdit: () => void;
}) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3">
      <div>
        {isRest && (
          <div className="text-sm font-medium">
            {tRest("badge")}
            {restReason && (
              <span className="ml-2 text-fg-muted text-xs">
                · {tRest(`reason.${restReason}`)}
              </span>
            )}
          </div>
        )}
        <div className={isRest ? "mt-1 text-sm text-fg-muted" : "text-sm text-fg-muted"}>
          {t("painLevel", { value: pain })}
        </div>
        {sites.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-sm text-fg-muted">
            {sites.map((s, i) => (
              <li key={i}>
                {tRegion(s.region)}
                {s.side !== "center" && ` (${s.side})`}: {s.intensity}
              </li>
            ))}
          </ul>
        )}
        {note && (
          <div className="mt-2 text-sm text-fg-muted italic">{note}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-sm text-fg-muted hover:text-fg shrink-0"
      >
        {t("edit")}
      </button>
    </div>
  );
}