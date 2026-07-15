import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { actor, requireRoles } from "../auth/guards.js";
import { withActor } from "../db/pools.js";

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

const reportFieldsSchema = z.object({
  lab_name: z.string().max(250).nullable(),
  panel_name: z.string().max(250).nullable(),
  collected_at: z.iso.datetime().nullable(),
  document_id: z.string().uuid().nullable(),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = requireRoles("admin");

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
                m.onboarding_status as "onboardingStatus"
         from app.profiles p left join app.member_profiles m on m.member_id = p.id where p.id = $1`,
        [request.params.memberId],
      );
      if (!base.rows[0]) return { data: null };
      const [responses, docs, assignment, plan] = await Promise.all([
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
      ]);
      return {
        data: {
          ...base.rows[0],
          onboarding: Object.fromEntries(responses.rows.map((row) => [row.question_key, row.response])),
          documents: docs.rows,
          doctorId: assignment.rows[0]?.doctorId ?? null,
          doctorName: assignment.rows[0]?.doctorName ?? null,
          carePlan: plan.rows[0] ?? null,
        },
      };
    });
  });

  app.get<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/reports", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select r.id, r.lab_name, r.panel_name, r.collected_at, r.document_id,
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
        `insert into app.lab_reports
          (member_id, lab_name, panel_name, collected_at, document_id, status, source_status, created_by)
         values ($1, $2, $3, $4, $5, 'draft', 'final', $6) returning id`,
        [request.params.memberId, body.lab_name, body.panel_name, body.collected_at, body.document_id, current.userId],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: row });
  });

  app.patch<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = reportFieldsSchema.partial().parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        `update app.lab_reports set
          lab_name = coalesce($2, lab_name), panel_name = coalesce($3, panel_name),
          collected_at = coalesce($4, collected_at), document_id = coalesce($5, document_id)
         where id = $1`,
        [request.params.reportId, body.lab_name ?? null, body.panel_name ?? null, body.collected_at ?? null, body.document_id ?? null],
      );
      return { ok: true };
    });
  });

  app.delete<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    await withActor(current, (client) => client.query("delete from app.lab_reports where id = $1", [request.params.reportId]));
    return reply.code(204).send();
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
         values ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14,$15) returning id`,
        [request.params.reportId, body.memberId, row.biomarker_code, row.biomarker_name, row.category,
          row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
          row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: created });
  });

  app.post<{ Params: { reportId: string } }>("/v1/admin/reports/:reportId/biomarkers/bulk", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    const body = z.object({ memberId: z.string(), rows: z.array(biomarkerSchema).max(1000) }).parse(request.body);
    const inserted = await withActor(current, async (client) => {
      let count = 0;
      for (const row of body.rows) {
        await client.query(
          `insert into app.biomarker_results
            (lab_report_id, member_id, source_code, biomarker_code, biomarker_name, category,
             source_value, value_numeric, value_text, source_unit, unit, ref_low, ref_high,
             optimal_low, optimal_high, status, notes)
           values ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14,$15)`,
          [request.params.reportId, body.memberId, row.biomarker_code, row.biomarker_name, row.category,
            row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
            row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
        );
        count += 1;
      }
      return count;
    });
    return reply.code(201).send({ inserted });
  });

  app.put<{ Params: { biomarkerId: string } }>("/v1/admin/biomarkers/:biomarkerId", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const row = biomarkerSchema.parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        `update app.biomarker_results set biomarker_code=$2, biomarker_name=$3, category=$4,
          source_value=$5, value_numeric=$6, value_text=$7, source_unit=$8, unit=$8,
          ref_low=$9, ref_high=$10, optimal_low=$11, optimal_high=$12, status=$13, notes=$14 where id=$1`,
        [request.params.biomarkerId, row.biomarker_code, row.biomarker_name, row.category,
          row.value_numeric?.toString() ?? row.value_text ?? "", row.value_numeric, row.value_text, row.unit,
          row.ref_low, row.ref_high, row.optimal_low, row.optimal_high, row.status, row.notes],
      );
      return { ok: true };
    });
  });

  app.delete<{ Params: { biomarkerId: string } }>("/v1/admin/biomarkers/:biomarkerId", { preHandler: adminOnly }, async (request, reply) => {
    const current = actor(request);
    await withActor(current, (client) => client.query("delete from app.biomarker_results where id = $1", [request.params.biomarkerId]));
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

  app.get("/v1/admin/doctors", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select p.id as "doctorId", p.full_name as "fullName", p.email,
                p.doctor_active as "isActive", count(a.id)::int as "assignedCount"
         from app.profiles p left join app.doctor_assignments a on a.doctor_id=p.id and a.status='active'
         where p.role='doctor' group by p.id order by p.full_name nulls last`,
      );
      return { data: result.rows };
    });
  });

  app.get("/v1/admin/users/promotable", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query("select id, email, full_name from app.profiles where role='member' order by email");
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
    const body = z.object({ role: z.enum(["member", "doctor"]).optional(), doctorActive: z.boolean().optional(), accountStatus: z.enum(["pending", "active", "suspended"]).optional() }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query(
        `update app.profiles set role=coalesce($2,role), doctor_active=coalesce($3,doctor_active),
          account_status=coalesce($4,account_status) where id=$1`,
        [request.params.userId, body.role ?? null, body.doctorActive ?? null, body.accountStatus ?? null],
      );
      return { ok: true };
    });
  });

  app.patch<{ Params: { memberId: string } }>("/v1/admin/members/:memberId/stage", { preHandler: adminOnly }, async (request) => {
    const current = actor(request);
    const body = z.object({ stage: z.enum(["profile_incomplete", "consult_upcoming", "blood_form_ready", "results_pending", "results_ready", "care_plan_ready"]) }).parse(request.body);
    return withActor(current, async (client) => {
      await client.query("update app.member_profiles set current_stage=$2 where member_id=$1", [request.params.memberId, body.stage]);
      return { ok: true };
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
