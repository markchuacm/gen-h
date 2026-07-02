// ─── Doctor Review Brief · pipeline hook ──────────────────────────────────────
// Owns all AI orchestration: opens the SSE pipeline stream, maps events to
// IntakeState patches (which flow through the existing localStorage persist
// effect, so streamed partials survive a refresh), and drives the agent
// activity feed. useIntakeState composes this hook.
//
// Cost discipline: a full run fires once per upload confirmation; synthesis
// reruns are commit-based (signature compare + running/debounce guards), never
// keystroke-based.

import { useCallback, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { buildProcessRequest, synthesisSignature } from "./briefSynthesis";
import { prepareDocumentPayload } from "./extraction";
import type { DocumentPayload } from "./extraction";
import { matchRules } from "./questionRules";
import { streamBriefPipeline } from "./sse";
import type { PipelineHandlers } from "./sse";
import type {
  AgentStep,
  BriefSynthesis,
  DocumentInsight,
  DynamicQuestion,
  IntakeState,
  MarkerFinding,
} from "./types";

export type PipelineStatus = "idle" | "running" | "done" | "error";

const MAX_QUEUE = 6;
const RERUN_DEBOUNCE_MS = 1500;

const DEFAULT_STEPS: Record<"full" | "synthesis", AgentStep[]> = {
  full: [
    { id: "extract", label: "Reading your documents", status: "pending" },
    {
      id: "classify",
      label: "Checking markers against reference ranges",
      status: "pending",
    },
    {
      id: "compose",
      label: "Connecting the dots across your reports",
      status: "pending",
    },
  ],
  synthesis: [
    {
      id: "compose",
      label: "Weaving your answer into the brief",
      status: "pending",
    },
  ],
};

function questionIdFor(fileId: string): string {
  return `ai_q_${fileId.slice(0, 8)}`;
}

function emptySynthesis(): BriefSynthesis {
  return {
    status: "synthesizing",
    narrative: "",
    themes: [],
    outOfRange: [],
    relationships: [],
    lifestyleContext: [],
    doctorQuestions: [],
    nextQuestions: [],
    progress: {
      documentsRead: 0,
      markersRead: 0,
      outOfRangeCount: 0,
      questionsQueued: 0,
    },
  };
}

function mergeQueue(
  prev: IntakeState,
  incoming: DynamicQuestion[],
  replace = false,
): DynamicQuestion[] {
  const answered = new Set(
    (prev.answeredDynamicQuestions ?? [])
      .filter((q) => q.answer.trim())
      .map((q) => q.questionId),
  );
  const queue = replace ? [] : [...(prev.dynamicQuestionQueue ?? [])];
  for (const question of incoming) {
    if (queue.length >= MAX_QUEUE) break;
    if (answered.has(question.id)) continue;
    if (queue.some((q) => q.id === question.id)) continue;
    queue.push(question);
  }
  return queue;
}

/** Structured findings recoverable from persisted insights (for rules fallback). */
export function findingsFromInsights(state: IntakeState): MarkerFinding[] {
  const findings: MarkerFinding[] = [];
  for (const file of state.uploadedFiles) {
    const insight = state.aiDocumentInsights?.[file.id];
    if (!insight) continue;
    (insight.markers ?? []).forEach((marker, index) => {
      findings.push({
        ...marker,
        id: `${file.id}:m:${index}`,
        sourceFileId: file.id,
        sourceLabel:
          [insight.documentType, insight.provider].filter(Boolean).join(" · ") ||
          file.name,
      });
    });
  }
  return findings;
}

export function useBriefPipeline(args: {
  state: IntakeState;
  setState: Dispatch<SetStateAction<IntakeState>>;
  fileObjects: MutableRefObject<Map<string, File>>;
}) {
  const { state, setState, fileObjects } = args;

  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");

  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const modeRef = useRef<"full" | "synthesis">("full");
  const narrativeStartedRef = useRef(false);
  const lastSignatureRef = useRef<string>("");
  const lastRunAtRef = useRef(0);

  const patchState = useCallback(
    (fn: (prev: IntakeState) => IntakeState) => {
      setState((prev) => fn(prev));
    },
    [setState],
  );

  const patchSynthesis = useCallback(
    (fn: (synthesis: BriefSynthesis) => Partial<BriefSynthesis>) => {
      patchState((prev) => {
        const base = prev.briefSynthesis ?? emptySynthesis();
        return {
          ...prev,
          briefSynthesis: { ...base, ...fn(base) },
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [patchState],
  );

  const buildHandlers = useCallback(
    (runId: number): PipelineHandlers => {
      const active = () => runIdRef.current === runId;
      const partialsEnabled = () => modeRef.current === "full";

      return {
        stage: (event) => {
          if (!active()) return;
          setAgentSteps((prev) =>
            prev.map((step) =>
              step.id === event.stage
                ? {
                    ...step,
                    label: event.label,
                    detail: event.detail,
                    status: event.status === "start" ? "active" : "done",
                  }
                : step,
            ),
          );
        },
        doc: (event) => {
          if (!active()) return;
          if (event.status === "extracting" || !event.insight) return;
          const insight: DocumentInsight = {
            ...event.insight,
            markers: event.insight.markers ?? [],
            questionId: questionIdFor(event.fileId),
            status: event.status === "done" ? "done" : "needs_review",
          };
          patchState((prev) => ({
            ...prev,
            aiDocumentInsights: {
              ...(prev.aiDocumentInsights ?? {}),
              [event.fileId]: insight,
            },
            updatedAt: new Date().toISOString(),
          }));
        },
        finding: ({ finding }) => {
          if (!active() || !partialsEnabled()) return;
          patchSynthesis((s) =>
            s.outOfRange.some((f) => f.id === finding.id)
              ? {}
              : { outOfRange: [...s.outOfRange, finding] },
          );
        },
        relationship: ({ relationship }) => {
          if (!active() || !partialsEnabled()) return;
          patchSynthesis((s) =>
            s.relationships.some((r) => r.id === relationship.id)
              ? {}
              : { relationships: [...s.relationships, relationship] },
          );
        },
        narrative_delta: ({ text }) => {
          if (!active()) return;
          const isFirst = !narrativeStartedRef.current;
          narrativeStartedRef.current = true;
          patchSynthesis((s) => ({
            narrative: isFirst ? text : s.narrative + text,
          }));
        },
        theme: ({ theme }) => {
          if (!active() || !partialsEnabled()) return;
          patchSynthesis((s) =>
            s.themes.some((t) => t.id === theme.id)
              ? {}
              : { themes: [...s.themes, theme] },
          );
        },
        question: ({ question }) => {
          if (!active() || !partialsEnabled()) return;
          patchState((prev) => ({
            ...prev,
            dynamicQuestionQueue: mergeQueue(prev, [question]),
            updatedAt: new Date().toISOString(),
          }));
        },
        brief: ({ synthesis, degraded }) => {
          if (!active()) return;
          patchState((prev) => ({
            ...prev,
            briefSynthesis: { ...synthesis, degraded, status: "ready" },
            synthesisStatus: "ready",
            dynamicQuestionQueue: mergeQueue(
              prev,
              synthesis.nextQuestions ?? [],
            ),
            updatedAt: new Date().toISOString(),
          }));
        },
        error: (event) => {
          if (!active()) return;
          if (!event.recoverable) {
            setAgentSteps((prev) =>
              prev.map((step) =>
                step.status === "active" || step.status === "pending"
                  ? { ...step, status: "error", detail: event.message }
                  : step,
              ),
            );
            setPipelineStatus("error");
            patchState((prev) => ({
              ...prev,
              synthesisStatus: "error",
              briefSynthesis: {
                ...(prev.briefSynthesis ?? emptySynthesis()),
                status: "error",
                error: event.message,
              },
              updatedAt: new Date().toISOString(),
            }));
          } else if (!event.fileId) {
            setAgentSteps((prev) =>
              prev.map((step) =>
                step.id === event.stage
                  ? { ...step, detail: event.message }
                  : step,
              ),
            );
          }
        },
        done: () => {
          if (!active()) return;
          // Record the completed run's signature against the freshest state so
          // an unchanged commit never triggers a redundant paid rerun.
          setState((prev) => {
            lastSignatureRef.current = synthesisSignature(prev);
            return prev;
          });
          setPipelineStatus((status) =>
            status === "error" ? status : "done",
          );
        },
      };
    },
    [patchState, patchSynthesis, setState],
  );

  const failRun = useCallback(
    (runId: number, message: string) => {
      if (runIdRef.current !== runId) return;
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.status === "active" || step.status === "pending"
            ? { ...step, status: "error", detail: message }
            : step,
        ),
      );
      setPipelineStatus("error");
      patchState((prev) => {
        // Rules backfill from persisted findings — adaptive questions still
        // fire even when the pipeline dies mid-flight.
        const ruleQuestions = matchRules(
          findingsFromInsights(prev).filter((f) => f.flag),
        );
        return {
          ...prev,
          synthesisStatus: "error",
          briefSynthesis: {
            ...(prev.briefSynthesis ?? emptySynthesis()),
            status: "error",
            error: message,
          },
          dynamicQuestionQueue: mergeQueue(prev, ruleQuestions),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [patchState],
  );

  const startRun = useCallback(
    async (mode: "full" | "synthesis", prepared?: Map<string, DocumentPayload>) => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      runningRef.current = true;
      modeRef.current = mode;
      narrativeStartedRef.current = false;
      lastRunAtRef.current = Date.now();

      const controller = new AbortController();
      abortRef.current = controller;
      setPipelineStatus("running");
      setAgentSteps(DEFAULT_STEPS[mode].map((step) => ({ ...step })));
      lastSignatureRef.current = synthesisSignature(state);

      const askedQuestionIds = [
        ...(state.dynamicQuestionQueue ?? []).map((q) => q.id),
        ...(state.answeredDynamicQuestions ?? []).map((q) => q.questionId),
      ];
      const request = buildProcessRequest(state, mode, {
        prepared,
        askedQuestionIds,
      });

      try {
        await streamBriefPipeline(request, buildHandlers(runId), {
          signal: controller.signal,
        });
        runningRef.current = false;
      } catch (error) {
        runningRef.current = false;
        if (controller.signal.aborted) return;
        failRun(
          runId,
          error instanceof Error
            ? error.message
            : "The brief couldn't be prepared. Your uploads are safe — try again.",
        );
      }
    },
    [buildHandlers, failRun, state],
  );

  /** Full run: extract pending files, then classify + compose. */
  const runFullPipeline = useCallback(() => {
    if (runningRef.current) return;
    const now = new Date().toISOString();

    const pendingFiles = state.uploadedFiles.filter((meta) => {
      const insight = state.aiDocumentInsights?.[meta.id];
      const needsExtraction =
        !insight || insight.status === "error" || insight.status === "analyzing";
      return needsExtraction;
    });

    const placeholders: Record<string, DocumentInsight> = {};
    pendingFiles.forEach((meta) => {
      placeholders[meta.id] = {
        fileId: meta.id,
        documentType: "",
        provider: null,
        reportDate: null,
        textExcerpt: "",
        sections: [],
        markers: [],
        visibleMarkers: [],
        flaggedMarkers: [],
        doctorReviewAreas: [],
        patientFacingSummary: "",
        question: "",
        questionId: questionIdFor(meta.id),
        status: "analyzing",
      };
    });

    patchState((prev) => ({
      ...prev,
      uploadsConfirmedAt: now,
      aiDocumentInsights: {
        ...(prev.aiDocumentInsights ?? {}),
        ...placeholders,
      },
      briefSynthesis: emptySynthesis(),
      synthesisStatus: "synthesizing",
      dynamicQuestionQueue: [],
      updatedAt: now,
    }));

    void (async () => {
      const prepared = new Map<string, DocumentPayload>();
      await Promise.all(
        pendingFiles.map(async (meta) => {
          const file = fileObjects.current.get(meta.id);
          if (!file) return;
          prepared.set(meta.id, await prepareDocumentPayload(file));
        }),
      );
      await startRun("full", prepared);
    })();
  }, [fileObjects, patchState, startRun, state]);

  /** Cheap rerun: reuses prior insights; fires only when answers changed. */
  const rerunSynthesis = useCallback(() => {
    if (runningRef.current) return;
    if (Date.now() - lastRunAtRef.current < RERUN_DEBOUNCE_MS) return;

    const hasInsights = Object.values(state.aiDocumentInsights ?? {}).some(
      (i) => i.status === "done" || i.status === "needs_review",
    );
    const hasAnswers =
      state.reason.length > 0 ||
      !!state.reasonFreeText?.trim() ||
      state.goals.length > 0 ||
      state.symptoms.length > 0 ||
      Object.values(state.contextAnswers).some((v) => v.trim()) ||
      (state.answeredDynamicQuestions ?? []).some((q) => q.answer.trim());
    if (!hasInsights && !hasAnswers) return;

    const signature = synthesisSignature(state);
    if (signature === lastSignatureRef.current) return;

    patchState((prev) => ({
      ...prev,
      synthesisStatus: "synthesizing",
      briefSynthesis: {
        ...(prev.briefSynthesis ?? emptySynthesis()),
        status: "synthesizing",
      },
      updatedAt: new Date().toISOString(),
    }));
    void startRun("synthesis");
  }, [patchState, startRun, state]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    runningRef.current = false;
    runIdRef.current += 1;
    setPipelineStatus("idle");
    setAgentSteps([]);
    patchState((prev) => ({
      ...prev,
      synthesisStatus:
        prev.synthesisStatus === "synthesizing" ? "idle" : prev.synthesisStatus,
      briefSynthesis:
        prev.briefSynthesis?.status === "synthesizing"
          ? { ...prev.briefSynthesis, status: "idle" }
          : prev.briefSynthesis,
      updatedAt: new Date().toISOString(),
    }));
  }, [patchState]);

  return { agentSteps, pipelineStatus, runFullPipeline, rerunSynthesis, cancel };
}
