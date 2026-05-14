"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { applyPattern, deleteTemplate, renameTemplate } from "@/lib/patterns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Pattern } from "@/lib/db";

function useAllPatterns(): Pattern[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.patterns.toArray();
    return all
      .filter((p) => p.deleted_at === null)
      .sort((a, b) => {
        if (a.is_preset && !b.is_preset) return -1;
        if (!a.is_preset && b.is_preset) return 1;
        return a.name.localeCompare(b.name);
      });
  }, []);
}

export function TemplatesList({ targetDate }: { targetDate?: string } = {}) {
  const t = useTranslations("workoutNew");
  const tCommon = useTranslations("common");
  const tPresets = useTranslations("presets");
  const all = useAllPatterns();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (all === undefined) {
    return <div className="mt-3 text-fg-muted text-sm">…</div>;
  }

  if (all.length === 0) {
    return <p className="mt-3 text-fg-muted text-sm">{t("noTemplates")}</p>;
  }

  const onApply = (id: string) => {
    startTransition(async () => {
      try {
        const newWorkoutId = await applyPattern(id, { date: targetDate });
        toast.success(tCommon("saved"));
        router.push(`/workout/${newWorkoutId}`);
      } catch (err) {
        console.error("[mindra] apply template failed", err);
        toast.error(tCommon("error"));
      }
    });
  };

  return (
    <ul className="mt-3 space-y-2">
      {all.map((p) => (
        <li key={p.id}>
          <TemplateCard
            template={p}
            onApply={() => onApply(p.id)}
            applying={pending}
            resolveName={(key) => {
              try {
                return tPresets(key as never);
              } catch {
                return key;
              }
            }}
            tApply={t("applyTemplate")}
          />
        </li>
      ))}
    </ul>
  );
}

function TemplateCard({
  template,
  onApply,
  applying,
  resolveName,
  tApply,
}: {
  template: Pattern;
  onApply: () => void;
  applying: boolean;
  resolveName: (key: string) => string;
  tApply: string;
}) {
  const t = useTranslations("workoutNew");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(template.name);
  const [busy, setBusy] = useState(false);

  const body = template.body as {
    slug?: string;
    exercises?: { exercise: string; sets: number }[];
  };
  const exercises = body.exercises ?? [];

  // Built-in presets show translated name; user templates show their literal name.
  const displayName = template.is_preset ? resolveName(template.name) : template.name;

  const onRename = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === template.name) {
      setEditing(false);
      setDraft(template.name);
      return;
    }
    setBusy(true);
    try {
      await renameTemplate(template.id, trimmed);
      setEditing(false);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t("deleteTemplateConfirm", { name: displayName }))) return;
    setBusy(true);
    try {
      await deleteTemplate(template.id);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={onRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRename();
                if (e.key === "Escape") {
                  setDraft(template.name);
                  setEditing(false);
                }
              }}
              autoFocus
              className="w-full rounded border border-border bg-bg px-2 py-1 text-base font-medium"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!template.is_preset) setEditing(true);
              }}
              className={[
                "text-left font-medium",
                template.is_preset ? "" : "hover:text-accent",
              ].join(" ")}
            >
              {displayName}
              {!template.is_preset && (
                <span className="ml-2 text-fg-muted text-xs">
                  · {t("customBadge")}
                </span>
              )}
            </button>
          )}
          <ul className="mt-2 space-y-0.5 text-sm text-fg-muted">
            {exercises.map((ex, i) => (
              <li key={i}>
                {ex.sets} × {ex.exercise}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            data-tap
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
          >
            {tApply}
          </button>
            <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={tCommon("delete")}
            className="text-xs text-fg-muted hover:text-danger disabled:opacity-50"
          >
            {tCommon("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}