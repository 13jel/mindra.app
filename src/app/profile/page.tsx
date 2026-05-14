import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProfileControls } from "@/components/ProfileControls";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

export default async function ProfilePage() {
  const t = await getTranslations("profile");

  return (
    <section className="px-4 pt-6 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <ProfileControls />

        <div className="mt-4">
          <Link
            href="/profile/settings"
            className="block rounded-md border border-border bg-bg-elev px-4 py-3 text-sm hover:border-fg-muted"
            data-tap
          >
            {t("openSettings")} →
          </Link>
        </div>

      <div>
        <h2 className="text-sm font-medium text-fg-muted mb-3">
          {t("aboutSection")}
        </h2>
        <MedicalDisclaimer variant="card" />
      </div>
    </section>
  );
}