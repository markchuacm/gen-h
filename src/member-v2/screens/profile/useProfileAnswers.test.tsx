// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileAnswers } from "./useProfileAnswers";

const { fetchOnboardingResponses, upsertOnboardingResponses } = vi.hoisted(() => ({
  fetchOnboardingResponses: vi.fn(),
  upsertOnboardingResponses: vi.fn(),
}));

vi.mock("../../../lib/api/memberProfile", () => ({
  fetchOnboardingResponses,
  upsertOnboardingResponses,
  completeOnboarding: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("../../../lib/api/healthDocuments", () => ({
  removeHealthDocument: vi.fn(),
  uploadHealthDocument: vi.fn(),
  validateHealthFile: vi.fn().mockReturnValue(null),
}));

describe("profile draft persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchOnboardingResponses.mockReset().mockResolvedValue({ data: null, error: null });
    upsertOnboardingResponses.mockReset().mockResolvedValue({ error: null });
  });

  it("does not expose the editable state until server hydration finishes", async () => {
    let resolveFetch!: (value: { data: null; error: null }) => void;
    fetchOnboardingResponses.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    const { result } = renderHook(() => useProfileAnswers("member-a"));
    expect(result.current.hydrated).toBe(false);
    await act(async () => resolveFetch({ data: null, error: null }));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
  });

  it("flushes the latest edit before close", async () => {
    const { result } = renderHook(() => useProfileAnswers("member-a"));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setAnswers({ supplementsOther: "Synthetic test value" }));
    await act(async () => expect(await result.current.flush()).toBe(true));
    expect(upsertOnboardingResponses).toHaveBeenLastCalledWith(
      expect.objectContaining({ supplementsOther: "Synthetic test value" }),
      "member-a",
    );
    expect(result.current.state.pendingSync).toBe(false);
  });

  it("retains and retries a failed per-member local draft on remount", async () => {
    upsertOnboardingResponses.mockResolvedValueOnce({ error: "offline" });
    const first = renderHook(() => useProfileAnswers("member-a"));
    await waitFor(() => expect(first.result.current.hydrated).toBe(true));
    act(() => first.result.current.setAnswers({ supplementsOther: "Keep this draft" }));
    await act(async () => expect(await first.result.current.flush()).toBe(false));
    first.unmount();

    upsertOnboardingResponses.mockResolvedValue({ error: null });
    const second = renderHook(() => useProfileAnswers("member-a"));
    await waitFor(() => expect(second.result.current.hydrated).toBe(true));
    await waitFor(() => expect(second.result.current.state.pendingSync).toBe(false));
    expect(second.result.current.state.answers.supplementsOther).toBe("Keep this draft");
  });

  it("blocks old answers while switching member identities", async () => {
    const { result, rerender } = renderHook(
      ({ memberId }) => useProfileAnswers(memberId),
      { initialProps: { memberId: "member-a" } },
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setAnswers({ supplementsOther: "Member A only" }));
    await act(async () => expect(await result.current.flush()).toBe(true));

    let resolveSecond!: (value: { data: null; error: null }) => void;
    fetchOnboardingResponses.mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));
    rerender({ memberId: "member-b" });
    expect(result.current.hydrated).toBe(false);
    await act(async () => resolveSecond({ data: null, error: null }));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.state.answers.supplementsOther).not.toBe("Member A only");
  });
});
