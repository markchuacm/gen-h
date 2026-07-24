import { Activity, ClipboardList, Home, LogOut, TestTube, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import type { CaseView } from "./CaseDetail";

type DoctorNavItem = {
  view: "home" | CaseView;
  label: string;
  Icon: LucideIcon;
};

const TABS: DoctorNavItem[] = [
  { view: "home", label: "Home", Icon: Home },
  { view: "brief", label: "Brief", Icon: UserRound },
  { view: "panel", label: "Panel", Icon: TestTube },
  { view: "results", label: "Results", Icon: Activity },
  { view: "carePlan", label: "Careplan", Icon: ClipboardList },
];

function DoctorCaseNav({
  activeView,
  onNav,
}: {
  activeView: CaseView;
  onNav: (view: "home" | CaseView) => void;
}) {
  const { profile, signOut } = useAuth();
  const name = profile?.full_name ?? profile?.email ?? "Account";

  return (
    <header className="p-nav doc-case-nav">
      <a className="p-nav-wordmark" href="/" aria-label="Verae home">
        Verae
      </a>
      <nav className="p-nav-tabs" aria-label="Case workflow">
        {TABS.map(({ view, label, Icon }) => (
          <button
            key={view}
            type="button"
            className={`p-nav-tab ${view !== "home" && view === activeView ? "is-active" : ""}`}
            aria-current={view !== "home" && view === activeView ? "page" : undefined}
            aria-label={label}
            onClick={() => onNav(view)}
          >
            <Icon strokeWidth={1.7} aria-hidden="true" />
            <span className="p-nav-tab-label" aria-hidden="true">
              {label}
            </span>
          </button>
        ))}
      </nav>
      <div className="p-nav-right">
        <button
          type="button"
          className="p-account-trigger doc-case-account"
          title={name}
          onClick={() => void signOut()}
        >
          <span className="p-account-email">Sign out</span>
          <LogOut aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default DoctorCaseNav;
