// ─── Doctor Review Brief · state hook ─────────────────────────────────────────
// Owns the captured answers + the flow position, persists everything to
// localStorage so the member can leave and resume, and derives the living brief.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_INTAKE_STEP_COUNT,
  BASE_QUESTION_COUNT,
  buildFlow,
  REPORT_FORK_VALUES,
} from "./questions";
import type { FlowStep } from "./questions";
import {
  buildBriefSections,
  computeAttachments,
  computeBriefSummary,
  computeDoctorHighlights,
  detectCategory,
} from "./briefEngine";
import { buildAdaptiveQueue } from "./questionRules";
import { useBriefPipeline } from "./useBriefPipeline";
import type { PipelineStatus } from "./useBriefPipeline";
import type {
  AgentStep,
  AnsweredDynamicQuestion,
  AttachmentCard,
  BriefSynthesis,
  DocumentInsight,
  DoctorHighlight,
  DynamicQuestion,
  IntakeState,
  LifestyleSnapshot,
  ReportUploadType,
  RenderSection,
  SupplementsAndMeds,
  UploadCategory,
  UploadedFile,
} from "./types";

const STORAGE_KEY = "genh_drb_v3";
const STORAGE_KEY_V2 = "genh_drb_v2";
const LEGACY_STORAGE_KEY = "genh_drb_v1";

export type Phase = "intake" | "preview" | "booking" | "confirmation";

type Persisted = { state: IntakeState; phase: Phase; stepIndex: number };

function createInitialState(): IntakeState {
  const now = new Date().toISOString();
  return {
    uploadedFiles: [],
    reportSelections: [],
    reason: [],
    contextAnswers: {},
    goals: [],
    symptoms: [],
    lifestyle: {},
    supplementsAndMeds: {},
    answeredDynamicQuestions: [],
    synthesisStatus: "idle",
    createdAt: now,
    updatedAt: now,
  };
}

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
      return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadPersisted(): Persisted | null {
  try {
    // Best-effort migration: answers, files, and insights carry over; old
    // synthesis/queue payloads are dropped because the brief now composes once
    // at the finale with a v3 shape.
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY_V2) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!parsed || !parsed.state) return null;
    const isLegacy = !localStorage.getItem(STORAGE_KEY);
    const state = { ...parsed.state };
    if (isLegacy) {
      delete state.briefSynthesis;
      delete state.synthesisStatus;
    }
    // Merge onto a fresh base so older/partial payloads stay valid.
    return {
      state: { ...createInitialState(), ...state },
      phase: parsed.phase ?? "intake",
      stepIndex: parsed.stepIndex ?? 0,
    };
  } catch {
    return null;
  }
}

function normalizeInsight(insight: DocumentInsight): DocumentInsight {
  return {
    fileId: insight.fileId,
    documentType: insight.documentType ?? "",
    provider: insight.provider ?? null,
    reportDate: insight.reportDate ?? null,
    textExcerpt: insight.textExcerpt ?? "",
    sections: insight.sections ?? [],
    markers: insight.markers ?? [],
    visibleMarkers: insight.visibleMarkers ?? [],
    flaggedMarkers: insight.flaggedMarkers ?? [],
    doctorReviewAreas: insight.doctorReviewAreas ?? [],
    patientFacingSummary: insight.patientFacingSummary ?? "",
    question: insight.question ?? "",
    contextQuestions: insight.contextQuestions ?? [],
    questionId: insight.questionId,
    // A persisted 'analyzing' insight means the stream was lost on page close.
    status: insight.status === "analyzing" ? "error" : insight.status,
  };
}

/** Drops persisted synthesis payloads that predate the structured-brief shape. */
function normalizeSynthesis(
  synthesis: BriefSynthesis | undefined,
): BriefSynthesis | undefined {
  if (!synthesis) return undefined;
  const isCurrentShape =
    Array.isArray(synthesis.outOfRange) &&
    Array.isArray(synthesis.patientContext) &&
    typeof synthesis.sourceSignature === "string" &&
    typeof synthesis.progress?.outOfRangeCount === "number";
  if (!isCurrentShape) return undefined;
  return {
    ...synthesis,
    status: synthesis.status === "synthesizing" ? "idle" : synthesis.status,
  };
}

function normalizeState(input: IntakeState): IntakeState {
  const base = { ...createInitialState(), ...input };
  const reportSelections =
    base.reportSelections ??
    (base.hasReports === "reports" ||
    base.hasReports === "genetic_reports" ||
    base.hasReports === "wearable_only"
      ? ([base.hasReports] as ReportUploadType[])
      : []);
  const fixed: Record<string, DocumentInsight> = {};
  for (const [id, ins] of Object.entries(base.aiDocumentInsights ?? {})) {
    fixed[id] = normalizeInsight(ins);
  }
  const uploadsAreUnconfirmed =
    base.uploadedFiles.length > 0 && !base.uploadsConfirmedAt;
  const briefSynthesis = uploadsAreUnconfirmed
    ? undefined
    : normalizeSynthesis(base.briefSynthesis);
  return {
    ...base,
    reportSelections,
    aiDocumentInsights: uploadsAreUnconfirmed ? {} : fixed,
    briefSynthesis,
    answeredDynamicQuestions: base.answeredDynamicQuestions ?? [],
    synthesisStatus: uploadsAreUnconfirmed
      ? "idle"
      : base.synthesisStatus === "synthesizing"
        ? "idle"
        : (base.synthesisStatus ?? briefSynthesis?.status ?? "idle"),
  };
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
  highlights: DoctorHighlight[];
  attachments: AttachmentCard[];
  aiAnalyzing: boolean; // true while any file is being analysed
  briefSynthesis?: BriefSynthesis;
  dynamicQuestionQueue: DynamicQuestion[];
  answeredDynamicQuestions: AnsweredDynamicQuestion[];
  progress: { current: number; total: number };
  questionCounter: { n: number; of: number } | null;
  // pipeline (agent activity)
  agentSteps: AgentStep[];
  pipelineStatus: PipelineStatus;
  retryExtraction: () => void;
  generateBrief: () => Promise<"reused" | "generated" | "running" | "error">;
  // mutations
  setReportFork: (optionIndex: number) => void;
  toggleMulti: (field: "reason" | "goals" | "symptoms", value: string) => void;
  setFreeText: (
    field: "reasonFreeText" | "goalsFreeText" | "symptomsFreeText",
    value: string,
  ) => void;
  patchLifestyle: (patch: Partial<LifestyleSnapshot>) => void;
  patchSupplements: (patch: Partial<SupplementsAndMeds>) => void;
  setContextAnswer: (questionId: string, value: string) => void;
  setDynamicAnswer: (
    questionId: string,
    prompt: string,
    answer: string,
  ) => void;
  addFiles: (files: FileList | File[], category?: UploadCategory) => void;
  removeFile: (id: string) => void;
  // navigation
  next: () => void;
  back: () => void;
  goToPhase: (phase: Phase) => void;
  goToQuestion: (questionId: string) => void;
  reset: () => void;
};

export function useIntakeState(opts?: {
  initialPhase?: Phase;
}): IntakeController {
  const [persisted] = useState<Persisted | null>(loadPersisted);
  // On hydration, reset any stale 'analyzing' insights to 'error' (the API call was lost on page close)
  const [state, setState] = useState<IntakeState>(() => {
    return normalizeState(persisted?.state ?? createInitialState());
  });
  const [phase, setPhase] = useState<Phase>(
    opts?.initialPhase ?? persisted?.phase ?? "intake",
  );
  const [stepIndex, setStepIndex] = useState<number>(persisted?.stepIndex ?? 0);

  // Persist on any change.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, phase, stepIndex } satisfies Persisted),
      );
    } catch {
      /* storage full / unavailable — non-fatal for MVP */
    }
  }, [state, phase, stepIndex]);

  // Holds actual File objects between addFiles() and the async analysis call.
  // Not state — File objects can't be serialized, and changes shouldn't re-render.
  const fileObjectsRef = useRef<Map<string, File>>(new Map());

  const flow = useMemo(() => buildFlow(state), [state]);
  const dynamicQuestionQueue = useMemo(
    () => buildAdaptiveQueue(state),
    [state],
  );
  const sections = useMemo(() => buildBriefSections(state), [state]);
  const summary = useMemo(() => computeBriefSummary(state), [state]);
  const highlights = useMemo(() => computeDoctorHighlights(state), [state]);
  const attachments = useMemo(() => computeAttachments(state), [state]);
  const aiAnalyzing = useMemo(
    () =>
      Object.values(state.aiDocumentInsights ?? {}).some(
        (i) => i.status === "analyzing",
      ),
    [state.aiDocumentInsights],
  );

  const pipeline = useBriefPipeline({
    state,
    setState,
    fileObjects: fileObjectsRef,
  });

  const boundedIndex = Math.min(stepIndex, Math.max(0, flow.length - 1));
  const currentStep = flow[boundedIndex];
  const isLastIntakeStep = boundedIndex >= flow.length - 1;
  const progressTotal = !state.hasReports
    ? BASE_INTAKE_STEP_COUNT
    : Math.max(1, flow.length);
  const progress = {
    current: flow.length === 0 ? 0 : boundedIndex + 1,
    total: progressTotal,
  };
  const questionSteps = flow.filter((s) => s.kind === "question");
  const questionTotal = Math.max(BASE_QUESTION_COUNT, questionSteps.length);
  const currentQuestionIndex =
    currentStep?.kind === "question"
      ? questionSteps.findIndex((s) => s.key === currentStep.key)
      : -1;
  const questionCounter =
    currentQuestionIndex >= 0
      ? { n: currentQuestionIndex + 1, of: questionTotal }
      : null;

  const generatingRef = useRef(false);
  useEffect(() => {
    if (phase !== "intake" || currentStep?.kind !== "generating") {
      generatingRef.current = false;
      return;
    }
    if (generatingRef.current) return;
    generatingRef.current = true;
    let cancelled = false;
    void pipeline.generateBrief().then((result) => {
      if (cancelled || result === "running" || result === "error") return;
      const delay =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? 0
          : result === "reused"
            ? 0
            : 700;
      window.setTimeout(() => {
        if (!cancelled) setPhase("preview");
      }, delay);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.kind, phase]);

  useEffect(() => {
    if (phase !== "preview") return;
    if (state.briefSynthesis?.status === "ready") return;
    const idx = flow.findIndex((s) => s.kind === "generating");
    setPhase("intake");
    setStepIndex(idx >= 0 ? idx : Math.max(0, flow.length - 1));
  }, [flow, phase, state.briefSynthesis?.status]);

  const mutate = useCallback((patch: Partial<IntakeState>) => {
    setState((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setReportFork = useCallback(
    (optionIndex: number) => {
      const value = REPORT_FORK_VALUES[optionIndex];
      if (value === "no_reports") {
        mutate({ hasReports: "no_reports", reportSelections: [] });
        return;
      }

      setState((prev) => {
        const current = prev.reportSelections ?? [];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return {
          ...prev,
          hasReports: next.length > 0 ? next[0] : undefined,
          reportSelections: next,
          updatedAt: new Date().toISOString(),
        };
      });
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
        return {
          ...prev,
          [field]: nextValues,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const setFreeText = useCallback(
    (
      field: "reasonFreeText" | "goalsFreeText" | "symptomsFreeText",
      value: string,
    ) => {
      mutate({ [field]: value } as Partial<IntakeState>);
    },
    [mutate],
  );

  const patchLifestyle = useCallback((patch: Partial<LifestyleSnapshot>) => {
    setState((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, ...patch },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const patchSupplements = useCallback((patch: Partial<SupplementsAndMeds>) => {
    setState((prev) => ({
      ...prev,
      supplementsAndMeds: { ...prev.supplementsAndMeds, ...patch },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setContextAnswer = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      contextAnswers: { ...prev.contextAnswers, [questionId]: value },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setDynamicAnswer = useCallback(
    (questionId: string, prompt: string, answer: string) => {
      setState((prev) => {
        const trimmed = answer.trim();
        const rest = (prev.answeredDynamicQuestions ?? []).filter(
          (q) => q.questionId !== questionId,
        );
        return {
          ...prev,
          answeredDynamicQuestions: trimmed
            ? [
                ...rest,
                {
                  questionId,
                  prompt,
                  answer: trimmed,
                  answeredAt: new Date().toISOString(),
                },
              ]
            : rest,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const addFiles = useCallback(
    (files: FileList | File[], category?: UploadCategory) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const mapped: UploadedFile[] = incoming.map((f) => ({
        id: uid(),
        name: f.name,
        type: f.type || "application/octet-stream",
        size: f.size,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
        detectedCategory: category ?? detectCategory(f.name, f.type),
      }));

      // Keep File objects alive for the async analysis calls below
      mapped.forEach((meta, i) =>
        fileObjectsRef.current.set(meta.id, incoming[i]),
      );

      setState((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...mapped],
        uploadsConfirmedAt: undefined,
        briefSynthesis: undefined,
        synthesisStatus: "idle",
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    fileObjectsRef.current.delete(id);
    setState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...remainingInsights } =
        prev.aiDocumentInsights ?? {};
      const remainingFiles = prev.uploadedFiles.filter((f) => f.id !== id);
      return {
        ...prev,
        uploadedFiles: remainingFiles,
        aiDocumentInsights: remainingInsights,
        briefSynthesis:
          remainingFiles.length > 0 ? prev.briefSynthesis : undefined,
        synthesisStatus:
          remainingFiles.length > 0 ? prev.synthesisStatus : "idle",
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const next = useCallback(() => {
    if (phase === "intake") {
      if (
        currentStep?.kind === "upload" &&
        state.uploadedFiles.length > 0 &&
        !state.uploadsConfirmedAt
      ) {
        pipeline.runExtraction();
        setStepIndex((i) => Math.min(i + 1, flow.length));
        return;
      }
      if (currentStep?.kind === "generating") {
        if (state.briefSynthesis?.status === "ready") setPhase("preview");
        return;
      }
      setStepIndex((i) => {
        if (i < flow.length - 1) return i + 1;
        return i;
      });
      return;
    }
    if (phase === "preview") setPhase("booking");
    else if (phase === "booking") setPhase("confirmation");
  }, [
    pipeline,
    currentStep?.kind,
    phase,
    flow.length,
    state.briefSynthesis?.status,
    state.uploadedFiles.length,
    state.uploadsConfirmedAt,
  ]);

  const back = useCallback(() => {
    if (phase === "confirmation") return setPhase("booking");
    if (phase === "booking") return setPhase("preview");
    if (phase === "preview") {
      const lastQuestion = [...flow]
        .map((step, index) => ({ step, index }))
        .reverse()
        .find(({ step }) => step.kind === "question");
      setPhase("intake");
      setStepIndex(lastQuestion?.index ?? Math.max(0, flow.length - 2));
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }, [flow, phase]);

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
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* noop */
    }
    pipeline.cancel();
    setState(createInitialState());
    setPhase("intake");
    setStepIndex(0);
  }, [pipeline]);

  return {
    state,
    phase,
    stepIndex: boundedIndex,
    flow,
    currentStep,
    isLastIntakeStep,
    sections,
    summary,
    highlights,
    attachments,
    aiAnalyzing,
    briefSynthesis: state.briefSynthesis,
    dynamicQuestionQueue,
    answeredDynamicQuestions: state.answeredDynamicQuestions ?? [],
    progress,
    questionCounter,
    agentSteps: pipeline.agentSteps,
    pipelineStatus: pipeline.pipelineStatus,
    retryExtraction: pipeline.runExtraction,
    generateBrief: pipeline.generateBrief,
    setReportFork,
    toggleMulti,
    setFreeText,
    patchLifestyle,
    patchSupplements,
    setContextAnswer,
    setDynamicAnswer,
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
    localStorage.removeItem(STORAGE_KEY_V2);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** Lightweight read-only check for the Profile entry card (resume vs start). */
export function readHasSavedProgress(): boolean {
  const p = loadPersisted();
  if (!p) return false;
  return (
    !!p.state.hasReports ||
    p.phase !== "intake" ||
    buildBriefSections(p.state).length > 0
  );
}

/** Returns brief status for the Profile entry card after booking is complete. */
export function readBriefStatus(): {
  isBooked: boolean;
  areasCaptured: number;
  filesUploaded: number;
} | null {
  const p = loadPersisted();
  if (!p) return null;
  const summary = computeBriefSummary(p.state);
  return {
    isBooked: p.phase === "confirmation",
    areasCaptured: summary.areasCaptured,
    filesUploaded: summary.filesUploaded,
  };
}
