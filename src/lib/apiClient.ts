const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null) as {
    error?: string;
    code?: string;
    issues?: Array<{ path: string; message: string }>;
  } | null;
  if (!response.ok) {
    throw new ApiClientError(
      body?.error ?? "Request failed",
      response.status,
      body?.code ?? "REQUEST_FAILED",
      body?.issues ?? [],
    );
  }
  return body as T;
}

export function apiError(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}

export function apiUrl(): string {
  return API_URL;
}
