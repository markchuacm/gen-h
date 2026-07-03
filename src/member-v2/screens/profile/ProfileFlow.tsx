import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  ALCOHOL_OPTIONS,
  DIET_OPTIONS,
  EXERCISE_OPTIONS,
  SMOKING_OPTIONS,
  STEPS,
  STEP_COUNT,
} from "./profileQuestions";
import type { ProfileAnswers, StepDef } from "./profileQuestions";

export type ToggleListKey = "reason" | "goals" | "symptoms" | "family" | "supplements";

type ProfileFlowProps = {
  answers: ProfileAnswers;
  startAt?: number;
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
  onReachStep: (step: number) => void;
  onComplete: () => void;
  onClose: () => void;
};

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

function StepInputs({
  step,
  answers,
  onPatch,
  onToggle,
}: {
  step: StepDef;
  answers: ProfileAnswers;
  onPatch: (patch: Partial<ProfileAnswers>) => void;
  onToggle: (key: ToggleListKey, option: string) => void;
}) {
  if (step.kind === "basics") {
    const { basics } = answers;
    return (
      <div className="pf-controls">
        <Segment
          label="Sex"
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
  startAt,
  onPatch,
  onToggle,
  onReachStep,
  onComplete,
  onClose,
}: ProfileFlowProps) {
  const [stepIndex, setStepIndex] = useState(Math.min(startAt ?? 0, STEP_COUNT - 1));
  const [whyOpen, setWhyOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const step = STEPS[stepIndex];

  const canContinue = useMemo(() => {
    if (step.kind === "chips" && step.required) {
      const key = step.id as "reason" | "goals" | "symptoms" | "family";
      return answers[key].length > 0;
    }
    return true;
  }, [step, answers]);

  const advance = () => {
    if (!canContinue) return;
    if (stepIndex === STEP_COUNT - 1) {
      setComposing(true);
      return;
    }
    onReachStep(stepIndex + 1);
    setStepIndex(stepIndex + 1);
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
      if (event.key === "Enter" && !inText) {
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
      // 1–9 toggles chips on chip steps.
      if (!inText && /^[1-9]$/.test(event.key)) {
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

  return (
    <div className="pf-flow" role="dialog" aria-label="Health profile">
      <div className="pf-flow-top">
        <span className="pf-flow-wordmark">Gen-H</span>
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
          <StepInputs step={step} answers={answers} onPatch={onPatch} onToggle={onToggle} />
          {step.whyWeAsk && (
            <div className="pf-why">
              <button type="button" onClick={() => setWhyOpen((open) => !open)}>
                Why we ask
              </button>
              {whyOpen && <p>{step.whyWeAsk}</p>}
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
            {stepIndex === STEP_COUNT - 1 ? "Finish" : "Continue"}
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
