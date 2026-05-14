import { getTranslations } from "next-intl/server";
import { LibraryList } from "@/components/LibraryList";
import { TemplatesList } from "@/components/TemplatesList";

export default async function WorkoutPage() {
  const t = await getTranslations("workout");

  return (
    <section className="px-4 pt-6 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <div>
        <h2 className="text-sm font-medium text-fg-muted">{t("templatesSection")}</h2>
        <TemplatesList />
      </div>

      <div>
        <h2 className="text-sm font-medium text-fg-muted">{t("librarySection")}</h2>
        <LibraryList />
      </div>
    </section>
  );
}