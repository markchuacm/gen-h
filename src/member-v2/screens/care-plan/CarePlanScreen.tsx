import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { lifestyleCategoryOrder } from "./carePlanData";
import type { CarePlanAction, FocusArea, LifestyleCategory } from "./carePlanData";
import { CATEGORY_THUMBNAILS, defaultDoctorAvatar, resolveSectionImage } from "./carePlanAssets";
import { fetchCarePlan } from "../../../lib/api/carePlan";
import type { CarePlanRow } from "../../../lib/api/carePlan";
import { fetchDoctorProfile } from "../../../lib/api/memberProfile";
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

type DoctorIdentity = { doctorName: string; avatarUrl: string };

/** Map DB plan rows into the FocusArea shape the screen renders. Images are
    resolved here (frontend-owned); doctor identity comes from the profile. */
function toFocusAreas(plan: CarePlanRow, doctor: DoctorIdentity): FocusArea[] {
  return plan.care_plan_sections.map((section) => ({
    id: section.id,
    title: section.title ?? "Focus area",
    overviewImageUrl: resolveSectionImage(section.image_key, section.sort_order),
    detailImageUrl: resolveSectionImage(section.image_key, section.sort_order),
    summary: section.summary ?? "",
    markers: section.markers ?? [],
    doctorNote: {
      doctorName: doctor.doctorName,
      avatarUrl: doctor.avatarUrl,
      note: section.doctor_note ?? "",
    },
    actions: (section.actions ?? []).map((action) => ({
      ...action,
      focusAreaId: section.id,
      thumbnailUrl: CATEGORY_THUMBNAILS[action.lifestyleCategory] ?? CATEGORY_THUMBNAILS.Nutrition,
    })) as CarePlanAction[],
  }));
}

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
  areaTitle,
  onToggleDone,
  onToggleOpen,
}: {
  action: CarePlanAction;
  done: boolean;
  open: boolean;
  /** When set, renders the focus-area chip on the row. */
  areaTitle?: string;
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
          {areaTitle && <span className="cp-marker-chip">{areaTitle}</span>}
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

function CarePlanScreen({
  onNav,
  memberId,
}: {
  onNav: (tab: MemberTab) => void;
  /** Set when a doctor is previewing an assigned member's plan. */
  memberId?: string;
}) {
  const [done, setDone] = useState<Record<string, boolean>>(loadDone);
  const [openArea, setOpenArea] = useState<FocusArea | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [doctor, setDoctor] = useState<DoctorIdentity>({
    doctorName: "Your Gen-H doctor",
    avatarUrl: defaultDoctorAvatar,
  });

  useEffect(() => {
    let cancelled = false;
    fetchCarePlan(memberId).then(async ({ data: plan }) => {
      if (cancelled || !plan) {
        if (!cancelled) setLoading(false);
        return;
      }
      const doctorProfile = await fetchDoctorProfile(plan.doctor_id);
      const identity: DoctorIdentity = {
        doctorName: doctorProfile.data?.full_name ?? "Your Gen-H doctor",
        avatarUrl: doctorProfile.data?.avatar_url ?? defaultDoctorAvatar,
      };
      if (cancelled) return;
      setDoctor(identity);
      setFocusAreas(toFocusAreas(plan, identity));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const allActions = useMemo(() => focusAreas.flatMap((area) => area.actions), [focusAreas]);
  const areaTitleById = useMemo(
    () => new Map(focusAreas.map((area) => [area.id, area.title])),
    [focusAreas],
  );
  const planMarkers = useMemo(
    () => [...new Set(focusAreas.flatMap((area) => area.markers))],
    [focusAreas],
  );

  const toggleDone = (id: string) => {
    setDone((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(DONE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const doneCount = allActions.filter((action) => done[action.id]).length;

  if (loading) return null;

  if (focusAreas.length === 0) {
    return (
      <main className="p-page">
        <header className="cp-head">
          <span className="p-eyebrow">YOUR CARE PLAN</span>
          <h1 className="p-h1">
            Your plan is <em>on the way</em>
          </h1>
        </header>
        <section className="p-card cp-attribution">
          <div className="cp-attribution-copy">
            <strong>Your doctor is preparing your care plan</strong>
            <p>Once it's released, your focus areas and weekly actions will appear here.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-page">
      <header className="cp-head">
        <span className="p-eyebrow">YOUR CARE PLAN</span>
        <h1 className="p-h1">
          Your plan for the next <em>12 weeks</em>
        </h1>
      </header>

      <section className="p-card cp-attribution">
        <img src={doctor.avatarUrl} alt={doctor.doctorName} />
        <div className="cp-attribution-copy">
          <strong>Prepared by {doctor.doctorName}</strong>
          <p>Based on your results and consult · Next review in 12 weeks</p>
          <div className="cp-markers" aria-label="Markers this plan works on">
            {planMarkers.map((marker) => (
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
              ? `${doneCount} of ${allActions.length} actions checked off — small, repeatable moves.`
              : `${allActions.length} small, repeatable actions across food, movement, supplements and sleep.`}
          </p>
        </div>
        {lifestyleCategoryOrder.map((category: LifestyleCategory) => {
          const actions = allActions.filter((action) => action.lifestyleCategory === category);
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
                    areaTitle={areaTitleById.get(action.focusAreaId)}
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
