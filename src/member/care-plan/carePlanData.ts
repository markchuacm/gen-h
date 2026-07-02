import breakfastBowlImage from "../../../assets/care-plan/breakfast-bowl.png";
import chiaYoghurtImage from "../../../assets/care-plan/chia-yoghurt.png";
import heartHealthFoodImage from "../../../assets/care-plan/heart-health-food.png";
import sleepBedroomImage from "../../../assets/care-plan/sleep-bedroom.png";
import sunlitPlantImage from "../../../assets/care-plan/sunlit-plant.png";
// Placeholder crops reused from other sections until dedicated protocol photography exists.
import heartMetabolicImage from "../../../assets/biomarkers/heart-metabolic.jpg";
import agingStressImage from "../../../assets/biomarkers/aging-stress.jpg";
import nutrientsVitaminsImage from "../../../assets/biomarkers/nutrients-vitamins.jpg";
import lifestyleImpactsImage from "../../../assets/future-health/lifestyle-impacts.png";
import morningMountainImage from "../../../assets/genh-hero-mountain.jpg";

export type MarkerStatus = "at_risk" | "needs_attention";

export type MarkerChip = {
  label: string;
  value: string;
  direction: "up" | "down";
  status: MarkerStatus;
};

export type ProtocolCategory = "Nutrition" | "Movement" | "Supplement" | "Sleep";

// basedOn tags the intake answer a line is grounded in, so this can later be
// generated from IntakeState (doctor-review-brief/types.ts) instead of mocks.
export type MadeForYouLine = {
  text: string;
  basedOn: string;
};

export type ProtocolOption = {
  label: string;
  imageUrl: string;
};

export type Protocol = {
  id: string;
  title: string;
  category: ProtocolCategory;
  imageUrl: string;
  startHere?: boolean;
  markerChips: MarkerChip[];
  personalLead: string;
  whyInPlan: string;
  whatToDo: {
    intro: string;
    options: ProtocolOption[];
    guidance: string;
    alternatives: string[];
  };
  madeForYou: MadeForYouLine[];
  benefits: { title: string; detail: string }[];
  watchOuts: string[];
  reviewTiming: string;
};

export type FocusAreaPriority = "Priority" | "Quick win" | "Support";

export type FocusArea = {
  id: string;
  title: string;
  priority: FocusAreaPriority;
  summary: string;
  protocols: Protocol[];
};

const hba1cChip: MarkerChip = { label: "HbA1c", value: "5.8%", direction: "up", status: "at_risk" };
const glucoseChip: MarkerChip = { label: "Fasting glucose", value: "101", direction: "up", status: "at_risk" };
const apoBChip: MarkerChip = { label: "ApoB", value: "112", direction: "up", status: "needs_attention" };
const ldlChip: MarkerChip = { label: "LDL-C", value: "142", direction: "up", status: "at_risk" };
const vitaminDChip: MarkerChip = { label: "Vitamin D", value: "22", direction: "down", status: "at_risk" };
const sleepChip: MarkerChip = { label: "Sleep avg", value: "6h 18m", direction: "down", status: "at_risk" };

export const planMeta = {
  patientFirstName: "Mark",
  titleLead: "Mark's ",
  titleEmphasis: "90-day",
  titleTail: " plan",
  subtitle:
    "Four focus areas, ten protocols — built from your March results and what you told us about your week.",
  reviewedBy: "Dr. Farheen Nafisa",
  nextReviewDate: "20 Aug 2025",
  startThisWeekCount: 4,
};

export const focusAreas: FocusArea[] = [
  {
    id: "glucose-stability",
    title: "Glucose stability",
    priority: "Priority",
    summary:
      "Your HbA1c and morning glucose are running a little higher than we'd like. Steadier meals and light movement bring both down.",
    protocols: [
      {
        id: "protein-first-breakfast",
        title: "Make breakfast protein-first",
        category: "Nutrition",
        imageUrl: breakfastBowlImage,
        startHere: true,
        markerChips: [hba1cChip, glucoseChip],
        personalLead:
          "Your usual kopitiam breakfast — kaya toast and sweetened kopi — is mostly refined carbohydrate, which sets up a sharp glucose rise first thing in the morning.",
        whyInPlan:
          "Your HbA1c of 5.8% and fasting glucose of 101 mg/dL sit just above the optimal range. Starting the day with protein slows how quickly glucose enters your blood, which steadies the whole morning and gradually pulls both markers down.",
        whatToDo: {
          intro: "Build breakfast around a protein anchor before any starch:",
          options: [
            { label: "Half-boiled eggs", imageUrl: breakfastBowlImage },
            { label: "Greek yoghurt", imageUrl: chiaYoghurtImage },
            { label: "Tofu or tempeh", imageUrl: heartHealthFoodImage },
            { label: "Protein shake", imageUrl: nutrientsVitaminsImage },
          ],
          guidance: "Start with weekdays only — weekends can stay relaxed while the habit settles.",
          alternatives: [
            "Swap kaya toast for a wholemeal egg sandwich",
            "On roti canai mornings, add dhal and eggs — and skip the second roti",
          ],
        },
        madeForYou: [
          {
            text: "You mentioned breakfast is usually eaten out — two half-boiled eggs with kopi kurang manis is an easy kopitiam order that fits this as-is.",
            basedOn: "From your intake · meals",
          },
          {
            text: "You're after steadier energy through the morning. Protein at breakfast is the single biggest lever for that.",
            basedOn: "From your intake · goals",
          },
        ],
        benefits: [
          {
            title: "Steadier glucose",
            detail: "Protein-first meals blunt the post-meal spike that shows up in your HbA1c.",
          },
          {
            title: "Fewer mid-morning dips",
            detail: "A flatter curve means fewer energy crashes and less snacking before lunch.",
          },
        ],
        watchOuts: [
          "No need to cut carbs entirely — the order and proportion matter more than elimination.",
        ],
        reviewTiming: "Retest HbA1c and fasting glucose at your 12-week review.",
      },
      {
        id: "post-meal-walk",
        title: "Walk 10 minutes after your largest meal",
        category: "Movement",
        imageUrl: lifestyleImpactsImage,
        markerChips: [glucoseChip],
        personalLead:
          "Most of your days are desk-based, and your biggest meal is usually lunch out with colleagues — followed by a long sit.",
        whyInPlan:
          "Moving muscles clear glucose from the blood directly, without needing insulin. A short walk after your largest meal flattens the spike that your fasting glucose of 101 mg/dL suggests is happening regularly.",
        whatToDo: {
          intro: "Within 30 minutes of finishing your largest meal:",
          options: [
            { label: "Walk a block loop", imageUrl: lifestyleImpactsImage },
            { label: "Take the stairs back", imageUrl: agingStressImage },
            { label: "Walk to the farther kopi spot", imageUrl: heartMetabolicImage },
          ],
          guidance: "Even 8 minutes counts — consistency beats distance.",
          alternatives: [
            "Ten bodyweight squats at your desk if you truly can't step out",
            "Move the walk to after dinner on days lunch is rushed",
          ],
        },
        madeForYou: [
          {
            text: "Since lunch is your biggest meal on workdays, that's the walk that matters — a covered walkway or mall loop keeps it doable in the midday heat.",
            basedOn: "From your intake · meals",
          },
        ],
        benefits: [
          {
            title: "Immediate effect",
            detail: "Post-meal glucose drops on day one — this is the fastest-acting protocol in your plan.",
          },
          {
            title: "No equipment or schedule",
            detail: "It attaches to a meal you already eat, so there's nothing new to remember.",
          },
        ],
        watchOuts: [
          "Don't turn it into a workout — a stroll is enough, and keeping it easy is what keeps it daily.",
        ],
        reviewTiming: "Reviewed alongside HbA1c and fasting glucose at the 12-week retest.",
      },
      {
        id: "sweet-drinks",
        title: "Cut sweet drinks to three a week",
        category: "Nutrition",
        imageUrl: heartMetabolicImage,
        markerChips: [hba1cChip],
        personalLead:
          "You told us you have a sweet tooth — right now that mostly shows up as sweetened kopi, teh tarik and the occasional bubble tea, most days of the week.",
        whyInPlan:
          "Liquid sugar hits your blood faster than anything you eat, and it's the most direct contributor to the pattern in your HbA1c. Capping sweet drinks moves this marker without touching your meals.",
        whatToDo: {
          intro: "Keep three sweet drinks a week for the ones you enjoy most, and default to:",
          options: [
            { label: "Kopi kurang manis", imageUrl: breakfastBowlImage },
            { label: "Teh o kosong", imageUrl: sunlitPlantImage },
            { label: "Sparkling water", imageUrl: nutrientsVitaminsImage },
          ],
          guidance: "Step down gradually — kurang manis first, kosong later. Taste adjusts in about two weeks.",
          alternatives: [
            "Halve the syrup in bubble tea orders (25% sugar)",
            "Swap the afternoon sweet drink for fruit — the fibre changes how the sugar lands",
          ],
        },
        madeForYou: [
          {
            text: "Rather than cutting sweetness cold turkey, this keeps three drinks a week for the ones you actually enjoy — a cap, not a ban.",
            basedOn: "From your intake · sweet tooth",
          },
        ],
        benefits: [
          {
            title: "Direct HbA1c lever",
            detail: "Sweet drinks are the single largest removable source of glucose load in your week.",
          },
          {
            title: "Energy stability",
            detail: "Fewer sugar peaks means fewer afternoon slumps — this feeds your energy goal.",
          },
        ],
        watchOuts: [
          "Watch sugar creeping back in through bottled 'healthier' drinks — many carry as much as teh tarik.",
        ],
        reviewTiming: "Reflected in HbA1c at the 12-week retest.",
      },
    ],
  },
  {
    id: "cholesterol-transport",
    title: "Cholesterol transport",
    priority: "Priority",
    summary:
      "ApoB and LDL-C suggest more cholesterol-carrying particles circulating than we'd like. Fibre, food swaps and strength work all move this.",
    protocols: [
      {
        id: "fibre-30g",
        title: "Reach 30g of fibre daily",
        category: "Nutrition",
        imageUrl: chiaYoghurtImage,
        startHere: true,
        markerChips: [apoBChip, ldlChip],
        personalLead:
          "You're getting fibre in one meal or less most days — mainly the vegetables in mixed rice and the occasional fruit after dinner.",
        whyInPlan:
          "Soluble fibre binds cholesterol in the gut so less of it is reabsorbed. With ApoB at 112 mg/dL and LDL-C at 142 mg/dL, consistent fibre is the first-line food lever — it typically brings LDL-C down 5–10% on its own.",
        whatToDo: {
          intro: "Stack small additions rather than overhauling meals:",
          options: [
            { label: "2 tbsp chia in yoghurt", imageUrl: chiaYoghurtImage },
            { label: "Overnight oats", imageUrl: breakfastBowlImage },
            { label: "Extra veg at mixed rice", imageUrl: heartHealthFoodImage },
            { label: "Ulam with dinner", imageUrl: sunlitPlantImage },
          ],
          guidance: "Build up over a week or two, and drink more water as you go.",
          alternatives: [
            "Psyllium husk before dinner",
            "Dhal or beans at lunch three times a week",
            "Swap white rice for brown at one meal a day",
          ],
        },
        madeForYou: [
          {
            text: "Most of your lunches are hawker meals — the easiest add is one extra vegetable dish at mixed rice, or dhal with your roti instead of curry alone.",
            basedOn: "From your intake · meals",
          },
          {
            text: "You said weekday breakfasts at home are doable — chia stirred into yoghurt takes under a minute and covers a third of the target.",
            basedOn: "From your intake · routine",
          },
        ],
        benefits: [
          {
            title: "Improve cholesterol profile",
            detail: "Soluble fibre lowers LDL-C and ApoB by reducing cholesterol reabsorption in the gut.",
          },
          {
            title: "Steadier blood sugar",
            detail: "Fibre slows digestion, which also supports your glucose stability work.",
          },
          {
            title: "Fuller for longer",
            detail: "Higher-fibre meals reduce grazing between meals without any counting.",
          },
        ],
        watchOuts: [
          "Increase water as you increase fibre — without it, constipation and bloating are common.",
          "If you feel bloated, hold your current amount for a few days before stepping up again.",
        ],
        reviewTiming: "Retest ApoB and LDL-C at your 12-week review.",
      },
      {
        id: "fried-meals",
        title: "Keep deep-fried meals to twice a week",
        category: "Nutrition",
        imageUrl: heartHealthFoodImage,
        markerChips: [ldlChip],
        personalLead:
          "Eating out most days means fried items land on your plate more often than you'd guess — ayam goreng, fried noodles, the keropok on the side.",
        whyInPlan:
          "Repeatedly-heated frying oils push LDL-C in the wrong direction, and fried meals tend to crowd out the fish and vegetables that would help. A twice-a-week cap works on your LDL-C of 142 mg/dL from the other side of the fibre protocol.",
        whatToDo: {
          intro: "Default to grilled, steamed or soup versions when ordering:",
          options: [
            { label: "Chicken rice, roasted", imageUrl: heartHealthFoodImage },
            { label: "Fish soup noodles", imageUrl: breakfastBowlImage },
            { label: "Ikan bakar", imageUrl: heartMetabolicImage },
          ],
          guidance: "Decide which two fried meals you'll keep at the start of the week — it makes every other order automatic.",
          alternatives: [
            "Same dish, different stall: many hawker dishes exist in soup and fried forms",
            "At economy rice, count battered items as your fried pick for the day",
          ],
        },
        madeForYou: [
          {
            text: "This isn't a no-fried rule — two a week keeps your nasi lemak Sunday intact. Choose your favourites and let the rest go.",
            basedOn: "From your intake · meals",
          },
        ],
        benefits: [
          {
            title: "Lower LDL-C load",
            detail: "Cutting reheated frying oils removes a direct driver of your cholesterol markers.",
          },
          {
            title: "Better meals by default",
            detail: "Soup and grilled versions carry more protein and vegetables for the same price.",
          },
        ],
        watchOuts: [
          "Fried food eaten at home in fresh oil behaves differently — this cap is mainly about stall-fried food.",
        ],
        reviewTiming: "Retest ApoB and LDL-C at your 12-week review.",
      },
      {
        id: "second-strength-session",
        title: "Add a second strength session weekly",
        category: "Movement",
        imageUrl: agingStressImage,
        markerChips: [apoBChip],
        personalLead:
          "You're already in the gym once a week alongside badminton — a second short session is the cheapest upgrade available to you.",
        whyInPlan:
          "Muscle is where most of your glucose gets stored and burned, and regular resistance work improves the lipid picture your ApoB of 112 mg/dL describes. Doubling a habit you already have is far more reliable than starting a new one.",
        whatToDo: {
          intro: "Repeat your current session with one change:",
          options: [
            { label: "Same gym, second slot", imageUrl: agingStressImage },
            { label: "40-min full body", imageUrl: lifestyleImpactsImage },
            { label: "Home dumbbell circuit", imageUrl: heartMetabolicImage },
          ],
          guidance: "Anchor it to a fixed weekday evening — the slot matters more than the program.",
          alternatives: [
            "A 25-minute bodyweight circuit at home on busy weeks",
            "Turn one badminton night into badminton plus 20 minutes of weights",
          ],
        },
        madeForYou: [
          {
            text: "You already train on Wednesdays — we're suggesting Saturday morning before badminton, since that block is usually free in your week.",
            basedOn: "From your intake · exercise",
          },
        ],
        benefits: [
          {
            title: "Lipid and glucose gains",
            detail: "Twice-weekly resistance training measurably improves ApoB and insulin sensitivity.",
          },
          {
            title: "Long-term resilience",
            detail: "Muscle mass is one of the strongest predictors of healthy ageing — this compounds.",
          },
        ],
        watchOuts: [
          "Keep it to 40 minutes if time is the constraint — two short sessions beat one long one you skip.",
        ],
        reviewTiming: "Reviewed at 12 weeks alongside your lipid retest.",
      },
    ],
  },
  {
    id: "vitamin-d-repletion",
    title: "Vitamin D repletion",
    priority: "Quick win",
    summary:
      "Your vitamin D is below the optimal range. This is the fastest marker on your panel to fix.",
    protocols: [
      {
        id: "vitamin-d-supplement",
        title: "Take 2,000 IU vitamin D with breakfast",
        category: "Supplement",
        imageUrl: sunlitPlantImage,
        startHere: true,
        markerChips: [vitaminDChip],
        personalLead:
          "You're not taking any supplements at the moment, and at 22 ng/mL your vitamin D won't correct through food and incidental sun alone.",
        whyInPlan:
          "Vitamin D below 30 ng/mL is linked to poorer immune resilience, mood and recovery. A daily 2,000 IU dose reliably lifts levels like yours into the optimal range within about three months — it's the closest thing to a sure win on your panel.",
        whatToDo: {
          intro: "One softgel, every morning, with food:",
          options: [
            { label: "With your morning kopi", imageUrl: breakfastBowlImage },
            { label: "Bottle by the kettle", imageUrl: sunlitPlantImage },
          ],
          guidance: "Vitamin D is fat-soluble — take it with a meal that has some fat, which your usual breakfast covers.",
          alternatives: [
            "A weekly higher-dose option exists if daily doesn't stick — raise it at your review",
          ],
        },
        madeForYou: [
          {
            text: "Since this is your first supplement, we've kept it to a single morning dose — no stack to manage.",
            basedOn: "From your intake · supplements",
          },
          {
            text: "Anchor it to your morning kopi order or the kettle at home, so it rides on a habit you never skip.",
            basedOn: "From your intake · routine",
          },
        ],
        benefits: [
          {
            title: "Immune resilience",
            detail: "Adequate vitamin D supports the immune regulation your panel flagged as worth protecting.",
          },
          {
            title: "Mood and energy",
            detail: "Correcting a low level often shows up as better baseline energy within weeks.",
          },
        ],
        watchOuts: [
          "Don't double up on days you forget — just continue the next morning.",
        ],
        reviewTiming: "Recheck vitamin D at the 12-week review; the dose may step down to maintenance once you're above 40 ng/mL.",
      },
      {
        id: "morning-daylight",
        title: "Get 15 minutes of morning daylight",
        category: "Movement",
        imageUrl: morningMountainImage,
        markerChips: [vitaminDChip, sleepChip],
        personalLead:
          "Your weekdays run car to office to car — most days you're not outdoors before evening.",
        whyInPlan:
          "Morning light does double duty for you: skin exposure supports the vitamin D you're repleting, and light in the first hours after waking anchors your body clock — which is exactly what your short weekday sleep needs.",
        whatToDo: {
          intro: "Get outside within a couple of hours of waking:",
          options: [
            { label: "Park farther, walk in", imageUrl: morningMountainImage },
            { label: "Kopi at an outdoor table", imageUrl: breakfastBowlImage },
            { label: "Balcony breakfast", imageUrl: sunlitPlantImage },
          ],
          guidance: "Forearms in daylight, no sunglasses needed for the clock effect — a bright sky works even under cloud.",
          alternatives: [
            "Fold it into your post-lunch walk on mornings that are truly back-to-back",
          ],
        },
        madeForYou: [
          {
            text: "The simplest version for your commute: park at the far end of the lot and take the uncovered route in. That alone is most of the 15 minutes.",
            basedOn: "From your intake · routine",
          },
        ],
        benefits: [
          {
            title: "Supports repletion",
            detail: "Regular sun exposure works alongside your supplement to lift vitamin D.",
          },
          {
            title: "Anchors your body clock",
            detail: "Morning light makes the 10:45pm wind-down in your sleep protocol easier to feel.",
          },
        ],
        watchOuts: [
          "Malaysian mid-morning sun gets strong — 15 minutes is the target, not an hour.",
        ],
        reviewTiming: "Reviewed with your vitamin D recheck at 12 weeks.",
      },
    ],
  },
  {
    id: "recovery-consistency",
    title: "Recovery consistency",
    priority: "Support",
    summary:
      "Weekday sleep is averaging 6h 18m — enough to blunt recovery, glucose control and next-day energy.",
    protocols: [
      {
        id: "wind-down",
        title: "Protect a 10:45pm wind-down",
        category: "Sleep",
        imageUrl: sleepBedroomImage,
        startHere: true,
        markerChips: [sleepChip],
        personalLead:
          "You told us work often follows you home — most nights the laptop closes after 11pm and sleep lands around midnight.",
        whyInPlan:
          "At 6h 18m on weekdays, sleep is quietly working against everything else in this plan — short sleep worsens insulin sensitivity and raises cravings the next day. A protected wind-down is the intervention; the extra sleep is the result.",
        whatToDo: {
          intro: "At 10:45pm, trigger the same short sequence:",
          options: [
            { label: "Dim the living room", imageUrl: sleepBedroomImage },
            { label: "Phone on the shelf", imageUrl: agingStressImage },
            { label: "Ten pages of a book", imageUrl: sunlitPlantImage },
          ],
          guidance: "The cue matters more than the bedtime — same trigger nightly, weekends included where possible.",
          alternatives: [
            "If work truly can't stop, switch to paper for the last task of the night",
          ],
        },
        madeForYou: [
          {
            text: "We set 10:45pm — not earlier — because your wake time is 6:45am, and this gets you past 7 hours without a drastic shift from where you are now.",
            basedOn: "From your intake · sleep",
          },
        ],
        benefits: [
          {
            title: "Recovery first",
            detail: "An extra 45 minutes of sleep improves training recovery and next-day focus quickly.",
          },
          {
            title: "Helps your glucose work",
            detail: "Sleep debt raises next-day glucose responses — this protocol supports that whole focus area.",
          },
        ],
        watchOuts: [
          "Don't chase lost sleep with weekend lie-ins beyond an hour — it shifts your rhythm back.",
        ],
        reviewTiming: "Review your sleep average at the 12-week consult — aim for 7h+ on weekdays.",
      },
      {
        id: "caffeine-boundary",
        title: "Set a 2pm caffeine boundary",
        category: "Sleep",
        imageUrl: nutrientsVitaminsImage,
        markerChips: [sleepChip],
        personalLead:
          "Your second or third kopi usually lands mid-afternoon — and with caffeine's six-hour half-life, half of it is still circulating at 9pm.",
        whyInPlan:
          "Late caffeine doesn't always stop you falling asleep, but it reliably shallows the sleep you get. With your weekday average at 6h 18m, protecting sleep quality matters as much as adding minutes.",
        whatToDo: {
          intro: "Caffeine before 2pm, then switch to:",
          options: [
            { label: "Kopi o kosong at noon", imageUrl: breakfastBowlImage },
            { label: "Sparkling water", imageUrl: nutrientsVitaminsImage },
            { label: "Decaf or barley", imageUrl: sunlitPlantImage },
          ],
          guidance: "Keep your total the same at first — this is about timing, not quitting kopi.",
          alternatives: [
            "A 10-minute walk beats the 4pm coffee for shaking off the afternoon slump",
          ],
        },
        madeForYou: [
          {
            text: "Your afternoon kopi is partly the sweet habit too — a kopi o kosong at noon and sparkling water later covers this and your sweet-drinks cap in one move.",
            basedOn: "From your intake · caffeine",
          },
        ],
        benefits: [
          {
            title: "Deeper sleep, same bedtime",
            detail: "Clearing caffeine by night improves sleep depth even before the wind-down adds minutes.",
          },
          {
            title: "Steadier afternoons",
            detail: "Breaking the late-caffeine cycle usually reduces the slump that prompted it.",
          },
        ],
        watchOuts: [
          "Expect three or four groggy afternoons in week one — it passes.",
        ],
        reviewTiming: "Reviewed with your sleep average at the 12-week consult.",
      },
    ],
  },
];

export const alreadyDoing: MadeForYouLine[] = [
  {
    text: "Badminton twice a week — keep it exactly as it is.",
    basedOn: "From your intake · exercise",
  },
  {
    text: "Mostly home-cooked dinners — already doing quiet work for your cholesterol.",
    basedOn: "From your intake · meals",
  },
  {
    text: "No smoking, alcohol only occasionally — two of the biggest levers already covered.",
    basedOn: "From your intake · lifestyle",
  },
];

export const reviewFooter = {
  title: "Your 12-week review",
  body: "Retest ApoB, LDL-C, HbA1c and vitamin D · 20 Aug 2025",
  note: "Dr. Farheen will adjust doses and targets based on how these land.",
  cta: "Message your care team",
};
