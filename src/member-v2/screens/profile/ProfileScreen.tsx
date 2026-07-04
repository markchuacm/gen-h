import { useState } from "react";
import ProfileFlow from "./ProfileFlow";
import ProfileSummary, { stepIndexOf } from "./ProfileSummary";
import type { StepId } from "./profileQuestions";
import { useProfileAnswers } from "./useProfileAnswers";
import "./profile.css";

type ProfileScreenProps = {
  flowOpen: boolean;
  onFlowOpenChange: (open: boolean) => void;
  onCompleted: () => void;
  onExitIncomplete: () => void;
};

function ProfileScreen({
  flowOpen,
  onFlowOpenChange,
  onCompleted,
  onExitIncomplete,
}: ProfileScreenProps) {
  const {
    state,
    setAnswers,
    toggleListItem,
    toggleReportSelection,
    addUploadedReports,
    removeUploadedReport,
    setLastStep,
    markCompleted,
    reset,
  } = useProfileAnswers();
  const [startAt, setStartAt] = useState(0);

  const completed = !!state.completedAt;

  const openFlow = (at = 0) => {
    setStartAt(at);
    onFlowOpenChange(true);
  };

  const handleEditStep = (stepId: StepId) => openFlow(Math.max(0, stepIndexOf(stepId)));
  const handleFlowClose = () => {
    onFlowOpenChange(false);
    if (!completed) onExitIncomplete();
  };

  const flow = (
    <ProfileFlow
      answers={state.answers}
      startAt={completed ? startAt : Math.max(0, state.lastStep)}
      onPatch={setAnswers}
      onToggle={toggleListItem}
      onToggleReport={toggleReportSelection}
      onAddReports={addUploadedReports}
      onRemoveReport={removeUploadedReport}
      onReachStep={setLastStep}
      onComplete={() => {
        markCompleted();
        onFlowOpenChange(false);
        onCompleted();
      }}
      onClose={handleFlowClose}
    />
  );

  if (!completed) return flow;

  return (
    <main className="p-page">
      <header className="home-head">
        <span className="p-eyebrow">Ready for your doctor</span>
        <h1 className="p-h1">
          What your doctor <em>will see</em>
        </h1>
      </header>

      <ProfileSummary
        answers={state.answers}
        completedAt={state.completedAt}
        onEditStep={handleEditStep}
      />
      <div className="pf-summary-actions">
        <button className="p-btn-ghost" type="button" onClick={() => openFlow(0)}>
          Review answers
        </button>
        <button
          className="p-btn-ghost"
          type="button"
          onClick={() => {
            reset();
            onFlowOpenChange(false);
          }}
        >
          Start over
        </button>
      </div>

      {flowOpen && flow}
    </main>
  );
}

export default ProfileScreen;
