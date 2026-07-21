// Copy and data duplicated verbatim from src/App.tsx so the landing page
// stays decoupled from the current marketing page. If brand copy changes
// there, mirror it here.
import {
  Activity,
  CircleDot,
  Droplets,
  HeartPulse,
  Shield,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import heroVideo from "../../assets/Gen-H_Hero_v1.mp4";
import heroMountainImage from "../../assets/genh-hero-mountain.jpg";
import processBaselineImage from "../../assets/process-step-teleconsult.jpg";
import processBiomarkersImage from "../../assets/process-step-biomarker-plan.jpg";
import processLabsImage from "../../assets/process-step-blood-draw.jpg";
import processPlanImage from "../../assets/generated/process-step-plan.png";
import deannaImage from "../../assets/doctors/deanna-abdul-halim.png";
import ongImage from "../../assets/doctors/ong-shiau-ying.png";
import farheenImage from "../../assets/doctors/farheen-nafisa.png";
import luqmeyImage from "../../assets/doctors/luqmey-fahmin.png";
import deannaReeshaImage from "../../assets/doctors/deanna-reesha.png";
import agingStressImage from "../../assets/biomarkers/aging-stress-hd.png";
import bloodIronImage from "../../assets/biomarkers/blood-iron-hd.png";
import heartMetabolicImage from "../../assets/biomarkers/heart-metabolic-hd.png";
import hormonesThyroidImage from "../../assets/biomarkers/hormones-thyroid-hd.png";
import inflammationImmunityImage from "../../assets/biomarkers/inflammation-immunity-hd.png";
import liverKidneyImage from "../../assets/biomarkers/liver-kidney-hd.png";
import nutrientsVitaminsImage from "../../assets/biomarkers/nutrients-vitamins-hd.png";
import deeperTestingImage from "../../assets/future-health/deeper-testing2.png";
import earlierSignalsImage from "../../assets/future-health/earlier-signals.png";
import lifestyleImpactsImage from "../../assets/future-health/lifestyle-impacts-verae.png";
import innoquestLogo from "../../assets/partners/innoquest.png";

const whatsappMessage =
  "Hi, I'm interested in the Verae Health Founding Members program. Could you share availability and next steps?";
export const whatsappHref = `https://wa.me/60173280063?text=${encodeURIComponent(whatsappMessage)}`;

export { heroVideo, heroMountainImage, innoquestLogo };

export const heroProofs = [
  { title: "100+ biomarkers", text: "Tailored to long-term health" },
  { title: "Earlier risk signals", text: "Before symptoms appear" },
  { title: "Tracked over time", text: "See what's changing" },
] as const;

export const introRevealWords = [
  "You're",
  "trying",
  "to",
  "take",
  "your",
  "health",
  "seriously.",
  "It",
  "should",
  "feel",
  "less confusing.",
] as const;

export const futureHealthCards = [
  {
    number: "1",
    title: "Deeper testing",
    text: "More than a standard screening",
    image: deeperTestingImage,
    imageAlt: "Blood samples beside a requisition card listing advanced biomarkers",
  },
  {
    number: "2",
    title: "Earlier signals",
    text: "Learn where your health is going",
    image: earlierSignalsImage,
    imageAlt: "Tablet dashboard showing biomarker trends and health trajectory insights",
  },
  {
    number: "3",
    title: "Lifestyle impacts",
    text: "Beyond your blood test",
    image: lifestyleImpactsImage,
    imageAlt: "Breakfast, running shoes, and a sleep tracker representing lifestyle inputs",
  },
] as const;

export type BiomarkerGroup = {
  title: string;
  count: string;
  tests: string[];
  icon: LucideIcon;
  image: string;
  imageAlt: string;
};

export const biomarkerGroups: BiomarkerGroup[] = [
  {
    title: "Heart & metabolic",
    count: "18+ biomarkers",
    tests: ["ApoB", "ApoB/ApoA1 ratio", "LDL and HDL cholesterol", "Triglycerides", "Fasting insulin", "HbA1c"],
    icon: HeartPulse,
    image: heartMetabolicImage,
    imageAlt: "Microscopic organic forms in teal and cream representing metabolic biomarkers",
  },
  {
    title: "Hormones & thyroid",
    count: "16+ biomarkers",
    tests: ["TSH", "Free T4", "Total testosterone", "Estradiol", "SHBG", "DHEA-S"],
    icon: Activity,
    image: hormonesThyroidImage,
    imageAlt: "Close-up amber liquid dropper representing hormone testing",
  },
  {
    title: "Inflammation & immunity",
    count: "12+ biomarkers",
    tests: ["High-sensitivity CRP", "ESR", "White cell differential", "Neutrophils", "Lymphocytes"],
    icon: Shield,
    image: inflammationImmunityImage,
    imageAlt: "Glowing yellow microscopic form representing immune risk signals",
  },
  {
    title: "Liver & kidney",
    count: "20+ biomarkers",
    tests: ["ALT", "AST", "GGT", "Creatinine", "eGFR", "Cystatin C"],
    icon: Droplets,
    image: liverKidneyImage,
    imageAlt: "Blue cellular texture representing detoxification and organ function markers",
  },
  {
    title: "Nutrients & vitamins",
    count: "14+ biomarkers",
    tests: ["Vitamin D", "Ferritin", "Iron studies", "Magnesium", "Calcium", "Homocysteine"],
    icon: Sparkles,
    image: nutrientsVitaminsImage,
    imageAlt: "Red and green microscopic plant cells representing nutrient status",
  },
  {
    title: "Blood & iron",
    count: "18+ biomarkers",
    tests: ["Full blood count", "Iron studies", "Platelets", "Haemoglobin", "Red cell distribution width"],
    icon: CircleDot,
    image: bloodIronImage,
    imageAlt: "Microscopic pale strands representing blood and iron biomarkers",
  },
  {
    title: "Aging & stress",
    count: "10+ biomarkers",
    tests: ["Cortisol", "IGF-1", "DHEA-S", "Homocysteine", "Uric acid"],
    icon: Waves,
    image: agingStressImage,
    imageAlt: "Warm close-up skin texture representing aging and stress markers",
  },
];

export const biomarkerProofs = [
  "100+ biomarkers",
  "Earlier health insights",
  "Doctor-led interpretation",
] as const;

export const diseaseMarqueeTop = [
  "Heart disease",
  "Diabetes",
  "Fatty liver disease",
  "Anemia",
  "Hypothyroidism",
  "Kidney disease",
  "Insulin resistance",
  "High cholesterol",
  "Gout",
  "Hypertension",
];

export const diseaseMarqueeBottom = [
  "Chronic inflammation",
  "Vitamin deficiency",
  "Hormone imbalance",
  "Metabolic syndrome",
  "Liver stress",
  "Iron deficiency",
  "Thyroid dysfunction",
  "Cardiometabolic risk",
  "Nutrient gaps",
  "Prediabetes",
];

export const monitorProofs = [
  "Establish your long-term baseline",
  "Tracked over time",
  "Monitor how your body changes",
] as const;

export const processSteps = [
  {
    id: "teleconsult",
    index: "01",
    title: "Teleconsult",
    summary:
      "Share your history, goals, lifestyle, family history, and previous results so your doctor starts with the right context.",
    image: processBaselineImage,
    imageAlt: "A woman joining an online consultation at her laptop with a consult booked card",
  },
  {
    id: "personalized-test",
    index: "02",
    title: "Personalized test",
    summary: "Test according to your needs and long-term health priorities.",
    image: processBiomarkersImage,
    imageAlt: "A doctor reviewing a personalized test plan on a laptop",
  },
  {
    id: "blood-draw",
    index: "03",
    title: "Blood draw",
    summary:
      "We coordinate your blood draw and route you to an established Innoquest facility.",
    image: processLabsImage,
    imageAlt: "A close-up of an arm with a bandage after a blood draw",
  },
  {
    id: "care-plan",
    index: "04",
    title: "Care plan",
    summary:
      "Review the markers that matter with your doctor, then turn them into clear next actions and follow-up testing where needed.",
    image: processPlanImage,
    imageAlt: "A tablet showing a care plan dashboard on a warm desk",
  },
] as const;

export type ComparisonRow = {
  criterion: string;
  genhValue?: string;
  standardValue?: string;
  genhIncluded?: boolean;
  standardIncluded?: boolean;
};

export const comparisonRows: ComparisonRow[] = [
  { criterion: "Biomarkers tested", genhValue: "100+", standardValue: "~20-60" },
  { criterion: "Longevity-focused", genhIncluded: true, standardIncluded: false },
  { criterion: "Personalized tests", genhIncluded: true, standardIncluded: false },
  { criterion: "In-depth results review", genhIncluded: true, standardIncluded: false },
  { criterion: "Optimal ranges", genhIncluded: true, standardIncluded: false },
  { criterion: "Tailored action plan", genhIncluded: true, standardIncluded: false },
  { criterion: "Progress tracking", genhIncluded: true, standardIncluded: false },
  { criterion: "Virtual consults", genhIncluded: true, standardIncluded: false },
];

export const launchPriceSteps = [
  {
    value: "RM99",
    label: "Teleconsult",
    badge: "*100% refundable",
    note: "if unsatisfied with the consult",
  },
  {
    value: "RM1,400",
    label: "Full test",
    note: "Personalized blood panel configured by your doctor",
  },
  {
    value: "Included",
    label: "Follow-up",
    note: "Teleconsult reviewing results & action plan",
  },
] as const;

export const doctors = [
  {
    name: "Dr. Deanna Abdul Halim",
    credential: "MBBS Mansoura University School of Medicine",
    image: deannaImage,
  },
  {
    name: "Dr. Ong Shiau Ying",
    credential: "MD, Volgograd State Medical University",
    image: ongImage,
  },
  {
    name: "Dr. Farheen Nafisa",
    credential: "Mb BCh BAO, Royal College of Surgeons in Ireland",
    image: farheenImage,
  },
  {
    name: "Dr. Luqmey Fahmin",
    credential: "MBBCh Mansoura University School of Medicine",
    image: luqmeyImage,
  },
  {
    name: "Dr. Deanna Reesha",
    credential: "MD Universiti Sains Malaysia",
    image: deannaReeshaImage,
  },
];

export const faqs = [
  {
    question: "Who is Verae Health for?",
    answer:
      "Adults who want a deeper, doctor-led view of their health before obvious symptoms appear.",
  },
  {
    question: "Is this a clinic?",
    answer:
      "Verae Health is not a clinic, we are a health intelligence platform that helps you understand your long-term health risks and helps you achieve your health goals.",
  },
  {
    question: "Why is the full test RM1,400?",
    answer:
      "Your doctor configures the panel around what you need. The RM1,400 test includes your personalized blood panel, lab processing, doctor review, and follow-up consult.",
  },
  {
    question: "Are the consults virtual?",
    answer:
      "Yes. Your initial consult and follow-up consult are online, so you only need to visit a lab for the blood draw.",
  },
  {
    question: "Where do I do the blood test?",
    answer:
      "Verae Health coordinates your blood draw with Innoquest in Klang Valley.",
  },
  {
    question: "What happens after my results are ready?",
    answer:
      "A doctor reviews your results, explains what matters, and turns them into a practical care plan.",
  },
  {
    question: "Who reviews my results?",
    answer:
      "Your results are reviewed by an MMC-registered doctor, then explained in context during your follow-up teleconsult.",
  },
  {
    question: "How is this different from a normal check-up?",
    answer:
      "A normal check-up usually looks for disease today. Verae Health looks at 100+ biomarkers to help you understand your disease risks for the future, and tells you how to address them now.",
  },
  {
    question: "Is this suitable if my normal screening is fine?",
    answer:
      "Yes. Verae Health is designed for people who want to look beyond standard screening and understand long-term risks earlier.",
  },
  {
    question: "What happens if something abnormal is found?",
    answer:
      "Your doctor will explain what it may mean, recommend next steps, and guide you on whether further care or testing is needed.",
  },
  {
    question: "Where is Verae Health available?",
    answer:
      "We are currently only in the Klang Valley, but we are coming to all major Malaysian cities soon.",
  },
];
