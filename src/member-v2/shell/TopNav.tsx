import type { JourneyStateId, MemberTab } from "../journey/journeyState";
import DevStateSwitcher from "./DevStateSwitcher";

const TABS: Array<{ tab: MemberTab; label: string }> = [
  { tab: "home", label: "Home" },
  { tab: "profile", label: "Profile" },
  { tab: "results", label: "Results" },
  { tab: "carePlan", label: "Care plan" },
];

type TopNavProps = {
  activeTab: MemberTab;
  onNav: (tab: MemberTab) => void;
  journeyState: JourneyStateId;
  onJourneyStateChange: (state: JourneyStateId) => void;
};

function TopNav({ activeTab, onNav, journeyState, onJourneyStateChange }: TopNavProps) {
  return (
    <>
      <header className="p-nav">
        <a className="p-nav-wordmark" href="/" aria-label="Gen-H home">
          Gen-H
        </a>
        <nav className="p-nav-tabs" aria-label="Portal">
          {TABS.map(({ tab, label }) => (
            <button
              key={tab}
              type="button"
              className={`p-nav-tab ${tab === activeTab ? "is-active" : ""}`}
              aria-current={tab === activeTab ? "page" : undefined}
              onClick={() => onNav(tab)}
            >
              {label}
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
      <nav className="p-tabstrip" aria-label="Portal">
        {TABS.map(({ tab, label }) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "is-active" : ""}
            aria-current={tab === activeTab ? "page" : undefined}
            onClick={() => onNav(tab)}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default TopNav;
