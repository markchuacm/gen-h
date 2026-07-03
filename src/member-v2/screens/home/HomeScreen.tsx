import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FlaskConical,
  MapPin,
  Video,
} from "lucide-react";
import type {
  ContextCardData,
  HeroAction,
  JourneyStateConfig,
  MemberTab,
  Step,
} from "../../journey/journeyState";
import "./home.css";

type HomeScreenProps = {
  config: JourneyStateConfig;
  onNav: (tab: MemberTab) => void;
  onStartProfile: () => void;
};

function splitGreeting(greeting: string) {
  // Set the member's name in italic terracotta, landing-heading style.
  const lastComma = greeting.lastIndexOf(", ");
  if (lastComma === -1) return { before: greeting, em: "" };
  return { before: greeting.slice(0, lastComma + 2), em: greeting.slice(lastComma + 2) };
}

function JourneyRail({ steps }: { steps: Step[] }) {
  return (
    <ol className="home-rail" aria-label="Your Gen-H journey">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`home-rail-step ${
            step.state === "active" ? "is-active" : step.state === "completed" ? "is-completed" : ""
          }`}
        >
          <span className="home-rail-marker" aria-hidden="true">
            {step.state === "completed" ? <Check strokeWidth={2.4} /> : index + 1}
          </span>
          <strong className="home-rail-label">{step.label}</strong>
          <span className="home-rail-status">{step.statusLabel}</span>
        </li>
      ))}
    </ol>
  );
}

function HeroCard({
  hero,
  onAction,
}: {
  hero: JourneyStateConfig["hero"];
  onAction: (action: HeroAction) => void;
}) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-copy">
        <span className="p-chip">{hero.pill}</span>
        <h2 id="home-hero-title">
          {hero.titleBefore}
          {hero.titleEm && <em>{hero.titleEm}</em>}
          {hero.titleAfter}
        </h2>
        <p>{hero.body}</p>
        <div className="home-hero-actions">
          <button className="p-btn" type="button" onClick={() => onAction(hero.primaryAction)}>
            {hero.primaryCta}
            <ChevronRight strokeWidth={2} />
          </button>
          {hero.secondaryCta && (
            <button className="p-btn-ghost" type="button">
              {hero.secondaryCta}
            </button>
          )}
        </div>
      </div>
      <div className="home-hero-art" aria-hidden="true">
        <img src={hero.image} alt="" />
      </div>
    </section>
  );
}

function ContextCard({
  data,
  onNav,
}: {
  data: ContextCardData;
  onNav: (tab: MemberTab) => void;
}) {
  if (data.type === "consult") {
    return (
      <section className="p-card home-context" aria-labelledby="home-context-title">
        <h3 id="home-context-title">Your pre-test consult</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            {data.doctorInitials}
          </span>
          <div>
            <strong>{data.doctorName}</strong>
            <span>{data.doctorRole}</span>
          </div>
        </div>
        <dl className="home-context-details">
          <div>
            <CalendarDays strokeWidth={1.6} aria-hidden="true" />
            <dt>Date</dt>
            <dd>{data.date}</dd>
          </div>
          <div>
            <Clock3 strokeWidth={1.6} aria-hidden="true" />
            <dt>Time</dt>
            <dd>{data.time}</dd>
          </div>
          <div>
            <Video strokeWidth={1.6} aria-hidden="true" />
            <dt>Location</dt>
            <dd>{data.location}</dd>
          </div>
        </dl>
        <button className="p-btn-ghost" type="button">
          {data.primaryCta}
        </button>
      </section>
    );
  }

  if (data.type === "bloodDraw") {
    return (
      <section className="p-card home-context" aria-labelledby="home-context-title">
        <h3 id="home-context-title">Blood draw details</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            {data.labInitials}
          </span>
          <div>
            <strong>{data.labName}</strong>
            <span>{data.labBranch}</span>
          </div>
        </div>
        <dl className="home-context-details">
          <div>
            <MapPin strokeWidth={1.6} aria-hidden="true" />
            <dt>Address</dt>
            <dd>{data.labAddress}</dd>
          </div>
          <div>
            <Clock3 strokeWidth={1.6} aria-hidden="true" />
            <dt>Hours</dt>
            <dd>{data.labHours}</dd>
          </div>
        </dl>
        <button className="p-btn" type="button">
          {data.primaryCta}
          <ChevronRight strokeWidth={2} />
        </button>
      </section>
    );
  }

  if (data.type === "resultsTimeline") {
    return (
      <section className="p-card home-context" aria-labelledby="home-context-title">
        <h3 id="home-context-title">Where your sample is</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            <FlaskConical strokeWidth={1.6} style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <strong>{data.testName}</strong>
            <span>Expected in {data.expectedTiming}</span>
          </div>
        </div>
        <ol className="home-timeline">
          {data.stages.map((stage) => (
            <li
              key={stage.label}
              className={`home-timeline-stage ${
                stage.state === "active"
                  ? "is-active"
                  : stage.state === "completed"
                    ? "is-completed"
                    : ""
              }`}
            >
              <span className="home-timeline-dot" aria-hidden="true">
                {stage.state === "completed" && <Check strokeWidth={2.4} />}
              </span>
              <strong>{stage.label}</strong>
            </li>
          ))}
        </ol>
        <button className="p-btn-ghost" type="button" onClick={() => onNav("results")}>
          {data.primaryCta}
        </button>
      </section>
    );
  }

  return (
    <section className="p-card home-context" aria-labelledby="home-context-title">
      <h3 id="home-context-title">Your care plan, at a glance</h3>
      <div className="home-teaser-stats">
        <div>
          <strong>{data.focusAreaCount}</strong>
          <span>Focus areas</span>
        </div>
        <div>
          <strong>{data.actionCount}</strong>
          <span>Actions</span>
        </div>
        <div>
          <strong>{data.nextReview}</strong>
          <span>Next review</span>
        </div>
      </div>
      <button className="p-btn" type="button" onClick={() => onNav("carePlan")}>
        {data.primaryCta}
        <ChevronRight strokeWidth={2} />
      </button>
    </section>
  );
}

function HomeScreen({ config, onNav, onStartProfile }: HomeScreenProps) {
  const greeting = splitGreeting(config.greeting);

  const handleHeroAction = (action: HeroAction) => {
    if (action.kind === "tab") onNav(action.tab);
    if (action.kind === "profileFlow") onStartProfile();
  };

  return (
    <main className="p-page">
      <header className="home-head">
        <span className="p-eyebrow">{config.stageLabel}</span>
        <h1 className="p-h1">
          {greeting.before}
          {greeting.em && <em>{greeting.em}</em>}
        </h1>
      </header>
      <JourneyRail steps={config.steps} />
      <HeroCard hero={config.hero} onAction={handleHeroAction} />
      <div className="home-grid">
        <ContextCard data={config.contextCard} onNav={onNav} />
        <aside className="home-tip">
          <strong>{config.tip.title}</strong>
          <p>{config.tip.body}</p>
        </aside>
      </div>
    </main>
  );
}

export default HomeScreen;
