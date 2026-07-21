import type { FastifyInstance } from "fastify";
import { actor, requireActor } from "../auth/guards.js";
import { withActor } from "../db/pools.js";

// The biomarker catalog: reference data with no PHI, identical for every actor.
// Members, doctors and admins all read the same active-only payload — an admin
// viewing a case renders the member's dashboard, so they must see what the
// member sees. The admin console's own catalog management (which needs retired
// markers too) lives on /v1/admin/catalog/* instead.

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/catalog/biomarkers", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      // `is_active` is filtered here as well as in RLS: an admin's session can
      // see retired rows, and this endpoint must not hand them to the dashboard.
      const categories = await client.query(
        `select id, name, description, display_order
         from app.biomarker_categories
         where is_active
         order by display_order`,
      );

      const biomarkers = await client.query(
        `select b.id, b.name, b.display_name, b.aliases, b.description,
                b.what_it_measures, b.why_it_matters, b.unit,
                b.scoring_mode, b.context_requirements,
                b.optimal_range_label, b.suboptimal_range_label, b.out_of_range_label,
                b.lower_optimal, b.upper_optimal, b.lower_reference, b.upper_reference,
                b.directionality,
                coalesce(
                  array_agg(c.name order by m.is_primary desc, c.display_order)
                    filter (where c.name is not null),
                  '{}'
                ) as categories
         from app.biomarkers b
         left join app.biomarker_category_members m on m.biomarker_id = b.id
         left join app.biomarker_categories c on c.id = m.category_id and c.is_active
         where b.is_active
         group by b.id
         order by b.display_name`,
      );

      // The dashboard needs to know which codes are deliberately retired so a
      // stale result row is dropped rather than falling through to the
      // "Other results" bucket for unrecognised lab codes. Retired rows are
      // invisible to non-admins under RLS, hence the security-definer function.
      const retired = await client.query<{ codes: string[] }>(
        "select app.retired_biomarker_codes() as codes",
      );

      // Not awaited: FastifyReply is thenable and only settles once the
      // response is sent, so awaiting it here deadlocks the handler.
      reply.header("cache-control", "private, max-age=300");
      return {
        data: {
          categories: categories.rows,
          biomarkers: biomarkers.rows,
          retiredCodes: retired.rows[0]?.codes ?? [],
        },
      };
    });
  });
}
