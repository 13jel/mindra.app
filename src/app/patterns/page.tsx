import { getTranslations } from "next-intl/server";
import { PainStrip } from "@/components/PainStrip";
import { PainLineChart } from "@/components/PainLineChart";
import { StatsRow } from "@/components/StatsRow";
import { RegionCharts } from "@/components/RegionCharts";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

export default async function PatternsPage() {
  const t = await getTranslations("patterns");

  return (
    <section className="px-4 pt-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <StatsRow />

      <div>
        <h2 className="text-sm font-medium text-fg-muted">{t("stripTitle")}</h2>
        <div className="mt-2">
          <PainStrip days={30} />
        </div>
      </div>

      <PainLineChart />

      <RegionCharts />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-fg-muted">{t("comingSoonHeader")}</h2>
        <FuturePoint
          title={t("ideas.exerciseTitle")}
          body={t("ideas.exerciseBody")}
        />
      </div>

      <div className="pt-2 border-t border-border">
        <MedicalDisclaimer variant="footer" />
      </div>
    </section>
  );
}

function FuturePoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-bg-elev px-4 py-3">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 text-sm text-fg-muted">{body}</p>
    </div>
  );
}