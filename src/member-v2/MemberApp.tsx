import { useEffect, useState } from "react";
import TopNav from "./shell/TopNav";
import { JOURNEY_STATES } from "./journey/journeyState";
import type { JourneyStateId, MemberTab } from "./journey/journeyState";
import HomeScreen from "./screens/home/HomeScreen";
import ProfileScreen from "./screens/profile/ProfileScreen";
import CarePlanScreen from "./screens/care-plan/CarePlanScreen";
import ResultsDashboard from "../member/results/ResultsDashboard";
import "./shell/shell.css";

function ResultsScreen() {
  return (
    <main className="p-page dashboard-content--results">
      <header className="p-results-heading">
        <h1 className="p-h1">
          Your <em>results</em>
        </h1>
      </header>
      <ResultsDashboard />
    </main>
  );
}

function MemberApp() {
  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [journeyState, setJourneyState] = useState<JourneyStateId>("PROFILE_INCOMPLETE");
  const [profileFlowOpen, setProfileFlowOpen] = useState(false);
  const config = JOURNEY_STATES[journeyState];

  // Results scrolls internally (results.css owns its viewport height); every
  // other screen uses normal document scroll.
  useEffect(() => {
    document.body.classList.toggle("is-results-locked", activeTab === "results");
    return () => document.body.classList.remove("is-results-locked");
  }, [activeTab]);

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
