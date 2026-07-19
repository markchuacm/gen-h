import { createAuthClient } from "better-auth/react";
import { twoFactorClient, emailOTPClient } from "better-auth/client/plugins";
import { apiUrl } from "../lib/apiClient";

export const authClient = createAuthClient({
  baseURL: apiUrl(),
  plugins: [twoFactorClient(), emailOTPClient()],
});
