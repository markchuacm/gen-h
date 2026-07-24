import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, CircleUserRound, ClipboardList, Home, LogOut, Menu, X, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import type { JourneyStateId, MemberTab } from "../journey/journeyState";
import DevStateSwitcher from "./DevStateSwitcher";

const TABS: Array<{ tab: MemberTab; label: string; Icon: LucideIcon }> = [
  { tab: "home", label: "Home", Icon: Home },
  { tab: "results", label: "Results", Icon: Activity },
  { tab: "carePlan", label: "Care plan", Icon: ClipboardList },
];

function initialsForAccount(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  const letters = (words[0] ?? "").replace(/[^a-z0-9]/gi, "");
  return (letters.slice(0, 2) || "U").toUpperCase();
}

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const email = profile?.email ?? session?.user.email ?? "Account";
  const accountInitials = initialsForAccount(profile?.consent_name?.trim() || profile?.full_name?.trim() || email);

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

  useEffect(() => {
    if (!mobileNavOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileNavOpen(false);
      mobileMenuTriggerRef.current?.focus();
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("is-member-nav-locked");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("is-member-nav-locked");
    };
  }, [mobileNavOpen]);

  const handleNav = (tab: MemberTab) => {
    setMobileNavOpen(false);
    onNav(tab);
  };

  return (
    <header className="p-nav">
      <div className="p-nav-brand">
        <button
          ref={mobileMenuTriggerRef}
          type="button"
          className="p-mobile-menu-trigger"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          aria-controls="member-mobile-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <Menu aria-hidden="true" />
        </button>
        <a className="p-nav-wordmark" href="/" aria-label="Verae home">
          Verae
        </a>
      </div>
      {mobileNavOpen && (
        <button
          type="button"
          className="p-mobile-nav-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <nav id="member-mobile-nav" className={`p-nav-tabs${mobileNavOpen ? " is-open" : ""}`} aria-label="Portal">
        <button
          type="button"
          className="p-mobile-drawer-close"
          aria-label="Close navigation"
          onClick={() => {
            setMobileNavOpen(false);
            mobileMenuTriggerRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </button>
        <div className="p-nav-tab-list">
          {TABS.map(({ tab, label, Icon }) => (
            <button
              key={tab}
              type="button"
              className={`p-nav-tab ${tab === activeTab ? "is-active" : ""}`}
              aria-current={tab === activeTab ? "page" : undefined}
              aria-label={label}
              onClick={() => handleNav(tab)}
            >
              <Icon strokeWidth={1.7} aria-hidden="true" />
              <span className="p-nav-tab-label" aria-hidden="true">
                {label}
              </span>
            </button>
          ))}
        </div>
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
            aria-label="Open account menu"
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            <span className="p-account-avatar" aria-hidden="true">{accountInitials}</span>
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
                  setMobileNavOpen(false);
                  onOpenAccountDetails();
                }}
              >
                <CircleUserRound aria-hidden="true" />
                <span>Account</span>
              </button>
              <button
                type="button"
                className="p-account-menu-item"
                role="menuitem"
                onClick={() => {
                  setAccountMenuOpen(false);
                  handleNav("profile");
                }}
              >
                <UserRound aria-hidden="true" />
                <span>Profile</span>
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
