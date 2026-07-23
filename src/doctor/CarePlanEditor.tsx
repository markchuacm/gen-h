import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  HeartHandshake,
  Plus,
  Presentation,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPlanVersion,
  fetchEditablePlan,
  reconcileCarePlan,
  regenerateCarePlan,
  releaseCarePlan,
  savePlanSections,
} from "../lib/api/doctor";
import type { DraftSection } from "../lib/api/doctor";
import type {
  CarePlanActionData,
  ProposedCarePlanAction,
} from "../lib/api/carePlan";
import {
  resolveSectionImage,
} from "../member-v2/screens/care-plan/carePlanAssets";
import { FOCUS_AREA_TEMPLATES } from "./carePlanLibrary";
import CarePlanPreview from "./CarePlanPreview";

type Mode = "prepare" | "consult" | "review";
type EditorSection = DraftSection & { key: string };

function dateInTwelveWeeks(): string {
  const date = new Date();
  date.setDate(date.getDate() + 84);
  return date.toISOString().slice(0, 10);
}

function normalizeSection(section: DraftSection): EditorSection {
  return {
    ...section,
    key: crypto.randomUUID(),
    title: section.title ?? "Focus area",
    summary: section.summary ?? "",
    doctor_note: section.doctor_note ?? "",
    basis_type: section.basis_type ?? "legacy",
    section_state: section.section_state ?? "active",
    defer_reason: section.defer_reason ?? null,
    evidence_snapshot: section.evidence_snapshot ?? [],
    profile_basis: section.profile_basis ?? [],
    proposed_actions: section.proposed_actions ?? [],
    actions: section.actions ?? [],
    markers: section.markers ?? [],
    image_key: section.image_key ?? null,
  };
}

function templateSection(template: (typeof FOCUS_AREA_TEMPLATES)[number], order: number): EditorSection {
  return normalizeSection({
    sort_order: order,
    title: template.title,
    summary: template.summary,
    markers: [...template.markers],
    doctor_note: template.doctorNote,
    image_key: template.imageKey,
    actions: [],
    template_key: template.id,
    basis_type: "manual",
    section_state: "active",
    defer_reason: null,
    evidence_snapshot: [],
    profile_basis: ["Added by the doctor during preparation"],
    proposed_actions: template.actions.map((candidate, index) => ({
      ...candidate,
      id: crypto.randomUUID(),
      templateId: `${template.id}-${index + 1}`,
      doctorRecommended: false,
    })),
  });
}

function selectedFrom(proposed: ProposedCarePlanAction): CarePlanActionData {
  return {
    id: proposed.id,
    title: proposed.title,
    lifestyleCategory: proposed.lifestyleCategory,
    instruction: proposed.instruction,
    rationale: proposed.rationale,
    moreGuidance: proposed.moreGuidance,
    sourceTemplateId: proposed.templateId,
    clinicianConfirmed: proposed.lifestyleCategory !== "Supplements",
  };
}

function sectionComplete(section: EditorSection): boolean {
  if (section.section_state === "deferred") return Boolean(section.defer_reason?.trim());
  return section.actions.length > 0
    && section.actions.every((action) =>
      action.lifestyleCategory !== "Supplements" || action.clinicianConfirmed,
    );
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function draftFingerprint(sections: EditorSection[], title: string, reviewDate: string): string {
  return JSON.stringify({
    title,
    reviewDate,
    sections: sections.map(({ key: _key, ...section }, index) => ({
      ...section,
      sort_order: index,
    })),
  });
}

function basisLabel(basis: EditorSection["basis_type"]): string {
  if (basis === "results") return "RESULT-DRIVEN";
  if (basis === "prevention") return "PREVENTION";
  return "DOCTOR-ADDED";
}

function CarePlanEditor({
  memberId,
  memberName,
  onBack,
}: {
  memberId: string;
  memberName: string | null;
  onBack: () => void;
}) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [mode, setMode] = useState<Mode>("prepare");
  const [title, setTitle] = useState("Your plan for the next 12 weeks");
  const [reviewDate, setReviewDate] = useState(dateInTwelveWeeks);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [evidenceStale, setEvidenceStale] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("ready");
  const [rulesetVersion, setRulesetVersion] = useState<string | null>(null);
  const [planVersion, setPlanVersion] = useState(1);
  const hydratedRef = useRef(false);
  const revisionRef = useRef(0);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const saveQueuedRef = useRef(false);
  const lastSavedFingerprintRef = useRef("");
  const latestRef = useRef({ sections, title, reviewDate });

  latestRef.current = { sections, title, reviewDate };

  const loadPlan = useCallback(async () => {
    const result = await fetchEditablePlan(memberId);
    if (result.error) {
      setBanner(`Couldn't load the care plan: ${result.error}`);
      setLoading(false);
      return;
    }
    if (result.data) {
      const data = result.data;
      const nextTitle = data.title ?? "Your plan for the next 12 weeks";
      const nextReviewDate = data.review_date ?? dateInTwelveWeeks();
      const nextSections = [...(data.care_plan_sections ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(normalizeSection);
      setPlanId(data.id);
      setStatus(data.status);
      setTitle(nextTitle);
      setReviewDate(nextReviewDate);
      setEvidenceStale(Boolean(data.evidence_stale));
      setGenerationStatus(data.generation_status ?? "ready");
      setRulesetVersion(data.ruleset_version ?? null);
      setPlanVersion(data.version);
      revisionRef.current = data.draft_revision ?? 0;
      lastSavedFingerprintRef.current = draftFingerprint(nextSections, nextTitle, nextReviewDate);
      setSections(nextSections);
    }
    hydratedRef.current = true;
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (!printing) return;
    const previous = document.title;
    document.title = `${memberName ?? "Member"} — Care plan`;
    const frame = requestAnimationFrame(() => {
      window.print();
      document.title = previous;
      setPrinting(false);
    });
    return () => {
      cancelAnimationFrame(frame);
      document.title = previous;
    };
  }, [printing, memberName]);

  const persist = useCallback((announce = false): Promise<boolean> => {
    if (!planId || status !== "draft") return Promise.resolve(false);
    if (savePromiseRef.current) {
      saveQueuedRef.current = true;
      return savePromiseRef.current.then((saved) => {
        if (!saved || !saveQueuedRef.current) return saved;
        saveQueuedRef.current = false;
        return persist(announce);
      });
    }
    const snapshot = latestRef.current;
    const normalized = snapshot.sections.map(({ key: _key, ...section }, index) => ({
      ...section,
      sort_order: index,
    }));
    const fingerprint = draftFingerprint(snapshot.sections, snapshot.title, snapshot.reviewDate);
    if (fingerprint === lastSavedFingerprintRef.current) return Promise.resolve(true);
    setSaveState("saving");
    const promise = savePlanSections(planId, normalized, {
      expectedRevision: revisionRef.current,
      title: snapshot.title.trim() || "Your care plan",
      reviewDate: snapshot.reviewDate,
    }).then((result) => {
      if (result.error || result.revision === null) {
        setSaveState("error");
        setBanner(
          result.code === "DRAFT_CONFLICT"
            ? "This draft changed in another session. Reload before continuing."
            : `Couldn't save the draft: ${result.error}`,
        );
        return false;
      }
      revisionRef.current = result.revision;
      lastSavedFingerprintRef.current = fingerprint;
      setSaveState("saved");
      if (announce) setBanner("Draft saved.");
      return true;
    }).finally(() => {
      savePromiseRef.current = null;
    });
    savePromiseRef.current = promise;
    return promise;
  }, [planId, status]);

  useEffect(() => {
    if (!hydratedRef.current || !planId || status !== "draft") return;
    if (draftFingerprint(sections, title, reviewDate) === lastSavedFingerprintRef.current) return;
    setSaveState("unsaved");
    const timer = window.setTimeout(() => void persist(false), 900);
    return () => window.clearTimeout(timer);
  }, [sections, title, reviewDate, planId, status, persist]);

  const patchSection = (key: string, patch: Partial<DraftSection>) =>
    setSections((current) => current.map((section) =>
      section.key === key ? { ...section, ...patch } : section,
    ));

  const moveSection = (key: string, direction: -1 | 1) =>
    setSections((current) => {
      const index = current.findIndex((section) => section.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const toggleRecommended = (section: EditorSection, actionId: string) => {
    patchSection(section.key, {
      proposed_actions: (section.proposed_actions ?? []).map((candidate) => ({
        ...candidate,
        doctorRecommended: candidate.id === actionId
          ? !candidate.doctorRecommended
          : false,
      })),
    });
  };

  const toggleSelected = (section: EditorSection, proposed: ProposedCarePlanAction) => {
    const selected = section.actions.some((action) => action.id === proposed.id);
    patchSection(section.key, {
      section_state: "active",
      defer_reason: null,
      actions: selected
        ? section.actions.filter((action) => action.id !== proposed.id)
        : [...section.actions, selectedFrom(proposed)],
    });
  };

  const patchSelected = (
    section: EditorSection,
    actionId: string,
    patch: Partial<CarePlanActionData>,
  ) => {
    patchSection(section.key, {
      actions: section.actions.map((action) =>
        action.id === actionId ? { ...action, ...patch } : action,
      ),
    });
  };

  const addAlternative = (section: EditorSection, candidate: ProposedCarePlanAction) => {
    const proposed = [...(section.proposed_actions ?? [])];
    const replaceIndex = proposed.length < 3
      ? -1
      : [...proposed]
        .map((item, index) => ({ item, index }))
        .reverse()
        .find(({ item }) => !section.actions.some((selected) => selected.id === item.id))
        ?.index ?? proposed.length - 1;
    const removedId = replaceIndex >= 0 ? proposed[replaceIndex]?.id : null;
    if (replaceIndex >= 0) proposed.splice(replaceIndex, 1, candidate);
    else proposed.push(candidate);
    patchSection(section.key, {
      proposed_actions: proposed.slice(0, 3),
      actions: removedId
        ? section.actions.filter((selected) => selected.id !== removedId)
        : section.actions,
    });
    setAlternativesFor(null);
  };

  const startGeneration = async () => {
    setGenerating(true);
    setBanner(null);
    const result = await regenerateCarePlan(memberId);
    if (result.error) {
      setBanner(`Couldn't prepare the draft: ${result.error}`);
      setGenerating(false);
      return;
    }
    setGenerationStatus("pending");
    setBanner("The draft is being prepared. Refresh in a moment.");
    window.setTimeout(() => {
      setLoading(true);
      setGenerating(false);
      void loadPlan();
    }, 1800);
  };

  const reconcileEvidence = async () => {
    setBusy(true);
    setBanner(null);
    const result = await reconcileCarePlan(memberId);
    setBusy(false);
    if (result.error || !result.data) {
      setBanner(`Couldn't reconcile the draft: ${result.error}`);
      return;
    }
    revisionRef.current = result.data.draft_revision;
    setEvidenceStale(false);
    setGenerationStatus("ready");
    setBanner("Newer evidence marked as reviewed. The current draft can now be released.");
  };

  const goToNext = () => {
    const section = sections[activeIndex];
    if (!section || !sectionComplete(section)) {
      setBanner("Choose at least one action, or defer this focus area with a reason.");
      return;
    }
    setBanner(null);
    if (activeIndex === sections.length - 1) setMode("review");
    else setActiveIndex((index) => index + 1);
  };

  const attemptRelease = async () => {
    setBusy(true);
    setBanner(null);
    const saved = await persist(false);
    if (!saved || !planId) {
      setBusy(false);
      return;
    }
    const result = await releaseCarePlan(planId);
    setBusy(false);
    setConfirmRelease(false);
    if (result.error) {
      setBanner(result.issues[0]?.message ?? result.error);
      return;
    }
    setStatus("released");
    setBanner("Released to the member.");
  };

  const startNewVersion = async () => {
    if (!planId) return;
    setBusy(true);
    const result = await createPlanVersion(planId);
    setBusy(false);
    if (result.error || !result.data) {
      setBanner(`Couldn't create a new version: ${result.error}`);
      return;
    }
    hydratedRef.current = false;
    setLoading(true);
    setPlanId(null);
    setStatus("draft");
    setMode("prepare");
    await loadPlan();
  };

  const activeSections = useMemo(
    () => sections.filter((section) => section.section_state !== "deferred"),
    [sections],
  );
  const completeCount = sections.filter(sectionComplete).length;
  const firstName = memberName?.trim().split(/\s+/)[0] ?? "this member";

  if (loading) {
    return <main className="p-page doc-page"><p role="status">Loading care plan…</p></main>;
  }

  if (!planId) {
    return (
      <main className="p-page doc-page guided-plan-empty">
        <button type="button" className="doc-back" onClick={onBack}>← Back to case</button>
        <section className="guided-empty-card">
          <span className="guided-empty-icon"><Sparkles aria-hidden="true" /></span>
          <span className="p-eyebrow">CARE PLAN DRAFT</span>
          <h1>A clinically guided draft, ready before the call.</h1>
          <p>
            Verae will group the results that need attention, connect them to the
            member's profile, and prepare three focus areas with approved actions.
          </p>
          <button className="p-btn" type="button" disabled={generating} onClick={() => void startGeneration()}>
            <RefreshCw aria-hidden="true" className={generating ? "is-spinning" : ""} />
            {generating ? "Preparing draft…" : "Prepare care-plan draft"}
          </button>
          {banner && <p className="doc-banner" role="status">{banner}</p>}
        </section>
      </main>
    );
  }

  const readOnly = status === "released";
  if (readOnly) {
    return (
      <main className="p-page doc-page">
        <button type="button" className="doc-back" onClick={onBack}>← Back to case</button>
        <header className="doc-head">
          <div>
            <span className="p-eyebrow">RELEASED · VERSION {planVersion}</span>
            <h1 className="p-h1">Care plan for <em>{firstName}</em></h1>
          </div>
          <div className="doc-editor-actions">
            <button className="p-btn-ghost" type="button" onClick={() => setPrinting(true)}>
              <Download aria-hidden="true" /> Download
            </button>
            <button className="p-btn" type="button" disabled={busy} onClick={() => void startNewVersion()}>
              Create new version
            </button>
          </div>
        </header>
        {banner && <p className="doc-banner" role="status">{banner}</p>}
        <CarePlanPreview title={title} sections={activeSections} />
        {printing && (
          <div className="doc-print-layer">
            <CarePlanPreview title={title} sections={activeSections} />
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`p-page doc-page guided-plan guided-plan--${mode}`}>
      <header className="guided-plan-topbar">
        <button type="button" className="doc-back" onClick={mode === "prepare" ? onBack : () => setMode("prepare")}>
          <ArrowLeft aria-hidden="true" /> {mode === "prepare" ? "Back to case" : "Preparation"}
        </button>
        <div className="guided-mode-switch" aria-label="Care-plan mode">
          <button type="button" aria-current={mode === "prepare"} onClick={() => setMode("prepare")}>
            <Edit3 aria-hidden="true" /> Prepare
          </button>
          <button
            type="button"
            aria-current={mode === "consult"}
            disabled={sections.length === 0}
            onClick={() => { setMode("consult"); setActiveIndex(0); }}
          >
            <Presentation aria-hidden="true" /> Consult
          </button>
          <button type="button" aria-current={mode === "review"} disabled={sections.length === 0} onClick={() => setMode("review")}>
            <CheckCircle2 aria-hidden="true" /> Review
          </button>
        </div>
        <span className={`guided-save-state is-${saveState}`} role="status">
          {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved" : saveState === "error" ? "Save failed" : "Saved"}
        </span>
      </header>

      {banner && <p className="doc-banner guided-banner" role="status">{banner}</p>}
      {evidenceStale && (
        <section className="guided-stale" role="alert">
          <div>
            <strong>Newer results are available.</strong>
            <span>Regenerate this draft before it can be released.</span>
          </div>
          <button type="button" className="p-btn-ghost" onClick={() => void startGeneration()}>
            <RefreshCw aria-hidden="true" /> Regenerate
          </button>
          <button type="button" className="p-btn-ghost" disabled={busy} onClick={() => void reconcileEvidence()}>
            <CheckCircle2 aria-hidden="true" /> Keep draft & mark reviewed
          </button>
        </section>
      )}

      {mode === "prepare" && (
        <PreparationMode
          firstName={firstName}
          title={title}
          reviewDate={reviewDate}
          sections={sections}
          rulesetVersion={rulesetVersion}
          generationStatus={generationStatus}
          templatesOpen={templatesOpen}
          alternativesFor={alternativesFor}
          onTitle={setTitle}
          onReviewDate={setReviewDate}
          onPatch={patchSection}
          onMove={moveSection}
          onRemove={(key) => setSections((current) => current.filter((section) => section.key !== key))}
          onRecommended={toggleRecommended}
          onToggleTemplates={() => setTemplatesOpen((open) => !open)}
          onAddTemplate={(template) => {
            setSections((current) => [...current, templateSection(template, current.length)]);
            setTemplatesOpen(false);
          }}
          onToggleAlternatives={(key) => setAlternativesFor((current) => current === key ? null : key)}
          onAddAlternative={addAlternative}
          onStartConsult={() => { setMode("consult"); setActiveIndex(0); }}
        />
      )}

      {mode === "consult" && sections[activeIndex] && (
        <ConsultMode
          memberName={firstName}
          sections={sections}
          activeIndex={activeIndex}
          alternativesFor={alternativesFor}
          onSelectIndex={setActiveIndex}
          onPatch={patchSection}
          onToggleSelected={toggleSelected}
          onPatchSelected={patchSelected}
          onToggleAlternatives={(key) => setAlternativesFor((current) => current === key ? null : key)}
          onAddAlternative={addAlternative}
          onPrevious={() => setActiveIndex((index) => Math.max(0, index - 1))}
          onNext={goToNext}
        />
      )}

      {mode === "review" && (
        <ReviewMode
          title={title}
          reviewDate={reviewDate}
          sections={sections}
          completeCount={completeCount}
          busy={busy}
          onEdit={(index) => { setActiveIndex(index); setMode("consult"); }}
          onRelease={() => setConfirmRelease(true)}
        />
      )}

      {confirmRelease && (
        <div className="guided-modal-layer" role="presentation">
          <section className="guided-modal" role="dialog" aria-modal="true" aria-labelledby="release-title">
            <button className="guided-modal-close" type="button" aria-label="Close" onClick={() => setConfirmRelease(false)}>
              <X aria-hidden="true" />
            </button>
            <span className="guided-empty-icon"><HeartHandshake aria-hidden="true" /></span>
            <h2 id="release-title">Share this agreed plan?</h2>
            <p>
              It will become visible to {firstName} immediately. Released clinical
              plans are immutable; later changes create a new version.
            </p>
            <div className="guided-modal-actions">
              <button className="p-btn-ghost" type="button" onClick={() => setConfirmRelease(false)}>Keep reviewing</button>
              <button className="p-btn" type="button" disabled={busy} onClick={() => void attemptRelease()}>
                {busy ? "Releasing…" : "Release to member"}
              </button>
            </div>
          </section>
        </div>
      )}

      {printing && (
        <div className="doc-print-layer">
          <CarePlanPreview title={title} sections={activeSections} />
        </div>
      )}
    </main>
  );
}

function PreparationMode({
  firstName,
  title,
  reviewDate,
  sections,
  rulesetVersion,
  generationStatus,
  templatesOpen,
  alternativesFor,
  onTitle,
  onReviewDate,
  onPatch,
  onMove,
  onRemove,
  onRecommended,
  onToggleTemplates,
  onAddTemplate,
  onToggleAlternatives,
  onAddAlternative,
  onStartConsult,
}: {
  firstName: string;
  title: string;
  reviewDate: string;
  sections: EditorSection[];
  rulesetVersion: string | null;
  generationStatus: string;
  templatesOpen: boolean;
  alternativesFor: string | null;
  onTitle: (value: string) => void;
  onReviewDate: (value: string) => void;
  onPatch: (key: string, patch: Partial<DraftSection>) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  onRecommended: (section: EditorSection, actionId: string) => void;
  onToggleTemplates: () => void;
  onAddTemplate: (template: (typeof FOCUS_AREA_TEMPLATES)[number]) => void;
  onToggleAlternatives: (key: string) => void;
  onAddAlternative: (section: EditorSection, action: ProposedCarePlanAction) => void;
  onStartConsult: () => void;
}) {
  return (
    <>
      <section className="guided-prep-hero">
        <div>
          <span className="p-eyebrow">PRIVATE PREPARATION</span>
          <h1>A strong starting point for <em>{firstName}</em>.</h1>
          <p>
            Review the clinical story and suggestions now. Nothing is selected
            until you and {firstName} decide together on the call.
          </p>
        </div>
        <div className="guided-plan-meta">
          <label>
            <span>Plan title</span>
            <input value={title} onChange={(event) => onTitle(event.target.value)} />
          </label>
          <label>
            <span>Review date</span>
            <input type="date" value={reviewDate} onChange={(event) => onReviewDate(event.target.value)} />
          </label>
          <span className="guided-ruleset">
            <Sparkles aria-hidden="true" />
            {rulesetVersion ? `Clinical rules ${rulesetVersion}` : "Doctor-authored plan"} · {statusLabel(generationStatus)}
          </span>
        </div>
      </section>

      <div className="guided-prep-list">
        {sections.map((section, index) => (
          <section className="guided-focus-card" key={section.key}>
            <div className="guided-focus-visual">
              <img src={resolveSectionImage(section.image_key, index)} alt="" />
              <span>{index + 1}</span>
            </div>
            <div className="guided-focus-main">
              <div className="guided-focus-heading">
                <div>
                  <span className="guided-basis">{basisLabel(section.basis_type)}</span>
                  <input
                    className="guided-title-edit"
                    aria-label={`Focus area ${index + 1} title`}
                    value={section.title}
                    onChange={(event) => onPatch(section.key, { title: event.target.value })}
                  />
                </div>
                <div className="guided-focus-tools">
                  <button type="button" aria-label="Move focus area up" disabled={index === 0} onClick={() => onMove(section.key, -1)}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Move focus area down" disabled={index === sections.length - 1} onClick={() => onMove(section.key, 1)}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Remove focus area" onClick={() => onRemove(section.key)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>

              <textarea
                className="guided-summary-edit"
                aria-label={`Focus area ${index + 1} explanation`}
                value={section.summary}
                onChange={(event) => onPatch(section.key, { summary: event.target.value })}
              />

              <EvidenceStrip section={section} />

              <div className="guided-proposals">
                {(section.proposed_actions ?? []).slice(0, 3).map((candidate) => (
                  <article className="guided-proposal" key={candidate.id}>
                    <div>
                      <span className={`guided-category is-${candidate.lifestyleCategory.toLowerCase()}`}>
                        {candidate.lifestyleCategory}
                      </span>
                      <strong>{candidate.title}</strong>
                      <p>{candidate.instruction}</p>
                    </div>
                    <button
                      type="button"
                      className={candidate.doctorRecommended ? "is-recommended" : ""}
                      aria-pressed={candidate.doctorRecommended}
                      onClick={() => onRecommended(section, candidate.id)}
                    >
                      <Sparkles aria-hidden="true" />
                      {candidate.doctorRecommended ? "Recommended" : "Recommend"}
                    </button>
                  </article>
                ))}
              </div>

              <div className="guided-card-actions">
                <button type="button" className="guided-text-button" onClick={() => onToggleAlternatives(section.key)}>
                  <BookOpen aria-hidden="true" /> Browse approved alternatives
                </button>
              </div>
              {alternativesFor === section.key && (
                <AlternativeLibrary section={section} onAdd={(action) => onAddAlternative(section, action)} />
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="guided-prep-footer">
        <div>
          <button type="button" className="p-btn-ghost" aria-expanded={templatesOpen} onClick={onToggleTemplates}>
            <Plus aria-hidden="true" /> Add focus area
          </button>
          {templatesOpen && (
            <div className="guided-template-grid">
              {FOCUS_AREA_TEMPLATES.map((template) => (
                <button type="button" key={template.id} onClick={() => onAddTemplate(template)}>
                  <strong>{template.title}</strong>
                  <span>{template.summary}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="p-btn guided-start-consult" type="button" disabled={sections.length === 0} onClick={onStartConsult}>
          <Presentation aria-hidden="true" /> Start consultation mode
        </button>
      </section>
    </>
  );
}

function EvidenceStrip({ section }: { section: EditorSection }) {
  const evidence = section.evidence_snapshot ?? [];
  if (evidence.length > 0) {
    return (
      <div className="guided-evidence" aria-label="Evidence behind this focus area">
        {evidence.map((item) => (
          <span className={`guided-evidence-chip is-${item.status}`} key={`${item.reportId}:${item.biomarkerCode}`}>
            <span>{item.displayName}</span>
            <strong>
              {item.value ?? "—"}{item.unit ? ` ${item.unit}` : ""}
            </strong>
            <em>{item.status === "needs_attention" ? "Needs attention" : "At risk"}</em>
          </span>
        ))}
      </div>
    );
  }
  const basis = section.profile_basis ?? [];
  return basis.length > 0 ? (
    <div className="guided-profile-basis">
      <span>Based on what {basis.length === 1 ? "the member shared" : "the member shared"}:</span>
      {basis.slice(0, 3).map((signal) => <em key={signal}>{signal}</em>)}
    </div>
  ) : (
    <div className="guided-profile-basis"><span>Added by the doctor.</span></div>
  );
}

function ConsultMode({
  memberName,
  sections,
  activeIndex,
  alternativesFor,
  onSelectIndex,
  onPatch,
  onToggleSelected,
  onPatchSelected,
  onToggleAlternatives,
  onAddAlternative,
  onPrevious,
  onNext,
}: {
  memberName: string;
  sections: EditorSection[];
  activeIndex: number;
  alternativesFor: string | null;
  onSelectIndex: (index: number) => void;
  onPatch: (key: string, patch: Partial<DraftSection>) => void;
  onToggleSelected: (section: EditorSection, action: ProposedCarePlanAction) => void;
  onPatchSelected: (section: EditorSection, actionId: string, patch: Partial<CarePlanActionData>) => void;
  onToggleAlternatives: (key: string) => void;
  onAddAlternative: (section: EditorSection, action: ProposedCarePlanAction) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const section = sections[activeIndex]!;
  return (
    <div className="guided-consult-shell">
      <aside className="guided-progress-rail" aria-label="Focus area progress">
        <span className="p-eyebrow">TOGETHER WITH {memberName.toUpperCase()}</span>
        <h2>Build the plan, one priority at a time.</h2>
        <ol>
          {sections.map((item, index) => (
            <li key={item.key}>
              <button type="button" aria-current={activeIndex === index} onClick={() => onSelectIndex(index)}>
                <span>{sectionComplete(item) ? <Check aria-hidden="true" /> : index + 1}</span>
                <span>
                  <strong>{item.title}</strong>
                  <em>{sectionComplete(item) ? item.section_state === "deferred" ? "Deferred" : `${item.actions.length} agreed` : "To discuss"}</em>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <section className="guided-consult-stage">
        <div className="guided-consult-intro">
          <span className="guided-step-label">FOCUS AREA {activeIndex + 1} OF {sections.length}</span>
          <h1>{section.title}</h1>
          <textarea
            aria-label="Focus area explanation"
            value={section.summary}
            onChange={(event) => onPatch(section.key, { summary: event.target.value })}
          />
          <EvidenceStrip section={section} />
        </div>

        <div className="guided-consult-actions">
          <div className="guided-consult-actions-head">
            <div>
              <h2>What feels realistic?</h2>
              <p>Choose one or more together. You can make the wording fit real life.</p>
            </div>
            <button type="button" className="guided-text-button" onClick={() => onToggleAlternatives(section.key)}>
              <BookOpen aria-hidden="true" /> Alternatives
            </button>
          </div>

          <div className="guided-action-grid">
            {(section.proposed_actions ?? []).map((candidate) => {
              const selected = section.actions.find((action) => action.id === candidate.id);
              return (
                <article className={`guided-action-card ${selected ? "is-selected" : ""}`} key={candidate.id}>
                  <button
                    type="button"
                    className="guided-action-select"
                    aria-pressed={Boolean(selected)}
                    onClick={() => onToggleSelected(section, candidate)}
                  >
                    <span className="guided-checkmark">{selected && <Check aria-hidden="true" />}</span>
                    <span className={`guided-category is-${candidate.lifestyleCategory.toLowerCase()}`}>
                      {candidate.lifestyleCategory}
                    </span>
                    {candidate.doctorRecommended && <span className="guided-doctor-pick"><Sparkles aria-hidden="true" /> Doctor recommended</span>}
                    <strong>{candidate.title}</strong>
                    <span>{candidate.instruction}</span>
                  </button>
                  <details>
                    <summary>Why this works <ChevronDown aria-hidden="true" /></summary>
                    <p>{candidate.rationale}</p>
                    <p>{candidate.moreGuidance}</p>
                  </details>
                  {selected && (
                    <div className="guided-action-edit">
                      <label>
                        <span>Make it yours</span>
                        <textarea
                          value={selected.instruction}
                          onChange={(event) => onPatchSelected(section, selected.id, { instruction: event.target.value })}
                        />
                      </label>
                      {selected.lifestyleCategory === "Supplements" && (
                        <label className="guided-confirm-supplement">
                          <input
                            type="checkbox"
                            checked={Boolean(selected.clinicianConfirmed)}
                            onChange={(event) => onPatchSelected(section, selected.id, { clinicianConfirmed: event.target.checked })}
                          />
                          <span>
                            <strong>Clinician safety check</strong>
                            I confirmed the dose, current medications/supplements and follow-up.
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {alternativesFor === section.key && (
            <AlternativeLibrary section={section} onAdd={(action) => onAddAlternative(section, action)} />
          )}
        </div>

        <div className="guided-defer">
          <button
            type="button"
            aria-pressed={section.section_state === "deferred"}
            onClick={() => onPatch(section.key, {
              section_state: section.section_state === "deferred" ? "active" : "deferred",
              actions: section.section_state === "deferred" ? section.actions : [],
            })}
          >
            {section.section_state === "deferred" ? "Bring this focus area back" : "Not for this plan — defer it"}
          </button>
          {section.section_state === "deferred" && (
            <label>
              <span>Private reason for deferring</span>
              <input
                autoFocus
                value={section.defer_reason ?? ""}
                placeholder="e.g. Patient wants to address this after the next review"
                onChange={(event) => onPatch(section.key, { defer_reason: event.target.value })}
              />
            </label>
          )}
        </div>

        <footer className="guided-consult-nav">
          <button className="p-btn-ghost" type="button" disabled={activeIndex === 0} onClick={onPrevious}>
            <ArrowLeft aria-hidden="true" /> Previous
          </button>
          <span role="status" aria-live="polite">
            {sectionComplete(section) ? <><CheckCircle2 aria-hidden="true" /> Ready</> : "Choose an action or defer"}
          </span>
          <button className="p-btn" type="button" onClick={onNext}>
            {activeIndex === sections.length - 1 ? "Review the plan" : "Next focus area"} <ArrowRight aria-hidden="true" />
          </button>
        </footer>
      </section>
    </div>
  );
}

function AlternativeLibrary({
  section,
  onAdd,
}: {
  section: EditorSection;
  onAdd: (action: ProposedCarePlanAction) => void;
}) {
  const existingTitles = new Set((section.proposed_actions ?? []).map((candidate) => candidate.title));
  const alternatives = FOCUS_AREA_TEMPLATES
    .flatMap((template) => template.actions)
    .filter((candidate) => !existingTitles.has(candidate.title))
    .slice(0, 8);
  return (
    <div className="guided-alternatives">
      <div>
        <strong>Approved alternatives</strong>
        <span>Choose one to add it to this conversation.</span>
      </div>
      <div className="guided-alternative-grid">
        {alternatives.map((candidate, index) => (
          <button
            type="button"
            key={`${candidate.title}-${index}`}
            onClick={() => onAdd({
              ...candidate,
              id: crypto.randomUUID(),
              templateId: `library-${candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              doctorRecommended: false,
            })}
          >
            <span className={`guided-category is-${candidate.lifestyleCategory.toLowerCase()}`}>{candidate.lifestyleCategory}</span>
            <strong>{candidate.title}</strong>
            <span>{candidate.instruction}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewMode({
  title,
  reviewDate,
  sections,
  completeCount,
  busy,
  onEdit,
  onRelease,
}: {
  title: string;
  reviewDate: string;
  sections: EditorSection[];
  completeCount: number;
  busy: boolean;
  onEdit: (index: number) => void;
  onRelease: () => void;
}) {
  const ready = sections.length > 0 && completeCount === sections.length;
  const agreed = sections.filter((section) => section.section_state !== "deferred");
  return (
    <section className="guided-review">
      <header className="guided-review-head">
        <span className="p-eyebrow">AGREED CARE PLAN</span>
        <h1>{title}</h1>
        <p>
          Review the words you chose together. The member will see this same
          focus-area story when the plan is released.
        </p>
        <div className="guided-review-meta">
          <span><CheckCircle2 aria-hidden="true" /> {completeCount} of {sections.length} focus areas resolved</span>
          <span>Review on {new Date(`${reviewDate}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </header>

      <div className="guided-review-list">
        {agreed.map((section) => {
          const originalIndex = sections.findIndex((item) => item.key === section.key);
          return (
            <article className="guided-review-area" key={section.key}>
              <div className="guided-review-area-head">
                <div>
                  <span className="guided-basis">{basisLabel(section.basis_type)}</span>
                  <h2>{section.title}</h2>
                  <p>{section.summary}</p>
                </div>
                <button type="button" onClick={() => onEdit(originalIndex)}><Edit3 aria-hidden="true" /> Edit</button>
              </div>
              <EvidenceStrip section={section} />
              <ul>
                {section.actions.map((action) => (
                  <li key={action.id}>
                    <span className={`guided-category is-${action.lifestyleCategory.toLowerCase()}`}>{action.lifestyleCategory}</span>
                    <span><strong>{action.title}</strong><em>{action.instruction}</em></span>
                    {action.lifestyleCategory === "Supplements" && action.clinicianConfirmed && <CheckCircle2 aria-label="Clinician confirmed" />}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {sections.some((section) => section.section_state === "deferred") && (
          <div className="guided-deferred-summary">
            <strong>Deferred for now</strong>
            {sections.filter((section) => section.section_state === "deferred").map((section) => (
              <span key={section.key}>{section.title}</span>
            ))}
          </div>
        )}
      </div>

      <footer className="guided-release-bar">
        <div>
          <strong>{ready ? "Ready to share" : "A few decisions remain"}</strong>
          <span>{ready ? "The plan is complete and all supplement checks are confirmed." : "Resolve every focus area before releasing."}</span>
        </div>
        <button className="p-btn" type="button" disabled={!ready || busy} onClick={onRelease}>
          <HeartHandshake aria-hidden="true" /> Release to member
        </button>
      </footer>
    </section>
  );
}

export default CarePlanEditor;
