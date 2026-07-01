import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Folder,
  FlaskConical,
  Gift,
  HeartPulse,
  Home,
  Hourglass,
  ListChecks,
  MapPin,
  Menu,
  RotateCcw,
  Settings,
  Target,
  UserRound,
  Video,
} from "lucide-react";
import heroProfileImage from "../../assets/dashboard/health-profile-hero.png";
import heroConsultImage from "../../assets/dashboard/pre-consult-hero.png";
import heroBloodFormImage from "../../assets/dashboard/blood-test-form-hero.png";
import heroResultsImage from "../../assets/dashboard/test-results-hero.png";
import heroCarePlanImage from "../../assets/dashboard/care-plan-hero.png";
import ProfileTab from "./doctor-review-brief/ProfileTab";
import IntakeShell from "./doctor-review-brief/IntakeShell";
import { clearSavedProgress } from "./doctor-review-brief/useIntakeState";
import type { Phase } from "./doctor-review-brief/useIntakeState";

// ─── Journey state model ──────────────────────────────────────────────────────

type JourneyStateId = "PROFILE_INCOMPLETE" | "CONSULT_UPCOMING" | "BLOOD_FORM_READY" | "RESULTS_PENDING" | "CARE_PLAN_READY";

type StepState = "completed" | "active" | "upcoming";

type Step = {
  number: string;
  label: string;
  statusLabel: string;
  state: StepState;
};

type ConsultCardData = {
  type: "consult";
  primaryCta: string;
  secondaryCta?: string;
};

type BloodDrawCardData = {
  type: "bloodDraw";
  labName: string;
  labBranch: string;
  labAddress: string;
  labHours: string;
  bloodDrawInstructions: string;
  pathologyRequestFormUrl: string;
  primaryCta: string;
  secondaryCta?: string;
};

type ResultsCardData = {
  type: "results";
  status: string;
  testName: string;
  bloodDrawStatus: string;
  expectedTiming: string;
  nextStep: string;
  primaryCta: string;
};

type CarePlanCardData = {
  type: "carePlan";
  priorityAreas: string;
  recommendedActions: string;
  nextReview: string;
  retestPlan: string;
  primaryCta: string;
};

type RightCardData = ConsultCardData | BloodDrawCardData | ResultsCardData | CarePlanCardData;

type StateConfig = {
  id: JourneyStateId;
  headerTitle: string;
  hero: {
    label: string;
    titleBefore: string;
    titleEm?: string;
    body: string;
    primaryCta: string;
    secondaryCta?: string;
    image: string;
  };
  steps: Step[];
  tip: { title: string; body: string };
  rightCard: RightCardData;
};

const STATES: Record<JourneyStateId, StateConfig> = {
  PROFILE_INCOMPLETE: {
    id: "PROFILE_INCOMPLETE",
    headerTitle: "Welcome to Gen-H, Mark",
    hero: {
      label: "Health profile",
      titleBefore: "Complete your ",
      titleEm: "health profile",
      body: "Help your doctor understand your goals, lifestyle, history and existing reports before your consult.",
      primaryCta: "Continue profile",
      image: heroProfileImage,
    },
    steps: [
      { number: "1", label: "Profile", statusLabel: "Not started", state: "active" },
      { number: "2", label: "Consult", statusLabel: "Upcoming", state: "upcoming" },
      { number: "3", label: "Blood Draw", statusLabel: "Upcoming", state: "upcoming" },
      { number: "4", label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { number: "5", label: "Care Plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your consult",
      body: "Complete your profile so your doctor can review your goals, lifestyle, history and existing reports.",
    },
    rightCard: {
      type: "consult",
      primaryCta: "View consult details",
    },
  },
  CONSULT_UPCOMING: {
    id: "CONSULT_UPCOMING",
    headerTitle: "Welcome back, Mark",
    hero: {
      label: "Upcoming consult",
      titleBefore: "Get ready for ",
      titleEm: "your consult",
      body: "Meet Dr. Lim Wen Qi at 10:00 AM.",
      primaryCta: "Join consult",
      secondaryCta: "Add to calendar",
      image: heroConsultImage,
    },
    steps: [
      { number: "1", label: "Profile", statusLabel: "Completed", state: "completed" },
      { number: "2", label: "Consult", statusLabel: "Upcoming", state: "active" },
      { number: "3", label: "Blood Draw", statusLabel: "Upcoming", state: "upcoming" },
      { number: "4", label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { number: "5", label: "Care Plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your consult",
      body: "Review your goals, symptoms and questions before meeting your doctor.",
    },
    rightCard: {
      type: "consult",
      primaryCta: "Join consult",
    },
  },
  BLOOD_FORM_READY: {
    id: "BLOOD_FORM_READY",
    headerTitle: "Welcome back, Mark",
    hero: {
      label: "Blood draw",
      titleBefore: "Your blood test form ",
      titleEm: "is ready",
      body: "Bring this form to your assigned lab.",
      primaryCta: "View form",
      secondaryCta: "Download PDF",
      image: heroBloodFormImage,
    },
    steps: [
      { number: "1", label: "Profile", statusLabel: "Completed", state: "completed" },
      { number: "2", label: "Consult", statusLabel: "Completed", state: "completed" },
      { number: "3", label: "Blood Draw", statusLabel: "Next step", state: "active" },
      { number: "4", label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { number: "5", label: "Care Plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your blood draw",
      body: "Fast for 8–10 hours if instructed. Drink water as usual. Bring your request form to the assigned lab.",
    },
    rightCard: {
      type: "bloodDraw",
      labName: "Innoquest",
      labBranch: "TTDI",
      labAddress: "24G, Jalan Wan Kadir 3, Taman Tun Dr Ismail, 60000 Kuala Lumpur",
      labHours: "Mon–Sat, 7:30 AM – 5:00 PM",
      bloodDrawInstructions: "Fast for 8–10 hours if instructed. Drink water as usual.",
      pathologyRequestFormUrl: "#",
      primaryCta: "View form",
    },
  },
  RESULTS_PENDING: {
    id: "RESULTS_PENDING",
    headerTitle: "Welcome back, Mark",
    hero: {
      label: "Results",
      titleBefore: "Your results are ",
      titleEm: "processing",
      body: "We'll organise them once they're ready.",
      primaryCta: "View journey",
      image: heroResultsImage,
    },
    steps: [
      { number: "1", label: "Profile", statusLabel: "Completed", state: "completed" },
      { number: "2", label: "Consult", statusLabel: "Completed", state: "completed" },
      { number: "3", label: "Blood Draw", statusLabel: "Completed", state: "completed" },
      { number: "4", label: "Results", statusLabel: "Processing", state: "active" },
      { number: "5", label: "Care Plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "What happens next",
      body: "Your results will be organised by key health areas once they're ready.",
    },
    rightCard: {
      type: "results",
      status: "Processing",
      testName: "Advanced Blood Baseline",
      bloodDrawStatus: "Completed",
      expectedTiming: "3–7 working days",
      nextStep: "Results will appear in your portal once ready.",
      primaryCta: "View journey",
    },
  },
  CARE_PLAN_READY: {
    id: "CARE_PLAN_READY",
    headerTitle: "Welcome back, Mark",
    hero: {
      label: "Care plan",
      titleBefore: "Your care plan ",
      titleEm: "is ready",
      body: "Clear next steps from your doctor.",
      primaryCta: "View care plan",
      image: heroCarePlanImage,
    },
    steps: [
      { number: "1", label: "Profile", statusLabel: "Completed", state: "completed" },
      { number: "2", label: "Consult", statusLabel: "Completed", state: "completed" },
      { number: "3", label: "Blood Draw", statusLabel: "Completed", state: "completed" },
      { number: "4", label: "Results", statusLabel: "Completed", state: "completed" },
      { number: "5", label: "Care Plan", statusLabel: "Ready", state: "active" },
    ],
    tip: {
      title: "Your next step",
      body: "Review your care plan and follow the recommendations discussed by your doctor.",
    },
    rightCard: {
      type: "carePlan",
      priorityAreas: "3",
      recommendedActions: "6",
      nextReview: "In 12 weeks",
      retestPlan: "Recommended after your review period",
      primaryCta: "View care plan",
    },
  },
};

// ─── Nav data ─────────────────────────────────────────────────────────────────

type NavItem = { label: string; icon: LucideIcon };

// Only Home and Profile are wired to views for this sprint; the rest keep their
// current (inert) behavior unchanged.
type MemberTab = "home" | "profile";

const primaryNavItems: NavItem[] = [
  { label: "Home", icon: Home },
  { label: "Profile", icon: UserRound },
  { label: "Results", icon: Activity },
  { label: "Care Plan", icon: HeartPulse },
  { label: "Documents", icon: Folder },
];

const tabForLabel = (label: string): MemberTab | undefined =>
  label === "Home" ? "home" : label === "Profile" ? "profile" : undefined;

const secondaryNavItems: NavItem[] = [
  { label: "Referrals", icon: Gift },
  { label: "Settings", icon: Settings },
];

// ─── Shared components ────────────────────────────────────────────────────────

function Logo() {
  return (
    <a className="member-logo" href="/" aria-label="Gen-H home">
      Gen-H
    </a>
  );
}

function NotificationButton() {
  return (
    <button className="member-icon-button notification-button" type="button" aria-label="Notifications">
      <Bell strokeWidth={1.8} />
      <span aria-hidden="true" />
    </button>
  );
}

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <button className={`sidebar-nav-item ${isActive ? "is-active" : ""}`} type="button" onClick={onClick}>
      <Icon strokeWidth={1.65} />
      <span>{item.label}</span>
    </button>
  );
}

function DesktopSidebar({ activeTab, onNav }: { activeTab: MemberTab; onNav: (tab: MemberTab) => void }) {
  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
      <Logo />
      <nav className="sidebar-nav" aria-label="Primary">
        {primaryNavItems.map((item) => {
          const tab = tabForLabel(item.label);
          return (
            <SidebarNavItem
              item={item}
              key={item.label}
              isActive={tab !== undefined && tab === activeTab}
              onClick={tab ? () => onNav(tab) : undefined}
            />
          );
        })}
      </nav>
      <div className="sidebar-lower">
        <nav className="sidebar-nav sidebar-nav-secondary" aria-label="Secondary">
          {secondaryNavItems.map((item) => (
            <SidebarNavItem item={item} key={item.label} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function DesktopUserMenu({
  stateId,
  onStateChange,
}: {
  stateId: JourneyStateId;
  onStateChange: (s: JourneyStateId) => void;
}) {
  return (
    <div className="desktop-user-menu">
      <select
        className="builder-toggle"
        value={stateId}
        onChange={(e) => onStateChange(e.target.value as JourneyStateId)}
        aria-label="Preview journey state"
      >
        <option value="PROFILE_INCOMPLETE">Profile incomplete</option>
        <option value="CONSULT_UPCOMING">Consult upcoming</option>
        <option value="BLOOD_FORM_READY">Blood draw</option>
        <option value="RESULTS_PENDING">Results pending</option>
        <option value="CARE_PLAN_READY">Care plan ready</option>
      </select>
      <NotificationButton />
      <button className="profile-menu-button" type="button">
        <span className="profile-initial">M</span>
        <span>Mark Chua</span>
        <ChevronDown strokeWidth={1.6} />
      </button>
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="mobile-header">
      <button className="member-icon-button" type="button" aria-label="Open menu">
        <Menu strokeWidth={1.8} />
      </button>
      <Logo />
      <NotificationButton />
    </header>
  );
}

// ─── State-driven section components ─────────────────────────────────────────

function HeroCard({ hero }: { hero: StateConfig["hero"] }) {
  return (
    <section className="dashboard-card hero-card" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <span className="status-pill">{hero.label}</span>
        <h2 id="hero-heading">
          {hero.titleBefore}
          {hero.titleEm && <em>{hero.titleEm}</em>}
        </h2>
        <p>{hero.body}</p>
        <div className="hero-actions">
          <button className="primary-action" type="button">
            {hero.primaryCta}
            <ChevronRight strokeWidth={2} />
          </button>
          {hero.secondaryCta && (
            <button className="secondary-action" type="button">
              {hero.secondaryCta}
            </button>
          )}
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <img src={hero.image} alt="" />
      </div>
    </section>
  );
}

function JourneyCard({ steps, tip }: { steps: Step[]; tip: StateConfig["tip"] }) {
  return (
    <section className="dashboard-card journey-card" aria-labelledby="journey-title">
      <h2 id="journey-title">Your Gen-H journey</h2>
      <ol className="journey-steps">
        {steps.map((step) => (
          <li
            key={step.number}
            className={
              step.state === "active"
                ? "is-active"
                : step.state === "completed"
                  ? "is-completed"
                  : ""
            }
          >
            <span className="journey-marker">
              {step.state === "completed" ? <Check strokeWidth={2.5} /> : step.number}
            </span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.statusLabel}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="before-consult-tip">
        <div className="before-consult-tip-inner">
          <strong>{tip.title}</strong>
          <p>{tip.body}</p>
        </div>
      </div>
    </section>
  );
}

function DoctorAvatar() {
  return (
    <div className="doctor-avatar" aria-hidden="true">
      LW
    </div>
  );
}

function LabAvatar({ initials }: { initials: string }) {
  return (
    <div className="doctor-avatar" aria-hidden="true">
      {initials}
    </div>
  );
}

function ConsultCard({ data }: { data: ConsultCardData }) {
  return (
    <section className="dashboard-card consult-card" aria-labelledby="consult-title">
      <h2 id="consult-title">Your pre-test consult</h2>
      <div className="doctor-row">
        <DoctorAvatar />
        <div>
          <strong>Dr. Lim Wen Qi</strong>
          <span>Functional Medicine Physician</span>
        </div>
      </div>
      <dl className="consult-details">
        <div>
          <CalendarDays strokeWidth={1.75} aria-hidden="true" />
          <dt>Date</dt>
          <dd>3 July 2025 (Thu)</dd>
        </div>
        <div>
          <Clock3 strokeWidth={1.75} aria-hidden="true" />
          <dt>Time</dt>
          <dd>10:00 AM</dd>
        </div>
        <div>
          <Video strokeWidth={1.75} aria-hidden="true" />
          <dt>Location</dt>
          <dd>Online (Teleconsult)</dd>
        </div>
      </dl>
      <button className="consult-action" type="button">
        {data.primaryCta}
        <ChevronRight strokeWidth={1.8} />
      </button>
      {data.secondaryCta && (
        <button className="consult-secondary-action" type="button">
          {data.secondaryCta}
        </button>
      )}
    </section>
  );
}

function BloodDrawCard({ data }: { data: BloodDrawCardData }) {
  return (
    <section className="dashboard-card consult-card" aria-labelledby="blood-draw-title">
      <h2 id="blood-draw-title">Blood draw details</h2>
      <div className="doctor-row">
        <LabAvatar initials="IQ" />
        <div>
          <strong>{data.labName}</strong>
          <span>{data.labBranch}</span>
        </div>
      </div>
      <dl className="consult-details">
        <div>
          <MapPin strokeWidth={1.75} aria-hidden="true" />
          <dt>Address</dt>
          <dd>{data.labAddress}</dd>
        </div>
        <div>
          <Clock3 strokeWidth={1.75} aria-hidden="true" />
          <dt>Hours</dt>
          <dd>{data.labHours}</dd>
        </div>
      </dl>
      <button className="consult-action" type="button">
        {data.primaryCta}
        <ChevronRight strokeWidth={1.8} />
      </button>
      {data.secondaryCta && (
        <button className="consult-secondary-action" type="button">
          {data.secondaryCta}
        </button>
      )}
    </section>
  );
}

function ResultsCard({ data }: { data: ResultsCardData }) {
  return (
    <section className="dashboard-card consult-card" aria-labelledby="results-status-title">
      <h2 id="results-status-title">Results status</h2>
      <dl className="consult-details results-status-details">
        <div>
          <Hourglass strokeWidth={1.75} aria-hidden="true" />
          <dt>Status</dt>
          <dd>{data.status}</dd>
        </div>
        <div>
          <FlaskConical strokeWidth={1.75} aria-hidden="true" />
          <dt>Test</dt>
          <dd>{data.testName}</dd>
        </div>
        <div>
          <Check strokeWidth={1.75} aria-hidden="true" />
          <dt>Blood draw</dt>
          <dd>{data.bloodDrawStatus}</dd>
        </div>
        <div>
          <Clock3 strokeWidth={1.75} aria-hidden="true" />
          <dt>Expected</dt>
          <dd>{data.expectedTiming}</dd>
        </div>
        <div>
          <ChevronRight strokeWidth={1.75} aria-hidden="true" />
          <dt>Next step</dt>
          <dd>{data.nextStep}</dd>
        </div>
      </dl>
      <button className="consult-action" type="button">
        {data.primaryCta}
        <ChevronRight strokeWidth={1.8} />
      </button>
    </section>
  );
}

function CarePlanCard({ data }: { data: CarePlanCardData }) {
  return (
    <section className="dashboard-card consult-card" aria-labelledby="care-plan-title">
      <h2 id="care-plan-title">Care plan summary</h2>
      <dl className="consult-details consult-details--labeled">
        <div>
          <Target strokeWidth={1.75} aria-hidden="true" />
          <dt>Priority areas</dt>
          <dd>{data.priorityAreas}</dd>
        </div>
        <div>
          <ListChecks strokeWidth={1.75} aria-hidden="true" />
          <dt>Recommended actions</dt>
          <dd>{data.recommendedActions}</dd>
        </div>
        <div>
          <CalendarDays strokeWidth={1.75} aria-hidden="true" />
          <dt>Next review</dt>
          <dd>{data.nextReview}</dd>
        </div>
        <div>
          <RotateCcw strokeWidth={1.75} aria-hidden="true" />
          <dt>Retest plan</dt>
          <dd>{data.retestPlan}</dd>
        </div>
      </dl>
      <button className="consult-action" type="button">
        {data.primaryCta}
        <ChevronRight strokeWidth={1.8} />
      </button>
    </section>
  );
}

function RightCard({ data }: { data: RightCardData }) {
  if (data.type === "bloodDraw") return <BloodDrawCard data={data} />;
  if (data.type === "results") return <ResultsCard data={data} />;
  if (data.type === "carePlan") return <CarePlanCard data={data} />;
  return <ConsultCard data={data} />;
}

function BottomNav({ activeTab, onNav }: { activeTab: MemberTab; onNav: (tab: MemberTab) => void }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const tab = tabForLabel(item.label);
        return (
          <button
            className={tab !== undefined && tab === activeTab ? "is-active" : ""}
            type="button"
            key={item.label}
            onClick={tab ? () => onNav(tab) : undefined}
          >
            <Icon strokeWidth={1.75} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <span className="mobile-home-indicator" aria-hidden="true" />
    </nav>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

function DashboardHome() {
  const [stateId, setStateId] = useState<JourneyStateId>("PROFILE_INCOMPLETE");
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefStartAt, setBriefStartAt] = useState<Phase | undefined>(undefined);
  const config = STATES[stateId];

  return (
    <div className="member-dashboard-root">
      <DesktopSidebar activeTab={activeTab} onNav={setActiveTab} />
      <MobileHeader />
      <main className="dashboard-main">
        <DesktopUserMenu stateId={stateId} onStateChange={setStateId} />
        <div className="dashboard-content">
          <header className="dashboard-heading">
            <h1>
              <span>{activeTab === "profile" ? "Your profile" : config.headerTitle}</span>
            </h1>
          </header>
          {activeTab === "profile" ? (
            <ProfileTab
              onStart={() => { setBriefStartAt(undefined); setBriefOpen(true); }}
              onViewBrief={() => { setBriefStartAt("preview"); setBriefOpen(true); }}
              onReset={() => { clearSavedProgress(); setBriefStartAt(undefined); setBriefOpen(true); }}
            />
          ) : (
            <>
              <HeroCard hero={config.hero} />
              <div className="dashboard-grid">
                <div className="journey-column">
                  <JourneyCard steps={config.steps} tip={config.tip} />
                </div>
                <div className="consult-column">
                  <RightCard data={config.rightCard} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav activeTab={activeTab} onNav={setActiveTab} />
      {briefOpen && <IntakeShell startAt={briefStartAt} onExit={() => { setBriefOpen(false); setBriefStartAt(undefined); }} />}
    </div>
  );
}

export default DashboardHome;
