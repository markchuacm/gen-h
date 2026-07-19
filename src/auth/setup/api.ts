import { apiRequest } from "../../lib/apiClient";

export async function setSetupPassword(newPassword: string): Promise<void> {
  await apiRequest("/v1/member/setup/password", {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function acceptConsent(signatureName: string): Promise<void> {
  await apiRequest("/v1/member/setup/consent", {
    method: "POST",
    body: JSON.stringify({ signatureName, acceptTerms: true, acceptHealthConsent: true }),
  });
}
