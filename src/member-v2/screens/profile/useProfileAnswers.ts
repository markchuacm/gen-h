import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeHealthDocument,
  uploadHealthDocument,
  validateHealthFile,
} from "../../../lib/api/healthDocuments";
import {
  completeOnboarding,
  fetchOnboardingResponses,
  upsertOnboardingResponses,
} from "../../../lib/api/memberProfile";
import { DEFAULT_ANSWERS, EXCLUSIVE_PROFILE_OPTIONS } from "./profileQuestions";
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

type ToggleListKey = "reason" | "goals" | "symptoms" | "family" | "supplements";

function applyExclusiveSelection(key: ToggleListKey, list: string[], option: string) {
  const exclusiveOption = EXCLUSIVE_PROFILE_OPTIONS[key as keyof typeof EXCLUSIVE_PROFILE_OPTIONS];
  const selected = list.includes(option);

  if (selected) return list.filter((item) => item !== option);
  if (exclusiveOption && option === exclusiveOption) return [option];
  if (exclusiveOption) return [...list.filter((item) => item !== exclusiveOption), option];
  return [...list, option];
}

function sanitizeExclusiveSelections(answers: ProfileAnswers) {
  return {
    ...answers,
    symptoms: answers.symptoms.includes(EXCLUSIVE_PROFILE_OPTIONS.symptoms)
      ? [EXCLUSIVE_PROFILE_OPTIONS.symptoms]
      : answers.symptoms,
    family: answers.family.includes(EXCLUSIVE_PROFILE_OPTIONS.family)
      ? [EXCLUSIVE_PROFILE_OPTIONS.family]
      : answers.family,
    supplements: answers.supplements.includes(EXCLUSIVE_PROFILE_OPTIONS.supplements)
      ? [EXCLUSIVE_PROFILE_OPTIONS.supplements]
      : answers.supplements,
  };
}

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
    const answers = sanitizeExclusiveSelections({
      ...DEFAULT_ANSWERS,
      ...parsed.answers,
      basics: { ...DEFAULT_ANSWERS.basics, ...parsed.answers?.basics },
      lifestyle: { ...DEFAULT_ANSWERS.lifestyle, ...parsed.answers?.lifestyle },
      habits: { ...DEFAULT_ANSWERS.habits, ...parsed.answers?.habits },
    });

    return {
      ...INITIAL_STATE,
      ...parsed,
      lastStep: parsed.lastStep ?? 0,
      answers,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function useProfileAnswers() {
  const [state, setState] = useState<ProfileState>(load);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate from the DB once per mount. The DB is the source of truth;
  // localStorage is only an offline draft cache.
  useEffect(() => {
    let cancelled = false;
    fetchOnboardingResponses().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.warn("Failed to load onboarding answers:", error);
        return;
      }
      if (!data) return;
      setState((current) => {
        const { meta, ...sections } = data as Partial<ProfileAnswers> & {
          meta?: { lastStep?: number; completedAt?: string | null };
        };
        const answers = sanitizeExclusiveSelections({
          ...current.answers,
          ...sections,
          basics: { ...current.answers.basics, ...sections.basics },
          lifestyle: { ...current.answers.lifestyle, ...sections.lifestyle },
          habits: { ...current.answers.habits, ...sections.habits },
        });
        const next: ProfileState = {
          answers,
          lastStep: meta?.lastStep ?? current.lastStep,
          completedAt: meta?.completedAt ?? current.completedAt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced write-through: one onboarding_responses row per section plus a
  // meta row for flow progress. Failures only warn — the local cache keeps the
  // draft, and the next edit retries.
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(syncTimer.current), []);
  const scheduleSync = useCallback((next: ProfileState) => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void upsertOnboardingResponses({
        ...next.answers,
        meta: { lastStep: next.lastStep, completedAt: next.completedAt },
      }).then(({ error }) => {
        if (error) console.warn("Failed to save onboarding answers:", error);
      });
    }, 600);
  }, []);

  const save = useCallback(
    (updater: (current: ProfileState) => ProfileState) => {
      setState((current) => {
        const next = updater(current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        scheduleSync(next);
        return next;
      });
    },
    [scheduleSync],
  );

  const setAnswers = useCallback(
    (patch: Partial<ProfileAnswers>) =>
      save((current) => ({ ...current, answers: { ...current.answers, ...patch } })),
    [save],
  );

  /** Atomic list toggle — safe against rapid successive presses, where patches
      computed from a stale render would overwrite each other. */
  const toggleListItem = useCallback(
    (key: ToggleListKey, option: string) =>
      save((current) => {
        const list = current.answers[key];
        const next = applyExclusiveSelection(key, list, option);
        return {
          ...current,
          answers: {
            ...current.answers,
            [key]: next,
            ...(key === "supplements" &&
            next.includes(EXCLUSIVE_PROFILE_OPTIONS.supplements)
              ? { supplementsOther: "" }
              : null),
          },
        };
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

  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const patchReport = useCallback(
    (id: string, patch: Partial<UploadedReport>) =>
      save((current) => ({
        ...current,
        answers: {
          ...current.answers,
          uploadedReports: current.answers.uploadedReports.map((report) =>
            report.id === id ? { ...report, ...patch } : report,
          ),
        },
      })),
    [save],
  );

  const dropReport = useCallback(
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

  const addUploadedReports = useCallback(
    (files: FileList | File[], category: ReportUploadCategory) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const rejections = incoming
        .map((file) => validateHealthFile(file))
        .filter((message): message is string => message !== null);
      setUploadErrors(rejections);

      const accepted = incoming.filter((file) => validateHealthFile(file) === null);
      if (accepted.length === 0) return;

      // Optimistic chips while the uploads run; failures remove the chip and
      // surface a message.
      const pending: Array<{ file: File; report: UploadedReport }> = accepted.map((file) => ({
        file,
        report: {
          id: uid(),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          uploadedAt: new Date().toISOString(),
          category,
          kind: reportKind(file),
          status: "uploading",
        },
      }));

      save((current) => ({
        ...current,
        answers: {
          ...current.answers,
          uploadedReports: [
            ...current.answers.uploadedReports,
            ...pending.map((entry) => entry.report),
          ],
        },
      }));

      for (const { file, report } of pending) {
        void uploadHealthDocument(file, category).then(({ data, error }) => {
          if (error || !data) {
            dropReport(report.id);
            setUploadErrors((current) => [...current, `${file.name}: upload failed (${error}).`]);
          } else {
            patchReport(report.id, {
              documentId: data.id,
              storagePath: data.storage_path,
              status: "uploaded",
            });
          }
        });
      }
    },
    [save, dropReport, patchReport],
  );

  const removeUploadedReport = useCallback(
    (id: string) => {
      const report = stateRef.current.answers.uploadedReports.find((file) => file.id === id);
      dropReport(id);
      if (report?.documentId && report.storagePath) {
        void removeHealthDocument(report.documentId, report.storagePath).then(({ error }) => {
          if (error) console.warn("Failed to delete document:", error);
        });
      }
    },
    [dropReport],
  );

  const setLastStep = useCallback(
    (step: number) => save((current) => ({ ...current, lastStep: Math.max(current.lastStep, step) })),
    [save],
  );

  const markCompleted = useCallback(() => {
    save((current) => ({ ...current, completedAt: new Date().toISOString() }));
    // Persist basics + advance the journey (profile_incomplete → consult_upcoming).
    void completeOnboarding(stateRef.current.answers.basics).then(({ error }) => {
      if (error) console.warn("Failed to complete onboarding:", error);
    });
  }, [save]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    uploadErrors,
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
