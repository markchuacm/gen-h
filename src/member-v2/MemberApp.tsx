import { lazy, Suspense, useEffect, useRef, useState } from "react";
import TopNav from "./shell/TopNav";
import { useAuth } from "../auth/AuthProvider";
import { fetchMemberProfile } from "../lib/api/memberProfile";
import { fetchMemberAppointment } from "../lib/api/appointments";
import type { MemberAppointment } from "../lib/api/appointments";
import { resolveJourneyConfig, STAGE_TO_JOURNEY } from "./journey/journeyState";
import type { JourneyStateId, MemberTab } from "./journey/journeyState";
import HomeScreen from "./screens/home/HomeScreen";
import "./shell/shell.css";

const ProfileScreen = lazy(() => import("./screens/profile/ProfileScreen"));
const CarePlanScreen = lazy(() => import("./screens/care-plan/CarePlanScreen"));
const ResultsDashboard = lazy(() => import("./screens/results/ResultsDashboard"));

function ResultsScreen() {
  return (
    <main className="p-page dashboard-content--results">
      <Suspense fallback={<p role="status">Loading results…</p>}><ResultsDashboard /></Suspense>
    </main>
  );
}

function MemberApp() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [journeyState, setJourneyState] = useState<JourneyStateId | null>(null);
  const [appointment, setAppointment] = useState<MemberAppointment | null>(null);
  const [profileFlowOpen, setProfileFlowOpen] = useState(false);
  const [preferredName, setPreferredName] = useState<string | null>(null);
  const hasAutoOpenedProfile = useRef(false);

  const fallbackName =
    profile?.full_name?.trim().split(/\s+/)[0] || profile?.email?.split("@")[0] || "there";
  const firstName = preferredName?.trim() || fallbackName;

  // The journey stage lives in member_profiles.current_stage; the dev
  // switcher in TopNav can still override it locally for previewing states.
  // A member who hasn't finished onboarding lands straight in the profile
  // flow instead of Home, until they complete it.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMemberProfile(), fetchMemberAppointment()]).then(([profileResult, appointmentResult]) => {
      if (cancelled) return;
      const data = profileResult.data;
      const stage = STAGE_TO_JOURNEY[data?.current_stage ?? ""] ?? "PROFILE_INCOMPLETE";
      setJourneyState(stage);
      setAppointment(appointmentResult.data);
      setPreferredName(data?.preferred_name ?? null);
      if (stage === "PROFILE_INCOMPLETE" && !hasAutoOpenedProfile.current) {
        hasAutoOpenedProfile.current = true;
        setActiveTab("profile");
        setProfileFlowOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Results scrolls internally on larger viewports; mobile uses normal document scroll.
  useEffect(() => {
    const desktopResultsQuery = window.matchMedia("(min-width: 721px)");
    const syncResultsLock = () => {
      document.body.classList.toggle(
        "is-results-locked",
        activeTab === "results" && desktopResultsQuery.matches,
      );
    };

    syncResultsLock();
    desktopResultsQuery.addEventListener("change", syncResultsLock);

    return () => {
      desktopResultsQuery.removeEventListener("change", syncResultsLock);
      document.body.classList.remove("is-results-locked");
    };
  }, [activeTab]);

  // Journey stage still loading from the DB.
  if (!journeyState) return null;
  const config = resolveJourneyConfig(journeyState, appointment);

  return (
    <>
      <TopNav
        activeTab={activeTab}
        onNav={setActiveTab}
        journeyState={journeyState}
        onJourneyStateChange={setJourneyState}
      />
      <Suspense fallback={<main className="p-page"><p role="status">Loading…</p></main>}>
      {activeTab === "home" ? (
        <HomeScreen
          config={config}
          firstName={firstName}
          onNav={setActiveTab}
          onStartProfile={() => {
            setActiveTab("profile");
            setProfileFlowOpen(true);
          }}
        />
      ) : activeTab === "profile" ? (
        <ProfileScreen
          flowOpen={profileFlowOpen}
          onFlowOpenChange={setProfileFlowOpen}
          onExitIncomplete={() => {
            setActiveTab("home");
          }}
          onCompleted={(name) => {
            // Finishing the profile moves the journey along; update the
            // greeting immediately rather than waiting on a DB round-trip.
            if (journeyState === "PROFILE_INCOMPLETE") setJourneyState("CONSULT_UPCOMING");
            if (name.trim()) setPreferredName(name.trim());
          }}
        />
      ) : activeTab === "carePlan" ? (
        <CarePlanScreen onNav={setActiveTab} />
      ) : (
        <ResultsScreen />
      )}
      </Suspense>
    </>
  );
}

export default MemberApp;
