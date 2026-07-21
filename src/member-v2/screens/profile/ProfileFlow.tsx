import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  alcoholOptionForSex,
  alcoholOptionsForSex,
  DIET_OPTIONS,
  EXERCISE_OPTIONS,
  OTHER_OPTION,
  REPORT_CATEGORY_LABELS,
  REPORT_OPTIONS,
  SMOKING_PRODUCT_OPTIONS,
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

export type ToggleListKey = "reason" | "goals" | "symptoms" | "family" | "supplements" | "allergies";
type OtherAnswerKey = "reasonOther" | "goalsOther" | "symptomsOther" | "familyOther" | "supplementsOther" | "allergiesOther";

const OTHER_ANSWER_KEYS: Record<ToggleListKey, OtherAnswerKey> = {
  reason: "reasonOther",
  goals: "goalsOther",
  symptoms: "symptomsOther",
  family: "familyOther",
  supplements: "supplementsOther",
  allergies: "allergiesOther",
};

type ProfileFlowProps = {
  answers: ProfileAnswers;
  preferredNamePlaceholder?: string;
  uploadErrors: string[];
  startAt?: number;
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
  onToggleReport: (selection: ReportSelection) => void;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
  onReachStep: (step: number) => void;
  onComplete: () => void;
  onClose: () => void | Promise<void>;
  saveError?: string | null;
};

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

function ChipGrid({
  options,
  selected,
  onToggle,
  numbered,
  numberStart = 1,
  hasOther = false,
  disabled = false,
  ariaLabel,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  numbered?: boolean;
  numberStart?: number;
  hasOther?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const displayOptions = hasOther ? [...options, OTHER_OPTION] : options;

  return (
    <div className="pf-chips" role="group" aria-label={ariaLabel}>
      {displayOptions.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={`pf-chip ${isSelected ? "is-selected" : ""}`}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggle(option)}
          >
            {numbered && (option === OTHER_OPTION || index < 9) && (
              <span className="pf-chip-key">{option === OTHER_OPTION ? 0 : numberStart + index}</span>
            )}
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
  numberStart,
}: {
  options: readonly string[];
  value: string;
  onSelect: (option: string) => void;
  label?: string;
  numberStart?: number;
}) {
  return (
    <div className="pf-control">
      {label && (
        <div className="pf-control-head">
          <label>{label}</label>
        </div>
      )}
      <div className="pf-segment" role="group" aria-label={label}>
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`pf-chip ${value === option ? "is-selected" : ""}`}
            aria-pressed={value === option}
            onClick={() => onSelect(option)}
          >
            {numberStart !== undefined && (
              <span className="pf-chip-key">{numberStart + index}</span>
            )}
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

function ReportUploadTile({
  category,
  label,
  helper,
  onAddReports,
}: {
  category: ReportUploadCategory;
  label: string;
  helper?: string;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const Icon = REPORT_ICONS[category];

  return (
    <section className="pf-upload-group" aria-label={label}>
      <button
        type="button"
        className={`pf-report-tile pf-report-upload-tile ${dragOver ? "is-drag" : ""}`}
        aria-label={label}
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
        <span className="pf-report-tile-label">{label}</span>
        {helper && <span className="pf-report-tile-helper">{helper}</span>}
        <span className="pf-report-tile-icon" aria-hidden="true">
          <Icon strokeWidth={1.8} />
        </span>
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

function ReportSelectionGrid({
  answers,
  uploadErrors,
  onToggleReport,
  onAddReports,
  onRemoveReport,
}: {
  answers: ProfileAnswers;
  uploadErrors: string[];
  onToggleReport: (selection: ReportSelection) => void;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
}) {
  return (
    <div className="pf-upload-layout">
      <div className="pf-report-grid" role="group" aria-label="Previous test uploads">
        {REPORT_OPTIONS.map((option) => {
          const selected = answers.reportSelections.includes(option.id);
          const Icon = REPORT_ICONS[option.id];

          if (option.id !== "no_tests") {
            return (
              <ReportUploadTile
                key={option.id}
                category={option.id}
                label={option.label}
                helper={option.helper}
                onAddReports={onAddReports}
              />
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              className={`pf-report-tile ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onToggleReport(option.id)}
            >
              <span className="pf-report-tile-label">{option.label}</span>
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
      {uploadErrors.length > 0 && (
        <ul className="pf-upload-errors" role="alert">
          {uploadErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      <section className="pf-upload-files" aria-label="Files uploaded">
        <h3>Files uploaded</h3>
        <AnimatedUploadedReports
          reports={answers.uploadedReports}
          onRemove={onRemoveReport}
        />
      </section>
    </div>
  );
}

function AnimatedUploadedReports({
  reports,
  onRemove,
}: {
  reports: UploadedReport[];
  onRemove: (id: string) => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number>();
  const animationFrame = useRef<number>();

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return;

    const nextHeight = content.getBoundingClientRect().height;
    const priorHeight = previousHeight.current;
    previousHeight.current = nextHeight;

    if (priorHeight === undefined || Math.abs(priorHeight - nextHeight) < 1) {
      shell.style.height = "auto";
      return;
    }

    shell.style.height = `${priorHeight}px`;
    void shell.offsetHeight;
    animationFrame.current = window.requestAnimationFrame(() => {
      shell.style.height = `${nextHeight}px`;
    });

    return () => {
      if (animationFrame.current !== undefined) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [reports]);

  return (
    <div
      ref={shellRef}
      className="pf-upload-files-shell"
      onTransitionEnd={(event) => {
        if (event.propertyName === "height") event.currentTarget.style.height = "auto";
      }}
    >
      <div ref={contentRef} className="pf-upload-files-content">
        {reports.length > 0 ? (
          <UploadedReportGrid reports={reports} onRemove={onRemove} />
        ) : (
          <p className="pf-upload-files-empty">-</p>
        )}
      </div>
    </div>
  );
}

function UploadedReportTile({
  report,
  onRemove,
  elementRef,
}: {
  report: UploadedReport;
  onRemove: (id: string) => void;
  elementRef: (node: HTMLElement | null) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const removeTimer = useRef<ReturnType<typeof setTimeout>>();
  const Icon = REPORT_FILE_ICONS[report.kind];
  const ext = report.name.includes(".") ? report.name.split(".").pop()?.toUpperCase() : report.kind;
  const uploading = report.status === "uploading";

  const openDocument = async () => {
    if (!report.storagePath) return;
    const { createDocumentSignedUrl } = await import("../../../lib/api/healthDocuments");
    const { url } = await createDocumentSignedUrl(report.storagePath);
    if (url) window.open(url, "_blank", "noopener");
  };

  const beginRemove = () => {
    if (removing) return;
    setRemoving(true);
    removeTimer.current = setTimeout(() => onRemove(report.id), 200);
  };

  useEffect(() => () => clearTimeout(removeTimer.current), []);

  return (
    <article
      ref={elementRef}
      className={`pf-report-file pf-report-file--${report.kind} ${removing ? "is-removing" : ""}`}
    >
      <button
        type="button"
        className="pf-report-file-remove"
        aria-label={`Remove ${report.name}`}
        disabled={removing}
        onClick={beginRemove}
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

function UploadedReportGrid({
  reports,
  onRemove,
}: {
  reports: UploadedReport[];
  onRemove: (id: string) => void;
}) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const previousPositions = useRef(new Map<string, DOMRect>());

  const removeWithLayoutMotion = (id: string) => {
    previousPositions.current = new Map(
      Array.from(nodes.current.entries(), ([reportId, node]) => [
        reportId,
        node.getBoundingClientRect(),
      ]),
    );
    onRemove(id);
  };

  useLayoutEffect(() => {
    if (previousPositions.current.size === 0) return;

    for (const [id, node] of nodes.current) {
      const previous = previousPositions.current.get(id);
      if (!previous) continue;
      const next = node.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if ((deltaX || deltaY) && typeof node.animate === "function") {
        node.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 280, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
      }
    }

    previousPositions.current.clear();
  }, [reports]);

  return (
    <div className="pf-report-file-grid">
      {reports.map((report) => (
        <UploadedReportTile
          key={report.id}
          report={report}
          onRemove={removeWithLayoutMotion}
          elementRef={(node) => {
            if (node) nodes.current.set(report.id, node);
            else nodes.current.delete(report.id);
          }}
        />
      ))}
    </div>
  );
}

function StepInputs({
  step,
  answers,
  preferredNamePlaceholder,
  uploadErrors,
  onPatch,
  onToggle,
  onToggleReport,
  onAddReports,
  onRemoveReport,
}: {
  step: StepDef;
  answers: ProfileAnswers;
  preferredNamePlaceholder?: string;
  uploadErrors: string[];
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
  onToggleReport: (selection: ReportSelection) => void;
  onAddReports: (files: FileList | File[], category: ReportUploadCategory) => void;
  onRemoveReport: (id: string) => void;
}) {
  if (step.kind === "reports") {
    return (
      <ReportSelectionGrid
        answers={answers}
        uploadErrors={uploadErrors}
        onToggleReport={onToggleReport}
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
            className="pf-other-input pf-preferred-name-input"
            type="text"
            value={basics.preferredName}
            placeholder={preferredNamePlaceholder}
            autoFocus
            onChange={(event) =>
              onPatch({ basics: { ...basics, preferredName: event.target.value } })
            }
          />
        </div>
        <Segment
          label="Gender"
          options={["Male", "Female"]}
          value={basics.sex}
          onSelect={(sex) => {
            const nextSex = sex as "Male" | "Female";
            onPatch({
              basics: { ...basics, sex: nextSex },
              habits: {
                ...answers.habits,
                alcohol: alcoholOptionForSex(answers.habits.alcohol, nextSex),
              },
            });
          }}
        />
        <SliderControl
          label="Age"
          value={basics.age}
          display={basics.age > 80 ? ">80" : `${basics.age}`}
          min={18}
          max={81}
          step={1}
          onChange={(age) => onPatch({ basics: { ...basics, age } })}
        />
        <SliderControl
          label="Height"
          value={basics.heightCm}
          display={basics.heightCm < 140 ? "<140 cm" : basics.heightCm > 220 ? ">220 cm" : `${basics.heightCm} cm`}
          min={139}
          max={221}
          step={1}
          onChange={(heightCm) => onPatch({ basics: { ...basics, heightCm } })}
        />
        <SliderControl
          label="Weight"
          value={basics.weightKg}
          display={basics.weightKg < 30 ? "<30 kg" : basics.weightKg > 200 ? ">200 kg" : `${basics.weightKg} kg`}
          min={29}
          max={201}
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
          label="Daily average"
          value={lifestyle.sleepHours}
          display={lifestyle.sleepHours < 4 ? "<4 h" : lifestyle.sleepHours > 10 ? ">10 h" : `${lifestyle.sleepHours} h`}
          min={3.5}
          max={10.5}
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
    const alcoholOptions = alcoholOptionsForSex(answers.basics.sex);
    const showSmokingProducts = habits.smoking !== "Never";
    return (
      <div className="pf-controls">
        <Segment
          label="Alcohol"
          options={alcoholOptions}
          numberStart={1}
          value={habits.alcohol}
          onSelect={(alcohol) =>
            onPatch({ habits: { ...habits, alcohol: alcohol as typeof habits.alcohol } })
          }
        />
        <Segment
          label="Smoking and/or vaping"
          options={SMOKING_OPTIONS}
          numberStart={4}
          value={habits.smoking}
          onSelect={(smoking) =>
            onPatch({
              habits: {
                ...habits,
                smoking: smoking as typeof habits.smoking,
                smokingProducts: smoking === "Never" ? [] : habits.smokingProducts,
              },
            })
          }
        />
        <div
          className={`pf-other-reveal pf-habit-product-reveal ${showSmokingProducts ? "is-open" : ""}`}
          aria-hidden={!showSmokingProducts}
        >
          <div className="pf-other-reveal-inner">
            <div className="pf-habit-product-options">
              <div className="pf-control-head">
                <label>What types of products?</label>
              </div>
              <ChipGrid
                ariaLabel="What types of products?"
                options={[...SMOKING_PRODUCT_OPTIONS]}
                selected={habits.smokingProducts}
                numbered
                numberStart={8}
                disabled={!showSmokingProducts}
                onToggle={(product) => {
                  const smokingProduct = product as (typeof habits.smokingProducts)[number];
                  const selected = habits.smokingProducts.includes(smokingProduct);
                  onPatch({
                    habits: {
                      ...habits,
                      smokingProducts: selected
                        ? habits.smokingProducts.filter((item) => item !== smokingProduct)
                        : [...habits.smokingProducts, smokingProduct],
                    },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-select chips (reason / goals / symptoms / family / supplements / allergies).
  const key = step.kind === "supplements" ? "supplements" : (step.id as ToggleListKey);
  const otherAnswerKey = OTHER_ANSWER_KEYS[key];
  const showOtherInput = Boolean(step.allowsOther && answers[key].includes(OTHER_OPTION));

  return (
    <div className="pf-controls pf-choice-controls">
      <ChipGrid
        numbered
        hasOther={step.allowsOther}
        options={step.options ?? []}
        selected={answers[key]}
        onToggle={(option) => onToggle(key, option)}
      />
      <div
        className={`pf-other-reveal ${showOtherInput ? "is-open" : ""}`}
        aria-hidden={!showOtherInput}
      >
        <div className="pf-other-reveal-inner">
          <input
            className="pf-other-input pf-other-detail-input"
            type="text"
            aria-label={`Other ${step.summaryLabel.toLowerCase()}`}
            placeholder={step.otherPlaceholder}
            value={answers[otherAnswerKey]}
            disabled={!showOtherInput}
            tabIndex={showOtherInput ? 0 : -1}
            onChange={(event) => onPatch({ [otherAnswerKey]: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileFlow({
  answers,
  preferredNamePlaceholder,
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
  saveError = null,
}: ProfileFlowProps) {
  const [stepIndex, setStepIndex] = useState(Math.min(startAt ?? 0, STEP_COUNT - 1));
  const [whyOpen, setWhyOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const step = STEPS[stepIndex];

  const canContinue = useMemo(() => {
    if (step.kind === "reports") {
      return answers.reportSelections.includes("no_tests") || answers.uploadedReports.length > 0;
    }
    if (step.kind === "chips" && step.required) {
      const key = step.id as "reason" | "goals" | "symptoms" | "family";
      if (answers[key].length === 0) return false;
      if (
        key === "reason" &&
        answers.reason.length === 1 &&
        answers.reason.includes(OTHER_OPTION)
      ) {
        return answers.reasonOther.trim().length > 0;
      }
      return true;
    }
    return true;
  }, [step, answers]);

  const advance = () => {
    if (!canContinue) return;
    const target = stepIndex + 1;
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
      if (event.key === "Escape") void onClose();
      if (event.key === "ArrowLeft" && !inText) back();
      // 1–9 toggles numbered choices; 0 opens the conditional “Other” field.
      if (!inText && /^[0-9]$/.test(event.key)) {
        if (step.kind === "habits") {
          const shortcut = Number(event.key);
          const alcoholOptions = alcoholOptionsForSex(answers.basics.sex);
          if (shortcut >= 1 && shortcut <= 3) {
            const alcohol = alcoholOptions[shortcut - 1];
            onPatch({ habits: { ...answers.habits, alcohol } });
          } else if (shortcut >= 4 && shortcut <= 7) {
            const smoking = SMOKING_OPTIONS[shortcut - 4];
            onPatch({
              habits: {
                ...answers.habits,
                smoking,
                smokingProducts: smoking === "Never" ? [] : answers.habits.smokingProducts,
              },
            });
          } else if (shortcut >= 8 && shortcut <= 9 && answers.habits.smoking !== "Never") {
            const product = SMOKING_PRODUCT_OPTIONS[shortcut - 8];
            const selected = answers.habits.smokingProducts.includes(product);
            onPatch({
              habits: {
                ...answers.habits,
                smokingProducts: selected
                  ? answers.habits.smokingProducts.filter((item) => item !== product)
                  : [...answers.habits.smokingProducts, product],
              },
            });
          }
          return;
        }
        const options = step.options;
        if (!options || (step.kind !== "chips" && step.kind !== "supplements")) return;
        const option = event.key === "0"
          ? (step.allowsOther ? OTHER_OPTION : undefined)
          : options[Number(event.key) - 1];
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
    stepIndex === STEP_COUNT - 1;

  return (
    <div className="pf-flow" role="dialog" aria-label="Health profile">
      <div className="pf-flow-top">
        <span className="pf-flow-wordmark">Verae</span>
        <div className="pf-flow-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <button className="pf-flow-close" type="button" onClick={() => void onClose()}>
          Save &amp; Close
        </button>
      </div>

      {saveError && <p className="auth-error" role="alert">Couldn't save your changes ({saveError}). Retry Save &amp; close.</p>}

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
            preferredNamePlaceholder={preferredNamePlaceholder}
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
