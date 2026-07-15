-- The document scanner must read pending document metadata before it can
-- retrieve, inspect, and update the object.
create policy worker_documents_select on app.health_documents
for select to verae_worker using (true);
