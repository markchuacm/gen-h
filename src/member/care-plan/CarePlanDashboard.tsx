import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  MessageCircle,
  Sprout,
  UserRound,
  X,
} from "lucide-react";
import {
  alreadyDoing,
  focusAreas,
  planMeta,
  reviewFooter,
  type FocusArea,
  type FocusAreaPriority,
  type MarkerChip,
  type Protocol,
} from "./carePlanData";
import "./care-plan.css";

const priorityClass: Record<FocusAreaPriority, string> = {
  Priority: "priority-priority",
  "Quick win": "priority-quick-win",
  Support: "priority-support",
};

function MarkerChipTag({ chip }: { chip: MarkerChip }) {
  const Arrow = chip.direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`marker-chip marker-chip--${chip.status}`}>
      <span>{chip.label}</span>
      <strong>{chip.value}</strong>
      <Arrow strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}

function PlanHeader() {
  return (
    <header className="plan-header" aria-labelledby="care-plan-title">
      <div className="plan-header-copy">
        <span className="plan-kicker">Doctor-reviewed care plan</span>
        <h2 id="care-plan-title">
          {planMeta.titleLead}
          <em>{planMeta.titleEmphasis}</em>
          {planMeta.titleTail}
        </h2>
        <p>{planMeta.subtitle}</p>
      </div>
      <p className="plan-meta">
        Reviewed by {planMeta.reviewedBy} · Next review {planMeta.nextReviewDate} ·{" "}
        {planMeta.startThisWeekCount} protocols to start this week
      </p>
    </header>
  );
}

function ProtocolRow({ protocol, onSelect }: { protocol: Protocol; onSelect: () => void }) {
  return (
    <button className="protocol-row" type="button" onClick={onSelect}>
      <span className="protocol-thumb" aria-hidden="true">
        <img src={protocol.imageUrl} alt="" />
      </span>
      <span className="protocol-copy">
        <strong>{protocol.title}</strong>
        <span className="protocol-tags">
          <span className="protocol-category">{protocol.category}</span>
          {protocol.markerChips.slice(0, 2).map((chip) => (
            <MarkerChipTag chip={chip} key={chip.label} />
          ))}
          {protocol.startHere && <span className="start-week-tag">Start this week</span>}
        </span>
      </span>
      <ChevronRight className="protocol-chevron" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

function FocusAreaSection({
  area,
  onSelectProtocol,
}: {
  area: FocusArea;
  onSelectProtocol: (id: string) => void;
}) {
  return (
    <section className="focus-section" aria-labelledby={`focus-${area.id}`}>
      <div className="focus-section-heading">
        <span className={`focus-section-eyebrow ${priorityClass[area.priority]}`}>
          <span className="focus-section-dot" aria-hidden="true" />
          {area.priority}
        </span>
        <h3 id={`focus-${area.id}`}>{area.title}</h3>
        <p>{area.summary}</p>
      </div>
      <div className="protocol-list">
        {area.protocols.map((protocol) => (
          <ProtocolRow key={protocol.id} protocol={protocol} onSelect={() => onSelectProtocol(protocol.id)} />
        ))}
      </div>
    </section>
  );
}

function AlreadyDoingSection() {
  return (
    <section className="already-doing" aria-labelledby="already-doing-title">
      <h3 id="already-doing-title">Already part of your routine</h3>
      <ul>
        {alreadyDoing.map((item) => (
          <li key={item.text}>
            <Check strokeWidth={2} aria-hidden="true" />
            <span>
              {item.text}
              <em>{item.basedOn}</em>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewFooter() {
  return (
    <section className="review-footer" aria-label={reviewFooter.title}>
      <span className="review-footer-icon" aria-hidden="true">
        <CalendarDays strokeWidth={1.75} />
      </span>
      <div>
        <strong>{reviewFooter.title}</strong>
        <p>{reviewFooter.body}</p>
        <em>{reviewFooter.note}</em>
      </div>
      <button className="review-footer-cta" type="button">
        <MessageCircle strokeWidth={1.75} aria-hidden="true" />
        <span>{reviewFooter.cta}</span>
      </button>
    </section>
  );
}

function ProtocolDetailPanel({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, [protocol.id]);

  return (
    <aside className="action-detail-drawer" aria-labelledby="protocol-detail-title" role="dialog" aria-modal="true">
      <button
        className="action-detail-close"
        type="button"
        aria-label="Close protocol details"
        onClick={onClose}
        ref={closeRef}
      >
        <X strokeWidth={1.85} />
      </button>

      <div className="action-detail-intro">
        <span className="action-category-pill">{protocol.category}</span>
        <img className="action-detail-thumb" src={protocol.imageUrl} alt="" />
        <h2 id="protocol-detail-title">{protocol.title}</h2>
        <p className="protocol-personal-lead">{protocol.personalLead}</p>
      </div>

      <section className="action-detail-section">
        <h3>Why this is in your plan</h3>
        <div className="protocol-detail-chips">
          {protocol.markerChips.map((chip) => (
            <MarkerChipTag chip={chip} key={chip.label} />
          ))}
        </div>
        <p>{protocol.whyInPlan}</p>
      </section>

      <section className="action-detail-section">
        <h3>What to do</h3>
        <p>{protocol.whatToDo.intro}</p>
        <div className="action-option-list" aria-label="Options">
          {protocol.whatToDo.options.map((option) => (
            <span className="action-option-chip" key={option.label}>
              <span className="action-option-visual" aria-hidden="true">
                <img src={option.imageUrl} alt="" />
              </span>
              <span>{option.label}</span>
            </span>
          ))}
        </div>
        <div className="guidance-box">
          <Sprout strokeWidth={1.85} aria-hidden="true" />
          <span>{protocol.whatToDo.guidance}</span>
        </div>
        {protocol.whatToDo.alternatives.length > 0 && (
          <div className="alternative-note">
            <span>Other ways to hit this</span>
            <ul>
              {protocol.whatToDo.alternatives.map((alternative) => (
                <li key={alternative}>{alternative}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="made-for-you" aria-labelledby="made-for-you-title">
        <div className="made-for-you-heading">
          <UserRound strokeWidth={1.75} aria-hidden="true" />
          <h3 id="made-for-you-title">Made for you</h3>
        </div>
        {protocol.madeForYou.map((line) => (
          <div className="made-for-you-line" key={line.text}>
            <p>{line.text}</p>
            <em>{line.basedOn}</em>
          </div>
        ))}
      </section>

      <section className="action-detail-section">
        <h3>Key benefits</h3>
        <ul className="benefit-list">
          {protocol.benefits.map((benefit) => (
            <li key={benefit.title}>
              <Check strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>{benefit.title}</strong> {benefit.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="action-detail-section watchout-section">
        <h3>Watch-outs</h3>
        <ul className="watchout-list">
          {protocol.watchOuts.map((watchOut) => (
            <li key={watchOut}>{watchOut}</li>
          ))}
        </ul>
      </section>

      <section className="review-timing-box">
        <CalendarDays strokeWidth={1.8} aria-hidden="true" />
        <div>
          <strong>Retest / review timing</strong>
          <p>{protocol.reviewTiming}</p>
        </div>
      </section>
    </aside>
  );
}

export default function CarePlanDashboard() {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const allProtocols = useMemo(() => focusAreas.flatMap((area) => area.protocols), []);
  const selectedProtocol = allProtocols.find((protocol) => protocol.id === selectedProtocolId) ?? null;

  useEffect(() => {
    if (!selectedProtocol) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProtocolId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProtocol]);

  return (
    <section className="care-plan-dashboard" aria-label="Care Plan">
      <div className="care-plan-main-panel">
        <PlanHeader />

        {focusAreas.map((area) => (
          <FocusAreaSection area={area} key={area.id} onSelectProtocol={setSelectedProtocolId} />
        ))}

        <AlreadyDoingSection />
        <ReviewFooter />
      </div>

      {selectedProtocol && (
        <div className="action-detail-layer" role="presentation">
          <button
            className="action-detail-backdrop"
            type="button"
            aria-label="Dismiss protocol details"
            onClick={() => setSelectedProtocolId(null)}
          />
          <ProtocolDetailPanel protocol={selectedProtocol} onClose={() => setSelectedProtocolId(null)} />
        </div>
      )}
    </section>
  );
}
