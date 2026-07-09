-- Migration 009 — lab orders (blood panels). At the first consult the doctor
-- prescribes which biomarkers to test for a member. One row per member holds
-- the current panel; saving it advances the member into the blood-draw stage.
-- The codes are catalog ids (see biomarkerData.ts) — the same codes results
-- come back under, which lets the results page show only the ordered markers.

create table public.lab_orders (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.profiles (id) on delete cascade,
  doctor_id       uuid not null references public.profiles (id),
  biomarker_codes text[] not null default '{}',
  status          text not null default 'draft' check (status in ('draft', 'ordered')),
  ordered_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (member_id)
);

create index lab_orders_member_id_idx on public.lab_orders (member_id);

create trigger set_updated_at
  before update on public.lab_orders
  for each row execute function private.set_updated_at();

alter table public.lab_orders enable row level security;

-- Member reads their own panel; assigned doctor reads it too. Writes go only
-- through save_lab_order (security definer) so the stage advance is atomic.
create policy "lab_orders_select_member"
  on public.lab_orders for select
  to authenticated
  using (member_id = auth.uid());

create policy "lab_orders_select_doctor"
  on public.lab_orders for select
  to authenticated
  using (private.is_doctor_of(member_id));

grant select on public.lab_orders to authenticated;

-- ---------------------------------------------------------------------------
-- Save RPC: the only write path. Verifies the caller is the member's assigned
-- doctor, upserts the panel as 'ordered', and advances the journey
-- (consult_upcoming → blood_form_ready) without rewinding a later stage.
-- ---------------------------------------------------------------------------
create or replace function public.save_lab_order(p_member_id uuid, p_codes text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_doctor_of(p_member_id) then
    raise exception 'not authorized to order a panel for this member';
  end if;

  insert into public.lab_orders (member_id, doctor_id, biomarker_codes, status, ordered_at)
  values (p_member_id, auth.uid(), p_codes, 'ordered', now())
  on conflict (member_id) do update
    set biomarker_codes = excluded.biomarker_codes,
        doctor_id       = excluded.doctor_id,
        status          = 'ordered',
        ordered_at      = now();

  update public.member_profiles
     set current_stage = 'blood_form_ready'
   where member_id = p_member_id
     and current_stage = 'consult_upcoming';
end;
$$;

revoke execute on function public.save_lab_order(uuid, text[]) from public, anon;
grant execute on function public.save_lab_order(uuid, text[]) to authenticated;
