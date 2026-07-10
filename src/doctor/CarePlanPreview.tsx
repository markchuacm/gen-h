// Read-only render of the draft using the member app's actual care-plan
// classes and image resolution, so the doctor sees what will ship. The member
// CarePlanScreen itself isn't mounted here: it fetches its own (released-only)
// data and owns localStorage done-state, neither of which fits a draft.
import { CATEGORY_THUMBNAILS, sectionImage } from "../member-v2/screens/care-plan/carePlanAssets";
import { lifestyleCategoryOrder } from "../member-v2/screens/care-plan/carePlanData";
import type { LifestyleCategory } from "../member-v2/screens/care-plan/carePlanData";
import type { DraftSection } from "../lib/api/doctor";
import "../member-v2/screens/care-plan/care-plan.css";

function CarePlanPreview({ title, sections }: { title: string; sections: DraftSection[] }) {
  const allActions = sections.flatMap((section, index) =>
    section.actions.map((action) => ({ ...action, areaTitle: section.title || `Focus area ${index + 1}` })),
  );

  return (
    <div className="doc-plan-preview">
      <header className="cp-head">
        <span className="p-eyebrow">Member view</span>
        <h1 className="doc-plan-preview-title">{title || "Your care plan"}</h1>
      </header>

      <div className="cp-areas">
        {sections.map((section, index) => (
          <div className="cp-area" key={section.id ?? index}>
            <span className="cp-area-image">
              <img src={sectionImage(index)} alt="" />
            </span>
            <span className="cp-area-body">
              <h3>{section.title || `Focus area ${index + 1}`}</h3>
              <p>{section.summary}</p>
              <span className="cp-area-meta">
                {section.markers.map((marker) => (
                  <span key={marker} className="cp-marker-chip">
                    {marker}
                  </span>
                ))}
                <span className="cp-area-count">
                  {section.actions.length} action{section.actions.length === 1 ? "" : "s"}
                </span>
              </span>
            </span>
          </div>
        ))}
      </div>

      {allActions.length > 0 && (
        <div className="doc-plan-preview-protocol">
          {lifestyleCategoryOrder.map((category: LifestyleCategory) => {
            const actions = allActions.filter((action) => action.lifestyleCategory === category);
            if (actions.length === 0) return null;
            return (
              <div className="cp-group" key={category}>
                <h3 className="cp-group-title">{category}</h3>
                <ul className="cp-rows">
                  {actions.map((action) => (
                    <li className="cp-row" key={action.id}>
                      <div className="cp-row-main">
                        <img
                          className="cp-row-thumb"
                          src={CATEGORY_THUMBNAILS[action.lifestyleCategory] ?? CATEGORY_THUMBNAILS.Nutrition}
                          alt=""
                        />
                        <span className="cp-row-copy">
                          <strong>{action.title}</strong>
                          <span>{action.instruction}</span>
                        </span>
                        <span className="cp-row-side">
                          <span className="cp-marker-chip">{action.areaTitle}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CarePlanPreview;
