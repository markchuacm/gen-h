import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { apiUrl } from "../lib/apiClient";

export const authClient = createAuthClient({
  baseURL: apiUrl(),
  plugins: [twoFactorClient()],
});
