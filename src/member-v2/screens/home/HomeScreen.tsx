import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FlaskConical,
  MapPin,
  Navigation,
  Video,
  X,
} from "lucide-react";
import type {
  ContextCardData,
  HeroAction,
  JourneyStateConfig,
  MemberTab,
  Step,
} from "../../journey/journeyState";
import { fetchBloodForm, downloadBloodFormPdf, type BloodFormPayload } from "../../../lib/bloodForm/api";
import { updateMemberIdentity } from "../../../lib/api/memberProfile";
import DatePicker from "../../components/DatePicker";
import { dobFromIc, PhoneField } from "../profile/identityFields";
import "./home.css";

type HomeScreenProps = {
  config: JourneyStateConfig;
  onNav: (tab: MemberTab) => void;
  onStartProfile: () => void;
};

function JourneyRail({ steps }: { steps: Step[] }) {
  return (
    <ol className="home-rail" aria-label="Your Verae Journey stages">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`home-rail-step ${
            step.state === "active" ? "is-active" : step.state === "completed" ? "is-completed" : ""
          }`}
        >
          <span className="home-rail-marker" aria-hidden="true">
            {step.state === "completed" ? <Check strokeWidth={2.4} /> : index + 1}
          </span>
          <strong className="home-rail-label">{step.label}</strong>
        </li>
      ))}
    </ol>
  );
}

function HeroCard({
  hero,
  onAction,
  onDetails,
}: {
  hero: JourneyStateConfig["hero"];
  onAction: (action: HeroAction) => void;
  onDetails: () => void;
}) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className={`home-hero-copy ${hero.pill === "Blood draw" ? "home-hero-copy--blood-draw" : ""}`}>
        <h2 id="home-hero-title">
          {hero.titleBefore}
          {hero.titleEm && <em>{hero.titleEm}</em>}
          {hero.titleAfter}
        </h2>
        <p>{hero.body}</p>
        <div className="home-hero-actions">
          {hero.primaryCta && (
            <button
              className="p-btn"
              type="button"
              disabled={hero.primaryDisabled}
              title={hero.primaryDisabled ? hero.primaryHint : undefined}
              onClick={() => onAction(hero.primaryAction)}
            >
              {hero.primaryCta}
              <ChevronRight strokeWidth={2} />
            </button>
          )}
          {hero.secondaryCta && (
            <button
              className="p-btn-ghost"
              type="button"
              aria-haspopup="dialog"
              onClick={onDetails}
            >
              {hero.secondaryCta}
            </button>
          )}
        </div>
      </div>
      <div className="home-hero-art" aria-hidden="true">
        <img src={hero.image} alt="" />
      </div>
    </section>
  );
}

function DetailsContent({
  data,
  onNav,
  onClose,
  onDownloadForm,
}: {
  data: ContextCardData;
  onNav: (tab: MemberTab) => void;
  onClose: () => void;
  onDownloadForm: () => void;
}) {
  if (data.type === "consult") {
    return (
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Your pre-test consult</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            {data.doctorInitials}
          </span>
          <div>
            <strong>{data.doctorName}</strong>
            <span>{data.doctorRole}</span>
          </div>
        </div>
        <dl className="home-context-details">
          <div>
            <CalendarDays strokeWidth={1.6} aria-hidden="true" />
            <dt>Date</dt>
            <dd>{data.date}</dd>
          </div>
          <div>
            <Clock3 strokeWidth={1.6} aria-hidden="true" />
            <dt>Time</dt>
            <dd>{data.time}</dd>
          </div>
          <div>
            <Video strokeWidth={1.6} aria-hidden="true" />
            <dt>Location</dt>
            <dd>{data.location}</dd>
          </div>
        </dl>
        {data.meetingUrl ? (
          <a className="p-btn" href={data.meetingUrl} target="_blank" rel="noopener noreferrer">
            Join consult
            <ChevronRight strokeWidth={2} />
          </a>
        ) : (
          <button className="p-btn-ghost" type="button" disabled title="Your join link will appear here soon">
            Join link coming soon
          </button>
        )}
      </section>
    );
  }

  if (data.type === "bloodDraw") {
    return (
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Blood draw details</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            {data.labInitials}
          </span>
          <div>
            <strong>{data.labName}</strong>
            <span>{data.labBranch}</span>
          </div>
        </div>
        <dl className="home-context-details">
          {data.appointment && (
            <div>
              <CalendarDays strokeWidth={1.6} aria-hidden="true" />
              <dt>Appointment</dt>
              <dd>{data.appointment}</dd>
            </div>
          )}
          <div>
            <MapPin strokeWidth={1.6} aria-hidden="true" />
            <dt>Address</dt>
            <dd>{data.labAddress}</dd>
          </div>
        </dl>
        <div className="home-context-maplinks">
          <a className="p-btn-ghost" href={data.mapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin strokeWidth={2} aria-hidden="true" /> Google Maps
          </a>
          <a className="p-btn-ghost" href={data.wazeUrl} target="_blank" rel="noopener noreferrer">
            <Navigation strokeWidth={2} aria-hidden="true" /> Waze
          </a>
        </div>
        <button
          className="p-btn"
          type="button"
          onClick={() => {
            onClose();
            onDownloadForm();
          }}
        >
          {data.primaryCta}
          <ChevronRight strokeWidth={2} />
        </button>
      </section>
    );
  }

  if (data.type === "resultsTimeline") {
    return (
      <section className="home-context" aria-labelledby="home-detail-title">
        <h3 id="home-detail-title">Where your sample is</h3>
        <div className="home-context-person">
          <span className="home-context-avatar" aria-hidden="true">
            <FlaskConical strokeWidth={1.6} style={{ width: 18, height: 18 }} />
          </span>
          <div>
            <strong>{data.testName}</strong>
            <span>Expected in {data.expectedTiming}</span>
          </div>
        </div>
        <ol className="home-timeline">
          {data.stages.map((stage) => (
            <li
              key={stage.label}
              className={`home-timeline-stage ${
                stage.state === "active"
                  ? "is-active"
                  : stage.state === "completed"
                    ? "is-completed"
                    : ""
              }`}
            >
              <span className="home-timeline-dot" aria-hidden="true">
                {stage.state === "completed" && <Check strokeWidth={2.4} />}
              </span>
              <strong>{stage.label}</strong>
            </li>
          ))}
        </ol>
        <button
          className="p-btn-ghost"
          type="button"
          onClick={() => {
            onClose();
            onNav("results");
          }}
        >
          {data.primaryCta}
        </button>
      </section>
    );
  }

  return (
    <section className="home-context" aria-labelledby="home-detail-title">
      <h3 id="home-detail-title">Your care plan, at a glance</h3>
      <div className="home-teaser-stats">
        <div>
          <strong>{data.focusAreaCount}</strong>
          <span>Focus areas</span>
        </div>
        <div>
          <strong>{data.actionCount}</strong>
          <span>Actions</span>
        </div>
        <div>
          <strong>{data.nextReview}</strong>
          <span>Next review</span>
        </div>
      </div>
      <button
        className="p-btn"
        type="button"
        onClick={() => {
          onClose();
          onNav("carePlan");
        }}
      >
        {data.primaryCta}
        <ChevronRight strokeWidth={2} />
      </button>
    </section>
  );
}

function DetailDialog({
  config,
  onClose,
  onNav,
  onDownloadForm,
}: {
  config: JourneyStateConfig;
  onClose: () => void;
  onNav: (tab: MemberTab) => void;
  onDownloadForm: () => void;
}) {
  const journeyOnly = config.journeyOnly === true;
  const [screen, setScreen] = useState<"details" | "journey">(journeyOnly ? "journey" : "details");

  return (
    <div className="home-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="home-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${config.hero.pill} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="home-detail-head">
          <button
            className="home-detail-close"
            type="button"
            aria-label="Close details"
            onClick={onClose}
          >
            <X strokeWidth={1.8} />
          </button>
        </header>
        <div className="home-detail-viewport">
          <div
            className={`home-detail-track ${screen === "journey" && !journeyOnly ? "is-journey" : ""} ${
              journeyOnly ? "is-journey-only" : ""
            }`}
          >
            {!journeyOnly && (
              <div
                className="home-detail-screen home-detail-screen--details"
                aria-hidden={screen !== "details"}
                {...(screen !== "details" ? { inert: "" } : {})}
              >
                <div className="home-detail-body">
                  <DetailsContent data={config.contextCard} onNav={onNav} onClose={onClose} onDownloadForm={onDownloadForm} />
                  <aside className="home-detail-tip">
                    <strong>{config.tip.title}</strong>
                    <p>{config.tip.body}</p>
                  </aside>
                </div>
                <button
                  className="home-detail-screen-nav home-detail-screen-next"
                  type="button"
                  aria-label="View your Verae journey"
                  onClick={() => setScreen("journey")}
                >
                  <ChevronRight strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            )}
            <div
              className={`home-detail-screen home-detail-screen--journey ${
                journeyOnly ? "home-detail-screen--journey-only" : ""
              }`}
              aria-hidden={screen !== "journey"}
              {...(screen !== "journey" ? { inert: "" } : {})}
            >
              {!journeyOnly && (
                <button
                  className="home-detail-screen-nav home-detail-screen-back"
                  type="button"
                  aria-label="Back to details"
                  onClick={() => setScreen("details")}
                >
                  <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
                </button>
              )}
              <div className="home-journey-body">
                <h3 className="home-journey-title">Your Verae Journey</h3>
                <section className="home-journey-progress" aria-label="Journey stages">
                  <JourneyRail steps={config.steps} />
                </section>
                <section className="home-journey-explainer" aria-labelledby="home-journey-explainer-title">
                  <h3 id="home-journey-explainer-title">How it works</h3>
                  <p>
                    Your journey starts with a health profile and pre-test consultation, where your
                    doctor learns what matters to you and selects the right tests. After your blood
                    draw, your results are reviewed in context and turned into a personalised care
                    plan with clear actions and follow-up.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeScreen({ config, onNav, onStartProfile }: HomeScreenProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // When the released form is missing mandatory details, we hold the payload
  // here and prompt the member to complete them before generating the PDF.
  const [confirm, setConfirm] = useState<BloodFormPayload | null>(null);

  const downloadForm = async () => {
    setFormBusy(true);
    setFormError(null);
    const { data, error } = await fetchBloodForm();
    setFormBusy(false);
    if (error || !data) {
      setFormError(error ?? "Your form isn't ready to download yet.");
      return;
    }
    if (data.missingFields.length > 0) {
      setConfirm(data);
      return;
    }
    await downloadBloodFormPdf(data);
  };

  const handleHeroAction = (action: HeroAction) => {
    if (action.kind === "tab") onNav(action.tab);
    if (action.kind === "profileFlow") onStartProfile();
    if (action.kind === "link") window.open(action.url, "_blank", "noopener");
    if (action.kind === "downloadForm") void downloadForm();
  };

  return (
    <main className="p-page home-page">
      <HeroCard
        hero={config.hero}
        onAction={handleHeroAction}
        onDetails={() => setIsDetailOpen(true)}
      />
      {formError && (
        <p className="home-form-error" role="alert">{formError}</p>
      )}
      {formBusy && (
        <p className="home-form-status" role="status">Preparing your form…</p>
      )}
      {isDetailOpen && (
        <DetailDialog
          config={config}
          onClose={() => setIsDetailOpen(false)}
          onNav={onNav}
          onDownloadForm={() => void downloadForm()}
        />
      )}
      {confirm && (
        <ConfirmDetailsModal
          payload={confirm}
          onClose={() => setConfirm(null)}
          onSaved={async () => {
            setConfirm(null);
            // Re-fetch so the PDF reflects the just-saved details.
            const { data } = await fetchBloodForm();
            if (data) await downloadBloodFormPdf(data);
          }}
        />
      )}
    </main>
  );
}

const IDENTITY_LABEL_TO_FIELD: Record<string, "fullName" | "icPassportNo" | "dateOfBirth" | "address"> = {
  "Full name": "fullName",
  "IC / passport number": "icPassportNo",
  "Date of birth": "dateOfBirth",
  "Address": "address",
};

function ConfirmDetailsModal({
  payload,
  onClose,
  onSaved,
}: {
  payload: BloodFormPayload;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [fullName, setFullName] = useState(payload.patient.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(payload.patient.dateOfBirth ?? "");
  const [icPassportNo, setIcPassportNo] = useState(payload.patient.icPassportNo ?? "");
  const [address, setAddress] = useState(payload.patient.address ?? "");
  const [phone, setPhone] = useState(payload.patient.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = new Set(
    payload.missingFields.map((label) => IDENTITY_LABEL_TO_FIELD[label]).filter(Boolean),
  );

  const submit = async () => {
    if (!fullName.trim() || !dateOfBirth || !icPassportNo.trim() || !address.trim()) {
      setError("Please complete your name, IC/passport, date of birth and address.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await updateMemberIdentity({
      fullName: fullName.trim(),
      dateOfBirth,
      icPassportNo: icPassportNo.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await onSaved();
  };

  return (
    <div className="home-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-details-title">
      <div className="home-modal">
        <button className="home-modal-close" type="button" aria-label="Close" onClick={onClose}>
          <X strokeWidth={2} />
        </button>
        <h3 id="confirm-details-title">Confirm your details</h3>
        <p className="home-modal-sub">
          These appear on your Innoquest request form, so they must match your IC exactly. Fields we
          still need are highlighted.
        </p>
        <div className="home-modal-fields">
          <label className={missing.has("fullName") ? "is-required" : ""}>
            <span>Full name (as per IC / Passport)</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </label>
          <label className={missing.has("icPassportNo") ? "is-required" : ""}>
            <span>IC / passport number</span>
            <input value={icPassportNo} onChange={(e) => {
              setIcPassportNo(e.target.value);
              const derived = dobFromIc(e.target.value);
              if (derived) setDateOfBirth(derived);
            }} />
          </label>
          <label className={missing.has("dateOfBirth") ? "is-required" : ""}>
            <span>Date of birth</span>
            <DatePicker
              id="confirm-date-of-birth"
              className="pf-other-input"
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
          </label>
          <label className={missing.has("address") ? "is-required" : ""}>
            <span>Address</span>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
          </label>
          <label>
            <span>Phone (optional)</span>
            <PhoneField value={phone} onChange={setPhone} />
          </label>
        </div>
        {error && <p className="home-form-error" role="alert">{error}</p>}
        <div className="home-modal-actions">
          <button className="p-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="p-btn" type="button" onClick={() => void submit()} disabled={saving}>
            {saving ? "Saving…" : "Save & download form"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
