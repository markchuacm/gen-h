import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  assignDoctor,
  cancelAppointment,
  deactivateAssignment,
  fetchAdminAppointment,
  fetchAdminCaseDetail,
  fetchAdminDoctors,
  fetchAdminLabReports,
  releaseBloodForm,
  resetInvite,
  scheduleAppointment,
  setFoundingMember,
  updateBloodDraw,
  setStage,
  STAGE_LABELS,
  STAGE_OPTIONS,
  uploadDocumentForMember,
} from "../lib/api/admin";
import type { AdminAppointment, AdminCaseDetail, AdminDoctorRow, AdminLabReport } from "../lib/api/admin";
import { fetchBloodForm, openBloodFormPdf } from "../lib/bloodForm/api";
import InviteReveal from "./InviteReveal";
import { formatConsultDate, formatConsultTime } from "../lib/api/appointments";
import { createDocumentSignedUrl } from "../lib/api/healthDocuments";
import { CLEAR_ANSWERS, lifestyleConcerns, toAnswers } from "../doctor/caseSignals";
import LabResultsSection from "./LabResultsSection";
import CaseTimeline from "./CaseTimeline";
import { formatMyr, memberQuoteSummary } from "../lib/labOrderQuote";

const DOC_TYPES = [
  { value: "health_screening", label: "Health screening" },
  { value: "genetic_tests", label: "Genetic tests" },
  { value: "other_tests", label: "Other tests" },
  { value: "other", label: "Other" },
];

const MEET_URL_PATTERN = /^https:\/\/meet\.google\.com\/.+/;

function boundaryValue(value: number, low: number, high: number, unit = "") {
  if (value < low) return `<${low}${unit}`;
  if (value > high) return `>${high}${unit}`;
  return `${value}${unit}`;
}

// Malaysia observes a fixed UTC+08:00 offset year-round, so a datetime-local
// value (wall-clock, no zone) can be pinned to KL time regardless of the admin's
// own browser timezone.
function klInputToIso(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}

function isoToKlInput(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
  return `${day}T${time}`;
}

function TagGroup({
  label,
  items,
  flagged,
}: {
  label: string;
  items: string[];
  flagged?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="adm-tag-group">
      <span className="adm-group-label">{label}</span>
      <ul className="adm-chips">
        {items.map((item) => (
          <li key={item} className={flagged && !CLEAR_ANSWERS.has(item) ? "is-flag" : ""}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseDetail({ memberId, onBack, developerMode }: {
  memberId: string;
  onBack: () => void;
  developerMode: boolean;
}) {
  const [detail, setDetail] = useState<AdminCaseDetail | null>(null);
  const [reports, setReports] = useState<AdminLabReport[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [consultAt, setConsultAt] = useState("");
  const [consultUrl, setConsultUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ tempPassword: string } | null>(null);
  const [copied, setCopied] = useState<"amount" | "summary" | null>(null);
  const [bloodForm, setBloodForm] = useState<"idle" | "previewing" | "releasing" | "scheduling">("idle");
  const [bloodDrawInput, setBloodDrawInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [d, r, a] = await Promise.all([
      fetchAdminCaseDetail(memberId),
      fetchAdminLabReports(memberId),
      fetchAdminAppointment(memberId),
    ]);
    if (d.error) setError(d.error);
    else setDetail(d.data);
    if (!r.error) setReports(r.data ?? []);
    if (!a.error) {
      setAppointment(a.data);
      setConsultAt(a.data ? isoToKlInput(a.data.scheduledAt) : "");
      setConsultUrl(a.data?.meetingUrl ?? "");
    }
  }, [memberId]);

  useEffect(() => {
    void reload();
    fetchAdminDoctors().then(({ data }) => setDoctors(data));
  }, [reload]);

  // Mirror the saved blood-draw appointment into the datetime-local input.
  const bloodDrawAt = detail?.labOrder?.bloodDrawAt ?? null;
  useEffect(() => {
    setBloodDrawInput(bloodDrawAt ? isoToKlInput(bloodDrawAt) : "");
  }, [bloodDrawAt]);

  const resultsStatus: "none" | "draft" | "released" = reports.some((r) => r.status === "released")
    ? "released"
    : reports.length > 0
      ? "draft"
      : "none";
  const carePlanStatus = (detail?.carePlan?.status ?? "none") as "none" | "draft" | "released";

  const openDoc = async (storagePath: string) => {
    const { url } = await createDocumentSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener");
  };

  const onUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    const { error: err } = await uploadDocumentForMember(memberId, file, docType);
    if (err) setError(err);
    else await reload();
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onStageChange = async (stage: string) => {
    setBusy(true);
    const { error: err } = await setStage(memberId, stage);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const onResetInvite = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await resetInvite(memberId);
    if (err) setError(err);
    else if (data) setInvite({ tempPassword: data.tempPassword });
    await reload();
    setBusy(false);
  };

  const onFoundingChange = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await setFoundingMember(memberId, !detail?.isFoundingMember);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const copyQuote = async (kind: "amount" | "summary", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => current === kind ? null : current), 1800);
    } catch {
      setError("Couldn't copy to the clipboard. Please copy the quote manually.");
    }
  };

  const onPreviewForm = async () => {
    setBloodForm("previewing");
    setError(null);
    const { data, error: err } = await fetchBloodForm(memberId);
    if (err || !data) setError(err ?? "No blood panel to preview yet.");
    else await openBloodFormPdf(data);
    setBloodForm("idle");
  };

  const onReleaseForm = async () => {
    if (!window.confirm("Confirm payment has been received and release the request form to the member? They'll be emailed a link to their dashboard, and their blood-draw appointment will be published.")) return;
    setBloodForm("releasing");
    setError(null);
    const { error: err } = await releaseBloodForm(memberId, bloodDrawInput ? klInputToIso(bloodDrawInput) : null);
    if (err) setError(err);
    else await reload();
    setBloodForm("idle");
  };

  const onSaveBloodDraw = async () => {
    setBloodForm("scheduling");
    setError(null);
    const { error: err } = await updateBloodDraw(memberId, bloodDrawInput ? klInputToIso(bloodDrawInput) : null);
    if (err) setError(err);
    else await reload();
    setBloodForm("idle");
  };

  const onAssign = async (doctorId: string) => {
    if (!doctorId) return;
    setBusy(true);
    const { error: err } = await assignDoctor(memberId, doctorId);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const onUnassign = async () => {
    setBusy(true);
    const { error: err } = await deactivateAssignment(memberId);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const onScheduleConsult = async () => {
    if (!consultAt) return;
    const iso = klInputToIso(consultAt);
    if (new Date(iso).getTime() <= Date.now()) {
      setError("Pick a consult time in the future.");
      return;
    }
    const meetingUrl = consultUrl.trim() || null;
    if (meetingUrl && !MEET_URL_PATTERN.test(meetingUrl)) {
      setError("The meeting link must be a Google Meet URL (https://meet.google.com/…).");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await scheduleAppointment(memberId, { scheduledAt: iso, meetingUrl });
    if (err) setError(err === "no_active_doctor" ? "Assign a doctor before scheduling." : err);
    else await reload();
    setBusy(false);
  };

  // Developer mode only: fills the profile with catalog-wide results and a
  // draft plan so a fully populated member can be reviewed. See demoSeed.ts.
  const onSeedProfile = async () => {
    if (!window.confirm(
      "Test data only. This adds three released lab reports covering the whole biomarker catalog and a draft care plan to this member's profile. Continue?",
    )) return;
    setSeeding(true);
    setSeedStatus("Starting…");
    setError(null);
    const { seedFullProfile } = await import("./demoSeed");
    const { data, error: err } = await seedFullProfile(
      memberId,
      { sex: detail?.sex ?? null, age: detail?.age ?? null },
      setSeedStatus,
    );
    if (err || !data) {
      setError(err ?? "Couldn't seed this profile.");
      setSeedStatus(null);
    } else if (data.carePlanError) {
      setError(`Results seeded, but the care plan didn't: ${data.carePlanError}`);
      setSeedStatus(null);
    } else {
      setSeedStatus(`Seeded ${data.biomarkers} results across ${data.reports} reports, plus a ${data.sections}-section draft care plan.`);
    }
    setSeeding(false);
    await reload();
  };

  const onCancelConsult = async () => {
    setBusy(true);
    const { error: err } = await cancelAppointment(memberId);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  if (error && !detail) {
    return (
      <section className="adm-page">
        <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
        <p role="alert" className="adm-error">Couldn't load case ({error}).</p>
      </section>
    );
  }
  if (!detail) {
    return (
      <section className="adm-page">
        <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
        <p className="adm-muted">Loading…</p>
      </section>
    );
  }

  const activeDoctors = doctors.filter((d) => d.isActive);

  // Setup not done + a temp-password window that has lapsed = expired invite.
  const inviteExpired =
    !detail.setupCompletedAt &&
    !!detail.tempPasswordExpiresAt &&
    new Date(detail.tempPasswordExpiresAt).getTime() < Date.now();

  const hasOnboarding = Object.keys(detail.onboarding).length > 0;
  const answers = hasOnboarding ? toAnswers(detail.onboarding) : null;
  const concerns = answers ? lifestyleConcerns(answers) : new Set<string>();

  // Mandatory Innoquest request-form fields; the member owns these and can only
  // complete the last three, so an admin can see at a glance what's blocking a
  // clean form before releasing it.
  const identityFields: [string, boolean][] = [
    ["Full name", !!detail.memberName?.trim()],
    ["IC / passport number", !!detail.icPassportNo?.trim()],
    ["Date of birth", !!detail.dateOfBirth],
    ["Address", !!detail.address?.trim()],
  ];
  const identityComplete = identityFields.every(([, ok]) => ok);
  const formReleased = !!detail.labOrder?.formReleasedAt;
  const canRelease = detail.labOrder?.status === "ordered" && !formReleased;

  const vitals: [string, string][] = [];
  if (detail.age != null) vitals.push(["Age", boundaryValue(detail.age, 18, 80)]);
  if (detail.sex) vitals.push(["Sex", detail.sex]);
  if (detail.heightCm != null) vitals.push(["Height", boundaryValue(detail.heightCm, 140, 220, " cm")]);
  if (detail.weightKg != null) vitals.push(["Weight", boundaryValue(detail.weightKg, 30, 200, " kg")]);

  const lifestyleFacts: [string, string][] = answers
    ? [
        [
          "Sleep",
          answers.lifestyle.sleepHours < 4
            ? "<4h per night"
            : answers.lifestyle.sleepHours > 10
              ? ">10h per night"
              : `~${answers.lifestyle.sleepHours}h per night`,
        ],
        ["Exercise", `${answers.lifestyle.exerciseDays} days per week`],
        ["Diet", answers.lifestyle.diet],
        ["Stress", `${answers.lifestyle.stress} out of 5`],
        ["Alcohol", answers.habits.alcohol],
        ["Smoking and/or vaping", answers.habits.smoking],
        ...(answers.habits.smokingProducts.length > 0
          ? [["Product types", answers.habits.smokingProducts.join(", ")]] as [string, string][]
          : []),
      ]
    : [];

  const supplements = answers ? answers.supplements.filter((s) => !CLEAR_ANSWERS.has(s)) : [];
  const subtitle = [
    detail.preferredName ? `Goes by ${detail.preferredName}` : null,
    detail.memberEmail,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="adm-page">
      <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
      {error && <p role="alert" className="adm-error">{error}</p>}

      <header className="adm-case-head">
        <div>
          <p className="p-eyebrow">Member case</p>
          <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
          <p className="adm-sub">{subtitle}</p>
        </div>
        <label className="adm-stage-correct">
          <span>Stage</span>
          <select
            value={detail.currentStage ?? ""}
            disabled={busy}
            onChange={(e) => void onStageChange(e.target.value)}
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </label>
      </header>

      {!detail.setupCompletedAt && (
        <div className="adm-card">
          <h2>Portal invite</h2>
          <p className="adm-muted">
            The member hasn't finished setting up their portal yet. Share their temporary password to let them
            sign in.
          </p>
          <div className="adm-facts">
            {detail.phone && (
              <div className="adm-fact"><span>Phone</span><strong>{detail.phone}</strong></div>
            )}
            {detail.invitedAt && (
              <div className="adm-fact">
                <span>Invited</span>
                <strong>{formatConsultDate(detail.invitedAt)}</strong>
              </div>
            )}
            <div className="adm-fact">
              <span>Status</span>
              {inviteExpired ? (
                <strong className="adm-invite-status is-expired">Invite expired</strong>
              ) : detail.tempPasswordExpiresAt ? (
                <strong className="adm-invite-status">Valid until {formatConsultDate(detail.tempPasswordExpiresAt)}</strong>
              ) : (
                <strong className="adm-invite-status">Password already set</strong>
              )}
            </div>
          </div>
          {invite ? (
            <InviteReveal
              email={detail.memberEmail ?? ""}
              tempPassword={invite.tempPassword}
              fullName={detail.memberName}
            />
          ) : (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => void onResetInvite()}>
              Generate new temporary password
            </button>
          )}
        </div>
      )}

      <CaseTimeline
        onboardingCompleted={detail.onboardingStatus === "completed"}
        doctorAssigned={!!detail.doctorId}
        resultsStatus={resultsStatus}
        carePlanStatus={carePlanStatus}
      />

      <div className="adm-card adm-membership-card">
        <div className="adm-card-head">
          <div>
            <h2>Membership</h2>
            <p className="adm-muted">Controls eligibility for the founding-member discount on the next saved quote.</p>
          </div>
          <button
            type="button"
            className={`adm-switch ${detail.isFoundingMember ? "is-on" : ""}`}
            role="switch"
            aria-checked={detail.isFoundingMember}
            disabled={busy}
            onClick={() => void onFoundingChange()}
          >
            <span aria-hidden="true" />
            {detail.isFoundingMember ? "Founding member" : "Standard member"}
          </button>
        </div>
        <p className="adm-hint">Changing this does not alter a quote the doctor has already shared.</p>
      </div>

      <div className="adm-card adm-quote-card">
        <div className="adm-card-head">
          <div>
            <h2>Blood panel quote</h2>
            <p className="adm-muted">Use the saved amount when creating the member's payment link externally.</p>
          </div>
          {detail.labOrder?.quote && (
            <span className="adm-quote-status"><Check strokeWidth={2} aria-hidden="true" /> Quote saved</span>
          )}
        </div>

        {!detail.labOrder ? (
          <p className="adm-muted">No blood panel has been saved yet.</p>
        ) : !detail.labOrder.quote ? (
          <div className="adm-quote-empty">
            <p>This panel predates saved pricing.</p>
            <span>The quote will appear after the doctor reviews and saves the panel again.</span>
          </div>
        ) : (
          <>
            <div className="adm-quote-meta">
              <div><span>Selected biomarkers</span><strong>{detail.labOrder.quote.selectedCount}</strong></div>
              <div><span>Quoted</span><strong>{new Date(detail.labOrder.quote.quotedAt).toLocaleString("en-MY", {
                dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur",
              })}</strong></div>
              <div><span>Eligibility snapshot</span><strong>{detail.labOrder.quote.isFoundingMember ? "Founding" : "Standard"}</strong></div>
            </div>

            <dl className="adm-quote-breakdown">
              <div><dt>Advanced Blood Baseline</dt><dd>{formatMyr(detail.labOrder.quote.baseAmountMinor)}</dd></div>
              <div>
                <dt>Doctor personalization adjustment</dt>
                <dd>−{formatMyr(detail.labOrder.quote.personalizationDiscountMinor)}</dd>
              </div>
              {detail.labOrder.quote.foundingDiscountMinor > 0 && (
                <div><dt>Founding member discount</dt><dd>−{formatMyr(detail.labOrder.quote.foundingDiscountMinor)}</dd></div>
              )}
              <div className="adm-quote-total"><dt>Total</dt><dd>{formatMyr(detail.labOrder.quote.totalAmountMinor)}</dd></div>
            </dl>

            <div className="adm-quote-actions">
              <button
                type="button"
                className="adm-btn-ghost"
                onClick={() => void copyQuote("amount", (detail.labOrder!.quote!.totalAmountMinor / 100).toFixed(2))}
              >
                {copied === "amount" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied === "amount" ? "Amount copied" : "Copy amount"}
              </button>
              <button
                type="button"
                className="adm-btn"
                onClick={() => void copyQuote("summary", memberQuoteSummary(detail.labOrder!.quote!))}
              >
                {copied === "summary" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied === "summary" ? "Summary copied" : "Copy member summary"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="adm-card adm-bloodform-card">
        <div className="adm-card-head">
          <div>
            <h2>Blood test request form</h2>
            <p className="adm-muted">Preview the autofilled Innoquest form, then release it once payment is confirmed.</p>
          </div>
          {formReleased && (
            <span className="adm-quote-status"><Check strokeWidth={2} aria-hidden="true" /> Released</span>
          )}
        </div>

        {!detail.labOrder ? (
          <p className="adm-muted">The doctor hasn't submitted a blood panel yet.</p>
        ) : (
          <>
            <ul className="adm-identity-check">
              {identityFields.map(([label, ok]) => (
                <li key={label} className={ok ? "is-ok" : "is-missing"}>
                  <span aria-hidden="true">{ok ? "✓" : "•"}</span>
                  {label}
                  {!ok && <em> — missing</em>}
                </li>
              ))}
            </ul>
            {!identityComplete && (
              <p className="adm-hint">
                The member must complete their details from their portal before the form will be fully filled.
                You can still preview and release; blank fields stay blank.
              </p>
            )}

            <div className="adm-field adm-blooddraw-field">
              <label htmlFor="adm-blood-draw">Blood-draw appointment (Innoquest, KL time)</label>
              <input
                id="adm-blood-draw"
                type="datetime-local"
                value={bloodDrawInput}
                onChange={(event) => setBloodDrawInput(event.target.value)}
              />
              <p className="adm-hint">
                {formReleased
                  ? "The member sees this appointment on their dashboard. Update it here to reschedule."
                  : "Set the appointment now — it's published to the member when you release the form."}
              </p>
            </div>

            <div className="adm-quote-actions">
              <button
                type="button"
                className="adm-btn-ghost"
                disabled={bloodForm !== "idle"}
                onClick={() => void onPreviewForm()}
              >
                {bloodForm === "previewing" ? "Preparing…" : "Preview form"}
              </button>
              {formReleased ? (
                <>
                  <span className="adm-muted">
                    Released {new Date(detail.labOrder.formReleasedAt!).toLocaleString("en-MY", {
                      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur",
                    })}
                  </span>
                  <button
                    type="button"
                    className="adm-btn"
                    disabled={bloodForm !== "idle"}
                    onClick={() => void onSaveBloodDraw()}
                  >
                    {bloodForm === "scheduling" ? "Saving…" : "Save appointment"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="adm-btn"
                  disabled={!canRelease || bloodForm !== "idle"}
                  title={canRelease ? undefined : "Available once the doctor has submitted the panel"}
                  onClick={() => void onReleaseForm()}
                >
                  {bloodForm === "releasing" ? "Releasing…" : "Payment received — release form"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="adm-card">
        <h2>Member profile</h2>

        {vitals.length > 0 && (
          <div className="adm-facts">
            {vitals.map(([label, value]) => (
              <div className="adm-fact" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}

        {answers && answers.reason.length > 0 && (
          <blockquote className="adm-reason adm-brief-section" aria-label="Why they're here">
            {answers.reason.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </blockquote>
        )}

        {answers ? (
          <>
            <div className="adm-brief-section">
              <div className="adm-brief-cols">
                <div className="adm-brief-col">
                  <TagGroup label="Main goals" items={answers.goals} />
                  <TagGroup label="What feels off" items={answers.symptoms} />
                  <TagGroup label="Family history" items={answers.family} flagged />
                </div>
                <div className="adm-brief-col">
                  <span className="adm-group-label">Lifestyle &amp; habits</span>
                  <dl className="adm-kv">
                    {lifestyleFacts.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className={concerns.has(label) ? "is-concern" : ""}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            <div className="adm-brief-section">
              <span className="adm-group-label">Supplements &amp; medications</span>
              {supplements.length === 0 && !answers.supplementsOther && !answers.prescriptionMedicationDetails && !detail.medications ? (
                <p className="adm-muted">Nothing at the moment.</p>
              ) : (
                <>
                  {supplements.length > 0 && (
                    <ul className="adm-chips">
                      {supplements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {answers.supplementsOther && <p className="adm-muted">{answers.supplementsOther}</p>}
                  {answers.prescriptionMedicationDetails && (
                    <p className="adm-muted">
                      Prescription medications and doses: {answers.prescriptionMedicationDetails}
                    </p>
                  )}
                  {detail.medications && (
                    <p className="adm-muted">Medications: {detail.medications}</p>
                  )}
                </>
              )}
              {detail.conditions && <p className="adm-muted">Conditions: {detail.conditions}</p>}
            </div>
          </>
        ) : (
          <div className="adm-brief-section">
            <p className="adm-muted">No onboarding responses yet.</p>
            {(detail.goals?.length || detail.medications || detail.conditions) ? (
              <dl className="adm-kv">
                {detail.goals && detail.goals.length > 0 && (
                  <div><dt>Goals</dt><dd>{detail.goals.join(", ")}</dd></div>
                )}
                {detail.medications && <div><dt>Medications</dt><dd>{detail.medications}</dd></div>}
                {detail.conditions && <div><dt>Conditions</dt><dd>{detail.conditions}</dd></div>}
              </dl>
            ) : null}
          </div>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Documents</h2>
          <div className="adm-upload">
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              disabled={busy}
              accept=".pdf,.jpg,.jpeg,.png,.csv,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && void onUpload(e.target.files[0])}
            />
          </div>
        </div>
        {detail.documents.length === 0 ? (
          <p className="adm-muted">No documents uploaded.</p>
        ) : (
          <table className="adm-table adm-table-tight">
            <thead>
              <tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th></tr>
            </thead>
            <tbody>
              {detail.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <button type="button" className="adm-link" onClick={() => void openDoc(doc.storage_path)}>
                      {doc.file_name}
                    </button>
                  </td>
                  <td>{doc.doc_type ?? "—"}</td>
                  <td className="adm-num">
                    {doc.size_bytes != null ? `${Math.round(doc.size_bytes / 1024)} KB` : "—"}
                  </td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LabResultsSection
        memberId={memberId}
        sex={detail.sex}
        age={detail.age}
        reports={reports}
        documents={detail.documents.map((d) => ({ id: d.id, file_name: d.file_name }))}
        onChange={reload}
      />

      <div className="adm-card">
        <h2>Doctor assignment</h2>
        <p className="adm-assign-current">
          {detail.doctorName ? (
            <>Assigned: <strong>{detail.doctorName}</strong></>
          ) : (
            <span className="adm-warn">No doctor assigned</span>
          )}
        </p>
        <div className="adm-assign-controls">
          <select
            defaultValue=""
            disabled={busy || activeDoctors.length === 0}
            onChange={(e) => {
              void onAssign(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              {detail.doctorId ? "Reassign to…" : "Assign a doctor…"}
            </option>
            {activeDoctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.fullName ?? d.email} ({d.assignedCount})
              </option>
            ))}
          </select>
          {detail.doctorId && (
            <button type="button" className="adm-btn-ghost" disabled={busy} onClick={() => void onUnassign()}>
              Deactivate
            </button>
          )}
        </div>
      </div>

      <div className="adm-card">
        <h2>Teleconsult</h2>
        <p className="adm-assign-current">
          {appointment ? (
            <>
              Scheduled: <strong>{formatConsultDate(appointment.scheduledAt)} at {formatConsultTime(appointment.scheduledAt)}</strong>
              {appointment.doctorName ? <> with {appointment.doctorName}</> : null}
              {appointment.meetingUrl ? (
                <> · <a href={appointment.meetingUrl} target="_blank" rel="noopener noreferrer">Meet link</a></>
              ) : (
                <> · <span className="adm-warn">no meeting link yet</span></>
              )}
            </>
          ) : (
            <span className="adm-warn">Not scheduled</span>
          )}
        </p>
        {!detail.doctorId ? (
          <p className="adm-hint">Assign a doctor first to schedule a consult.</p>
        ) : (
          <>
            <div className="adm-consult-fields">
              <label>
                <span>Date &amp; time (Malaysia time)</span>
                <input
                  type="datetime-local"
                  value={consultAt}
                  disabled={busy}
                  onChange={(e) => setConsultAt(e.target.value)}
                />
              </label>
              <label>
                <span>Google Meet link (optional)</span>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={consultUrl}
                  disabled={busy}
                  onChange={(e) => setConsultUrl(e.target.value)}
                />
              </label>
            </div>
            <div className="adm-assign-controls">
              <button type="button" className="adm-btn" disabled={busy || !consultAt} onClick={() => void onScheduleConsult()}>
                {appointment ? "Reschedule" : "Schedule"}
              </button>
              {appointment && (
                <button type="button" className="adm-btn-ghost" disabled={busy} onClick={() => void onCancelConsult()}>
                  Cancel consult
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="adm-card">
        <h2>Care plan</h2>
        <dl className="adm-kv">
          <div><dt>Status</dt><dd><span className={`adm-pill adm-pill-${carePlanStatus}`}>
            {carePlanStatus === "none" ? "Not started" : carePlanStatus === "draft" ? "Draft" : "Released"}
          </span></dd></div>
          <div><dt>Doctor</dt><dd>{detail.carePlan?.doctorName ?? detail.doctorName ?? "—"}</dd></div>
          <div><dt>Last updated</dt><dd>
            {detail.carePlan?.updatedAt ? new Date(detail.carePlan.updatedAt).toLocaleString() : "—"}
          </dd></div>
          <div><dt>Released</dt><dd>
            {detail.carePlan?.releasedAt ? new Date(detail.carePlan.releasedAt).toLocaleString() : "—"}
          </dd></div>
        </dl>
        <p className="adm-hint">Care plans are authored and released by the assigned doctor.</p>
      </div>

      {developerMode && (
        <div className="adm-card adm-card-developer">
          <h2>Seed test data</h2>
          <p className="adm-hint">
            Fills this profile with three released reports covering every biomarker in the
            catalog (12 months, 6 months and today, so trends have shape) and a five-section
            draft care plan under the assigned doctor. For reviewing how a fully populated
            member looks — not real results.
          </p>
          {!detail.doctorId && <p className="adm-hint adm-warn">Assign a doctor first, or the care plan will be skipped.</p>}
          <div className="adm-assign-controls">
            <button type="button" className="adm-btn" disabled={seeding || busy} onClick={() => void onSeedProfile()}>
              {seeding ? "Seeding…" : "Populate with test data"}
            </button>
            {seedStatus && <span role="status" className="adm-hint">{seedStatus}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

export default CaseDetail;
