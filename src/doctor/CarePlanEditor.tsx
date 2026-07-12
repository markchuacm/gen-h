import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Download,
  Eye,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createDraftPlan,
  fetchEditablePlan,
  releaseCarePlan,
  savePlanSections,
  updatePlanMeta,
} from "../lib/api/doctor";
import type { DraftSection } from "../lib/api/doctor";
import type { CarePlanActionData } from "../lib/api/carePlan";
import { SECTION_IMAGE_OPTIONS } from "../member-v2/screens/care-plan/carePlanAssets";
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
    image_key: null,
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
  // Deliberately blank until the doctor names it — the placeholder suggests,
  // nothing is pre-written on their behalf.
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Section key whose action library is open, if any.
  const [actionLibraryFor, setActionLibraryFor] = useState<string | null>(null);
  // Focus areas collapse once written; only blank new ones open by default.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  // Download = the browser's print-to-PDF over a print-only render of the
  // member view. The title becomes the suggested filename.
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

  useEffect(() => {
    fetchEditablePlan(memberId).then(({ data }) => {
      if (data) {
        setPlanId(data.id);
        setStatus(data.status);
        setTitle(data.title ?? "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = ((data as any).care_plan_sections ?? []) as DraftSection[];
        setSections(
          [...rows]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((s) =>
              withKey({
                ...s,
                actions: s.actions ?? [],
                markers: s.markers ?? [],
                image_key: s.image_key ?? null,
              }),
            ),
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

  const toggleSection = (key: string) =>
    setOpenSections((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const addSections = (added: DraftSection[], startOpen = false) => {
    const keyed = added.map(withKey);
    setSections((current) => [...current, ...keyed]);
    if (startOpen) {
      setOpenSections((current) => new Set([...current, ...keyed.map((s) => s.key)]));
    }
    setTemplatesOpen(false);
  };

  const save = async (): Promise<string | null> => {
    setBusy(true);
    setBanner(null);
    const planTitle = title.trim() || "Your care plan";
    let id = planId;
    if (!id) {
      const created = await createDraftPlan(memberId, planTitle);
      if (created.error || !created.data) {
        setBusy(false);
        setBanner(`Save failed: ${created.error}`);
        return null;
      }
      id = created.data.id;
      setPlanId(id);
    } else {
      await updatePlanMeta(id, { title: planTitle });
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

  if (loading) return <main className="p-page doc-page"><p className="doc-muted">Loading plan…</p></main>;

  const firstName = memberName?.split(" ")[0];

  return (
    <main className="p-page doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Back to case
      </button>

      <header className="doc-head">
        <div className="doc-h1-row">
          <h1 className="p-h1">
            Care plan for <em>{firstName ?? "this member"}</em>
          </h1>
          <span className="p-chip p-chip--neutral">{status}</span>
        </div>
        <div className="doc-editor-actions">
          <button
            type="button"
            className="p-btn-ghost"
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
          <button type="button" className="p-btn-ghost" disabled={busy} onClick={() => void save()}>
            Save draft
          </button>
          <button
            type="button"
            className="p-btn-ghost"
            aria-label="Download the plan as PDF"
            onClick={() => setPrinting(true)}
          >
            <Download strokeWidth={1.8} aria-hidden="true" /> Download
          </button>
          <button type="button" className="p-btn" disabled={busy} onClick={() => void release()}>
            {status === "released" ? "Re-release" : "Release to member"}
          </button>
        </div>
      </header>

      {banner && <p className="doc-banner">{banner}</p>}

      {showPreview ? (
        <CarePlanPreview title={title.trim() || "Your care plan"} sections={sections} />
      ) : (
        <>
          <label className="doc-field">
            <span>Plan title</span>
            <input
              value={title}
              placeholder="e.g. Your plan for the next 12 weeks"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          {sections.map((section, si) => {
            const activeImageKey =
              section.image_key ?? SECTION_IMAGE_OPTIONS[si % SECTION_IMAGE_OPTIONS.length].key;
            const open = openSections.has(section.key);
            return (
              <section className="doc-card doc-section-edit" key={section.key}>
                <div className="doc-section-head">
                  <button
                    type="button"
                    className="doc-section-toggle"
                    aria-expanded={open}
                    onClick={() => toggleSection(section.key)}
                  >
                    <ChevronDown
                      className={`doc-section-chevron ${open ? "is-open" : ""}`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="doc-card-title">
                      {section.title || `Focus area ${si + 1}`}
                    </span>
                    {!open && (
                      <span className="doc-section-meta">
                        {section.actions.length} action{section.actions.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </button>
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

                {open && (
                <>
                <label className="doc-field">
                  <span>Title</span>
                  <input
                    value={section.title}
                    placeholder="e.g. Glucose stability"
                    onChange={(e) => patchSection(section.key, { title: e.target.value })}
                  />
                </label>
                <label className="doc-field">
                  <span>Summary</span>
                  <textarea
                    value={section.summary}
                    placeholder="Why this area made the plan — one or two sentences the member sees."
                    onChange={(e) => patchSection(section.key, { summary: e.target.value })}
                  />
                </label>
                <div className="doc-field">
                  <span>Markers</span>
                  <MarkerPicker
                    value={section.markers}
                    onChange={(markers) => patchSection(section.key, { markers })}
                  />
                </div>
                <label className="doc-field">
                  <span>Doctor note</span>
                  <textarea
                    value={section.doctor_note}
                    placeholder="In your voice, to the member — e.g. Your lipid picture responds well to consistent, unglamorous changes…"
                    onChange={(e) => patchSection(section.key, { doctor_note: e.target.value })}
                  />
                </label>
                <div className="doc-field">
                  <span>Image</span>
                  <div className="doc-image-picker" role="radiogroup" aria-label="Focus-area image">
                    {SECTION_IMAGE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={activeImageKey === option.key}
                        title={option.label}
                        className={`doc-image-option ${activeImageKey === option.key ? "is-active" : ""}`}
                        onClick={() => patchSection(section.key, { image_key: option.key })}
                      >
                        <img src={option.src} alt={option.label} />
                      </button>
                    ))}
                  </div>
                </div>

                <span className="doc-group-label doc-actions-title">Actions</span>
                {section.actions.map((action, ai) => (
                  <div className="doc-action-edit" key={action.id}>
                    <div className="doc-action-head">
                      <span className="doc-group-label">Action {ai + 1}</span>
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
                      <span>Instruction</span>
                      <input
                        value={action.instruction}
                        placeholder="The action itself — short and specific."
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

                {/* Deliberately quieter than the focus-area controls below the
                    plan — these belong to this area's actions only. */}
                <div className="doc-add-actions">
                  <button
                    type="button"
                    className="doc-quiet-add"
                    onClick={() =>
                      patchSection(section.key, { actions: [...section.actions, emptyAction()] })
                    }
                  >
                    <Plus strokeWidth={2} aria-hidden="true" /> Add action
                  </button>
                  <button
                    type="button"
                    className="doc-quiet-add"
                    aria-expanded={actionLibraryFor === section.key}
                    onClick={() =>
                      setActionLibraryFor((open) => (open === section.key ? null : section.key))
                    }
                  >
                    <BookOpen strokeWidth={1.8} aria-hidden="true" /> Action library
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
                </>
                )}
              </section>
            );
          })}

          {sections.length === 0 ? (
            <section className="doc-card doc-plan-start" aria-label="Start the plan">
              <h2>Add the first focus area</h2>
              <div className="doc-add-row">
                <button
                  type="button"
                  className="p-btn"
                  aria-expanded={templatesOpen}
                  onClick={() => setTemplatesOpen((open) => !open)}
                >
                  <BookOpen strokeWidth={1.8} aria-hidden="true" /> Start from the library
                </button>
                <button
                  type="button"
                  className="p-btn-ghost"
                  onClick={() => addSections([emptySection(0)], true)}
                >
                  <Plus strokeWidth={2} aria-hidden="true" /> Blank focus area
                </button>
              </div>
            </section>
          ) : (
            <div className="doc-add-focus">
              <span>Add another focus area</span>
              <div className="doc-add-row">
                <button
                  type="button"
                  className="p-btn-ghost"
                  aria-expanded={templatesOpen}
                  onClick={() => setTemplatesOpen((open) => !open)}
                >
                  <BookOpen strokeWidth={1.8} aria-hidden="true" /> From the library
                </button>
                <button
                  type="button"
                  className="p-btn-ghost"
                  onClick={() => addSections([emptySection(sections.length)], true)}
                >
                  <Plus strokeWidth={1.8} aria-hidden="true" /> Blank focus area
                </button>
              </div>
            </div>
          )}
          {templatesOpen && (
            <TemplatePicker
              onPick={(template) => addSections([instantiateTemplate(template, sections.length)])}
            />
          )}
        </>
      )}

      {/* Print-only member view — what the Download button turns into a PDF. */}
      {printing && (
        <div className="doc-print-layer">
          <CarePlanPreview title={title.trim() || "Your care plan"} sections={sections} />
        </div>
      )}
    </main>
  );
}

export default CarePlanEditor;
