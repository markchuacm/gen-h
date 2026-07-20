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

  app.get<{ Params: { memberId: string } }>("/v1/doctor/cases/:memberId", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const data = await withActor(current, async (client) => {
      const member = await client.query(
        `select p.full_name as "memberName", p.email as "memberEmail", m.age, m.sex,
                m.current_stage as stage
         from app.profiles p left join app.member_profiles m on m.member_id = p.id where p.id = $1`,
        [request.params.memberId],
      );
      if (!member.rows[0]) return null;
      const [responses, docs, results, appointment, labOrder, carePlan] = await Promise.all([
        client.query<{ question_key: string; response: unknown }>(
          "select question_key, response from app.onboarding_responses where member_id = $1",
          [request.params.memberId],
        ),
        client.query(
          `select id, file_name, object_key as storage_path, doc_type
           from app.health_documents where member_id = $1 and scan_status = 'clean' order by created_at desc`,
          [request.params.memberId],
        ),
        client.query(
          `select count(distinct r.id)::int as "releasedReportCount",
                  count(distinct b.biomarker_code) filter
                    (where b.value_numeric is not null or nullif(b.value_text, '') is not null)::int as "measuredMarkerCount"
             from app.lab_reports r
             left join app.biomarker_results b on b.lab_report_id = r.id
            where r.member_id = $1 and r.status = 'released'
              and not exists (
                select 1 from app.lab_reports replacement
                 where replacement.supersedes_report_id = r.id and replacement.status = 'released'
              )`,
          [request.params.memberId],
        ),
        client.query(
          `select scheduled_at, meeting_url from app.appointments
           where member_id = $1 and status = 'scheduled' limit 1`,
          [request.params.memberId],
        ),
        client.query(
          `select id, status, ordered_at as "orderedAt", cardinality(biomarker_codes)::int as "markerCount"
             from app.lab_orders where member_id = $1
            order by (status in ('draft','ordered','collected')) desc, created_at desc limit 1`,
          [request.params.memberId],
        ),
        client.query(
          `select id, status, updated_at as "updatedAt", released_at as "releasedAt", version
             from app.care_plans where member_id = $1
            order by (status = 'draft') desc, created_at desc limit 1`,
          [request.params.memberId],
        ),
      ]);
      const onboarding = Object.fromEntries(responses.rows.map((row) => [row.question_key, row.response]));
      const basics = onboarding.basics && typeof onboarding.basics === "object" && !Array.isArray(onboarding.basics)
        ? onboarding.basics as Record<string, unknown>
        : {};
      return {
          ...member.rows[0],
          age: typeof basics.age === "number" ? basics.age : member.rows[0].age,
          sex: typeof basics.sex === "string" ? basics.sex : member.rows[0].sex,
          onboarding,
          documents: docs.rows,
          hasResults: Number(results.rows[0]?.releasedReportCount ?? 0) > 0,
          results: results.rows[0] ?? { releasedReportCount: 0, measuredMarkerCount: 0 },
          labOrder: labOrder.rows[0] ?? null,
          carePlan: carePlan.rows[0] ?? null,
          appointment: appointment.rows[0] ?? null,
      };
    });
    if (!data) {
      return reply.code(404).send({ error: "Case not found", code: "NOT_FOUND", requestId: request.id });
    }
    return { data };
  });

  app.get<{ Params: { memberId: string } }>("/v1/doctor/care-plans/:memberId", { preHandler: doctorOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id, p.title, p.summary, p.status, p.version,
          coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order) filter (where s.id is not null), '[]'::jsonb) as care_plan_sections
         from app.care_plans p left join app.care_plan_sections s on s.care_plan_id = p.id
         where p.member_id = $1 group by p.id
         order by (p.status = 'draft') desc, p.created_at desc limit 1`,
        [request.params.memberId],
      );
      return { data: result.rows[0] ?? null };
    });
  });

  app.post("/v1/doctor/care-plans", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string().min(1), title: z.string().min(1).max(250) }).parse(request.body);
    const row = await withActor(current, async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`care-plan:${body.memberId}`]);
      const existing = await client.query<{ id: string }>(
        "select id from app.care_plans where member_id = $1 and status = 'draft' for update",
        [body.memberId],
      );
      if (existing.rows[0]) return { ...existing.rows[0], created: false };
      const nextVersion = await client.query<{ version: number }>(
        "select coalesce(max(version), 0)::int + 1 as version from app.care_plans where member_id = $1",
        [body.memberId],
      );
      const result = await client.query(
        `insert into app.care_plans (member_id, doctor_id, title, status, version)
         values ($1, $2, $3, 'draft', $4) returning id`,
        [body.memberId, current.userId, body.title, nextVersion.rows[0]?.version ?? 1],
      );
      return { ...result.rows[0], created: true };
    });
    return reply.code(row.created ? 201 : 200).send({ data: { id: row.id } });
  });

  app.post<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId/versions", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const result = await withActor(current, async (client) => {
      const source = await client.query<{ member_id: string; status: string }>(
        "select member_id, status from app.care_plans where id = $1 for share",
        [request.params.planId],
      );
      if (!source.rows[0]) return { kind: "not_found" as const };
      if (source.rows[0].status !== "released") return { kind: "invalid" as const };
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`care-plan:${source.rows[0].member_id}`]);
      const existing = await client.query<{ id: string }>(
        "select id from app.care_plans where member_id = $1 and status = 'draft' for update",
        [source.rows[0].member_id],
      );
      if (existing.rows[0]) return { kind: "ok" as const, id: existing.rows[0].id, created: false };
      const created = await client.query<{ id: string }>(
        `insert into app.care_plans
          (member_id, doctor_id, title, summary, status, version, supersedes_plan_id)
         select source.member_id, $2, source.title, source.summary, 'draft',
                (select coalesce(max(version), 0) + 1 from app.care_plans where member_id = source.member_id),
                source.id
           from app.care_plans source where source.id = $1 returning id`,
        [request.params.planId, current.userId],
      );
      const versionId = created.rows[0]!.id;
      await client.query(
        `insert into app.care_plan_sections
          (care_plan_id, sort_order, title, summary, markers, doctor_note, image_key, actions)
         select $2, sort_order, title, summary, markers, doctor_note, image_key, actions
           from app.care_plan_sections where care_plan_id = $1 order by sort_order`,
        [request.params.planId, versionId],
      );
      return { kind: "ok" as const, id: versionId, created: true };
    });
    if (result.kind === "not_found") return reply.code(404).send({ error: "Care plan not found", code: "NOT_FOUND", requestId: request.id });
    if (result.kind === "invalid") return reply.code(409).send({ error: "Only released care plans can be versioned", code: "INVALID_STATE", requestId: request.id });
    return reply.code(result.created ? 201 : 200).send({ data: { id: result.id } });
  });

  app.put<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId/sections", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ sections: z.array(planSectionSchema).max(50) }).parse(request.body);
    const saved = await withActor(current, async (client) => {
      const editable = await client.query("select 1 from app.care_plans where id = $1 and status = 'draft' for update", [request.params.planId]);
      if (!editable.rows[0]) return false;
      await client.query("delete from app.care_plan_sections where care_plan_id = $1", [request.params.planId]);
      for (const section of body.sections) {
        await client.query(
          `insert into app.care_plan_sections
            (care_plan_id, sort_order, title, summary, markers, doctor_note, image_key, actions)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [request.params.planId, section.sort_order, section.title, section.summary, section.markers, section.doctor_note, section.image_key, JSON.stringify(section.actions)],
        );
      }
      return true;
    });
    if (!saved) return reply.code(409).send({ error: "Released care plans are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return { ok: true };
  });

  app.patch<{ Params: { planId: string } }>("/v1/doctor/care-plans/:planId", { preHandler: doctorOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ title: z.string().max(250).optional(), summary: z.string().max(8000).optional() }).parse(request.body);
    const updated = await withActor(current, async (client) => {
      const result = await client.query(
        "update app.care_plans set title = coalesce($2, title), summary = coalesce($3, summary) where id = $1 and status = 'draft' returning id",
        [request.params.planId, body.title ?? null, body.summary ?? null],
      );
      return result.rowCount === 1;
    });
    if (!updated) return reply.code(409).send({ error: "Released care plans are immutable", code: "RELEASED_IMMUTABLE", requestId: request.id });
    return { ok: true };
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
        await client.query(
          `update app.care_plans previous set status = 'archived'
            from app.care_plans replacement
           where replacement.id = $1 and previous.id = replacement.supersedes_plan_id
             and previous.status = 'released'`,
          [request.params.planId],
        );
        await client.query("update app.member_profiles set current_stage = 'care_plan_ready' where member_id = $1", [released.rows[0].member_id]);
      }
      return { released: released.rowCount === 1 };
    });
  });
}
