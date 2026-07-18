import { useState } from "react";
import {
  CalendarDays,
  Check,
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
  firstName: string;
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
        <h3>Your pre-test consult</h3>
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
        <h3>Blood draw details</h3>
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
        <h3>Where your sample is</h3>
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
      <h3>Your care plan, at a glance</h3>
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
        <div className="home-detail-body">
          <DetailsContent data={config.contextCard} onNav={onNav} onClose={onClose} />
          <aside className="home-detail-tip">
            <strong>{config.tip.title}</strong>
            <p>{config.tip.body}</p>
          </aside>
        </div>
      </section>
    </div>
  );
}

function HomeScreen({ config, firstName, onNav, onStartProfile }: HomeScreenProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleHeroAction = (action: HeroAction) => {
    if (action.kind === "tab") onNav(action.tab);
    if (action.kind === "profileFlow") onStartProfile();
    if (action.kind === "link") window.open(action.url, "_blank", "noopener");
  };

  return (
    <main className="p-page">
      <header className="home-head">
        <span className="p-eyebrow">HOME</span>
        <div className="home-title-row">
          <h1 className="p-h1">{`${config.greetingPrefix}, ${firstName}`}</h1>
          <JourneyRail steps={config.steps} />
        </div>
      </header>
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
