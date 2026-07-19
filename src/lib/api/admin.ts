import { apiError, apiRequest } from "../apiClient";

async function mutation(path: string, method: string, body?: unknown): Promise<{ error: string | null }> {
  try {
    await apiRequest(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}

// Admin operations console API. Every read/write here is gated server-side by
// private.is_admin() (RLS policies + RPC guards in migration 009) — the client
// role check in the app is convenience only.

// ---- Cases list ----------------------------------------------------------

export type AdminCaseRow = {
  memberId: string;
  fullName: string | null;
  email: string | null;
  accountStatus: "pending" | "active" | "suspended";
  age: number | null;
  sex: string | null;
  currentStage: string | null;
  onboardingStatus: string | null;
  doctorId: string | null;
  doctorName: string | null;
  documentsCount: number;
  resultsStatus: "none" | "draft" | "released";
  carePlanStatus: "none" | "draft" | "released";
  nextAction: string;
  nextOwner: "admin" | "member" | "doctor" | "done";
  updatedAt: string | null;
};

/** One fully-derived row per member (next_action computed in the DB). */
export async function fetchAdminCases(): Promise<{
  data: AdminCaseRow[];
  error: string | null;
}> {
  try {
    const { data } = await apiRequest<{ data: AdminCaseRow[] }>("/v1/admin/cases");
    return { data, error: null };
  } catch (error) {
    return { data: [], error: apiError(error) };
  }
}

// ---- Case detail ---------------------------------------------------------

export type AdminDocument = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  doc_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type AdminCaseDetail = {
  memberName: string | null;
  memberEmail: string | null;
  accountStatus: "pending" | "active" | "suspended";
  age: number | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goals: string[] | null;
  medications: string | null;
  conditions: string | null;
  preferredName: string | null;
  currentStage: string | null;
  onboardingStatus: string | null;
  phone: string | null;
  invitedAt: string | null;
  tempPasswordExpiresAt: string | null;
  setupCompletedAt: string | null;
  onboarding: Record<string, unknown>;
  documents: AdminDocument[];
  doctorId: string | null;
  doctorName: string | null;
  carePlan: {
    status: string;
    doctorName: string | null;
    updatedAt: string | null;
    releasedAt: string | null;
  } | null;
};

export async function fetchAdminCaseDetail(memberId: string): Promise<{
  data: AdminCaseDetail | null;
  error: string | null;
}> {
  try {
    return await apiRequest<{ data: AdminCaseDetail | null }>(
      `/v1/admin/cases/${encodeURIComponent(memberId)}`,
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

// ---- Patient invites -----------------------------------------------------

export type InviteResult = { memberId: string; tempPassword: string; expiresAt: string };

/** Create an invited patient account. Returns the one-time temp password. */
export async function createPatient(input: {
  fullName: string;
  email: string;
  phone: string;
  doctorId?: string;
}): Promise<{ data: InviteResult | null; error: string | null }> {
  try {
    const { data } = await apiRequest<{ data: InviteResult }>("/v1/admin/patients", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** Issue a fresh temporary password for a member who hasn't finished setup. */
export async function resetInvite(
  memberId: string,
): Promise<{ data: { tempPassword: string; expiresAt: string } | null; error: string | null }> {
  try {
    const { data } = await apiRequest<{ data: { tempPassword: string; expiresAt: string } }>(
      `/v1/admin/patients/${encodeURIComponent(memberId)}/reset-invite`,
      { method: "POST" },
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

// ---- Lab results ---------------------------------------------------------

export type AdminBiomarkerRow = {
  id: string;
  lab_report_id: string;
  member_id: string;
  biomarker_code: string;
  biomarker_name: string | null;
  category: string | null;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  optimal_low: number | null;
  optimal_high: number | null;
  status: "optimal" | "at_risk" | "needs_attention";
  notes: string | null;
};

export type AdminLabReport = {
  id: string;
  lab_name: string | null;
  panel_name: string | null;
  collected_at: string | null;
  document_id: string | null;
  status: "draft" | "released";
  released_at: string | null;
  biomarker_results: AdminBiomarkerRow[];
};

/** All reports (drafts included) for a member. */
export async function fetchAdminLabReports(memberId: string) {
  try {
    return await apiRequest<{ data: AdminLabReport[] }>(
      `/v1/admin/members/${encodeURIComponent(memberId)}/reports`,
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export type NewLabReport = {
  lab_name: string | null;
  panel_name: string | null;
  collected_at: string | null;
  document_id: string | null;
};

export async function createLabReport(memberId: string, fields: NewLabReport) {
  try {
    return await apiRequest<{ data: { id: string } }>(
      `/v1/admin/members/${encodeURIComponent(memberId)}/reports`,
      { method: "POST", body: JSON.stringify(fields) },
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function updateLabReport(reportId: string, patch: Partial<NewLabReport>) {
  return mutation(`/v1/admin/reports/${encodeURIComponent(reportId)}`, "PATCH", patch);
}

export async function deleteLabReport(reportId: string) {
  return mutation(`/v1/admin/reports/${encodeURIComponent(reportId)}`, "DELETE");
}

export type BiomarkerInput = Omit<AdminBiomarkerRow, "id" | "lab_report_id" | "member_id">;

export async function createBiomarker(
  reportId: string,
  memberId: string,
  row: BiomarkerInput,
) {
  try {
    return await apiRequest<{ data: { id: string } }>(
      `/v1/admin/reports/${encodeURIComponent(reportId)}/biomarkers`,
      { method: "POST", body: JSON.stringify({ memberId, row }) },
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function updateBiomarker(id: string, row: BiomarkerInput) {
  return mutation(`/v1/admin/biomarkers/${encodeURIComponent(id)}`, "PUT", row);
}

/** Insert many biomarker rows into one draft report in a single round trip
    (used by the PDF-ingest flow). RLS on biomarker_results already governs it. */
export async function createBiomarkersBulk(
  reportId: string,
  memberId: string,
  rows: BiomarkerInput[],
) {
  if (rows.length === 0) return { inserted: 0, error: null };
  try {
    const { inserted } = await apiRequest<{ inserted: number }>(
      `/v1/admin/reports/${encodeURIComponent(reportId)}/biomarkers/bulk`,
      { method: "POST", body: JSON.stringify({ memberId, rows }) },
    );
    return { inserted, error: null };
  } catch (error) {
    return { inserted: 0, error: apiError(error) };
  }
}

export async function deleteBiomarker(id: string) {
  return mutation(`/v1/admin/biomarkers/${encodeURIComponent(id)}`, "DELETE");
}

export async function releaseLabReport(reportId: string) {
  return mutation(`/v1/admin/reports/${encodeURIComponent(reportId)}/release`, "POST");
}

// ---- Documents (upload on behalf of a member) ----------------------------

const ADMIN_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Upload into the member's folder ({member_id}/{uuid}.{ext}); uploaded_by is
    the admin so the "uploader" column stays truthful. Returns the created
    health_documents id so callers (e.g. lab-report ingest) can link it. */
export async function uploadDocumentForMember(memberId: string, file: File, docType: string) {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (!(ext in ADMIN_MIME)) return { data: null, error: "unsupported type — PDF, JPG, PNG, CSV, DOC or DOCX." };
  if (file.size > 10 * 1024 * 1024) return { data: null, error: "larger than 10MB." };
  try {
    const prepared = await apiRequest<{ data: { id: string } }>(
      "/v1/member/documents/upload",
      {
        method: "POST",
        body: JSON.stringify({ memberId, fileName: file.name, mimeType: ADMIN_MIME[ext], sizeBytes: file.size, docType }),
      },
    );
    await apiRequest(`/v1/member/documents/${encodeURIComponent(prepared.data.id)}/content`, {
      method: "PUT",
      headers: { "content-type": ADMIN_MIME[ext] },
      body: file,
    });
    return { data: prepared.data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

// ---- Doctors -------------------------------------------------------------

export type AdminDoctorRow = {
  doctorId: string;
  fullName: string | null;
  email: string | null;
  isActive: boolean;
  accountStatus: "pending" | "active" | "suspended";
  assignedCount: number;
};

export async function fetchAdminDoctors(): Promise<{
  data: AdminDoctorRow[];
  error: string | null;
}> {
  try {
    const { data } = await apiRequest<{ data: AdminDoctorRow[] }>("/v1/admin/doctors");
    return { data, error: null };
  } catch (error) {
    return { data: [], error: apiError(error) };
  }
}

export async function createDoctor(input: { fullName: string; email: string }) {
  try {
    const { data } = await apiRequest<{ data: { doctorId: string } }>("/v1/admin/doctors", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export type DoctorMember = { memberId: string; fullName: string | null; email: string | null };

/** Active members assigned to a doctor (for the Doctors page expand row). */
export async function fetchDoctorMembers(doctorId: string): Promise<DoctorMember[]> {
  try {
    return (await apiRequest<{ data: DoctorMember[] }>(
      `/v1/admin/doctors/${encodeURIComponent(doctorId)}/members`,
    )).data;
  } catch {
    return [];
  }
}

export async function assignDoctor(memberId: string, doctorId: string) {
  return mutation("/v1/admin/assignments", "PUT", { memberId, doctorId });
}

export async function deactivateAssignment(memberId: string) {
  return mutation(`/v1/admin/assignments/${encodeURIComponent(memberId)}`, "DELETE");
}

export async function setDoctorActive(userId: string, active: boolean) {
  return mutation(`/v1/admin/users/${encodeURIComponent(userId)}`, "PATCH", { doctorActive: active });
}

export type DeveloperModeStatus = {
  available: boolean;
  enabled: boolean;
  expiresAt: string | null;
};

export async function fetchDeveloperMode(): Promise<DeveloperModeStatus> {
  return apiRequest<DeveloperModeStatus>("/v1/admin/developer-mode");
}

export async function enableDeveloperMode(password: string): Promise<{ enabled: true; expiresAt: string }> {
  return apiRequest("/v1/admin/developer-mode", { method: "POST", body: JSON.stringify({ password }) });
}

export async function disableDeveloperMode(): Promise<void> {
  await apiRequest("/v1/admin/developer-mode", { method: "DELETE" });
}

export async function deleteAdminUser(userId: string): Promise<{ error: string | null }> {
  return mutation(`/v1/admin/users/${encodeURIComponent(userId)}`, "DELETE");
}

export async function setAccountStatus(userId: string, accountStatus: "active" | "suspended") {
  return mutation(`/v1/admin/users/${encodeURIComponent(userId)}`, "PATCH", { accountStatus });
}

export async function setStage(memberId: string, stage: string) {
  return mutation(`/v1/admin/members/${encodeURIComponent(memberId)}/stage`, "PATCH", { stage });
}

// ---- Teleconsult scheduling ----------------------------------------------

export type AdminAppointment = {
  id: string;
  memberId: string;
  doctorId: string;
  doctorName: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string | null;
  status: "scheduled" | "cancelled" | "completed";
};

export async function fetchAdminAppointment(memberId: string): Promise<{
  data: AdminAppointment | null;
  error: string | null;
}> {
  try {
    return await apiRequest<{ data: AdminAppointment | null }>(
      `/v1/admin/members/${encodeURIComponent(memberId)}/appointment`,
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** Create or reschedule the member's consult. scheduledAt is an ISO string;
    meetingUrl is an optional Google Meet link. */
export async function scheduleAppointment(
  memberId: string,
  input: { scheduledAt: string; meetingUrl: string | null },
) {
  return mutation(`/v1/admin/members/${encodeURIComponent(memberId)}/appointment`, "PUT", {
    scheduledAt: input.scheduledAt,
    meetingUrl: input.meetingUrl,
  });
}

export async function cancelAppointment(memberId: string) {
  return mutation(`/v1/admin/members/${encodeURIComponent(memberId)}/appointment`, "DELETE");
}

// ---- Shared labels -------------------------------------------------------

export const STAGE_OPTIONS = [
  "profile_incomplete",
  "consult_upcoming",
  "blood_form_ready",
  "results_pending",
  "results_ready",
  "care_plan_ready",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  profile_incomplete: "Profile incomplete",
  consult_upcoming: "Consult upcoming",
  blood_form_ready: "Blood draw",
  results_pending: "Results pending",
  results_ready: "Results ready",
  care_plan_ready: "Care plan released",
};
