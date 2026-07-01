// ─── Doctor Review Brief · question inputs ────────────────────────────────────
// One calm input per question type. Chips, textareas, a lifestyle snapshot, a
// supplements grid, and a file uploader. No chat bubbles, no dense forms.

import { useRef, useState } from "react";
import { Check, Loader2, Paperclip, Plus, Sparkles, X } from "lucide-react";
import { CATEGORY_LABEL } from "./briefEngine";
import type { DocumentInsight, LifestyleSnapshot, SupplementsAndMeds, UploadedFile } from "./types";

// ─── Single select (report fork) ──────────────────────────────────────────────

export function QuickReplyGroup({
  options,
  selectedIndex,
  onSelect,
}: {
  options: string[];
  selectedIndex?: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="drb-choice-list" role="radiogroup">
      {options.map((option, i) => {
        const active = selectedIndex === i;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            className={`drb-choice ${active ? "is-selected" : ""}`}
            onClick={() => onSelect(i)}
          >
            <span>{option}</span>
            <span className="drb-choice-mark" aria-hidden="true">
              {active && <Check strokeWidth={2.5} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Multi select + free text ─────────────────────────────────────────────────

export function MultiSelectQuestion({
  options,
  selected,
  onToggle,
  freeText,
  freeTextLabel,
  onFreeText,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  freeText?: string;
  freeTextLabel?: string;
  onFreeText?: (value: string) => void;
}) {
  return (
    <div className="drb-multi">
      <div className="drb-chip-wrap">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              className={`drb-chip ${active ? "is-selected" : ""}`}
              onClick={() => onToggle(option)}
            >
              {active && <Check strokeWidth={2.5} aria-hidden="true" />}
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {onFreeText && (
        <label className="drb-field drb-field--free">
          <span>{freeTextLabel ?? "Anything else"}</span>
          <textarea
            rows={2}
            value={freeText ?? ""}
            placeholder="Optional — in your own words"
            onChange={(e) => onFreeText(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}

// ─── Free text ────────────────────────────────────────────────────────────────

export function TextAnswer({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      className="drb-textarea"
      rows={4}
      value={value}
      placeholder={placeholder ?? "Type your answer…"}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Lifestyle snapshot ───────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="drb-field">
      <span>{label}</span>
      <input type="text" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function LifestyleSnapshotInput({
  value,
  onChange,
}: {
  value: LifestyleSnapshot;
  onChange: (patch: Partial<LifestyleSnapshot>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="drb-snapshot">
      <div className="drb-field-grid">
        <Field label="Sleep" value={value.sleepHours} placeholder="e.g. ~6.5 hrs" onChange={(v) => onChange({ sleepHours: v })} />
        <Field
          label="Sleep quality"
          value={value.sleepQuality}
          placeholder="e.g. wake a lot"
          onChange={(v) => onChange({ sleepQuality: v })}
        />
        <Field
          label="Exercise"
          value={value.exercise}
          placeholder="e.g. gym 3× / week"
          onChange={(v) => onChange({ exercise: v })}
        />
        <Field
          label="Diet"
          value={value.diet}
          placeholder="e.g. home-cooked, sweet tooth"
          onChange={(v) => onChange({ diet: v })}
        />
      </div>

      {!expanded ? (
        <button type="button" className="drb-add-detail" onClick={() => setExpanded(true)}>
          <Plus strokeWidth={2} aria-hidden="true" />
          Add more detail
        </button>
      ) : (
        <div className="drb-field-grid drb-field-grid--detail">
          <Field label="Bedtime" value={value.bedtime} placeholder="e.g. 12:30 am" onChange={(v) => onChange({ bedtime: v })} />
          <Field label="Wake time" value={value.wakeTime} placeholder="e.g. 7:00 am" onChange={(v) => onChange({ wakeTime: v })} />
          <Field
            label="Caffeine / alcohol"
            value={value.caffeineAlcohol}
            placeholder="e.g. 2 coffees, wine weekends"
            onChange={(v) => onChange({ caffeineAlcohol: v })}
          />
          <Field
            label="Exercise types"
            value={value.exerciseTypes}
            placeholder="e.g. strength + walking"
            onChange={(v) => onChange({ exerciseTypes: v })}
          />
          <Field
            label="Diet style"
            value={value.dietPreference}
            placeholder="e.g. flexible, eats everything"
            onChange={(v) => onChange({ dietPreference: v })}
          />
          <Field
            label="Sweet tooth?"
            value={value.sweetTooth}
            placeholder="e.g. yes, evenings"
            onChange={(v) => onChange({ sweetTooth: v })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Supplements / medications ────────────────────────────────────────────────

export function SupplementsForm({
  value,
  onChange,
}: {
  value: SupplementsAndMeds;
  onChange: (patch: Partial<SupplementsAndMeds>) => void;
}) {
  return (
    <div className="drb-field-grid">
      <Field
        label="Supplements"
        value={value.supplements}
        placeholder="e.g. vitamin D, omega-3"
        onChange={(v) => onChange({ supplements: v })}
      />
      <Field
        label="Medications"
        value={value.medications}
        placeholder="e.g. none, or name them"
        onChange={(v) => onChange({ medications: v })}
      />
      <Field label="Allergies" value={value.allergies} placeholder="e.g. penicillin" onChange={(v) => onChange({ allergies: v })} />
      <Field
        label="Known conditions"
        value={value.knownConditions}
        placeholder="e.g. none diagnosed"
        onChange={(v) => onChange({ knownConditions: v })}
      />
    </div>
  );
}

// ─── File upload ──────────────────────────────────────────────────────────────

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.heic,.csv,application/pdf,image/*,text/csv";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  files,
  insights,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  insights?: Record<string, DocumentInsight>;
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="drb-upload">
      <button
        type="button"
        className={`drb-dropzone ${dragOver ? "is-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
        }}
      >
        <Paperclip strokeWidth={1.6} aria-hidden="true" />
        <strong>Upload what you already have</strong>
        <span>PDF, image or CSV. Blood tests, screening reports, DNA, wearable exports — anything.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="drb-visually-hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="drb-file-list">
	          {files.map((f) => {
	            const ins = insights?.[f.id];
	            const isAnalyzing = ins?.status === "analyzing";
	            const isDone = ins?.status === "done";
	            const needsReview = ins?.status === "needs_review" || ins?.status === "error";
	            const summaryBits = [
	              ins?.reportDate ? `Collected: ${ins.reportDate}` : undefined,
	              ins?.provider ? `Provider: ${ins.provider}` : undefined,
	            ].filter(Boolean);
	            return (
	              <li key={f.id} className="drb-file-card">
	                <div className="drb-file-meta">
	                  <strong>{f.name}</strong>
	                  <span>
                    {f.detectedCategory ? CATEGORY_LABEL[f.detectedCategory] : "Document"} · {formatBytes(f.size)}
                  </span>
                  {isAnalyzing && (
                    <span className="drb-file-status drb-file-status--analyzing">
                      <Loader2 strokeWidth={2} className="drb-spin" aria-hidden="true" />
                      Reviewing document…
                    </span>
                  )}
	                  {isDone && ins.documentType && (
	                    <span className="drb-file-status drb-file-status--done">
	                      <Sparkles strokeWidth={2} aria-hidden="true" />
	                      {ins.documentType} · added to brief
	                    </span>
	                  )}
	                  {isDone && (
	                    <div className="drb-file-intel">
	                      {summaryBits.map((bit) => (
	                        <span key={bit}>{bit}</span>
	                      ))}
	                      {ins.sections.length > 0 && <span>Visible sections: {ins.sections.slice(0, 6).join(", ")}</span>}
	                      {ins.flaggedMarkers.length > 0 && (
	                        <span>Marked in report: {ins.flaggedMarkers.slice(0, 6).join(", ")}</span>
	                      )}
	                    </div>
	                  )}
	                  {needsReview && (
	                    <span className="drb-file-status">Needs doctor review</span>
	                  )}
	                  {!isAnalyzing && !isDone && !needsReview && (
	                    <span className="drb-file-status">Uploaded for doctor review</span>
	                  )}
                </div>
                <button type="button" className="drb-file-remove" aria-label={`Remove ${f.name}`} onClick={() => onRemove(f.id)}>
                  <X strokeWidth={2} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
