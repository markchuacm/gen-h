import { useState } from "react";
import { Plus } from "lucide-react";
import { SECTION_IMAGE_OPTIONS } from "../member-v2/screens/care-plan/carePlanAssets";
import { FOCUS_AREA_TEMPLATES, LIBRARY_ACTIONS } from "./carePlanLibrary";
import type { LibraryAction, LibraryTemplate, LifestyleCategory } from "./carePlanLibrary";

const CATEGORIES: LifestyleCategory[] = ["Nutrition", "Exercise", "Supplements", "Sleep"];

const templateImage = (imageKey: string) =>
  SECTION_IMAGE_OPTIONS.find((option) => option.key === imageKey)?.src ??
  SECTION_IMAGE_OPTIONS[0].src;

/** Inline panel listing the focus-area templates, each led by the
    member-facing image it ships with. */
export function TemplatePicker({ onPick }: { onPick: (template: LibraryTemplate) => void }) {
  return (
    <div className="doc-library" role="listbox" aria-label="Focus-area templates">
      {FOCUS_AREA_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          className="doc-library-item doc-library-item--template"
          onClick={() => onPick(template)}
        >
          <img className="doc-library-thumb" src={templateImage(template.imageKey)} alt="" />
          <span className="doc-library-item-copy">
            <span className="doc-library-item-head">
              <strong>{template.title}</strong>
              <span className="doc-library-count">
                {template.actions.length} action{template.actions.length === 1 ? "" : "s"}
              </span>
            </span>
            <span className="doc-library-item-body">{template.summary}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Inline panel of common actions, tabbed by lifestyle category. */
export function ActionLibrary({ onPick }: { onPick: (action: LibraryAction) => void }) {
  const [category, setCategory] = useState<LifestyleCategory>("Nutrition");

  return (
    <div className="doc-library">
      <div className="doc-library-tabs" role="tablist" aria-label="Action categories">
        {CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={category === name}
            className={`doc-library-tab ${category === name ? "is-active" : ""}`}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {LIBRARY_ACTIONS[category].map((action) => (
        <button
          key={action.title}
          type="button"
          className="doc-library-item"
          onClick={() => onPick(action)}
        >
          <span className="doc-library-item-head">
            <Plus strokeWidth={2} aria-hidden="true" />
            <strong>{action.title}</strong>
          </span>
          <span className="doc-library-item-body">{action.instruction}</span>
        </button>
      ))}
    </div>
  );
}
