-- ============================================================
-- MedSeva — Onboarding Fix
-- Run this in: Supabase Dashboard → SQL Editor
--
-- ALSO DO THIS in the dashboard:
--   Authentication → Providers → Email
--   Turn OFF "Confirm email" toggle
--   (This lets the session be active immediately after signup)
-- ============================================================

-- Drop old trigger and function, replace with one that also
-- creates the role-specific profile row automatically on signup.
-- This runs as SECURITY DEFINER so it bypasses RLS entirely.

drop trigger if exists trg_on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  user_role;
begin
  -- Pull role from signup metadata, default to 'patient'
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'patient'
  );

  -- 1. Insert base profile
  insert into public.profiles (id, role, email, full_name, avatar_url)
  values (
    new.id,
    v_role,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- 2. Create the role-specific stub row so RLS upserts work later
  if v_role = 'patient' then
    insert into public.patient_profiles (id)
    values (new.id)
    on conflict (id) do nothing;

  elsif v_role = 'doctor' then
    -- registration_number and qualification are NOT NULL so we use temp placeholders
    -- The onboarding flow will upsert real values in the next steps
    insert into public.doctor_profiles (id, registration_number, qualification, specialization)
    values (new.id, 'PENDING-' || substr(new.id::text, 1, 8), 'PENDING', 'PENDING')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Also grant the anon/authenticated roles permission to upsert
-- their OWN rows even before email is confirmed.
-- Supabase issues a JWT with the user id even for unconfirmed users
-- so auth.uid() works — we just need to be sure the policy allows it.
-- ============================================================

-- Drop and recreate insert policies to be explicit
drop policy if exists "Patients can insert own patient profile" on public.patient_profiles;
drop policy if exists "Doctors can insert own doctor profile"   on public.doctor_profiles;

create policy "Patients can insert own patient profile"
  on public.patient_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Doctors can insert own doctor profile"
  on public.doctor_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow upsert (update) too
drop policy if exists "Patients can update own patient profile" on public.patient_profiles;
drop policy if exists "Doctors can update own doctor profile"   on public.doctor_profiles;

create policy "Patients can update own patient profile"
  on public.patient_profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Doctors can update own doctor profile"
  on public.doctor_profiles for update
  to authenticated
  using (auth.uid() = id);
