import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, PenLine, Plus, Trash2 } from "lucide-react";
import {
  createDraftPlan,
  fetchEditablePlan,
  releaseCarePlan,
  savePlanSections,
  updatePlanMeta,
} from "../lib/api/doctor";
import type { DraftSection } from "../lib/api/doctor";
import type { CarePlanActionData } from "../lib/api/carePlan";
import { instantiateAction, instantiateTemplate } from "./carePlanLibrary";
import { ActionLibrary, TemplatePicker } from "./LibraryPicker";
import CarePlanPreview from "./CarePlanPreview";
import MarkerPicker from "./MarkerPicker";

const CATEGORIES: CarePlanActionData["lifestyleCategory"][] = [
  "Nutrition",
  "Exercise",
  "Supplements",
  "Sleep",
];

/** DraftSection plus a client-only key: new sections have no DB id yet, and
    array indexes break React state when sections are reordered or removed.
    savePlanSections only reads the DraftSection fields, so the key never
    reaches the database. */
type EditorSection = DraftSection & { key: string };

const withKey = (section: DraftSection): EditorSection => ({
  ...section,
  key: crypto.randomUUID(),
});

function emptyAction(): CarePlanActionData {
  return {
    id: crypto.randomUUID(),
    title: "",
    lifestyleCategory: "Nutrition",
    instruction: "",
    rationale: "",
    moreGuidance: "",
  };
}

function emptySection(order: number): DraftSection {
  return {
    sort_order: order,
    title: "",
    summary: "",
    markers: [],
    doctor_note: "",
    actions: [],
  };
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
  const [status, setStatus] = useState<string>("draft");
  const [title, setTitle] = useState("Your plan for the next 12 weeks");
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Section key whose action library is open, if any.
  const [actionLibraryFor, setActionLibraryFor] = useState<string | null>(null);

  useEffect(() => {
    fetchEditablePlan(memberId).then(({ data }) => {
      if (data) {
        setPlanId(data.id);
        setStatus(data.status);
        setTitle(data.title ?? "Your plan for the next 12 weeks");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = ((data as any).care_plan_sections ?? []) as DraftSection[];
        setSections(
          [...rows]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((s) => withKey({ ...s, actions: s.actions ?? [], markers: s.markers ?? [] })),
        );
      }
      setLoading(false);
    });
  }, [memberId]);

  const patchSection = (key: string, patch: Partial<DraftSection>) =>
    setSections((current) => current.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const patchAction = (key: string, actionId: string, patch: Partial<CarePlanActionData>) =>
    setSections((current) =>
      current.map((s) =>
        s.key === key
          ? { ...s, actions: s.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)) }
          : s,
      ),
    );

  const removeSection = (key: string) =>
    setSections((current) => current.filter((s) => s.key !== key));

  const moveSection = (key: string, delta: -1 | 1) =>
    setSections((current) => {
      const index = current.findIndex((s) => s.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addSections = (added: DraftSection[]) => {
    setSections((current) => [...current, ...added.map(withKey)]);
    setTemplatesOpen(false);
  };

  const save = async (): Promise<string | null> => {
    setBusy(true);
    setBanner(null);
    let id = planId;
    if (!id) {
      const created = await createDraftPlan(memberId, title);
      if (created.error || !created.data) {
        setBusy(false);
        setBanner(`Save failed: ${created.error}`);
        return null;
      }
      id = created.data.id;
      setPlanId(id);
    } else {
      await updatePlanMeta(id, { title });
    }
    if (!id) {
      setBusy(false);
      return null;
    }
    const normalized = sections.map((s, i) => ({ ...s, sort_order: i }));
    const { error } = await savePlanSections(id, normalized);
    setBusy(false);
    if (error) {
      setBanner(`Save failed: ${error}`);
      return null;
    }
    setBanner("Saved.");
    return id;
  };

  const release = async () => {
    const id = await save();
    if (!id) return;
    setBusy(true);
    const { error } = await releaseCarePlan(id);
    setBusy(false);
    if (error) setBanner(`Release failed: ${error}`);
    else {
      setStatus("released");
      setBanner("Released to member.");
    }
  };

  if (loading) return <main className="doc-page"><p className="doc-muted">Loading plan…</p></main>;

  return (
    <main className="doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Back to case
      </button>

      <header className="doc-head">
        <div>
          <span className="doc-eyebrow">Care plan · {status}</span>
          <h1>Plan for {memberName ?? "member"}</h1>
        </div>
        <div className="doc-editor-actions">
          <button
            type="button"
            className="doc-secondary"
            aria-pressed={showPreview}
            onClick={() => setShowPreview((open) => !open)}
          >
            {showPreview ? (
              <>
                <PenLine strokeWidth={1.8} aria-hidden="true" /> Back to editing
              </>
            ) : (
              <>
                <Eye strokeWidth={1.8} aria-hidden="true" /> Preview member view
              </>
            )}
          </button>
          <button type="button" className="doc-secondary" disabled={busy} onClick={() => void save()}>
            Save draft
          </button>
          <button type="button" className="doc-primary" disabled={busy} onClick={() => void release()}>
            {status === "released" ? "Re-release" : "Release to member"}
          </button>
        </div>
      </header>

      {banner && <p className="doc-banner">{banner}</p>}

      {showPreview ? (
        <CarePlanPreview title={title} sections={sections} />
      ) : (
        <>
          <label className="doc-field">
            <span>Plan title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          {sections.length === 0 && (
            <p className="doc-muted">
              Start from a focus-area template, or add a blank one and write it from scratch.
            </p>
          )}

          {sections.map((section, si) => (
            <section className="doc-card doc-section-edit" key={section.key}>
              <div className="doc-section-head">
                <span className="doc-section-eyebrow">Focus area {si + 1}</span>
                <div className="doc-section-tools">
                  <button
                    type="button"
                    className="doc-icon-btn"
                    aria-label={`Move focus area ${si + 1} up`}
                    disabled={si === 0}
                    onClick={() => moveSection(section.key, -1)}
                  >
                    <ArrowUp strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="doc-icon-btn"
                    aria-label={`Move focus area ${si + 1} down`}
                    disabled={si === sections.length - 1}
                    onClick={() => moveSection(section.key, 1)}
                  >
                    <ArrowDown strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="doc-icon-btn doc-icon-btn--danger"
                    aria-label={`Remove focus area ${si + 1}`}
                    onClick={() => removeSection(section.key)}
                  >
                    <Trash2 strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <label className="doc-field">
                <span>Title</span>
                <input
                  value={section.title}
                  placeholder="e.g. Glucose stability"
                  onChange={(e) => patchSection(section.key, { title: e.target.value })}
                />
              </label>
              <label className="doc-field">
                <span>Summary — why this area made the plan</span>
                <textarea
                  value={section.summary}
                  onChange={(e) => patchSection(section.key, { summary: e.target.value })}
                />
              </label>
              <div className="doc-field">
                <span>Markers this area works on</span>
                <MarkerPicker
                  value={section.markers}
                  onChange={(markers) => patchSection(section.key, { markers })}
                />
              </div>
              <label className="doc-field">
                <span>Doctor note — in your voice, to the member</span>
                <textarea
                  value={section.doctor_note}
                  onChange={(e) => patchSection(section.key, { doctor_note: e.target.value })}
                />
              </label>

              <h3 className="doc-actions-title">Actions</h3>
              {section.actions.map((action, ai) => (
                <div className="doc-action-edit" key={action.id}>
                  <div className="doc-action-head">
                    <span className="doc-action-eyebrow">Action {ai + 1}</span>
                    <button
                      type="button"
                      className="doc-icon-btn doc-icon-btn--danger"
                      aria-label={`Remove action ${ai + 1}`}
                      onClick={() =>
                        patchSection(section.key, {
                          actions: section.actions.filter((a) => a.id !== action.id),
                        })
                      }
                    >
                      <Trash2 strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="doc-action-row">
                    <label className="doc-field">
                      <span>Title</span>
                      <input
                        value={action.title}
                        onChange={(e) => patchAction(section.key, action.id, { title: e.target.value })}
                      />
                    </label>
                    <label className="doc-field">
                      <span>Category</span>
                      <select
                        value={action.lifestyleCategory}
                        onChange={(e) =>
                          patchAction(section.key, action.id, {
                            lifestyleCategory: e.target.value as CarePlanActionData["lifestyleCategory"],
                          })
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="doc-field">
                    <span>Instruction — the action itself</span>
                    <input
                      value={action.instruction}
                      onChange={(e) => patchAction(section.key, action.id, { instruction: e.target.value })}
                    />
                  </label>
                  <label className="doc-field">
                    <span>Why this works</span>
                    <input
                      value={action.rationale}
                      onChange={(e) => patchAction(section.key, action.id, { rationale: e.target.value })}
                    />
                  </label>
                  <label className="doc-field">
                    <span>More guidance</span>
                    <textarea
                      value={action.moreGuidance}
                      onChange={(e) => patchAction(section.key, action.id, { moreGuidance: e.target.value })}
                    />
                  </label>
                </div>
              ))}

              <div className="doc-add-row">
                <button
                  type="button"
                  className="doc-secondary"
                  aria-expanded={actionLibraryFor === section.key}
                  onClick={() =>
                    setActionLibraryFor((open) => (open === section.key ? null : section.key))
                  }
                >
                  Add from library
                </button>
                <button
                  type="button"
                  className="doc-secondary"
                  onClick={() =>
                    patchSection(section.key, { actions: [...section.actions, emptyAction()] })
                  }
                >
                  <Plus strokeWidth={1.8} aria-hidden="true" /> Blank action
                </button>
              </div>
              {actionLibraryFor === section.key && (
                <ActionLibrary
                  onPick={(libraryAction) =>
                    patchSection(section.key, {
                      actions: [...section.actions, instantiateAction(libraryAction)],
                    })
                  }
                />
              )}
            </section>
          ))}

          <div className="doc-add-row">
            <button
              type="button"
              className="doc-secondary"
              aria-expanded={templatesOpen}
              onClick={() => setTemplatesOpen((open) => !open)}
            >
              Add from library
            </button>
            <button
              type="button"
              className="doc-secondary"
              onClick={() => addSections([emptySection(sections.length)])}
            >
              <Plus strokeWidth={1.8} aria-hidden="true" /> Blank focus area
            </button>
          </div>
          {templatesOpen && (
            <TemplatePicker
              onPick={(template) => addSections([instantiateTemplate(template, sections.length)])}
            />
          )}
        </>
      )}
    </main>
  );
}

export default CarePlanEditor;
