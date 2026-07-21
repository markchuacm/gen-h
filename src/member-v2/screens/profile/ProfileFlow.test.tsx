// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileFlow from "./ProfileFlow";
import { DEFAULT_ANSWERS } from "./profileQuestions";
import type { ProfileAnswers } from "./profileQuestions";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderFlow(
  answers: ProfileAnswers,
  startAt: number,
  onRemoveReport = vi.fn(),
  onPatch = vi.fn(),
) {
  return render(
    <ProfileFlow
      answers={answers}
      preferredNamePlaceholder="Alex"
      uploadErrors={[]}
      startAt={startAt}
      onPatch={onPatch}
      onToggle={vi.fn()}
      onToggleReport={vi.fn()}
      onAddReports={vi.fn()}
      onRemoveReport={onRemoveReport}
      onReachStep={vi.fn()}
      onComplete={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe("ProfileFlow refinements", () => {
  it("keeps the Other field mounted so opening and closing can transition smoothly", () => {
    const openAnswers = { ...DEFAULT_ANSWERS, reason: ["Other"] };
    const view = renderFlow(openAnswers, 1);
    const input = screen.getByLabelText("Other why i'm here") as HTMLInputElement;
    const reveal = input.closest(".pf-other-reveal");

    expect(reveal?.classList.contains("is-open")).toBe(true);
    expect(input.disabled).toBe(false);

    view.rerender(
      <ProfileFlow
        answers={{ ...openAnswers, reason: [] }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={1}
        onPatch={vi.fn()}
        onToggle={vi.fn()}
        onToggleReport={vi.fn()}
        onAddReports={vi.fn()}
        onRemoveReport={vi.fn()}
        onReachStep={vi.fn()}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(reveal?.classList.contains("is-open")).toBe(false);
    expect(input.disabled).toBe(true);
  });

  it("puts the number-key guidance in Question 2 subtext", () => {
    renderFlow(DEFAULT_ANSWERS, 1);
    expect(
      screen.getByText("Choose everything that fits, by pressing the number on keyboard"),
    ).toBeTruthy();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("requires detail when Other is the only Question 2 answer", () => {
    const emptyOther = renderFlow(
      { ...DEFAULT_ANSWERS, reason: ["Other"], reasonOther: "" },
      1,
    );
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);

    emptyOther.unmount();
    renderFlow(
      { ...DEFAULT_ANSWERS, reason: ["Other"], reasonOther: "Another reason" },
      1,
    );
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("renumbers the shortened Question 3 and Question 4 option lists", () => {
    const questionThree = renderFlow(DEFAULT_ANSWERS, 2);
    expect(screen.queryByText("Cardiovascular prevention")).toBeNull();
    expect(screen.getByRole("button", { name: "9 Longevity / preventive" })).toBeTruthy();

    questionThree.unmount();
    renderFlow(DEFAULT_ANSWERS, 3);
    expect(screen.queryByText("Waking unrefreshed")).toBeNull();
    expect(
      screen.getByRole("button", { name: "9 Nothing major — mostly prevention" }),
    ).toBeTruthy();
  });

  it("focuses the preferred-name field when the form opens", () => {
    renderFlow(DEFAULT_ANSWERS, 0);
    expect(document.activeElement).toBe(screen.getByLabelText("Preferred name"));
  });

  it("uses gender-specific alcohol options on Question 6", () => {
    const view = renderFlow(DEFAULT_ANSWERS, 5);
    expect(screen.getByRole("button", { name: "2 14 or less drinks a week" })).toBeTruthy();
    expect(screen.queryByText("7 or less drinks a week")).toBeNull();

    view.rerender(
      <ProfileFlow
        answers={{ ...DEFAULT_ANSWERS, basics: { ...DEFAULT_ANSWERS.basics, sex: "Female" } }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={5}
        onPatch={vi.fn()}
        onToggle={vi.fn()}
        onToggleReport={vi.fn()}
        onAddReports={vi.fn()}
        onRemoveReport={vi.fn()}
        onReachStep={vi.fn()}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "2 7 or less drinks a week" })).toBeTruthy();
    expect(screen.queryByText("14 or less drinks a week")).toBeNull();
  });

  it("numbers Question 6 from 1–9 and supports those keyboard shortcuts", () => {
    const onPatch = vi.fn();
    renderFlow(DEFAULT_ANSWERS, 5, vi.fn(), onPatch);

    expect(screen.getByRole("button", { name: "1 Rarely / never" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "4 Never" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "7 Daily / regularly" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "7" });
    expect(onPatch).toHaveBeenCalledWith({
      habits: { ...DEFAULT_ANSWERS.habits, smoking: "Daily / regularly" },
    });
  });

  it("assigns keyboard shortcuts 8 and 9 to the revealed product types", () => {
    const onPatch = vi.fn();
    const answers = {
      ...DEFAULT_ANSWERS,
      habits: { ...DEFAULT_ANSWERS.habits, smoking: "Occasional / social user" as const },
    };
    renderFlow(answers, 5, vi.fn(), onPatch);

    expect(screen.getByRole("button", { name: "8 Cigarettes / Cigars" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "9 Vapes / E-cigarettes" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "8" });
    expect(onPatch).toHaveBeenCalledWith({
      habits: { ...answers.habits, smokingProducts: ["Cigarettes / Cigars"] },
    });
  });

  it("reveals product types smoothly for anyone who has smoked or vaped", () => {
    const view = renderFlow(DEFAULT_ANSWERS, 5);
    const product = view.getByText("Cigarettes / Cigars", { selector: "button" }) as HTMLButtonElement;
    const reveal = product.closest(".pf-habit-product-reveal");
    expect(reveal?.classList.contains("is-open")).toBe(false);
    expect(product.disabled).toBe(true);

    view.rerender(
      <ProfileFlow
        answers={{
          ...DEFAULT_ANSWERS,
          habits: { ...DEFAULT_ANSWERS.habits, smoking: "Occasional / social user" },
        }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={5}
        onPatch={vi.fn()}
        onToggle={vi.fn()}
        onToggleReport={vi.fn()}
        onAddReports={vi.fn()}
        onRemoveReport={vi.fn()}
        onReachStep={vi.fn()}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(reveal?.classList.contains("is-open")).toBe(true);
    expect(product.disabled).toBe(false);
    expect(screen.getByText("What types of products?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "9 Vapes / E-cigarettes" })).toBeTruthy();
  });

  it("uses the allergies-to-medication wording on Question 9", () => {
    renderFlow(DEFAULT_ANSWERS, 8);
    expect(screen.getByText("allergies to medication?")).toBeTruthy();
  });

  it("gives the Question 8 Other field relevant placeholder copy", () => {
    renderFlow({ ...DEFAULT_ANSWERS, supplements: ["Other"] }, 7);
    const input = screen.getByLabelText("Other supplements & medications");
    expect(input.getAttribute("placeholder")).toBe(
      "Tell us about any other supplements or medications",
    );
  });

  it("starts the daily-average sleep scale below four hours", () => {
    renderFlow(
      {
        ...DEFAULT_ANSWERS,
        lifestyle: { ...DEFAULT_ANSWERS.lifestyle, sleepHours: 3.5 },
      },
      4,
    );

    const slider = screen.getByRole("slider", { name: "Daily average" });
    expect(slider.getAttribute("min")).toBe("3.5");
    expect(slider.getAttribute("max")).toBe("10.5");
    expect(screen.getByText("<4 h")).toBeTruthy();
  });

  it("uses boundary choices for age, height and weight", () => {
    renderFlow(DEFAULT_ANSWERS, 0);

    expect(screen.getByRole("slider", { name: "Age" }).getAttribute("max")).toBe("81");
    expect(screen.getByRole("slider", { name: "Height" }).getAttribute("min")).toBe("139");
    expect(screen.getByRole("slider", { name: "Height" }).getAttribute("max")).toBe("221");
    expect(screen.getByRole("slider", { name: "Weight" }).getAttribute("min")).toBe("29");
    expect(screen.getByRole("slider", { name: "Weight" }).getAttribute("max")).toBe("201");
  });

  it("renders Question 10 with useful card subtext but no file-format copy or selected states", () => {
    renderFlow(
      { ...DEFAULT_ANSWERS, reportSelections: ["health_screening"] },
      9,
    );

    const healthUpload = screen.getByRole("button", { name: "Upload health screenings" });
    expect(healthUpload.getAttribute("aria-pressed")).toBeNull();
    expect(screen.getByText(/Blood work, urine tests/i)).toBeTruthy();
    expect(screen.queryByText(/Drop files here or click to browse/i)).toBeNull();
    expect(screen.queryByText(/PDF, JPG, PNG/i)).toBeNull();
  });

  it("lets an attachment exit before removing it from the layout", () => {
    vi.useFakeTimers();
    const onRemoveReport = vi.fn();
    renderFlow(
      {
        ...DEFAULT_ANSWERS,
        uploadedReports: [
          {
            id: "report-1",
            name: "screening.png",
            type: "image/png",
            size: 1024,
            uploadedAt: "2026-07-20T00:00:00.000Z",
            category: "health_screening",
            kind: "image",
            status: "uploaded",
          },
        ],
      },
      9,
      onRemoveReport,
    );

    const remove = screen.getByRole("button", { name: "Remove screening.png" });
    const tile = remove.closest(".pf-report-file");
    fireEvent.click(remove);

    expect(tile?.classList.contains("is-removing")).toBe(true);
    expect(onRemoveReport).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onRemoveReport).toHaveBeenCalledWith("report-1");
  });

  it("keeps the uploaded-file height shell mounted when the last file disappears", () => {
    const uploaded = {
      ...DEFAULT_ANSWERS,
      uploadedReports: [
        {
          id: "report-1",
          name: "screening.png",
          type: "image/png",
          size: 1024,
          uploadedAt: "2026-07-20T00:00:00.000Z",
          category: "health_screening" as const,
          kind: "image" as const,
          status: "uploaded" as const,
        },
      ],
    };
    const view = renderFlow(uploaded, 9);
    const shell = view.container.querySelector(".pf-upload-files-shell");

    view.rerender(
      <ProfileFlow
        answers={{ ...uploaded, uploadedReports: [] }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={9}
        onPatch={vi.fn()}
        onToggle={vi.fn()}
        onToggleReport={vi.fn()}
        onAddReports={vi.fn()}
        onRemoveReport={vi.fn()}
        onReachStep={vi.fn()}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(view.container.querySelector(".pf-upload-files-shell")).toBe(shell);
    expect(screen.getByText("-")).toBeTruthy();
  });
});
