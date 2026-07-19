import termsOfService from "./content/terms-of-service.md?raw";
import termsOfServiceBm from "./content/terms-of-service.bm.md?raw";
import privacyPolicy from "./content/privacy-policy.md?raw";
import privacyPolicyBm from "./content/privacy-policy.bm.md?raw";
import informedConsentPolicy from "./content/informed-consent-policy.md?raw";
import informedConsentPolicyBm from "./content/informed-consent-policy.bm.md?raw";

export const LEGAL_PATHS = {
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
  informedConsent: "/informed-consent-policy",
} as const;

export type LegalDocument = {
  path: string;
  title: string;
  titleBm: string;
  content: string;
  contentBm: string;
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    path: LEGAL_PATHS.terms,
    title: "Terms of Service",
    titleBm: "Terma Perkhidmatan",
    content: termsOfService,
    contentBm: termsOfServiceBm,
  },
  {
    path: LEGAL_PATHS.privacy,
    title: "Privacy Policy",
    titleBm: "Dasar Privasi",
    content: privacyPolicy,
    contentBm: privacyPolicyBm,
  },
  {
    path: LEGAL_PATHS.informedConsent,
    title: "Informed Consent Policy",
    titleBm: "Dasar Persetujuan Termaklum",
    content: informedConsentPolicy,
    contentBm: informedConsentPolicyBm,
  },
];

export const TERMS_OF_SERVICE = LEGAL_DOCUMENTS[0];

export function legalDocumentForPath(pathname: string): LegalDocument | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return LEGAL_DOCUMENTS.find((document) => document.path === normalized);
}

export function publicLegalUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const configuredBase = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "");
  if (configuredBase) return `${configuredBase}${path}`;
  if (window.location.hostname === "app.veraehealth.com" || window.location.hostname === "app-uat.veraehealth.com") {
    return `https://veraehealth.com${path}`;
  }
  return path;
}
