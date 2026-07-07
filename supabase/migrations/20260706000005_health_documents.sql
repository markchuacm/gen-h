-- Migration 005 — health documents: private storage bucket + metadata table.
-- Doctor-visibility policies arrive with doctor_assignments (next migration).

-- ---------------------------------------------------------------------------
-- Bucket: private, 10MB cap, six allowed types (PDF/JPG/PNG/CSV/DOC/DOCX).
-- Enforced server-side regardless of client validation.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'health-documents',
  'health-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- health_documents: one row per uploaded file; the row is the source of truth
-- for listing (an orphaned storage object from a failed insert is acceptable).
-- ---------------------------------------------------------------------------
create table public.health_documents (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  doc_type     text, -- upload category: health_screening | genetic_tests | other_tests
  uploaded_by  uuid not null references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index health_documents_member_id_idx on public.health_documents (member_id);

create trigger set_updated_at
  before update on public.health_documents
  for each row execute function private.set_updated_at();

alter table public.health_documents enable row level security;

create policy "health_documents_select_own"
  on public.health_documents for select
  to authenticated
  using (member_id = auth.uid());

create policy "health_documents_insert_own"
  on public.health_documents for insert
  to authenticated
  with check (member_id = auth.uid() and uploaded_by = auth.uid());

-- The profile flow lets members remove a report they just uploaded.
create policy "health_documents_delete_own"
  on public.health_documents for delete
  to authenticated
  using (member_id = auth.uid());

grant select, insert, delete on public.health_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Storage policies. Path convention is load-bearing: {member_id}/{uuid}.{ext},
-- first folder = owner. Every policy is scoped to this bucket so future
-- buckets never inherit access.
-- (If this section fails with "must be owner of table objects", create these
-- four policies verbatim in Dashboard → Storage → Policies instead.)
-- ---------------------------------------------------------------------------
create policy "health_documents_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'health-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "health_documents_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'health-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "health_documents_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'health-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
