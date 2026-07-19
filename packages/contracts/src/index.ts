import { z } from "zod";

export const roleSchema = z.enum(["member", "doctor", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const memberStageSchema = z.enum([
  "profile_incomplete",
  "consult_upcoming",
  "blood_form_ready",
  "results_pending",
  "results_ready",
  "care_plan_ready",
]);
export type MemberStage = z.infer<typeof memberStageSchema>;

export const canonicalObservationSchema = z.object({
  source_code: z.string().min(1).max(100),
  source_system: z.string().min(1).max(100),
  name: z.string().min(1).max(250),
  value: z.string().min(1).max(500),
  unit: z.string().max(100).nullable().optional(),
  reference_range: z
    .object({
      low: z.number().nullable().optional(),
      high: z.number().nullable().optional(),
      text: z.string().max(500).nullable().optional(),
    })
    .optional(),
  flag: z.string().max(50).nullable().optional(),
  status: z.string().max(50).default("final"),
  observed_at: z.iso.datetime().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export const canonicalLabEventSchema = z.object({
  schema_version: z.literal("1.0"),
  event_id: z.string().min(1).max(250),
  event_type: z.enum([
    "lab_result.preliminary",
    "lab_result.final",
    "lab_result.amended",
    "lab_result.corrected",
    "lab_result.cancelled",
    "lab_result.entered_in_error",
  ]),
  occurred_at: z.iso.datetime(),
  order: z.object({
    client_order_id: z.string().min(1).max(250),
    lab_order_id: z.string().max(250).nullable().optional(),
    accession_number: z.string().max(250).nullable().optional(),
  }),
  patient: z
    .object({
      lab_patient_id: z.string().max(250).nullable().optional(),
    })
    .default({}),
  report: z.object({
    report_id: z.string().min(1).max(250),
    version: z.number().int().positive(),
    status: z.enum([
      "preliminary",
      "final",
      "amended",
      "corrected",
      "cancelled",
      "entered_in_error",
    ]),
    issued_at: z.iso.datetime().nullable().optional(),
    observations: z.array(canonicalObservationSchema).max(1000),
  }),
});

export type CanonicalLabEvent = z.infer<typeof canonicalLabEventSchema>;
export type CanonicalObservation = z.infer<typeof canonicalObservationSchema>;

export type ApiErrorBody = {
  error: string;
  code: string;
  requestId?: string;
};

export { TERMS_VERSION, CONSENT_VERSION } from "./consent.js";
