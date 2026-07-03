import { type CSSProperties, useEffect, useState } from "react";
import Lenis from "lenis";
import {
  Activity,
  Check,
  ChevronDown,
  CircleDot,
  Droplets,
  HeartPulse,
  Shield,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import heroVideo from "../assets/Gen-H_Hero_v1.mp4";
import processBaselineImage from "../assets/process-step-teleconsult.jpg";
import processBiomarkersImage from "../assets/process-step-biomarker-plan.jpg";
import processLabsImage from "../assets/process-step-blood-draw.jpg";
import processPlanImage from "../assets/generated/process-step-plan.png";
import deannaImage from "../assets/doctors/deanna-abdul-halim.png";
import ongImage from "../assets/doctors/ong-shiau-ying.png";
import farheenImage from "../assets/doctors/farheen-nafisa.png";
import agingStressImage from "../assets/biomarkers/aging-stress-hd.png";
import bloodIronImage from "../assets/biomarkers/blood-iron-hd.png";
import heartMetabolicImage from "../assets/biomarkers/heart-metabolic-hd.png";
import hormonesThyroidImage from "../assets/biomarkers/hormones-thyroid-hd.png";
import inflammationImmunityImage from "../assets/biomarkers/inflammation-immunity-hd.png";
import liverKidneyImage from "../assets/biomarkers/liver-kidney-hd.png";
import nutrientsVitaminsImage from "../assets/biomarkers/nutrients-vitamins-hd.png";
import deeperTestingImage from "../assets/future-health/deeper-testing.png";
import earlierSignalsImage from "../assets/future-health/earlier-signals.png";
import lifestyleImpactsImage from "../assets/future-health/lifestyle-impacts-landing.png";

const whatsappMessage =
  "Hi, I'm interested in the Gen-H Founding Members program. Could you share availability and next steps?";
const whatsappHref = `https://wa.me/60173280063?text=${encodeURIComponent(whatsappMessage)}`;

const futureHealthCards = [
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

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.35 2.13 11.7c0 1.88.56 3.7 1.61 5.26L2 22l5.2-1.64a10.1 10.1 0 0 0 4.84 1.24c5.46 0 9.91-4.35 9.91-9.7S17.5 2 12.04 2Zm0 17.95a8.4 8.4 0 0 1-4.29-1.18l-.3-.17-3.08.97 1-2.92-.2-.31a7.95 7.95 0 0 1-1.33-4.44c0-4.44 3.68-8.06 8.2-8.06 4.53 0 8.21 3.62 8.21 8.06 0 4.44-3.68 8.05-8.21 8.05Zm4.5-6.03c-.25-.12-1.46-.7-1.68-.78-.23-.08-.4-.12-.56.12-.16.24-.64.78-.78.94-.14.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.2-.74-.65-1.24-1.45-1.38-1.69-.14-.24-.02-.37.11-.49.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.32-.76-1.81-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.42.06-.64.3-.22.24-.84.8-.84 1.95 0 1.15.86 2.26.98 2.42.12.16 1.7 2.53 4.11 3.54.57.24 1.02.39 1.37.5.58.18 1.1.15 1.51.09.46-.07 1.46-.58 1.66-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  );
}

function WhatsAppCta({
  children = "Book a consult",
  variant = "primary",
}: {
  children?: string;
  variant?: "primary" | "ghost";
}) {
  return (
    <a
      className={`button button-${variant} whatsapp-cta`}
      href={whatsappHref}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <WhatsAppIcon />
    </a>
  );
}

function FutureHealthVisual({
  image,
  imageAlt,
  number,
  title,
}: {
  image: (typeof futureHealthCards)[number]["image"];
  imageAlt: (typeof futureHealthCards)[number]["imageAlt"];
  number: (typeof futureHealthCards)[number]["number"];
  title: (typeof futureHealthCards)[number]["title"];
}) {
  const imageClassName = title === "Lifestyle impacts" ? "is-lifestyle-impacts" : undefined;

  return (
    <div className="future-visual">
      <img src={image} alt={imageAlt} className={imageClassName} loading="lazy" />
      <span className="future-card-number" aria-hidden="true">
        {number}
      </span>
    </div>
  );
}

const processSteps = [
  {
    id: "health-baseline",
    number: "Step 1",
    railNumber: "1.",
    railTitle: "Teleconsult",
    title: "Teleconsult",
    summary: "Share your history, goals, lifestyle, family history, and previous results so your doctor starts with the right context.",
    visual: "baseline",
    image: processBaselineImage,
    imageAlt: "A woman joining an online consultation at her laptop with a consult booked card",
  },
  {
    id: "biomarker-plan",
    number: "Step 2",
    railNumber: "2.",
    railTitle: "Personalized test",
    title: "Personalized test",
    summary: "Test according to your needs and long-term health priorities.",
    visual: "biomarkers",
    image: processBiomarkersImage,
    imageAlt: "A doctor reviewing a personalized test plan on a laptop",
  },
  {
    id: "blood-draw",
    number: "Step 3",
    railNumber: "3.",
    railTitle: "Blood draw",
    title: "Blood draw",
    summary: "We coordinate your blood draw and route you to an established BP Healthcare or Innoquest facility.",
    visual: "labs",
    image: processLabsImage,
    imageAlt: "A close-up of an arm with a bandage after a blood draw",
  },
  {
    id: "review-plan",
    number: "Step 4",
    railNumber: "4.",
    railTitle: "Care plan",
    title: "Care plan",
    summary: "Review the markers that matter with your doctor, then turn them into clear next actions and follow-up testing where needed.",
    visual: "review",
    image: processPlanImage,
    imageAlt: "A tablet showing a care plan dashboard on a warm desk",
  },
] as const;

const introRevealWords = [
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

function BiomarkerGrid({
  visibleBiomarkerIndexes = [],
}: {
  visibleBiomarkerIndexes?: number[];
}) {
  return (
    <div className="biomarker-list">
      <div className="biomarker-grid">
        {[biomarkerGroups.slice(0, 4), biomarkerGroups.slice(4)].map((rowGroups, rowIndex) => (
          <div className="biomarker-row" key={`biomarker-row-${rowIndex}`}>
            {rowGroups.map((group, rowItemIndex) => {
              const index = rowIndex === 0 ? rowItemIndex : rowItemIndex + 4;
              const BiomarkerIcon = group.icon;
              const previewTests = group.tests.slice(0, 4);

              return (
                <article
                  className={`biomarker-card ${visibleBiomarkerIndexes.includes(index) ? "is-visible" : ""}`}
                  data-biomarker-index={index}
                  key={group.title}
                  tabIndex={0}
                  style={{ "--stagger": `${Math.min(index, 7) * 130}ms` } as CSSProperties}
                  aria-label={`${group.title}: ${previewTests.join(", ")}`}
                >
                  <img src={group.image} alt={group.imageAlt} />
                  <span className="biomarker-card-scrim" aria-hidden="true" />
                  <div className="biomarker-card-content">
                    <span className="biomarker-icon" aria-hidden="true">
                      <BiomarkerIcon strokeWidth={1.3} />
                    </span>
                    <div className="biomarker-card-heading">
                      <p className="biomarker-count">{group.count}</p>
                      <h3>{group.title}</h3>
                    </div>
                    <ul>
                      {previewTests.map((test) => (
                        <li key={test}>{test}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const biomarkerGroups = [
  {
    title: "Heart & metabolic",
    count: "18+ biomarkers",
    tests: ["ApoB", "Lipoprotein (a)", "LDL and HDL cholesterol", "Triglycerides", "Fasting insulin", "HbA1c"],
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
    tests: ["Vitamin D", "Vitamin B12", "Folate", "Ferritin", "Magnesium", "Methylmalonic acid"],
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
    tests: ["Homocysteine", "DHEA-S", "Cortisol", "Uric acid", "Omega balance"],
    icon: Waves,
    image: agingStressImage,
    imageAlt: "Warm close-up skin texture representing aging and stress markers",
  },
];

const diseaseMarqueeTop = [
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

const diseaseMarqueeBottom = [
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

const diseaseMarqueeTopLoop = [...diseaseMarqueeTop, ...diseaseMarqueeTop, ...diseaseMarqueeTop];
const diseaseMarqueeBottomLoop = [...diseaseMarqueeBottom, ...diseaseMarqueeBottom, ...diseaseMarqueeBottom];

const monitorProofs = [
  "Establish your long-term baseline",
  "Tracked over time",
  "Monitor how your body changes",
];

const biomarkerProofs = ["100+ biomarkers", "Earlier health insights", "Doctor-led interpretation"];

type ComparisonRow = {
  criterion: string;
  genhValue?: string;
  standardValue?: string;
  genhIncluded?: boolean;
  standardIncluded?: boolean;
};

const comparisonRows: ComparisonRow[] = [
  {
    criterion: "Biomarkers tested",
    genhValue: "100+",
    standardValue: "~20-60",
  },
  {
    criterion: "Longevity-focused",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "Personalized tests",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "In-depth results review",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "Optimal ranges",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "Tailored action plan",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "Progress tracking",
    genhIncluded: true,
    standardIncluded: false,
  },
  {
    criterion: "Virtual consults",
    genhIncluded: true,
    standardIncluded: false,
  },
];

const launchPriceSteps = [
  {
    value: "RM99",
    label: "Teleconsult",
    badge: "*100% refundable",
    note: "if unsatisfied with the consult",
  },
  {
    value: "Up to RM1,200",
    label: "Full test",
    note: "Pricing may be lower, depending on tests",
  },
  {
    value: "Included",
    label: "Follow-up",
    note: "Teleconsult reviewing results & action plan",
  },
] as const;

const doctors = [
  {
    name: "Dr. Deanna Abdul Halim",
    role: "Functional Medicine Doctor",
    credential: "MBBS (Egypt)",
    image: deannaImage,
  },
  {
    name: "Dr. Ong Shiau Ying",
    role: "Medical Director",
    credential: "MD, Volgograd State Medical University",
    image: ongImage,
  },
  {
    name: "Dr. Farheen Nafisa",
    role: "Functional Medicine Doctor",
    credential: "MB BCh BAO (Ireland), RCSI",
    image: farheenImage,
  },
];

const faqs = [
  {
    question: "Who is Gen-H for?",
    answer:
      "Adults who want a deeper, doctor-led view of their health before obvious symptoms appear.",
  },
  {
    question: "Is this a clinic?",
    answer:
      "Gen-H is not a clinic, we are a health intelligence platform that helps you understand your long-term health risks and helps you achieve your health goals.",
  },
  {
    question: "Why does the full test say up to RM1,200?",
    answer:
      "Your doctor configures the panel around what you need. If you already have recent blood tests or do not need every marker, your final test price may be lower.",
  },
  {
    question: "Are the consults virtual?",
    answer:
      "Yes. Your initial consult and follow-up consult are online, so you only need to visit a lab for the blood draw.",
  },
  {
    question: "Where do I do the blood test?",
    answer:
      "Gen-H coordinates your blood draw with Innoquest or BP Healthcare in Klang Valley.",
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
      "A normal check-up usually looks for disease today. Gen-H looks at 100+ biomarkers to help you understand your disease risks for the future, and tells you how to address them now.",
  },
  {
    question: "Is this suitable if my normal screening is fine?",
    answer:
      "Yes. Gen-H is designed for people who want to look beyond standard screening and understand long-term risks earlier.",
  },
  {
    question: "What happens if something abnormal is found?",
    answer:
      "Your doctor will explain what it may mean, recommend next steps, and guide you on whether further care or testing is needed.",
  },
  {
    question: "Where is Gen-H available?",
    answer:
      "We are currently only in the Klang Valley, but we are coming to all major Malaysian cities soon.",
  },
];

function App() {
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeProcessIndex, setActiveProcessIndex] = useState(0);
  const [visibleProcessIndexes, setVisibleProcessIndexes] = useState<number[]>([0]);
  const [visibleBiomarkerIndexes, setVisibleBiomarkerIndexes] = useState<number[]>([]);
  const [visibleFutureCardIndexes, setVisibleFutureCardIndexes] = useState<number[]>([]);
  const [launchPriceProgress, setLaunchPriceProgress] = useState(0);
  const [visibleLaunchPriceStepCount, setVisibleLaunchPriceStepCount] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const startSmoothScroll = () => {
      if (lenis || reducedMotion.matches) {
        return;
      }

      lenis = new Lenis({
        anchors: {
          duration: 1.05,
          easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
        },
        autoRaf: true,
        lerp: 0.14,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
        syncTouch: false,
        wheelMultiplier: 1,
      });
    };

    const stopSmoothScroll = () => {
      lenis?.destroy();
      lenis = null;
    };

    const updateSmoothScrollPreference = () => {
      if (reducedMotion.matches) {
        stopSmoothScroll();
        return;
      }

      startSmoothScroll();
    };

    updateSmoothScrollPreference();
    reducedMotion.addEventListener("change", updateSmoothScrollPreference);

    return () => {
      reducedMotion.removeEventListener("change", updateSmoothScrollPreference);
      stopSmoothScroll();
    };
  }, []);

  useEffect(() => {
    const updateHeaderState = () => {
      setIsHeaderScrolled(window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#future-health") {
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById("future-health")?.scrollIntoView({ block: "start" });
    });
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".intro-section");
    const sticky = section?.querySelector<HTMLElement>(".intro-sticky");
    const words = Array.from(document.querySelectorAll<HTMLElement>(".intro-reveal-word"));

    if (!section || !sticky || !words.length) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mutedColor = [203, 207, 214] as const;
    const inkColor = [17, 24, 39] as const;
    const accentColor = [184, 93, 53] as const;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const smooth = (value: number) => value * value * (3 - 2 * value);
    const revealWindow = 0.2;
    const revealSpread = 0.68;
    let frame = 0;

    const mixColor = (
      from: readonly [number, number, number],
      to: readonly [number, number, number],
      amount: number,
    ) => {
      const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
      return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
    };

    const resetSticky = () => {
      sticky.classList.remove("is-fixed", "is-ended");
      sticky.style.removeProperty("--intro-sticky-left");
      sticky.style.removeProperty("--intro-sticky-width");
    };

    const setStickyMode = (mode: "default" | "fixed" | "ended") => {
      sticky.classList.toggle("is-fixed", mode === "fixed");
      sticky.classList.toggle("is-ended", mode === "ended");
    };

    const syncIntroReveal = (sectionProgress: number) => {
      const totalWords = words.length;

      words.forEach((word, index) => {
        const start = totalWords <= 1 ? 0 : (index / (totalWords - 1)) * revealSpread;
        const wordProgress = smooth(clamp((sectionProgress - start) / revealWindow));
        const finalColor = word.dataset.accent === "true" ? accentColor : inkColor;

        word.style.color = mixColor(mutedColor, finalColor, wordProgress);
      });
    };

    const updateIntroReveal = () => {
      frame = 0;

      if (reducedMotion.matches) {
        resetSticky();
        syncIntroReveal(1);
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const sectionRect = section.getBoundingClientRect();
      const sectionTop = sectionRect.top + scrollY;
      const sectionHeight = section.offsetHeight;
      const stickyHeight = sticky.offsetHeight;
      const fixedStart = sectionTop;
      const fixedEnd = sectionTop + sectionHeight - stickyHeight;
      const fixedRange = Math.max(fixedEnd - fixedStart, 1);
      const progress = clamp((scrollY - fixedStart) / fixedRange);

      sticky.style.setProperty("--intro-sticky-left", `${sectionRect.left}px`);
      sticky.style.setProperty("--intro-sticky-width", `${sectionRect.width}px`);
      syncIntroReveal(progress);

      if (fixedEnd <= fixedStart || scrollY < fixedStart) {
        setStickyMode("default");
        return;
      }

      if (scrollY >= fixedEnd) {
        setStickyMode("ended");
        return;
      }

      setStickyMode("fixed");
    };

    const requestSync = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateIntroReveal);
    };

    const handleMotionPreferenceChange = () => requestSync();

    updateIntroReveal();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    reducedMotion.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      resetSticky();
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".biomarker-card"));
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    let frame = 0;
    let isListening = false;

    const updateActiveBiomarker = () => {
      frame = 0;

      const activationTop = window.innerHeight * 0.16;
      const activationBottom = window.innerHeight * 0.74;
      const viewportCenter = window.innerHeight * 0.5;
      let activeIndex: number | null = null;
      let activeDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const index = Number(card.dataset.biomarkerIndex);

        if (Number.isNaN(index) || rect.bottom < activationTop || rect.top > activationBottom) {
          return;
        }

        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < activeDistance) {
          activeDistance = distance;
          activeIndex = index;
        }
      });

      setVisibleBiomarkerIndexes((current) => {
        const next = activeIndex === null ? [] : [activeIndex];
        return current.length === next.length && current[0] === next[0] ? current : next;
      });
    };

    const requestActiveBiomarkerUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateActiveBiomarker);
    };

    const startMobileBiomarkerTracking = () => {
      if (isListening) {
        return;
      }

      isListening = true;
      updateActiveBiomarker();
      window.addEventListener("scroll", requestActiveBiomarkerUpdate, { passive: true });
      window.addEventListener("resize", requestActiveBiomarkerUpdate);
    };

    const stopMobileBiomarkerTracking = (clearActiveCard = true) => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      if (isListening) {
        window.removeEventListener("scroll", requestActiveBiomarkerUpdate);
        window.removeEventListener("resize", requestActiveBiomarkerUpdate);
        isListening = false;
      }

      if (clearActiveCard) {
        setVisibleBiomarkerIndexes([]);
      }
    };

    const syncBiomarkerTrackingMode = () => {
      if (mobileQuery.matches) {
        startMobileBiomarkerTracking();
        return;
      }

      stopMobileBiomarkerTracking();
    };

    syncBiomarkerTrackingMode();
    mobileQuery.addEventListener("change", syncBiomarkerTrackingMode);

    return () => {
      mobileQuery.removeEventListener("change", syncBiomarkerTrackingMode);
      stopMobileBiomarkerTracking(false);
    };
  }, []);

  useEffect(() => {
    const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-process-step]"));

    if (!("IntersectionObserver" in window)) {
      setVisibleProcessIndexes(processSteps.map((_, index) => index));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const index = Number((entry.target as HTMLElement).dataset.processIndex);
          if (!Number.isNaN(index)) {
            setActiveProcessIndex(index);
            setVisibleProcessIndexes((current) => (
              current.includes(index) ? current : [...current, index]
            ));
          }
        });
      },
      { rootMargin: "-34% 0px -44% 0px", threshold: 0 },
    );

    panels.forEach((panel) => observer.observe(panel));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const layout = document.querySelector<HTMLElement>(".process-layout");
    const rail = document.querySelector<HTMLElement>(".process-rail");
    const railInner = document.querySelector<HTMLElement>(".process-rail-inner");

    if (!layout || !rail || !railInner) {
      return;
    }

    const desktopQuery = window.matchMedia("(min-width: 981px)");
    let frame = 0;

    const resetRail = () => {
      rail.classList.remove("is-fixed", "is-ended");
      rail.style.removeProperty("--process-rail-fixed-left");
      rail.style.removeProperty("--process-rail-fixed-width");
    };

    const setRailMode = (mode: "default" | "fixed" | "ended") => {
      rail.classList.toggle("is-fixed", mode === "fixed");
      rail.classList.toggle("is-ended", mode === "ended");
    };

    const updateRailPosition = () => {
      frame = 0;

      if (!desktopQuery.matches) {
        resetRail();
        return;
      }

      const railStyles = window.getComputedStyle(rail);
      const layoutStyles = window.getComputedStyle(layout);
      const railTop = Number.parseFloat(layoutStyles.getPropertyValue("--process-rail-top")) || 118;
      const railPaddingLeft = Number.parseFloat(railStyles.paddingLeft) || 0;
      const scrollY = window.scrollY || window.pageYOffset;
      const layoutRect = layout.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      const layoutTop = layoutRect.top + scrollY;
      const layoutBottom = layoutTop + layout.offsetHeight;
      const railHeight = railInner.offsetHeight;
      const fixedStart = layoutTop - railTop;
      const fixedEnd = layoutBottom - railTop - railHeight;

      rail.style.setProperty("--process-rail-fixed-left", `${railRect.left + railPaddingLeft}px`);
      rail.style.setProperty(
        "--process-rail-fixed-width",
        `${Math.max(0, railRect.width - railPaddingLeft)}px`,
      );

      if (fixedEnd <= fixedStart || scrollY < fixedStart) {
        setRailMode("default");
        return;
      }

      if (scrollY >= fixedEnd) {
        setRailMode("ended");
        return;
      }

      setRailMode("fixed");
    };

    const requestRailUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateRailPosition);
    };

    const processImages = Array.from(layout.querySelectorAll<HTMLImageElement>("img"));

    updateRailPosition();
    window.addEventListener("scroll", requestRailUpdate, { passive: true });
    window.addEventListener("resize", requestRailUpdate);
    desktopQuery.addEventListener("change", requestRailUpdate);
    processImages.forEach((image) => image.addEventListener("load", requestRailUpdate));

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      resetRail();
      window.removeEventListener("scroll", requestRailUpdate);
      window.removeEventListener("resize", requestRailUpdate);
      desktopQuery.removeEventListener("change", requestRailUpdate);
      processImages.forEach((image) => image.removeEventListener("load", requestRailUpdate));
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }

    const target = document.getElementById(decodeURIComponent(hash));
    if (!target) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start" });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const futureCards = Array.from(document.querySelectorAll<HTMLElement>("[data-future-card]"));

    if (!futureCards.length) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      setVisibleFutureCardIndexes(futureHealthCards.map((_, index) => index));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          const index = Number(card.dataset.futureCardIndex);
          if (Number.isNaN(index)) {
            return;
          }

          const cardRect = card.getBoundingClientRect();
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
          const isCardOutOfView = cardRect.bottom <= 0 || cardRect.top >= viewportHeight;
          const isCardInRevealZone = entry.isIntersecting && entry.intersectionRatio >= 0.5;

          setVisibleFutureCardIndexes((current) => {
            if (isCardInRevealZone) {
              return current.includes(index) ? current : [...current, index];
            }

            if (isCardOutOfView) {
              return current.filter((visibleIndex) => visibleIndex !== index);
            }

            return current;
          });
        });
      },
      {
        threshold: [0, 0.5],
        rootMargin: "0px",
      },
    );

    futureCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".launch-price-scroll");
    const sticky = section?.querySelector<HTMLElement>(".launch-price-sticky");

    if (!section || !sticky) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    let frame = 0;

    const resetSticky = () => {
      sticky.classList.remove("is-fixed", "is-ended");
      sticky.style.removeProperty("--launch-sticky-left");
      sticky.style.removeProperty("--launch-sticky-width");
      sticky.style.removeProperty("--launch-mobile-track-top");
      sticky.style.removeProperty("--launch-mobile-track-height");
    };

    const setStickyMode = (mode: "default" | "fixed" | "ended") => {
      sticky.classList.toggle("is-fixed", mode === "fixed");
      sticky.classList.toggle("is-ended", mode === "ended");
    };

    const syncLaunchTrack = () => {
      const timeline = sticky.querySelector<HTMLElement>(".launch-price-timeline");
      const firstDot = sticky.querySelector<HTMLElement>(".launch-price-step:first-child .launch-step-dot");
      const lastDot = sticky.querySelector<HTMLElement>(".launch-price-step:last-child .launch-step-dot");

      if (!timeline || !firstDot || !lastDot) {
        return { firstDot, lastDot };
      }

      const timelineRect = timeline.getBoundingClientRect();
      const firstDotRect = firstDot.getBoundingClientRect();
      const lastDotRect = lastDot.getBoundingClientRect();
      const trackTop = firstDotRect.top + firstDotRect.height / 2 - timelineRect.top;
      const trackBottom = lastDotRect.top + lastDotRect.height / 2 - timelineRect.top;

      sticky.style.setProperty("--launch-mobile-track-top", `${trackTop}px`);
      sticky.style.setProperty("--launch-mobile-track-height", `${Math.max(trackBottom - trackTop, 0)}px`);

      return { firstDot, lastDot };
    };

    const updateLaunchPriceProgress = () => {
      frame = 0;

      if (reducedMotion.matches) {
        setLaunchPriceProgress(1);
        setVisibleLaunchPriceStepCount(3);
        resetSticky();
        return;
      }

      if (mobileQuery.matches) {
        resetSticky();
        const { firstDot, lastDot } = syncLaunchTrack();
        const steps = Array.from(sticky.querySelectorAll<HTMLElement>(".launch-price-step"));
        const viewportCenter = (window.innerHeight || document.documentElement.clientHeight) / 2;
        const firstDotRect = firstDot?.getBoundingClientRect();
        const lastDotRect = lastDot?.getBoundingClientRect();
        const firstDotCenter = firstDotRect ? firstDotRect.top + firstDotRect.height / 2 : 0;
        const lastDotCenter = lastDotRect ? lastDotRect.top + lastDotRect.height / 2 : 1;
        const trackDistance = Math.max(lastDotCenter - firstDotCenter, 1);
        const progress = clamp((viewportCenter - firstDotCenter) / trackDistance);
        const visibleStepCount = steps.filter((step) => {
          const stepRect = step.getBoundingClientRect();
          return stepRect.top + stepRect.height / 2 <= viewportCenter;
        }).length;

        setLaunchPriceProgress((current) => (
          Math.abs(current - progress) < 0.004 ? current : progress
        ));
        setVisibleLaunchPriceStepCount((current) => (
          current === visibleStepCount ? current : visibleStepCount
        ));
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const sectionTop = sectionRect.top + scrollY;
      const sectionHeight = section.offsetHeight;
      const stickyHeight = sticky.offsetHeight;
      const fixedStart = sectionTop;
      const fixedEnd = sectionTop + sectionHeight - stickyHeight;
      const scrollableDistance = Math.max(sectionHeight - window.innerHeight, 1);
      const progress = clamp((scrollY - fixedStart) / scrollableDistance);

      sticky.style.setProperty("--launch-sticky-left", `${sectionRect.left}px`);
      sticky.style.setProperty("--launch-sticky-width", `${sectionRect.width}px`);
      syncLaunchTrack();

      if (fixedEnd <= fixedStart || scrollY < fixedStart) {
        setStickyMode("default");
      } else if (scrollY >= fixedEnd) {
        setStickyMode("ended");
      } else {
        setStickyMode("fixed");
      }

      const visibleStepCount = progress >= 0.96
        ? 3
        : progress >= 0.5
          ? 2
          : progress >= 0.06
            ? 1
            : 0;

      setLaunchPriceProgress((current) => (
        Math.abs(current - progress) < 0.004 ? current : progress
      ));
      setVisibleLaunchPriceStepCount((current) => (
        current === visibleStepCount ? current : visibleStepCount
      ));
    };

    const requestLaunchPriceProgress = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateLaunchPriceProgress);
    };

    updateLaunchPriceProgress();
    window.addEventListener("scroll", requestLaunchPriceProgress, { passive: true });
    window.addEventListener("resize", requestLaunchPriceProgress);
    reducedMotion.addEventListener("change", requestLaunchPriceProgress);
    mobileQuery.addEventListener("change", requestLaunchPriceProgress);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      resetSticky();
      window.removeEventListener("scroll", requestLaunchPriceProgress);
      window.removeEventListener("resize", requestLaunchPriceProgress);
      reducedMotion.removeEventListener("change", requestLaunchPriceProgress);
      mobileQuery.removeEventListener("change", requestLaunchPriceProgress);
    };
  }, []);

  return (
    <main className="site-shell">
      <section className="hero-shell" id="top">
        <header
          className={`site-header ${isHeaderScrolled ? "site-header-scrolled" : ""}`}
          aria-label="Main navigation"
        >
          <a className="brand" href="#top" aria-label="Gen-H home">
            <span>Gen-H</span>
          </a>
          <nav className="nav-links" aria-label="Page sections">
            <a href="#how-it-works">How it works</a>
            <a href="#what-we-test">What we test</a>
            <a href="#founding-members">Pricing</a>
          </nav>
          <WhatsAppCta variant="ghost" />
        </header>

        <div className="hero-frame">
          <video className="hero-video" autoPlay muted loop playsInline aria-hidden="true">
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="hero-content" aria-label="Gen-H preventive health introduction">
            <h1>Helping you stay well for life's best moments</h1>
            <p className="hero-copy">It starts with understanding your health early.</p>
            <div className="hero-actions">
              <WhatsAppCta />
            </div>
          </div>
          <div className="hero-proof-strip" aria-label="Gen-H highlights">
            <div>
              <strong>100+ biomarkers</strong>
              <span>Tailored to long-term health</span>
            </div>
            <div>
              <strong>Earlier risk signals</strong>
              <span>Before symptoms appear</span>
            </div>
            <div>
              <strong>Tracked over time</strong>
              <span>See what&apos;s changing</span>
            </div>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="intro-sticky">
          <div className="section-heading centered">
          <p className="eyebrow">Why it matters</p>
          <h2 className="intro-reveal-title" aria-label="You're trying to take your health seriously. It should feel less confusing.">
            {introRevealWords.map((word, index) => {
              const isAccent = index === introRevealWords.length - 1;

              return (
                <span
                  className={`intro-reveal-word ${isAccent ? "intro-reveal-accent keep-together" : ""}`}
                  data-accent={isAccent ? "true" : undefined}
                  key={`${word}-${index}`}
                >
                  {word}
                  {index < introRevealWords.length - 1 ? " " : ""}
                </span>
              );
            })}
          </h2>
          </div>
        </div>
      </section>

      <section className="future-health-section" id="future-health" aria-label="Future health preview">
        <div className="future-health-heading">
          <h2>
            That&apos;s why <span className="keep-together">Gen-H</span> <em>connects the dots</em>
          </h2>
        </div>
        <div className="future-card-grid">
          {futureHealthCards.map((card, index) => (
            <article
              className={`future-card ${visibleFutureCardIndexes.includes(index) ? "is-in-view" : ""}`}
              data-future-card
              data-future-card-index={index}
              key={card.number}
            >
              <FutureHealthVisual
                image={card.image}
                imageAlt={card.imageAlt}
                number={card.number}
                title={card.title}
              />
              <div className="future-card-copy">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section biomarker-section" id="what-we-test" aria-label="Biomarkers expert curated for longevity">
        <div className="section-heading centered biomarker-section-heading">
          <p className="eyebrow">What we test</p>
          <h2>
            The answers are in the <em>details</em>
          </h2>
          <div className="monitor-proof-row biomarker-proof-row" aria-label="Biomarker benefits">
            {biomarkerProofs.map((proof) => (
              <span key={proof}>
                <Check aria-hidden="true" size={15} />
                {proof}
              </span>
            ))}
          </div>
        </div>
        <BiomarkerGrid visibleBiomarkerIndexes={visibleBiomarkerIndexes} />
      </section>

      <section className="disease-monitor-section" id="early-indicators" aria-label="Long-term disease indicators">
        <div className="disease-monitor-heading">
          <h2>
            Monitor early indicators of <em>long-term diseases</em>
          </h2>
          <div className="monitor-proof-row" aria-label="Monitoring benefits">
            {monitorProofs.map((proof) => (
              <span key={proof}>
                <Check aria-hidden="true" size={15} />
                {proof}
              </span>
            ))}
          </div>
        </div>

        <div className="disease-marquee-stage">
          <div className="disease-marquee disease-marquee-right" aria-hidden="true">
            <div className="disease-marquee-track">
              {[0, 1].map((groupIndex) => (
                <div className="disease-marquee-group" key={`top-group-${groupIndex}`}>
                  {diseaseMarqueeTopLoop.map((name, index) => (
                    <span key={`${name}-top-${groupIndex}-${index}`}>{name}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="disease-marquee disease-marquee-left" aria-hidden="true">
            <div className="disease-marquee-track">
              {[0, 1].map((groupIndex) => (
                <div className="disease-marquee-group" key={`bottom-group-${groupIndex}`}>
                  {diseaseMarqueeBottomLoop.map((name, index) => (
                    <span key={`${name}-bottom-${groupIndex}-${index}`}>{name}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section how-process-section" id="how-it-works">
        <div className="section-heading how-process-intro">
          <p className="eyebrow">How it works</p>
          <h2>
            From early signals to a plan you can <em>act on</em>.
          </h2>
        </div>

        <div className="process-layout">
          <aside className="process-rail" aria-label="Gen-H process steps">
            <div className="process-rail-inner">
              <p className="process-rail-label">Process</p>
              <ol>
                {processSteps.map((step, index) => (
                  <li className={activeProcessIndex === index ? "is-active" : ""} key={step.id}>
                    <a href={`#${step.id}`} aria-current={activeProcessIndex === index ? "step" : undefined}>
                      <span className="process-rail-index">{step.railNumber}</span>
                      <span className="process-rail-title">{step.railTitle}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className="process-story">
            {processSteps.map((step, index) => (
              <article
                className={`process-panel process-panel-${step.visual} ${
                  activeProcessIndex === index ? "is-active" : ""
                } ${visibleProcessIndexes.includes(index) ? "is-visible" : ""}`}
                data-process-step
                data-process-index={index}
                id={step.id}
                key={step.id}
              >
                <div className="process-step-hero">
                  <img src={step.image} alt={step.imageAlt} />
                  <div className="process-step-hero-shade" aria-hidden="true" />
                  <div className="process-step-title">
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.summary}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="section-cta-row">
          <WhatsAppCta>Book a consult</WhatsAppCta>
        </div>
      </section>

      <section className="doctors-section" id="doctors" aria-label="Gen-H doctors">
        <div className="doctor-section-heading">
          <p className="eyebrow">Doctors</p>
          <h2>
            Led by doctors who treat{" "}
            <em className="keep-together">root causes</em>, not just symptoms.
          </h2>
        </div>

        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-profile-card" key={doctor.name}>
              <div className="doctor-portrait">
                <img src={doctor.image} alt={doctor.name} />
              </div>
              <div className="doctor-profile-content">
                <h3>{doctor.name}</h3>
                <p className="doctor-role">{doctor.role}</p>
                <div className="doctor-rule" aria-hidden="true" />
                <p className="doctor-credential">{doctor.credential}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="section-cta-row">
          <WhatsAppCta variant="ghost">Book a consult</WhatsAppCta>
        </div>
      </section>

      <section className="section comparison-section" id="compare">
        <div className="comparison-heading">
          <div>
            <h2>
              A <em>Gen-H</em> check-up vs. a standard screening.
            </h2>
            <p>
              Most screenings tell you whether you're sick today. Gen-H is built to help you stay well for decades.
            </p>
          </div>
        </div>

        <div className="comparison-table" role="table" aria-label="Gen-H compared with standard screening">
          <div className="comparison-row comparison-header" role="row">
            <div role="columnheader">Criterion</div>
            <div role="columnheader">Gen-H</div>
            <div role="columnheader">Standard screening</div>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-row" role="row" key={row.criterion}>
              <div role="cell">{row.criterion}</div>
              <div role="cell" className="genh-cell">
                {row.genhValue ? (
                  <span className="comparison-value">{row.genhValue}</span>
                ) : (
                  <Check aria-hidden="true" size={18} />
                )}
              </div>
              <div role="cell" className="standard-cell">
                {row.standardValue ? (
                  <span className="comparison-value">{row.standardValue}</span>
                ) : row.standardIncluded ? (
                  <Check aria-hidden="true" size={18} />
                ) : (
                  <span className="comparison-x-icon" aria-hidden="true">
                    <X size={16} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="comparison-cta">
          <WhatsAppCta variant="ghost">Book a consult</WhatsAppCta>
        </div>
      </section>

      <section
        className="founding-section launch-price-scroll"
        id="founding-members"
        style={{ "--launch-progress": launchPriceProgress.toFixed(3) } as CSSProperties}
      >
        <div className="launch-price-sticky">
          <div className="founding-heading">
            <p className="eyebrow">Launch price</p>
            <h2>
              Start with RM99. <em>Risk-free.</em>
            </h2>
          </div>

          <div className="launch-price-timeline" aria-label="Early Gen-H baseline programme price breakdown">
            <div className="launch-timeline-track" aria-hidden="true">
              <span className="launch-timeline-line" />
              <span className="launch-timeline-fill" />
            </div>

            <ol className="launch-price-steps">
              {launchPriceSteps.map((step, index) => (
                <li
                  className={`launch-price-step ${visibleLaunchPriceStepCount > index ? "is-active" : ""}`}
                  key={step.label}
                  style={{ "--step-index": index } as CSSProperties}
                >
                  <span className="launch-step-dot" aria-hidden="true">
                    <span />
                  </span>
                  <span className="launch-step-copy">
                    <strong>{step.label}</strong>
                    <span className="launch-step-label">{step.value}</span>
                    {"badge" in step && (
                      <span className="launch-step-badge">{step.badge}</span>
                    )}
                    <span className="launch-step-note">{step.note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="section-cta-row launch-price-cta">
            <WhatsAppCta>Book a consult</WhatsAppCta>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading centered">
          <p className="eyebrow">Questions</p>
          <h2>What to know before you enquire.</h2>
        </div>
        <div className="faq-accordion">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${openFaqIndex === index ? "is-open" : ""}`} key={faq.question}>
              <button
                className="faq-question"
                type="button"
                aria-expanded={openFaqIndex === index}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <ChevronDown aria-hidden="true" size={20} />
              </button>
              <div
                className="faq-answer"
                id={`faq-answer-${index}`}
                aria-hidden={openFaqIndex !== index}
              >
                <div className="faq-answer-inner">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="section-cta-row">
          <WhatsAppCta>Book a consult</WhatsAppCta>
        </div>
      </section>

      <footer className="footer">
        <a className="brand" href="#top" aria-label="Gen-H home">
          <span>Gen-H</span>
        </a>
        <p>Helping you stay well for life's best moments</p>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-we-test">What we test</a>
          <a href="#founding-members">Pricing</a>
        </nav>
      </footer>

      <section className="final-cta" id="final-cta" aria-label="Final enquiry call to action">
        <div className="final-cta-inner">
          <h2>
            Do it for the <em>people</em> who matter most
          </h2>
          <p>Take care of yourself, with Gen-H.</p>
          <WhatsAppCta>Book a consult</WhatsAppCta>
        </div>
      </section>
    </main>
  );
}

export default App;
