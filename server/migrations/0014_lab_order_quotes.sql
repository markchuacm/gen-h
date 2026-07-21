-- Persist the latest member-facing blood-panel quote alongside the active
-- lab order. Quote amounts are integer MYR minor units so arithmetic remains
-- exact and a later payment integration can consume them without conversion.

alter table app.member_profiles
  add column if not exists is_founding_member boolean not null default true;

alter table app.lab_orders
  add column if not exists quote_pricing_version integer,
  add column if not exists quote_currency text,
  add column if not exists quote_catalog_count integer,
  add column if not exists quote_selected_count integer,
  add column if not exists quote_base_amount_minor integer,
  add column if not exists quote_personalization_discount_minor integer,
  add column if not exists quote_founding_discount_minor integer,
  add column if not exists quote_is_founding_member boolean,
  add column if not exists quote_total_amount_minor integer,
  add column if not exists quoted_at timestamptz;

alter table app.lab_orders
  add constraint lab_orders_quote_all_or_none check (
    (quoted_at is null and quote_pricing_version is null and quote_currency is null
      and quote_catalog_count is null and quote_selected_count is null
      and quote_base_amount_minor is null and quote_personalization_discount_minor is null
      and quote_founding_discount_minor is null and quote_is_founding_member is null
      and quote_total_amount_minor is null)
    or
    (quoted_at is not null and quote_pricing_version is not null and quote_currency is not null
      and quote_catalog_count is not null and quote_selected_count is not null
      and quote_base_amount_minor is not null and quote_personalization_discount_minor is not null
      and quote_founding_discount_minor is not null and quote_is_founding_member is not null
      and quote_total_amount_minor is not null)
  ),
  add constraint lab_orders_quote_values check (
    quoted_at is null or (
      quote_pricing_version > 0
      and quote_currency = 'MYR'
      and quote_catalog_count > 0
      and quote_selected_count > 0
      and quote_selected_count <= quote_catalog_count
      and quote_base_amount_minor >= 0
      and quote_personalization_discount_minor >= 0
      and quote_founding_discount_minor >= 0
      and quote_total_amount_minor >= 0
      and quote_total_amount_minor = quote_base_amount_minor
        - quote_personalization_discount_minor
        - quote_founding_discount_minor
    )
  );
