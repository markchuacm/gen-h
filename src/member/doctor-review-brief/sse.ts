// ─── Doctor Review Brief · SSE pipeline reader ────────────────────────────────
// EventSource can't POST, so this reads the /process stream via fetch + a body
// reader. Splits on blank lines, parses `event:` / `data:` pairs, ignores `:`
// heartbeat comments, and dispatches typed handlers.

import type {
  AnsweredDynamicQuestion,
  BriefSynthesis,
  DocumentInsight,
  MarkerFinding,
  MarkerRelationship,
} from "./types";

const PROCESS_ENDPOINT = "/api/doctor-review-brief/process";

export type ProcessDocumentPayload = {
  fileId: string;
  fileName: string;
  category?: string;
  textExcerpt?: string;
  images?: string[];
  insight?: Omit<DocumentInsight, "questionId">;
};

export type ProcessRequest = {
  mode: "extract" | "final";
  documents: ProcessDocumentPayload[];
  answers: Record<string, unknown>;
  answeredDynamicQuestions: AnsweredDynamicQuestion[];
};

export type PipelineStageEvent = {
  stage: "extract" | "classify" | "compose";
  status: "start" | "done";
  label: string;
  detail?: string;
};

export type PipelineDocEvent = {
  fileId: string;
  status: "extracting" | "done" | "needs_review" | "error";
  insight?: Omit<DocumentInsight, "questionId">;
};

export type PipelineErrorEvent = {
  stage: string;
  fileId?: string;
  message: string;
  recoverable: boolean;
};

export type PipelineSummaryEvent = {
  progress: {
    documentsRead: number;
    markersRead: number;
    outOfRangeCount: number;
  };
};

export type PipelineHandlers = {
  stage?: (data: PipelineStageEvent) => void;
  doc?: (data: PipelineDocEvent) => void;
  finding?: (data: { finding: MarkerFinding }) => void;
  summary?: (data: PipelineSummaryEvent) => void;
  relationship?: (data: { relationship: MarkerRelationship }) => void;
  narrative_delta?: (data: { text: string }) => void;
  brief?: (data: { synthesis: BriefSynthesis; degraded?: boolean }) => void;
  error?: (data: PipelineErrorEvent) => void;
  done?: (data: { usage: { calls: number; totalTokens: number } }) => void;
};

function dispatch(handlers: PipelineHandlers, eventType: string, raw: string) {
  const handler = handlers[eventType as keyof PipelineHandlers];
  if (!handler) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (handler as (data: any) => void)(JSON.parse(raw));
  } catch {
    // A malformed event must never kill the stream.
  }
}

/**
 * Opens the pipeline stream and dispatches events until the server closes it.
 * Resolves once the stream ends; rejects on non-200, network failure, or a
 * stream that ends without a terminal `brief`/`done` event.
 */
export async function streamBriefPipeline(
  payload: ProcessRequest,
  handlers: PipelineHandlers,
  opts: { signal?: AbortSignal } = {},
): Promise<void> {
  const res = await fetch(PROCESS_ENDPOINT, {
    method: "POST",
    signal: opts.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail.slice(0, 200) || `Brief pipeline failed with status ${res.status}.`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawTerminal = false;

  const processBlock = (block: string) => {
    let eventType = "";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith(":")) continue; // heartbeat comment
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!eventType || dataLines.length === 0) return;
    if (eventType === "brief" || eventType === "done") sawTerminal = true;
    dispatch(handlers, eventType, dataLines.join("\n"));
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let separatorIndex;
    while ((separatorIndex = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      processBlock(block);
    }
  }
  if (buffer.trim()) processBlock(buffer);

  if (!sawTerminal) {
    throw new Error("The brief stream ended before finishing.");
  }
}
