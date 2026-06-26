-- ============================================================
-- MedSeva — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role       as enum ('patient', 'doctor');
create type gender_type     as enum ('Male', 'Female', 'Other');
create type risk_level      as enum ('HIGH', 'MODERATE', 'STABLE');
create type med_status      as enum ('Taken', 'Pending', 'Missed');
create type report_status   as enum ('Analyzing', 'Analyzed', 'Flagged');
create type doc_status      as enum ('pending_review', 'approved', 'rejected');
create type vital_type      as enum ('blood_sugar', 'blood_pressure', 'heart_rate', 'steps', 'weight', 'spo2');

-- ============================================================
-- PROFILES  (extends auth.users — one row per user)
-- ============================================================

create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  role          user_role   not null,
  email         text        not null,
  full_name     text,
  avatar_url    text,
  phone         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Base profile for every user — linked 1-to-1 with auth.users.';

-- ============================================================
-- PATIENT PROFILES
-- ============================================================

create table public.patient_profiles (
  id                  uuid        primary key references public.profiles(id) on delete cascade,
  age                 smallint,
  gender              gender_type,
  blood_group         text,
  language_pref       text        default 'Hindi',
  conditions          text[]      default '{}',
  allergies           text[]      default '{}',
  risk_level          risk_level  default 'STABLE',
  risk_score          smallint    check (risk_score between 0 and 100),
  emergency_contact   jsonb,        -- { name, phone }
  assigned_doctor_id  uuid        references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.patient_profiles is
  'Patient-specific fields. Linked to profiles(id).';

-- ============================================================
-- DOCTOR PROFILES
-- ============================================================

create table public.doctor_profiles (
  id                    uuid        primary key references public.profiles(id) on delete cascade,
  registration_number   text        unique not null,
  qualification         text        not null,   -- MBBS, MD, BAMS …
  specialization        text        not null,
  years_of_experience   smallint,
  hospital_clinic       text,
  license_file_url      text,                   -- Supabase Storage path
  verification_status   doc_status  not null default 'pending_review',
  verified_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.doctor_profiles is
  'Doctor credentials & verification. Linked to profiles(id).';

-- ============================================================
-- MEDICATIONS
-- ============================================================

create table public.medications (
  id          uuid        primary key default uuid_generate_v4(),
  patient_id  uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null,
  dose        text        not null,
  frequency   text        not null,
  time        text,
  streak      smallint    default 0,
  is_active   boolean     default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.medications is
  'Prescribed medications for a patient.';

-- ============================================================
-- MEDICATION LOGS  (daily taken/missed records)
-- ============================================================

create table public.medication_logs (
  id            uuid        primary key default uuid_generate_v4(),
  medication_id uuid        not null references public.medications(id) on delete cascade,
  patient_id    uuid        not null references public.profiles(id) on delete cascade,
  status        med_status  not null,
  logged_at     timestamptz not null default now()
);

-- ============================================================
-- VITALS
-- ============================================================

create table public.vitals (
  id          uuid        primary key default uuid_generate_v4(),
  patient_id  uuid        not null references public.profiles(id) on delete cascade,
  type        vital_type  not null,
  value       numeric     not null,
  unit        text        not null,
  notes       text,
  recorded_at timestamptz not null default now()
);

comment on table public.vitals is
  'Individual vital readings — blood sugar, BP (systolic stored, diastolic in notes), steps, etc.';

-- ============================================================
-- HEALTH REPORTS
-- ============================================================

create table public.health_reports (
  id           uuid          primary key default uuid_generate_v4(),
  patient_id   uuid          not null references public.profiles(id) on delete cascade,
  doctor_id    uuid          references public.profiles(id) on delete set null,
  name         text          not null,
  file_url     text,                        -- Supabase Storage path
  status       report_status not null default 'Analyzing',
  lab_values   jsonb,                       -- array of { parameter, value, range, status }
  ai_summary   text,
  report_date  date          not null default current_date,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

-- ============================================================
-- CONSULTATIONS  (doctor notes / timeline)
-- ============================================================

create table public.consultations (
  id          uuid        primary key default uuid_generate_v4(),
  patient_id  uuid        not null references public.profiles(id) on delete cascade,
  doctor_id   uuid        not null references public.profiles(id) on delete cascade,
  note        text        not null,
  consulted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CARE PLANS  (AI-generated diet / lifestyle plans)
-- ============================================================

create table public.care_plans (
  id          uuid        primary key default uuid_generate_v4(),
  patient_id  uuid        not null references public.profiles(id) on delete cascade,
  basis       text,                         -- "Based on HbA1c 7.2 & BP 138/88"
  meals       jsonb,                        -- array of meal objects
  lifestyle   jsonb,                        -- exercise, sleep tips etc.
  generated_at timestamptz not null default now(),
  valid_until timestamptz,
  is_active   boolean     default true
);

-- ============================================================
-- AI CHAT MESSAGES  (AARA conversations)
-- ============================================================

create table public.chat_messages (
  id          uuid        primary key default uuid_generate_v4(),
  patient_id  uuid        not null references public.profiles(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES  (query performance)
-- ============================================================

create index idx_patient_profiles_doctor   on public.patient_profiles(assigned_doctor_id);
create index idx_medications_patient       on public.medications(patient_id);
create index idx_medication_logs_patient   on public.medication_logs(patient_id);
create index idx_medication_logs_med       on public.medication_logs(medication_id);
create index idx_vitals_patient_type       on public.vitals(patient_id, type);
create index idx_vitals_recorded_at        on public.vitals(recorded_at desc);
create index idx_health_reports_patient    on public.health_reports(patient_id);
create index idx_consultations_patient     on public.consultations(patient_id);
create index idx_consultations_doctor      on public.consultations(doctor_id);
create index idx_care_plans_patient        on public.care_plans(patient_id);
create index idx_chat_messages_patient     on public.chat_messages(patient_id);

-- ============================================================
-- UPDATED_AT TRIGGER  (auto-update timestamps)
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_patient_profiles_updated_at
  before update on public.patient_profiles
  for each row execute function public.handle_updated_at();

create trigger trg_doctor_profiles_updated_at
  before update on public.doctor_profiles
  for each row execute function public.handle_updated_at();

create trigger trg_medications_updated_at
  before update on public.medications
  for each row execute function public.handle_updated_at();

create trigger trg_health_reports_updated_at
  before update on public.health_reports
  for each row execute function public.handle_updated_at();

-- ============================================================
-- NEW USER TRIGGER  (auto-create profile on sign-up)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, email, full_name, avatar_url)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'patient'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.patient_profiles  enable row level security;
alter table public.doctor_profiles   enable row level security;
alter table public.medications       enable row level security;
alter table public.medication_logs   enable row level security;
alter table public.vitals            enable row level security;
alter table public.health_reports    enable row level security;
alter table public.consultations     enable row level security;
alter table public.care_plans        enable row level security;
alter table public.chat_messages     enable row level security;

-- ── profiles ─────────────────────────────────────────────────
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Doctors can read profiles of their assigned patients
create policy "Doctors can read assigned patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = profiles.id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

-- ── patient_profiles ─────────────────────────────────────────
create policy "Patients can read own patient profile"
  on public.patient_profiles for select
  using (auth.uid() = id);

create policy "Patients can update own patient profile"
  on public.patient_profiles for update
  using (auth.uid() = id);

create policy "Patients can insert own patient profile"
  on public.patient_profiles for insert
  with check (auth.uid() = id);

create policy "Doctors can read assigned patient profiles"
  on public.patient_profiles for select
  using (assigned_doctor_id = auth.uid());

-- ── doctor_profiles ──────────────────────────────────────────
create policy "Doctors can read own doctor profile"
  on public.doctor_profiles for select
  using (auth.uid() = id);

create policy "Doctors can update own doctor profile"
  on public.doctor_profiles for update
  using (auth.uid() = id);

create policy "Doctors can insert own doctor profile"
  on public.doctor_profiles for insert
  with check (auth.uid() = id);

-- Patients can read basic info of their assigned doctor
create policy "Patients can read assigned doctor profile"
  on public.doctor_profiles for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = auth.uid()
        and pp.assigned_doctor_id = doctor_profiles.id
    )
  );

-- ── medications ──────────────────────────────────────────────
create policy "Patients can manage own medications"
  on public.medications for all
  using (auth.uid() = patient_id);

create policy "Doctors can read patient medications"
  on public.medications for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medications.patient_id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

-- ── medication_logs ──────────────────────────────────────────
create policy "Patients can manage own medication logs"
  on public.medication_logs for all
  using (auth.uid() = patient_id);

create policy "Doctors can read patient medication logs"
  on public.medication_logs for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medication_logs.patient_id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

-- ── vitals ───────────────────────────────────────────────────
create policy "Patients can manage own vitals"
  on public.vitals for all
  using (auth.uid() = patient_id);

create policy "Doctors can read patient vitals"
  on public.vitals for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = vitals.patient_id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

-- ── health_reports ───────────────────────────────────────────
create policy "Patients can manage own reports"
  on public.health_reports for all
  using (auth.uid() = patient_id);

create policy "Doctors can read and update patient reports"
  on public.health_reports for select
  using (
    auth.uid() = doctor_id or
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = health_reports.patient_id
        and pp.assigned_doctor_id = auth.uid()
    )
  );

create policy "Doctors can update assigned patient reports"
  on public.health_reports for update
  using (auth.uid() = doctor_id);

-- ── consultations ────────────────────────────────────────────
create policy "Doctors can manage own consultations"
  on public.consultations for all
  using (auth.uid() = doctor_id);

create policy "Patients can read own consultations"
  on public.consultations for select
  using (auth.uid() = patient_id);

-- ── care_plans ───────────────────────────────────────────────
create policy "Patients can read own care plans"
  on public.care_plans for select
  using (auth.uid() = patient_id);

create policy "Patients can insert own care plans"
  on public.care_plans for insert
  with check (auth.uid() = patient_id);

create policy "Service role can manage care plans"
  on public.care_plans for all
  using (auth.role() = 'service_role');

-- ── chat_messages ────────────────────────────────────────────
create policy "Patients can manage own chat messages"
  on public.chat_messages for all
  using (auth.uid() = patient_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('medical-reports',  'medical-reports',  false),
  ('doctor-licenses',  'doctor-licenses',  false),
  ('avatars',          'avatars',          true)
on conflict do nothing;

-- Reports: patients upload, their doctor can read
create policy "Patients can upload own reports"
  on storage.objects for insert
  with check (bucket_id = 'medical-reports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Patients can read own reports"
  on storage.objects for select
  using (bucket_id = 'medical-reports' and auth.uid()::text = (storage.foldername(name))[1]);

-- License files: doctors upload own
create policy "Doctors can upload own license"
  on storage.objects for insert
  with check (bucket_id = 'doctor-licenses' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Doctors can read own license"
  on storage.objects for select
  using (bucket_id = 'doctor-licenses' and auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars: public read, owner write
create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
