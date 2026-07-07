// Presentational progress strip. Nodes light from their own condition (not a
// strict left-to-right gate) so the parallel steps — doctor assigned ∥ profile
// completed — can complete out of order.

function CaseTimeline({
  onboardingCompleted,
  doctorAssigned,
  resultsStatus,
  carePlanStatus,
}: {
  onboardingCompleted: boolean;
  doctorAssigned: boolean;
  resultsStatus: "none" | "draft" | "released";
  carePlanStatus: "none" | "draft" | "released";
}) {
  const nodes = [
    { label: "Signed up", done: true },
    { label: "Doctor assigned", done: doctorAssigned },
    { label: "Profile completed", done: onboardingCompleted },
    { label: "Results pending", done: resultsStatus !== "none" },
    { label: "Results ready", done: resultsStatus === "released" },
    { label: "Care plan drafted", done: carePlanStatus !== "none" },
    { label: "Care plan released", done: carePlanStatus === "released" },
  ];

  return (
    <ol className="adm-timeline" aria-label="Case progress">
      {nodes.map((n) => (
        <li key={n.label} className={n.done ? "is-done" : ""}>
          <span className="adm-timeline-dot" aria-hidden="true" />
          <span className="adm-timeline-label">{n.label}</span>
        </li>
      ))}
    </ol>
  );
}

export default CaseTimeline;
