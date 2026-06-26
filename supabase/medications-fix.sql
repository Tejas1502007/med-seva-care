-- ============================================================
-- MedSeva — Medications RLS Fix
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop all existing medication policies to start clean
drop policy if exists "Patients can manage own medications"   on public.medications;
drop policy if exists "Doctors can read patient medications"  on public.medications;

-- Service role can do everything (triggers, server functions)
create policy "Service role full access medications"
  on public.medications for all
  to service_role
  using (true)
  with check (true);

-- Authenticated patients can INSERT their own medications
create policy "Patients can insert own medications"
  on public.medications for insert
  to authenticated
  with check (auth.uid() = patient_id);

-- Authenticated patients can SELECT their own medications
create policy "Patients can select own medications"
  on public.medications for select
  to authenticated
  using (auth.uid() = patient_id);

-- Authenticated patients can UPDATE their own medications
create policy "Patients can update own medications"
  on public.medications for update
  to authenticated
  using (auth.uid() = patient_id);

-- Authenticated patients can DELETE their own medications
create policy "Patients can delete own medications"
  on public.medications for delete
  to authenticated
  using (auth.uid() = patient_id);

-- Doctors can read medications of their assigned patients
create policy "Doctors can read assigned patient medications"
  on public.medications for select
  to authenticated
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medications.patient_id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

-- ── Verify the table exists (runs without error if it does) ──
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'medications'
  ) then
    -- Create it if somehow missing
    create table public.medications (
      id          uuid        primary key default gen_random_uuid(),
      patient_id  uuid        not null references public.profiles(id) on delete cascade,
      name        text        not null,
      dose        text        not null,
      frequency   text        not null default 'Once daily',
      time        text,
      streak      smallint    default 0,
      is_active   boolean     default true,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now()
    );
    alter table public.medications enable row level security;
    create index on public.medications(patient_id);
    raise notice 'medications table created';
  else
    raise notice 'medications table already exists';
  end if;
end;
$$;
