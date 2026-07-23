import { Check, CheckCircle2, ChevronDown, Download, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCarePlan,
  fetchCarePlanProgress,
  setCarePlanActionProgress,
} from "../../../lib/api/carePlan";
import type { CarePlanRow } from "../../../lib/api/carePlan";
import { fetchDoctorProfile } from "../../../lib/api/memberProfile";
import type { MemberTab } from "../../journey/journeyState";
import PendingPortalDialog from "../../shell/PendingPortalDialog";
import { CATEGORY_THUMBNAILS, defaultDoctorAvatar, resolveSectionImage } from "./carePlanAssets";
import type { CarePlanAction, FocusArea } from "./carePlanData";
import "./care-plan.css";

const LEGACY_DONE_STORAGE_KEY = "genh-v2-protocol-done";
type DoctorIdentity = { doctorName: string; avatarUrl: string };

function legacyDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_DONE_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function toFocusAreas(plan: CarePlanRow, doctor: DoctorIdentity): FocusArea[] {
  return plan.care_plan_sections.map((section) => ({
    id: section.id,
    title: section.title ?? "Focus area",
    overviewImageUrl: resolveSectionImage(section.image_key, section.sort_order),
    detailImageUrl: resolveSectionImage(section.image_key, section.sort_order),
    summary: section.summary ?? "",
    markers: section.markers ?? [],
    evidence: section.evidence_snapshot ?? [],
    profileBasis: section.profile_basis ?? [],
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
  if (!area.doctorNote.note.trim()) return null;
  const boundary = area.doctorNote.note.indexOf(". ");
  const opener = boundary >= 0 ? area.doctorNote.note.slice(0, boundary + 1) : area.doctorNote.note;
  const rest = boundary >= 0 ? area.doctorNote.note.slice(boundary + 1) : "";
  return (
    <figure className="cp-doctor-note cp-coauthored-note">
      <img src={area.doctorNote.avatarUrl} alt="" />
      <div>
        <blockquote><em>{opener}</em>{rest}</blockquote>
        <cite>{area.doctorNote.doctorName}</cite>
      </div>
    </figure>
  );
}

function ActionRow({
  action,
  done,
  open,
  onToggleDone,
  onToggleOpen,
}: {
  action: CarePlanAction;
  done: boolean;
  open: boolean;
  onToggleDone: () => void;
  onToggleOpen: () => void;
}) {
  return (
    <li className={`cp-row cp-coauthored-action ${done ? "is-done" : ""} ${open ? "is-open" : ""}`}>
      <div className="cp-row-main">
        <button
          className="cp-check"
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${action.title}" as ${done ? "not done" : "done"}`}
          onClick={onToggleDone}
        >
          <Check strokeWidth={3} />
        </button>
        <img className="cp-row-thumb" src={action.thumbnailUrl} alt="" />
        <button type="button" className="cp-row-copy" onClick={onToggleOpen} aria-expanded={open}>
          <span className={`cp-category is-${action.lifestyleCategory.toLowerCase()}`}>{action.lifestyleCategory}</span>
          <strong>{action.title}</strong>
          <span>{action.instruction}</span>
        </button>
        <span className="cp-row-side"><ChevronDown strokeWidth={1.8} aria-hidden="true" /></span>
      </div>
      {open && (
        <div className="cp-row-detail">
          <p><strong>Why this works.</strong> {action.rationale}</p>
          <p>{action.moreGuidance}</p>
        </div>
      )}
    </li>
  );
}

function Evidence({
  area,
  onResults,
}: {
  area: FocusArea;
  onResults: () => void;
}) {
  if (area.evidence?.length) {
    return (
      <div className="cp-coauthored-evidence" aria-label="Results behind this focus area">
        {area.evidence.map((item) => (
          <button
            type="button"
            key={item.biomarkerCode}
            className={`cp-evidence-chip is-${item.status}`}
            onClick={onResults}
            title={`See ${item.displayName} in your results`}
          >
            <span>{item.displayName}</span>
            <strong>{item.value ?? "—"}{item.unit ? ` ${item.unit}` : ""}</strong>
            <em>{item.status === "needs_attention" ? "Needs attention" : "At risk"}</em>
          </button>
        ))}
      </div>
    );
  }
  if (area.profileBasis?.length) {
    return (
      <div className="cp-prevention-basis">
        <Sparkles aria-hidden="true" />
        <span>Built around what you shared in your health profile and consultation.</span>
      </div>
    );
  }
  return null;
}

function CarePlanScreen({
  onNav,
  memberId,
}: {
  onNav: (tab: MemberTab) => void;
  memberId?: string;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [carePlanReleased, setCarePlanReleased] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(true);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [plan, setPlan] = useState<CarePlanRow | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorIdentity>({
    doctorName: "Your Verae doctor",
    avatarUrl: defaultDoctorAvatar,
  });

  useEffect(() => {
    let cancelled = false;
    fetchCarePlan(memberId).then(async ({ data: loadedPlan }) => {
      if (cancelled || !loadedPlan) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (loadedPlan.status !== "released") {
        setCarePlanReleased(false);
        setLoading(false);
        return;
      }
      const [doctorProfile, progress] = await Promise.all([
        fetchDoctorProfile(loadedPlan.doctor_id),
        memberId
          ? Promise.resolve({ data: {}, error: null })
          : fetchCarePlanProgress(loadedPlan.id),
      ]);
      if (cancelled) return;
      const identity: DoctorIdentity = {
        doctorName: doctorProfile.data?.full_name ?? "Your Verae doctor",
        avatarUrl: doctorProfile.data?.avatar_url ?? defaultDoctorAvatar,
      };
      setPlan(loadedPlan);
      setCarePlanReleased(true);
      setDoctor(identity);
      setFocusAreas(toFocusAreas(loadedPlan, identity));
      setDone(progress.error ? legacyDone() : progress.data);
      if (progress.error) {
        setProgressError("Your latest check-offs couldn't be loaded. Changes on this device are shown for now.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const allActions = useMemo(() => focusAreas.flatMap((area) => area.actions), [focusAreas]);
  const doneCount = allActions.filter((action) => done[action.id]).length;

  const toggleDone = (id: string) => {
    if (!plan) return;
    const nextValue = !done[id];
    setProgressError(null);
    setDone((current) => ({ ...current, [id]: nextValue }));
    if (memberId) return;
    void setCarePlanActionProgress(plan.id, id, nextValue).then((result) => {
      if (!result.error) return;
      setDone((current) => ({ ...current, [id]: !nextValue }));
      setProgressError("We couldn't save that check-off. Please try again.");
    });
  };

  if (loading) return null;

  if (focusAreas.length === 0) {
    return (
      <main className="p-page">
        <header className="cp-head">
          <span className="p-eyebrow">YOUR CARE PLAN</span>
          <h1 className="p-h1">Your plan is <em>on the way</em></h1>
        </header>
        <section className="p-card cp-attribution">
          <div className="cp-attribution-copy">
            <strong>Your doctor is preparing your care plan</strong>
            <p>Once it is released, your agreed focus areas and actions will appear here.</p>
          </div>
        </section>
        {!memberId && !carePlanReleased && pendingDialogOpen && (
          <PendingPortalDialog
            title="Your plan is on the way"
            closeLabel="Close pending care plan message"
            onClose={() => setPendingDialogOpen(false)}
          >
            Your lab and doctor are reviewing the results and preparing a personalised care plan for your consultation.
          </PendingPortalDialog>
        )}
      </main>
    );
  }

  const reviewLabel = plan?.review_date
    ? new Date(`${plan.review_date}T00:00:00`).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "about 12 weeks";

  return (
    <main className="p-page cp-coauthored">
      <header className="cp-head cp-coauthored-head">
        <span className="p-eyebrow">YOUR AGREED CARE PLAN</span>
        <h1 className="p-h1">{plan?.title ?? <>Your plan for the next <em>12 weeks</em></>}</h1>
        <p>The priorities and actions you chose together with your doctor.</p>
        <button type="button" className="cp-download-plan" onClick={() => window.print()}>
          <Download aria-hidden="true" /> Download plan
        </button>
      </header>

      <section className="p-card cp-attribution cp-coauthored-attribution">
        <img src={doctor.avatarUrl} alt={doctor.doctorName} />
        <div className="cp-attribution-copy">
          <strong>Co-authored with {doctor.doctorName}</strong>
          <p>Based on your results, health profile and consultation · Review {reviewLabel}</p>
        </div>
        <div
          className="cp-progress-ring"
          role="status"
          aria-live="polite"
          aria-label={`${doneCount} of ${allActions.length} actions checked off`}
        >
          <strong>{doneCount}</strong>
          <span>of {allActions.length}<br />done</span>
        </div>
      </section>

      {progressError && <p className="cp-progress-error" role="alert">{progressError}</p>}

      <section className="cp-section cp-coauthored-section" aria-labelledby="cp-focus-title">
        <div className="cp-section-head cp-coauthored-section-head">
          <span className="p-eyebrow">THE CLINICAL STORY</span>
          <h2 id="cp-focus-title">{focusAreas.length} <em>focus areas</em>, agreed one by one.</h2>
          <p>Each priority connects what your doctor saw to the actions you decided would work in real life.</p>
        </div>

        <div className="cp-coauthored-areas">
          {focusAreas.map((area, index) => (
            <article className="cp-coauthored-area" key={area.id}>
              <div className="cp-coauthored-image">
                <img src={area.overviewImageUrl} alt="" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="cp-coauthored-body">
                <div className="cp-coauthored-copy">
                  <span className="p-eyebrow">FOCUS AREA {index + 1}</span>
                  <h2>{area.title}</h2>
                  <p>{area.summary}</p>
                </div>
                <Evidence area={area} onResults={() => onNav("results")} />
                <DoctorNote area={area} />
                <div className="cp-coauthored-actions">
                  <div>
                    <h3>Your agreed actions</h3>
                    <span>{area.actions.filter((action) => done[action.id]).length} of {area.actions.length} checked off</span>
                  </div>
                  <ul className="cp-rows">
                    {area.actions.map((action) => (
                      <ActionRow
                        key={action.id}
                        action={action}
                        done={Boolean(done[action.id])}
                        open={openAction === action.id}
                        onToggleDone={() => toggleDone(action.id)}
                        onToggleOpen={() => setOpenAction((current) => current === action.id ? null : action.id)}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-review cp-coauthored-review">
        <div>
          <span className="p-eyebrow">NEXT CHECK-IN</span>
          <h2>Review on <em>{reviewLabel}</em></h2>
          <p>Your doctor will revisit the evidence and adjust the next version with you. This plan is a starting point, not a permanent prescription.</p>
        </div>
        <span className="cp-review-ready"><CheckCircle2 aria-hidden="true" /> Plan version {plan?.version ?? 1}</span>
      </section>
    </main>
  );
}

export default CarePlanScreen;
