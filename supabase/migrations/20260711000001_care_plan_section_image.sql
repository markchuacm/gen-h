-- Doctors can pick the member-facing image for each focus area. The key
-- resolves to a bundled asset on the frontend (carePlanAssets.ts); null keeps
-- the existing order-cycled fallback.
alter table public.care_plan_sections
  add column if not exists image_key text;
