"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateWorkoutPainPost } from "@/lib/workouts";
import type { PainSite } from "@/lib/pain-regions";
import { PainPrePostEditor } from "@/components/PainPrePostEditor";

export function PostWorkoutPainCard({
  workoutId,
  prePain,
}: {
  workoutId: string;
  prePain: PainSite[];
}) {
  const t = useTranslations("postPain");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<PainSite[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(prePain.map((s) => ({ ...s })));
  }, [prePain]);

  const onSave = async () => {
    setBusy(true);
    try {
      await updateWorkoutPainPost(workoutId, draft);
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-bg-elev px-4 py-3">
      <div className="text-sm font-medium">{t("title")}</div>
      <p className="mt-1 text-xs text-fg-muted">{t("blurb")}</p>

      <div className="mt-3">
        <PainPrePostEditor sites={draft} onChange={setDraft} />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          data-tap
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {tCommon("save")}
        </button>
      </div>
    </div>
  );
}