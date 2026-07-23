import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { actor, requireActor, requireRoles } from "../auth/guards.js";
import { authPool } from "../auth/auth.js";
import { withActor } from "../db/pools.js";
import { isInviteExpired } from "../services/invites.js";
import { calculateLabOrderQuote, validateLabOrderCodes } from "../services/lab-order-pricing.js";
import { loadBloodFormPayload } from "../services/blood-form.js";

type LabOrderDbRow = {
  member_id: string;
  biomarker_codes: string[];
  status: "draft" | "ordered" | "collected" | "completed" | "cancelled";
  ordered_at: string | null;
  quote_pricing_version: number | null;
  quote_currency: string | null;
  quote_catalog_count: number | null;
  quote_selected_count: number | null;
  quote_base_amount_minor: number | null;
  quote_personalization_discount_minor: number | null;
  quote_founding_discount_minor: number | null;
  quote_is_founding_member: boolean | null;
  quote_total_amount_minor: number | null;
  quoted_at: string | null;
  form_released_at: string | null;
  blood_draw_at: string | null;
};

function labOrderResponse(row: LabOrderDbRow) {
  const quote = row.quoted_at == null ? null : {
    pricingVersion: row.quote_pricing_version,
    currency: row.quote_currency,
    catalogCount: row.quote_catalog_count,
    selectedCount: row.quote_selected_count,
    baseAmountMinor: row.quote_base_amount_minor,
    personalizationDiscountMinor: row.quote_personalization_discount_minor,
    foundingDiscountMinor: row.quote_founding_discount_minor,
    isFoundingMember: row.quote_is_founding_member,
    totalAmountMinor: row.quote_total_amount_minor,
    quotedAt: row.quoted_at,
  };
  return {
    member_id: row.member_id,
    biomarker_codes: row.biomarker_codes,
    status: row.status,
    ordered_at: row.ordered_at,
    form_released_at: row.form_released_at,
    // Only surfaced to the member once the form is released; the admin can
    // schedule it earlier without the member seeing a tentative slot.
    blood_draw_at: row.form_released_at ? row.blood_draw_at : null,
    quote,
  };
}

const onboardingEntriesSchema = z.object({
  memberId: z.string().min(1),
  entries: z.record(z.string().min(1).max(100), z.unknown()),
});

// Every field optional so the same endpoint serves both the "confirm your
// details before downloading" prompt and piecemeal edits from the profile
// screen. date_of_birth is validated as a calendar date (yyyy-mm-dd).
const updateIdentitySchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be yyyy-mm-dd")
    .refine((v) => !Number.isNaN(Date.parse(v)), "must be a valid date")
    .nullable()
    .optional(),
  icPassportNo: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

const completeOnboardingSchema = z.object({
  memberId: z.string().min(1),
  preferredName: z.string().max(120),
  age: z.number().int().min(0).max(130),
  sex: z.string().max(100),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(1000),
});

export async function memberRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/me", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id, p.role, p.email, p.full_name, p.avatar_url, p.account_status,
                p.setup_completed_at, p.password_set_at, p.email_verified_at, p.temp_password_expires_at,
                (select c.signature_name
                   from app.member_consents c
                  where c.member_id = p.id
                  order by c.accepted_at desc
                  limit 1) as consent_name
         from app.profiles p where p.id = $1`,
        [current.userId],
      );
      const profile = result.rows[0];
      if (!profile) return { profile: null };

      // The setup wizard (first-login flow for invited members) is driven entirely
      // by these server flags, so a mid-setup re-login resumes at the right step.
      let setup: {
        required: boolean;
        inviteExpired: boolean;
        authMethod: "password" | "google" | null;
        otpVerified: boolean;
      } | undefined;
      if (profile.role === "member") {
        const setupComplete = profile.setup_completed_at != null;
        let hasGoogle = false;
        if (!setupComplete) {
          const google = await authPool.query(
            `select 1 from identity.account where "userId" = $1 and "providerId" = 'google' limit 1`,
            [current.userId],
          );
          hasGoogle = (google.rowCount ?? 0) > 0;
        }
        setup = {
          required: !setupComplete,
          inviteExpired: isInviteExpired({
            role: profile.role,
            setupCompletedAt: profile.setup_completed_at,
            passwordSetAt: profile.password_set_at,
            tempPasswordExpiresAt: profile.temp_password_expires_at,
          }),
          authMethod: profile.password_set_at ? "password" : hasGoogle ? "google" : null,
          otpVerified: profile.email_verified_at != null,
        };
      }

      return {
        profile: {
          id: profile.id,
          role: profile.role,
          email: profile.email,
          full_name: profile.full_name,
          consent_name: profile.consent_name,
          avatar_url: profile.avatar_url,
          account_status: profile.account_status,
          email_verified: current.emailVerified,
          two_factor_enabled: current.twoFactorEnabled,
          setup,
        },
      };
    });
  });

  app.get<{ Params: { id: string } }>("/v1/profiles/:id/public", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const data = await withActor(current, async (client) => {
      const result = await client.query(
        "select id, full_name, avatar_url from app.profiles where id = $1",
        [request.params.id],
      );
      return result.rows[0] ?? null;
    });
    if (!data) return reply.code(404).send({ error: "Profile not found", code: "NOT_FOUND", requestId: request.id });
    return { data };
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/profile", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    const data = await withActor(current, async (client) => {
      const result = await client.query(
        `select m.member_id, m.preferred_name, m.age, m.sex, m.height_cm, m.weight_kg,
                m.onboarding_status, m.current_stage, m.profile_confirmed_at,
                to_char(m.date_of_birth, 'YYYY-MM-DD') as date_of_birth, m.ic_passport_no, m.address, m.phone,
                p.full_name
         from app.member_profiles m
         join app.profiles p on p.id = m.member_id
         where m.member_id = $1`,
        [memberId],
      );
      return result.rows[0] ?? null;
    });
    if (!data && request.query.memberId) {
      return reply.code(404).send({ error: "Member not found", code: "NOT_FOUND", requestId: request.id });
    }
    return { data };
  });

  // Members self-edit the identity details the Innoquest form needs (their name
  // must match their IC exactly). full_name lives on app.profiles, which members
  // cannot update directly, so this flows through a security-definer function
  // scoped to the caller's own rows and the identity columns only.
  app.patch("/v1/member/profile", { preHandler: requireRoles("member") }, async (request) => {
    const current = actor(request);
    const body = updateIdentitySchema.parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        "select app.update_own_member_identity($1, $2, $3, $4, $5)",
        [
          body.fullName ?? null,
          body.dateOfBirth ?? null,
          body.icPassportNo ?? null,
          body.address ?? null,
          body.phone ?? null,
        ],
      );
      const result = await client.query(
        `select m.member_id, m.preferred_name, m.age, m.sex, m.height_cm, m.weight_kg,
                m.onboarding_status, m.current_stage, m.profile_confirmed_at,
                to_char(m.date_of_birth, 'YYYY-MM-DD') as date_of_birth, m.ic_passport_no, m.address, m.phone,
                p.full_name
         from app.member_profiles m
         join app.profiles p on p.id = m.member_id
         where m.member_id = $1`,
        [current.userId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/appointment", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      // member_consult is security-definer: it returns the doctor's name (which
      // members can't read from app.profiles directly, per migration 0002) while
      // re-checking that the caller may see this member's consult.
      const result = await client.query(
        `select id, doctor_id, doctor_name, scheduled_at, duration_minutes, meeting_url, status
         from app.member_consult($1)`,
        [memberId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.get("/v1/member/onboarding", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query<{ question_key: string; response: unknown }>(
        "select question_key, response from app.onboarding_responses where member_id = $1",
        [current.userId],
      );
      return { data: Object.fromEntries(result.rows.map((row) => [row.question_key, row.response])) };
    });
  });

  app.put("/v1/member/onboarding", { preHandler: requireRoles("member") }, async (request) => {
    const current = actor(request);
    const body = onboardingEntriesSchema.parse(request.body);
    return withActor(current, async (client) => {
      for (const [questionKey, response] of Object.entries(body.entries)) {
        await client.query(
          `insert into app.onboarding_responses (member_id, question_key, response)
           values ($1, $2, $3::jsonb)
           on conflict (member_id, question_key) do update set response = excluded.response, updated_at = now()`,
          [body.memberId, questionKey, JSON.stringify(response)],
        );
      }
      await client.query(
        "update app.member_profiles set onboarding_status = 'in_progress' where member_id = $1 and onboarding_status = 'not_started'",
        [body.memberId],
      );
      return { ok: true };
    });
  });

  app.post("/v1/member/onboarding/complete", { preHandler: requireRoles("member") }, async (request) => {
    const current = actor(request);
    const body = completeOnboardingSchema.parse(request.body);
    return withActor(current, async (client) => {
      const result = await client.query(
        `update app.member_profiles
         set preferred_name = $2, age = $3, sex = $4, height_cm = $5, weight_kg = $6,
             onboarding_status = 'completed', current_stage = 'consult_upcoming', profile_confirmed_at = now()
         where member_id = $1 and current_stage = 'profile_incomplete' returning member_id`,
        [body.memberId, body.preferredName || null, body.age, body.sex, body.heightCm, body.weightKg],
      );
      return { completed: result.rowCount === 1 };
    });
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/lab-orders", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      const result = await client.query<LabOrderDbRow>(
        `select member_id, biomarker_codes, status, ordered_at, form_released_at, blood_draw_at,
                quote_pricing_version, quote_currency, quote_catalog_count, quote_selected_count,
                quote_base_amount_minor, quote_personalization_discount_minor,
                quote_founding_discount_minor, quote_is_founding_member,
                quote_total_amount_minor, quoted_at
         from app.lab_orders where member_id = $1
         order by (status in ('draft','ordered','collected')) desc, created_at desc limit 1`,
        [memberId],
      );
      return { data: result.rows[0] ? labOrderResponse(result.rows[0]) : null };
    });
  });

  app.put("/v1/member/lab-orders", { preHandler: requireRoles("doctor", "admin") }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string().min(1), codes: z.array(z.string().min(1).max(100)).min(1).max(500) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [body.memberId]);
      const [catalog, member] = await Promise.all([
        client.query<{ id: string }>("select id from app.biomarkers where is_active order by id"),
        client.query<{ is_founding_member: boolean }>(
          "select is_founding_member from app.member_profiles where member_id = $1",
          [body.memberId],
        ),
      ]);
      if (!member.rows[0]) {
        return reply.code(404).send({ error: "Member not found", code: "NOT_FOUND", requestId: request.id });
      }
      const activeCodes = new Set(catalog.rows.map((row) => row.id));
      const { codes: canonicalCodes, invalidCodes } = validateLabOrderCodes(body.codes, activeCodes);
      if (invalidCodes.length > 0) {
        return reply.code(400).send({
          error: "Panel contains unknown or retired biomarkers",
          code: "INVALID_BIOMARKER_CODES",
          invalidCodes,
          requestId: request.id,
        });
      }
      const quote = calculateLabOrderQuote({
        catalogCount: activeCodes.size,
        selectedCount: canonicalCodes.length,
        isFoundingMember: member.rows[0].is_founding_member,
      });
      const latest = await client.query<{ id: string }>(
        `select id from app.lab_orders where member_id = $1
          and status in ('draft','ordered','collected') limit 1 for update`,
        [body.memberId],
      );
      let saved;
      const quoteValues = [
        quote.pricingVersion,
        quote.currency,
        quote.catalogCount,
        quote.selectedCount,
        quote.baseAmountMinor,
        quote.personalizationDiscountMinor,
        quote.foundingDiscountMinor,
        quote.isFoundingMember,
        quote.totalAmountMinor,
      ];
      const returning = `member_id, biomarker_codes, status, ordered_at, form_released_at, blood_draw_at,
        quote_pricing_version, quote_currency, quote_catalog_count, quote_selected_count,
        quote_base_amount_minor, quote_personalization_discount_minor,
        quote_founding_discount_minor, quote_is_founding_member,
        quote_total_amount_minor, quoted_at`;
      if (latest.rows[0]) {
        saved = await client.query<LabOrderDbRow>(
          `update app.lab_orders set biomarker_codes = $2, status = 'ordered', ordered_at = now(), created_by = $3,
             quote_pricing_version = $4, quote_currency = $5, quote_catalog_count = $6,
             quote_selected_count = $7, quote_base_amount_minor = $8,
             quote_personalization_discount_minor = $9, quote_founding_discount_minor = $10,
             quote_is_founding_member = $11, quote_total_amount_minor = $12, quoted_at = now()
           where id = $1 returning ${returning}`,
          [latest.rows[0].id, canonicalCodes, current.userId, ...quoteValues],
        );
      } else {
        saved = await client.query<LabOrderDbRow>(
          `insert into app.lab_orders (
             member_id, biomarker_codes, status, ordered_at, created_by,
             quote_pricing_version, quote_currency, quote_catalog_count, quote_selected_count,
             quote_base_amount_minor, quote_personalization_discount_minor,
             quote_founding_discount_minor, quote_is_founding_member,
             quote_total_amount_minor, quoted_at
           ) values ($1, $2, 'ordered', now(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
           returning ${returning}`,
          [body.memberId, canonicalCodes, current.userId, ...quoteValues],
        );
      }
      // The member does NOT advance to the blood-draw stage here. The doctor's
      // submit only records the ordered panel; an admin later confirms the
      // appointment and payment and releases the request form, which is what
      // flips the stage to blood_form_ready (see admin blood-form/release).
      return { data: labOrderResponse(saved.rows[0]!) };
    });
  });

  // The filled Innoquest request form's data. Members may only fetch it once the
  // admin has released the form; admins (building the pre-release preview) may
  // fetch it at any time by passing memberId.
  app.get<{ Querystring: { memberId?: string } }>("/v1/member/blood-form", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      const payload = await loadBloodFormPayload(client, memberId);
      if (!payload) return { data: null };
      if (current.role !== "admin" && payload.order.formReleasedAt == null) {
        // Not yet released — hide it from the member so the download stays gated.
        return { data: null };
      }
      return { data: payload };
    });
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/lab-reports", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      const reports = await client.query(
        `select r.id, r.lab_name, r.panel_name, r.collected_at, r.released_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', b.id, 'biomarker_code', b.biomarker_code, 'biomarker_name', b.biomarker_name,
             'category', b.category, 'value_numeric', b.value_numeric, 'value_text', b.value_text,
             'unit', b.unit, 'ref_low', b.ref_low, 'ref_high', b.ref_high,
             'optimal_low', b.optimal_low, 'optimal_high', b.optimal_high,
             'status', b.status, 'notes', b.notes
           ) order by b.created_at) filter (where b.id is not null), '[]'::jsonb) as biomarker_results
         from app.lab_reports r left join app.biomarker_results b on b.lab_report_id = r.id
         where r.member_id = $1
           and not exists (
             select 1 from app.lab_reports replacement
              where replacement.supersedes_report_id = r.id and replacement.status = 'released'
           )
         group by r.id order by r.collected_at asc nulls last`,
        [memberId],
      );
      return { data: reports.rows };
    });
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/care-plans", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      const plans = await client.query(
        `select p.id, p.member_id, p.doctor_id, p.title, p.summary, p.status,
                p.version, p.released_at, p.review_date::text as review_date, p.ruleset_version,
          coalesce(jsonb_agg(jsonb_build_object(
            'id', s.id, 'care_plan_id', s.care_plan_id, 'sort_order', s.sort_order,
            'title', s.title, 'summary', s.summary, 'markers', s.markers,
            'doctor_note', s.doctor_note, 'image_key', s.image_key, 'actions', s.actions,
            'template_key', s.template_key, 'basis_type', s.basis_type,
            'evidence_snapshot', s.evidence_snapshot, 'profile_basis', s.profile_basis
          ) order by s.sort_order)
            filter (where s.id is not null and s.section_state = 'active'),
            '[]'::jsonb) as care_plan_sections
         from app.care_plans p left join app.care_plan_sections s on s.care_plan_id = p.id
         where p.member_id = $1 and ($2::boolean or p.status = 'released')
         group by p.id order by p.created_at desc limit 1`,
        [memberId, current.role !== "member"],
      );
      return { data: plans.rows[0] ?? null };
    });
  });

  app.get<{ Params: { planId: string } }>(
    "/v1/member/care-plans/:planId/progress",
    { preHandler: requireRoles("member") },
    async (request) => {
      const current = actor(request);
      return withActor(current, async (client) => {
        const rows = await client.query<{ action_id: string; completed: boolean }>(
          `select action_id, completed
           from app.care_plan_action_progress
           where care_plan_id = $1 and member_id = $2`,
          [request.params.planId, current.userId],
        );
        return {
          data: Object.fromEntries(rows.rows.map((row) => [row.action_id, row.completed])),
        };
      });
    },
  );

  app.put<{ Params: { planId: string; actionId: string } }>(
    "/v1/member/care-plans/:planId/actions/:actionId/progress",
    { preHandler: requireRoles("member") },
    async (request, reply) => {
      const current = actor(request);
      const body = z.object({ completed: z.boolean() }).parse(request.body);
      const saved = await withActor(current, async (client) => {
        const sections = await client.query<{ actions: Array<{ id: string }> }>(
          `select s.actions
           from app.care_plan_sections s
           join app.care_plans p on p.id = s.care_plan_id
           where p.id = $1 and p.member_id = $2 and p.status = 'released'
             and s.section_state = 'active'`,
          [request.params.planId, current.userId],
        );
        const actionExists = sections.rows.some((section) =>
          section.actions.some((item) => item.id === request.params.actionId),
        );
        if (!actionExists) return false;
        await client.query(
          `insert into app.care_plan_action_progress
            (care_plan_id, member_id, action_id, completed)
           values ($1, $2, $3, $4)
           on conflict (care_plan_id, action_id) do update
             set completed = excluded.completed, updated_at = now()`,
          [request.params.planId, current.userId, request.params.actionId, body.completed],
        );
        return true;
      });
      if (!saved) {
        return reply.code(404).send({
          error: "Care-plan action not found",
          code: "NOT_FOUND",
          requestId: request.id,
        });
      }
      return { ok: true };
    },
  );
}
