export const CARE_PLAN_RULESET_VERSION = "2026.07.1";

export type CarePlanCategory = "Nutrition" | "Exercise" | "Supplements" | "Sleep";
export type ResultStatus = "optimal" | "at_risk" | "needs_attention";

export type CarePlanEvidence = {
  biomarkerCode: string;
  displayName: string;
  value: number | string | null;
  unit: string | null;
  status: ResultStatus;
  reportId: string;
  collectedAt: string | null;
};

export type ProposedAction = {
  id: string;
  templateId: string;
  title: string;
  lifestyleCategory: CarePlanCategory;
  instruction: string;
  rationale: string;
  moreGuidance: string;
  doctorRecommended: boolean;
  safetyNote?: string;
};

export type GeneratedFocusArea = {
  templateKey: string;
  basisType: "results" | "prevention";
  title: string;
  summary: string;
  doctorNote: string;
  imageKey: string;
  evidence: CarePlanEvidence[];
  profileBasis: string[];
  proposedActions: ProposedAction[];
};

type ActionRule = Omit<ProposedAction, "id" | "templateId" | "doctorRecommended"> & {
  id: string;
  profileTags?: string[];
  excludeWhen?: string[];
};

type FocusRule = {
  id: string;
  title: string;
  summary: string;
  doctorNote: string;
  imageKey: string;
  priority: number;
  biomarkerCodes: string[];
  profileTags: string[];
  actions: ActionRule[];
};

export type CarePlanEngineInput = {
  biomarkers: CarePlanEvidence[];
  profile: Record<string, unknown>;
};

const action = (
  id: string,
  title: string,
  lifestyleCategory: CarePlanCategory,
  instruction: string,
  rationale: string,
  moreGuidance: string,
  extra: Pick<ActionRule, "profileTags" | "excludeWhen" | "safetyNote"> = {},
): ActionRule => ({ id, title, lifestyleCategory, instruction, rationale, moreGuidance, ...extra });

export const CARE_PLAN_FOCUS_RULES: readonly FocusRule[] = [
  {
    id: "cardiovascular-health",
    title: "Cardiovascular health",
    summary: "Improve cholesterol transport and inflammation with repeatable food and movement changes.",
    doctorNote: "Your lipid picture responds best to consistent changes that are realistic enough to keep.",
    imageKey: "heart-health-food",
    priority: 100,
    biomarkerCodes: [
      "apolipoprotein-b-apob", "apolipoprotein-b-a1-ratio", "ldl-cholesterol",
      "non-hdl-cholesterol", "total-cholesterol", "triglycerides",
      "high-sensitivity-c-reactive-protein-hs-crp",
    ],
    profileTags: ["heart disease", "high cholesterol", "hyperlipidaemia", "longevity"],
    actions: [
      action("soluble-fibre", "Add a soluble-fibre anchor daily", "Nutrition",
        "Include oats, barley, beans, lentils or psyllium in at least one meal every day.",
        "Soluble fibre supports lower LDL cholesterol and ApoB.",
        "Pick one dependable meal and rotate sources so the habit remains easy."),
      action("fat-swap", "Upgrade your default fats", "Nutrition",
        "Choose grilled foods, fish, nuts, seeds or olive oil more often than deep-fried options.",
        "Improving fat quality supports a healthier lipid pattern.",
        "This is a default-setting change, not a ban on favourite foods.", { profileTags: ["mostly eating out"] }),
      action("zone-two", "Build 150 minutes of steady cardio", "Exercise",
        "Build toward 150 minutes of brisk walking, cycling or swimming across the week.",
        "Steady aerobic work supports lipid clearance and cardiovascular fitness.",
        "Three longer sessions or five shorter sessions both count."),
      action("fish", "Add two oily-fish meals weekly", "Nutrition",
        "Include sardines, salmon, mackerel or ikan kembung twice each week.",
        "Oily fish improves the overall fat quality of the week.",
        "Grilled, steamed and soup-based preparations all work."),
    ],
  },
  {
    id: "glucose-stability",
    title: "Glucose stability",
    summary: "Flatten glucose swings with steadier meals and light movement after eating.",
    doctorNote: "The first move is not a restrictive diet. We will make the meals with the biggest impact steadier.",
    imageKey: "breakfast-bowl",
    priority: 95,
    biomarkerCodes: ["hemoglobin-a1c-hba1c", "glucose", "insulin", "triglycerides", "glucose-urine"],
    profileTags: ["blood sugar", "diabetes", "body composition", "low energy", "afternoon crash"],
    actions: [
      action("protein-breakfast", "Make breakfast protein-first", "Nutrition",
        "Start the day with a protein anchor before toast, noodles or rice.",
        "Protein first helps slow the morning glucose rise.",
        "Eggs, Greek yoghurt, tofu, tempeh or a simple protein shake all count."),
      action("pair-carbs", "Pair carbohydrates with protein or fibre", "Nutrition",
        "When eating rice, noodles or bread, add protein and a fibre-rich side.",
        "Mixed meals digest more slowly and help flatten post-meal glucose.",
        "You do not need to remove carbohydrates; the pairing is the intervention."),
      action("post-meal-walk", "Walk 10 minutes after your largest meal", "Exercise",
        "Within 30 minutes of your largest meal, take an easy 10-minute walk.",
        "Working muscle clears glucose from the blood quickly.",
        "A covered walkway, mall loop or short neighbourhood walk all count."),
      action("sweet-drinks", "Set a weekly sweet-drink allowance", "Nutrition",
        "Choose up to three sweet drinks for the week and make the rest kurang manis or kosong.",
        "Liquid sugar is a direct and high-impact lever for glucose exposure.",
        "Keep the drinks you genuinely enjoy and let the automatic ones go."),
    ],
  },
  {
    id: "nutrient-status",
    title: "Nutrient status",
    summary: "Rebuild measurable nutrient inputs with a simple food-first and supplement routine.",
    doctorNote: "We will make the repletion plan visible, specific and easy to repeat, then reassess it.",
    imageKey: "sunlit-plant",
    priority: 88,
    biomarkerCodes: [
      "vitamin-d", "vitamin-b12", "folate", "ferritin", "iron",
      "iron-percent-saturation", "magnesium",
    ],
    profileTags: ["low energy", "frequent illness", "slow recovery", "vitamin"],
    actions: [
      action("iron-food", "Add an iron-rich food most days", "Nutrition",
        "Include meat, sardines, spinach, tofu or legumes in a meal on most days.",
        "Iron-rich foods support recovery when iron stores are low.",
        "Pair plant sources with vitamin C and keep tea or coffee away from that meal."),
      action("vitamin-d", "Take the agreed vitamin D dose with food", "Supplements",
        "Take the clinician-agreed vitamin D dose with a meal at the same time each day.",
        "Consistency is the main driver of repletion.",
        "Do not double a missed dose; resume at the next scheduled time.",
        { excludeWhen: ["vitamin d toxicity"], safetyNote: "Confirm the dose, current supplements and follow-up test date." }),
      action("morning-light", "Get 10 minutes of morning daylight", "Sleep",
        "Spend 10 minutes outside within an hour of waking on most days.",
        "Morning light supports circadian timing, alertness and sleep quality.",
        "A balcony, walk to transport or outdoor coffee all count."),
      action("food-variety", "Add two nutrient-dense foods this week", "Nutrition",
        "Choose two repeatable additions such as eggs, legumes, leafy greens, yoghurt, nuts or fish.",
        "A wider range of whole foods improves nutrient coverage.",
        "Add foods to meals you already eat rather than redesigning the whole week."),
    ],
  },
  {
    id: "thyroid-energy",
    title: "Energy & thyroid",
    summary: "Support daytime energy while your doctor follows the thyroid markers that need attention.",
    doctorNote: "Fatigue is rarely one thing, so we will support the measurable inputs and keep the routine simple.",
    imageKey: "sunlit-plant",
    priority: 86,
    biomarkerCodes: [
      "thyroid-stimulating-hormone-tsh", "free-thyroxine-free-t4",
      "free-triiodothyronine-free-t3", "cortisol",
    ],
    profileTags: ["low energy", "brain fog", "poor focus", "thyroid"],
    actions: [
      action("sleep-window", "Protect a consistent sleep window", "Sleep",
        "Keep bedtime and wake time within the same 60-minute window on most days.",
        "Regular sleep timing supports energy and hormone rhythms.",
        "Anchor the wake time first if work makes bedtime less predictable."),
      action("protein-meals", "Include protein at each main meal", "Nutrition",
        "Add a palm-sized protein source to each main meal.",
        "Adequate protein supports steadier energy, recovery and lean mass.",
        "Eggs, tofu, tempeh, fish, chicken, yoghurt and legumes all count."),
      action("strength", "Complete two strength sessions weekly", "Exercise",
        "Do two 30–45 minute full-body strength sessions each week.",
        "Strength work supports energy regulation, glucose handling and function.",
        "Use machines, weights or bodyweight according to current ability."),
      action("caffeine-cutoff", "Set a caffeine cutoff", "Sleep",
        "Keep coffee, tea and energy drinks before 2pm.",
        "Earlier caffeine timing protects sleep depth and next-day energy.",
        "Step the cutoff earlier gradually if caffeine is currently used late."),
    ],
  },
  {
    id: "sleep-recovery",
    title: "Sleep & recovery",
    summary: "Create a calmer, more consistent evening and a stronger morning rhythm.",
    doctorNote: "Better sleep comes from a few reliable cues, not a perfect nighttime routine.",
    imageKey: "sleep-bedroom",
    priority: 70,
    biomarkerCodes: [],
    profileTags: ["sleep", "poor sleep", "stress", "low energy", "anxiety", "irritability"],
    actions: [
      action("lights-out", "Set a consistent lights-out time", "Sleep",
        "Choose a lights-out time you can keep within 30 minutes on at least five nights.",
        "A stable sleep window improves circadian consistency.",
        "Use a wind-down alarm 45 minutes beforehand."),
      action("screens", "Keep screens out of the last 30 minutes", "Sleep",
        "Put phone and laptop away for the final 30 minutes before bed.",
        "Reducing stimulation makes it easier to transition into sleep.",
        "Charge the phone away from the bed and choose one low-effort replacement."),
      action("morning-light", "Get morning daylight", "Sleep",
        "Spend 10 minutes outdoors within an hour of waking.",
        "Morning light anchors the body clock for alertness and sleep.",
        "Attach it to coffee, the school run or the first commute leg."),
      action("downtime", "Schedule 10 minutes of deliberate downtime", "Sleep",
        "Take 10 phone-free minutes to walk, breathe, stretch or sit quietly each day.",
        "A regular downshift supports recovery from sustained stress.",
        "Put it immediately after a routine transition such as work or dinner."),
    ],
  },
  {
    id: "movement-foundations",
    title: "Movement foundations",
    summary: "Build a realistic weekly base of walking, strength and aerobic movement.",
    doctorNote: "The best movement plan is the one that fits your current week and can grow gradually.",
    imageKey: "heart-health-food",
    priority: 60,
    biomarkerCodes: [],
    profileTags: ["fitness", "performance", "body composition", "exercise", "0 days", "1–2"],
    actions: [
      action("step-floor", "Set a daily step floor", "Exercise",
        "Choose a realistic daily floor and add 1,000 steps to your current average.",
        "A modest, consistent increase improves total weekly movement.",
        "Use short walks and routine errands rather than relying on one long session."),
      action("strength-two", "Anchor two strength sessions", "Exercise",
        "Place two full-body strength sessions into fixed weekly time slots.",
        "Strength work supports muscle, bone and metabolic health.",
        "Start with 30 minutes and leave a rest day between sessions."),
      action("zone-two", "Add two steady cardio sessions", "Exercise",
        "Complete two 30-minute brisk walks, rides or swims each week.",
        "Steady aerobic work builds cardiovascular capacity.",
        "The pace should let you speak in short sentences."),
      action("sitting-breaks", "Break up long sitting every hour", "Exercise",
        "Stand or walk for two to five minutes at least once each hour.",
        "Frequent movement breaks reduce long sedentary stretches.",
        "Use calls, water refills or calendar prompts as cues."),
    ],
  },
  {
    id: "nutrition-foundations",
    title: "Nutrition foundations",
    summary: "Improve the default plate without turning the next 12 weeks into a restrictive diet.",
    doctorNote: "We will focus on additions and useful swaps that work with how you actually eat.",
    imageKey: "breakfast-bowl",
    priority: 55,
    biomarkerCodes: [],
    profileTags: ["nutrition", "diet", "mostly eating out", "body composition", "energy", "longevity"],
    actions: [
      action("protein", "Add a protein anchor to each main meal", "Nutrition",
        "Include a palm-sized protein source at breakfast, lunch and dinner.",
        "Protein supports fullness, recovery and lean mass.",
        "Choose eggs, tofu, tempeh, fish, chicken, yoghurt or legumes."),
      action("vegetables", "Make vegetables half of one daily meal", "Nutrition",
        "Fill half the plate with vegetables at one dependable meal each day.",
        "Vegetables add fibre, volume and micronutrient variety.",
        "Start with the meal where vegetables are easiest to order or prepare."),
      action("water", "Keep water visible through the day", "Nutrition",
        "Keep a filled bottle at your desk or in your bag and refill it once.",
        "A visible cue makes hydration more reliable than relying on memory.",
        "Use a bottle size that makes the daily target easy to see."),
      action("home-meal", "Choose one dependable home-style meal", "Nutrition",
        "Repeat one balanced, minimally processed meal at least three times each week.",
        "A dependable default reduces decision load while improving food quality.",
        "It can be bought rather than cooked; consistency matters more than perfection."),
    ],
  },
] as const;

function flattenProfile(profile: Record<string, unknown>): string {
  const values: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string" || typeof value === "number") values.push(String(value));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(visit);
  };
  visit(profile);
  return values.join(" ").toLowerCase();
}

function profileSignals(profile: Record<string, unknown>): string[] {
  const signals: string[] = [];
  for (const [key, value] of Object.entries(profile)) {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (["identity", "reports", "basics"].includes(key)) continue;
    const text = Array.isArray(value)
      ? value.filter((entry) => typeof entry === "string").join(", ")
      : typeof value === "object"
        ? Object.values(value as Record<string, unknown>).filter((entry) => typeof entry === "string" || typeof entry === "number").join(", ")
        : String(value);
    if (text) signals.push(`${key}: ${text}`);
  }
  return signals.slice(0, 6);
}

function rankedActions(rule: FocusRule, profileText: string): ProposedAction[] {
  return rule.actions
    .filter((candidate) => !(candidate.excludeWhen ?? []).some((term) => profileText.includes(term)))
    .map((candidate, index) => ({
      candidate,
      index,
      score: (candidate.profileTags ?? []).filter((tag) => profileText.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ candidate }) => ({
      id: `${rule.id}:${candidate.id}`,
      templateId: candidate.id,
      title: candidate.title,
      lifestyleCategory: candidate.lifestyleCategory,
      instruction: candidate.instruction,
      rationale: candidate.rationale,
      moreGuidance: candidate.moreGuidance,
      doctorRecommended: false,
      ...(candidate.safetyNote ? { safetyNote: candidate.safetyNote } : {}),
    }));
}

function severity(evidence: CarePlanEvidence[]): number {
  return evidence.some((item) => item.status === "needs_attention") ? 2
    : evidence.some((item) => item.status === "at_risk") ? 1 : 0;
}

export function buildCarePlanDraft(input: CarePlanEngineInput): {
  mode: "results" | "prevention";
  sections: GeneratedFocusArea[];
} {
  const profileText = flattenProfile(input.profile);
  const flagged = input.biomarkers.filter((item) =>
    item.status === "at_risk" || item.status === "needs_attention",
  );

  const resultCandidates = CARE_PLAN_FOCUS_RULES
    .filter((rule) => rule.biomarkerCodes.length > 0)
    .map((rule) => ({
      rule,
      evidence: flagged.filter((item) => rule.biomarkerCodes.includes(item.biomarkerCode)),
    }))
    .filter((candidate) => candidate.evidence.length > 0)
    .sort((a, b) =>
      severity(b.evidence) - severity(a.evidence)
      || b.rule.priority - a.rule.priority
      || b.evidence.length - a.evidence.length
      || a.rule.id.localeCompare(b.rule.id),
    )
    .slice(0, 4);

  const selected = [...resultCandidates];
  const preventionRules = CARE_PLAN_FOCUS_RULES
    .filter((rule) => rule.biomarkerCodes.length === 0)
    .map((rule) => ({
      rule,
      score: rule.profileTags.filter((tag) => profileText.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority || a.rule.id.localeCompare(b.rule.id));

  for (const { rule } of preventionRules) {
    if (selected.length >= 3) break;
    selected.push({ rule, evidence: [] });
  }

  return {
    mode: resultCandidates.length > 0 ? "results" : "prevention",
    sections: selected.slice(0, 4).map(({ rule, evidence }) => ({
      templateKey: rule.id,
      basisType: evidence.length > 0 ? "results" : "prevention",
      title: rule.title,
      summary: rule.summary,
      doctorNote: rule.doctorNote,
      imageKey: rule.imageKey,
      evidence,
      profileBasis: evidence.length > 0 ? [] : profileSignals(input.profile),
      proposedActions: rankedActions(rule, profileText),
    })),
  };
}
