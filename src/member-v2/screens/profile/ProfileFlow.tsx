import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleSlash,
  Dna,
  File as FileIcon,
  FileText,
  FlaskConical,
  FolderOpen,
  Image as ImageIcon,
  Paperclip,
  Table as TableIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ALCOHOL_OPTIONS,
  DIET_OPTIONS,
  EXERCISE_OPTIONS,
  REPORT_CATEGORY_LABELS,
  REPORT_OPTIONS,
  SMOKING_OPTIONS,
  STEPS,
  STEP_COUNT,
} from "./profileQuestions";
import type {
  ProfileAnswers,
  ReportSelection,
  ReportUploadCategory,
  StepDef,
  UploadedReport,
  UploadedReportKind,
} from "./profileQuestions";

export type ToggleListKey = "reason" | "goals" | "symptoms" | "family" | "supplements";

type ProfileFlowProps = {
  answers: ProfileAnswers;
  uploadErrors: string[];
  startAt?: number;
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
  onToggleReport: (selection: ReportSelection) => void;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
  onReachStep: (step: number) => void;
  onComplete: () => void;
  onClose: () => void;
};

const REPORT_STEP_INDEX = STEPS.findIndex((step) => step.id === "reports");
const REPORT_UPLOAD_STEP_INDEX = STEPS.findIndex((step) => step.id === "reportUpload");
// Must stay in sync with the health-documents bucket config (6 types, 10MB).
const ACCEPT_REPORTS =
  ".pdf,.png,.jpg,.jpeg,.csv,.doc,.docx,application/pdf,image/png,image/jpeg,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const REPORT_ICONS: Record<ReportSelection, LucideIcon> = {
  health_screening: FlaskConical,
  genetic_tests: Dna,
  other_tests: FolderOpen,
  no_tests: CircleSlash,
};

const REPORT_FILE_ICONS: Record<UploadedReportKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: TableIcon,
  doc: FileIcon,
  other: Paperclip,
};

function uploadCategories(answers: ProfileAnswers): ReportUploadCategory[] {
  return answers.reportSelections.filter(
    (selection): selection is ReportUploadCategory => selection !== "no_tests",
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
  numbered,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  numbered?: boolean;
}) {
  return (
    <div className="pf-chips" role="group">
      {options.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={`pf-chip ${isSelected ? "is-selected" : ""}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(option)}
          >
            {numbered && index < 9 && <span className="pf-chip-key">{index + 1}</span>}
            {option}
            {isSelected && <Check strokeWidth={2.6} />}
          </button>
        );
      })}
    </div>
  );
}

function Segment({
  options,
  value,
  onSelect,
  label,
}: {
  options: readonly string[];
  value: string;
  onSelect: (option: string) => void;
  label?: string;
}) {
  return (
    <div className="pf-control">
      {label && (
        <div className="pf-control-head">
          <label>{label}</label>
        </div>
      )}
      <div className="pf-segment" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`pf-chip ${value === option ? "is-selected" : ""}`}
            aria-pressed={value === option}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="pf-control">
      <div className="pf-control-head">
        <label>{label}</label>
        <span className="pf-control-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function ReportSelectionGrid({
  answers,
  onToggleReport,
}: {
  answers: ProfileAnswers;
  onToggleReport: (selection: ReportSelection) => void;
}) {
  return (
    <div className="pf-report-grid" role="group" aria-label="Previous test types">
      {REPORT_OPTIONS.map((option) => {
        const selected = answers.reportSelections.includes(option.id);
        const Icon = REPORT_ICONS[option.id];
        return (
          <button
            key={option.id}
            type="button"
            className={`pf-report-tile ${selected ? "is-selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onToggleReport(option.id)}
          >
            <span className="pf-report-tile-label">{option.label}</span>
            {option.helper && <span className="pf-report-tile-helper">{option.helper}</span>}
            <span className="pf-report-tile-icon" aria-hidden="true">
              <Icon strokeWidth={1.8} />
            </span>
            <span className="pf-report-tile-check" aria-hidden="true">
              <Check strokeWidth={2.4} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReportDropzone({
  category,
  onAddReports,
}: {
  category: ReportUploadCategory;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const label = REPORT_CATEGORY_LABELS[category];

  return (
    <section className="pf-upload-group" aria-label={`Upload ${label}`}>
      <button
        type="button"
        className={`pf-dropzone ${dragOver ? "is-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const files = Array.from(event.dataTransfer.files);
          if (files.length) onAddReports(files, category);
        }}
      >
        <Paperclip strokeWidth={1.7} aria-hidden="true" />
        <strong>Upload {label.toLowerCase()}</strong>
        <span>Drop files here or click to browse</span>
      </button>
      <input
        ref={inputRef}
        className="pf-visually-hidden"
        type="file"
        multiple
        accept={ACCEPT_REPORTS}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onAddReports(files, category);
          event.target.value = "";
        }}
      />
    </section>
  );
}

function UploadedReportTile({
  report,
  onRemove,
}: {
  report: UploadedReport;
  onRemove: (id: string) => void;
}) {
  const Icon = REPORT_FILE_ICONS[report.kind];
  const ext = report.name.includes(".") ? report.name.split(".").pop()?.toUpperCase() : report.kind;
  const uploading = report.status === "uploading";

  const openDocument = async () => {
    if (!report.storagePath) return;
    const { createDocumentSignedUrl } = await import("../../../lib/api/healthDocuments");
    const { url } = await createDocumentSignedUrl(report.storagePath);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <article className={`pf-report-file pf-report-file--${report.kind}`}>
      <button
        type="button"
        className="pf-report-file-remove"
        aria-label={`Remove ${report.name}`}
        onClick={() => onRemove(report.id)}
      >
        <X strokeWidth={2} aria-hidden="true" />
      </button>
      <div className="pf-report-file-thumb" aria-hidden="true">
        <Icon strokeWidth={1.6} />
        <span>{ext}</span>
      </div>
      <div className="pf-report-file-meta">
        {report.storagePath ? (
          <strong title={`Open ${report.name}`}>
            <button type="button" className="pf-report-file-open" onClick={() => void openDocument()}>
              {report.name}
            </button>
          </strong>
        ) : (
          <strong title={report.name}>{report.name}</strong>
        )}
        <span>{uploading ? "Uploading…" : REPORT_CATEGORY_LABELS[report.category]}</span>
      </div>
    </article>
  );
}

function ReportUploadStep({
  answers,
  uploadErrors,
  onAddReports,
  onRemoveReport,
}: {
  answers: ProfileAnswers;
  uploadErrors: string[];
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
}) {
  const categories = uploadCategories(answers);
  const compactDropzones = categories.length === 3;

  return (
    <div className="pf-upload-layout">
      <div className={`pf-upload-dropzones ${compactDropzones ? "is-compact" : ""}`}>
        {categories.map((category) => (
          <ReportDropzone key={category} category={category} onAddReports={onAddReports} />
        ))}
      </div>
      {uploadErrors.length > 0 && (
        <ul className="pf-upload-errors" role="alert">
          {uploadErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      <section className="pf-upload-files" aria-label="Files uploaded">
        <h3>Files uploaded</h3>
        {answers.uploadedReports.length > 0 ? (
          <div className="pf-report-file-grid">
            {answers.uploadedReports.map((report) => (
              <UploadedReportTile key={report.id} report={report} onRemove={onRemoveReport} />
            ))}
          </div>
        ) : (
          <p>-</p>
        )}
      </section>
    </div>
  );
}

function StepInputs({
  step,
  answers,
  uploadErrors,
  onPatch,
  onToggle,
  onToggleReport,
  onAddReports,
  onRemoveReport,
}: {
  step: StepDef;
  answers: ProfileAnswers;
  uploadErrors: string[];
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
  onToggleReport: (selection: ReportSelection) => void;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
}) {
  if (step.kind === "reports") {
    return <ReportSelectionGrid answers={answers} onToggleReport={onToggleReport} />;
  }

  if (step.kind === "reportUpload") {
    return (
      <ReportUploadStep
        answers={answers}
        uploadErrors={uploadErrors}
        onAddReports={onAddReports}
        onRemoveReport={onRemoveReport}
      />
    );
  }

  if (step.kind === "basics") {
    const { basics } = answers;
    return (
      <div className="pf-controls">
        <div className="pf-control">
          <div className="pf-control-head">
            <label htmlFor="pf-preferred-name">Preferred name</label>
          </div>
          <input
            id="pf-preferred-name"
            className="pf-other-input"
            type="text"
            value={basics.preferredName}
            onChange={(event) =>
              onPatch({ basics: { ...basics, preferredName: event.target.value } })
            }
          />
        </div>
        <Segment
          label="Gender"
          options={["Male", "Female"]}
          value={basics.sex}
          onSelect={(sex) => onPatch({ basics: { ...basics, sex: sex as "Male" | "Female" } })}
        />
        <SliderControl
          label="Age"
          value={basics.age}
          display={`${basics.age}`}
          min={18}
          max={80}
          step={1}
          onChange={(age) => onPatch({ basics: { ...basics, age } })}
        />
        <SliderControl
          label="Height"
          value={basics.heightCm}
          display={`${basics.heightCm} cm`}
          min={140}
          max={205}
          step={1}
          onChange={(heightCm) => onPatch({ basics: { ...basics, heightCm } })}
        />
        <SliderControl
          label="Weight"
          value={basics.weightKg}
          display={`${basics.weightKg} kg`}
          min={40}
          max={150}
          step={1}
          onChange={(weightKg) => onPatch({ basics: { ...basics, weightKg } })}
        />
      </div>
    );
  }

  if (step.kind === "lifestyle") {
    const { lifestyle } = answers;
    return (
      <div className="pf-controls">
        <SliderControl
          label="Weekday sleep"
          value={lifestyle.sleepHours}
          display={`${lifestyle.sleepHours} h`}
          min={4}
          max={10}
          step={0.5}
          onChange={(sleepHours) => onPatch({ lifestyle: { ...lifestyle, sleepHours } })}
        />
        <Segment
          label="Exercise days per week"
          options={EXERCISE_OPTIONS}
          value={lifestyle.exerciseDays}
          onSelect={(exerciseDays) =>
            onPatch({
              lifestyle: { ...lifestyle, exerciseDays: exerciseDays as typeof lifestyle.exerciseDays },
            })
          }
        />
        <Segment
          label="Most meals are"
          options={DIET_OPTIONS}
          value={lifestyle.diet}
          onSelect={(diet) =>
            onPatch({ lifestyle: { ...lifestyle, diet: diet as typeof lifestyle.diet } })
          }
        />
        <SliderControl
          label="Stress lately (1 = calm, 5 = maxed out)"
          value={lifestyle.stress}
          display={`${lifestyle.stress} / 5`}
          min={1}
          max={5}
          step={1}
          onChange={(stress) => onPatch({ lifestyle: { ...lifestyle, stress } })}
        />
      </div>
    );
  }

  if (step.kind === "habits") {
    const { habits } = answers;
    return (
      <div className="pf-controls">
        <Segment
          label="Alcohol"
          options={ALCOHOL_OPTIONS}
          value={habits.alcohol}
          onSelect={(alcohol) =>
            onPatch({ habits: { ...habits, alcohol: alcohol as typeof habits.alcohol } })
          }
        />
        <Segment
          label="Smoking"
          options={SMOKING_OPTIONS}
          value={habits.smoking}
          onSelect={(smoking) =>
            onPatch({ habits: { ...habits, smoking: smoking as typeof habits.smoking } })
          }
        />
      </div>
    );
  }

  if (step.kind === "supplements") {
    return (
      <div className="pf-controls">
        <ChipGrid
          numbered
          options={step.options ?? []}
          selected={answers.supplements}
          onToggle={(option) => onToggle("supplements", option)}
        />
        <input
          className="pf-other-input"
          type="text"
          placeholder="Anything else — the only typing in this whole flow"
          value={answers.supplementsOther}
          onChange={(event) => onPatch({ supplementsOther: event.target.value })}
        />
      </div>
    );
  }

  // Plain multi-select chips (reason / goals / symptoms / family).
  const key = step.id as ToggleListKey;
  return (
    <ChipGrid
      numbered
      options={step.options ?? []}
      selected={answers[key]}
      onToggle={(option) => onToggle(key, option)}
    />
  );
}

function ProfileFlow({
  answers,
  uploadErrors,
  startAt,
  onPatch,
  onToggle,
  onToggleReport,
  onAddReports,
  onRemoveReport,
  onReachStep,
  onComplete,
  onClose,
}: ProfileFlowProps) {
  const [stepIndex, setStepIndex] = useState(Math.min(startAt ?? 0, STEP_COUNT - 1));
  const [whyOpen, setWhyOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const step = STEPS[stepIndex];

  const canContinue = useMemo(() => {
    if (step.kind === "reports") {
      return answers.reportSelections.length > 0;
    }
    if (step.kind === "chips" && step.required) {
      const key = step.id as "reason" | "goals" | "symptoms" | "family";
      return answers[key].length > 0;
    }
    return true;
  }, [step, answers]);

  const nextStepIndex = () => {
    if (stepIndex === REPORT_STEP_INDEX) {
      return answers.reportSelections.includes("no_tests") ? STEP_COUNT : REPORT_UPLOAD_STEP_INDEX;
    }
    return stepIndex + 1;
  };

  const advance = () => {
    if (!canContinue) return;
    const target = nextStepIndex();
    if (target >= STEP_COUNT) {
      onReachStep(STEP_COUNT);
      setComposing(true);
      return;
    }
    onReachStep(target);
    setStepIndex(target);
    setWhyOpen(false);
  };

  const back = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
    setWhyOpen(false);
  };

  // Composing moment: a calm beat before the brief — no fake AI narration.
  useEffect(() => {
    if (!composing) return;
    const timer = setTimeout(() => onComplete(), 1400);
    return () => clearTimeout(timer);
  }, [composing, onComplete]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (composing) return;
      const target = event.target as HTMLElement;
      const inText = target.tagName === "INPUT" && (target as HTMLInputElement).type === "text";
      const inButton = target.tagName === "BUTTON";
      if (event.key === "Enter" && !inText && !inButton) {
        event.preventDefault();
        advance();
      }
      if (event.key === "Enter" && inText) {
        (target as HTMLInputElement).blur();
        event.preventDefault();
        advance();
      }
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && !inText) back();
      // 1–9 toggles chips/report tiles on choice steps.
      if (!inText && /^[1-9]$/.test(event.key)) {
        if (step.kind === "reports") {
          const option = REPORT_OPTIONS[Number(event.key) - 1];
          if (option) onToggleReport(option.id);
          return;
        }
        const options = step.options;
        if (!options || (step.kind !== "chips" && step.kind !== "supplements")) return;
        const option = options[Number(event.key) - 1];
        if (!option) return;
        const key = step.kind === "supplements" ? "supplements" : (step.id as ToggleListKey);
        onToggle(key, option);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    document.body.classList.add("is-results-locked");
    return () => document.body.classList.remove("is-results-locked");
  }, []);

  const progress = ((stepIndex + (composing ? 1 : 0)) / STEP_COUNT) * 100;
  const willFinish =
    stepIndex === STEP_COUNT - 1 ||
    (stepIndex === REPORT_STEP_INDEX && answers.reportSelections.includes("no_tests"));

  return (
    <div className="pf-flow" role="dialog" aria-label="Health profile">
      <div className="pf-flow-top">
        <span className="pf-flow-wordmark">Verae</span>
        <div className="pf-flow-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <button className="pf-flow-close" type="button" onClick={onClose}>
          Save & close
        </button>
      </div>

      {composing ? (
        <div className="pf-composing">
          <span className="pf-composing-dot" aria-hidden="true" />
          <h2>
            Preparing your <em>doctor brief</em>
          </h2>
          <p>Organising your answers the way your doctor reads them.</p>
        </div>
      ) : (
        <div className="pf-stage" key={step.id}>
          <span className="pf-stage-count">
            {stepIndex + 1} of {STEP_COUNT}
          </span>
          <h2>
            {step.prompt}
            {step.promptEm && <em>{step.promptEm}</em>}
          </h2>
          {step.helper && <p className="pf-stage-helper">{step.helper}</p>}
          <StepInputs
            step={step}
            answers={answers}
            uploadErrors={uploadErrors}
            onPatch={onPatch}
            onToggle={onToggle}
            onToggleReport={onToggleReport}
            onAddReports={onAddReports}
            onRemoveReport={onRemoveReport}
          />
          {step.whyWeAsk && (
            <div className={`pf-why ${whyOpen ? "is-open" : ""}`}>
              <button
                type="button"
                aria-expanded={whyOpen}
                onClick={() => setWhyOpen((open) => !open)}
              >
                Why we ask
              </button>
              <div className="pf-why-panel" aria-hidden={!whyOpen}>
                <p>{step.whyWeAsk}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!composing && (
        <div className="pf-flow-bottom">
          {stepIndex > 0 && (
            <button className="p-btn-ghost" type="button" onClick={back}>
              Back
            </button>
          )}
          <button
            className="p-btn"
            type="button"
            onClick={advance}
            disabled={!canContinue}
            style={!canContinue ? { opacity: 0.45, cursor: "default" } : undefined}
          >
            {willFinish ? "Finish" : "Continue"}
          </button>
          <span className="pf-enter-hint">
            press <kbd>Enter ↵</kbd>
          </span>
        </div>
      )}
    </div>
  );
}

export default ProfileFlow;
