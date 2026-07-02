// ─── Doctor Review Brief · state hook ─────────────────────────────────────────
// Owns the captured answers + the flow position, persists everything to
// localStorage so the member can leave and resume, and derives the living brief.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFlow, REPORT_FORK_VALUES } from "./questions";
import type { FlowStep } from "./questions";
import {
  buildBriefSections,
  computeAttachments,
  computeBriefSummary,
  computeDoctorHighlights,
  detectCategory,
} from "./briefEngine";
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

const STORAGE_KEY = "genh_drb_v2";
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
    dynamicQuestionQueue: [],
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
    // Best-effort v1 migration: answers, files, and insights carry over; the
    // synthesis is dropped (its shape changed) and reruns cheaply on hydrate.
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
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
    Array.isArray(synthesis.nextQuestions) &&
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
    dynamicQuestionQueue: uploadsAreUnconfirmed
      ? []
      : (base.dynamicQuestionQueue ?? []),
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
  // pipeline (agent activity)
  agentSteps: AgentStep[];
  pipelineStatus: PipelineStatus;
  retryPipeline: () => void;
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

  // Resume after a refresh: extracted insights persist, so a missing/stale
  // synthesis just needs one cheap compose-only rerun on hydrate.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const hasInsights = Object.values(state.aiDocumentInsights ?? {}).some(
      (i) => i.status === "done" || i.status === "needs_review",
    );
    if (hasInsights && state.briefSynthesis?.status !== "ready") {
      pipeline.rerunSynthesis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boundedIndex = Math.min(stepIndex, Math.max(0, flow.length - 1));
  const currentStep = flow[boundedIndex];
  const isLastIntakeStep = boundedIndex >= flow.length - 1;

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
        dynamicQuestionQueue: [],
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
        dynamicQuestionQueue:
          remainingFiles.length > 0 ? prev.dynamicQuestionQueue : [],
        synthesisStatus:
          remainingFiles.length > 0 ? prev.synthesisStatus : "idle",
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const next = useCallback(() => {
    if (phase === "intake") {
      if (
        currentStep?.kind === "preparing" &&
        state.uploadedFiles.length > 0 &&
        !state.uploadsConfirmedAt
      ) {
        pipeline.runFullPipeline();
        return;
      }
      // Commit-based synthesis: leaving an answered step is the moment to fold
      // new context into the brief (never per keystroke). The pipeline's
      // signature guard makes an unchanged commit a no-op. Answer-only intakes
      // (no documents) synthesize once, at the end.
      const hasInsights = Object.values(state.aiDocumentInsights ?? {}).some(
        (i) => i.status === "done" || i.status === "needs_review",
      );
      const isLast = stepIndex >= flow.length - 1;
      if (currentStep?.kind === "question" && (hasInsights || isLast)) {
        pipeline.rerunSynthesis();
      }
      setStepIndex((i) => {
        if (i < flow.length - 1) return i + 1;
        setPhase("preview");
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
    stepIndex,
    state.aiDocumentInsights,
    state.uploadedFiles.length,
    state.uploadsConfirmedAt,
  ]);

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
    dynamicQuestionQueue: state.dynamicQuestionQueue ?? [],
    answeredDynamicQuestions: state.answeredDynamicQuestions ?? [],
    agentSteps: pipeline.agentSteps,
    pipelineStatus: pipeline.pipelineStatus,
    retryPipeline: pipeline.runFullPipeline,
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
