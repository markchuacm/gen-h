import { useEffect, useState } from "react";
import {
  createDraftPlan,
  fetchEditablePlan,
  releaseCarePlan,
  savePlanSections,
  updatePlanMeta,
} from "../lib/api/doctor";
import type { DraftSection } from "../lib/api/doctor";
import type { CarePlanActionData } from "../lib/api/carePlan";

const CATEGORIES: CarePlanActionData["lifestyleCategory"][] = [
  "Nutrition",
  "Exercise",
  "Supplements",
  "Sleep",
];

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
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
            .map((s) => ({ ...s, actions: s.actions ?? [], markers: s.markers ?? [] })),
        );
      }
      setLoading(false);
    });
  }, [memberId]);

  const patchSection = (index: number, patch: Partial<DraftSection>) =>
    setSections((current) => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const patchAction = (si: number, ai: number, patch: Partial<CarePlanActionData>) =>
    setSections((current) =>
      current.map((s, i) =>
        i === si
          ? { ...s, actions: s.actions.map((a, j) => (j === ai ? { ...a, ...patch } : a)) }
          : s,
      ),
    );

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
          <span className="doc-eyebrow">CARE PLAN · {status.toUpperCase()}</span>
          <h1>Plan for {memberName ?? "member"}</h1>
        </div>
        <div className="doc-editor-actions">
          <button type="button" className="doc-secondary" disabled={busy} onClick={() => void save()}>
            Save draft
          </button>
          <button type="button" className="doc-primary" disabled={busy} onClick={() => void release()}>
            {status === "released" ? "Re-release" : "Release to member"}
          </button>
        </div>
      </header>

      {banner && <p className="doc-banner">{banner}</p>}

      <label className="doc-field">
        <span>Plan title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      {sections.map((section, si) => (
        <section className="doc-card doc-section-edit" key={si}>
          <div className="doc-section-head">
            <h2>Focus area {si + 1}</h2>
            <button
              type="button"
              className="doc-remove"
              onClick={() => setSections((c) => c.filter((_, i) => i !== si))}
            >
              Remove
            </button>
          </div>

          <label className="doc-field">
            <span>Title</span>
            <input value={section.title} onChange={(e) => patchSection(si, { title: e.target.value })} />
          </label>
          <label className="doc-field">
            <span>Summary</span>
            <textarea value={section.summary} onChange={(e) => patchSection(si, { summary: e.target.value })} />
          </label>
          <label className="doc-field">
            <span>Marker chips (comma-separated)</span>
            <input
              value={section.markers.join(", ")}
              onChange={(e) =>
                patchSection(si, {
                  markers: e.target.value.split(",").map((m) => m.trim()).filter(Boolean),
                })
              }
            />
          </label>
          <label className="doc-field">
            <span>Doctor note</span>
            <textarea value={section.doctor_note} onChange={(e) => patchSection(si, { doctor_note: e.target.value })} />
          </label>

          <h3 className="doc-actions-title">Actions</h3>
          {section.actions.map((action, ai) => (
            <div className="doc-action-edit" key={action.id}>
              <div className="doc-action-row">
                <input
                  placeholder="Action title"
                  value={action.title}
                  onChange={(e) => patchAction(si, ai, { title: e.target.value })}
                />
                <select
                  value={action.lifestyleCategory}
                  onChange={(e) =>
                    patchAction(si, ai, {
                      lifestyleCategory: e.target.value as CarePlanActionData["lifestyleCategory"],
                    })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="doc-remove"
                  onClick={() =>
                    patchSection(si, { actions: section.actions.filter((_, j) => j !== ai) })
                  }
                >
                  ✕
                </button>
              </div>
              <input
                placeholder="Instruction"
                value={action.instruction}
                onChange={(e) => patchAction(si, ai, { instruction: e.target.value })}
              />
              <input
                placeholder="Why this works (rationale)"
                value={action.rationale}
                onChange={(e) => patchAction(si, ai, { rationale: e.target.value })}
              />
              <textarea
                placeholder="More guidance"
                value={action.moreGuidance}
                onChange={(e) => patchAction(si, ai, { moreGuidance: e.target.value })}
              />
            </div>
          ))}
          <button
            type="button"
            className="doc-secondary doc-add"
            onClick={() => patchSection(si, { actions: [...section.actions, emptyAction()] })}
          >
            + Add action
          </button>
        </section>
      ))}

      <button
        type="button"
        className="doc-secondary doc-add-section"
        onClick={() => setSections((c) => [...c, emptySection(c.length)])}
      >
        + Add focus area
      </button>
    </main>
  );
}

export default CarePlanEditor;
