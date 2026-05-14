import { getTranslations } from "next-intl/server";
import { WorkoutDetail } from "@/components/WorkoutDetail";
import { BackButton } from "@/components/BackButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkoutDetailPage({ params }: Props) {
  const { id } = await params;
  const tWorkout = await getTranslations("workout");

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <BackButton ariaLabel={tWorkout("back")} />
      </div>

      <WorkoutDetail id={id} />
    </section>
  );
}