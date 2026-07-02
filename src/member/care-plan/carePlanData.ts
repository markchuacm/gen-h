import breakfastBowlImage from "../../../assets/care-plan/breakfast-bowl.png";
import chiaYoghurtImage from "../../../assets/care-plan/chia-yoghurt.png";
import heartHealthFoodImage from "../../../assets/care-plan/heart-health-food.png";
import sleepBedroomImage from "../../../assets/care-plan/sleep-bedroom.png";
import sunlitPlantImage from "../../../assets/care-plan/sunlit-plant.png";
import heroCarePlanImage from "../../../assets/dashboard/care-plan-hero.png";

export type FocusAreaStatus = "Priority" | "Quick win" | "Support";

export type EvidenceItem = {
  label: string;
  value: string;
  context: string;
};

export type CarePlanOption = {
  label: string;
  imageUrl: string;
};

export type CarePlanAction = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  frequency: string;
  linkedBiomarkers: string[];
  whyInPlan: string;
  yourVersion: string;
  whatToDo: {
    intro: string;
    options: CarePlanOption[];
    guidance: string;
  };
  alternatives: string[];
  watchOuts: {
    title: string;
    body: string;
  };
  reviewTiming: string;
  imageUrl: string;
};

export type FocusArea = {
  id: string;
  title: string;
  description: string;
  status: FocusAreaStatus;
  actionsLabel: string;
  imageUrl: string;
  biomarkers: string[];
  levers: string[];
  actions: CarePlanAction[];
};

export type ThisWeekAction = {
  id: string;
  title: string;
  detail: string;
  linkedTo: string;
};

export const carePlanHeroImage = heroCarePlanImage;

export const carePlanSummary = {
  title: "Mark's 90-day cardiometabolic plan",
  subtitle: "Focused on improving glucose stability, ApoB, vitamin D and recovery before your next review.",
};

export const evidenceItems: EvidenceItem[] = [
  { label: "HbA1c", value: "5.8%", context: "Above optimal" },
  { label: "Fasting glucose", value: "101 mg/dL", context: "Morning elevation" },
  { label: "ApoB", value: "112 mg/dL", context: "Cholesterol transport risk" },
  { label: "LDL-C", value: "142 mg/dL", context: "Above target range" },
  { label: "Vitamin D", value: "22 ng/mL", context: "Below optimal" },
  { label: "Sleep", value: "6h 18m", context: "Average weekday duration" },
];

const chiaBreakfastAction: CarePlanAction = {
  id: "chia-breakfast",
  title: "Add 2 tbsp chia seeds to breakfast",
  subtitle: "A fibre lever for LDL-C, ApoB and glucose stability",
  category: "Nutrition",
  frequency: "Daily breakfast",
  linkedBiomarkers: ["LDL-C", "ApoB", "Glucose stability"],
  whyInPlan:
    "This is in your plan because your ApoB and LDL-C are above optimal and your glucose markers suggest you would benefit from steadier post-meal response.",
  yourVersion:
    "For Mark, start with breakfast because it is already a consistent meal. Add chia to yoghurt or overnight oats on weekdays, then keep the same breakfast pattern on travel days when possible.",
  whatToDo: {
    intro: "Add 2 tablespoons of chia seeds to one of the following:",
    options: [
      { label: "Greek yoghurt", imageUrl: chiaYoghurtImage },
      { label: "Overnight oats", imageUrl: breakfastBowlImage },
      { label: "Smoothie", imageUrl: sunlitPlantImage },
      { label: "Soy milk", imageUrl: chiaYoghurtImage },
      { label: "Water with lemon", imageUrl: sunlitPlantImage },
    ],
    guidance: "Start with 1 tbsp daily for the first week, then increase to 2 tbsp.",
  },
  alternatives: [
    "Add psyllium husk before dinner",
    "Add lentils or beans to lunch 3x/week",
    "Swap one refined carb meal for oats, barley or brown rice",
  ],
  watchOuts: {
    title: "Watch-outs",
    body: "Increase your water intake as you increase fibre. If you feel bloated, reduce the amount and build up gradually.",
  },
  reviewTiming: "Review adherence in 2 weeks. Retest ApoB, LDL-C and HbA1c at the 12-week review.",
  imageUrl: chiaYoghurtImage,
};

const vitaminDAction: CarePlanAction = {
  ...chiaBreakfastAction,
  id: "vitamin-d-morning",
  title: "Pair vitamin D with your first meal",
  subtitle: "Repletion support for low vitamin D",
  category: "Supplement routine",
  linkedBiomarkers: ["Vitamin D"],
  whyInPlan:
    "This is in your plan because your vitamin D is below optimal, which can affect immune resilience, mood and recovery quality.",
  yourVersion:
    "For Mark, pair the dose with breakfast so it attaches to an existing habit and is less likely to be missed.",
  reviewTiming: "Recheck vitamin D at the 12-week review, or earlier if your clinician changes the dose.",
  imageUrl: sunlitPlantImage,
};

export const focusAreas: FocusArea[] = [
  {
    id: "glucose-stability",
    title: "Glucose stability",
    description: "HbA1c and fasting glucose point to higher glycaemic load.",
    status: "Priority",
    actionsLabel: "4 actions",
    imageUrl: breakfastBowlImage,
    biomarkers: ["HbA1c 5.8%", "Fasting glucose 101"],
    levers: ["Protein-first breakfast", "Soluble fibre", "Post-meal walks"],
    actions: [chiaBreakfastAction],
  },
  {
    id: "cholesterol-transport",
    title: "Cholesterol transport",
    description: "ApoB and LDL-C suggest more atherogenic particle burden.",
    status: "Priority",
    actionsLabel: "3 actions",
    imageUrl: heartHealthFoodImage,
    biomarkers: ["ApoB 112", "LDL-C 142"],
    levers: ["Fibre target", "Unsaturated fats", "Refined-carb swaps"],
    actions: [chiaBreakfastAction],
  },
  {
    id: "vitamin-d-repletion",
    title: "Vitamin D repletion",
    description: "Vitamin D is below the optimal range for this plan.",
    status: "Quick win",
    actionsLabel: "2 actions",
    imageUrl: sunlitPlantImage,
    biomarkers: ["Vitamin D 22"],
    levers: ["Morning dose routine", "Fat-containing meal", "Retest in 12 weeks"],
    actions: [vitaminDAction],
  },
  {
    id: "recovery-consistency",
    title: "Recovery consistency",
    description: "Weekday sleep duration and recovery rhythm can improve.",
    status: "Support",
    actionsLabel: "3 actions",
    imageUrl: sleepBedroomImage,
    biomarkers: ["Sleep avg 6h 18m", "Low recovery days"],
    levers: ["Consistent bedtime", "Evening light downshift", "Caffeine boundary"],
    actions: [chiaBreakfastAction],
  },
];

export const thisWeekActions: ThisWeekAction[] = [
  {
    id: "chia-breakfast-week",
    title: "Add chia to breakfast 5 days",
    detail: "Start with 1 tbsp, then build to 2 tbsp.",
    linkedTo: "LDL-C, ApoB, glucose stability",
  },
  {
    id: "protein-breakfast-week",
    title: "Make breakfast protein-first",
    detail: "Aim for eggs, Greek yoghurt, tofu or tempeh before starch.",
    linkedTo: "HbA1c, fasting glucose",
  },
  {
    id: "walks-week",
    title: "Walk 10 minutes after lunch",
    detail: "Use the meal with the highest carb load.",
    linkedTo: "Glucose stability",
  },
  {
    id: "vitamin-d-week",
    title: "Take vitamin D with breakfast",
    detail: "Anchor it to your first meal for consistency.",
    linkedTo: "Vitamin D",
  },
  {
    id: "sleep-week",
    title: "Set a 10:45 pm wind-down cue",
    detail: "Dim lights and stop work apps before bed.",
    linkedTo: "Recovery consistency",
  },
];

export const carePlanStats = [
  { id: "focus-areas", value: "4", label: "Priorities", detail: "Derived from markers" },
  { id: "active-actions", value: "12", label: "Actions", detail: "5 to start this week" },
  { id: "linked-markers", value: "6", label: "Inputs", detail: "Biomarkers + recovery" },
  { id: "next-review", value: "12 weeks", label: "Next review", detail: "Aug 20, 2025" },
];
