import { useEffect, useState } from "react";
import TopNav from "./shell/TopNav";
import { JOURNEY_STATES } from "./journey/journeyState";
import type { JourneyStateId, MemberTab } from "./journey/journeyState";
import HomeScreen from "./screens/home/HomeScreen";
import ResultsDashboard from "../member/results/ResultsDashboard";
import "./shell/shell.css";

function StubScreen({ title }: { title: string }) {
  return (
    <main className="p-page">
      <header className="p-heading-row">
        <h1 className="p-h1">{title}</h1>
      </header>
      <section className="p-card" style={{ padding: 40, color: "var(--muted)" }}>
        Coming next.
      </section>
    </main>
  );
}

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
          onStartProfile={() => setActiveTab("profile")}
        />
      ) : activeTab === "profile" ? (
        <StubScreen title="Your profile" />
      ) : activeTab === "carePlan" ? (
        <StubScreen title="Your care plan" />
      ) : (
        <ResultsScreen />
      )}
    </>
  );
}

export default MemberApp;
