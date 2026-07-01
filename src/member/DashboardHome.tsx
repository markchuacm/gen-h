import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Folder,
  Gift,
  HeartPulse,
  Home,
  Menu,
  Settings,
  UserRound,
  Video,
} from "lucide-react";
import heroProfileImage from "../../assets/dashboard/health-profile-hero.png";
import doctorPortrait from "../../assets/doctors/ong-shiau-ying.png";

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type JourneyStep = {
  number: string;
  label: string;
  status: string;
  active?: boolean;
};

const primaryNavItems: NavItem[] = [
  { label: "Home", icon: Home, active: true },
  { label: "Profile", icon: UserRound },
  { label: "Results", icon: Activity },
  { label: "Care Plan", icon: HeartPulse },
  { label: "Documents", icon: Folder },
];

const secondaryNavItems: NavItem[] = [
  { label: "Referrals", icon: Gift },
  { label: "Settings", icon: Settings },
];

const journeySteps: JourneyStep[] = [
  { number: "1", label: "Profile", status: "Not started", active: true },
  { number: "2", label: "Consult", status: "Upcoming" },
  { number: "3", label: "Blood Draw", status: "Upcoming" },
  { number: "4", label: "Results", status: "Upcoming" },
  { number: "5", label: "Care Plan", status: "Upcoming" },
];

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

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <button className={`sidebar-nav-item ${item.active ? "is-active" : ""}`} type="button">
      <Icon strokeWidth={1.65} />
      <span>{item.label}</span>
    </button>
  );
}

function DesktopSidebar() {
  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
      <Logo />
      <nav className="sidebar-nav" aria-label="Primary">
        {primaryNavItems.map((item) => (
          <SidebarNavItem item={item} key={item.label} />
        ))}
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

function DesktopUserMenu() {
  return (
    <div className="desktop-user-menu">
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

function HeroCard() {
  return (
    <section className="dashboard-card hero-card" aria-labelledby="profile-next-step">
      <div className="hero-copy">
        <span className="status-pill">Next step</span>
        <h2 id="profile-next-step">Complete your health profile</h2>
        <p>
          <span className="desktop-text">This helps your doctor understand your health, goals, lifestyle and history before your consult.</span>
          <span className="mobile-text">Help your doctor understand you before your consult.</span>
        </p>
        <div className="hero-actions">
          <button className="primary-action" type="button">
            Continue profile
            <ChevronRight strokeWidth={2} />
          </button>
          <button className="secondary-action" type="button">
            Why this matters
          </button>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <img src={heroProfileImage} alt="" />
      </div>
    </section>
  );
}

function JourneyCard() {
  return (
    <section className="dashboard-card journey-card" aria-labelledby="journey-title">
      <h2 id="journey-title">Your Gen-H journey</h2>
      <ol className="journey-steps">
        {journeySteps.map((step) => (
          <li className={step.active ? "is-active" : ""} key={step.number}>
            <span className="journey-marker">{step.number}</span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.status}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ConsultCard() {
  return (
    <section className="dashboard-card consult-card" aria-labelledby="consult-title">
      <h2 id="consult-title">
        <span className="desktop-text">Your pre-test consult</span>
        <span className="mobile-text">Pre-test consult</span>
      </h2>
      <div className="doctor-row">
        <img src={doctorPortrait} alt="Dr. Lim Wen Qi" />
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
        <span className="desktop-text">View consult details</span>
        <span className="mobile-text">Join consult</span>
        <ChevronRight className="desktop-text" strokeWidth={1.8} />
        <ExternalLink className="mobile-text" strokeWidth={1.9} />
      </button>
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <button className={item.active ? "is-active" : ""} type="button" key={item.label}>
            <Icon strokeWidth={1.75} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <span className="mobile-home-indicator" aria-hidden="true" />
    </nav>
  );
}

function DashboardHome() {
  return (
    <div className="member-dashboard-root">
      <DesktopSidebar />
      <MobileHeader />
      <main className="dashboard-main">
        <DesktopUserMenu />
        <div className="dashboard-content">
          <header className="dashboard-heading">
            <h1>
              <span>Welcome in, Mark</span>
            </h1>
          </header>
          <HeroCard />
          <div className="dashboard-grid">
            <div className="journey-column">
              <JourneyCard />
            </div>
            <div className="consult-column">
              <ConsultCard />
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default DashboardHome;
