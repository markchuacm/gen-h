// The consent/terms version identifiers stored with each acceptance live
// server-side (packages/contracts, app.member_consents). This file is the
// user-facing copy those versions refer to — keep the two in step: when you edit
// the text below, bump TERMS_VERSION / CONSENT_VERSION in packages/contracts.
export const SUPPORT_EMAIL = "support@veraehealth.com";

export type ConsentSection = { heading: string; body: string };

// Terms of Service & Privacy. Tailored to a preventive-health / telehealth
// member portal — not the procedure/indemnity language of a physical clinic.
export const TERMS_SECTIONS: ConsentSection[] = [
  {
    heading: "1. The service",
    body: "Verae Health is a preventive-health member portal. Through it you complete a health questionnaire, hold teleconsultations with your assigned Verae doctor, arrange blood-panel testing via our partner laboratories, and receive your results and a personalised care plan.",
  },
  {
    heading: "2. Not for emergencies",
    body: "The portal and teleconsultations do not replace emergency care or your regular GP. If you have a medical emergency, call 999 or go to the nearest emergency department.",
  },
  {
    heading: "3. Your account",
    body: "Your account is for you alone. Keep your login details confidential, provide accurate information, and let us know if you believe your account has been accessed by someone else.",
  },
  {
    heading: "4. Privacy & PDPA",
    body: `We process your personal and sensitive health data under Malaysia's Personal Data Protection Act 2010, solely to deliver the service. Your data is shared only with your assigned doctor, Verae clinical and operations staff, and partner laboratories as needed to provide care. You may request access to or correction of your data, or withdraw consent, by contacting ${SUPPORT_EMAIL}. We retain records for as long as clinical record-keeping obligations require.`,
  },
];

// Health-data & telehealth consent.
export const CONSENT_SECTIONS: ConsentSection[] = [
  {
    heading: "1. Processing my health information",
    body: "I consent to Verae collecting and processing my health information — including my questionnaire answers, uploaded documents, and blood-test biomarkers — in order to provide preventive-health services to me.",
  },
  {
    heading: "2. Teleconsultation",
    body: "I consent to consulting my assigned doctor by video, and I understand a teleconsultation has limits compared with an in-person examination. A physical consultation may be recommended where appropriate.",
  },
  {
    heading: "3. Partner laboratories",
    body: "I consent to my blood samples being collected and analysed by Verae's partner laboratories, and to the results being shared with Verae and my assigned doctor.",
  },
  {
    heading: "4. Withdrawal & signature",
    body: "I understand I can withdraw my consent at any time, which may mean Verae can no longer provide the service. I understand that typing my full name below acts as my electronic signature, recorded with a timestamp and the version of these documents shown to me.",
  },
];
