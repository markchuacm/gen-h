import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, ClipboardList, Home, LogOut, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
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
  onOpenAccountDetails: () => void;
};

function TopNav({ activeTab, onNav, journeyState, onJourneyStateChange, onOpenAccountDetails }: TopNavProps) {
  const { profile, session, signOut } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const email = profile?.email ?? session?.user.email ?? "Account";

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAccountMenuOpen(false);
      accountTriggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  return (
    <header className="p-nav">
      <a className="p-nav-wordmark" href="/" aria-label="Verae home">
        Verae
      </a>
      <nav className="p-nav-tabs" aria-label="Portal">
        {TABS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            type="button"
            className={`p-nav-tab ${tab === activeTab ? "is-active" : ""}`}
            aria-current={tab === activeTab ? "page" : undefined}
            aria-label={label}
            onClick={() => onNav(tab)}
          >
            <Icon strokeWidth={1.7} aria-hidden="true" />
            <span className="p-nav-tab-label" aria-hidden="true">
              {label}
            </span>
          </button>
        ))}
      </nav>
      <div className="p-nav-right">
        {import.meta.env.DEV && (
          <DevStateSwitcher value={journeyState} onChange={onJourneyStateChange} />
        )}
        <div className="p-account" ref={accountMenuRef}>
          <button
            ref={accountTriggerRef}
            type="button"
            className="p-account-trigger"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-controls="member-account-menu"
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            <span className="p-account-email">{email}</span>
            <ChevronDown aria-hidden="true" />
          </button>
          {accountMenuOpen && (
            <div id="member-account-menu" className="p-account-menu" role="menu">
              <span className="p-account-menu-email">{email}</span>
              <button
                type="button"
                className="p-account-menu-item"
                role="menuitem"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onOpenAccountDetails();
                }}
              >
                <UserRound aria-hidden="true" />
                <span>Account details</span>
              </button>
              <button
                type="button"
                className="p-account-signout"
                role="menuitem"
                onClick={() => void signOut()}
              >
                <LogOut aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNav;
