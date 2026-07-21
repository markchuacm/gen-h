// Curated starting points for care-plan authoring: focus-area templates and a
// per-category library of common actions. Everything here is a draft the
// doctor edits — inserting never writes to the database by itself.
//
// Marker strings must be exact biomarker catalog displayNames: the member app
// links each marker chip to the results screen by that name. Enforced by
// carePlanLibrary.test.ts against server/seeds/biomarker-catalog.json.
import type { CarePlanActionData } from "../lib/api/carePlan";
import type { DraftSection } from "../lib/api/doctor";

export type LifestyleCategory = CarePlanActionData["lifestyleCategory"];

/** A library action is a CarePlanActionData without identity — an id is minted
    each time it's inserted so repeated use never collides. */
export type LibraryAction = Omit<CarePlanActionData, "id">;

export type LibraryTemplate = {
  id: string;
  title: string;
  summary: string;
  markers: string[];
  doctorNote: string;
  /** carePlanAssets SECTION_IMAGE_OPTIONS key — the member-facing image the
      template starts with (the doctor can still change it per section). */
  imageKey: string;
  actions: LibraryAction[];
};

export function instantiateAction(action: LibraryAction): CarePlanActionData {
  return { ...action, id: crypto.randomUUID() };
}

export function instantiateTemplate(template: LibraryTemplate, order: number): DraftSection {
  return {
    sort_order: order,
    title: template.title,
    summary: template.summary,
    markers: [...template.markers],
    doctor_note: template.doctorNote,
    image_key: template.imageKey,
    actions: template.actions.map(instantiateAction),
  };
}

export const FOCUS_AREA_TEMPLATES: LibraryTemplate[] = [
  {
    id: "cardiovascular",
    imageKey: "heart-health-food",
    title: "Cardiovascular health",
    summary:
      "Food swaps that raise soluble fibre and improve fat quality, plus steady aerobic work, to bring ApoB and LDL cholesterol down.",
    markers: ["Apolipoprotein B", "LDL Cholesterol", "High-Sensitivity C-Reactive Protein"],
    doctorNote:
      "Your lipid picture responds well to consistent, unglamorous changes. I'd rather you make three food swaps you can keep than attempt a strict diet for six weeks and stop.",
    actions: [
      {
        title: "Add a soluble-fibre anchor daily",
        lifestyleCategory: "Nutrition",
        instruction: "Include oats, barley, beans, lentils or psyllium in at least one meal every day.",
        rationale: "Soluble fibre binds cholesterol in the gut and reliably lowers LDL and ApoB.",
        moreGuidance:
          "Rotate the sources so it doesn't get boring: overnight oats, dhal with lunch, a bean side at dinner. If food is hard on a given day, a teaspoon of psyllium in water covers it.",
      },
      {
        title: "Swap deep-fried for grilled or steamed",
        lifestyleCategory: "Nutrition",
        instruction: "When there's a choice, pick the grilled, steamed or soup version over the fried one.",
        rationale: "Cutting repeated-frying oils improves fat quality, which shows up in LDL and inflammation markers.",
        moreGuidance:
          "This is a default-setting exercise, not a ban. Keep fried food for the meals that are genuinely worth it and let the automatic ones go.",
      },
      {
        title: "Accumulate 150 minutes of zone-2 cardio",
        lifestyleCategory: "Exercise",
        instruction: "Across the week, build up 150 minutes of brisk walking, cycling or swimming at a pace where you can still talk.",
        rationale: "Steady aerobic work improves lipid clearance and directly reduces cardiovascular risk.",
        moreGuidance:
          "Five 30-minute sessions is the classic split, but three 50-minute ones count just as well. Attach it to something fixed — a commute leg, a lunchtime loop, a podcast you only allow on walks.",
      },
    ],
  },
  {
    id: "metabolic",
    imageKey: "breakfast-bowl",
    title: "Glucose stability",
    summary:
      "Steadier meals and light movement after eating to flatten glucose spikes and move HbA1c over the next 12 weeks.",
    markers: ["Hemoglobin A1c", "Glucose", "Insulin"],
    doctorNote:
      "The first move here is not a restrictive diet. I want your breakfasts, drinks and largest meal to become steadier, because those are the moments most likely to move your HbA1c.",
    actions: [
      {
        title: "Make breakfast protein-first",
        lifestyleCategory: "Nutrition",
        instruction: "Start the day with a protein anchor before toast, noodles or rice.",
        rationale: "Protein first slows the morning glucose rise that feeds into HbA1c.",
        moreGuidance:
          "Half-boiled eggs, Greek yoghurt, tofu, tempeh or a simple protein shake all count. If breakfast is out, order the protein first and treat starch as the side.",
      },
      {
        title: "Pair carbs with protein or fibre",
        lifestyleCategory: "Nutrition",
        instruction: "When you eat rice, noodles or bread, add protein and a fibre side in the same meal.",
        rationale: "Mixed meals digest more slowly, which flattens post-meal glucose.",
        moreGuidance:
          "Extra egg, tofu, fish, chicken, dhal or vegetables is enough. You don't need to remove carbs; the pairing is the intervention.",
      },
      {
        title: "Walk 10 minutes after your largest meal",
        lifestyleCategory: "Exercise",
        instruction: "Within 30 minutes of your largest meal, walk easily for 10 minutes.",
        rationale: "Working muscle clears glucose from the blood quickly, even without a workout.",
        moreGuidance:
          "Make it intentionally easy — a covered walkway, mall loop or farther coffee stop all count. If lunch is rushed, do it after dinner instead.",
      },
    ],
  },
  {
    id: "energy-thyroid",
    imageKey: "sunlit-plant",
    title: "Energy & thyroid",
    summary:
      "Rebuilding the inputs behind daytime energy — iron, vitamin D and thyroid support — alongside a consistent morning routine.",
    markers: ["Thyroid-Stimulating Hormone", "Ferritin", "Vitamin D"],
    doctorNote:
      "Fatigue is rarely one thing. We're addressing the measurable inputs first — iron stores, vitamin D and thyroid function — while keeping your mornings consistent enough for the changes to show.",
    actions: [
      {
        title: "Add an iron-rich food most days",
        lifestyleCategory: "Nutrition",
        instruction: "Include red meat, liver, sardines, spinach or legumes in a meal on most days of the week.",
        rationale: "Low ferritin is one of the most common reversible causes of persistent tiredness.",
        moreGuidance:
          "Pair plant sources with vitamin C (citrus, tomato, capsicum) to improve absorption, and keep tea and coffee an hour away from those meals.",
      },
      {
        title: "Get 10 minutes of morning daylight",
        lifestyleCategory: "Sleep",
        instruction: "Within an hour of waking, spend 10 minutes outside or by a bright window.",
        rationale: "Morning light anchors your circadian rhythm, which drives daytime energy and night-time sleep pressure.",
        moreGuidance:
          "Combine it with something you already do — coffee outside, the first phone calls on a balcony, parking slightly farther away.",
      },
      {
        title: "Take vitamin D with your largest meal",
        lifestyleCategory: "Supplements",
        instruction: "Take the vitamin D dose we agreed with a meal that contains some fat.",
        rationale: "Vitamin D is fat-soluble; taking it with food meaningfully improves absorption.",
        moreGuidance:
          "Consistency beats timing precision. If your largest meal moves around, tie the dose to whichever meal is most reliable.",
      },
    ],
  },
  {
    id: "sleep",
    imageKey: "sleep-bedroom",
    title: "Sleep quality",
    summary:
      "A consistent wind-down and a cooler, darker room to extend deep sleep — the base layer under every other marker.",
    markers: ["Cortisol", "Magnesium"],
    doctorNote:
      "Before we optimise anything else, I want your sleep window protected. Most of the markers we're tracking improve on their own once you're consistently getting seven hours.",
    actions: [
      {
        title: "Fix a consistent lights-out time",
        lifestyleCategory: "Sleep",
        instruction: "Pick a lights-out time that allows 7–8 hours and keep it within 30 minutes, including weekends.",
        rationale: "A stable sleep window does more for sleep quality than any single gadget or supplement.",
        moreGuidance:
          "Work backwards from your wake time. Set a 'start winding down' alarm 45 minutes before, and treat the weekend drift as the main thing to defend against.",
      },
      {
        title: "No caffeine after 2pm",
        lifestyleCategory: "Nutrition",
        instruction: "Keep coffee, tea and energy drinks to before 2pm.",
        rationale: "Caffeine's half-life means an afternoon dose is still active at bedtime, cutting deep sleep.",
        moreGuidance:
          "If the afternoon slump is the trigger, swap in a short walk, sparkling water or a decaf version rather than pushing through on willpower.",
      },
      {
        title: "Screens out of the last 30 minutes",
        lifestyleCategory: "Sleep",
        instruction: "End the day with 30 screen-free minutes — reading, stretching, or prepping tomorrow.",
        rationale: "Late light and stimulation delay melatonin and push your effective bedtime later.",
        moreGuidance:
          "Charge the phone outside the bedroom if you can. If it has to be in the room, night mode plus a hard 'no feeds in bed' rule is the workable compromise.",
      },
    ],
  },
  {
    id: "stress",
    imageKey: "sleep-bedroom",
    title: "Stress & recovery",
    summary:
      "Small, repeatable decompression habits to bring cortisol down and recovery up — without adding another obligation to the calendar.",
    markers: ["Cortisol", "DHEA-Sulfate"],
    doctorNote:
      "We're not trying to remove stress — we're building recovery into the day so it stops accumulating. Ten deliberate minutes daily beats a monthly retreat.",
    actions: [
      {
        title: "Ten minutes of deliberate downtime daily",
        lifestyleCategory: "Sleep",
        instruction: "Block 10 minutes a day for breathing, a slow walk, prayer or simply sitting without input.",
        rationale: "Brief daily parasympathetic time measurably lowers baseline cortisol over weeks.",
        moreGuidance:
          "Attach it to an existing seam in the day — after lunch, arriving home, before the evening shower. Guided breathing apps work if silence feels impossible at first.",
      },
      {
        title: "Two strength sessions a week",
        lifestyleCategory: "Exercise",
        instruction: "Do two 30–45 minute strength sessions each week — gym, bodyweight or bands.",
        rationale: "Strength training improves stress resilience and supports DHEA and metabolic health together.",
        moreGuidance:
          "Full-body basics are enough: squat, push, pull, hinge. Booking the sessions like meetings is what makes this one survive busy weeks.",
      },
      {
        title: "Hard stop on work at a set time",
        lifestyleCategory: "Sleep",
        instruction: "Choose an end-of-work time on weekdays and close the laptop at it.",
        rationale: "An unbounded workday keeps cortisol elevated into the evening and delays sleep onset.",
        moreGuidance:
          "Make the stop visible: a shutdown note for tomorrow, then physically putting the laptop away. Protect at least four such evenings a week.",
      },
    ],
  },
  {
    id: "hormones",
    imageKey: "chia-yoghurt",
    title: "Hormone balance",
    summary:
      "Sleep, strength work and body-composition changes — the three levers with the best evidence for healthy hormone levels.",
    markers: ["Total Testosterone", "Sex Hormone Binding Globulin", "Estradiol"],
    doctorNote:
      "Hormones respond to the fundamentals more than most people expect. Before considering anything pharmaceutical, I want twelve weeks of sleep, strength and steady nutrition — then we retest.",
    actions: [
      {
        title: "Protect 7+ hours of sleep",
        lifestyleCategory: "Sleep",
        instruction: "Treat a 7–8 hour sleep window as non-negotiable on at least five nights a week.",
        rationale: "Most hormone production is sleep-gated; chronic short sleep suppresses it directly.",
        moreGuidance:
          "If you only change one thing this quarter, make it this. Track it simply — nights that hit the window per week — rather than chasing sleep scores.",
      },
      {
        title: "Three strength sessions a week",
        lifestyleCategory: "Exercise",
        instruction: "Train with weights or resistance three times a week, prioritising large muscle groups.",
        rationale: "Resistance training is the most reliable non-pharmaceutical lever for testosterone and SHBG balance.",
        moreGuidance:
          "Compound movements first, isolation second. If three sessions won't fit, two hard full-body sessions beat three rushed ones.",
      },
      {
        title: "Eat enough protein and fat",
        lifestyleCategory: "Nutrition",
        instruction: "Aim for a palm of protein per meal and don't strip fat below roughly a quarter of intake.",
        rationale: "Very-low-fat and low-protein patterns both suppress hormone production.",
        moreGuidance:
          "Eggs, fish, meat, tofu and dairy cover both at once. Aggressive cutting diets are the usual culprit here — moderate deficit only, if fat loss is also a goal.",
      },
    ],
  },
  {
    id: "nutrients",
    imageKey: "chia-yoghurt",
    title: "Nutrient status",
    summary:
      "Filling the measured gaps — vitamin D, iron, magnesium and B-vitamin status — through food first, supplements where the numbers say so.",
    markers: ["Vitamin D", "Ferritin", "Magnesium", "Homocysteine"],
    doctorNote:
      "These are the deficiencies your results actually show, so this section is deliberately boring: food first, a small number of supplements, retest in twelve weeks.",
    actions: [
      {
        title: "Two servings of oily fish a week",
        lifestyleCategory: "Nutrition",
        instruction: "Eat salmon, sardines, mackerel or similar twice a week.",
        rationale: "Oily fish is the most efficient food source for omega-3 status.",
        moreGuidance:
          "Canned sardines and frozen salmon count fully — this doesn't need to be expensive or fancy. If fish twice a week is unrealistic, we'll cover it with the omega-3 supplement instead.",
      },
      {
        title: "Take the agreed supplement stack with food",
        lifestyleCategory: "Supplements",
        instruction: "Take the supplements we agreed (per your plan) with meals, at the same times each day.",
        rationale: "Absorption and consistency both improve when doses ride along with existing meals.",
        moreGuidance:
          "Put them where the meal happens — desk drawer for lunch doses, kitchen counter for dinner ones. A missed day is fine; a missed fortnight is what we're avoiding.",
      },
      {
        title: "Magnesium-rich dinner sides",
        lifestyleCategory: "Nutrition",
        instruction: "Add leafy greens, nuts, seeds or legumes to dinner most nights.",
        rationale: "Dietary magnesium supports sleep quality and muscle recovery alongside the measured level.",
        moreGuidance:
          "A handful of nuts, a spinach side or dhal all do the job. This pairs well with the sleep work — magnesium status and sleep quality reinforce each other.",
      },
    ],
  },
  {
    id: "fitness",
    imageKey: "sunlit-plant",
    title: "Fitness & body composition",
    summary:
      "A simple weekly training structure plus protein targets to shift body composition without an aggressive diet.",
    markers: ["Hemoglobin A1c", "Triglycerides", "HDL Cholesterol"],
    doctorNote:
      "Body composition moves on a 12-week horizon, not a 2-week one. The structure below is intentionally modest — the goal is a routine that survives your busiest week, because that's the one that decides the result.",
    actions: [
      {
        title: "Anchor three training days",
        lifestyleCategory: "Exercise",
        instruction: "Fix three training days a week: two strength, one cardio, booked into the calendar.",
        rationale: "Muscle drives resting metabolism and glucose disposal; structure is what makes it accumulate.",
        moreGuidance:
          "Same days, same times, every week. If a session collapses, a 15-minute bodyweight fallback at home still counts — the streak matters more than the volume.",
      },
      {
        title: "A palm of protein at every meal",
        lifestyleCategory: "Nutrition",
        instruction: "Include a palm-sized protein portion in each main meal.",
        rationale: "Adequate protein preserves muscle in a deficit and blunts the appetite swings that break diets.",
        moreGuidance:
          "Distribute it across the day rather than loading dinner. Eggs, chicken, fish, tofu, tempeh, Greek yoghurt — variety keeps it sustainable.",
      },
      {
        title: "Daily step floor of 7,000",
        lifestyleCategory: "Exercise",
        instruction: "Hit at least 7,000 steps every day, tracked however is easiest.",
        rationale: "Ambient movement is the largest controllable slice of daily energy expenditure.",
        moreGuidance:
          "The floor matters more than the ceiling — 7,000 every day beats 15,000 twice a week. Stairs, a walked errand and one loop after dinner usually get you there.",
      },
    ],
  },
  {
    id: "longevity",
    imageKey: "heart-health-food",
    title: "Longevity foundations",
    summary:
      "The prevention basics with the strongest evidence — lipids, glucose, inflammation — folded into habits that compound quietly for decades.",
    markers: ["Apolipoprotein B", "Hemoglobin A1c", "High-Sensitivity C-Reactive Protein"],
    doctorNote:
      "Nothing here is dramatic, and that's the point. The markers in this section predict long-term risk better than how you feel day to day, and every one of them bends to consistent habits.",
    actions: [
      {
        title: "Build the weekly movement base",
        lifestyleCategory: "Exercise",
        instruction: "Combine 150 minutes of zone-2 cardio with two strength sessions each week.",
        rationale: "This combination has the strongest all-cause mortality evidence of any lifestyle intervention.",
        moreGuidance:
          "Treat it as one system, not five workouts: cardio maintains the engine, strength maintains the frame. Anything on top is bonus, not requirement.",
      },
      {
        title: "Mediterranean-style default plate",
        lifestyleCategory: "Nutrition",
        instruction: "Default to vegetables, legumes, whole grains, fish and olive oil; keep processed meat occasional.",
        rationale: "This eating pattern has the most consistent evidence for lipid, glucose and inflammation outcomes together.",
        moreGuidance:
          "Local food fits this better than people assume — fish dishes, dhal, vegetable-heavy plates and ulam are all on-pattern. It's a default, not a rulebook.",
      },
      {
        title: "One alcohol-free stretch per week",
        lifestyleCategory: "Nutrition",
        instruction: "Keep at least three consecutive alcohol-free days each week.",
        rationale: "Regular alcohol-free days improve liver markers, sleep architecture and triglycerides.",
        moreGuidance:
          "Consecutive days matter more than the weekly total — they give the liver and your sleep a genuine recovery window.",
      },
    ],
  },
];

/** Standalone actions the doctor can drop into any section, grouped by the
    member app's four lifestyle categories. */
export const LIBRARY_ACTIONS: Record<LifestyleCategory, LibraryAction[]> = {
  Nutrition: [
    {
      title: "Make breakfast protein-first",
      lifestyleCategory: "Nutrition",
      instruction: "Start the day with a protein anchor before toast, noodles or rice.",
      rationale: "Protein first slows the morning glucose rise and steadies appetite for the day.",
      moreGuidance:
        "Half-boiled eggs, Greek yoghurt, tofu, tempeh or a protein shake all count. Eating out, order the protein first and treat starch as the side.",
    },
    {
      title: "Limit sweet drinks to three a week",
      lifestyleCategory: "Nutrition",
      instruction: "Keep three sweet drinks for the week and make the rest less sweet or unsweetened.",
      rationale: "Liquid sugar is the fastest glucose load and a direct lever on HbA1c and triglycerides.",
      moreGuidance:
        "Choose the three you actually enjoy and let the automatic ones go. Step down gradually: normal, then less sugar, then unsweetened or sparkling water.",
    },
    {
      title: "Add a soluble-fibre anchor daily",
      lifestyleCategory: "Nutrition",
      instruction: "Include oats, barley, beans, lentils or psyllium in at least one meal every day.",
      rationale: "Soluble fibre binds cholesterol in the gut and reliably lowers LDL and ApoB.",
      moreGuidance:
        "Rotate sources so it doesn't get boring. On a hard day, a teaspoon of psyllium in water covers it.",
    },
    {
      title: "Two servings of oily fish a week",
      lifestyleCategory: "Nutrition",
      instruction: "Eat salmon, sardines, mackerel or similar twice a week.",
      rationale: "Oily fish is the most efficient food source for omega-3 status and triglyceride control.",
      moreGuidance: "Canned and frozen count fully. If twice a week is unrealistic, an omega-3 supplement can stand in.",
    },
    {
      title: "A palm of protein at every meal",
      lifestyleCategory: "Nutrition",
      instruction: "Include a palm-sized protein portion in each main meal.",
      rationale: "Adequate, distributed protein preserves muscle and blunts appetite swings.",
      moreGuidance:
        "Spread it across the day rather than loading dinner. Eggs, chicken, fish, tofu, tempeh and Greek yoghurt keep it varied.",
    },
    {
      title: "No caffeine after 2pm",
      lifestyleCategory: "Nutrition",
      instruction: "Keep coffee, tea and energy drinks to before 2pm.",
      rationale: "Caffeine's half-life means afternoon doses are still active at bedtime, cutting deep sleep.",
      moreGuidance: "Swap the afternoon slump for a short walk, sparkling water or decaf rather than willpower.",
    },
    {
      title: "One alcohol-free stretch per week",
      lifestyleCategory: "Nutrition",
      instruction: "Keep at least three consecutive alcohol-free days each week.",
      rationale: "Consecutive dry days improve liver markers, sleep architecture and triglycerides.",
      moreGuidance: "The consecutive window matters more than the weekly count — it gives the liver genuine recovery time.",
    },
  ],
  Exercise: [
    {
      title: "Walk 10 minutes after your largest meal",
      lifestyleCategory: "Exercise",
      instruction: "Within 30 minutes of your largest meal, walk easily for 10 minutes.",
      rationale: "Working muscle clears glucose from the blood quickly, even without a workout.",
      moreGuidance: "Keep it deliberately easy — a covered walkway, mall loop or farther coffee stop all count.",
    },
    {
      title: "Accumulate 150 minutes of zone-2 cardio",
      lifestyleCategory: "Exercise",
      instruction: "Across the week, build 150 minutes of brisk walking, cycling or swimming at a conversational pace.",
      rationale: "Steady aerobic work improves lipid clearance, glucose control and long-term cardiovascular risk.",
      moreGuidance: "Five 30-minute or three 50-minute sessions both work. Attach them to fixed points in the week.",
    },
    {
      title: "Two strength sessions a week",
      lifestyleCategory: "Exercise",
      instruction: "Do two 30–45 minute strength sessions each week — gym, bodyweight or bands.",
      rationale: "Muscle drives resting metabolism, glucose disposal and healthy hormone levels.",
      moreGuidance: "Full-body basics are enough: squat, push, pull, hinge. Book them like meetings.",
    },
    {
      title: "Daily step floor of 7,000",
      lifestyleCategory: "Exercise",
      instruction: "Hit at least 7,000 steps every day, tracked however is easiest.",
      rationale: "Ambient movement is the largest controllable slice of daily energy expenditure.",
      moreGuidance: "The floor beats the ceiling — 7,000 daily beats 15,000 twice a week.",
    },
    {
      title: "Break up long sitting hourly",
      lifestyleCategory: "Exercise",
      instruction: "Stand and move for 2–3 minutes at least once an hour during desk time.",
      rationale: "Regular movement breaks improve post-meal glucose and counter the metabolic cost of sitting.",
      moreGuidance: "Tie it to existing interruptions — calls taken standing, water refills, a stair loop between meetings.",
    },
    {
      title: "One longer outdoor session weekly",
      lifestyleCategory: "Exercise",
      instruction: "Once a week, take a 60+ minute hike, ride or long walk outdoors.",
      rationale: "A weekly longer session builds aerobic base and doubles as stress recovery.",
      moreGuidance: "Make it social if that helps it stick — the company is what protects the slot.",
    },
  ],
  Supplements: [
    {
      title: "Take vitamin D with your largest meal",
      lifestyleCategory: "Supplements",
      instruction: "Take the agreed vitamin D dose with a meal containing some fat.",
      rationale: "Vitamin D is fat-soluble; taking it with food meaningfully improves absorption.",
      moreGuidance: "Consistency beats timing precision — tie it to whichever meal is most reliable.",
    },
    {
      title: "Omega-3 daily with food",
      lifestyleCategory: "Supplements",
      instruction: "Take the agreed omega-3 dose daily, with a meal.",
      rationale: "Omega-3 supports triglycerides and the omega-3 index when fish intake alone falls short.",
      moreGuidance: "Keep it refrigerated if burps are an issue, or take it with the evening meal.",
    },
    {
      title: "Magnesium in the evening",
      lifestyleCategory: "Supplements",
      instruction: "Take the agreed magnesium dose 1–2 hours before bed.",
      rationale: "Evening magnesium supports sleep quality alongside correcting the measured level.",
      moreGuidance: "Glycinate or citrate forms are gentlest; reduce the dose if digestion objects.",
    },
    {
      title: "Creatine 3–5g daily",
      lifestyleCategory: "Supplements",
      instruction: "Take 3–5g of creatine monohydrate daily, any time of day.",
      rationale: "Creatine is the best-evidenced supplement for strength, lean mass and cognitive support.",
      moreGuidance: "No loading phase needed. Mix into anything; daily consistency is the only rule.",
    },
    {
      title: "Keep the stack visible",
      lifestyleCategory: "Supplements",
      instruction: "Store supplements where the paired meal happens, and restock before running out.",
      rationale: "Adherence, not selection, is where most supplement plans fail.",
      moreGuidance: "A weekly pill organiser filled every Sunday takes the daily decision out of it entirely.",
    },
    {
      title: "Pause new supplements before retest",
      lifestyleCategory: "Supplements",
      instruction: "Don't add anything new to the stack in the two weeks before your retest.",
      rationale: "A stable stack means the retest measures the plan, not the latest addition.",
      moreGuidance: "Note anything you're curious about and bring it to the review instead.",
    },
  ],
  Sleep: [
    {
      title: "Fix a consistent lights-out time",
      lifestyleCategory: "Sleep",
      instruction: "Pick a lights-out time allowing 7–8 hours and keep it within 30 minutes, weekends included.",
      rationale: "A stable sleep window does more for sleep quality than any gadget or supplement.",
      moreGuidance: "Work backwards from wake time and set a wind-down alarm 45 minutes before.",
    },
    {
      title: "Get 10 minutes of morning daylight",
      lifestyleCategory: "Sleep",
      instruction: "Within an hour of waking, spend 10 minutes outside or by a bright window.",
      rationale: "Morning light anchors the circadian rhythm that drives night-time sleep pressure.",
      moreGuidance: "Stack it on an existing habit — coffee outside, first calls on the balcony.",
    },
    {
      title: "Screens out of the last 30 minutes",
      lifestyleCategory: "Sleep",
      instruction: "End the day with 30 screen-free minutes — reading, stretching or prepping tomorrow.",
      rationale: "Late light and stimulation delay melatonin and push your effective bedtime later.",
      moreGuidance: "Charge the phone outside the bedroom if possible; 'no feeds in bed' is the fallback rule.",
    },
    {
      title: "Cool, dark room setup",
      lifestyleCategory: "Sleep",
      instruction: "Set the bedroom cooler than the rest of the house and block light sources.",
      rationale: "Core temperature drop and darkness are the two strongest physical triggers for deep sleep.",
      moreGuidance: "Aircon timer, blackout curtains or an eye mask — one-off changes that pay out nightly.",
    },
    {
      title: "Ten minutes of deliberate downtime daily",
      lifestyleCategory: "Sleep",
      instruction: "Block 10 minutes a day for breathing, a slow walk, prayer or sitting without input.",
      rationale: "Brief daily parasympathetic time measurably lowers baseline cortisol over weeks.",
      moreGuidance: "Attach it to a seam in the day — after lunch, arriving home, before the evening shower.",
    },
    {
      title: "Hard stop on work at a set time",
      lifestyleCategory: "Sleep",
      instruction: "Choose an end-of-work time on weekdays and close the laptop at it.",
      rationale: "An unbounded workday keeps cortisol elevated into the evening and delays sleep onset.",
      moreGuidance: "A shutdown note for tomorrow, then the laptop physically away. Protect four evenings a week.",
    },
  ],
};
