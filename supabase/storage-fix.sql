-- ============================================================
-- MedSeva — Make medical-reports bucket public
-- so uploaded file URLs work directly in the browser
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

update storage.buckets
set public = true
where id = 'medical-reports';

-- Allow authenticated users to upload to their own folder
drop policy if exists "Patients can upload own reports" on storage.objects;
create policy "Patients can upload own reports"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medical-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read (since bucket is public)
drop policy if exists "Patients can read own reports" on storage.objects;
drop policy if exists "Anyone can read medical reports" on storage.objects;
create policy "Anyone can read medical reports"
  on storage.objects for select
  using (bucket_id = 'medical-reports');

-- Allow owners to delete their own files
drop policy if exists "Patients can delete own reports" on storage.objects;
create policy "Patients can delete own reports"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medical-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
