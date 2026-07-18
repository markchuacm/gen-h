-- The document scanner must read pending document metadata before it can
-- retrieve, inspect, and update the object.
--
-- The baseline schema (0001) already defines this policy, so guard the
-- creation to keep this migration idempotent on fresh databases where 0001
-- has already created it.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'app'
      and tablename = 'health_documents'
      and policyname = 'worker_documents_select'
  ) then
    create policy worker_documents_select on app.health_documents
    for select to verae_worker using (true);
  end if;
end $$;
