// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileFlow from "./ProfileFlow";
import { DEFAULT_ANSWERS, MANAGE_EXISTING_CONDITION_REASON } from "./profileQuestions";
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
  onReachStep = vi.fn(),
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
      onReachStep={onReachStep}
      onComplete={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe("ProfileFlow refinements", () => {
  it("opens on the identity step and blocks continuing until it is complete", () => {
    const { rerender } = renderFlow(DEFAULT_ANSWERS, 0);
    expect(screen.getByLabelText("Full name (as per IC / Passport)")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);

    rerender(
      <ProfileFlow
        answers={{
          ...DEFAULT_ANSWERS,
          identity: { fullName: "Amina Burhanuddin", icPassportNo: "900101145566", dateOfBirth: "1990-01-01", address: "12 Jalan Setiabakti", phone: "" },
        }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={0}
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
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("falls back to only the first name, properly cased, as the preferred-name placeholder", () => {
    renderFlow(
      {
        ...DEFAULT_ANSWERS,
        identity: {
          ...DEFAULT_ANSWERS.identity,
          fullName: "AMINA BURHANUDDIN HELMI BINTI MOHAMMAD BAKTIAR",
        },
      },
      1,
    );

    const input = screen.getByLabelText("Preferred name") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("Amina");
  });

  it("keeps the Other field mounted so opening and closing can transition smoothly", () => {
    const openAnswers = { ...DEFAULT_ANSWERS, reason: ["Other"] };
    const view = renderFlow(openAnswers, 2);
    const input = screen.getByLabelText("Other why i'm here") as HTMLInputElement;
    const reveal = input.closest(".pf-other-reveal");

    expect(reveal?.classList.contains("is-open")).toBe(true);
    expect(input.disabled).toBe(false);

    view.rerender(
      <ProfileFlow
        answers={{ ...openAnswers, reason: [] }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={2}
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
    renderFlow(DEFAULT_ANSWERS, 2);
    expect(
      screen.getByText("Choose everything that fits, by pressing the number on keyboard"),
    ).toBeTruthy();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("adds health-condition management as option 4 and shifts later options", () => {
    renderFlow(DEFAULT_ANSWERS, 2);

    expect(screen.getByRole("button", { name: `4 ${MANAGE_EXISTING_CONDITION_REASON}` })).toBeTruthy();
    expect(screen.getByRole("button", { name: "5 I want to optimise energy, focus, body composition, or longevity" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "6 I want a doctor to review everything together" })).toBeTruthy();
  });

  it("keeps the same next step regardless of the selected reason", () => {
    const onReachStep = vi.fn();
    renderFlow(
      { ...DEFAULT_ANSWERS, reason: [MANAGE_EXISTING_CONDITION_REASON] },
      2,
      undefined,
      undefined,
      onReachStep,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("4 of 12")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What would you most like to improve over the next 12 months?" })).toBeTruthy();
    expect(onReachStep).toHaveBeenLastCalledWith(3);
  });

  it("keeps the normal sequence when the management option is not selected", () => {
    const onReachStep = vi.fn();
    renderFlow(
      { ...DEFAULT_ANSWERS, reason: ["I've done tests, but I don't know what to do with the results"] },
      2,
      undefined,
      undefined,
      onReachStep,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("4 of 12")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What would you most like to improve over the next 12 months?" })).toBeTruthy();
    expect(onReachStep).toHaveBeenLastCalledWith(3);
  });

  it("requires detail when Other is the only Question 2 answer", () => {
    const emptyOther = renderFlow(
      { ...DEFAULT_ANSWERS, reason: ["Other"], reasonOther: "" },
      2,
    );
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);

    emptyOther.unmount();
    renderFlow(
      { ...DEFAULT_ANSWERS, reason: ["Other"], reasonOther: "Another reason" },
      2,
    );
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("renumbers the shortened Question 3 and Question 4 option lists", () => {
    const questionThree = renderFlow(DEFAULT_ANSWERS, 3);
    expect(screen.queryByText("Cardiovascular prevention")).toBeNull();
    expect(screen.getByRole("button", { name: "9 Longevity / preventive" })).toBeTruthy();

    questionThree.unmount();
    renderFlow(DEFAULT_ANSWERS, 4);
    expect(screen.queryByText("Waking unrefreshed")).toBeNull();
    expect(
      screen.getByRole("button", { name: "9 Nothing major — mostly prevention" }),
    ).toBeTruthy();
  });

  it("does not steal focus into the preferred-name field when the basics step opens", () => {
    renderFlow(DEFAULT_ANSWERS, 1);
    expect(document.activeElement).not.toBe(screen.getByLabelText("Preferred name"));
  });

  it("uses gender-specific alcohol options on Question 6", () => {
    const view = renderFlow(DEFAULT_ANSWERS, 6);
    expect(screen.getByRole("button", { name: "2 14 or less drinks a week" })).toBeTruthy();
    expect(screen.queryByText("7 or less drinks a week")).toBeNull();

    view.rerender(
      <ProfileFlow
        answers={{ ...DEFAULT_ANSWERS, basics: { ...DEFAULT_ANSWERS.basics, sex: "Female" } }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={6}
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
    renderFlow(DEFAULT_ANSWERS, 6, vi.fn(), onPatch);

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
    renderFlow(answers, 6, vi.fn(), onPatch);

    expect(screen.getByRole("button", { name: "8 Cigarettes / Cigars" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "9 Vapes / E-cigarettes" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "8" });
    expect(onPatch).toHaveBeenCalledWith({
      habits: { ...answers.habits, smokingProducts: ["Cigarettes / Cigars"] },
    });
  });

  it("reveals product types smoothly for anyone who has smoked or vaped", () => {
    const view = renderFlow(DEFAULT_ANSWERS, 6);
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
        startAt={6}
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

  it("adds a numbered medical-conditions step with an animated Other field", () => {
    renderFlow({ ...DEFAULT_ANSWERS, conditions: ["Other"] }, 7);

    expect(screen.getByText("8 of 12")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Do you have any existing medical conditions?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1 Hypertension" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "9 Cancer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "0 Other" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "None" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Why we ask" })).toBeTruthy();

      expect(Array.from(document.querySelectorAll(".pf-chip")).map((option) => option.textContent?.replace(/\s+/g, "").trim())).toEqual([
        "1Hypertension",
        "2Diabetes",
        "3Asthma",
        "4Chronickidneydisease",
        "5Hyperlipidaemia",
        "6Autoimmunedisease",
        "7Previousheartattackorstroke",
        "8Mentalhealthconditions",
        "9Cancer",
        "0Other",
        "None",
      ]);

      const input = screen.getByLabelText("Other medical conditions") as HTMLInputElement;
    expect(input.placeholder).toBe("Tell us about any other medical conditions");
    expect(input.disabled).toBe(false);
  });

  it("uses the allergies-to-medication wording on Question 10", () => {
    renderFlow(DEFAULT_ANSWERS, 10);
    expect(screen.getByText("allergies to medication?")).toBeTruthy();
  });

  it("gives the Question 9 Other field relevant placeholder copy", () => {
    renderFlow({ ...DEFAULT_ANSWERS, supplements: ["Other"] }, 9);
    const input = screen.getByLabelText("Other supplements & medications");
    expect(input.getAttribute("placeholder")).toBe(
      "Tell us about any other supplements or medications",
    );
  });

  it("keeps the Prescription medication and Other details independently available on Question 9", () => {
    renderFlow(
      {
        ...DEFAULT_ANSWERS,
        supplements: ["Prescription medication", "Other"],
      },
      9,
    );

    const prescriptionInput = screen.getByLabelText("Prescription medications and doses");
    expect(prescriptionInput.getAttribute("placeholder")).toBe(
      "Tell us your prescription medications and doses",
    );
    expect((prescriptionInput as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText("Other supplements & medications") as HTMLInputElement).disabled).toBe(false);
  });

  it("labels the daily-average sleep scale below four hours", () => {
    renderFlow(
      {
        ...DEFAULT_ANSWERS,
        lifestyle: { ...DEFAULT_ANSWERS.lifestyle, sleepHours: 3.5 },
      },
      5,
    );

    const slider = screen.getByRole("slider", { name: "Sleep - daily average" });
    expect(slider.getAttribute("min")).toBe("3.5");
    expect(slider.getAttribute("max")).toBe("10.5");
    expect(screen.getByText("<4 h")).toBeTruthy();
  });

  it("uses boundary choices for age, height and weight", () => {
    renderFlow(DEFAULT_ANSWERS, 1);

    expect(screen.getByRole("slider", { name: "Age" }).getAttribute("max")).toBe("81");
    expect(screen.getByRole("slider", { name: "Height" }).getAttribute("min")).toBe("139");
    expect(screen.getByRole("slider", { name: "Height" }).getAttribute("max")).toBe("221");
    expect(screen.getByRole("slider", { name: "Weight" }).getAttribute("min")).toBe("29");
    expect(screen.getByRole("slider", { name: "Weight" }).getAttribute("max")).toBe("201");
  });

  it("renders Question 11 with useful card subtext but no file-format copy or selected states", () => {
    renderFlow(
      { ...DEFAULT_ANSWERS, reportSelections: ["health_screening"] },
      11,
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
      11,
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
    const view = renderFlow(uploaded, 11);
    const shell = view.container.querySelector(".pf-upload-files-shell");

    view.rerender(
      <ProfileFlow
        answers={{ ...uploaded, uploadedReports: [] }}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={11}
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

  it("opens on the welcome screen when asked, and starts from it", () => {
    render(
      <ProfileFlow
        answers={DEFAULT_ANSWERS}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={0}
        showIntro
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

    expect(screen.getByText("Before we start")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continue" })).toBe(null);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(screen.queryByText("Before we start")).toBe(null);
    expect(screen.getByLabelText("Full name (as per IC / Passport)")).toBeTruthy();
  });

  it("starts the flow when Enter is pressed on the welcome screen", () => {
    render(
      <ProfileFlow
        answers={DEFAULT_ANSWERS}
        preferredNamePlaceholder="Alex"
        uploadErrors={[]}
        startAt={0}
        showIntro
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

    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.queryByText("Before we start")).toBe(null);
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("skips the welcome screen for a resumed or edited flow", () => {
    renderFlow(DEFAULT_ANSWERS, 0);
    expect(screen.queryByText("Before we start")).toBe(null);
  });
});
