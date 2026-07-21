import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FlaskConical,
  MapPin,
  Video,
  X,
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

function JourneyRail({ steps }: { steps: Step[] }) {
  return (
    <ol className="home-rail" aria-label="Your Verae journey">
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
        </li>
      ))}
    </ol>
  );
}

function HeroCard({
  hero,
  onAction,
  onDetails,
}: {
  hero: JourneyStateConfig["hero"];
  onAction: (action: HeroAction) => void;
  onDetails: () => void;
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
          {hero.primaryCta && (
            <button
              className="p-btn"
              type="button"
              disabled={hero.primaryDisabled}
              title={hero.primaryDisabled ? hero.primaryHint : undefined}
              onClick={() => onAction(hero.primaryAction)}
            >
              {hero.primaryCta}
              <ChevronRight strokeWidth={2} />
            </button>
          )}
          {hero.secondaryCta && (
            <button
              className="p-btn-ghost"
              type="button"
              aria-haspopup="dialog"
              onClick={onDetails}
            >
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

function DetailsContent({
  data,
  onNav,
  onClose,
}: {
  data: ContextCardData;
  onNav: (tab: MemberTab) => void;
  onClose: () => void;
}) {
  if (data.type === "consult") {
    return (
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Your pre-test consult</h3>
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
        {data.meetingUrl ? (
          <a className="p-btn" href={data.meetingUrl} target="_blank" rel="noopener noreferrer">
            Join consult
            <ChevronRight strokeWidth={2} />
          </a>
        ) : (
          <button className="p-btn-ghost" type="button" disabled title="Your join link will appear here soon">
            Join link coming soon
          </button>
        )}
      </section>
    );
  }

  if (data.type === "bloodDraw") {
    return (
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Blood draw details</h3>
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
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Where your sample is</h3>
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
        <button
          className="p-btn-ghost"
          type="button"
          onClick={() => {
            onClose();
            onNav("results");
          }}
        >
          {data.primaryCta}
        </button>
      </section>
    );
  }

  return (
    <section className="home-context" aria-labelledby="home-detail-title">
      <h3 id="home-detail-title">Your care plan, at a glance</h3>
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
      <button
        className="p-btn"
        type="button"
        onClick={() => {
          onClose();
          onNav("carePlan");
        }}
      >
        {data.primaryCta}
        <ChevronRight strokeWidth={2} />
      </button>
    </section>
  );
}

function DetailDialog({
  config,
  onClose,
  onNav,
}: {
  config: JourneyStateConfig;
  onClose: () => void;
  onNav: (tab: MemberTab) => void;
}) {
  const [screen, setScreen] = useState<"details" | "journey">("details");

  return (
    <div className="home-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="home-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${config.hero.pill} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="home-detail-head">
          <button
            className="home-detail-close"
            type="button"
            aria-label="Close details"
            onClick={onClose}
          >
            <X strokeWidth={1.8} />
          </button>
        </header>
        <div className="home-detail-viewport">
          <div className={`home-detail-track ${screen === "journey" ? "is-journey" : ""}`}>
            <div
              className="home-detail-screen home-detail-screen--details"
              aria-hidden={screen !== "details"}
              {...(screen !== "details" ? { inert: "" } : {})}
            >
              <div className="home-detail-body">
                <DetailsContent data={config.contextCard} onNav={onNav} onClose={onClose} />
                <aside className="home-detail-tip">
                  <strong>{config.tip.title}</strong>
                  <p>{config.tip.body}</p>
                </aside>
              </div>
              <button
                className="home-detail-screen-nav home-detail-screen-next"
                type="button"
                aria-label="View your Verae journey"
                onClick={() => setScreen("journey")}
              >
                <ChevronRight strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <div
              className="home-detail-screen home-detail-screen--journey"
              aria-hidden={screen !== "journey"}
              {...(screen !== "journey" ? { inert: "" } : {})}
            >
              <button
                className="home-detail-screen-nav home-detail-screen-back"
                type="button"
                aria-label="Back to details"
                onClick={() => setScreen("details")}
              >
                <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
              </button>
              <div className="home-journey-body">
                <section className="home-journey-progress" aria-labelledby="home-journey-title">
                  <h3 id="home-journey-title">Your Verae journey</h3>
                  <JourneyRail steps={config.steps} />
                </section>
                <section className="home-journey-explainer" aria-labelledby="home-journey-explainer-title">
                  <h3 id="home-journey-explainer-title">How the Verae health consult works</h3>
                  <p>
                    Your journey starts with a health profile and pre-test consultation, where your
                    doctor learns what matters to you and selects the right tests. After your blood
                    draw, your results are reviewed in context and turned into a personalised care
                    plan with clear actions and follow-up.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeScreen({ config, onNav, onStartProfile }: HomeScreenProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleHeroAction = (action: HeroAction) => {
    if (action.kind === "tab") onNav(action.tab);
    if (action.kind === "profileFlow") onStartProfile();
    if (action.kind === "link") window.open(action.url, "_blank", "noopener");
  };

  return (
    <main className="p-page home-page">
      <HeroCard
        hero={config.hero}
        onAction={handleHeroAction}
        onDetails={() => setIsDetailOpen(true)}
      />
      {isDetailOpen && (
        <DetailDialog config={config} onClose={() => setIsDetailOpen(false)} onNav={onNav} />
      )}
    </main>
  );
}

export default HomeScreen;
