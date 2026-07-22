-- Step 1: Create the bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-documents',
  'patient-documents',
  false,
  10485760,  -- 10MB limit
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Step 2: Drop old policies if re-running
drop policy if exists "Patients can upload own documents" on storage.objects;
drop policy if exists "Patients can read own documents" on storage.objects;
drop policy if exists "Patients can delete own documents" on storage.objects;
drop policy if exists "Service role can read patient documents" on storage.objects;

-- Step 3: Create policies
create policy "Patients can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Patients can read own documents"
  on storage.objects for select
  using (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Patients can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'patient-documents' and auth.uid()::text = (storage.foldername(name))[1]);
