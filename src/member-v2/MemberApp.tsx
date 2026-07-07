import { useEffect, useState } from "react";
import TopNav from "./shell/TopNav";
import { useAuth } from "../auth/AuthProvider";
import { fetchMemberProfile } from "../lib/api/memberProfile";
import { JOURNEY_STATES, STAGE_TO_JOURNEY } from "./journey/journeyState";
import type { JourneyStateId, MemberTab } from "./journey/journeyState";
import HomeScreen from "./screens/home/HomeScreen";
import ProfileScreen from "./screens/profile/ProfileScreen";
import CarePlanScreen from "./screens/care-plan/CarePlanScreen";
import ResultsDashboard from "./screens/results/ResultsDashboard";
import "./shell/shell.css";

function ResultsScreen() {
  return (
    <main className="p-page dashboard-content--results">
      <ResultsDashboard />
    </main>
  );
}

function MemberApp() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [journeyState, setJourneyState] = useState<JourneyStateId | null>(null);
  const [profileFlowOpen, setProfileFlowOpen] = useState(false);

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] || profile?.email?.split("@")[0] || "there";

  // The journey stage lives in member_profiles.current_stage; the dev
  // switcher in TopNav can still override it locally for previewing states.
  useEffect(() => {
    let cancelled = false;
    fetchMemberProfile().then(({ data }) => {
      if (cancelled) return;
      setJourneyState(STAGE_TO_JOURNEY[data?.current_stage ?? ""] ?? "PROFILE_INCOMPLETE");
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
  const config = JOURNEY_STATES[journeyState];

  return (
    <>
      <TopNav
        activeTab={activeTab}
        onNav={setActiveTab}
        journeyState={journeyState}
        onJourneyStateChange={setJourneyState}
      />
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
          onCompleted={() => {
            // Demo continuity: finishing the profile moves the journey along.
            if (journeyState === "PROFILE_INCOMPLETE") setJourneyState("CONSULT_UPCOMING");
          }}
        />
      ) : activeTab === "carePlan" ? (
        <CarePlanScreen onNav={setActiveTab} />
      ) : (
        <ResultsScreen />
      )}
    </>
  );
}

export default MemberApp;
