// ─── Doctor Review Brief · pipeline hook ──────────────────────────────────────
// Owns the two paid pipeline moments: document extraction and final composition.
// Question transitions are now pure client-side state.

import { useCallback, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { buildProcessRequest, synthesisSignature } from "./briefSynthesis";
import { prepareDocumentPayload } from "./extraction";
import type { DocumentPayload } from "./extraction";
import { streamBriefPipeline } from "./sse";
import type { PipelineHandlers } from "./sse";
import type {
  AgentStep,
  BriefSynthesis,
  DocumentInsight,
  IntakeState,
} from "./types";

export type PipelineStatus = "idle" | "running" | "done" | "error";

const DEFAULT_STEPS: Record<"extract" | "final", AgentStep[]> = {
  extract: [
    { id: "extract", label: "Reading your documents", status: "pending" },
    {
      id: "classify",
      label: "Checking markers against reference ranges",
      status: "pending",
    },
    {
      id: "prepareQuestions",
      label: "Preparing follow-up questions",
      status: "pending",
    },
  ],
  final: [
    {
      id: "compose",
      label: "Generating your doctor's brief",
      status: "pending",
    },
  ],
};

function questionIdFor(fileId: string): string {
  return `ai_q_${fileId.slice(0, 8)}`;
}

export function emptySynthesis(
  status: BriefSynthesis["status"] = "synthesizing",
): BriefSynthesis {
  return {
    status,
    narrative: "",
    outOfRange: [],
    relationships: [],
    patientContext: [],
    progress: {
      documentsRead: 0,
      markersRead: 0,
      outOfRangeCount: 0,
    },
  };
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
  const modeRef = useRef<"extract" | "final">("extract");
  const narrativeStartedRef = useRef(false);
  const hadErrorRef = useRef(false);

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
    (runId: number, signature?: string): PipelineHandlers => {
      const active = () => runIdRef.current === runId;
      const finalMode = () => modeRef.current === "final";

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
            contextQuestions: event.insight.contextQuestions ?? [],
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
        summary: ({ progress }) => {
          if (!active()) return;
          setAgentSteps((prev) =>
            prev.map((step) =>
              step.id === "prepareQuestions"
                ? { ...step, status: "active" }
                : step,
            ),
          );
          patchState((prev) => ({
            ...prev,
            briefSynthesis: {
              ...(prev.briefSynthesis ?? emptySynthesis("idle")),
              status: "idle",
              progress,
            },
            updatedAt: new Date().toISOString(),
          }));
        },
        relationship: ({ relationship }) => {
          if (!active() || !finalMode()) return;
          patchSynthesis((s) =>
            s.relationships.some((r) => r.id === relationship.id)
              ? {}
              : { relationships: [...s.relationships, relationship] },
          );
        },
        narrative_delta: ({ text }) => {
          if (!active() || !finalMode()) return;
          const isFirst = !narrativeStartedRef.current;
          narrativeStartedRef.current = true;
          patchSynthesis((s) => ({
            narrative: isFirst ? text : s.narrative + text,
          }));
        },
        brief: ({ synthesis, degraded }) => {
          if (!active()) return;
          patchState((prev) => ({
            ...prev,
            briefSynthesis: {
              ...synthesis,
              degraded,
              status: "ready",
              sourceSignature: signature,
            },
            synthesisStatus: "ready",
            updatedAt: new Date().toISOString(),
          }));
        },
        error: (event) => {
          if (!active()) return;
          hadErrorRef.current = true;
          setAgentSteps((prev) =>
            prev.map((step) =>
              step.status === "active" || step.status === "pending"
                ? { ...step, status: "error", detail: event.message }
                : step,
            ),
          );
          if (!event.recoverable || finalMode()) {
            setPipelineStatus("error");
            patchState((prev) => ({
              ...prev,
              synthesisStatus: finalMode() ? "error" : prev.synthesisStatus,
              briefSynthesis: finalMode()
                ? {
                    ...(prev.briefSynthesis ?? emptySynthesis()),
                    status: "error",
                    error: event.message,
                    sourceSignature: signature,
                  }
                : prev.briefSynthesis,
              updatedAt: new Date().toISOString(),
            }));
          }
        },
        done: () => {
          if (!active()) return;
          setAgentSteps((prev) =>
            prev.map((step) =>
              step.id === "prepareQuestions"
                ? { ...step, status: "done" }
                : step,
            ),
          );
          setPipelineStatus((status) =>
            status === "error" ? status : "done",
          );
        },
      };
    },
    [patchState, patchSynthesis],
  );

  const failRun = useCallback(
    (runId: number, message: string, finalMode: boolean, signature?: string) => {
      if (runIdRef.current !== runId) return;
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.status === "active" || step.status === "pending"
            ? { ...step, status: "error", detail: message }
            : step,
        ),
      );
      setPipelineStatus("error");
      if (finalMode) {
        patchState((prev) => ({
          ...prev,
          synthesisStatus: "error",
          briefSynthesis: {
            ...(prev.briefSynthesis ?? emptySynthesis()),
            status: "error",
            error: message,
            sourceSignature: signature,
          },
          updatedAt: new Date().toISOString(),
        }));
      }
    },
    [patchState],
  );

  const startRun = useCallback(
    async (
      mode: "extract" | "final",
      prepared?: Map<string, DocumentPayload>,
      signature?: string,
    ) => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      runningRef.current = true;
      modeRef.current = mode;
      narrativeStartedRef.current = false;
      hadErrorRef.current = false;

      const controller = new AbortController();
      abortRef.current = controller;
      setPipelineStatus("running");
      setAgentSteps(DEFAULT_STEPS[mode].map((step) => ({ ...step })));

      const request = buildProcessRequest(state, mode, { prepared });

      try {
        await streamBriefPipeline(request, buildHandlers(runId, signature), {
          signal: controller.signal,
        });
        runningRef.current = false;
        return hadErrorRef.current ? "error" : "done";
      } catch (error) {
        runningRef.current = false;
        if (controller.signal.aborted) return "aborted";
        failRun(
          runId,
          error instanceof Error
            ? error.message
            : "The brief couldn't be prepared. Your uploads are safe — try again.",
          mode === "final",
          signature,
        );
        return "error";
      }
    },
    [buildHandlers, failRun, state],
  );

  const runExtraction = useCallback(() => {
    if (runningRef.current) return;
    const now = new Date().toISOString();

    const pendingFiles = state.uploadedFiles.filter((meta) => {
      const insight = state.aiDocumentInsights?.[meta.id];
      return (
        !insight || insight.status === "error" || insight.status === "analyzing"
      );
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
        contextQuestions: [],
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
      briefSynthesis: emptySynthesis("idle"),
      synthesisStatus: "idle",
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
      await startRun("extract", prepared);
    })();
  }, [fileObjects, patchState, startRun, state]);

  const generateBrief = useCallback(async () => {
    if (runningRef.current) return "running" as const;
    const signature = synthesisSignature(state);
    if (
      state.briefSynthesis?.status === "ready" &&
      state.briefSynthesis.sourceSignature === signature
    ) {
      setPipelineStatus("done");
      return "reused" as const;
    }

    patchState((prev) => ({
      ...prev,
      synthesisStatus: "synthesizing",
      briefSynthesis: {
        ...emptySynthesis("synthesizing"),
        sourceSignature: signature,
      },
      updatedAt: new Date().toISOString(),
    }));

    const result = await startRun("final", undefined, signature);
    return result === "done" ? ("generated" as const) : ("error" as const);
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

  return { agentSteps, pipelineStatus, runExtraction, generateBrief, cancel };
}
