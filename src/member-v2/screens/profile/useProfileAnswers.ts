import { useCallback, useState } from "react";
import { DEFAULT_ANSWERS } from "./profileQuestions";
import type {
  ProfileAnswers,
  ReportSelection,
  ReportUploadCategory,
  UploadedReport,
  UploadedReportKind,
} from "./profileQuestions";

const STORAGE_KEY = "genh-v2-profile";

export type ProfileState = {
  answers: ProfileAnswers;
  /** Index of the next unanswered step; equals STEP_COUNT once finished. */
  lastStep: number;
  completedAt: string | null;
};

const INITIAL_STATE: ProfileState = {
  answers: DEFAULT_ANSWERS,
  lastStep: 0,
  completedAt: null,
};

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function reportKind(file: File): UploadedReportKind {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|heic|webp|gif)$/.test(name)) {
    return "image";
  }
  if (file.type === "text/csv" || /\.(csv|xls|xlsx)$/.test(name)) return "sheet";
  if (/(\.doc|\.docx|\.txt)$/.test(name) || file.type.includes("word")) return "doc";
  return "other";
}

function load(): ProfileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as ProfileState;
    return {
      ...INITIAL_STATE,
      ...parsed,
      lastStep: parsed.lastStep ?? 0,
      answers: {
        ...DEFAULT_ANSWERS,
        ...parsed.answers,
        basics: { ...DEFAULT_ANSWERS.basics, ...parsed.answers?.basics },
        lifestyle: { ...DEFAULT_ANSWERS.lifestyle, ...parsed.answers?.lifestyle },
        habits: { ...DEFAULT_ANSWERS.habits, ...parsed.answers?.habits },
      },
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function useProfileAnswers() {
  const [state, setState] = useState<ProfileState>(load);

  const save = useCallback((updater: (current: ProfileState) => ProfileState) => {
    setState((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAnswers = useCallback(
    (patch: Partial<ProfileAnswers>) =>
      save((current) => ({ ...current, answers: { ...current.answers, ...patch } })),
    [save],
  );

  /** Atomic list toggle — safe against rapid successive presses, where patches
      computed from a stale render would overwrite each other. */
  const toggleListItem = useCallback(
    (key: "reason" | "goals" | "symptoms" | "family" | "supplements", option: string) =>
      save((current) => {
        const list = current.answers[key];
        const next = list.includes(option)
          ? list.filter((item) => item !== option)
          : [...list, option];
        return { ...current, answers: { ...current.answers, [key]: next } };
      }),
    [save],
  );

  const toggleReportSelection = useCallback(
    (selection: ReportSelection) =>
      save((current) => {
        if (selection === "no_tests") {
          const selected = current.answers.reportSelections.includes("no_tests");
          return {
            ...current,
            answers: {
              ...current.answers,
              reportSelections: selected ? [] : ["no_tests"],
              uploadedReports: [],
            },
          };
        }

        const withoutNone = current.answers.reportSelections.filter((item) => item !== "no_tests");
        const next = withoutNone.includes(selection)
          ? withoutNone.filter((item) => item !== selection)
          : [...withoutNone, selection];

        return {
          ...current,
          answers: {
            ...current.answers,
            reportSelections: next,
            uploadedReports: current.answers.uploadedReports.filter((file) =>
              next.includes(file.category),
            ),
          },
        };
      }),
    [save],
  );

  const addUploadedReports = useCallback(
    (files: FileList | File[], category: ReportUploadCategory) =>
      save((current) => {
        const incoming = Array.from(files);
        if (incoming.length === 0) return current;

        const uploadedReports: UploadedReport[] = incoming.map((file) => ({
          id: uid(),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          uploadedAt: new Date().toISOString(),
          category,
          kind: reportKind(file),
        }));

        return {
          ...current,
          answers: {
            ...current.answers,
            uploadedReports: [...current.answers.uploadedReports, ...uploadedReports],
          },
        };
      }),
    [save],
  );

  const removeUploadedReport = useCallback(
    (id: string) =>
      save((current) => ({
        ...current,
        answers: {
          ...current.answers,
          uploadedReports: current.answers.uploadedReports.filter((file) => file.id !== id),
        },
      })),
    [save],
  );

  const setLastStep = useCallback(
    (step: number) => save((current) => ({ ...current, lastStep: Math.max(current.lastStep, step) })),
    [save],
  );

  const markCompleted = useCallback(
    () => save((current) => ({ ...current, completedAt: new Date().toISOString() })),
    [save],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    setAnswers,
    toggleListItem,
    toggleReportSelection,
    addUploadedReports,
    removeUploadedReport,
    setLastStep,
    markCompleted,
    reset,
  };
}
