import { useState } from "react";
import ProfileFlow from "./ProfileFlow";
import ProfileSummary, { stepIndexOf } from "./ProfileSummary";
import type { StepId } from "./profileQuestions";
import { useProfileAnswers } from "./useProfileAnswers";
import { useAuth } from "../../../auth/AuthProvider";
import "./profile.css";

type ProfileScreenProps = {
  flowOpen: boolean;
  onFlowOpenChange: (open: boolean) => void;
  onCompleted: (preferredName: string) => void;
  onExitIncomplete: () => void;
};

function ProfileScreen({
  flowOpen,
  onFlowOpenChange,
  onCompleted,
  onExitIncomplete,
}: ProfileScreenProps) {
  // profile is always loaded before ProfileScreen mounts (see main.tsx Gate).
  const { profile, signOut } = useAuth();
  const {
    state,
    uploadErrors,
    setAnswers,
    toggleListItem,
    toggleReportSelection,
    addUploadedReports,
    removeUploadedReport,
    setLastStep,
    markCompleted,
  } = useProfileAnswers(profile!.id);
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
    else onCompleted(state.answers.basics.preferredName);
  };

  const flow = (
    <ProfileFlow
      answers={state.answers}
      uploadErrors={uploadErrors}
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
        onCompleted(state.answers.basics.preferredName);
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
        <button
          className="p-btn pf-summary-confirm"
          type="button"
          onClick={() => openFlow(0)}
        >
          Edit answers
        </button>
        <button
          className="pf-summary-edit"
          type="button"
          onClick={() => void signOut()}
        >
          Log-out
        </button>
      </div>

      {flowOpen && flow}
    </main>
  );
}

export default ProfileScreen;
