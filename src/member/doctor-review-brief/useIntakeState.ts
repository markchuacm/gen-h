// ─── Doctor Review Brief · state hook ─────────────────────────────────────────
// Owns the captured answers + the flow position, persists everything to
// localStorage so the member can leave and resume, and derives the living brief.

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildFlow, REPORT_FORK_VALUES } from "./questions";
import type { FlowStep } from "./questions";
import { buildBriefSections, computeBriefSummary, detectCategory } from "./briefEngine";
import type {
  IntakeState,
  LifestyleSnapshot,
  RenderSection,
  SupplementsAndMeds,
  UploadedFile,
} from "./types";

const STORAGE_KEY = "genh_drb_v1";

export type Phase = "intake" | "preview" | "booking" | "confirmation";

type Persisted = { state: IntakeState; phase: Phase; stepIndex: number };

function createInitialState(): IntakeState {
  const now = new Date().toISOString();
  return {
    uploadedFiles: [],
    reason: [],
    contextAnswers: {},
    goals: [],
    symptoms: [],
    lifestyle: {},
    supplementsAndMeds: {},
    createdAt: now,
    updatedAt: now,
  };
}

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!parsed || !parsed.state) return null;
    // Merge onto a fresh base so older/partial payloads stay valid.
    return {
      state: { ...createInitialState(), ...parsed.state },
      phase: parsed.phase ?? "intake",
      stepIndex: parsed.stepIndex ?? 0,
    };
  } catch {
    return null;
  }
}

export type IntakeController = {
  state: IntakeState;
  phase: Phase;
  stepIndex: number;
  flow: FlowStep[];
  currentStep: FlowStep | undefined;
  isLastIntakeStep: boolean;
  sections: RenderSection[];
  summary: ReturnType<typeof computeBriefSummary>;
  // mutations
  setReportFork: (optionIndex: number) => void;
  toggleMulti: (field: "reason" | "goals" | "symptoms", value: string) => void;
  setFreeText: (field: "reasonFreeText" | "goalsFreeText" | "symptomsFreeText", value: string) => void;
  patchLifestyle: (patch: Partial<LifestyleSnapshot>) => void;
  patchSupplements: (patch: Partial<SupplementsAndMeds>) => void;
  setContextAnswer: (questionId: string, value: string) => void;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  // navigation
  next: () => void;
  back: () => void;
  goToPhase: (phase: Phase) => void;
  goToQuestion: (questionId: string) => void;
  reset: () => void;
};

export function useIntakeState(opts?: { initialPhase?: Phase }): IntakeController {
  const [persisted] = useState<Persisted | null>(loadPersisted);
  const [state, setState] = useState<IntakeState>(() => persisted?.state ?? createInitialState());
  const [phase, setPhase] = useState<Phase>(opts?.initialPhase ?? persisted?.phase ?? "intake");
  const [stepIndex, setStepIndex] = useState<number>(persisted?.stepIndex ?? 0);

  // Persist on any change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, phase, stepIndex } satisfies Persisted));
    } catch {
      /* storage full / unavailable — non-fatal for MVP */
    }
  }, [state, phase, stepIndex]);

  const flow = useMemo(() => buildFlow(state), [state]);
  const sections = useMemo(() => buildBriefSections(state), [state]);
  const summary = useMemo(() => computeBriefSummary(state), [state]);

  const boundedIndex = Math.min(stepIndex, Math.max(0, flow.length - 1));
  const currentStep = flow[boundedIndex];
  const isLastIntakeStep = boundedIndex >= flow.length - 1;

  const mutate = useCallback((patch: Partial<IntakeState>) => {
    setState((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const setReportFork = useCallback(
    (optionIndex: number) => {
      mutate({ hasReports: REPORT_FORK_VALUES[optionIndex] });
    },
    [mutate],
  );

  const toggleMulti = useCallback(
    (field: "reason" | "goals" | "symptoms", value: string) => {
      setState((prev) => {
        const current = prev[field];
        const nextValues = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [field]: nextValues, updatedAt: new Date().toISOString() };
      });
    },
    [],
  );

  const setFreeText = useCallback(
    (field: "reasonFreeText" | "goalsFreeText" | "symptomsFreeText", value: string) => {
      mutate({ [field]: value } as Partial<IntakeState>);
    },
    [mutate],
  );

  const patchLifestyle = useCallback(
    (patch: Partial<LifestyleSnapshot>) => {
      setState((prev) => ({
        ...prev,
        lifestyle: { ...prev.lifestyle, ...patch },
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const patchSupplements = useCallback(
    (patch: Partial<SupplementsAndMeds>) => {
      setState((prev) => ({
        ...prev,
        supplementsAndMeds: { ...prev.supplementsAndMeds, ...patch },
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const setContextAnswer = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      contextAnswers: { ...prev.contextAnswers, [questionId]: value },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    setState((prev) => {
      const mapped: UploadedFile[] = incoming.map((f) => ({
        id: uid(),
        name: f.name,
        type: f.type || "application/octet-stream",
        size: f.size,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
        detectedCategory: detectCategory(f.name, f.type),
      }));
      return { ...prev, uploadedFiles: [...prev.uploadedFiles, ...mapped], updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const next = useCallback(() => {
    if (phase === "intake") {
      setStepIndex((i) => {
        if (i < flow.length - 1) return i + 1;
        setPhase("preview");
        return i;
      });
      return;
    }
    if (phase === "preview") setPhase("booking");
    else if (phase === "booking") setPhase("confirmation");
  }, [phase, flow.length]);

  const back = useCallback(() => {
    if (phase === "confirmation") return setPhase("booking");
    if (phase === "booking") return setPhase("preview");
    if (phase === "preview") return setPhase("intake");
    setStepIndex((i) => Math.max(0, i - 1));
  }, [phase]);

  const goToPhase = useCallback((p: Phase) => setPhase(p), []);

  const goToQuestion = useCallback(
    (questionId: string) => {
      const idx = flow.findIndex((s) => s.key === questionId);
      if (idx >= 0) {
        setPhase("intake");
        setStepIndex(idx);
      }
    },
    [flow],
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setState(createInitialState());
    setPhase("intake");
    setStepIndex(0);
  }, []);

  return {
    state,
    phase,
    stepIndex: boundedIndex,
    flow,
    currentStep,
    isLastIntakeStep,
    sections,
    summary,
    setReportFork,
    toggleMulti,
    setFreeText,
    patchLifestyle,
    patchSupplements,
    setContextAnswer,
    addFiles,
    removeFile,
    next,
    back,
    goToPhase,
    goToQuestion,
    reset,
  };
}

/** Clears all saved progress from localStorage. */
export function clearSavedProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** Lightweight read-only check for the Profile entry card (resume vs start). */
export function readHasSavedProgress(): boolean {
  const p = loadPersisted();
  if (!p) return false;
  return !!p.state.hasReports || p.phase !== "intake" || buildBriefSections(p.state).length > 0;
}

/** Returns brief status for the Profile entry card after booking is complete. */
export function readBriefStatus(): { isBooked: boolean; areasCaptured: number; filesUploaded: number } | null {
  const p = loadPersisted();
  if (!p) return null;
  const summary = computeBriefSummary(p.state);
  return {
    isBooked: p.phase === "confirmation",
    areasCaptured: summary.areasCaptured,
    filesUploaded: summary.filesUploaded,
  };
}
