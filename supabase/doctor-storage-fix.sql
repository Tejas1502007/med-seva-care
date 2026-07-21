-- ============================================================
-- MedSeva — Create doctor storage buckets + RLS policies
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create the buckets used by the doctor profile form
insert into storage.buckets (id, name, public)
values
  ('doctor-documents', 'doctor-documents', true),
  ('doctor-avatars',   'doctor-avatars',   true)
on conflict do nothing;

-- ── doctor-documents (license, degree, gov ID) ───────────────

drop policy if exists "Doctors can upload own documents" on storage.objects;
create policy "Doctors can upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Doctors can update own documents" on storage.objects;
create policy "Doctors can update own documents"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can read doctor documents" on storage.objects;
create policy "Anyone can read doctor documents"
  on storage.objects for select
  using (bucket_id = 'doctor-documents');

-- ── doctor-avatars ────────────────────────────────────────────

drop policy if exists "Doctors can upload own avatar" on storage.objects;
create policy "Doctors can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Doctors can update own avatar" on storage.objects;
create policy "Doctors can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can read doctor avatars" on storage.objects;
create policy "Anyone can read doctor avatars"
  on storage.objects for select
  using (bucket_id = 'doctor-avatars');
