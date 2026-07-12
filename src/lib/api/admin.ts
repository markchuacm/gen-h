import { supabase } from "../supabaseClient";

// Admin operations console API. Every read/write here is gated server-side by
// private.is_admin() (RLS policies + RPC guards in migration 009) — the client
// role check in the app is convenience only.

const BUCKET = "health-documents";

// ---- Cases list ----------------------------------------------------------

export type AdminCaseRow = {
  memberId: string;
  fullName: string | null;
  email: string | null;
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
  const { data, error } = await supabase.rpc("admin_case_overview");
  if (error) return { data: [], error: error.message };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return {
    data: rows.map((r) => ({
      memberId: r.member_id,
      fullName: r.full_name,
      email: r.email,
      age: r.age,
      sex: r.sex,
      currentStage: r.current_stage,
      onboardingStatus: r.onboarding_status,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      documentsCount: Number(r.documents_count ?? 0),
      resultsStatus: r.results_status,
      carePlanStatus: r.care_plan_status,
      nextAction: r.next_action,
      nextOwner: r.next_owner,
      updatedAt: r.updated_at,
    })),
    error: null,
  };
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
  const [profile, member, responses, docs, assignment, plan] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", memberId).maybeSingle(),
    supabase
      .from("member_profiles")
      .select(
        "age, sex, height_cm, weight_kg, goals, medications, conditions, " +
          "preferred_name, current_stage, onboarding_status",
      )
      .eq("member_id", memberId)
      .maybeSingle<{
        age: number | null;
        sex: string | null;
        height_cm: number | null;
        weight_kg: number | null;
        goals: string[] | null;
        medications: string | null;
        conditions: string | null;
        preferred_name: string | null;
        current_stage: string | null;
        onboarding_status: string | null;
      }>(),
    supabase.from("onboarding_responses").select("question_key, response").eq("member_id", memberId),
    supabase
      .from("health_documents")
      .select("id, file_name, storage_path, mime_type, size_bytes, doc_type, uploaded_by, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false }),
    supabase
      .from("doctor_assignments")
      .select("doctor_id, profiles!doctor_assignments_doctor_id_fkey(full_name)")
      .eq("member_id", memberId)
      .eq("status", "active")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("care_plans")
      .select("status, released_at, updated_at, profiles!care_plans_doctor_id_fkey(full_name)")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError =
    profile.error || member.error || responses.error || docs.error || assignment.error || plan.error;
  if (firstError) return { data: null, error: firstError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignmentRow = assignment.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planRow = plan.data as any;
  const doctorName = assignmentRow?.profiles?.full_name ?? null;

  return {
    data: {
      memberName: profile.data?.full_name ?? null,
      memberEmail: profile.data?.email ?? null,
      age: member.data?.age ?? null,
      sex: member.data?.sex ?? null,
      heightCm: member.data?.height_cm ?? null,
      weightKg: member.data?.weight_kg ?? null,
      goals: member.data?.goals ?? null,
      medications: member.data?.medications ?? null,
      conditions: member.data?.conditions ?? null,
      preferredName: member.data?.preferred_name ?? null,
      currentStage: member.data?.current_stage ?? null,
      onboardingStatus: member.data?.onboarding_status ?? null,
      onboarding: Object.fromEntries(
        (responses.data ?? []).map((row) => [row.question_key, row.response]),
      ),
      documents: docs.data ?? [],
      doctorId: assignmentRow?.doctor_id ?? null,
      doctorName,
      carePlan: planRow
        ? {
            status: planRow.status,
            doctorName: planRow.profiles?.full_name ?? null,
            updatedAt: planRow.updated_at ?? null,
            releasedAt: planRow.released_at ?? null,
          }
        : null,
    },
    error: null,
  };
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
  return supabase
    .from("lab_reports")
    .select(
      "id, lab_name, panel_name, collected_at, document_id, status, released_at, " +
        "biomarker_results(id, lab_report_id, member_id, biomarker_code, biomarker_name, " +
        "category, value_numeric, value_text, unit, ref_low, ref_high, optimal_low, " +
        "optimal_high, status, notes)",
    )
    .eq("member_id", memberId)
    .order("collected_at", { ascending: false })
    .returns<AdminLabReport[]>();
}

export type NewLabReport = {
  lab_name: string | null;
  panel_name: string | null;
  collected_at: string | null;
  document_id: string | null;
};

export async function createLabReport(memberId: string, fields: NewLabReport) {
  const { data: sessionData } = await supabase.auth.getSession();
  const adminId = sessionData.session?.user.id ?? null;
  const { data, error } = await supabase
    .from("lab_reports")
    .insert({ member_id: memberId, status: "draft", created_by: adminId, ...fields })
    .select("id")
    .single();
  return { data, error: error?.message ?? null };
}

export async function updateLabReport(reportId: string, patch: Partial<NewLabReport>) {
  const { error } = await supabase.from("lab_reports").update(patch).eq("id", reportId);
  return { error: error?.message ?? null };
}

export async function deleteLabReport(reportId: string) {
  const { error } = await supabase.from("lab_reports").delete().eq("id", reportId);
  return { error: error?.message ?? null };
}

export type BiomarkerInput = Omit<AdminBiomarkerRow, "id" | "lab_report_id" | "member_id">;

export async function createBiomarker(
  reportId: string,
  memberId: string,
  row: BiomarkerInput,
) {
  const { data, error } = await supabase
    .from("biomarker_results")
    .insert({ lab_report_id: reportId, member_id: memberId, ...row })
    .select("id")
    .single();
  return { data, error: error?.message ?? null };
}

export async function updateBiomarker(id: string, row: BiomarkerInput) {
  const { error } = await supabase.from("biomarker_results").update(row).eq("id", id);
  return { error: error?.message ?? null };
}

/** Insert many biomarker rows into one draft report in a single round trip
    (used by the PDF-ingest flow). RLS on biomarker_results already governs it. */
export async function createBiomarkersBulk(
  reportId: string,
  memberId: string,
  rows: BiomarkerInput[],
) {
  if (rows.length === 0) return { inserted: 0, error: null };
  const { data, error } = await supabase
    .from("biomarker_results")
    .insert(rows.map((row) => ({ lab_report_id: reportId, member_id: memberId, ...row })))
    .select("id");
  return { inserted: data?.length ?? 0, error: error?.message ?? null };
}

export async function deleteBiomarker(id: string) {
  const { error } = await supabase.from("biomarker_results").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function releaseLabReport(reportId: string) {
  const { error } = await supabase.rpc("admin_release_lab_report", { report_id: reportId });
  return { error: error?.message ?? null };
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
  const { data: sessionData } = await supabase.auth.getSession();
  const adminId = sessionData.session?.user.id;
  if (!adminId) return { data: null, error: "not signed in" };

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (!(ext in ADMIN_MIME)) return { data: null, error: "unsupported type — PDF, JPG, PNG, CSV, DOC or DOCX." };
  if (file.size > 10 * 1024 * 1024) return { data: null, error: "larger than 10MB." };

  const storagePath = `${memberId}/${crypto.randomUUID()}.${ext}`;
  const upload = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: ADMIN_MIME[ext],
    upsert: false,
  });
  if (upload.error) return { data: null, error: upload.error.message };

  const { data, error } = await supabase
    .from("health_documents")
    .insert({
      member_id: memberId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: ADMIN_MIME[ext],
      size_bytes: file.size,
      doc_type: docType,
      uploaded_by: adminId,
    })
    .select("id")
    .single();
  if (error) {
    void supabase.storage.from(BUCKET).remove([storagePath]);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

// ---- Doctors -------------------------------------------------------------

export type AdminDoctorRow = {
  doctorId: string;
  fullName: string | null;
  email: string | null;
  isActive: boolean;
  assignedCount: number;
};

export async function fetchAdminDoctors(): Promise<{
  data: AdminDoctorRow[];
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("admin_doctor_overview");
  if (error) return { data: [], error: error.message };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return {
    data: rows.map((r) => ({
      doctorId: r.doctor_id,
      fullName: r.full_name,
      email: r.email,
      isActive: r.is_active,
      assignedCount: Number(r.assigned_count ?? 0),
    })),
    error: null,
  };
}

export type PromotableUser = { id: string; email: string | null; full_name: string | null };

/** Members eligible to be promoted to doctor. */
export async function fetchPromotableUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "member")
    .order("email");
  return { data: (data ?? []) as PromotableUser[], error: error?.message ?? null };
}

export type DoctorMember = { memberId: string; fullName: string | null; email: string | null };

/** Active members assigned to a doctor (for the Doctors page expand row). */
export async function fetchDoctorMembers(doctorId: string): Promise<DoctorMember[]> {
  const { data } = await supabase
    .from("doctor_assignments")
    .select("member_id, profiles!doctor_assignments_member_id_fkey(full_name, email)")
    .eq("doctor_id", doctorId)
    .eq("status", "active");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    memberId: r.member_id,
    fullName: r.profiles?.full_name ?? null,
    email: r.profiles?.email ?? null,
  }));
}

export async function assignDoctor(memberId: string, doctorId: string) {
  const { error } = await supabase.rpc("admin_assign_doctor", {
    p_member_id: memberId,
    p_doctor_id: doctorId,
  });
  return { error: error?.message ?? null };
}

export async function deactivateAssignment(memberId: string) {
  const { error } = await supabase.rpc("admin_deactivate_assignment", { p_member_id: memberId });
  return { error: error?.message ?? null };
}

export async function setRole(userId: string, role: "member" | "doctor") {
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: role });
  return { error: error?.message ?? null };
}

export async function setDoctorActive(userId: string, active: boolean) {
  const { error } = await supabase.rpc("admin_set_doctor_active", {
    p_user_id: userId,
    p_active: active,
  });
  return { error: error?.message ?? null };
}

export async function setStage(memberId: string, stage: string) {
  const { error } = await supabase.rpc("admin_set_stage", { p_member_id: memberId, p_stage: stage });
  return { error: error?.message ?? null };
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
