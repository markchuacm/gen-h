import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { actor, requireActor, requireRoles } from "../auth/guards.js";
import { authPool } from "../auth/auth.js";
import { withActor } from "../db/pools.js";
import { isInviteExpired } from "../services/invites.js";

const onboardingEntriesSchema = z.object({
  memberId: z.string().min(1),
  entries: z.record(z.string().min(1).max(100), z.unknown()),
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
                p.setup_completed_at, p.password_set_at, p.email_verified_at, p.temp_password_expires_at
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
          avatar_url: profile.avatar_url,
          account_status: profile.account_status,
          email_verified: current.emailVerified,
          two_factor_enabled: current.twoFactorEnabled,
          setup,
        },
      };
    });
  });

  app.get<{ Params: { id: string } }>("/v1/profiles/:id/public", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        "select id, full_name, avatar_url from app.profiles where id = $1",
        [request.params.id],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.get<{ Querystring: { memberId?: string } }>("/v1/member/profile", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    const memberId = request.query.memberId ?? current.userId;
    return withActor(current, async (client) => {
      const result = await client.query(
        `select member_id, preferred_name, age, sex, height_cm, weight_kg,
                onboarding_status, current_stage, profile_confirmed_at
         from app.member_profiles where member_id = $1`,
        [memberId],
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
      const result = await client.query(
        `select member_id, biomarker_codes, case when status = 'draft' then 'draft' else 'ordered' end as status, ordered_at
         from app.lab_orders where member_id = $1 order by created_at desc limit 1`,
        [memberId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.put("/v1/member/lab-orders", { preHandler: requireRoles("doctor", "admin") }, async (request) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string().min(1), codes: z.array(z.string().min(1).max(100)).max(500) }).parse(request.body);
    return withActor(current, async (client) => {
      const latest = await client.query<{ id: string }>(
        "select id from app.lab_orders where member_id = $1 order by created_at desc limit 1 for update",
        [body.memberId],
      );
      if (latest.rows[0]) {
        await client.query(
          "update app.lab_orders set biomarker_codes = $2, status = 'ordered', ordered_at = now(), created_by = $3 where id = $1",
          [latest.rows[0].id, body.codes, current.userId],
        );
      } else {
        await client.query(
          `insert into app.lab_orders (member_id, biomarker_codes, status, ordered_at, created_by)
           values ($1, $2, 'ordered', now(), $3)`,
          [body.memberId, body.codes, current.userId],
        );
      }
      await client.query(
        `update app.member_profiles set current_stage = 'blood_form_ready'
         where member_id = $1 and current_stage = 'consult_upcoming'`,
        [body.memberId],
      );
      return { ok: true };
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
         where r.member_id = $1 group by r.id order by r.collected_at asc nulls last`,
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
        `select p.id, p.member_id, p.doctor_id, p.title, p.summary, p.status, p.released_at,
          coalesce(jsonb_agg(jsonb_build_object(
            'id', s.id, 'care_plan_id', s.care_plan_id, 'sort_order', s.sort_order,
            'title', s.title, 'summary', s.summary, 'markers', s.markers,
            'doctor_note', s.doctor_note, 'image_key', s.image_key, 'actions', s.actions
          ) order by s.sort_order) filter (where s.id is not null), '[]'::jsonb) as care_plan_sections
         from app.care_plans p left join app.care_plan_sections s on s.care_plan_id = p.id
         where p.member_id = $1 group by p.id order by p.created_at desc limit 1`,
        [memberId],
      );
      return { data: plans.rows[0] ?? null };
    });
  });
}
