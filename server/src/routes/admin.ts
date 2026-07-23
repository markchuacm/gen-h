import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { generateRandomString, hashPassword, verifyPassword } from "better-auth/crypto";
import { z } from "zod";
import { actor, requireRoles } from "../auth/guards.js";
import { auth, authPool } from "../auth/auth.js";
import { env } from "../config.js";
import { withActor } from "../db/pools.js";
import { getBoss } from "../jobs/boss.js";
import { scheduleConsultEmails } from "../services/appointments.js";
import {
  clearDeveloperModeCookie,
  createDeveloperModeToken,
  DEVELOPER_MODE_COOKIE,
  developerModeCookie,
  readCookie,
  verifyDeveloperModeToken,
} from "../services/developer-mode.js";
import { sendAccountEmail } from "../services/email.js";
import { generateTempPassword, inviteExpiresAt } from "../services/invites.js";
import { deleteDocumentObject } from "../services/storage.js";

const appointmentSchema = z.object({
  scheduledAt: z.iso.datetime(),
  durationMinutes: z.number().int().min(5).max(240).default(30),
  meetingUrl: z.string().regex(/^https:\/\/meet\.google\.com\/.+/, "must be a Google Meet URL").nullable().optional(),
});

const biomarkerSchema = z.object({
  biomarker_code: z.string().min(1).max(100),
  biomarker_name: z.string().max(250).nullable(),
  category: z.string().max(150).nullable(),
  value_numeric: z.number().nullable(),
  value_text: z.string().max(500).nullable(),
  unit: z.string().max(100).nullable(),
  ref_low: z.number().nullable(),
  ref_high: z.number().nullable(),
  optimal_low: z.number().nullable(),
  optimal_high: z.number().nullable(),
  status: z.enum(["optimal", "at_risk", "needs_attention"]),
  notes: z.string().max(4000).nullable(),
});

// Mirrors doctor.ts planSectionSchema — the demo-seed endpoint writes the same
// shape the care-plan editor does.
const demoPlanSectionSchema = z.object({
  sort_order: z.number().int().min(0),
  title: z.string().max(250),
  summary: z.string().max(4000),
  markers: z.array(z.string().max(100)).max(100),
  doctor_note: z.string().max(8000),
  image_key: z.string().max(250).nullable(),
  actions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    lifestyleCategory: z.enum(["Nutrition", "Exercise", "Supplements", "Sleep"]),
    instruction: z.string(),
    rationale: z.string(),
    moreGuidance: z.string(),
  })).max(100),
});

const reportFieldsSchema = z.object({
  lab_name: z.string().max(250).nullable(),
  panel_name: z.string().max(250).nullable(),
  collected_at: z.iso.datetime().nullable(),
  document_id: z.string().uuid().nullable(),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = requireRoles("admin");
  const developerGrant = (request: Parameters<typeof actor>[0]) => {
    const current = actor(request);
    return verifyDeveloperModeToken(
      readCookie(request.headers.cookie, DEVELOPER_MODE_COOKIE),
      current.userId,
      env.BETTER_AUTH_SECRET,
    );
  };
  const developerOnly = async (request: Parameters<typeof actor>[0], reply: Parameters<ReturnType<typeof requireRoles>>[1]) => {
    await adminOnly(request, reply);
    if (reply.sent) return;
    if (!developerGrant(request)) {
      await reply.code(403).send({ error: "Developer mode is required", code: "DEVELOPER_MODE_REQUIRED", requestId: request.id });
    }
  };

  app.get("/v1/admin/developer-mode", { preHandler: adminOnly }, async (request) => {
    const grant = developerGrant(request);
    return {
      available: Boolean(env.DEVELOPER_MODE_PASSWORD_HASH),
      enabled: Boolean(grant),
      expiresAt: grant ? new Date(grant.expiresAt).toISOString() : null,
    };
  });

  app.post(
    "/v1/admin/developer-mode",
    { preHandler: adminOnly, config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      if (!env.DEVELOPER_MODE_PASSWORD_HASH) {
        return reply.code(503).send({ error: "Developer mode is not configured", code: "DEVELOPER_MODE_UNAVAILABLE", requestId: request.id });
      }
      const { password } = z.object({ password: z.string().min(1).max(200) }).parse(request.body);
      const valid = await verifyPassword({ hash: env.DEVELOPER_MODE_PASSWORD_HASH, password });
      if (!valid) {
        return reply.code(403).send({ error: "Incorrect developer password", code: "INVALID_DEVELOPER_PASSWORD", requestId: request.id });
      }
      const current = actor(request);
      const { token, expiresAt } = createDeveloperModeToken(current.userId, env.BETTER_AUTH_SECRET);
      reply.header("set-cookie", developerModeCookie(token, env.NODE_ENV === "production"));
      return { enabled: true, expiresAt: expiresAt.toISOString() };
    },
  );

  app.delete("/v1/admin/developer-mode", { preHandler: adminOnly }, async (_request, reply) => {
    reply.header("set-cookie", clearDeveloperModeCookie(env.NODE_ENV === "production"));
    return reply.code(204).send();
  });

  app.get("/v1/admin/cases", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id as "memberId", p.full_name as "fullName", p.email, p.account_status as "accountStatus",
                m.age, m.sex, m.current_stage as "currentStage", m.onboarding_status as "onboardingStatus",
                a.doctor_id as "doctorId", d.full_name as "doctorName",
                (select count(*)::int from app.health_documents hd where hd.member_id = p.id) as "documentsCount",
                case when exists(select 1 from app.lab_reports lr where lr.member_id = p.id and lr.status = 'released') then 'released'
                     when exists(select 1 from app.lab_reports lr where lr.member_id = p.id) then 'draft' else 'none' end as "resultsStatus",
                case when exists(select 1 from app.care_plans cp where cp.member_id = p.id and cp.status = 'released') then 'released'
                     when exists(select 1 from app.care_plans cp where cp.member_id = p.id) then 'draft' else 'none' end as "carePlanStatus",
                exists(select 1 from app.appointments ap where ap.member_id = p.id and ap.status = 'scheduled') as "hasAppointment",
                greatest(p.updated_at, m.updated_at) as "updatedAt"
         from app.profiles p
         join app.member_profiles m on m.member_id = p.id
         left join app.doctor_assignments a on a.member_id = p.id and a.status = 'active'
         left join app.profiles d on d.id = a.doctor_id
         where p.role = 'member' order by greatest(p.updated_at, m.updated_at) desc`,
      );
      const rows = result.rows.map((row) => {
        let nextAction = "Complete health profile";
        let nextOwner: "admin" | "member" | "doctor" | "done" = "member";
        if (row.onboardingStatus === "completed" && !row.doctorId) [nextAction, nextOwner] = ["Assign a doctor", "admin"];
        else if (row.currentStage === "consult_upcoming" && !row.hasAppointment) [nextAction, nextOwner] = ["Schedule teleconsult", "admin"];
        else if (row.currentStage === "consult_upcoming") [nextAction, nextOwner] = ["Prepare blood panel", "doctor"];
        else if (row.currentStage === "blood_form_ready") [nextAction, nextOwner] = ["Complete blood draw", "member"];
        else if (row.resultsStatus === "draft") [nextAction, nextOwner] = ["Review and release results", "admin"];
        else if (row.resultsStatus === "released" && row.carePlanStatus !== "released") [nextAction, nextOwner] = ["Prepare care plan", "doctor"];
        else if (row.carePlanStatus === "released") [nextAction, nextOwner] = ["Care plan released", "done"];
        return { ...row, nextAction, nextOwner };
      });
      return { data: rows };
    });
  });

  app.get<{ Params: { memberId: string } }>("/v1/admin/cases/:memberId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const base = await client.query(
        `select p.full_name as "memberName", p.email as "memberEmail", p.account_status as "accountStatus", m.age, m.sex,
                m.height_cm as "heightCm", m.weight_kg as "weightKg", m.goals, m.medications,
                m.conditions, m.preferred_name as "preferredName", m.current_stage as "currentStage",
                m.onboarding_status as "onboardingStatus", m.phone,
                m.date_of_birth as "dateOfBirth", m.ic_passport_no as "icPassportNo", m.address,
                m.is_founding_member as "isFoundingMember",
                p.invited_at as "invitedAt", p.temp_password_expires_at as "tempPasswordExpiresAt",
                p.setup_completed_at as "setupCompletedAt"
         from app.profiles p left join app.member_profiles m on m.member_id = p.id where p.id = $1`,
        [request.params.memberId],
      );
      if (!base.rows[0]) return { data: null };
      const [responses, docs, assignment, plan, labOrder] = await Promise.all([
        client.query<{ question_key: string; response: unknown }>("select question_key, response from app.onboarding_responses where member_id = $1", [request.params.memberId]),
        client.query(
          `select id, file_name, object_key as storage_path, mime_type, size_bytes, doc_type, uploaded_by, created_at
           from app.health_documents where member_id = $1 order by created_at desc`,
          [request.params.memberId],
        ),
        client.query(
          `select a.doctor_id as "doctorId", p.full_name as "doctorName"
           from app.doctor_assignments a join app.profiles p on p.id = a.doctor_id
           where a.member_id = $1 and a.status = 'active' order by a.assigned_at desc limit 1`,
          [request.params.memberId],
        ),
        client.query(
          `select cp.status, p.full_name as "doctorName", cp.updated_at as "updatedAt", cp.released_at as "releasedAt"
           from app.care_plans cp join app.profiles p on p.id = cp.doctor_id
           where cp.member_id = $1 order by cp.created_at desc limit 1`,
          [request.params.memberId],
        ),
        client.query(
          `select biomarker_codes as "biomarkerCodes", status, ordered_at as "orderedAt",
                  form_released_at as "formReleasedAt", blood_draw_at as "bloodDrawAt",
                  quote_pricing_version as "pricingVersion", quote_currency as currency,
                  quote_catalog_count as "catalogCount", quote_selected_count as "selectedCount",
                  quote_base_amount_minor as "baseAmountMinor",
                  quote_personalization_discount_minor as "personalizationDiscountMinor",
                  quote_founding_discount_minor as "foundingDiscountMinor",
                  quote_is_founding_member as "isFoundingMember",
                  quote_total_amount_minor as "totalAmountMinor", quoted_at as "quotedAt"
           from app.lab_orders where member_id = $1
           order by (status in ('draft','ordered','collected')) desc, created_at desc limit 1`,
          [request.params.memberId],
        ),
      ]);
      const order = labOrder.rows[0] ?? null;
      const quote = order?.quotedAt == null ? null : {
        pricingVersion: order.pricingVersion,
        currency: order.currency,
        catalogCount: order.catalogCount,
        selectedCount: order.selectedCount,
        baseAmountMinor: order.baseAmountMinor,
        personalizationDiscountMinor: order.personalizationDiscountMinor,
        foundingDiscountMinor: order.foundingDiscountMinor,
        isFoundingMember: order.isFoundingMember,
        totalAmountMinor: order.totalAmountMinor,
        quotedAt: order.quotedAt,
      };
      return {
        data: {
          ...base.rows[0],
          onboarding: Object.fromEntries(responses.rows.map((row) => [row.question_key, row.response])),
          documents: docs.rows,
          doctorId: assignment.rows[0]?.doctorId ?? null,
          doctorName: assignment.rows[0]?.doctorName ?? null,
          carePlan: plan.rows[0] ?? null,
          labOrder: order ? {
            biomarkerCodes: order.biomarkerCodes,
            status: order.status,
            orderedAt: order.orderedAt,
            formReleasedAt: order.formReleasedAt,
            bloodDrawAt: order.bloodDrawAt,
            quote,
          } : null,
        },
      };
    });
  });

  app.patch<{ Params: { memberId: string } }>(
    "/v1/admin/members/:memberId/membership",
    { preHandler: adminOnly },
    async (request, reply) => {
      const current = actor(request);
      const body = z.object({ isFoundingMember: z.boolean() }).parse(request.body);
      const updated = await withActor(current, async (client) => client.query(
        `update app.member_profiles set is_founding_member = $2
         where member_id = $1 returning member_id`,
        [request.params.memberId, body.isFoundingMember],
      ));
      if (!updated.rows[0]) {
        return reply.code(404).send({ error: "Member not found", code: "NOT_FOUND", requestId: request.id });
      }
      return { data: { isFoundingMember: body.isFoundingMember } };
    },
  );

  // Release the blood-test request form to the member. The admin does this after
  // confirming the appointment and payment off-platform. It stamps the order,
  // advances the member's stage to blood_form_ready, and queues the "form ready"
  // email (dashboard link only — the PDF is never attached).
  app.post<{ Params: { memberId: string } }>(
    "/v1/admin/members/:memberId/blood-form/release",
    { preHandler: adminOnly },
    async (request, reply) => {
      const current = actor(request);
      const body = z.object({ bloodDrawAt: z.iso.datetime().nullable().optional() }).parse(request.body ?? {});
      const released = await withActor(current, async (client) => {
        await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [request.params.memberId]);
        const order = await client.query<{ id: string; form_released_at: string | null }>(
          `select id, form_released_at from app.lab_orders
           where member_id = $1 and status = 'ordered'
           order by created_at desc limit 1 for update`,
          [request.params.memberId],
        );
        if (!order.rows[0]) return { ok: false as const, reason: "no_order" as const };
        if (order.rows[0].form_released_at) return { ok: false as const, reason: "already" as const };
        // The blood-draw appointment is published together with the release, so
        // the member never sees a tentative slot before payment is confirmed.
        await client.query(
          `update app.lab_orders set form_released_at = now(), form_released_by = $2,
             blood_draw_at = $3, updated_at = now()
           where id = $1`,
          [order.rows[0].id, current.userId, body.bloodDrawAt ?? null],
        );
        await client.query(
          `update app.member_profiles set current_stage = 'blood_form_ready'
           where member_id = $1 and current_stage in ('consult_upcoming', 'profile_incomplete')`,
          [request.params.memberId],
        );
        return { ok: true as const };
      });
      if (!released.ok) {
        if (released.reason === "no_order") {
          return reply.code(409).send({ error: "No ordered blood panel to release", code: "NO_ORDER", requestId: request.id });
        }
        return reply.code(409).send({ error: "The form has already been released", code: "ALREADY_RELEASED", requestId: request.id });
      }
      const boss = await getBoss();
      await boss.send(
        "send-blood-form-email",
        { memberId: request.params.memberId },
        { singletonKey: `blood-form:${request.params.memberId}` },
      );
      return { data: { released: true } };
    },
  );

  // Re-schedule the blood-draw appointment after the form has been released.
  app.patch<{ Params: { memberId: string } }>(
    "/v1/admin/members/:memberId/blood-draw",
    { preHandler: adminOnly },
    async (request, reply) => {
      const current = actor(request);
      const body = z.object({ bloodDrawAt: z.iso.datetime().nullable() }).parse(request.body);
      const updated = await withActor(current, async (client) => client.query(
        `update app.lab_orders set blood_draw_at = $2, updated_at = now()
         where member_id = $1 and status = 'ordered' and form_released_at is not null
         returning id`,
        [request.params.memberId, body.bloodDrawAt],
      ));
      if (!updated.rows[0]) {
        return reply.code(409).send({ error: "No released blood order to schedule", code: "NO_RELEASED_ORDER", requestId: request.id });
      }
      return { data: { bloodDrawAt: body.bloodDrawAt } };
    },
  );

  app.post("/v1/admin/patients", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z
      .object({
        fullName: z.string().trim().min(1).max(200),
        email: z
          .string()
          .trim()
          .max(320)
          .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "must be a valid email"),
        phone: z.string().trim().min(5).max(40),
        doctorId: z.string().min(1).optional(),
      })
      .parse(request.body);

    // Reject a duplicate before creating an auth user.
    const existing = await authPool.query(
      `select 1 from identity."user" where lower(email) = lower($1) limit 1`,
      [body.email],
    );
    if (existing.rowCount) return reply.code(409).send({ error: "email_exists" });

    const tempPassword = generateTempPassword();
    let memberId: string;
    try {
      const created = await auth.api.signUpEmail({
        body: { name: body.fullName, email: body.email, password: tempPassword },
      });
      memberId = created.user.id;
    } catch {
      // Unique-violation race or better-auth validation.
      return reply.code(409).send({ error: "email_exists" });
    }

    const expiresAt = inviteExpiresAt();
    await withActor(current, async (client) => {
      await client.query(
        `update app.profiles set full_name = $2, invited_by = $3, invited_at = now(), temp_password_expires_at = $4 where id = $1`,
        [memberId, body.fullName, current.userId, expiresAt.toISOString()],
      );
      await client.query("update app.member_profiles set phone = $2 where member_id = $1", [memberId, body.phone]);
      if (body.doctorId) {
        await client.query(
          "update app.doctor_assignments set status='inactive', ended_at=now() where member_id=$1 and status='active'",
          [memberId],
        );
        await client.query(
          "insert into app.doctor_assignments (member_id, doctor_id, assigned_by) values ($1,$2,$3)",
          [memberId, body.doctorId, current.userId],
        );
      }
    });

    // The temp password crosses the wire exactly once, here.
    return reply.code(201).send({ data: { memberId, tempPassword, expiresAt: expiresAt.toISOString() } });
  });

  app.post<{ Params: { memberId: string } }>(
    "/v1/admin/patients/:memberId/reset-invite",
    { preHandler: adminOnly },
    async (request, reply) => {
      const memberId = request.params.memberId;
      const state = await authPool.query<{ role: string; setup_completed_at: Date | null }>(
        "select role, setup_completed_at from app.profiles where id = $1",
        [memberId],
      );
      const row = state.rows[0];
      if (!row || row.role !== "member") return reply.code(404).send({ error: "not_found" });
      if (row.setup_completed_at != null) return reply.code(409).send({ error: "already_active" });

      const tempPassword = generateTempPassword();
      const hashed = await hashPassword(tempPassword);
      const expiresAt = inviteExpiresAt();

      const updated = await authPool.query(
        `update identity.account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = 'credential'`,
        [hashed, memberId],
      );
      if (updated.rowCount === 0) {
        // Credential row was deleted after a Google-only setup attempt; recreate it.
        await authPool.query(
          `insert into identity.account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
           values ($1, $2, 'credential', $2, $3, now(), now())`,
          [randomUUID(), memberId, hashed],
        );
      }
      await authPool.query(
        `update app.profiles set temp_password_expires_at = $2, password_set_at = null, updated_at = now() where id = $1`,
        [memberId, expiresAt.toISOString()],
      );
      // Old sessions must not linger on a re-issued invite.
      await authPool.query(`delete from identity.session where "userId" = $1`, [memberId]);

      return reply.send({ data: { tempPassword, expiresAt: expiresAt.toISOString() } });
    },
  );

  app.get<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/reports", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select r.id, r.lab_name, r.panel_name, r.collected_at, r.document_id,
                r.source_version, r.supersedes_report_id,
                exists(select 1 from app.lab_reports replacement
                        where replacement.supersedes_report_id = r.id and replacement.status = 'released') as is_superseded,
                case when r.status = 'released' then 'released' else 'draft' end as status, r.released_at,
          coalesce(jsonb_agg(jsonb_build_object(
            'id', b.id, 'lab_report_id', b.lab_report_id, 'member_id', b.member_id,
            'biomarker_code', b.biomarker_code, 'biomarker_name', b.biomarker_name,
            'category', b.category, 'value_numeric', b.value_numeric, 'value_text', b.value_text,
            'unit', b.unit, 'ref_low', b.ref_low, 'ref_high', b.ref_high,
            'optimal_low', b.optimal_low, 'optimal_high', b.optimal_high,
            'status', b.status, 'notes', b.notes
          ) order by b.created_at) filter (where b.id is not null), '[]'::jsonb) as biomarker_results
         from app.lab_reports r left join app.biomarker_results b on b.lab_report_id = r.id
         where r.member_id = $1 group by r.id order by r.collected_at desc nulls last`,
        [request.params.memberId],
      );
      return { data: result.rows };
    });
  });

  app.post<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/reports", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = reportFieldsSchema.parse(request.body);
    const row = await withActor(current, async (client) => {
      const result = await client.query(
        // external_report_id has no partner to supply one for a manually-entered
        // report, so mint one: (partner_id, external_report_id, source_version)
        // is unique with nulls treated as equal, and every manual report shares
        // source_version=1 — leaving it null would let only one such row exist
        // system-wide.
        `insert into app.lab_reports
          (member_id, lab_name, panel_name, collected_at, document_id, status, source_status, external_report_id, created_by)
         values ($1, $2, $3, $4, $5, 'draft', 'final', $6, $7) returning id`,
        [request.params.memberId, body.lab_name, body.panel_name, body.collected_at, body.document_id, `manual:${randomUUID()}`, current.userId],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: row });
  });

  app.patch<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = reportFieldsSchema.partial().parse(request.body);
    const updated = await withActor(current, async (client) => {
      const result = await client.query(
        `update app.lab_reports set
          lab_name = coalesce($2, lab_name), panel_name = coalesce($3, panel_name),
          collected_at = coalesce($4, collected_at), document_id = coalesce($5, document_id)
         where id = $1 and status <> 'released' returning id`,
        [request.params.reportId, body.lab_name ?? null, body.panel_name ?? null, body.collected_at ?? null, body.document_id ?? null],
      );
      return result.rowCount === 1;
    });
    if (!updated) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return { ok: true };
  });

  app.delete<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const deleted = await withActor(current, (client) => client.query(
      "delete from app.lab_reports where id = $1 and status <> 'released' returning id",
      [request.params.reportId],
    ));
    if (!deleted.rows[0]) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return reply.code(204).send();
  });

  app.post<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId/corrections", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const result = await withActor(current, async (client) => {
      const source = await client.query<{ status: string }>(
        "select status from app.lab_reports where id = $1 for share",
        [request.params.reportId],
      );
      if (!source.rows[0]) return { kind: "not_found" as const };
      if (source.rows[0].status !== "released") return { kind: "invalid" as const };
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`report-correction:${request.params.reportId}`]);
      const superseded = await client.query(
        "select 1 from app.lab_reports where supersedes_report_id = $1 and status = 'released' limit 1",
        [request.params.reportId],
      );
      if (superseded.rows[0]) return { kind: "superseded" as const };
      const existing = await client.query<{ id: string }>(
        `select id from app.lab_reports where supersedes_report_id = $1
          and status in ('draft','quarantined','review_pending') limit 1 for update`,
        [request.params.reportId],
      );
      if (existing.rows[0]) return { kind: "ok" as const, id: existing.rows[0].id, created: false };
      const created = await client.query<{ id: string }>(
        `insert into app.lab_reports
          (member_id, lab_order_id, partner_id, source_version, source_status,
           supersedes_report_id, lab_name, panel_name, collected_at, issued_at,
           received_at, document_id, status, created_by)
         select member_id, lab_order_id, partner_id, source_version + 1, 'corrected',
                id, lab_name, panel_name, collected_at, issued_at,
                now(), document_id, 'draft', $2
           from app.lab_reports where id = $1 returning id`,
        [request.params.reportId, current.userId],
      );
      const correctionId = created.rows[0]!.id;
      await client.query(
        `insert into app.biomarker_results
          (lab_report_id, member_id, source_code, source_system, biomarker_code,
           biomarker_name, category, source_value, value_numeric, value_text,
           source_unit, unit, source_reference_range, ref_low, ref_high,
           optimal_low, optimal_high, source_flag, source_status, status,
           mapping_version, notes, observed_at)
         select $2, member_id, source_code, source_system, biomarker_code,
                biomarker_name, category, source_value, value_numeric, value_text,
                source_unit, unit, source_reference_range, ref_low, ref_high,
                optimal_low, optimal_high, source_flag, source_status, status,
                mapping_version, notes, observed_at
           from app.biomarker_results where lab_report_id = $1`,
        [request.params.reportId, correctionId],
      );
      return { kind: "ok" as const, id: correctionId, created: true };
    });
    if (result.kind === "not_found") return reply.code(404).send({ error: "Report not found", code: "NOT_FOUND", requestId: request.id });
    if (result.kind === "invalid") return reply.code(409).send({ error: "Only released reports can be corrected", code: "INVALID_STATE", requestId: request.id });
    if (result.kind === "superseded") return reply.code(409).send({ error: "This report has already been superseded", code: "ALREADY_SUPERSEDED", requestId: request.id });
    return reply.code(result.created ? 201 : 200).send({ data: { id: result.id } });
  });

  app.post<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId/biomarkers", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string(), row: biomarkerSchema }).parse(request.body);
    const created = await withActor(current, async (client) => {
      const row = body.row;
      const result = await client.query(
        `insert into app.biomarker_results
          (lab_report_id, member_id, source_code, biomarker_code, biomarker_name, category,
           source_value, value_numeric, value_text, source_unit, unit, ref_low, ref_high,
           optimal_low, optimal_high, status, notes)
         select r.id,r.member_id,$2,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13,$14
           from app.lab_reports r where r.id = $1 and r.status <> 'released' returning id`,
        [request.params.reportId, row.biomarker_code, row.biomarker_name, row.category,
          row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
          row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
      );
      return result.rows[0];
    });
    if (!created) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return reply.code(201).send({ data: created });
  });

  app.post<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId/biomarkers/bulk", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string(), rows: z.array(biomarkerSchema).max(1000) }).parse(request.body);
    const inserted = await withActor(current, async (client) => {
      const editable = await client.query<{ member_id: string }>(
        "select member_id from app.lab_reports where id = $1 and status <> 'released' for update",
        [request.params.reportId],
      );
      if (!editable.rows[0]) return null;
      let count = 0;
      for (const row of body.rows) {
        await client.query(
          `insert into app.biomarker_results
            (lab_report_id, member_id, source_code, biomarker_code, biomarker_name, category,
             source_value, value_numeric, value_text, source_unit, unit, ref_low, ref_high,
             optimal_low, optimal_high, status, notes)
           values ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14,$15)`,
          [request.params.reportId, editable.rows[0].member_id, row.biomarker_code, row.biomarker_name, row.category,
            row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
            row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
        );
        count += 1;
      }
      return count;
    });
    if (inserted === null) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return reply.code(201).send({ inserted });
  });

  app.put<{ Params: { biomarkerId: string } }>("/v1/admin/biomarkers/:biomarkerId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const row = biomarkerSchema.parse(request.body);
    const updated = await withActor(current, async (client) => {
      const result = await client.query(
        `update app.biomarker_results set biomarker_code=$2, biomarker_name=$3, category=$4,
          source_value=$5, value_numeric=$6, value_text=$7, source_unit=$8, unit=$8,
          ref_low=$9, ref_high=$10, optimal_low=$11, optimal_high=$12, status=$13, notes=$14
         where id=$1 and exists (
           select 1 from app.lab_reports r where r.id = lab_report_id and r.status <> 'released'
         ) returning id`,
        [request.params.biomarkerId, row.biomarker_code, row.biomarker_name, row.category,
          row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
          row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
      );
      return result.rowCount === 1;
    });
    if (!updated) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return { ok: true };
  });

  app.delete<{ Params: { biomarkerId: string } }>("/v1/admin/biomarkers/:biomarkerId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const deleted = await withActor(current, (client) => client.query(
      `delete from app.biomarker_results b where b.id = $1 and exists (
         select 1 from app.lab_reports r where r.id = b.lab_report_id and r.status <> 'released'
       ) returning b.id`,
      [request.params.biomarkerId],
    ));
    if (!deleted.rows[0]) return reply.code(409).send({ error: "Released reports are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return reply.code(204).send();
  });

  app.post<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId/release", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const released = await client.query<{ member_id: string }>(
        `update app.lab_reports set status='released', released_at=now()
         where id=$1 and status in ('draft','review_pending') returning member_id`,
        [request.params.reportId],
      );
      if (released.rows[0]) await client.query("update app.member_profiles set current_stage='results_ready' where member_id=$1", [released.rows[0].member_id]);
      return { released: released.rowCount === 1 };
    });
  });

  app.post("/v1/admin/doctors", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({
      fullName: z.string().trim().min(1).max(200),
      email: z.string().trim().max(320).refine((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), "must be a valid email"),
    }).parse(request.body);

    const existing = await authPool.query(`select 1 from identity."user" where lower(email) = lower($1) limit 1`, [body.email]);
    if (existing.rowCount) return reply.code(409).send({ error: "email_exists" });

    let doctorId: string | null = null;
    try {
      const temporaryPassword = generateRandomString(32, "a-z", "A-Z", "0-9");
      const created = await auth.api.signUpEmail({ body: { name: body.fullName, email: body.email, password: temporaryPassword } });
      doctorId = created.user.id;
      await authPool.query(
        `update app.profiles
           set role = 'doctor', account_status = 'pending', doctor_active = true,
               full_name = $2, invited_by = $3, invited_at = now(), temp_password_expires_at = null
         where id = $1`,
        [doctorId, body.fullName, current.userId],
      );
      await withActor(current, async (client) => {
        await client.query("delete from app.member_profiles where member_id = $1", [doctorId]);
      });

      const activationToken = generateRandomString(32, "a-z", "A-Z", "0-9");
      await authPool.query(
        `insert into identity.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
         values ($1, $2, $3, now() + interval '7 days', now(), now())`,
        [randomUUID(), `reset-password:${activationToken}`, doctorId],
      );
      const activationUrl = new URL("/activate-account", env.APP_ORIGIN);
      activationUrl.hash = new URLSearchParams({ token: activationToken }).toString();
      await sendAccountEmail({
        to: body.email,
        subject: "Activate your Verae Health doctor account",
        text: `Welcome to Verae Health. Activate your doctor account and choose a password within 7 days: ${activationUrl.toString()}`,
      });
      return reply.code(201).send({ data: { doctorId } });
    } catch (error) {
      if (doctorId) await authPool.query(`delete from identity."user" where id = $1`, [doctorId]).catch(() => undefined);
      request.log.error({ err: error }, "doctor invitation failed");
      return reply.code(502).send({ error: "doctor_invite_failed" });
    }
  });

  app.get("/v1/admin/doctors", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id as "doctorId", p.full_name as "fullName", p.email,
                p.doctor_active as "isActive", p.account_status as "accountStatus", count(a.id)::int as "assignedCount"
         from app.profiles p left join app.doctor_assignments a on a.doctor_id=p.id and a.status='active'
         where p.role='doctor' group by p.id order by p.full_name nulls last`,
      );
      return { data: result.rows };
    });
  });

  app.get<{ Params: { doctorId: string } }>("/v1/admin/doctors/:doctorId/members", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id as "memberId", p.full_name as "fullName", p.email
         from app.doctor_assignments a join app.profiles p on p.id=a.member_id
         where a.doctor_id=$1 and a.status='active' order by p.full_name`,
        [request.params.doctorId],
      );
      return { data: result.rows };
    });
  });

  app.put("/v1/admin/assignments", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string(), doctorId: z.string() }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("update app.doctor_assignments set status='inactive', ended_at=now() where member_id=$1 and status='active'", [body.memberId]);
      await client.query(
        "insert into app.doctor_assignments (member_id, doctor_id, assigned_by) values ($1,$2,$3)",
        [body.memberId, body.doctorId, current.userId],
      );
      // Carry any already-scheduled consult over to the new doctor.
      await client.query(
        "update app.appointments set doctor_id = $2 where member_id = $1 and status = 'scheduled'",
        [body.memberId, body.doctorId],
      );
      return { ok: true };
    });
  });

  app.delete<{ Params: { memberId: string } }>("/v1/admin/assignments/:memberId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      await client.query("update app.doctor_assignments set status='inactive', ended_at=now() where member_id=$1 and status='active'", [request.params.memberId]);
      return { ok: true };
    });
  });

  app.patch<{ Params: { userId: string } }>("/v1/admin/users/:userId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ doctorActive: z.boolean().optional(), accountStatus: z.enum(["pending", "active", "suspended"]).optional() }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        `update app.profiles set doctor_active=coalesce($2,doctor_active),
          account_status=coalesce($3,account_status) where id=$1`,
        [request.params.userId, body.doctorActive ?? null, body.accountStatus ?? null],
      );
      return { ok: true };
    });
  });

  // Biomarker catalog management. Note the path segment: /v1/admin/biomarkers/:id
  // already exists above and operates on biomarker_results rows by uuid, which
  // is a different thing entirely.
  app.get("/v1/admin/catalog/biomarkers", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      // Unlike the member-facing catalog this returns retired markers too —
      // an admin cannot reactivate what they cannot see. usage_count shows how
      // many released results reference a marker before it is retired.
      const result = await client.query(
        `select b.id, b.display_name, b.unit, b.scoring_mode, b.is_active, b.deactivated_at,
                coalesce(
                  array_agg(c.name order by m.is_primary desc, c.display_order)
                    filter (where c.name is not null), '{}'
                ) as categories,
                (select count(*) from app.biomarker_results r where r.biomarker_code = b.id) as usage_count
         from app.biomarkers b
         left join app.biomarker_category_members m on m.biomarker_id = b.id
         left join app.biomarker_categories c on c.id = m.category_id
         group by b.id
         order by b.is_active desc, b.display_name`,
      );
      return { data: result.rows };
    });
  });

  app.patch<{ Params: { code: string } }>("/v1/admin/catalog/biomarkers/:code", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ isActive: z.boolean() }).parse(request.body);
    return withActor(current, async (client) => {
      const result = await client.query(
        `update app.biomarkers set
           is_active = $2,
           deactivated_at = case when $2 then null else now() end,
           deactivated_by = case when $2 then null else $3 end
         where id = $1
         returning id`,
        [request.params.code, body.isActive, current.userId],
      );
      if (result.rowCount === 0) return reply.notFound("Biomarker not found");
      return { ok: true };
    });
  });

  app.delete<{ Params: { userId: string } }>("/v1/admin/users/:userId", { preHandler: developerOnly }, async (request, reply) => {
    const current = actor(request);
    if (request.params.userId === current.userId) {
      return reply.code(409).send({ error: "You cannot delete your own account", code: "SELF_DELETE_FORBIDDEN" });
    }
    const target = await withActor(current, async (client) => {
      const profile = await client.query<{ role: string }>("select role from app.profiles where id = $1", [request.params.userId]);
      if (!profile.rows[0] || !["member", "doctor"].includes(profile.rows[0].role)) return null;
      const documents = profile.rows[0].role === "member"
        ? await client.query<{ object_key: string }>("select object_key from app.health_documents where member_id = $1", [request.params.userId])
        : { rows: [] };
      await client.query("select app.delete_account($1)", [request.params.userId]);
      return { role: profile.rows[0].role, objectKeys: documents.rows.map((row) => row.object_key) };
    });
    if (!target) return reply.code(404).send({ error: "Account not found", code: "NOT_FOUND" });

    const deletedObjects = await Promise.allSettled(target.objectKeys.map((key) => deleteDocumentObject(key)));
    if (deletedObjects.some((result) => result.status === "rejected")) {
      request.log.error({ userId: request.params.userId }, "account deleted with orphaned document objects");
    }
    return reply.code(204).send();
  });

  // Test-only: drops a ready-made draft care plan onto a member so a fully
  // populated profile can be reviewed end to end. Authored under the member's
  // assigned doctor (not the admin) so the member-facing attribution is real.
  // Developer mode only — never part of the normal admin workflow.
  app.post<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/demo-care-plan", { preHandler: developerOnly }, async (request, reply) => {
    const current = actor(request);
    const memberId = request.params.memberId;
    const body = z.object({
      title: z.string().min(1).max(250),
      summary: z.string().max(8000),
      sections: z.array(demoPlanSectionSchema).max(50),
    }).parse(request.body);

    const result = await withActor(current, async (client) => {
      const doctor = await client.query<{ doctor_id: string }>(
        "select doctor_id from app.doctor_assignments where member_id = $1 and status = 'active' order by assigned_at desc limit 1",
        [memberId],
      );
      const doctorId = doctor.rows[0]?.doctor_id;
      if (!doctorId) return { kind: "no_doctor" as const };

      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`care-plan:${memberId}`]);
      const existing = await client.query<{ id: string }>(
        "select id from app.care_plans where member_id = $1 and status = 'draft' for update",
        [memberId],
      );

      let planId = existing.rows[0]?.id;
      if (planId) {
        await client.query(
          "update app.care_plans set doctor_id = $2, title = $3, summary = $4 where id = $1",
          [planId, doctorId, body.title, body.summary],
        );
        await client.query("delete from app.care_plan_sections where care_plan_id = $1", [planId]);
      } else {
        const created = await client.query<{ id: string }>(
          `insert into app.care_plans (member_id, doctor_id, title, summary, status, version)
           values ($1, $2, $3, $4, 'draft',
                   (select coalesce(max(version), 0) + 1 from app.care_plans where member_id = $1))
           returning id`,
          [memberId, doctorId, body.title, body.summary],
        );
        planId = created.rows[0]!.id;
      }

      for (const section of body.sections) {
        await client.query(
          `insert into app.care_plan_sections
            (care_plan_id, sort_order, title, summary, markers, doctor_note, image_key, actions)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [planId, section.sort_order, section.title, section.summary, section.markers,
            section.doctor_note, section.image_key, JSON.stringify(section.actions)],
        );
      }
      return { kind: "ok" as const, id: planId };
    });

    if (result.kind === "no_doctor") {
      return reply.code(409).send({ error: "Assign a doctor to this member first", code: "NO_DOCTOR", requestId: request.id });
    }
    return reply.code(201).send({ data: { id: result.id } });
  });

  app.patch<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/stage", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ stage: z.enum(["profile_incomplete", "consult_upcoming", "blood_form_ready", "results_pending", "results_ready", "care_plan_ready"]) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("update app.member_profiles set current_stage=$2 where member_id=$1", [request.params.memberId, body.stage]);
      return { ok: true };
    });
  });

  app.get<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/appointment", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select a.id, a.member_id as "memberId", a.doctor_id as "doctorId", d.full_name as "doctorName",
                a.scheduled_at as "scheduledAt", a.duration_minutes as "durationMinutes",
                a.meeting_url as "meetingUrl", a.status
         from app.appointments a join app.profiles d on d.id = a.doctor_id
         where a.member_id = $1 and a.status = 'scheduled' limit 1`,
        [request.params.memberId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.put<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/appointment", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = appointmentSchema.parse(request.body);
    const scheduledAt = new Date(body.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) return reply.code(400).send({ error: "scheduled_at_in_past" });
    const memberId = request.params.memberId;
    const meetingUrl = body.meetingUrl ?? null;
    const outcome = await withActor(current, async (client) => {
      const assignment = await client.query<{ doctor_id: string }>(
        "select doctor_id from app.doctor_assignments where member_id = $1 and status = 'active' limit 1",
        [memberId],
      );
      const doctorId = assignment.rows[0]?.doctor_id;
      if (!doctorId) return { error: "no_active_doctor" as const };

      const existing = await client.query<{ id: string; scheduled_at: Date }>(
        "select id, scheduled_at from app.appointments where member_id = $1 and status = 'scheduled' for update",
        [memberId],
      );
      let id: string;
      if (existing.rows[0]) {
        id = existing.rows[0].id;
        await client.query(
          "update app.appointments set scheduled_at = $2, duration_minutes = $3, meeting_url = $4, doctor_id = $5 where id = $1",
          [id, scheduledAt.toISOString(), body.durationMinutes, meetingUrl, doctorId],
        );
      } else {
        const inserted = await client.query<{ id: string }>(
          `insert into app.appointments (member_id, doctor_id, scheduled_at, duration_minutes, meeting_url, created_by)
           values ($1, $2, $3, $4, $5, $6) returning id`,
          [memberId, doctorId, scheduledAt.toISOString(), body.durationMinutes, meetingUrl, current.userId],
        );
        id = inserted.rows[0]!.id;
      }
      // Only (re)send emails when the time actually moved. A pure meeting-URL
      // edit needs nothing new: already-queued reminders re-read the URL at send.
      const timeChanged = !existing.rows[0] || existing.rows[0].scheduled_at.toISOString() !== scheduledAt.toISOString();
      return { id, timeChanged };
    });

    if ("error" in outcome) return reply.code(409).send({ error: outcome.error });
    if (outcome.timeChanged) await scheduleConsultEmails(outcome.id, scheduledAt);
    return reply.send({ ok: true, id: outcome.id });
  });

  app.delete<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/appointment", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const cancelled = await client.query(
        "update app.appointments set status = 'cancelled', cancelled_at = now() where member_id = $1 and status = 'scheduled'",
        [request.params.memberId],
      );
      return { cancelled: cancelled.rowCount === 1 };
    });
  });

  app.get("/v1/admin/lab-mappings", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select m.*, p.slug as partner_slug from integration.code_mappings m
         join integration.lab_partners p on p.id=m.partner_id order by p.slug,m.source_code,m.version desc`,
      );
      return { data: result.rows };
    });
  });

  app.post("/v1/admin/lab-mappings", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({
      partnerId: z.string().uuid(),
      sourceCode: z.string().min(1).max(100),
      sourceUnit: z.string().max(100).default(""),
      biomarkerCode: z.string().min(1).max(100),
      normalizedUnit: z.string().max(100).nullable(),
    }).parse(request.body);
    const row = await withActor(current, async (client) => {
      const result = await client.query(
        `insert into integration.code_mappings
          (partner_id,source_code,source_unit,biomarker_code,normalized_unit,version,status,approved_by,approved_at)
         select $1,$2,$3,$4,$5,coalesce(max(version),0)+1,'approved',$6,now()
         from integration.code_mappings where partner_id=$1 and source_code=$2 and source_unit=$3
         returning id,version`,
        [body.partnerId, body.sourceCode, body.sourceUnit, body.biomarkerCode, body.normalizedUnit, current.userId],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: row });
  });

  app.patch<{ Params: { mappingId: string } }>("/v1/admin/lab-mappings/:mappingId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ status: z.enum(["approved", "retired"]) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("update integration.code_mappings set status=$2 where id=$1", [request.params.mappingId, body.status]);
      return { ok: true };
    });
  });

  app.get<{ Querystring: { status?: string } }>("/v1/admin/lab-issues", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const status = z.enum(["open", "resolved", "ignored"]).default("open").parse(request.query.status);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select i.id,i.issue_code,i.message,i.details,i.status,i.created_at,
                e.id as inbound_event_id,e.partner_event_id,e.processing_status,p.slug as partner_slug
         from integration.processing_issues i
         join integration.inbound_events e on e.id=i.inbound_event_id
         join integration.lab_partners p on p.id=e.partner_id
         where i.status=$1 order by i.created_at desc limit 500`,
        [status],
      );
      return { data: result.rows };
    });
  });

  app.patch<{ Params: { issueId: string } }>("/v1/admin/lab-issues/:issueId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ status: z.enum(["resolved", "ignored"]) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        "update integration.processing_issues set status=$2,resolved_by=$3,resolved_at=now() where id=$1 and status='open'",
        [request.params.issueId, body.status, current.userId],
      );
      return { ok: true };
    });
  });
}
