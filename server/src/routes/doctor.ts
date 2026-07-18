import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { actor, requireRoles } from "../auth/guards.js";
import { withActor } from "../db/pools.js";

const planSectionSchema = z.object({
  id: z.string().optional(),
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

export async function doctorRoutes(app: FastifyInstance): Promise<void> {
  const doctorOnly = requireRoles("doctor", "admin");

  app.get("/v1/doctor/cases", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select a.id as "assignmentId", a.member_id as "memberId", p.full_name as "memberName",
                p.email as "memberEmail", m.current_stage as stage, m.onboarding_status as "onboardingStatus"
         from app.doctor_assignments a
         join app.profiles p on p.id = a.member_id
         left join app.member_profiles m on m.member_id = a.member_id
         where a.doctor_id = $1 and a.status = 'active' order by p.full_name nulls last`,
        [current.userId],
      );
      return { data: result.rows };
    });
  });

  app.get("/v1/doctor/appointments", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select a.id, a.member_id as "memberId", p.full_name as "memberName",
                a.scheduled_at as "scheduledAt", a.duration_minutes as "durationMinutes",
                a.meeting_url as "meetingUrl"
         from app.appointments a join app.profiles p on p.id = a.member_id
         where a.doctor_id = $1 and a.status = 'scheduled'
           and a.scheduled_at > now() - interval '1 hour'
         order by a.scheduled_at asc`,
        [current.userId],
      );
      return { data: result.rows };
    });
  });

  app.get<{ Params: { memberId: string } }>("/v1/doctor/cases/:memberId", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const member = await client.query(
        `select p.full_name as "memberName", p.email as "memberEmail", m.age, m.sex,
                m.current_stage as stage
         from app.profiles p left join app.member_profiles m on m.member_id = p.id where p.id = $1`,
        [request.params.memberId],
      );
      if (!member.rows[0]) return { data: null };
      const [responses, docs, results, appointment] = await Promise.all([
        client.query<{ question_key: string; response: unknown }>(
          "select question_key, response from app.onboarding_responses where member_id = $1",
          [request.params.memberId],
        ),
        client.query(
          `select id, file_name, object_key as storage_path, doc_type
           from app.health_documents where member_id = $1 and scan_status = 'clean' order by created_at desc`,
          [request.params.memberId],
        ),
        client.query("select 1 from app.biomarker_results where member_id = $1 limit 1", [request.params.memberId]),
        client.query(
          `select scheduled_at, meeting_url from app.appointments
           where member_id = $1 and status = 'scheduled' limit 1`,
          [request.params.memberId],
        ),
      ]);
      const onboarding = Object.fromEntries(responses.rows.map((row) => [row.question_key, row.response]));
      const basics = onboarding.basics && typeof onboarding.basics === "object" && !Array.isArray(onboarding.basics)
        ? onboarding.basics as Record<string, unknown>
        : {};
      return {
        data: {
          ...member.rows[0],
          age: typeof basics.age === "number" ? basics.age : member.rows[0].age,
          sex: typeof basics.sex === "string" ? basics.sex : member.rows[0].sex,
          onboarding,
          documents: docs.rows,
          hasResults: results.rowCount === 1,
          appointment: appointment.rows[0] ?? null,
        },
      };
    });
  });

  app.get<{ Params: { memberId: string } }>("/v1/doctor/care-plans/:memberId", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id, p.title, p.summary, p.status,
          coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order) filter (where s.id is not null), '[]'::jsonb) as care_plan_sections
         from app.care_plans p left join app.care_plan_sections s on s.care_plan_id = p.id
         where p.member_id = $1 group by p.id order by p.created_at desc limit 1`,
        [request.params.memberId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.post("/v1/doctor/care-plans", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string().min(1), title: z.string().min(1).max(250) }).parse(request.body);
    const row = await withActor(current, async (client) => {
      const result = await client.query(
        `insert into app.care_plans (member_id, doctor_id, title, status)
         values ($1, $2, $3, 'draft') returning id`,
        [body.memberId, current.userId, body.title],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: row });
  });

  app.put<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId/sections", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ sections: z.array(planSectionSchema).max(50) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("delete from app.care_plan_sections where care_plan_id = $1", [request.params.planId]);
      for (const section of body.sections) {
        await client.query(
          `insert into app.care_plan_sections
            (care_plan_id, sort_order, title, summary, markers, doctor_note, image_key, actions)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [request.params.planId, section.sort_order, section.title, section.summary, section.markers, section.doctor_note, section.image_key, JSON.stringify(section.actions)],
        );
      }
      return { ok: true };
    });
  });

  app.patch<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ title: z.string().max(250).optional(), summary: z.string().max(8000).optional() }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        "update app.care_plans set title = coalesce($2, title), summary = coalesce($3, summary) where id = $1",
        [request.params.planId, body.title ?? null, body.summary ?? null],
      );
      return { ok: true };
    });
  });

  app.post<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId/release", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const released = await client.query<{ member_id: string }>(
        `update app.care_plans set status = 'released', released_at = now()
         where id = $1 and status = 'draft' returning member_id`,
        [request.params.planId],
      );
      if (released.rows[0]) {
        await client.query("update app.member_profiles set current_stage = 'care_plan_ready' where member_id = $1", [released.rows[0].member_id]);
      }
      return { released: released.rowCount === 1 };
    });
  });
}
