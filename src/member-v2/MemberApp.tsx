import { lazy, Suspense, useEffect, useRef, useState } from "react";
import TopNav from "./shell/TopNav";
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
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [journeyState, setJourneyState] = useState<JourneyStateId | null>(null);
  const [appointment, setAppointment] = useState<MemberAppointment | null>(null);
  const [profileFlowOpen, setProfileFlowOpen] = useState(false);
  const hasAutoOpenedProfile = useRef(false);
  const hasPresentedInitialTab = useRef(false);

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

  // Match the typeform-style doctor-brief flow when a member moves between
  // portal tabs, while leaving the first page paint still and immediate.
  useEffect(() => {
    if (journeyState) hasPresentedInitialTab.current = true;
  }, [journeyState]);

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
      <div
        className={`p-tab-panel${hasPresentedInitialTab.current ? " is-entering" : ""}`}
        key={activeTab}
      >
        <Suspense fallback={<main className="p-page"><p role="status">Loading…</p></main>}>
          {activeTab === "home" ? (
            <HomeScreen
              config={config}
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
              onCompleted={() => {
                if (journeyState === "PROFILE_INCOMPLETE") setJourneyState("CONSULT_UPCOMING");
              }}
            />
          ) : activeTab === "carePlan" ? (
            <CarePlanScreen onNav={setActiveTab} />
          ) : (
            <ResultsScreen />
          )}
        </Suspense>
      </div>
    </>
  );
}

export default MemberApp;
