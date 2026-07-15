import breakfastBowlImage from "../../../../assets/care-plan/breakfast-bowl.png";
import chiaYoghurtImage from "../../../../assets/care-plan/chia-yoghurt.png";
import heartHealthFoodImage from "../../../../assets/care-plan/heart-health-food.png";
import sleepBedroomImage from "../../../../assets/care-plan/sleep-bedroom.png";
import sunlitPlantImage from "../../../../assets/care-plan/sunlit-plant.png";
import farheenAvatarImage from "../../../../assets/dashboard/doctors/farheen-nafisa-avatar.png";
// Placeholder crops reused until dedicated action photography exists.
import heartMetabolicImage from "../../../../assets/biomarkers/heart-metabolic-hd.png";
import agingStressImage from "../../../../assets/biomarkers/aging-stress-hd.png";
import nutrientsVitaminsImage from "../../../../assets/biomarkers/nutrients-vitamins-hd.png";
import lifestyleImpactsImage from "../../../../assets/future-health/lifestyle-impacts.png";
import morningMountainImage from "../../../../assets/genh-hero-mountain.jpg";

export type LifestyleCategory = "Nutrition" | "Exercise" | "Supplements" | "Sleep";
// Section ids are DB uuids at runtime; the demo constants below use slugs.
export type FocusAreaId = string;

export type CarePlanAction = {
  id: string;
  title: string;
  lifestyleCategory: LifestyleCategory;
  focusAreaId: FocusAreaId;
  thumbnailUrl: string;
  instruction: string;
  rationale: string;
  moreGuidance: string;
};

export type FocusArea = {
  id: FocusAreaId;
  title: string;
  overviewImageUrl: string;
  detailImageUrl: string;
  summary: string;
  /** Biomarkers this focus area is built around — shown as reference chips. */
  markers: string[];
  doctorNote: {
    doctorName: string;
    avatarUrl: string;
    note: string;
  };
  actions: CarePlanAction[];
};

const doctor = {
  doctorName: "Dr. Farheen Nafisa",
  avatarUrl: farheenAvatarImage,
};

export const lifestyleCategoryOrder: LifestyleCategory[] = ["Nutrition", "Exercise", "Supplements", "Sleep"];

export const focusAreas: FocusArea[] = [
  {
    id: "glucose-stability",
    title: "Glucose stability",
    overviewImageUrl: breakfastBowlImage,
    detailImageUrl: breakfastBowlImage,
    summary:
      "Steadier meals and light movement to reduce glucose spikes and support Mark's HbA1c and fasting glucose trend.",
    markers: ["HbA1c", "Fasting glucose"],
    doctorNote: {
      ...doctor,
      note:
        "Mark, your glucose markers suggest the first move is not a restrictive diet. I want your breakfasts, drinks and largest meal to become steadier, because those are the moments most likely to move your HbA1c over the next 90 days.",
    },
    actions: [
      {
        id: "protein-first-breakfast",
        title: "Make breakfast protein-first",
        lifestyleCategory: "Nutrition",
        focusAreaId: "glucose-stability",
        thumbnailUrl: breakfastBowlImage,
        instruction: "Start weekdays with a protein anchor before toast, noodles or rice.",
        rationale: "Protein first slows the glucose rise that shows up in your HbA1c and morning glucose.",
        moreGuidance:
          "Keep this practical: half-boiled eggs, Greek yoghurt, tofu, tempeh or a simple protein shake all count. If breakfast is out, order the protein first and treat starch as the side rather than the base.",
      },
      {
        id: "pair-carbs",
        title: "Pair carbs with protein or fibre",
        lifestyleCategory: "Nutrition",
        focusAreaId: "glucose-stability",
        thumbnailUrl: chiaYoghurtImage,
        instruction: "When you eat rice, noodles or bread, add protein and a fibre side in the same meal.",
        rationale: "Mixed meals digest more slowly, which helps flatten post-meal glucose.",
        moreGuidance:
          "At hawker meals, this can be as simple as extra egg, tofu, fish, chicken, dhal, vegetables or ulam. You do not need to remove carbs; the pairing is the intervention.",
      },
      {
        id: "sweet-drinks",
        title: "Limit sweet drinks to three a week",
        lifestyleCategory: "Nutrition",
        focusAreaId: "glucose-stability",
        thumbnailUrl: heartMetabolicImage,
        instruction: "Keep three sweet drinks for the week and make the rest kurang manis or kosong.",
        rationale: "Liquid sugar is the fastest glucose load and is a direct lever for HbA1c.",
        moreGuidance:
          "Choose the three drinks you actually enjoy and let the automatic ones go. Step down gradually if needed: normal, then kurang manis, then kosong or sparkling water.",
      },
      {
        id: "walk-after-largest-meal",
        title: "Walk 10 minutes after your largest meal",
        lifestyleCategory: "Exercise",
        focusAreaId: "glucose-stability",
        thumbnailUrl: lifestyleImpactsImage,
        instruction: "Within 30 minutes of your largest meal, walk easily for 10 minutes.",
        rationale: "Working muscle clears glucose from the blood quickly, even without a workout.",
        moreGuidance:
          "Make this intentionally easy. A covered walkway, mall loop, stair loop or farther coffee stop all count. If lunch is rushed, do it after dinner instead.",
      },
    ],
  },
  {
    id: "cholesterol-support",
    title: "Cholesterol support",
    overviewImageUrl: heartHealthFoodImage,
    detailImageUrl: heartHealthFoodImage,
    summary:
      "Food swaps that increase soluble fibre and improve fat quality to support ApoB and LDL-C.",
    markers: ["ApoB", "LDL cholesterol"],
    doctorNote: {
      ...doctor,
      note:
        "Mark, your ApoB and LDL-C point to cholesterol transport as a real priority. I want the plan to feel food-based and repeatable first: more soluble fibre, better fat defaults and less refined carbohydrate load.",
    },
    actions: [
      {
        id: "soluble-fibre",
        title: "Add soluble fibre daily",
        lifestyleCategory: "Nutrition",
        focusAreaId: "cholesterol-support",
        thumbnailUrl: chiaYoghurtImage,
        instruction: "Add one soluble-fibre anchor daily: chia, oats, psyllium, lentils or beans.",
        rationale: "Soluble fibre binds cholesterol in the gut, supporting lower LDL-C and ApoB.",
        moreGuidance:
          "Start with 1 tablespoon of chia or psyllium, or one serving of oats, dhal, lentils or beans. Increase water as fibre rises so the habit feels good, not bloating-heavy.",
      },
      {
        id: "upgrade-fats",
        title: "Upgrade your default fats",
        lifestyleCategory: "Nutrition",
        focusAreaId: "cholesterol-support",
        thumbnailUrl: heartHealthFoodImage,
        instruction: "Choose avocado, olive oil, nuts, seeds or fish more often than fried sides.",
        rationale: "Better fat quality helps shift LDL-C without making meals feel clinical.",
        moreGuidance:
          "This is a default-setting change. Keep favourite fried meals occasionally, but let grilled, soup-based, roasted or unsaturated-fat options be the normal choice.",
      },
      {
        id: "whole-food-carbs",
        title: "Choose whole-food carbs once daily",
        lifestyleCategory: "Nutrition",
        focusAreaId: "cholesterol-support",
        thumbnailUrl: heartHealthFoodImage,
        instruction: "Swap one refined-carb serving for oats, barley, brown rice, beans or lentils.",
        rationale: "Less refined carbohydrate load supports both ApoB and glucose stability.",
        moreGuidance:
          "Pick one predictable meal, not every meal. Breakfast oats, dhal at lunch, brown rice at dinner or beans in a bowl are all enough to start.",
      },
      {
        id: "fish-meal",
        title: "Add one oily fish meal weekly",
        lifestyleCategory: "Nutrition",
        focusAreaId: "cholesterol-support",
        thumbnailUrl: heartMetabolicImage,
        instruction: "Eat one serving of salmon, sardines, mackerel or ikan kembung each week.",
        rationale: "Oily fish supports cardiometabolic health and improves the overall fat profile of the week.",
        moreGuidance:
          "Use local options where possible. Grilled ikan kembung or sardines are useful, accessible choices. Keep the preparation simple rather than deep-fried.",
      },
    ],
  },
  {
    id: "vitamin-d-repletion",
    title: "Vitamin D repletion",
    overviewImageUrl: sunlitPlantImage,
    detailImageUrl: sunlitPlantImage,
    summary:
      "A simple repletion routine to correct low vitamin D and support immunity, energy and recovery.",
    markers: ["Vitamin D"],
    doctorNote: {
      ...doctor,
      note:
        "Mark, vitamin D is the quickest win in this plan. I want you to make the dose visible and boringly consistent, then we can reassess your level after the plan period.",
    },
    actions: [
      {
        id: "vitamin-d-breakfast",
        title: "Take vitamin D with breakfast",
        lifestyleCategory: "Supplements",
        focusAreaId: "vitamin-d-repletion",
        thumbnailUrl: breakfastBowlImage,
        instruction: "Take vitamin D with your first meal each day.",
        rationale: "Daily consistency is the main driver of repletion from a low baseline.",
        moreGuidance:
          "Attach it to something you already do: breakfast, morning kopi, or the kettle. Do not double up if you miss a day; just restart the next morning.",
      },
      {
        id: "fat-containing-meal",
        title: "Pair the dose with fat",
        lifestyleCategory: "Supplements",
        focusAreaId: "vitamin-d-repletion",
        thumbnailUrl: heartHealthFoodImage,
        instruction: "Take the dose with a meal containing eggs, yoghurt, avocado, nuts or olive oil.",
        rationale: "Vitamin D is fat-soluble, so absorption is better with a fat-containing meal.",
        moreGuidance:
          "This does not require a heavy meal. A few nuts, yoghurt, egg or avocado is enough. If breakfast is very light, move the dose to lunch.",
      },
      {
        id: "keep-visible",
        title: "Keep the supplement visible",
        lifestyleCategory: "Supplements",
        focusAreaId: "vitamin-d-repletion",
        thumbnailUrl: nutrientsVitaminsImage,
        instruction: "Place the bottle where your morning routine already happens.",
        rationale: "Visibility reduces missed doses more reliably than motivation.",
        moreGuidance:
          "Good locations are beside the kettle, coffee beans, toothbrush or breakfast bowl. The goal is to see it before you need to remember it.",
      },
    ],
  },
  {
    id: "recovery-rhythm",
    title: "Recovery rhythm",
    overviewImageUrl: sleepBedroomImage,
    detailImageUrl: sleepBedroomImage,
    summary:
      "A steadier evening and morning rhythm to lift weekday sleep duration and recovery consistency.",
    markers: ["Cortisol", "hs-CRP"],
    doctorNote: {
      ...doctor,
      note:
        "Mark, sleep is not separate from the cardiometabolic work. Short weekday sleep can make glucose control and food choices harder the next day, so this focus area is here to make the rest of the plan easier.",
    },
    actions: [
      {
        id: "wind-down-cue",
        title: "Set a 10:45 pm wind-down cue",
        lifestyleCategory: "Sleep",
        focusAreaId: "recovery-rhythm",
        thumbnailUrl: sleepBedroomImage,
        instruction: "At 10:45 pm, dim lights and move work apps out of reach.",
        rationale: "A consistent cue protects the extra sleep your weekday average needs.",
        moreGuidance:
          "Keep the cue small: dim the living room, put the phone on a shelf, close the laptop and read a few pages. The repeatable sequence matters more than perfection.",
      },
      {
        id: "reduce-bright-light",
        title: "Reduce bright light after 10 pm",
        lifestyleCategory: "Sleep",
        focusAreaId: "recovery-rhythm",
        thumbnailUrl: sleepBedroomImage,
        instruction: "Switch to warmer, lower light in the last hour before bed.",
        rationale: "Lower light makes it easier for your body clock to shift into sleep mode.",
        moreGuidance:
          "Use lamps instead of overhead lights, lower phone brightness and avoid work dashboards late. This is a recovery cue, not a productivity rule.",
      },
      {
        id: "consistent-wake-time",
        title: "Keep wake time within one hour",
        lifestyleCategory: "Sleep",
        focusAreaId: "recovery-rhythm",
        thumbnailUrl: morningMountainImage,
        instruction: "Keep weekend wake time within one hour of weekdays.",
        rationale: "A steadier wake time anchors sleep rhythm and makes bedtime easier.",
        moreGuidance:
          "If you need more recovery, use a short nap rather than a long lie-in. The aim is rhythm, not rigidity.",
      },
      {
        id: "caffeine-boundary",
        title: "Set a 2 pm caffeine boundary",
        lifestyleCategory: "Sleep",
        focusAreaId: "recovery-rhythm",
        thumbnailUrl: agingStressImage,
        instruction: "Keep caffeine before 2 pm, then switch to non-caffeinated drinks.",
        rationale: "Late caffeine can reduce sleep depth even when you still fall asleep.",
        moreGuidance:
          "Keep your morning coffee. This is mainly about the afternoon cup. If the 4 pm slump hits, try a short walk or sparkling water first.",
      },
    ],
  },
];
