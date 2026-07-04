import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { focusAreas, lifestyleCategoryOrder } from "./carePlanData";
import type { CarePlanAction, FocusArea, LifestyleCategory } from "./carePlanData";
import type { MemberTab } from "../../journey/journeyState";
import "./care-plan.css";

const DONE_STORAGE_KEY = "genh-v2-protocol-done";

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(DONE_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const ALL_ACTIONS = focusAreas.flatMap((area) => area.actions);

const AREA_TITLE_BY_ID = new Map(focusAreas.map((area) => [area.id, area.title]));

const PLAN_MARKERS = focusAreas.flatMap((area) => area.markers);

function DoctorNote({ area }: { area: FocusArea }) {
  const firstSentenceEnd = area.doctorNote.note.indexOf(". ") + 1;
  const opener = area.doctorNote.note.slice(0, firstSentenceEnd);
  const rest = area.doctorNote.note.slice(firstSentenceEnd);
  return (
    <figure className="cp-doctor-note">
      <img src={area.doctorNote.avatarUrl} alt="" />
      <div>
        <blockquote>
          <em>{opener}</em>
          {rest}
        </blockquote>
        <cite>{area.doctorNote.doctorName}</cite>
      </div>
    </figure>
  );
}

function ActionRow({
  action,
  done,
  open,
  showAreaChip,
  onToggleDone,
  onToggleOpen,
}: {
  action: CarePlanAction;
  done: boolean;
  open: boolean;
  showAreaChip: boolean;
  onToggleDone: () => void;
  onToggleOpen: () => void;
}) {
  return (
    <li className={`cp-row ${done ? "is-done" : ""} ${open ? "is-open" : ""}`}>
      <div className="cp-row-main">
        <button
          className="cp-check"
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${action.title}" as done`}
          onClick={onToggleDone}
        >
          <Check strokeWidth={3} />
        </button>
        <img className="cp-row-thumb" src={action.thumbnailUrl} alt="" />
        <button
          type="button"
          className="cp-row-copy"
          onClick={onToggleOpen}
          aria-expanded={open}
          style={{ display: "block", textAlign: "left" }}
        >
          <strong>{action.title}</strong>
          <span>{action.instruction}</span>
        </button>
        <span className="cp-row-side">
          {showAreaChip && (
            <span className="cp-marker-chip">{AREA_TITLE_BY_ID.get(action.focusAreaId)}</span>
          )}
          <ChevronDown strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      {open && (
        <div className="cp-row-detail">
          <p>
            <strong>Why this works.</strong> {action.rationale}
          </p>
          <p>{action.moreGuidance}</p>
        </div>
      )}
    </li>
  );
}

function FocusAreaPanel({
  area,
  done,
  onToggleDone,
  onClose,
}: {
  area: FocusArea;
  done: Record<string, boolean>;
  onToggleDone: (id: string) => void;
  onClose: () => void;
}) {
  const [openAction, setOpenAction] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="cp-panel-layer" onClick={onClose} aria-hidden="true" />
      <aside className="cp-panel" role="dialog" aria-label={area.title}>
        <div className="cp-panel-image">
          <img src={area.detailImageUrl} alt="" />
          <button className="cp-panel-close" type="button" aria-label="Close" onClick={onClose}>
            <X strokeWidth={1.8} />
          </button>
        </div>
        <div className="cp-panel-body">
          <h3>{area.title}</h3>
          <p className="cp-panel-summary">{area.summary}</p>
          <DoctorNote area={area} />
          <div className="cp-panel-actions">
            <h4>Your actions</h4>
            <ul className="cp-rows">
              {area.actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  done={!!done[action.id]}
                  open={openAction === action.id}
                  showAreaChip={false}
                  onToggleDone={() => onToggleDone(action.id)}
                  onToggleOpen={() =>
                    setOpenAction((current) => (current === action.id ? null : action.id))
                  }
                />
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

function CarePlanScreen({ onNav }: { onNav: (tab: MemberTab) => void }) {
  const [done, setDone] = useState<Record<string, boolean>>(loadDone);
  const [openArea, setOpenArea] = useState<FocusArea | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);

  const toggleDone = (id: string) => {
    setDone((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(DONE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const doneCount = ALL_ACTIONS.filter((action) => done[action.id]).length;

  return (
    <main className="p-page">
      <header className="cp-head">
        <span className="p-eyebrow">YOUR CARE PLAN</span>
        <h1 className="p-h1">
          Your plan for the next <em>12 weeks</em>
        </h1>
      </header>

      <section className="p-card cp-attribution">
        <img src={focusAreas[0].doctorNote.avatarUrl} alt="Dr. Farheen Nafisa" />
        <div className="cp-attribution-copy">
          <strong>Prepared by {focusAreas[0].doctorNote.doctorName}</strong>
          <p>Based on your June results and consult · Next review in 12 weeks</p>
          <div className="cp-markers" aria-label="Markers this plan works on">
            {PLAN_MARKERS.map((marker) => (
              <button
                key={marker}
                className="cp-marker-chip"
                type="button"
                onClick={() => onNav("results")}
                title={`See ${marker} in your results`}
              >
                {marker}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-section" aria-labelledby="cp-areas-title">
        <div className="cp-section-head">
          <h2 id="cp-areas-title">
            Four <em>focus areas</em>
          </h2>
          <p>
            Where your results say attention matters most — and why each one made it into your
            plan.
          </p>
        </div>
        <div className="cp-areas">
          {focusAreas.map((area) => (
            <button className="cp-area" type="button" key={area.id} onClick={() => setOpenArea(area)}>
              <span className="cp-area-image">
                <img src={area.overviewImageUrl} alt="" />
              </span>
              <span className="cp-area-body">
                <h3>{area.title}</h3>
                <p>{area.summary}</p>
                <span className="cp-area-meta">
                  {area.markers.map((marker) => (
                    <span key={marker} className="cp-marker-chip">
                      {marker}
                    </span>
                  ))}
                  <span className="cp-area-count">
                    {area.actions.length} action{area.actions.length > 1 ? "s" : ""}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="cp-section" aria-labelledby="cp-protocol-title">
        <div className="cp-section-head">
          <h2 id="cp-protocol-title">
            Your weekly <em>protocol</em>
          </h2>
          <p>
            {doneCount > 0
              ? `${doneCount} of ${ALL_ACTIONS.length} actions checked off — small, repeatable moves.`
              : `${ALL_ACTIONS.length} small, repeatable actions across food, movement, supplements and sleep.`}
          </p>
        </div>
        {lifestyleCategoryOrder.map((category: LifestyleCategory) => {
          const actions = ALL_ACTIONS.filter((action) => action.lifestyleCategory === category);
          if (actions.length === 0) return null;
          return (
            <div className="cp-group" key={category}>
              <h3 className="cp-group-title">{category}</h3>
              <ul className="cp-rows">
                {actions.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    done={!!done[action.id]}
                    open={openAction === action.id}
                    showAreaChip
                    onToggleDone={() => toggleDone(action.id)}
                    onToggleOpen={() =>
                      setOpenAction((current) => (current === action.id ? null : action.id))
                    }
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="cp-review">
        <div>
          <h2>
            Next review in <em>12 weeks</em>
          </h2>
          <p>
            Your doctor will retest the markers behind this plan and adjust it with you. Nothing
            here is forever — it's the next 12 weeks.
          </p>
        </div>
        <button className="p-btn-ghost" type="button">
          Message your doctor
        </button>
      </section>

      {openArea && (
        <FocusAreaPanel
          area={openArea}
          done={done}
          onToggleDone={toggleDone}
          onClose={() => setOpenArea(null)}
        />
      )}
    </main>
  );
}

export default CarePlanScreen;
