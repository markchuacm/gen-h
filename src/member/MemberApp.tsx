import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  FileUp,
  HeartHandshake,
  Home,
  IdCard,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Pill,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import heroConsultImage from "../../assets/generated/hero-consult.png";

type Route =
  | "/login"
  | "/register"
  | "/forgot-password"
  | "/dashboard"
  | "/onboarding/start"
  | "/onboarding/reason"
  | "/onboarding/about"
  | "/onboarding/health-context"
  | "/onboarding/reports"
  | "/onboarding/review"
  | "/onboarding/submitted";

type StepId = "reason" | "about" | "health" | "review";
type StepStatus = "not-started" | "in-progress" | "complete" | "locked";
type TernaryAnswer = "" | "no" | "yes" | "not-sure";

type Account = {
  fullName: string;
  email: string;
  mobile: string;
};

type ReasonData = {
  selected: string[];
  otherText: string;
  doctorNote: string;
};

type AboutData = {
  legalName: string;
  preferredName: string;
  dob: string;
  sexAtBirth: string;
  idType: "nric" | "passport";
  idNumber: string;
  nationality: string;
  email: string;
  mobile: string;
  cityState: string;
};

type MedicationEntry = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes: string;
  photoName: string;
};

type LifestyleData = {
  sleep: string;
  sleepNote: string;
  exercise: string;
  exerciseNote: string;
  nutrition: string;
  nutritionNote: string;
  stress: string;
  stressNote: string;
  smoking: string;
  alcohol: string;
};

type HealthData = {
  conditionStatus: TernaryAnswer;
  conditionsText: string;
  conditionPrompts: string[];
  allergyStatus: TernaryAnswer;
  allergyTypes: string[];
  allergyDetails: string;
  familyStatus: TernaryAnswer;
  familyConditions: string[];
  familyNote: string;
  medsStatus: TernaryAnswer;
  medications: MedicationEntry[];
  supplements: MedicationEntry[];
  lifestyle: LifestyleData;
};

type ReportEntry = {
  id: string;
  fileName: string;
  reportDate: string;
  reportType: string;
  source: string;
  notes: string;
};

type ReportsData = {
  intent: "" | "upload" | "later" | "none";
  files: ReportEntry[];
};

type ReviewData = {
  accuracy: boolean;
  informationUse: boolean;
  careTeamReview: boolean;
  telehealthLimits: boolean;
  privacyTerms: boolean;
  typedName: string;
};

type HealthStory = {
  account: Account;
  reason: ReasonData;
  about: AboutData;
  health: HealthData;
  reports: ReportsData;
  review: ReviewData;
  submitted: boolean;
};

const routes: Route[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/dashboard",
  "/onboarding/start",
  "/onboarding/reason",
  "/onboarding/about",
  "/onboarding/health-context",
  "/onboarding/reports",
  "/onboarding/review",
  "/onboarding/submitted",
];

const authRoutes: Route[] = ["/login", "/register", "/forgot-password"];

const consultDate = "Wednesday, 17 July · 10:30 AM";

const routeTitles: Record<Route, string> = {
  "/login": "Log in",
  "/register": "Create account",
  "/forgot-password": "Reset password",
  "/dashboard": "Dashboard",
  "/onboarding/start": "Start",
  "/onboarding/reason": "Reason",
  "/onboarding/about": "About you",
  "/onboarding/health-context": "Health context",
  "/onboarding/reports": "Reports",
  "/onboarding/review": "Review",
  "/onboarding/submitted": "Submitted",
};

const reasonOptions = [
  { id: "deeper-picture", label: "I want a deeper picture of my health and future risks" },
  { id: "family-history", label: "I have family history I'm concerned about" },
  { id: "normal-screening", label: "My usual screening looked normal, but I still have concerns" },
  { id: "performance", label: "I want to improve my energy, fitness, or day-to-day performance" },
  { id: "past-results", label: "I want help making sense of past blood results" },
  { id: "other", label: "Other" },
] as const;

const sexOptions = ["Female", "Male", "Intersex / prefer to specify"] as const;
const conditionPrompts = [
  "High cholesterol",
  "High blood pressure",
  "Prediabetes / diabetes",
  "Thyroid issues",
  "Asthma",
  "PCOS",
  "Gout",
  "Anxiety / depression",
  "Other",
] as const;
const allergyTypeOptions = ["Medication", "Food", "Supplement", "Environmental", "Other"] as const;
const familyConditionOptions = [
  "Heart disease or heart attack",
  "Stroke",
  "Diabetes",
  "High blood pressure",
  "High cholesterol",
  "Cancer",
  "Dementia or Alzheimer's",
  "Kidney disease",
  "Autoimmune disease",
  "Other",
] as const;
const sleepOptions = ["Generally good", "Inconsistent", "Poor", "Not sure"] as const;
const exerciseOptions = [
  "Little to no regular exercise",
  "Light activity",
  "Moderate exercise 1-2x/week",
  "Regular exercise 3-5x/week",
  "High training load",
] as const;
const nutritionOptions = ["Mostly home-cooked / balanced", "Mixed", "Often eating out", "Specific diet pattern", "Not sure"] as const;
const stressOptions = ["Low", "Manageable", "High", "Very high", "Not sure"] as const;
const smokingOptions = ["No", "Occasionally", "Regularly", "Previously, but stopped"] as const;
const alcoholOptions = ["Rarely / never", "1-2 drinks per week", "3-6 drinks per week", "7+ drinks per week", "Prefer not to say"] as const;
const reportTypeOptions = [
  "Blood test report",
  "Health screening report",
  "Urine test report",
  "Imaging or scan report",
  "Genetic report",
  "Specialist letter",
  "Other relevant document",
] as const;

const requiredSteps: Array<{
  id: StepId;
  path: Route;
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    id: "reason",
    path: "/onboarding/reason",
    title: "Your reason for joining",
    description: "Tell your doctor what you're hoping to understand.",
    Icon: HeartHandshake,
  },
  {
    id: "about",
    path: "/onboarding/about",
    title: "About you",
    description: "Confirm your details so we can match your records safely.",
    Icon: UserRound,
  },
  {
    id: "health",
    path: "/onboarding/health-context",
    title: "Your health context",
    description: "Share your medical background, current routine, and lifestyle snapshot.",
    Icon: ClipboardList,
  },
  {
    id: "review",
    path: "/onboarding/review",
    title: "Review and submit",
    description: "Confirm your information and permissions before doctor review.",
    Icon: ClipboardCheck,
  },
];

function parseRoute(): Route {
  const raw = window.location.hash.replace(/^#/, "").split("?")[0] || "/login";
  return routes.includes(raw as Route) ? (raw as Route) : "/login";
}

function navigate(route: Route) {
  window.location.hash = route;
}

function createMedication(): MedicationEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    dosage: "",
    frequency: "",
    notes: "",
    photoName: "",
  };
}

function createEmptyStory(account: Account = { fullName: "", email: "", mobile: "" }): HealthStory {
  return {
    account,
    reason: {
      selected: [],
      otherText: "",
      doctorNote: "",
    },
    about: {
      legalName: account.fullName,
      preferredName: "",
      dob: "",
      sexAtBirth: "",
      idType: "nric",
      idNumber: "",
      nationality: "Malaysian",
      email: account.email,
      mobile: account.mobile,
      cityState: "",
    },
    health: {
      conditionStatus: "",
      conditionsText: "",
      conditionPrompts: [],
      allergyStatus: "",
      allergyTypes: [],
      allergyDetails: "",
      familyStatus: "",
      familyConditions: [],
      familyNote: "",
      medsStatus: "",
      medications: [],
      supplements: [],
      lifestyle: {
        sleep: "",
        sleepNote: "",
        exercise: "",
        exerciseNote: "",
        nutrition: "",
        nutritionNote: "",
        stress: "",
        stressNote: "",
        smoking: "",
        alcohol: "",
      },
    },
    reports: {
      intent: "",
      files: [],
    },
    review: {
      accuracy: false,
      informationUse: false,
      careTeamReview: false,
      telehealthLimits: false,
      privacyTerms: false,
      typedName: "",
    },
    submitted: false,
  };
}

function createPartialStory(): HealthStory {
  const story = createEmptyStory({
    fullName: "Alya Tan",
    email: "alya.tan@example.com",
    mobile: "+60 12 345 6789",
  });
  story.reason = {
    selected: ["deeper-picture", "past-results"],
    otherText: "",
    doctorNote: "I want to understand why my energy dips even when routine screenings look normal.",
  };
  story.about = {
    legalName: "Alya Tan",
    preferredName: "Alya",
    dob: "1988-04-16",
    sexAtBirth: "Female",
    idType: "nric",
    idNumber: "880416-10-1234",
    nationality: "Malaysian",
    email: "alya.tan@example.com",
    mobile: "+60 12 345 6789",
    cityState: "Petaling Jaya, Selangor",
  };
  story.health.conditionStatus = "yes";
  story.health.conditionPrompts = ["High cholesterol"];
  story.health.medsStatus = "yes";
  story.health.medications = [createMedication()];
  return story;
}

function createSubmittedStory(): HealthStory {
  const story = createPartialStory();
  story.health = {
    conditionStatus: "yes",
    conditionsText: "High cholesterol was first mentioned in 2022. I am not on medication currently.",
    conditionPrompts: ["High cholesterol"],
    allergyStatus: "no",
    allergyTypes: [],
    allergyDetails: "",
    familyStatus: "yes",
    familyConditions: ["Heart disease or heart attack", "Diabetes"],
    familyNote: "Father had a heart attack at 52. Mother has diabetes.",
    medsStatus: "yes",
    medications: [
      {
        id: crypto.randomUUID(),
        name: "Cetirizine",
        dosage: "10mg",
        frequency: "As needed",
        notes: "For seasonal allergies.",
        photoName: "",
      },
    ],
    supplements: [
      {
        id: crypto.randomUUID(),
        name: "Vitamin D",
        dosage: "1000 IU",
        frequency: "Daily",
        notes: "Started after previous blood test.",
        photoName: "",
      },
    ],
    lifestyle: {
      sleep: "Inconsistent",
      sleepNote: "Waking often during busy work periods.",
      exercise: "Moderate exercise 1-2x/week",
      exerciseNote: "Gym and walking.",
      nutrition: "Mixed",
      nutritionNote: "Mostly balanced, eating out on weekdays.",
      stress: "Manageable",
      stressNote: "Busy quarter at work.",
      smoking: "No",
      alcohol: "1-2 drinks per week",
    },
  };
  story.reports = {
    intent: "upload",
    files: [
      {
        id: crypto.randomUUID(),
        fileName: "2025-health-screening.pdf",
        reportDate: "2025-11-14",
        reportType: "Health screening report",
        source: "BP Healthcare",
        notes: "Annual screening report.",
      },
    ],
  };
  story.review = {
    accuracy: true,
    informationUse: true,
    careTeamReview: true,
    telehealthLimits: true,
    privacyTerms: true,
    typedName: story.about.legalName,
  };
  story.submitted = true;
  return story;
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function isReasonComplete(reason: ReasonData) {
  return reason.selected.length > 0 && (!reason.selected.includes("other") || hasText(reason.otherText));
}

function isReasonStarted(reason: ReasonData) {
  return reason.selected.length > 0 || hasText(reason.otherText) || hasText(reason.doctorNote);
}

function isAboutComplete(about: AboutData) {
  return (
    hasText(about.legalName) &&
    hasText(about.dob) &&
    hasText(about.sexAtBirth) &&
    hasText(about.idNumber) &&
    hasText(about.email) &&
    hasText(about.mobile) &&
    hasText(about.cityState) &&
    (about.idType === "nric" || hasText(about.nationality))
  );
}

function isAboutStarted(about: AboutData) {
  return [
    about.legalName,
    about.preferredName,
    about.dob,
    about.sexAtBirth,
    about.idNumber,
    about.email,
    about.mobile,
    about.cityState,
  ].some(hasText);
}

function isHealthComplete(health: HealthData) {
  const conditionComplete =
    hasText(health.conditionStatus) &&
    (health.conditionStatus === "no" || hasText(health.conditionsText));
  const allergyComplete =
    hasText(health.allergyStatus) &&
    (health.allergyStatus === "no" || (health.allergyTypes.length > 0 && hasText(health.allergyDetails)));
  const familyComplete =
    hasText(health.familyStatus) &&
    (health.familyStatus !== "yes" || health.familyConditions.length > 0);
  const lifestyleComplete = [
    health.lifestyle.sleep,
    health.lifestyle.exercise,
    health.lifestyle.nutrition,
    health.lifestyle.stress,
    health.lifestyle.smoking,
    health.lifestyle.alcohol,
  ].every(hasText);

  return conditionComplete && allergyComplete && familyComplete && hasText(health.medsStatus) && lifestyleComplete;
}

function isHealthStarted(health: HealthData) {
  return (
    hasText(health.conditionStatus) ||
    hasText(health.conditionsText) ||
    health.conditionPrompts.length > 0 ||
    hasText(health.allergyStatus) ||
    health.allergyTypes.length > 0 ||
    hasText(health.allergyDetails) ||
    hasText(health.familyStatus) ||
    health.familyConditions.length > 0 ||
    hasText(health.familyNote) ||
    hasText(health.medsStatus) ||
    health.medications.length > 0 ||
    health.supplements.length > 0 ||
    Object.values(health.lifestyle).some(hasText)
  );
}

function areReviewConsentsComplete(story: HealthStory) {
  return (
    story.review.accuracy &&
    story.review.informationUse &&
    story.review.careTeamReview &&
    story.review.telehealthLimits &&
    story.review.privacyTerms &&
    story.review.typedName.trim().toLowerCase() === story.about.legalName.trim().toLowerCase()
  );
}

function getStepStatus(story: HealthStory, stepId: StepId): StepStatus {
  const reasonComplete = isReasonComplete(story.reason);
  const aboutComplete = isAboutComplete(story.about);
  const healthComplete = isHealthComplete(story.health);

  if (stepId === "reason") {
    return reasonComplete ? "complete" : isReasonStarted(story.reason) ? "in-progress" : "not-started";
  }

  if (stepId === "about") {
    return aboutComplete ? "complete" : isAboutStarted(story.about) ? "in-progress" : "not-started";
  }

  if (stepId === "health") {
    return healthComplete ? "complete" : isHealthStarted(story.health) ? "in-progress" : "not-started";
  }

  if (!reasonComplete || !aboutComplete || !healthComplete) {
    return "locked";
  }

  return story.submitted ? "complete" : areReviewConsentsComplete(story) ? "in-progress" : "not-started";
}

function getCompletedCount(story: HealthStory) {
  return requiredSteps.filter((step) => getStepStatus(story, step.id) === "complete").length;
}

function getNextRequiredPath(story: HealthStory): Route {
  if (!isReasonComplete(story.reason)) return "/onboarding/reason";
  if (!isAboutComplete(story.about)) return "/onboarding/about";
  if (!isHealthComplete(story.health)) return "/onboarding/health-context";
  if (!story.submitted) return "/onboarding/review";
  return "/onboarding/submitted";
}

function statusLabel(status: StepStatus) {
  if (status === "in-progress") return "In progress";
  if (status === "complete") return "Complete";
  if (status === "locked") return "Locked";
  return "Not started";
}

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <label className="member-field">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      <input
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  helper,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <label className="member-field member-field-wide">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      {helper ? <small>{helper}</small> : null}
      <textarea onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} value={value} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <label className="member-field">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      <select onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="member-check-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function ChoiceGroup({
  label,
  helper,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  helper?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="member-choice-group">
      <legend>
        {label}
        {required ? <em>*</em> : null}
      </legend>
      {helper ? <p>{helper}</p> : null}
      <div className="member-choice-grid">
        {options.map((option) => (
          <button
            className={`member-choice ${value === option ? "is-selected" : ""}`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            <span>{option}</span>
            {value === option ? <Check size={16} /> : <Circle size={14} />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultiChoiceGroup({
  label,
  helper,
  options,
  values,
  onToggle,
  required,
}: {
  label: string;
  helper?: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="member-choice-group">
      <legend>
        {label}
        {required ? <em>*</em> : null}
      </legend>
      {helper ? <p>{helper}</p> : null}
      <div className="member-choice-grid">
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              className={`member-choice ${selected ? "is-selected" : ""}`}
              key={option}
              onClick={() => onToggle(option)}
              type="button"
            >
              <span>{option}</span>
              {selected ? <Check size={16} /> : <Circle size={14} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function InlineNotice({ children, tone = "warm" }: { children: ReactNode; tone?: "warm" | "success" | "warning" }) {
  return (
    <div className={`member-notice member-notice-${tone}`}>
      <AlertCircle aria-hidden="true" size={18} />
      <p>{children}</p>
    </div>
  );
}

function AuthLayout({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  return (
    <main className="member-auth-shell">
      <section className="member-auth-hero">
        <img alt="" aria-hidden="true" src={heroConsultImage} />
        <div className="member-auth-hero-copy">
          <p>{eyebrow}</p>
          <h1>Welcome to Gen-H</h1>
          <span>Prepare for your consult, upload reports, and review your care plan in one place.</span>
          <small>Doctor-led preventive health, built around your personal health story.</small>
        </div>
      </section>
      <section className="member-auth-panel">{children}</section>
    </main>
  );
}

function AuthCard({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <div className="member-auth-card">
      <a className="member-wordmark" href="/" aria-label="Gen-H home">
        Gen-H
      </a>
      <div className="member-card-heading">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {children}
    </div>
  );
}

function LoginPage({
  onLogin,
}: {
  onLogin: (account: Account) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasText(email) || !hasText(password)) {
      setError("Enter your email and password to continue.");
      return;
    }

    onLogin({ fullName: "Gen-H Member", email, mobile: "" });
  };

  return (
    <AuthLayout eyebrow="Member space">
      <AuthCard
        title="Log in to your member space"
        copy="Tell us your health story so your doctor can understand your context before you meet."
      >
        <form className="member-form" onSubmit={submit}>
          <Field autoComplete="email" label="Email" onChange={setEmail} required type="email" value={email} />
          <Field
            autoComplete="current-password"
            label="Password"
            onChange={setPassword}
            required
            type="password"
            value={password}
          />
          {error ? <InlineNotice tone="warning">{error}</InlineNotice> : null}
          <button className="member-button member-button-primary" type="submit">
            <LogIn size={18} />
            Log in
          </button>
          <div className="member-auth-links">
            <button onClick={() => navigate("/forgot-password")} type="button">
              Forgot password?
            </button>
            <button onClick={() => navigate("/register")} type="button">
              New to Gen-H? Create account
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

function RegisterPage({
  onRegister,
}: {
  onRegister: (account: Account) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (![fullName, email, mobile, password, confirmPassword].every(hasText)) {
      setError("Complete the required account details to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    if (!terms) {
      setError("Please agree to Gen-H's account terms and privacy notice.");
      return;
    }

    onRegister({ fullName, email, mobile });
  };

  return (
    <AuthLayout eyebrow="Secure access">
      <AuthCard
        title="Create your Gen-H account"
        copy="Set up secure access now. Your health context comes next, after we explain why it helps your doctor."
      >
        <form className="member-form" onSubmit={submit}>
          <Field autoComplete="name" label="Full name" onChange={setFullName} required value={fullName} />
          <Field autoComplete="email" label="Email" onChange={setEmail} required type="email" value={email} />
          <Field autoComplete="tel" label="Mobile number" onChange={setMobile} required type="tel" value={mobile} />
          <Field
            autoComplete="new-password"
            label="Password"
            onChange={setPassword}
            required
            type="password"
            value={password}
          />
          <Field
            autoComplete="new-password"
            label="Confirm password"
            onChange={setConfirmPassword}
            required
            type="password"
            value={confirmPassword}
          />
          <CheckField
            checked={terms}
            label="I agree to Gen-H's account terms and privacy notice"
            onChange={setTerms}
          />
          {error ? <InlineNotice tone="warning">{error}</InlineNotice> : null}
          <button className="member-button member-button-primary" type="submit">
            <ShieldCheck size={18} />
            Create account
          </button>
          <div className="member-auth-links">
            <button onClick={() => navigate("/login")} type="button">
              Already have access? Log in
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout eyebrow="Account help">
      <AuthCard title="Reset your password" copy="Enter your email and we'll send you instructions to reset your password.">
        <form className="member-form" onSubmit={submit}>
          <Field autoComplete="email" label="Email" onChange={setEmail} required type="email" value={email} />
          {submitted ? <InlineNotice tone="success">Reset instructions have been sent if this email is registered.</InlineNotice> : null}
          <button className="member-button member-button-primary" type="submit">
            <Mail size={18} />
            Send reset link
          </button>
          <div className="member-auth-links">
            <button onClick={() => navigate("/login")} type="button">
              Return to login
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

function MemberShell({
  story,
  children,
  currentRoute,
  onApplyMockState,
  onLogout,
}: {
  story: HealthStory;
  children: ReactNode;
  currentRoute: Route;
  onApplyMockState: (state: "new" | "partial" | "submitted") => void;
  onLogout: () => void;
}) {
  const completedCount = getCompletedCount(story);

  return (
    <div className="member-app-shell">
      <aside className="member-sidebar">
        <button className="member-sidebar-logo" onClick={() => navigate("/dashboard")} type="button">
          <span>Gen-H</span>
          <small>Member space</small>
        </button>
        <nav aria-label="Member navigation" className="member-sidebar-nav">
          <button className={currentRoute === "/dashboard" ? "is-active" : ""} onClick={() => navigate("/dashboard")} type="button">
            <Home size={18} />
            Dashboard
          </button>
          <button className={currentRoute.startsWith("/onboarding") ? "is-active" : ""} onClick={() => navigate(getNextRequiredPath(story))} type="button">
            <Sparkles size={18} />
            Health story
          </button>
          <button className={currentRoute === "/onboarding/reports" ? "is-active" : ""} onClick={() => navigate("/onboarding/reports")} type="button">
            <FileUp size={18} />
            Reports
          </button>
        </nav>
        <div className="member-sidebar-meta">
          <div>
            <span>Required progress</span>
            <strong>{completedCount} of 4</strong>
          </div>
          <div>
            <span>Your consult</span>
            <strong>{consultDate}</strong>
          </div>
        </div>
        <label className="member-preview-select">
          <span>Preview</span>
          <select onChange={(event) => onApplyMockState(event.target.value as "new" | "partial" | "submitted")} defaultValue="new">
            <option value="new">New member</option>
            <option value="partial">Partially complete</option>
            <option value="submitted">Submitted</option>
          </select>
        </label>
        <button className="member-sidebar-logout" onClick={onLogout} type="button">
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <div className="member-main-area">
        <header className="member-topbar">
          <div>
            <span>{routeTitles[currentRoute]}</span>
            <strong>{story.account.fullName || story.about.preferredName || "Gen-H Member"}</strong>
          </div>
          <button className="member-button member-button-secondary" onClick={() => navigate("/dashboard")} type="button">
            <Home size={17} />
            Dashboard
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ story }: { story: HealthStory }) {
  const completedCount = getCompletedCount(story);
  const progressPercent = (completedCount / requiredSteps.length) * 100;
  const nextPath = getNextRequiredPath(story);
  const reasonComplete = isReasonComplete(story.reason);
  const aboutComplete = isAboutComplete(story.about);
  const healthComplete = isHealthComplete(story.health);

  return (
    <main className="member-page member-dashboard">
      <section className={`member-dashboard-hero ${story.submitted ? "is-submitted" : ""}`}>
        <div>
          <p className="member-eyebrow">Consult preparation hub</p>
          <h1>{story.submitted ? "Your health story has been submitted" : "Prepare for your first Gen-H consult"}</h1>
          <p>
            {story.submitted
              ? "Your doctor will review your information before your consult."
              : "Tell us your health story so your doctor can understand your context before you meet."}
          </p>
        </div>
        <div className="member-hero-status">
          <span>{completedCount} of 4 required steps complete</span>
          <div className="member-progress-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="member-hero-stats">
            <span>
              <Clock3 size={16} />
              10-15 minutes
            </span>
            <span>
              <CalendarDays size={16} />
              {consultDate}
            </span>
          </div>
          <button className="member-button member-button-primary" onClick={() => navigate(nextPath)} type="button">
            {story.submitted ? "View submitted story" : completedCount > 0 ? "Continue" : "Start my health story"}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="member-dashboard-grid" aria-label="Required preparation steps">
        {requiredSteps.map((step) => {
          const status = getStepStatus(story, step.id);
          const locked = status === "locked";
          const cta = status === "complete" ? "Review" : status === "in-progress" ? "Continue" : "Start";
          const target = step.id === "review" && !reasonComplete ? "/onboarding/reason" : step.id === "review" && !aboutComplete ? "/onboarding/about" : step.id === "review" && !healthComplete ? "/onboarding/health-context" : step.path;

          return (
            <article className={`member-step-card member-step-${status}`} key={step.id}>
              <div className="member-step-icon">
                {locked ? <LockKeyhole size={22} /> : <step.Icon size={22} />}
              </div>
              <div>
                <span className="member-status-badge">{statusLabel(status)}</span>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </div>
              <button className="member-card-link" disabled={locked} onClick={() => navigate(target)} type="button">
                {locked ? "Complete earlier steps" : cta}
                <ChevronRight size={17} />
              </button>
            </article>
          );
        })}
      </section>

      <section className="member-dashboard-lower">
        <article className="member-reports-card">
          <div>
            <span className="member-status-badge member-status-optional">Optional but helpful</span>
            <h2>{story.submitted ? "Upload additional reports" : "Upload past reports"}</h2>
            <p>
              Previous blood tests or screenings help your doctor spot trends and avoid unnecessary repeat testing.
            </p>
            <small>Reports from the last 24 months are most useful, but you can continue without them.</small>
          </div>
          <button className="member-button member-button-secondary" onClick={() => navigate("/onboarding/reports")} type="button">
            <Upload size={17} />
            {story.reports.files.length > 0 ? "Manage reports" : "Upload reports"}
          </button>
        </article>

        <article className="member-next-card">
          <p className="member-eyebrow">What happens next</p>
          <ol>
            <li>
              <strong>Submit your health story</strong>
              <span>We'll organise your information for your doctor.</span>
            </li>
            <li>
              <strong>Your doctor reviews your context</strong>
              <span>They'll review your background, current routine, and any uploaded reports.</span>
            </li>
            <li>
              <strong>Join your first consult</strong>
              <span>Your doctor will discuss your concerns and recommend the right next steps.</span>
            </li>
          </ol>
        </article>
      </section>
    </main>
  );
}

function OnboardingLayout({
  route,
  story,
  title,
  subtext,
  children,
  backTo,
}: {
  route: Route;
  story: HealthStory;
  title: string;
  subtext: string;
  children: ReactNode;
  backTo?: Route;
}) {
  const completedCount = getCompletedCount(story);
  const progressPercent = (completedCount / requiredSteps.length) * 100;

  return (
    <main className="member-page member-onboarding-page">
      <div className="member-onboarding-top">
        <button className="member-back-button" onClick={() => navigate(backTo ?? "/dashboard")} type="button">
          <ArrowLeft size={17} />
          Back
        </button>
        <div className="member-step-progress">
          <span>{completedCount} of 4 complete</span>
          <div className="member-progress-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
      <section className="member-onboarding-header">
        <p className="member-eyebrow">{routeTitles[route]}</p>
        <h1>{title}</h1>
        <p>{subtext}</p>
      </section>
      {children}
    </main>
  );
}

function StartScreen({ story }: { story: HealthStory }) {
  return (
    <OnboardingLayout
      route="/onboarding/start"
      story={story}
      title="Prepare for your first Gen-H consult"
      subtext="Tell us your health story so your doctor can understand your context before you meet."
    >
      <section className="member-content-card member-consent-gate">
        <ShieldCheck size={28} />
        <div>
          <h2>Before we begin</h2>
          <p>
            We'll ask about your health background, lifestyle, current medications or supplements, and any past reports
            you'd like your doctor to review.
          </p>
          <p>
            By continuing, you consent for Gen-H to collect this information to prepare your first consult. You'll review
            the full consent and privacy terms before submitting.
          </p>
        </div>
        <div className="member-sticky-actions">
          <button className="member-button member-button-primary" onClick={() => navigate("/onboarding/reason")} type="button">
            Start my health story
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}

function ReasonScreen({
  story,
  updateReason,
}: {
  story: HealthStory;
  updateReason: (patch: Partial<ReasonData>) => void;
}) {
  const [showError, setShowError] = useState(false);
  const complete = isReasonComplete(story.reason);

  const continueNext = () => {
    if (!complete) {
      setShowError(true);
      return;
    }
    navigate("/onboarding/about");
  };

  return (
    <OnboardingLayout
      route="/onboarding/reason"
      story={story}
      title="Your reason for joining"
      subtext="Select any that feel relevant. This helps your doctor understand what matters most before your first consult."
      backTo="/onboarding/start"
    >
      <section className="member-content-card">
        <MultiChoiceGroup
          helper="What brings you to Gen-H?"
          label="Select any that feel relevant"
          onToggle={(value) => updateReason({ selected: toggleInList(story.reason.selected, value) })}
          options={reasonOptions.map((option) => option.label)}
          required
          values={story.reason.selected.map((id) => reasonOptions.find((option) => option.id === id)?.label ?? id)}
        />
        <ReasonOptionBridge story={story} updateReason={updateReason} />
        {story.reason.selected.includes("other") ? (
          <TextArea
            label="Tell us what brings you here"
            onChange={(otherText) => updateReason({ otherText })}
            required
            value={story.reason.otherText}
          />
        ) : null}
        <TextArea
          label="Anything else you'd like your doctor to know?"
          onChange={(doctorNote) => updateReason({ doctorNote })}
          placeholder="A short note is enough."
          value={story.reason.doctorNote}
        />
        {showError && !complete ? (
          <InlineNotice tone="warning">Select at least one reason so your doctor knows what to focus on.</InlineNotice>
        ) : null}
        <div className="member-sticky-actions">
          <button className="member-button member-button-primary" onClick={continueNext} type="button">
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}

function ReasonOptionBridge({
  story,
  updateReason,
}: {
  story: HealthStory;
  updateReason: (patch: Partial<ReasonData>) => void;
}) {
  const selectedLabels = story.reason.selected
    .map((id) => reasonOptions.find((option) => option.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="member-hidden-sync" aria-hidden="true">
      {reasonOptions.map((option) => {
        const isSelected = selectedLabels.includes(option.label);

        return (
          <button
            key={option.id}
            onClick={() => updateReason({ selected: toggleInList(story.reason.selected, option.id) })}
            type="button"
            data-selected={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AboutScreen({
  story,
  updateAbout,
}: {
  story: HealthStory;
  updateAbout: (patch: Partial<AboutData>) => void;
}) {
  const [showError, setShowError] = useState(false);
  const complete = isAboutComplete(story.about);

  const continueNext = () => {
    if (!complete) {
      setShowError(true);
      return;
    }
    navigate("/onboarding/health-context");
  };

  return (
    <OnboardingLayout
      route="/onboarding/about"
      story={story}
      title="About you"
      subtext="We use these details to match your consult notes, reports, and lab records safely."
      backTo="/onboarding/reason"
    >
      <section className="member-content-card">
        <div className="member-form-grid">
          <Field label="Full legal name" onChange={(legalName) => updateAbout({ legalName })} required value={story.about.legalName} />
          <Field label="Preferred name" onChange={(preferredName) => updateAbout({ preferredName })} value={story.about.preferredName} />
          <Field label="Date of birth" onChange={(dob) => updateAbout({ dob })} required type="date" value={story.about.dob} />
          <SelectField
            label="Sex at birth"
            onChange={(sexAtBirth) => updateAbout({ sexAtBirth })}
            options={sexOptions}
            required
            value={story.about.sexAtBirth}
          />
          <label className="member-field">
            <span>
              ID type<em>*</em>
            </span>
            <select
              onChange={(event) => {
                const idType = event.target.value as "nric" | "passport";
                updateAbout({ idType, nationality: idType === "nric" ? "Malaysian" : "" });
              }}
              value={story.about.idType}
            >
              <option value="nric">NRIC</option>
              <option value="passport">Passport</option>
            </select>
          </label>
          <Field label="ID number" onChange={(idNumber) => updateAbout({ idNumber })} required value={story.about.idNumber} />
          <Field
            disabled={story.about.idType === "nric"}
            label="Nationality"
            onChange={(nationality) => updateAbout({ nationality })}
            required={story.about.idType === "passport"}
            value={story.about.nationality}
          />
          <Field label="Email" onChange={(email) => updateAbout({ email })} required type="email" value={story.about.email} />
          <Field label="Mobile number" onChange={(mobile) => updateAbout({ mobile })} required type="tel" value={story.about.mobile} />
          <Field label="City / state" onChange={(cityState) => updateAbout({ cityState })} required value={story.about.cityState} />
        </div>
        {showError && !complete ? <InlineNotice tone="warning">Complete the required details so we can match your records safely.</InlineNotice> : null}
        <div className="member-sticky-actions">
          <button className="member-button member-button-secondary" onClick={() => navigate("/onboarding/reason")} type="button">
            <ArrowLeft size={18} />
            Back
          </button>
          <button className="member-button member-button-primary" onClick={continueNext} type="button">
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}

function HealthContextScreen({
  story,
  updateHealth,
}: {
  story: HealthStory;
  updateHealth: (patch: Partial<HealthData>) => void;
}) {
  const [showError, setShowError] = useState(false);
  const complete = isHealthComplete(story.health);

  const updateLifestyle = (patch: Partial<LifestyleData>) => {
    updateHealth({ lifestyle: { ...story.health.lifestyle, ...patch } });
  };

  const continueNext = () => {
    if (!complete) {
      setShowError(true);
      return;
    }
    navigate("/onboarding/reports");
  };

  return (
    <OnboardingLayout
      route="/onboarding/health-context"
      story={story}
      title="Your health context"
      subtext="Share the key medical, lifestyle, and routine details your doctor should know before your consult."
      backTo="/onboarding/about"
    >
      <div className="member-form-sections">
        <section className="member-content-card">
          <div className="member-section-title">
            <IdCard size={22} />
            <div>
              <h2>Medical background</h2>
              <p>Keep this to the context a doctor can scan before you meet.</p>
            </div>
          </div>
          <ChoiceGroup
            helper="Have you ever been diagnosed with any medical conditions?"
            label="Diagnosed conditions"
            onChange={(conditionStatus) => updateHealth({ conditionStatus: conditionStatus as TernaryAnswer })}
            options={["No known medical conditions", "Yes", "Not sure"]}
            required
            value={
              story.health.conditionStatus === "no"
                ? "No known medical conditions"
                : story.health.conditionStatus === "yes"
                  ? "Yes"
                  : story.health.conditionStatus === "not-sure"
                    ? "Not sure"
                    : ""
            }
          />
          <TernaryBridge
            current={story.health.conditionStatus}
            map={{ "No known medical conditions": "no", Yes: "yes", "Not sure": "not-sure" }}
            onChange={(conditionStatus) => updateHealth({ conditionStatus })}
          />
          {story.health.conditionStatus === "yes" || story.health.conditionStatus === "not-sure" ? (
            <>
              <TextArea
                helper="Include roughly when it was diagnosed and whether you're currently being treated."
                label="Tell us what you've been told or diagnosed with"
                onChange={(conditionsText) => updateHealth({ conditionsText })}
                placeholder="High cholesterol, thyroid issues, asthma, PCOS, gout, or anything else a doctor has mentioned."
                required
                value={story.health.conditionsText}
              />
              <MultiChoiceGroup
                helper="Optional prompts, not a formal checklist."
                label="Helpful prompts"
                onToggle={(value) => updateHealth({ conditionPrompts: toggleInList(story.health.conditionPrompts, value) })}
                options={conditionPrompts}
                values={story.health.conditionPrompts}
              />
            </>
          ) : null}

          <ChoiceGroup
            helper="Do you have any allergies or important reactions your doctor should know about?"
            label="Allergies and important reactions"
            onChange={(allergyStatus) => updateHealth({ allergyStatus: allergyStatus as TernaryAnswer })}
            options={["No known allergies or reactions", "Yes", "Not sure"]}
            required
            value={
              story.health.allergyStatus === "no"
                ? "No known allergies or reactions"
                : story.health.allergyStatus === "yes"
                  ? "Yes"
                  : story.health.allergyStatus === "not-sure"
                    ? "Not sure"
                    : ""
            }
          />
          <TernaryBridge
            current={story.health.allergyStatus}
            map={{ "No known allergies or reactions": "no", Yes: "yes", "Not sure": "not-sure" }}
            onChange={(allergyStatus) => updateHealth({ allergyStatus })}
          />
          {story.health.allergyStatus === "yes" || story.health.allergyStatus === "not-sure" ? (
            <>
              <MultiChoiceGroup
                label="What type of allergy or reaction?"
                onToggle={(value) => updateHealth({ allergyTypes: toggleInList(story.health.allergyTypes, value) })}
                options={allergyTypeOptions}
                required
                values={story.health.allergyTypes}
              />
              <TextArea
                helper="Include what caused the reaction, what symptoms you had, and how serious it was."
                label="Tell us what happened"
                onChange={(allergyDetails) => updateHealth({ allergyDetails })}
                placeholder="Penicillin - rash and swelling. Shellfish - hives."
                required
                value={story.health.allergyDetails}
              />
            </>
          ) : null}

          <ChoiceGroup
            helper="Parents and siblings are most relevant. Grandparents can also be helpful if you know."
            label="Family history"
            onChange={(familyStatus) => updateHealth({ familyStatus: familyStatus as TernaryAnswer })}
            options={["No known family history", "Yes", "Not sure"]}
            required
            value={
              story.health.familyStatus === "no"
                ? "No known family history"
                : story.health.familyStatus === "yes"
                  ? "Yes"
                  : story.health.familyStatus === "not-sure"
                    ? "Not sure"
                    : ""
            }
          />
          <TernaryBridge
            current={story.health.familyStatus}
            map={{ "No known family history": "no", Yes: "yes", "Not sure": "not-sure" }}
            onChange={(familyStatus) => updateHealth({ familyStatus })}
          />
          {story.health.familyStatus === "yes" ? (
            <>
              <MultiChoiceGroup
                label="Which conditions have affected your family?"
                onToggle={(value) => updateHealth({ familyConditions: toggleInList(story.health.familyConditions, value) })}
                options={familyConditionOptions}
                required
                values={story.health.familyConditions}
              />
              <TextArea
                helper="Include who was affected and roughly what age it happened, if you know."
                label="Anything else that may be useful"
                onChange={(familyNote) => updateHealth({ familyNote })}
                placeholder="Father had a heart attack at 52. Mother has diabetes."
                value={story.health.familyNote}
              />
            </>
          ) : null}
        </section>

        <section className="member-content-card">
          <div className="member-section-title">
            <Pill size={22} />
            <div>
              <h2>Medications and supplements</h2>
              <p>Prescription, over-the-counter, vitamins, herbs, and regular health products.</p>
            </div>
          </div>
          <ChoiceGroup
            helper="Are you currently taking any medications, supplements, or regular health products?"
            label="Current routine"
            onChange={(medsStatus) => updateHealth({ medsStatus: medsStatus as TernaryAnswer })}
            options={["No", "Yes", "Not sure"]}
            required
            value={
              story.health.medsStatus === "no"
                ? "No"
                : story.health.medsStatus === "yes"
                  ? "Yes"
                  : story.health.medsStatus === "not-sure"
                    ? "Not sure"
                    : ""
            }
          />
          <TernaryBridge
            current={story.health.medsStatus}
            map={{ No: "no", Yes: "yes", "Not sure": "not-sure" }}
            onChange={(medsStatus) => updateHealth({ medsStatus })}
          />
          {story.health.medsStatus === "yes" || story.health.medsStatus === "not-sure" ? (
            <div className="member-entry-columns">
              <EntryList
                addLabel="Add medication"
                description="Prescription, over-the-counter, or regular medications."
                items={story.health.medications}
                onAdd={() => updateHealth({ medications: [...story.health.medications, createMedication()] })}
                onUpdate={(items) => updateHealth({ medications: items })}
                title="Medications"
                typeLabel="Medication"
              />
              <EntryList
                addLabel="Add supplement"
                description="Vitamins, minerals, herbs, protein powders, or other health products."
                items={story.health.supplements}
                onAdd={() => updateHealth({ supplements: [...story.health.supplements, createMedication()] })}
                onUpdate={(items) => updateHealth({ supplements: items })}
                title="Supplements"
                typeLabel="Supplement"
              />
            </div>
          ) : null}
        </section>

        <section className="member-content-card">
          <div className="member-section-title">
            <HeartHandshake size={22} />
            <div>
              <h2>Lifestyle snapshot</h2>
              <p>Quick context only. Notes are optional.</p>
            </div>
          </div>
          <div className="member-lifestyle-grid">
            <LifestyleBlock
              note={story.health.lifestyle.sleepNote}
              noteLabel="Anything your doctor should know about your sleep?"
              onNoteChange={(sleepNote) => updateLifestyle({ sleepNote })}
              onValueChange={(sleep) => updateLifestyle({ sleep })}
              options={sleepOptions}
              question="How would you describe your sleep recently?"
              title="Sleep"
              value={story.health.lifestyle.sleep}
            />
            <LifestyleBlock
              note={story.health.lifestyle.exerciseNote}
              noteLabel="What kind of movement or exercise do you usually do?"
              onNoteChange={(exerciseNote) => updateLifestyle({ exerciseNote })}
              onValueChange={(exercise) => updateLifestyle({ exercise })}
              options={exerciseOptions}
              question="How active are you in a typical week?"
              title="Movement and exercise"
              value={story.health.lifestyle.exercise}
            />
            <LifestyleBlock
              note={story.health.lifestyle.nutritionNote}
              noteLabel="Anything your doctor should know about your diet?"
              onNoteChange={(nutritionNote) => updateLifestyle({ nutritionNote })}
              onValueChange={(nutrition) => updateLifestyle({ nutrition })}
              options={nutritionOptions}
              question="How would you describe your usual diet?"
              title="Nutrition"
              value={story.health.lifestyle.nutrition}
            />
            <LifestyleBlock
              note={story.health.lifestyle.stressNote}
              noteLabel="Any major stressors or recovery issues?"
              onNoteChange={(stressNote) => updateLifestyle({ stressNote })}
              onValueChange={(stress) => updateLifestyle({ stress })}
              options={stressOptions}
              question="How would you describe your stress recently?"
              title="Stress and recovery"
              value={story.health.lifestyle.stress}
            />
          </div>
          <div className="member-form-grid">
            <ChoiceGroup
              label="Do you smoke or vape?"
              onChange={(smoking) => updateLifestyle({ smoking })}
              options={smokingOptions}
              required
              value={story.health.lifestyle.smoking}
            />
            <ChoiceGroup
              label="How often do you drink alcohol?"
              onChange={(alcohol) => updateLifestyle({ alcohol })}
              options={alcoholOptions}
              required
              value={story.health.lifestyle.alcohol}
            />
          </div>
          {showError && !complete ? (
            <InlineNotice tone="warning">Complete the required health context so your doctor has the essentials before you meet.</InlineNotice>
          ) : null}
          <div className="member-sticky-actions">
            <button className="member-button member-button-secondary" onClick={() => navigate("/onboarding/about")} type="button">
              <ArrowLeft size={18} />
              Back
            </button>
            <button className="member-button member-button-primary" onClick={continueNext} type="button">
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </OnboardingLayout>
  );
}

function TernaryBridge({
  current,
  map,
  onChange,
}: {
  current: TernaryAnswer;
  map: Record<string, TernaryAnswer>;
  onChange: (value: TernaryAnswer) => void;
}) {
  return (
    <div className="member-hidden-sync" aria-hidden="true">
      {Object.entries(map).map(([label, value]) => (
        <button data-selected={current === value} key={label} onClick={() => onChange(value)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}

function EntryList({
  title,
  description,
  typeLabel,
  addLabel,
  items,
  onAdd,
  onUpdate,
}: {
  title: string;
  description: string;
  typeLabel: string;
  addLabel: string;
  items: MedicationEntry[];
  onAdd: () => void;
  onUpdate: (items: MedicationEntry[]) => void;
}) {
  const updateItem = (id: string, patch: Partial<MedicationEntry>) => {
    onUpdate(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <article className="member-entry-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button className="member-button member-button-soft" onClick={onAdd} type="button">
        <Plus size={16} />
        {addLabel}
      </button>
      {items.length === 0 ? <small>Add only what you take regularly. Photos are optional.</small> : null}
      {items.map((item, index) => (
        <div className="member-entry-item" key={item.id}>
          <span>{typeLabel} {index + 1}</span>
          <Field label={`${typeLabel} name`} onChange={(name) => updateItem(item.id, { name })} placeholder={typeLabel === "Medication" ? "e.g. Metformin" : "e.g. Vitamin D"} value={item.name} />
          <Field label="Dosage" onChange={(dosage) => updateItem(item.id, { dosage })} placeholder={typeLabel === "Medication" ? "e.g. 500mg" : "e.g. 1000 IU"} value={item.dosage} />
          <Field label="Frequency" onChange={(frequency) => updateItem(item.id, { frequency })} placeholder="e.g. once daily, twice weekly, as needed" value={item.frequency} />
          <TextArea label="Notes" onChange={(notes) => updateItem(item.id, { notes })} placeholder="Optional context for your doctor." value={item.notes} />
          <label className="member-file-inline">
            <Upload size={16} />
            <span>{item.photoName || "Optional photo upload"}</span>
            <input
              accept="image/png,image/jpeg"
              onChange={(event) => updateItem(item.id, { photoName: event.target.files?.[0]?.name ?? "" })}
              type="file"
            />
          </label>
        </div>
      ))}
    </article>
  );
}

function LifestyleBlock({
  title,
  question,
  options,
  value,
  onValueChange,
  note,
  noteLabel,
  onNoteChange,
}: {
  title: string;
  question: string;
  options: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  note: string;
  noteLabel: string;
  onNoteChange: (value: string) => void;
}) {
  return (
    <article className="member-lifestyle-card">
      <ChoiceGroup label={title} helper={question} onChange={onValueChange} options={options} required value={value} />
      <TextArea label={noteLabel} onChange={onNoteChange} value={note} />
    </article>
  );
}

function ReportsScreen({
  story,
  updateReports,
}: {
  story: HealthStory;
  updateReports: (patch: Partial<ReportsData>) => void;
}) {
  const [showError, setShowError] = useState(false);
  const fileRequired = story.reports.intent === "upload" && story.reports.files.length === 0;

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const newReports = files.map<ReportEntry>((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      reportDate: "",
      reportType: "",
      source: "",
      notes: "",
    }));
    updateReports({ files: [...story.reports.files, ...newReports], intent: "upload" });
  };

  const updateFile = (id: string, patch: Partial<ReportEntry>) => {
    updateReports({
      files: story.reports.files.map((file) => (file.id === id ? { ...file, ...patch } : file)),
    });
  };

  const removeFile = (id: string) => {
    updateReports({ files: story.reports.files.filter((file) => file.id !== id) });
  };

  const continueNext = () => {
    if (fileRequired) {
      setShowError(true);
      return;
    }
    navigate(story.submitted ? "/onboarding/submitted" : "/onboarding/review");
  };

  return (
    <OnboardingLayout
      route="/onboarding/reports"
      story={story}
      title="Your past reports"
      subtext="Upload any previous blood tests, health screenings, or relevant medical reports so your doctor can review them before your consult."
      backTo={story.submitted ? "/onboarding/submitted" : "/onboarding/health-context"}
    >
      <section className="member-content-card">
        <InlineNotice>Don't worry if you don't have any - you can still continue.</InlineNotice>
        <ChoiceGroup
          helper="Do you have any past health reports you'd like your doctor to review?"
          label="Past reports"
          onChange={(value) => {
            const intent = value === "Yes, I'll upload them now" ? "upload" : value === "Not right now" ? "later" : "none";
            updateReports({ intent });
          }}
          options={["Yes, I'll upload them now", "Not right now", "I don't have any"]}
          value={
            story.reports.intent === "upload"
              ? "Yes, I'll upload them now"
              : story.reports.intent === "later"
                ? "Not right now"
                : story.reports.intent === "none"
                  ? "I don't have any"
                  : ""
          }
        />
        {story.reports.intent === "upload" ? (
          <div className="member-upload-zone">
            <FileUp size={30} />
            <div>
              <h2>Upload PDF, JPG, or PNG files</h2>
              <p>Blood tests or health screenings from the last 24 months are most useful.</p>
            </div>
            <label className="member-upload-button">
              Choose files
              <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple onChange={onFilesSelected} type="file" />
            </label>
          </div>
        ) : null}
        {story.reports.files.length > 0 ? (
          <div className="member-report-list">
            {story.reports.files.map((file) => (
              <article className="member-report-item" key={file.id}>
                <div className="member-report-title">
                  <FileText size={19} />
                  <strong>{file.fileName}</strong>
                  <button onClick={() => removeFile(file.id)} type="button">Remove</button>
                </div>
                <div className="member-form-grid">
                  <Field label="Report date" onChange={(reportDate) => updateFile(file.id, { reportDate })} type="date" value={file.reportDate} />
                  <SelectField label="Report type" onChange={(reportType) => updateFile(file.id, { reportType })} options={reportTypeOptions} value={file.reportType} />
                  <Field label="Lab / clinic name" onChange={(source) => updateFile(file.id, { source })} value={file.source} />
                  <TextArea label="Notes" onChange={(notes) => updateFile(file.id, { notes })} value={file.notes} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {showError && fileRequired ? <InlineNotice tone="warning">Choose at least one file, or select that you'll upload reports later.</InlineNotice> : null}
        <div className="member-sticky-actions">
          <button className="member-button member-button-secondary" onClick={() => navigate(story.submitted ? "/onboarding/submitted" : "/onboarding/health-context")} type="button">
            <ArrowLeft size={18} />
            Back
          </button>
          <button className="member-button member-button-primary" onClick={continueNext} type="button">
            {story.submitted ? "Return to submitted story" : "Continue to review"}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}

function ReviewScreen({
  story,
  updateReview,
  submitStory,
}: {
  story: HealthStory;
  updateReview: (patch: Partial<ReviewData>) => void;
  submitStory: () => void;
}) {
  const [showError, setShowError] = useState(false);
  const firstStepsComplete = isReasonComplete(story.reason) && isAboutComplete(story.about) && isHealthComplete(story.health);
  const consentsComplete = areReviewConsentsComplete(story);

  const submit = () => {
    if (!consentsComplete) {
      setShowError(true);
      return;
    }
    submitStory();
  };

  if (!firstStepsComplete) {
    return (
      <OnboardingLayout
        route="/onboarding/review"
        story={story}
        title="Review and submit"
        subtext="Complete the first three steps before your doctor can review your health story."
        backTo="/dashboard"
      >
        <section className="member-content-card member-locked-card">
          <LockKeyhole size={28} />
          <h2>Review is locked for now</h2>
          <p>Your reason for joining, about you, and health context need to be complete first.</p>
          <button className="member-button member-button-primary" onClick={() => navigate(getNextRequiredPath(story))} type="button">
            Continue health story
            <ArrowRight size={18} />
          </button>
        </section>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      route="/onboarding/review"
      story={story}
      title="Review and submit"
      subtext="Before your doctor reviews your information, please confirm the following."
      backTo="/onboarding/reports"
    >
      <section className="member-review-grid">
        <ReviewSummary story={story} />
        <article className="member-content-card member-consent-card">
          <h2>Confirm before doctor review</h2>
          <CheckField
            checked={story.review.accuracy}
            label="I confirm that the information I provided is accurate and complete to the best of my knowledge."
            onChange={(accuracy) => updateReview({ accuracy })}
          />
          <CheckField
            checked={story.review.informationUse}
            label="I consent for Gen-H to collect, store, and use my personal and health information to prepare and deliver my consult and related care."
            onChange={(informationUse) => updateReview({ informationUse })}
          />
          <CheckField
            checked={story.review.careTeamReview}
            label="I consent for Gen-H doctors and authorised care team members involved in my care to review my health story and uploaded reports."
            onChange={(careTeamReview) => updateReview({ careTeamReview })}
          />
          <CheckField
            checked={story.review.telehealthLimits}
            label="I understand that Gen-H consults are not a substitute for emergency care or urgent in-person assessment."
            onChange={(telehealthLimits) => updateReview({ telehealthLimits })}
          />
          <CheckField
            checked={story.review.privacyTerms}
            label="I have read and agree to Gen-H's privacy policy and terms."
            onChange={(privacyTerms) => updateReview({ privacyTerms })}
          />
          <Field
            label="Type your full legal name to confirm"
            onChange={(typedName) => updateReview({ typedName })}
            required
            value={story.review.typedName}
          />
          {showError && !consentsComplete ? (
            <InlineNotice tone="warning">Confirm each item and type your full legal name exactly as entered earlier.</InlineNotice>
          ) : null}
          <div className="member-sticky-actions">
            <button className="member-button member-button-secondary" onClick={() => navigate("/onboarding/reports")} type="button">
              <ArrowLeft size={18} />
              Back
            </button>
            <button className="member-button member-button-primary" onClick={submit} type="button">
              Submit for doctor review
              <CheckCircle2 size={18} />
            </button>
          </div>
        </article>
      </section>
    </OnboardingLayout>
  );
}

function ReviewSummary({ story }: { story: HealthStory }) {
  const selectedReasons = story.reason.selected.map((id) => reasonOptions.find((option) => option.id === id)?.label ?? story.reason.otherText);

  return (
    <article className="member-content-card member-summary-card">
      <h2>Health story summary</h2>
      <div className="member-summary-section">
        <span>Your reason for joining</span>
        <p>{selectedReasons.join(", ")}</p>
        {story.reason.doctorNote ? <small>{story.reason.doctorNote}</small> : null}
      </div>
      <div className="member-summary-section">
        <span>About you</span>
        <p>{story.about.legalName} · {story.about.dob} · {story.about.cityState}</p>
        <small>{story.about.email} · {story.about.mobile}</small>
      </div>
      <div className="member-summary-section">
        <span>Health context</span>
        <p>
          Conditions: {story.health.conditionStatus === "no" ? "No known medical conditions" : story.health.conditionsText || "Shared"}
        </p>
        <p>Family history: {story.health.familyStatus === "yes" ? story.health.familyConditions.join(", ") : statusLabelFromTernary(story.health.familyStatus)}</p>
        <p>Current products: {statusLabelFromTernary(story.health.medsStatus)}</p>
        <small>
          Sleep: {story.health.lifestyle.sleep || "Not answered"} · Exercise: {story.health.lifestyle.exercise || "Not answered"} · Stress: {story.health.lifestyle.stress || "Not answered"}
        </small>
      </div>
      <div className="member-summary-section">
        <span>Uploaded reports</span>
        <p>{story.reports.files.length > 0 ? `${story.reports.files.length} report${story.reports.files.length === 1 ? "" : "s"} attached` : "No reports uploaded"}</p>
      </div>
    </article>
  );
}

function statusLabelFromTernary(value: TernaryAnswer) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "not-sure") return "Not sure";
  return "Not answered";
}

function SubmittedScreen({ story }: { story: HealthStory }) {
  return (
    <OnboardingLayout
      route="/onboarding/submitted"
      story={story}
      title="Your health story has been submitted"
      subtext="Your doctor will review your information before your consult. You can still upload additional reports before your appointment."
      backTo="/dashboard"
    >
      <section className="member-content-card member-success-card">
        <CheckCircle2 size={34} />
        <div>
          <h2>Ready for doctor review</h2>
          <p>{consultDate}</p>
          <span>
            {story.reports.files.length > 0
              ? `${story.reports.files.length} report${story.reports.files.length === 1 ? "" : "s"} uploaded`
              : "No reports uploaded yet"}
          </span>
        </div>
        <div className="member-sticky-actions">
          <button className="member-button member-button-secondary" onClick={() => navigate("/dashboard")} type="button">
            Return to dashboard
          </button>
          <button className="member-button member-button-primary" onClick={() => navigate("/onboarding/reports")} type="button">
            Upload more reports
            <Upload size={18} />
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}

export function MemberApp() {
  const [route, setRoute] = useState<Route>(parseRoute);
  const [isAuthed, setIsAuthed] = useState(false);
  const [story, setStory] = useState<HealthStory>(() => createEmptyStory());

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute());
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) {
      navigate("/login");
    }
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    document.title = `Gen-H Member Space | ${routeTitles[route]}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  useEffect(() => {
    if (!isAuthed && !authRoutes.includes(route)) {
      navigate("/login");
    }
  }, [isAuthed, route]);

  const helpers = useMemo(
    () => ({
      updateReason: (patch: Partial<ReasonData>) => setStory((current) => ({ ...current, reason: { ...current.reason, ...patch } })),
      updateAbout: (patch: Partial<AboutData>) => setStory((current) => ({ ...current, about: { ...current.about, ...patch } })),
      updateHealth: (patch: Partial<HealthData>) => setStory((current) => ({ ...current, health: { ...current.health, ...patch } })),
      updateReports: (patch: Partial<ReportsData>) => setStory((current) => ({ ...current, reports: { ...current.reports, ...patch } })),
      updateReview: (patch: Partial<ReviewData>) => setStory((current) => ({ ...current, review: { ...current.review, ...patch } })),
    }),
    [],
  );

  const login = (account: Account) => {
    setIsAuthed(true);
    setStory(createEmptyStory(account));
    navigate("/dashboard");
  };

  const register = (account: Account) => {
    setIsAuthed(true);
    setStory(createEmptyStory(account));
    navigate("/dashboard");
  };

  const applyMockState = (state: "new" | "partial" | "submitted") => {
    setIsAuthed(true);
    if (state === "partial") {
      setStory(createPartialStory());
      return;
    }
    if (state === "submitted") {
      setStory(createSubmittedStory());
      return;
    }
    setStory(createEmptyStory({ fullName: "Gen-H Member", email: "member@example.com", mobile: "" }));
  };

  const logout = () => {
    setIsAuthed(false);
    setStory(createEmptyStory());
    navigate("/login");
  };

  const submitStory = () => {
    setStory((current) => ({ ...current, submitted: true }));
    navigate("/onboarding/submitted");
  };

  if (route === "/login") {
    return <LoginPage onLogin={login} />;
  }

  if (route === "/register") {
    return <RegisterPage onRegister={register} />;
  }

  if (route === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  const screen = (() => {
    if (route === "/dashboard") return <Dashboard story={story} />;
    if (route === "/onboarding/start") return <StartScreen story={story} />;
    if (route === "/onboarding/reason") return <ReasonScreen story={story} updateReason={helpers.updateReason} />;
    if (route === "/onboarding/about") return <AboutScreen story={story} updateAbout={helpers.updateAbout} />;
    if (route === "/onboarding/health-context") return <HealthContextScreen story={story} updateHealth={helpers.updateHealth} />;
    if (route === "/onboarding/reports") return <ReportsScreen story={story} updateReports={helpers.updateReports} />;
    if (route === "/onboarding/review") {
      return <ReviewScreen story={story} submitStory={submitStory} updateReview={helpers.updateReview} />;
    }
    return <SubmittedScreen story={story} />;
  })();

  return (
    <MemberShell
      currentRoute={route}
      onApplyMockState={applyMockState}
      onLogout={logout}
      story={story}
    >
      {screen}
    </MemberShell>
  );
}
