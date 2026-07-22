-- Patient Documents bucket (for Share Records uploads)
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict do nothing;

-- Drop old policies if re-running
drop policy if exists "Patients can upload own documents" on storage.objects;
drop policy if exists "Patients can read own documents" on storage.objects;
drop policy if exists "Patients can delete own documents" on storage.objects;
drop policy if exists "Service role can read patient documents" on storage.objects;

-- Patient can upload to their own folder
create policy "Patients can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Patient can read own documents
create policy "Patients can read own documents"
  on storage.objects for select
  using (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Patient can delete own documents
create policy "Patients can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Service role can read all (for QR share view API)
create policy "Service role can read patient documents"
  on storage.objects for select
  using (bucket_id = 'patient-documents' and auth.role() = 'service_role');
