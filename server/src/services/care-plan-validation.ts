export type CarePlanReleaseIssue = {
  path: string;
  message: string;
};

export type CarePlanReleaseSection = {
  title: string | null;
  basisType: "results" | "prevention" | "manual" | "legacy";
  state: "active" | "deferred";
  deferReason: string | null;
  actions: Array<{
    title: string;
    instruction: string;
    lifestyleCategory: string;
    clinicianConfirmed?: boolean;
  }>;
};

export function validateCarePlanForRelease(input: {
  exists: boolean;
  status: string | null;
  evidenceStale: boolean;
  sections: CarePlanReleaseSection[];
}): CarePlanReleaseIssue[] {
  const issues: CarePlanReleaseIssue[] = [];

  if (!input.exists || input.status !== "draft") {
    issues.push({ path: "plan", message: "Only a draft plan can be released." });
  }
  if (input.evidenceStale) {
    issues.push({
      path: "plan.evidence",
      message: "Results changed after this draft was prepared. Regenerate it before release.",
    });
  }
  if (input.sections.length === 0) {
    issues.push({ path: "sections", message: "Add at least one focus area." });
  }

  for (const [sectionIndex, section] of input.sections.entries()) {
    if (section.state === "deferred") {
      if (!section.deferReason?.trim()) {
        issues.push({
          path: `sections.${sectionIndex}.deferReason`,
          message: "Add a reason for deferring this focus area.",
        });
      }
      continue;
    }

    if (section.actions.length === 0) {
      issues.push({
        path: `sections.${sectionIndex}.actions`,
        message: "Choose at least one action or defer this focus area.",
      });
    }
    for (const [actionIndex, selected] of section.actions.entries()) {
      if (!selected.title.trim() || !selected.instruction.trim()) {
        issues.push({
          path: `sections.${sectionIndex}.actions.${actionIndex}`,
          message: "Every selected action needs a title and instruction.",
        });
      }
      // Plans created before guided care plans did not capture confirmation metadata.
      if (
        section.basisType !== "legacy"
        && selected.lifestyleCategory === "Supplements"
        && selected.clinicianConfirmed !== true
      ) {
        issues.push({
          path: `sections.${sectionIndex}.actions.${actionIndex}.clinicianConfirmed`,
          message: "Confirm the supplement dose and safety before release.",
        });
      }
    }
  }

  return issues;
}
