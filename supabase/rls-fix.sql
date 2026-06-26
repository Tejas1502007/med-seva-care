-- ============================================================
-- MedSeva — RLS Fix for doctor_profiles & patient_profiles
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- The trigger runs as SECURITY DEFINER but RLS was still blocking
-- the initial stub insert. We fix this two ways:
-- 1. Add a service-role bypass on both profile tables
-- 2. Add anon insert policies so the trigger can write during signup

-- ── Drop conflicting policies ─────────────────────────────────

drop policy if exists "Patients can insert own patient profile"  on public.patient_profiles;
drop policy if exists "Patients can update own patient profile"  on public.patient_profiles;
drop policy if exists "Doctors can insert own doctor profile"    on public.doctor_profiles;
drop policy if exists "Doctors can update own doctor profile"    on public.doctor_profiles;

-- ── patient_profiles ─────────────────────────────────────────

-- Allow the trigger (service_role) to insert
create policy "Service role can manage patient profiles"
  on public.patient_profiles for all
  to service_role
  using (true)
  with check (true);

-- Allow authenticated users to insert/update their own row
create policy "Patients can insert own patient profile"
  on public.patient_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Patients can update own patient profile"
  on public.patient_profiles for update
  to authenticated
  using (auth.uid() = id);

-- ── doctor_profiles ──────────────────────────────────────────

-- Allow the trigger (service_role) to insert
create policy "Service role can manage doctor profiles"
  on public.doctor_profiles for all
  to service_role
  using (true)
  with check (true);

-- Allow authenticated users to insert/update their own row
create policy "Doctors can insert own doctor profile"
  on public.doctor_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Doctors can update own doctor profile"
  on public.doctor_profiles for update
  to authenticated
  using (auth.uid() = id);

-- ── profiles base table ───────────────────────────────────────
-- Same fix for the base profiles table

drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Service role can manage profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);
