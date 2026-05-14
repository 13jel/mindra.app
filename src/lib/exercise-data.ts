export type ExerciseCategory =
  | "compound"
  | "upperPush"
  | "upperPull"
  | "legs"
  | "core"
  | "isolation"
  | "rehab"
  | "mobility";

export type ExerciseSeed = {
  slug: string;
  name_key: string;
  category: ExerciseCategory;
};

export const EXERCISE_SEEDS: ExerciseSeed[] = [
  { slug: "squat", name_key: "squat", category: "compound" },
  { slug: "deadlift", name_key: "deadlift", category: "compound" },
  { slug: "benchPress", name_key: "benchPress", category: "compound" },
  { slug: "overheadPress", name_key: "overheadPress", category: "compound" },
  { slug: "row", name_key: "row", category: "compound" },
  { slug: "pullUp", name_key: "pullUp", category: "compound" },
  { slug: "chinUp", name_key: "chinUp", category: "compound" },
  { slug: "dip", name_key: "dip", category: "compound" },

  { slug: "inclineBenchPress", name_key: "inclineBenchPress", category: "upperPush" },
  { slug: "dumbbellPress", name_key: "dumbbellPress", category: "upperPush" },
  { slug: "pushUp", name_key: "pushUp", category: "upperPush" },
  { slug: "lateralRaise", name_key: "lateralRaise", category: "upperPush" },
  { slug: "tricepsPushdown", name_key: "tricepsPushdown", category: "upperPush" },

  { slug: "latPulldown", name_key: "latPulldown", category: "upperPull" },
  { slug: "seatedRow", name_key: "seatedRow", category: "upperPull" },
  { slug: "facePull", name_key: "facePull", category: "upperPull" },
  { slug: "bicepsCurl", name_key: "bicepsCurl", category: "upperPull" },
  { slug: "hammerCurl", name_key: "hammerCurl", category: "upperPull" },

  { slug: "romanianDeadlift", name_key: "romanianDeadlift", category: "legs" },
  { slug: "frontSquat", name_key: "frontSquat", category: "legs" },
  { slug: "bulgarianSplitSquat", name_key: "bulgarianSplitSquat", category: "legs" },
  { slug: "legPress", name_key: "legPress", category: "legs" },
  { slug: "legExtension", name_key: "legExtension", category: "legs" },
  { slug: "legCurl", name_key: "legCurl", category: "legs" },
  { slug: "lunge", name_key: "lunge", category: "legs" },
  { slug: "hipThrust", name_key: "hipThrust", category: "legs" },
  { slug: "calfRaise", name_key: "calfRaise", category: "legs" },

  { slug: "plank", name_key: "plank", category: "core" },
  { slug: "deadBug", name_key: "deadBug", category: "core" },
  { slug: "birdDog", name_key: "birdDog", category: "core" },
  { slug: "sidePlank", name_key: "sidePlank", category: "core" },
  { slug: "hangingLegRaise", name_key: "hangingLegRaise", category: "core" },

  { slug: "gluteBridge", name_key: "gluteBridge", category: "rehab" },
  { slug: "clamshell", name_key: "clamshell", category: "rehab" },
  { slug: "bandedSidewalk", name_key: "bandedSidewalk", category: "rehab" },
  { slug: "scapularPullUp", name_key: "scapularPullUp", category: "rehab" },
  { slug: "externalRotation", name_key: "externalRotation", category: "rehab" },
  { slug: "wallSlide", name_key: "wallSlide", category: "rehab" },
  { slug: "calfRaiseSingleLeg", name_key: "calfRaiseSingleLeg", category: "rehab" },
  { slug: "nordicCurl", name_key: "nordicCurl", category: "rehab" },

  { slug: "hipFlexorStretch", name_key: "hipFlexorStretch", category: "mobility" },
  { slug: "thoracicRotation", name_key: "thoracicRotation", category: "mobility" },
  { slug: "catCow", name_key: "catCow", category: "mobility" },
  { slug: "couchStretch", name_key: "couchStretch", category: "mobility" },

  { slug: "rowingMachine", name_key: "rowingMachine", category: "isolation" },
  { slug: "assaultBike", name_key: "assaultBike", category: "isolation" },
];

export const CATEGORY_ORDER: ExerciseCategory[] = [
  "compound",
  "upperPush",
  "upperPull",
  "legs",
  "core",
  "isolation",
  "rehab",
  "mobility",
];