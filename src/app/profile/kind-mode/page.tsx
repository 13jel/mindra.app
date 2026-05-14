import { getTranslations } from "next-intl/server";
import { KindModeControls } from "@/components/KindModeControls";
import { BackButton } from "@/components/BackButton";

export default async function KindModePage() {
  const t = await getTranslations("kindMode");
  const tCommon = await getTranslations("common");

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <BackButton ariaLabel={tCommon("back")} />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <p className="mt-4 text-sm text-fg-muted">{t("blurb")}</p>

      <div className="mt-6">
        <KindModeControls />
      </div>
    </section>
  );
}