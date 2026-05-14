export type PresetExercise = {
  exercise: string;
  sets: number;
  default_reps: number | null;
};

export type PresetBody = {
  exercises: PresetExercise[];
};

export type PresetSeed = {
  slug: string;
  name_key: string;
  body: PresetBody;
};

export const PRESETS: PresetSeed[] = [
  {
    slug: "full-body-3",
    name_key: "fullBody3",
    body: {
      exercises: [
        { exercise: "Squat", sets: 3, default_reps: 5 },
        { exercise: "Bench Press", sets: 3, default_reps: 5 },
        { exercise: "Row", sets: 3, default_reps: 8 },
      ],
    },
  },
  {
    slug: "push",
    name_key: "push",
    body: {
      exercises: [
        { exercise: "Bench Press", sets: 4, default_reps: 6 },
        { exercise: "Overhead Press", sets: 3, default_reps: 8 },
        { exercise: "Incline Dumbbell Press", sets: 3, default_reps: 10 },
        { exercise: "Triceps Pushdown", sets: 3, default_reps: 12 },
      ],
    },
  },
  {
    slug: "pull",
    name_key: "pull",
    body: {
      exercises: [
        { exercise: "Deadlift", sets: 3, default_reps: 5 },
        { exercise: "Pull-up", sets: 3, default_reps: 8 },
        { exercise: "Row", sets: 3, default_reps: 10 },
        { exercise: "Biceps Curl", sets: 3, default_reps: 12 },
      ],
    },
  },
  {
    slug: "legs",
    name_key: "legs",
    body: {
      exercises: [
        { exercise: "Squat", sets: 4, default_reps: 6 },
        { exercise: "Romanian Deadlift", sets: 3, default_reps: 8 },
        { exercise: "Leg Press", sets: 3, default_reps: 12 },
        { exercise: "Calf Raise", sets: 4, default_reps: 15 },
      ],
    },
  },
];