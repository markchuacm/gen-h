import { useCallback, useState } from "react";
import { DEFAULT_ANSWERS } from "./profileQuestions";
import type { ProfileAnswers } from "./profileQuestions";

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

function load(): ProfileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as ProfileState;
    return {
      ...INITIAL_STATE,
      ...parsed,
      answers: { ...DEFAULT_ANSWERS, ...parsed.answers },
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

  return { state, setAnswers, toggleListItem, setLastStep, markCompleted, reset };
}
