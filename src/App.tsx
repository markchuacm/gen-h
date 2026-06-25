import { type CSSProperties, useEffect, useState } from "react";
import Lenis from "lenis";
import {
  Activity,
  Check,
  ChevronDown,
  CircleDot,
  Droplets,
  HeartPulse,
  Plus,
  Shield,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import heroVideo from "../assets/hero-draft1.mp4";
import processBaselineImage from "../assets/process-step-teleconsult.jpg";
import processBiomarkersImage from "../assets/process-step-biomarker-plan.jpg";
import processLabsImage from "../assets/process-step-blood-draw.jpg";
import processPlanImage from "../assets/generated/process-step-plan.png";
import deannaImage from "../assets/doctors/deanna-abdul-halim.png";
import ongImage from "../assets/doctors/ong-shiau-ying.png";
import farheenImage from "../assets/doctors/farheen-nafisa.png";

const whatsappMessage =
  "Hi, I'm interested in the Gen-H Founding Members program. Could you share availability and next steps?";
const whatsappHref = `https://wa.me/60173280063?text=${encodeURIComponent(whatsappMessage)}`;

const futureHealthCards = [
  {
    number: "01",
    title: "Deeper biomarkers",
    text: "More than a standard screening",
    visual: "biomarkers",
  },
  {
    number: "02",
    title: "Earlier signals",
    text: "Learn where your health is going",
    visual: "signals",
  },
  {
    number: "03",
    title: "Tailored plan",
    text: "Reviewed with your doctor",
    visual: "plan",
  },
] as const;

const futurePlanRows = [
  {
    title: "Foods",
    detail: "6oz Wild Salmon, Organic Parsley...",
    icon: "foods",
  },
  {
    title: "Supplements",
    detail: "750mg Inositol, 100mg CoQ10...",
    icon: "supplements",
  },
  {
    title: "Daily health",
    detail: "Stretching, muscle growth, sleep...",
    icon: "daily",
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
  children = "Enquire",
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

function PlanActionIcon({ icon }: { icon: (typeof futurePlanRows)[number]["icon"] }) {
  if (icon === "foods") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M5 12h14l-1.1 5.4A3.2 3.2 0 0 1 14.8 20H9.2a3.2 3.2 0 0 1-3.1-2.6L5 12Z" />
        <path d="M8 12a4 4 0 0 1 8 0" />
        <path d="M9.5 9.4 8.2 7.8" />
        <path d="M14.5 9.4l1.3-1.6" />
        <path d="M9 15h6" />
      </svg>
    );
  }

  if (icon === "supplements") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M10.2 20.1a4.5 4.5 0 0 1-6.3-6.3l3-3a4.5 4.5 0 1 1 6.3 6.3l-3 3Z" />
        <path d="m7.2 13.8 3 3" />
        <path d="M15 6.5h2.8a3.2 3.2 0 0 1 0 6.4H15V6.5Z" />
        <path d="M15 9.7h4.6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M6 8v8" />
      <path d="M18 8v8" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
      <path d="M3.5 12h17" />
    </svg>
  );
}

function FutureHealthVisual({ visual }: { visual: (typeof futureHealthCards)[number]["visual"] }) {
  if (visual === "biomarkers") {
    return (
      <div className="future-visual future-visual-biomarkers" aria-hidden="true">
        <div className="biomarker-tablet-cluster">
          <div className="standard-biomarker-row">
            {["LDL", "HDL", "Triglycerides"].map((label) => (
              <span className="biomarker-tablet biomarker-tablet-standard" key={label}>
                {label}
              </span>
            ))}
          </div>
          <div className="advanced-biomarker-row">
            {["ApoB", "Lp(a)", "Homocysteine", "hs-CRP"].map((label, index) => (
              <span
                className="biomarker-tablet biomarker-tablet-advanced"
                key={label}
                style={{ "--tablet-index": index } as CSSProperties}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visual === "signals") {
    return (
      <div className="future-visual future-visual-signals" aria-hidden="true">
        <div className="explained-range-card">
          <svg className="explained-range-chart" viewBox="0 0 560 420">
            <defs>
              <linearGradient id="explainedRangeBandGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(184, 93, 53, 0.2)" />
                <stop offset="100%" stopColor="rgba(184, 93, 53, 0)" />
              </linearGradient>
              <clipPath id="explainedRangeRevealClip" clipPathUnits="userSpaceOnUse">
                <rect className="explained-range-sweep-clip" x="52" y="118" width="496" height="288" />
              </clipPath>
            </defs>
            <path className="explained-range-grid" d="M28 168H548M28 274H548" />
            <rect className="explained-range-bar explained-range-bar-empty" x="52" y="72" width="18" height="86" rx="6" />
            <rect className="explained-range-bar explained-range-bar-active" x="52" y="178" width="18" height="86" rx="6" />
            <rect className="explained-range-bar explained-range-bar-empty" x="52" y="284" width="18" height="86" rx="6" />
            <text className="explained-range-label" x="112" y="115">ABOVE RANGE</text>
            <text className="explained-range-label" x="112" y="221">IN RANGE</text>
            <text className="explained-range-label" x="112" y="327">BELOW RANGE</text>
            <g className="explained-range-sweep" clipPath="url(#explainedRangeRevealClip)">
              <rect className="explained-range-band" x="52" y="168" width="496" height="106" rx="6" />
              <path className="explained-range-columns" d="M258 184V382M390 242V382M506 218V382" />
              <path className="explained-range-line" d="M258 184 L390 242 L506 218" />
              <circle className="explained-range-point point-one" cx="258" cy="184" r="10" />
              <circle className="explained-range-point point-two" cx="390" cy="242" r="10" />
              <circle className="explained-range-point point-three" cx="506" cy="218" r="10" />
              <text className="explained-range-value point-one" x={258} y={160}>16.7</text>
              <text className="explained-range-value point-two" x={390} y={218}>10.0</text>
              <text className="explained-range-value point-three" x={506} y={194}>12.5</text>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="future-visual future-visual-plan" aria-hidden="true">
      <div className="plan-action-stack">
        {futurePlanRows.map((row, index) => (
          <div className="plan-action-card" key={row.title} style={{ "--plan-index": index } as CSSProperties}>
            <span className="plan-action-icon">
              <PlanActionIcon icon={row.icon} />
            </span>
            <span className="plan-action-copy">
              <strong>{row.title}</strong>
              <span>{row.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const processSteps = [
  {
    id: "health-baseline",
    number: "Step 1",
    railNumber: "1.",
    railTitle: "Teleconsult",
    title: "Start with a teleconsult",
    summary: "Share your history, goals, lifestyle, family history, and previous results so your doctor starts with the right context.",
    visual: "baseline",
    image: processBaselineImage,
    imageAlt: "A woman joining a virtual health consultation from a bright dining table",
  },
  {
    id: "what-we-test",
    number: "Step 2",
    railNumber: "2.",
    railTitle: "Biomarker plan",
    title: "Your doctor configures your biomarker panel",
    summary: "Test according to your needs and long-term health priorities.",
    visual: "biomarkers",
    image: processBiomarkersImage,
    imageAlt: "Two hands holding a red heart against a pale background",
  },
  {
    id: "blood-draw",
    number: "Step 3",
    railNumber: "3.",
    railTitle: "Partner lab",
    title: "Visit partner blood draw facility",
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
    title: "Review results and next actions",
    summary: "Review the markers that matter with your doctor, then turn them into clear next actions and follow-up testing where needed.",
    visual: "review",
    image: processPlanImage,
    imageAlt: "A warm desk scene with abstract health result dashboards and care plan materials",
  },
] as const;

function ProcessBiomarkerGrid({
  visibleBiomarkerIndexes = [],
}: {
  visibleBiomarkerIndexes?: number[];
}) {
  return (
    <div className="process-biomarker-block">
      <div className="biomarker-grid process-biomarker-grid">
        {biomarkerGroups.map((group, index) => {
          const BiomarkerIcon = group.icon;

          return (
            <article
              className={`biomarker-card ${group.isMore ? "biomarker-more" : ""} ${
                visibleBiomarkerIndexes.includes(index) ? "is-visible" : ""
              }`}
              data-biomarker-index={index}
              key={group.title}
              style={{ "--stagger": `${Math.min(index, 7) * 130}ms` } as CSSProperties}
            >
              <div className="biomarker-card-header">
                <div>
                  <h3>{group.title}</h3>
                  <p className="biomarker-count">{group.count}</p>
                </div>
                <span className="biomarker-icon" aria-hidden="true">
                  <BiomarkerIcon strokeWidth={1.3} />
                </span>
              </div>
              <ul>
                {group.tests.map((test) => (
                  <li key={test}>{test}</li>
                ))}
              </ul>
            </article>
          );
        })}
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
  },
  {
    title: "Hormones & thyroid",
    count: "16+ biomarkers",
    tests: ["TSH", "Free T4", "Total testosterone", "Estradiol", "SHBG", "DHEA-S"],
    icon: Activity,
  },
  {
    title: "Inflammation & immunity",
    count: "12+ biomarkers",
    tests: ["High-sensitivity CRP", "ESR", "White cell differential", "Neutrophils", "Lymphocytes"],
    icon: Shield,
  },
  {
    title: "Liver & kidney",
    count: "20+ biomarkers",
    tests: ["ALT", "AST", "GGT", "Creatinine", "eGFR", "Cystatin C"],
    icon: Droplets,
  },
  {
    title: "Nutrients & vitamins",
    count: "14+ biomarkers",
    tests: ["Vitamin D", "Vitamin B12", "Folate", "Ferritin", "Magnesium", "Methylmalonic acid"],
    icon: Sparkles,
  },
  {
    title: "Blood & iron",
    count: "18+ biomarkers",
    tests: ["Full blood count", "Iron studies", "Platelets", "Haemoglobin", "Red cell distribution width"],
    icon: CircleDot,
  },
  {
    title: "Aging & stress",
    count: "10+ biomarkers",
    tests: ["Homocysteine", "DHEA-S", "Cortisol", "Uric acid", "Omega balance"],
    icon: Waves,
  },
  {
    title: "+More",
    count: "Doctor-prescribed add-ons",
    tests: ["Personalized to your history", "Adjusted for goals", "Reviewed in context"],
    icon: Plus,
    isMore: true,
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
    criterion: "Virtual consults + local lab",
    genhIncluded: true,
    standardIncluded: false,
  },
];

const inclusions = [
  "Virtual initial and follow-up consults",
  "100+ longevity-focused biomarkers",
  "Blood draw with Innoquest or BP Healthcare",
  "Personalized care plan",
  "Doctor-reviewed report",
  "Clear next steps for diet, sleep and exercise",
];

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
    question: "Why does the price say up to RM1,250?",
    answer:
      "Your doctor configures the panel around what you need. If you already have recent blood tests or do not need every marker, your final price may be lower.",
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
    question: "How is this different from a normal check-up?",
    answer:
      "A normal check-up usually looks for disease today. Gen-H looks at 100+ biomarkers to help you understand your disease risks for the future, and tells you how to address them now.",
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
  const [isBiomarkerListOpen, setIsBiomarkerListOpen] = useState(false);
  const [isFutureHealthInView, setIsFutureHealthInView] = useState(false);
  const [futureHealthAnimationKey, setFutureHealthAnimationKey] = useState(0);

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
    type UnderlineConfig = {
      name: string;
      start: number;
      end: number;
    };

    type UnderlineState = UnderlineConfig & {
      value: number;
      target: number;
      velocity: number;
    };

    const underlineSources = [
      {
        element: document.querySelector<HTMLElement>(".intro-section"),
        trigger: document.querySelector<HTMLElement>(".intro-section h2"),
        variables: [
          { name: "--normal-underline", start: 0.25, end: 0.58 },
          { name: "--optimal-underline", start: 0.25, end: 0.58 },
        ],
      },
      {
        element: document.querySelector<HTMLElement>(".doctors-section"),
        trigger: document.querySelector<HTMLElement>(".doctors-section h2"),
        variables: [
          { name: "--root-causes-underline", start: 0.25, end: 0.58 },
          { name: "--symptoms-underline", start: 0.25, end: 0.58 },
        ],
      },
    ].filter((section): section is {
      element: HTMLElement;
      trigger: HTMLElement;
      variables: UnderlineConfig[];
    } => Boolean(section.element && section.trigger));

    const underlineSections = underlineSources.map(({ element, trigger, variables }) => ({
      element,
      trigger,
      variables: variables.map((variable): UnderlineState => ({
        ...variable,
        value: 0,
        target: 0,
        velocity: 0,
      })),
    }));

    if (!underlineSections.length) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const segment = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
    let frame = 0;
    let previousFrameTime = 0;

    const setReducedMotionProgress = () => {
      underlineSections.forEach(({ element, variables }) => {
        variables.forEach((variable) => {
          variable.value = 1;
          variable.target = 1;
          variable.velocity = 0;
          element.style.setProperty(variable.name, "1");
        });
      });
    };

    const updateUnderlineTargets = () => {
      if (reducedMotion.matches) {
        setReducedMotionProgress();
        return;
      }

      const viewportHeight = window.innerHeight || 1;

      underlineSections.forEach(({ trigger, variables }) => {
        const triggerRect = trigger.getBoundingClientRect();
        const triggerCenter = triggerRect.top + triggerRect.height / 2;
        const progress = clamp((viewportHeight - triggerCenter) / viewportHeight);

        variables.forEach((variable) => {
          variable.target = segment(progress, variable.start, variable.end);
        });
      });
    };

    const syncUnderlineProgress = () => {
      updateUnderlineTargets();

      underlineSections.forEach(({ element, variables }) => {
        variables.forEach((variable) => {
          variable.value = variable.target;
          variable.velocity = 0;
          element.style.setProperty(variable.name, variable.value.toFixed(3));
        });
      });
    };

    const animateUnderlineProgress = (time: number) => {
      if (reducedMotion.matches) {
        frame = 0;
        previousFrameTime = 0;
        setReducedMotionProgress();
        return;
      }

      if (!previousFrameTime) {
        previousFrameTime = time;
      }

      const deltaSeconds = Math.min((time - previousFrameTime) / 1000, 0.05);
      previousFrameTime = time;
      let shouldContinue = false;

      underlineSections.forEach(({ element, variables }) => {
        variables.forEach((variable) => {
          const distance = variable.target - variable.value;

          variable.velocity += distance * 24 * deltaSeconds;
          variable.velocity *= Math.exp(-5.5 * deltaSeconds);
          variable.value = clamp(variable.value + variable.velocity * deltaSeconds);

          if (
            (variable.value === 0 && variable.velocity < 0) ||
            (variable.value === 1 && variable.velocity > 0)
          ) {
            variable.velocity = 0;
          }

          if (Math.abs(variable.target - variable.value) < 0.001 && Math.abs(variable.velocity) < 0.001) {
            variable.value = variable.target;
            variable.velocity = 0;
          } else {
            shouldContinue = true;
          }

          element.style.setProperty(variable.name, variable.value.toFixed(3));
        });
      });

      if (shouldContinue) {
        frame = window.requestAnimationFrame(animateUnderlineProgress);
        return;
      }

      frame = 0;
      previousFrameTime = 0;
    };

    const requestUpdate = () => {
      updateUnderlineTargets();

      if (frame) {
        return;
      }

      previousFrameTime = 0;
      frame = window.requestAnimationFrame(animateUnderlineProgress);
    };

    const handleMotionPreferenceChange = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        previousFrameTime = 0;
      }

      syncUnderlineProgress();
    };

    syncUnderlineProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".biomarker-card"));

    if (!("IntersectionObserver" in window)) {
      setVisibleBiomarkerIndexes(biomarkerGroups.map((_, index) => index));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const index = Number((entry.target as HTMLElement).dataset.biomarkerIndex);
          if (!Number.isNaN(index)) {
            setVisibleBiomarkerIndexes((current) => (
              current.includes(index) ? current : [...current, index]
            ));
          }
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -24% 0px", threshold: 0.18 },
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
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
    const activeStep = processSteps[activeProcessIndex];
    if (activeStep?.visual !== "biomarkers") {
      return;
    }

    setVisibleBiomarkerIndexes(biomarkerGroups.map((_, index) => index));
  }, [activeProcessIndex]);

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
    const futureHealthSection = document.getElementById("future-health");

    if (!futureHealthSection) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      setIsFutureHealthInView(true);
      return;
    }

    let hasReachedRevealPoint = false;
    let isPersistingView = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const hasAnyIntersection = entry.isIntersecting;
        const isAtRevealPoint = hasAnyIntersection && entry.intersectionRatio >= 0.28;

        if (isAtRevealPoint && !hasReachedRevealPoint) {
          hasReachedRevealPoint = true;
          isPersistingView = true;
          setIsFutureHealthInView(true);
          setFutureHealthAnimationKey((key) => key + 1);
          return;
        }

        if (!hasAnyIntersection && isPersistingView) {
          hasReachedRevealPoint = false;
          isPersistingView = false;
          setIsFutureHealthInView(false);
        }

        if (hasAnyIntersection && hasReachedRevealPoint && !isPersistingView) {
          isPersistingView = true;
          setIsFutureHealthInView(true);
        }
      },
      {
        threshold: [0, 0.28, 0.5],
        rootMargin: "-8% 0px -18% 0px",
      },
    );

    observer.observe(futureHealthSection);

    return () => observer.disconnect();
  }, []);

  return (
    <main className="site-shell">
      <section className="hero-shell" id="top">
        <header
          className={`site-header ${isHeaderScrolled ? "site-header-scrolled" : ""}`}
          aria-label="Main navigation"
        >
          <a className="brand" href="#top" aria-label="Gen-H home">
            <span className="brand-mark">G</span>
            <span>Gen-H</span>
          </a>
          <nav className="nav-links" aria-label="Page sections">
            <a href="#how-it-works">How it works</a>
            <a href="#what-we-test">What we test</a>
            <a href="#compare">Compare</a>
            <a href="#founding-members">Founding Members</a>
          </nav>
          <WhatsAppCta variant="ghost" />
        </header>

        <div className="hero-frame">
          <video className="hero-video" autoPlay muted loop playsInline aria-hidden="true">
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="hero-content" aria-label="Gen-H preventive health introduction">
            <h1>Stay well for life's best moments.</h1>
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
              <strong>Personalized</strong>
              <span>Designed for Malaysians</span>
            </div>
            <div>
              <strong>Accessible</strong>
              <span>Up to RM1,250</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="section-heading centered">
          <p className="eyebrow">Advanced health intelligence</p>
          <h2>
            Most check-ups stop at <span className="scroll-underline intro-emphasis-normal">normal</span>. Gen-H looks
            for what is <span className="scroll-underline intro-emphasis-optimal">optimal</span> for you.
          </h2>
          <WhatsAppCta variant="ghost">Find out how</WhatsAppCta>
        </div>
      </section>

      <section
        className={`future-health-section ${isFutureHealthInView ? "is-in-view" : ""}`}
        id="future-health"
        aria-label="Future health preview"
      >
        <div className="future-health-heading">
          <h2>
            Your <em>future</em> health, revealed <em>today</em>.
          </h2>
        </div>
        <div className="future-card-grid" key={futureHealthAnimationKey}>
          {futureHealthCards.map((card) => (
            <article className="future-card" key={card.number}>
              <div className="future-card-copy">
                <p className="future-card-number">{card.number}</p>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
              <FutureHealthVisual visual={card.visual} />
            </article>
          ))}
        </div>
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
            Your path to <em>long-term</em> health
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

                {step.visual === "biomarkers" && (
                  <div className="process-biomarker-reveal">
                    <button
                      className="process-biomarker-toggle"
                      type="button"
                      aria-expanded={isBiomarkerListOpen}
                      aria-controls="biomarker-list"
                      onClick={() => setIsBiomarkerListOpen((isOpen) => !isOpen)}
                    >
                      <span>See list of biomarkers</span>
                      <ChevronDown aria-hidden="true" size={18} />
                    </button>
                    <div
                      className={`process-biomarker-collapse ${isBiomarkerListOpen ? "is-open" : ""}`}
                      id="biomarker-list"
                      aria-hidden={!isBiomarkerListOpen}
                    >
                      <div className="process-biomarker-collapse-inner">
                        <ProcessBiomarkerGrid visibleBiomarkerIndexes={visibleBiomarkerIndexes} />
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="section-cta-row">
          <WhatsAppCta>Develop your personalized plan</WhatsAppCta>
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
          <WhatsAppCta variant="ghost">Compare your options</WhatsAppCta>
        </div>
      </section>

      <section className="founding-section" id="founding-members">
        <div className="founding-heading">
          <p className="eyebrow">Launch price</p>
          <h2>
            Only for our first <em>150 customers</em>
          </h2>
        </div>

        <div className="launch-price-card" aria-label="Launch price and inclusions">
          <div className="launch-price-copy">
            <h3>
              Up to <em>RM1,250.</em>
            </h3>
            <p className="price-note">Final pricing may be lower, depending on tests taken</p>
            <WhatsAppCta>Enquire about launch price</WhatsAppCta>
          </div>

          <ul className="inclusion-list">
            {inclusions.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="doctors-section" id="doctors" aria-label="Gen-H doctors">
        <div className="doctor-section-heading">
          <p className="eyebrow">Doctors</p>
          <h2>
            Led by doctors who treat{" "}
            <span className="keep-together">
              <span className="scroll-underline doctor-emphasis-root">root causes</span>,
            </span>{" "}
            not just{" "}
            <span className="scroll-underline doctor-emphasis-symptoms">symptoms</span>.
          </h2>
          <p>
            Your results are reviewed in context, then translated into clear next steps for long-term health.
          </p>
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
          <WhatsAppCta variant="ghost">Ask about doctors</WhatsAppCta>
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
          <WhatsAppCta>Enquire on WhatsApp</WhatsAppCta>
        </div>
      </section>

      <footer className="footer">
        <a className="brand" href="#top" aria-label="Gen-H home">
          <span className="brand-mark">G</span>
          <span>Gen-H</span>
        </a>
        <p>Doctor-led longevity check-ups.</p>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-we-test">What we test</a>
          <a href="#compare">Compare</a>
          <a href="#founding-members">Founding Members</a>
        </nav>
      </footer>

      <section className="final-cta" id="final-cta" aria-label="Final enquiry call to action">
        <div className="final-cta-inner">
          <h2>
            For the <em>people</em> that matter most.
          </h2>
          <p>Take care of yourself, with Gen-H.</p>
          <WhatsAppCta>Enquire</WhatsAppCta>
        </div>
      </section>
    </main>
  );
}

export default App;
