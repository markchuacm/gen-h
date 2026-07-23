import { CheckCircle2 } from "lucide-react";
import { resolveSectionImage } from "../member-v2/screens/care-plan/carePlanAssets";
import type { DraftSection } from "../lib/api/doctor";
import "../member-v2/screens/care-plan/care-plan.css";

function CarePlanPreview({ title, sections }: { title: string; sections: DraftSection[] }) {
  const active = sections.filter((section) => section.section_state !== "deferred");
  const actionCount = active.reduce((sum, section) => sum + section.actions.length, 0);
  return (
    <div className="doc-plan-preview">
      <header className="doc-plan-preview-head">
        <div>
          <span className="p-eyebrow">MEMBER VIEW</span>
          <h1 className="doc-plan-preview-title">{title || "Your care plan"}</h1>
          <p>{active.length} focus areas · {actionCount} agreed actions</p>
        </div>
        <CheckCircle2 aria-hidden="true" />
      </header>

      <div className="doc-plan-preview-areas">
        {active.map((section, index) => (
          <section className="doc-plan-preview-area" key={section.id ?? index}>
            <img src={resolveSectionImage(section.image_key, index)} alt="" />
            <div>
              <span className="p-eyebrow">FOCUS AREA {index + 1}</span>
              <h2>{section.title || `Focus area ${index + 1}`}</h2>
              <p>{section.summary}</p>
              {(section.evidence_snapshot?.length ?? 0) > 0 && (
                <div className="guided-evidence">
                  {section.evidence_snapshot!.map((item) => (
                    <span className={`guided-evidence-chip is-${item.status}`} key={`${item.reportId}:${item.biomarkerCode}`}>
                      <span>{item.displayName}</span>
                      <strong>{item.value ?? "—"}{item.unit ? ` ${item.unit}` : ""}</strong>
                      <em>{item.status === "needs_attention" ? "Needs attention" : "At risk"}</em>
                    </span>
                  ))}
                </div>
              )}
              {section.doctor_note && <blockquote>{section.doctor_note}</blockquote>}
              <ul>
                {section.actions.map((action) => (
                  <li key={action.id}>
                    <span className={`guided-category is-${action.lifestyleCategory.toLowerCase()}`}>{action.lifestyleCategory}</span>
                    <span><strong>{action.title}</strong><em>{action.instruction}</em></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default CarePlanPreview;
