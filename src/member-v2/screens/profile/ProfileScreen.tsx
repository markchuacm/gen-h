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
    <main className="p-page pf-profile-page">
      <ProfileSummary
        answers={state.answers}
        onEditStep={handleEditStep}
      />
      <div className="pf-summary-actions">
        <button className="p-btn pf-summary-confirm" type="button" onClick={onCompleted}>
          Confirm profile
        </button>
        <button
          className="pf-summary-edit"
          type="button"
          onClick={() => openFlow(0)}
        >
          Edit answers
        </button>
      </div>

      {flowOpen && flow}
    </main>
  );
}

export default ProfileScreen;
