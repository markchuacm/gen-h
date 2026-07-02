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
import { analyzeDocument } from "./documentAnalysis";
import { synthesizeBrief, synthesisSignature } from "./briefSynthesis";
import type {
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

const STORAGE_KEY = "genh_drb_v1";

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
    documentExtractions: {},
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

function normalizeInsight(insight: DocumentInsight): DocumentInsight {
  return {
    fileId: insight.fileId,
    documentType: insight.documentType ?? "",
    provider: insight.provider ?? null,
    reportDate: insight.reportDate ?? null,
    textExcerpt: insight.textExcerpt ?? "",
    sections: insight.sections ?? [],
    visibleMarkers: insight.visibleMarkers ?? [],
    flaggedMarkers: insight.flaggedMarkers ?? [],
    doctorReviewAreas: insight.doctorReviewAreas ?? [],
    patientFacingSummary: insight.patientFacingSummary ?? "",
    question: insight.question ?? "",
    questionId: insight.questionId,
    status: insight.status === "analyzing" ? "error" : insight.status,
  };
}

function createPendingInsight(fileId: string): DocumentInsight {
  return {
    fileId,
    documentType: "",
    provider: null,
    reportDate: null,
    textExcerpt: "",
    sections: [],
    visibleMarkers: [],
    flaggedMarkers: [],
    doctorReviewAreas: [],
    patientFacingSummary: "",
    question: "",
    questionId: `ai_q_${fileId.slice(0, 8)}`,
    status: "analyzing",
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
  const sourceInsights =
    base.aiDocumentInsights ?? base.documentExtractions ?? {};
  for (const [id, ins] of Object.entries(sourceInsights)) {
    fixed[id] = normalizeInsight(ins);
  }
  const uploadsAreUnconfirmed =
    base.uploadedFiles.length > 0 && !base.uploadsConfirmedAt;
  const briefSynthesis =
    uploadsAreUnconfirmed || !base.briefSynthesis
      ? undefined
      : {
          ...base.briefSynthesis,
          status:
            base.briefSynthesis.status === "synthesizing"
              ? "idle"
              : base.briefSynthesis.status,
        };
  return {
    ...base,
    reportSelections,
    aiDocumentInsights: uploadsAreUnconfirmed ? {} : fixed,
    documentExtractions: uploadsAreUnconfirmed ? {} : fixed,
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
  const synthSignature = useMemo(() => synthesisSignature(state), [state]);
  const lastSynthesisSignatureRef = useRef<string>("");
  const synthesisRunIdRef = useRef(0);

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

  useEffect(() => {
    const hasUploadedDocs = state.uploadedFiles.length > 0;
    const uploadsConfirmed = !hasUploadedDocs || !!state.uploadsConfirmedAt;
    if (!uploadsConfirmed) return;

    const hasCompletedExtraction = Object.values(
      state.aiDocumentInsights ?? {},
    ).some(
      (i) =>
        i.status === "done" ||
        i.status === "needs_review" ||
        i.status === "error",
    );
    const hasUsefulAnswer =
      state.reason.length > 0 ||
      !!state.reasonFreeText?.trim() ||
      state.goals.length > 0 ||
      !!state.goalsFreeText?.trim() ||
      state.symptoms.length > 0 ||
      !!state.symptomsFreeText?.trim() ||
      Object.values(state.contextAnswers).some((v) => v.trim()) ||
      (state.answeredDynamicQuestions ?? []).some((q) => q.answer.trim());

    if (aiAnalyzing || (!hasCompletedExtraction && !hasUsefulAnswer)) return;
    if (lastSynthesisSignatureRef.current === synthSignature) return;

    lastSynthesisSignatureRef.current = synthSignature;
    const runId = synthesisRunIdRef.current + 1;
    synthesisRunIdRef.current = runId;
    const snapshot = state;

    setState((prev) => ({
      ...prev,
      synthesisStatus: "synthesizing",
      briefSynthesis: {
        ...(prev.briefSynthesis ?? {
          narrative: "",
          themes: [],
          progress: { themesPrepared: 0, markersRead: 0, questionsQueued: 0 },
        }),
        status: "synthesizing",
      },
      updatedAt: new Date().toISOString(),
    }));

    synthesizeBrief(snapshot, snapshot.answeredDynamicQuestions ?? [])
      .then((result) => {
        if (synthesisRunIdRef.current !== runId) return;
        const queue = result.nextQuestion ? [result.nextQuestion] : [];
        setState((prev) => ({
          ...prev,
          briefSynthesis: result,
          dynamicQuestionQueue: queue,
          synthesisStatus: result.status,
          updatedAt: new Date().toISOString(),
        }));
      })
      .catch((error: unknown) => {
        if (synthesisRunIdRef.current !== runId) return;
        const message =
          error instanceof Error ? error.message : "Brief synthesis failed.";
        setState((prev) => ({
          ...prev,
          synthesisStatus: "error",
          briefSynthesis: {
            ...(prev.briefSynthesis ?? {
              narrative: "",
              themes: [],
              progress: {
                themesPrepared: 0,
                markersRead: 0,
                questionsQueued: 0,
              },
            }),
            status: "error",
            error: message,
          },
          updatedAt: new Date().toISOString(),
        }));
      });
  }, [aiAnalyzing, synthSignature]);

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

  const confirmUploadsForAnalysis = useCallback(() => {
    const now = new Date().toISOString();
    const filesToAnalyze = state.uploadedFiles.filter((meta) => {
      const existing = state.aiDocumentInsights?.[meta.id];
      if (existing?.status === "done" || existing?.status === "analyzing") {
        return false;
      }
      return fileObjectsRef.current.has(meta.id);
    });

    if (state.uploadedFiles.length === 0) {
      setState((prev) => ({
        ...prev,
        uploadsConfirmedAt: now,
        updatedAt: now,
      }));
      return;
    }

    const initialInsights: Record<string, DocumentInsight> = {};
    filesToAnalyze.forEach((meta) => {
      initialInsights[meta.id] = createPendingInsight(meta.id);
    });

    setState((prev) => ({
      ...prev,
      uploadsConfirmedAt: now,
      aiDocumentInsights: {
        ...(prev.aiDocumentInsights ?? {}),
        ...initialInsights,
      },
      documentExtractions: {
        ...(prev.documentExtractions ?? {}),
        ...initialInsights,
      },
      briefSynthesis:
        filesToAnalyze.length > 0 ? undefined : prev.briefSynthesis,
      dynamicQuestionQueue:
        filesToAnalyze.length > 0 ? [] : prev.dynamicQuestionQueue,
      synthesisStatus:
        filesToAnalyze.length > 0 ? "idle" : prev.synthesisStatus,
      updatedAt: now,
    }));

    // Fire analysis calls through our backend endpoint only after user confirmation.
    filesToAnalyze.forEach((meta) => {
      const file = fileObjectsRef.current.get(meta.id);
      if (!file) return;

      analyzeDocument(file, meta.detectedCategory)
        .then((result) => {
          fileObjectsRef.current.delete(meta.id);
          setState((prev) => ({
            ...prev,
            aiDocumentInsights: {
              ...(prev.aiDocumentInsights ?? {}),
              [meta.id]: {
                fileId: meta.id,
                documentType: result.documentType,
                provider: result.provider,
                reportDate: result.reportDate,
                textExcerpt: result.textExcerpt,
                sections: result.sections,
                visibleMarkers: result.visibleMarkers,
                flaggedMarkers: result.flaggedMarkers,
                doctorReviewAreas: result.doctorReviewAreas,
                patientFacingSummary: result.patientFacingSummary,
                question: result.question,
                questionId: `ai_q_${meta.id.slice(0, 8)}`,
                status:
                  result.extractionStatus === "extracted"
                    ? "done"
                    : "needs_review",
              },
            },
            documentExtractions: {
              ...(prev.documentExtractions ?? {}),
              [meta.id]: {
                fileId: meta.id,
                documentType: result.documentType,
                provider: result.provider,
                reportDate: result.reportDate,
                textExcerpt: result.textExcerpt,
                sections: result.sections,
                visibleMarkers: result.visibleMarkers,
                flaggedMarkers: result.flaggedMarkers,
                doctorReviewAreas: result.doctorReviewAreas,
                patientFacingSummary: result.patientFacingSummary,
                question: result.question,
                questionId: `ai_q_${meta.id.slice(0, 8)}`,
                status:
                  result.extractionStatus === "extracted"
                    ? "done"
                    : "needs_review",
              },
            },
            updatedAt: new Date().toISOString(),
          }));
        })
        .catch(() => {
          fileObjectsRef.current.delete(meta.id);
          setState((prev) => ({
            ...prev,
            aiDocumentInsights: {
              ...(prev.aiDocumentInsights ?? {}),
              [meta.id]: {
                ...(prev.aiDocumentInsights?.[meta.id] ?? {
                  fileId: meta.id,
                  documentType: "",
                  provider: null,
                  reportDate: null,
                  textExcerpt: "",
                  sections: [],
                  visibleMarkers: [],
                  flaggedMarkers: [],
                  doctorReviewAreas: [],
                  patientFacingSummary: "",
                  question: "",
                  questionId: `ai_q_${meta.id.slice(0, 8)}`,
                }),
                status: "error",
              },
            },
            documentExtractions: {
              ...(prev.documentExtractions ?? {}),
              [meta.id]: {
                ...(prev.aiDocumentInsights?.[meta.id] ?? {
                  fileId: meta.id,
                  documentType: "",
                  provider: null,
                  reportDate: null,
                  sections: [],
                  visibleMarkers: [],
                  flaggedMarkers: [],
                  doctorReviewAreas: [],
                  patientFacingSummary: "",
                  question: "",
                  questionId: `ai_q_${meta.id.slice(0, 8)}`,
                }),
                status: "error",
              },
            },
            updatedAt: new Date().toISOString(),
          }));
        });
    });
  }, [state.aiDocumentInsights, state.uploadedFiles]);

  const removeFile = useCallback((id: string) => {
    fileObjectsRef.current.delete(id);
    setState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...remainingInsights } =
        prev.aiDocumentInsights ?? {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedExtraction, ...remainingExtractions } =
        prev.documentExtractions ?? {};
      const remainingFiles = prev.uploadedFiles.filter((f) => f.id !== id);
      return {
        ...prev,
        uploadedFiles: remainingFiles,
        aiDocumentInsights: remainingInsights,
        documentExtractions: remainingExtractions,
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
        confirmUploadsForAnalysis();
        return;
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
    confirmUploadsForAnalysis,
    currentStep?.kind,
    phase,
    flow.length,
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
    highlights,
    attachments,
    aiAnalyzing,
    briefSynthesis: state.briefSynthesis,
    dynamicQuestionQueue: state.dynamicQuestionQueue ?? [],
    answeredDynamicQuestions: state.answeredDynamicQuestions ?? [],
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
