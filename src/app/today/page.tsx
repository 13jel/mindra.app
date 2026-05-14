"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKindT } from "@/lib/kind-t";
import { CheckInCard } from "@/components/CheckInCard";
import { TodayContent } from "@/components/TodayContent";
import { DateStepper } from "@/components/DateStepper";
import { todayDate } from "@/lib/workouts";

function isValidDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayDate();
}

export default function TodayPage() {
  const t = useKindT("today");
  
  const params = useSearchParams();
  const initial = params.get("date");
  const [date, setDate] = useState<string>(
    isValidDate(initial) ? initial : todayDate(),
  );

  // If the URL date changes after mount (e.g. user comes from /calendar
  // with a new ?date), reflect it. We don't keep the URL in sync going
  // the other way — that would cause history-spam as the user steps days.
  useEffect(() => {
    const next = params.get("date");
    if (isValidDate(next) && next !== date) {
      setDate(next);
    }
    // intentionally not listing `date` — we want URL → state, not vice versa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <section className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <DateStepper date={date} onChange={setDate} />
      <CheckInCard date={date} />
      <TodayContent date={date} />
    </section>
  );
}