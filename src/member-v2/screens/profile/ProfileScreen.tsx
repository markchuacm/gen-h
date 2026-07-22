import { useEffect, useRef, useState } from "react";
import ProfileFlow from "./ProfileFlow";
import ProfileSummary, { stepIndexOf } from "./ProfileSummary";
import type { ProfileAnswers, StepId } from "./profileQuestions";
import { useProfileAnswers } from "./useProfileAnswers";
import { useAuth } from "../../../auth/AuthProvider";
import { fetchMemberProfile, updateMemberIdentity } from "../../../lib/api/memberProfile";
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
    hydrated,
    saveError,
    flush,
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
  const [completionError, setCompletionError] = useState<string | null>(null);
  const signedFullName = profile?.consent_name?.trim() || profile?.full_name?.trim() || "";
  const identitySeeded = useRef(false);

  const completed = !!state.completedAt;

  // The identity step's source of truth is member_profiles/profiles, not the
  // onboarding draft. Seed the draft once from the server (filling only blanks),
  // so a returning member sees their saved name/IC/DOB/address in the flow.
  useEffect(() => {
    if (!hydrated || identitySeeded.current) return;
    identitySeeded.current = true;
    const id = state.answers.identity;
    void fetchMemberProfile().then(({ data }) => {
      if (!data) return;
      // Fill only blanks so an in-progress draft is never overwritten.
      setAnswers({
        identity: {
          fullName: id.fullName || data.full_name || signedFullName,
          icPassportNo: id.icPassportNo || data.ic_passport_no || "",
          dateOfBirth: id.dateOfBirth || (data.date_of_birth ? data.date_of_birth.slice(0, 10) : ""),
          address: id.address || data.address || "",
          phone: id.phone || data.phone || "",
        },
      });
    });
    // Intentionally seeded once, right after hydration; `state` is the hydrated
    // snapshot at that point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, setAnswers, signedFullName]);

  const persistIdentity = async (identity: ProfileAnswers["identity"]) => {
    await updateMemberIdentity({
      fullName: identity.fullName.trim() || undefined,
      dateOfBirth: identity.dateOfBirth || null,
      icPassportNo: identity.icPassportNo.trim() || null,
      address: identity.address.trim() || null,
      phone: identity.phone.trim() || null,
    });
  };

  const openFlow = (at = 0) => {
    setStartAt(at);
    onFlowOpenChange(true);
  };

  const handleEditStep = (stepId: StepId) => openFlow(Math.max(0, stepIndexOf(stepId)));
  const handleFlowClose = async () => {
    setCompletionError(null);
    if (!(await flush())) return;
    await persistIdentity(state.answers.identity);
    onFlowOpenChange(false);
    if (!completed) onExitIncomplete();
    else onCompleted(state.answers.basics.preferredName);
  };

  if (!hydrated) {
    return <main className="p-page pf-profile-page"><p role="status">Loading your saved profile…</p></main>;
  }

  const flow = (
    <ProfileFlow
      answers={state.answers}
      preferredNamePlaceholder={signedFullName}
      uploadErrors={uploadErrors}
      startAt={completed ? startAt : Math.max(0, state.lastStep)}
      onPatch={setAnswers}
      onToggle={toggleListItem}
      onToggleReport={toggleReportSelection}
      onAddReports={addUploadedReports}
      onRemoveReport={removeUploadedReport}
      onReachStep={setLastStep}
      onComplete={() => {
        void markCompleted(signedFullName).then(async (result) => {
          if (result.error) {
            setCompletionError(result.error);
            return;
          }
          await persistIdentity(state.answers.identity);
          onFlowOpenChange(false);
          onCompleted(result.preferredName);
        });
      }}
      onClose={handleFlowClose}
      saveError={completionError ?? saveError}
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
