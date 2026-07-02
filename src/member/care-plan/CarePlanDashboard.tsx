import { useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Link,
  Sprout,
  Star,
  Target,
  X,
} from "lucide-react";
import {
  carePlanHeroImage,
  carePlanSummary,
  carePlanStats,
  evidenceItems,
  focusAreas,
  thisWeekActions,
  type CarePlanAction,
  type FocusArea,
  type FocusAreaStatus,
} from "./carePlanData";
import "./care-plan.css";

const statusClass: Record<FocusAreaStatus, string> = {
  Priority: "status-priority",
  "Quick win": "status-quick-win",
  Support: "status-support",
};

const statIcons = [Target, CheckCircle2, Star, CalendarDays];

function CarePlanHero() {
  return (
    <section className="care-plan-hero" aria-labelledby="care-plan-title">
      <div className="care-plan-hero-copy">
        <span className="care-plan-kicker">Doctor-reviewed plan</span>
        <h2 id="care-plan-title">{carePlanSummary.title}</h2>
        <p>{carePlanSummary.subtitle}</p>
      </div>
      <div className="care-plan-hero-image" aria-hidden="true">
        <img src={carePlanHeroImage} alt="" />
      </div>
      <div className="care-plan-stats" aria-label="Care plan summary">
        {carePlanStats.map((stat, index) => {
          const Icon = statIcons[index] ?? CircleDot;
          return (
            <div className="care-plan-stat" key={stat.id}>
              <span className="care-plan-stat-icon">
                <Icon strokeWidth={1.75} />
              </span>
              <span>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <em>{stat.detail}</em>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EvidenceStrip() {
  return (
    <section className="evidence-strip" aria-labelledby="evidence-strip-title">
      <div className="evidence-strip-heading">
        <span>Why these priorities</span>
        <h2 id="evidence-strip-title">Generated from Mark&apos;s latest markers and recovery profile.</h2>
      </div>
      <div className="evidence-list">
        {evidenceItems.map((item) => (
          <div className="evidence-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.context}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThisWeekModule() {
  return (
    <section className="this-week-module" aria-labelledby="this-week-title">
      <div className="this-week-heading">
        <span>This week</span>
        <h2 id="this-week-title">Start with these 5 actions</h2>
      </div>
      <div className="this-week-list">
        {thisWeekActions.map((action, index) => (
          <div className="this-week-action" key={action.id}>
            <span className="this-week-number">{index + 1}</span>
            <div>
              <strong>{action.title}</strong>
              <p>{action.detail}</p>
              <em>Linked to: {action.linkedTo}</em>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusAreaCard({
  area,
  isSelected,
  onSelect,
}: {
  area: FocusArea;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`focus-area-card ${isSelected ? "is-selected" : ""}`}
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
    >
      <span className="focus-area-image">
        <img src={area.imageUrl} alt="" />
      </span>
      <span className="focus-area-copy">
        <span className={`focus-area-status ${statusClass[area.status]}`}>{area.status}</span>
        <strong>{area.title}</strong>
        <span>{area.description}</span>
        <span className="focus-area-linked">
          {area.biomarkers.map((biomarker) => (
            <em key={biomarker}>{biomarker}</em>
          ))}
        </span>
        <span className="focus-area-levers">
          <span>Next levers</span>
          {area.levers.map((lever) => (
            <em key={lever}>{lever}</em>
          ))}
        </span>
      </span>
      <span className="focus-area-footer">
        <span>{area.actionsLabel}</span>
        <ChevronRight strokeWidth={1.75} />
      </span>
    </button>
  );
}

function ActionDetailDrawer({ action, onClose }: { action: CarePlanAction; onClose: () => void }) {
  return (
    <aside className="action-detail-drawer" aria-labelledby="action-detail-title" role="dialog" aria-modal="true">
      <button className="action-detail-close" type="button" aria-label="Close action details" onClick={onClose}>
        <X strokeWidth={1.85} />
      </button>

      <div className="action-detail-intro">
        <span className="action-category-pill">{action.category}</span>
        <img className="action-detail-thumb" src={action.imageUrl} alt="" />
        <h2 id="action-detail-title">{action.title}</h2>
        <p>{action.subtitle}</p>
      </div>

      <div className="linked-biomarker-box">
        <Link strokeWidth={1.8} aria-hidden="true" />
        <span>Linked to: {action.linkedBiomarkers.join(", ")}</span>
      </div>

      <section className="action-detail-section">
        <h3>Why this is in your plan</h3>
        <p>{action.whyInPlan}</p>
      </section>

      <section className="action-detail-section action-detail-section--personal">
        <h3>Your version</h3>
        <p>{action.yourVersion}</p>
      </section>

      <section className="action-detail-section">
        <h3>What to do</h3>
        <p>{action.whatToDo.intro}</p>
        <div className="action-option-list" aria-label="Breakfast options">
          {action.whatToDo.options.map((option) => (
            <span className="action-option-chip" key={option.label}>
              <span className="action-option-visual" aria-hidden="true">
                <img src={option.imageUrl} alt="" />
              </span>
              <span>{option.label}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="guidance-box">
        <Sprout strokeWidth={1.85} aria-hidden="true" />
        <span>{action.whatToDo.guidance}</span>
      </div>

      <section className="action-detail-section">
        <h3>Other ways to do this</h3>
        <ul className="alternative-list">
          {action.alternatives.map((alternative) => (
            <li key={alternative}>
              <Check strokeWidth={2} aria-hidden="true" />
              <span>{alternative}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="watchout-box" aria-label={action.watchOuts.title}>
        <strong>{action.watchOuts.title}</strong>
        <p>{action.watchOuts.body}</p>
      </section>

      <section className="review-timing-box">
        <CalendarDays strokeWidth={1.8} aria-hidden="true" />
        <div>
          <strong>Retest / review timing</strong>
          <p>{action.reviewTiming}</p>
        </div>
      </section>
    </aside>
  );
}

export default function CarePlanDashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selectedArea = focusAreas.find((area) => area.id === selectedAreaId) ?? focusAreas[0];
  const selectedAction = selectedArea.actions[0];

  return (
    <section className="care-plan-dashboard" aria-label="Care Plan">
      <div className="care-plan-main-panel">
        <CarePlanHero />
        <EvidenceStrip />
        <ThisWeekModule />

        <section className="focus-area-section" aria-labelledby="focus-area-title">
          <div className="focus-area-heading">
            <div>
              <span>Priority map</span>
              <h2 id="focus-area-title">Your focus areas</h2>
              <p>Each priority connects Mark&apos;s biomarkers to the behavioural levers most likely to move them.</p>
            </div>
            <button type="button">View all</button>
          </div>

          <div className="focus-area-grid">
            {focusAreas.map((area) => (
              <FocusAreaCard
                area={area}
                isSelected={drawerOpen && area.id === selectedAreaId}
                key={area.id}
                onSelect={() => {
                  setSelectedAreaId(area.id);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </section>

        <button className="view-all-actions" type="button" aria-label="View all actions">
          <span>View all actions (12)</span>
          <ChevronDown strokeWidth={1.8} />
        </button>
      </div>

      {drawerOpen && selectedAction && (
        <div className="action-detail-layer" role="presentation">
          <button className="action-detail-backdrop" type="button" aria-label="Dismiss action details" onClick={() => setDrawerOpen(false)} />
          <ActionDetailDrawer action={selectedAction} onClose={() => setDrawerOpen(false)} />
        </div>
      )}
    </section>
  );
}
