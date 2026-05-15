import { getTranslations } from "next-intl/server";
import { SettingsControls } from "../../../components/SettingsControls";
import { BackButton } from "../../../components/BackButton";
import { CloudBackupCard } from "@/components/CloudBackupCard";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <BackButton ariaLabel={tCommon("back")} />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <div className="mt-6">
        <CloudBackupCard />
      </div>

      <div className="mt-6">
        <SettingsControls />
      </div>
    </section>
  );
}