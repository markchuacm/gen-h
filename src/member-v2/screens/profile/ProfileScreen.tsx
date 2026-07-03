import { useState } from "react";
import { Check } from "lucide-react";
import heroProfileImage from "../../../../assets/dashboard/health-profile-hero.png";
import ProfileFlow from "./ProfileFlow";
import ProfileSummary, { stepIndexOf } from "./ProfileSummary";
import { STEP_COUNT } from "./profileQuestions";
import type { StepId } from "./profileQuestions";
import { useProfileAnswers } from "./useProfileAnswers";
import "./profile.css";

type ProfileScreenProps = {
  flowOpen: boolean;
  onFlowOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

const COVERS = [
  "Your goals and what feels off",
  "Daily rhythm — sleep, movement, meals",
  "Family history, supplements and medications",
];

function ProfileScreen({ flowOpen, onFlowOpenChange, onCompleted }: ProfileScreenProps) {
  const { state, setAnswers, setLastStep, markCompleted, reset } = useProfileAnswers();
  const [startAt, setStartAt] = useState(0);

  const started = state.lastStep > 0;
  const completed = !!state.completedAt;

  const openFlow = (at = 0) => {
    setStartAt(at);
    onFlowOpenChange(true);
  };

  const handleEditStep = (stepId: StepId) => openFlow(Math.max(0, stepIndexOf(stepId)));

  return (
    <main className="p-page">
      <header className="home-head">
        <span className="p-eyebrow">
          {completed ? "Ready for your doctor" : "About 3 minutes · no typing"}
        </span>
        <h1 className="p-h1">
          {completed ? (
            <>
              What your doctor <em>will see</em>
            </>
          ) : (
            <>
              Your <em>profile</em>
            </>
          )}
        </h1>
      </header>

      {completed ? (
        <>
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
        </>
      ) : (
        <section className="pf-intro">
          <div className="pf-intro-copy">
            <span className="p-chip">Health profile</span>
            <h2>
              Help your doctor see the <em>full picture</em>
            </h2>
            <p>
              Eight quick questions — all taps and sliders — so your consult starts from you, not
              from a blank page.
            </p>
            <ul className="pf-intro-facts">
              {COVERS.map((item) => (
                <li key={item}>
                  <Check strokeWidth={2.2} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            {started && (
              <>
                <span className="pf-progress-note">
                  {state.lastStep} of {STEP_COUNT} answered
                </span>
                <span className="pf-progress-track" aria-hidden="true">
                  <span style={{ width: `${(state.lastStep / STEP_COUNT) * 100}%` }} />
                </span>
              </>
            )}
            <button className="p-btn" type="button" onClick={() => openFlow(started ? state.lastStep : 0)}>
              {started ? "Continue your profile" : "Start your profile"}
            </button>
          </div>
          <div className="pf-intro-art" aria-hidden="true">
            <img src={heroProfileImage} alt="" />
          </div>
        </section>
      )}

      {flowOpen && (
        <ProfileFlow
          answers={state.answers}
          startAt={startAt}
          onPatch={setAnswers}
          onReachStep={setLastStep}
          onComplete={() => {
            markCompleted();
            onFlowOpenChange(false);
            onCompleted();
          }}
          onClose={() => onFlowOpenChange(false)}
        />
      )}
    </main>
  );
}

export default ProfileScreen;
