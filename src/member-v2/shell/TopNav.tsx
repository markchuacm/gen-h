import { Activity, ClipboardList, Home, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JourneyStateId, MemberTab } from "../journey/journeyState";
import DevStateSwitcher from "./DevStateSwitcher";

const TABS: Array<{ tab: MemberTab; label: string; Icon: LucideIcon }> = [
  { tab: "home", label: "Home", Icon: Home },
  { tab: "profile", label: "Profile", Icon: UserRound },
  { tab: "results", label: "Results", Icon: Activity },
  { tab: "carePlan", label: "Care plan", Icon: ClipboardList },
];

type TopNavProps = {
  activeTab: MemberTab;
  onNav: (tab: MemberTab) => void;
  journeyState: JourneyStateId;
  onJourneyStateChange: (state: JourneyStateId) => void;
};

function TopNav({ activeTab, onNav, journeyState, onJourneyStateChange }: TopNavProps) {
  return (
    <header className="p-nav">
      <a className="p-nav-wordmark" href="/" aria-label="Gen-H home">
        Gen-H
      </a>
      <nav className="p-nav-tabs" aria-label="Portal">
        {TABS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            type="button"
            className={`p-nav-tab ${tab === activeTab ? "is-active" : ""}`}
            aria-current={tab === activeTab ? "page" : undefined}
            aria-label={label}
            title={label}
            onClick={() => onNav(tab)}
          >
            <Icon strokeWidth={1.7} aria-hidden="true" />
          </button>
        ))}
      </nav>
      <div className="p-nav-right">
        <DevStateSwitcher value={journeyState} onChange={onJourneyStateChange} />
        <span className="p-avatar" aria-label="Mark Chua">
          M
        </span>
      </div>
    </header>
  );
}

export default TopNav;
