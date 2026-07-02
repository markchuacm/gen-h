// ─── Doctor Review Brief · question inputs ────────────────────────────────────
// One calm input per question type. Chips, textareas, a lifestyle snapshot, a
// supplements grid, and a file uploader. No chat bubbles, no dense forms.

import { useRef, useState } from "react";
import {
  Activity,
  Check,
  Dna,
  FlaskConical,
  Paperclip,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  LifestyleSnapshot,
  SupplementsAndMeds,
} from "./types";

// ─── Single select (report fork) ──────────────────────────────────────────────

export function QuickReplyGroup({
  options,
  selectedIndices = [],
  onSelect,
}: {
  options: string[];
  selectedIndices?: number[];
  onSelect: (index: number) => void;
}) {
  const tileIcons: LucideIcon[] = [FlaskConical, Dna, Activity];
  const tileOptions = options.slice(0, 3);
  const textOption = options[3];

  return (
    <div className="drb-choice-list" role="radiogroup">
      <div className="drb-report-tile-grid">
        {tileOptions.map((option, i) => {
          const active = selectedIndices.includes(i);
          const Icon = tileIcons[i];
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              className={`drb-report-tile ${active ? "is-selected" : ""}`}
              onClick={() => onSelect(i)}
            >
              <span className="drb-report-tile-label">{option}</span>
              <span className="drb-report-tile-icon" aria-hidden="true">
                <Icon strokeWidth={1.8} />
              </span>
              {active && (
                <span className="drb-report-tile-check" aria-hidden="true">
                  <Check strokeWidth={2.4} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {textOption && (
        <button
          type="button"
          role="radio"
          aria-checked={false}
          className="drb-report-none"
          onClick={() => onSelect(3)}
        >
          {textOption}
        </button>
      )}
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

export function DynamicQuestionInput({
  options,
  value,
  allowFreeText,
  freeTextLabel,
  onChange,
}: {
  options: string[];
  value: string;
  allowFreeText?: boolean;
  freeTextLabel?: string;
  onChange: (value: string) => void;
}) {
  const parts = value
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const selectedOptions = options.filter((option) => parts.includes(option));
  const freeTextValue = parts
    .filter((part) => !options.includes(part))
    .join(" · ");
  const [showFreeText, setShowFreeText] = useState(Boolean(freeTextValue));
  const emitValue = (selected: string[], freeText = freeTextValue) => {
    onChange([...selected, freeText.trim()].filter(Boolean).join(" · "));
  };

  return (
    <div className="drb-dynamic-answer">
      {options.length > 0 && (
        <div className="drb-chip-wrap">
          {options.map((option) => {
            const active = selectedOptions.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                className={`drb-chip ${active ? "is-selected" : ""}`}
                onClick={() => {
                  if (option === "None of these") {
                    emitValue(active ? [] : [option], "");
                    return;
                  }
                  const withoutNone = selectedOptions.filter(
                    (selected) => selected !== "None of these",
                  );
                  emitValue(
                    active
                      ? withoutNone.filter((selected) => selected !== option)
                      : [...withoutNone, option],
                  );
                }}
              >
                {active && <Check strokeWidth={2.5} aria-hidden="true" />}
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
      {allowFreeText && !showFreeText && (
        <button
          type="button"
          className="drb-add-detail drb-add-detail--inline"
          onClick={() => setShowFreeText(true)}
        >
          <Plus strokeWidth={2} aria-hidden="true" />
          Add detail
        </button>
      )}
      {allowFreeText && showFreeText && (
        <label className="drb-field drb-field--free">
          <span>{freeTextLabel ?? "Answer in your own words"}</span>
          <textarea
            rows={3}
            value={freeTextValue}
            placeholder="Add context for your doctor"
            onChange={(e) => emitValue(selectedOptions, e.target.value)}
          />
        </label>
      )}
    </div>
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
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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
        <Field
          label="Sleep"
          value={value.sleepHours}
          placeholder="e.g. ~6.5 hrs"
          onChange={(v) => onChange({ sleepHours: v })}
        />
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
        <button
          type="button"
          className="drb-add-detail"
          onClick={() => setExpanded(true)}
        >
          <Plus strokeWidth={2} aria-hidden="true" />
          Add more detail
        </button>
      ) : (
        <div className="drb-field-grid drb-field-grid--detail">
          <Field
            label="Bedtime"
            value={value.bedtime}
            placeholder="e.g. 12:30 am"
            onChange={(v) => onChange({ bedtime: v })}
          />
          <Field
            label="Wake time"
            value={value.wakeTime}
            placeholder="e.g. 7:00 am"
            onChange={(v) => onChange({ wakeTime: v })}
          />
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
      <Field
        label="Allergies"
        value={value.allergies}
        placeholder="e.g. penicillin"
        onChange={(v) => onChange({ allergies: v })}
      />
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

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.heic,.csv,.doc,.docx,application/pdf,image/*,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function FileUpload({
  onAdd,
  title = "Upload what you already have",
  description = "PDF, JPG, PNG, DOCX",
}: {
  onAdd: (files: FileList | File[]) => void;
  title?: string;
  description?: string;
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
        <strong>{title}</strong>
        <span>{description}</span>
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

    </div>
  );
}
