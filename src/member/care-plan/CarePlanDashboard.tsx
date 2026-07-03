import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import {
  focusAreas,
  lifestyleCategoryOrder,
  type CarePlanAction,
  type FocusArea,
  type FocusAreaId,
  type LifestyleCategory,
} from "./carePlanData";
import "./care-plan.css";

type OverviewTab = "focusAreas" | "allActions";

type IndexedAction = CarePlanAction & {
  focusAreaTitle: string;
};

function focusAreaById(id: FocusAreaId) {
  return focusAreas.find((area) => area.id === id) ?? focusAreas[0];
}

function ViewToggle({
  activeTab,
  onChange,
  toggleRef,
}: {
  activeTab: OverviewTab;
  onChange: (tab: OverviewTab) => void;
  toggleRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="care-plan-view-toggle" role="group" aria-label="Care plan view" ref={toggleRef}>
      <button
        type="button"
        aria-pressed={activeTab === "focusAreas"}
        className={activeTab === "focusAreas" ? "is-active" : ""}
        onClick={() => onChange("focusAreas")}
      >
        Focus Areas
      </button>
      <button
        type="button"
        aria-pressed={activeTab === "allActions"}
        className={activeTab === "allActions" ? "is-active" : ""}
        onClick={() => onChange("allActions")}
      >
        All Actions
      </button>
    </div>
  );
}

function FocusAreaCard({ area, onOpen }: { area: FocusArea; onOpen: () => void }) {
  return (
    <button className="focus-area-card" type="button" onClick={onOpen}>
      <img src={area.overviewImageUrl} alt="" />
      <span className="focus-area-card-panel">
        <strong>{area.title}</strong>
        <span>
          View plan
          <ArrowRight strokeWidth={1.7} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

function FocusAreaGrid({ onOpenArea }: { onOpenArea: (id: FocusAreaId) => void }) {
  return (
    <div className="focus-area-grid">
      {focusAreas.map((area) => (
        <FocusAreaCard area={area} key={area.id} onOpen={() => onOpenArea(area.id)} />
      ))}
    </div>
  );
}

function ActionIndexRow({ action, onOpen }: { action: IndexedAction; onOpen: () => void }) {
  return (
    <button className="action-index-row" type="button" onClick={onOpen}>
      <span className="action-index-thumb" aria-hidden="true">
        <img src={action.thumbnailUrl} alt="" />
      </span>
      <span className="action-index-title">{action.title}</span>
      <span className="action-index-area">{action.focusAreaTitle}</span>
      <ArrowRight className="action-index-arrow" strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}

function AllActionsIndex({
  groupedActions,
  onOpenAction,
}: {
  groupedActions: Map<LifestyleCategory, IndexedAction[]>;
  onOpenAction: (action: IndexedAction) => void;
}) {
  return (
    <div className="all-actions-index">
      {lifestyleCategoryOrder.map((category) => {
        const actions = groupedActions.get(category);
        if (!actions?.length) return null;

        return (
          <section className="action-category-group" key={category} aria-labelledby={`actions-${category}`}>
            <h2 id={`actions-${category}`}>{category}</h2>
            <div className="action-index-list">
              {actions.map((action) => (
                <ActionIndexRow action={action} key={action.id} onOpen={() => onOpenAction(action)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DetailTopBar({
  activeFocusAreaId,
  onBack,
  onSelectArea,
  backRef,
}: {
  activeFocusAreaId: FocusAreaId;
  onBack: () => void;
  onSelectArea: (id: FocusAreaId) => void;
  backRef: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <div className="detail-top-bar">
      <button className="detail-back-button" type="button" onClick={onBack} ref={backRef}>
        <ArrowLeft strokeWidth={1.7} aria-hidden="true" />
        Back to Focus Areas
      </button>
      <nav className="focus-area-tabs" aria-label="Focus areas">
        {focusAreas.map((area) => (
          <button
            type="button"
            key={area.id}
            aria-current={activeFocusAreaId === area.id ? "page" : undefined}
            onClick={() => onSelectArea(area.id)}
          >
            {area.title}
          </button>
        ))}
      </nav>
    </div>
  );
}

function DetailHeader({ area }: { area: FocusArea }) {
  return (
    <header className="detail-header">
      <img src={area.detailImageUrl} alt="" />
      <div>
        <h2>{area.title}</h2>
        <p>{area.summary}</p>
      </div>
    </header>
  );
}

function DoctorNoteCard({ area }: { area: FocusArea }) {
  return (
    <section className="doctor-note-card" aria-label={`Dr. Farheen's note for ${area.title}`}>
      <img src={area.doctorNote.avatarUrl} alt="" />
      <div>
        <h3>Dr. Farheen&apos;s note</h3>
        <p>{area.doctorNote.note}</p>
      </div>
    </section>
  );
}

function GuidancePanel({ id, isExpanded, children }: { id: string; isExpanded: boolean; children: React.ReactNode }) {
  return (
    <div className={`guidance-panel ${isExpanded ? "is-expanded" : ""}`} id={id} aria-hidden={!isExpanded}>
      <div>
        <p>{children}</p>
      </div>
    </div>
  );
}

function ActionCard({
  action,
  isExpanded,
  isHighlighted,
  onToggle,
  setActionRef,
}: {
  action: CarePlanAction;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  setActionRef: (element: HTMLDivElement | null) => void;
}) {
  const guidanceId = `guidance-${action.id}`;

  return (
    <article
      className={`action-card ${isHighlighted ? "action-card--highlight" : ""}`}
      ref={setActionRef}
      tabIndex={-1}
    >
      <img src={action.thumbnailUrl} alt="" />
      <div className="action-card-copy">
        <div>
          <span>{action.lifestyleCategory}</span>
          <h3>{action.title}</h3>
        </div>
        <p className="action-instruction">{action.instruction}</p>
        <p className="action-rationale">{action.rationale}</p>
        <button
          className="guidance-toggle"
          type="button"
          aria-expanded={isExpanded}
          aria-controls={guidanceId}
          onClick={onToggle}
        >
          More guidance
          <ChevronDown strokeWidth={1.7} aria-hidden="true" />
        </button>
        <GuidancePanel id={guidanceId} isExpanded={isExpanded}>
          {action.moreGuidance}
        </GuidancePanel>
      </div>
    </article>
  );
}

function FocusAreaDetail({
  area,
  pendingActionId,
  onPendingActionHandled,
  onBack,
  onSelectArea,
}: {
  area: FocusArea;
  pendingActionId: string | null;
  onPendingActionHandled: () => void;
  onBack: () => void;
  onSelectArea: (id: FocusAreaId) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [highlightedActionId, setHighlightedActionId] = useState<string | null>(null);
  const actionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const targetAction = pendingActionId ? actionRefs.current[pendingActionId] : null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (targetAction) {
      targetAction.scrollIntoView({ block: "center", behavior: prefersReducedMotion ? "auto" : "smooth" });
      targetAction.focus({ preventScroll: true });
      setHighlightedActionId(pendingActionId);
      onPendingActionHandled();
      const timer = window.setTimeout(() => setHighlightedActionId(null), 1600);
      return () => window.clearTimeout(timer);
    }

    backRef.current?.focus({ preventScroll: true });
  }, [area.id, onPendingActionHandled, pendingActionId]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="focus-area-detail" aria-labelledby={`detail-${area.id}`}>
      <DetailTopBar activeFocusAreaId={area.id} onBack={onBack} onSelectArea={onSelectArea} backRef={backRef} />
      <DetailHeader area={area} />
      <DoctorNoteCard area={area} />
      <section className="recommended-actions" aria-labelledby={`actions-for-${area.id}`}>
        <h2 id={`actions-for-${area.id}`}>Recommended actions</h2>
        <div className="action-card-list">
          {area.actions.map((action) => (
            <ActionCard
              action={action}
              isExpanded={expandedIds.has(action.id)}
              isHighlighted={highlightedActionId === action.id}
              key={action.id}
              onToggle={() => toggleExpanded(action.id)}
              setActionRef={(element) => {
                actionRefs.current[action.id] = element;
              }}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export default function CarePlanDashboard() {
  const [overviewTab, setOverviewTab] = useState<OverviewTab>("focusAreas");
  const [activeFocusAreaId, setActiveFocusAreaId] = useState<FocusAreaId | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  const groupedActions = useMemo(() => {
    const groups = new Map<LifestyleCategory, IndexedAction[]>();
    for (const area of focusAreas) {
      for (const action of area.actions) {
        const indexedAction: IndexedAction = { ...action, focusAreaTitle: area.title };
        const existing = groups.get(action.lifestyleCategory) ?? [];
        existing.push(indexedAction);
        groups.set(action.lifestyleCategory, existing);
      }
    }
    return groups;
  }, []);

  const activeFocusArea = activeFocusAreaId ? focusAreaById(activeFocusAreaId) : null;

  const goBackToOverview = () => {
    setActiveFocusAreaId(null);
    setPendingActionId(null);
    setOverviewTab("focusAreas");
    window.setTimeout(() => toggleRef.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <section className="care-plan-dashboard" aria-label="Care Plan">
      {activeFocusArea ? (
        <FocusAreaDetail
          area={activeFocusArea}
          key={activeFocusArea.id}
          onBack={goBackToOverview}
          onPendingActionHandled={() => setPendingActionId(null)}
          onSelectArea={(id) => {
            setActiveFocusAreaId(id);
            setPendingActionId(null);
          }}
          pendingActionId={pendingActionId}
        />
      ) : (
        <>
          <ViewToggle activeTab={overviewTab} onChange={setOverviewTab} toggleRef={toggleRef} />
          {overviewTab === "focusAreas" ? (
            <>
              <p className="care-plan-intro">
                Your care plan is organised around four focus areas. Each plan opens into Dr. Farheen&apos;s note and the actions to start with.
              </p>
              <FocusAreaGrid
                onOpenArea={(id) => {
                  setActiveFocusAreaId(id);
                  setPendingActionId(null);
                }}
              />
            </>
          ) : (
            <AllActionsIndex
              groupedActions={groupedActions}
              onOpenAction={(action) => {
                setActiveFocusAreaId(action.focusAreaId);
                setPendingActionId(action.id);
              }}
            />
          )}
        </>
      )}
    </section>
  );
}
