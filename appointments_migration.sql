-- ============================================================
-- APPOINTMENTS MIGRATION
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Appointment status type
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Appointment mode type
DO $$ BEGIN
  CREATE TYPE appointment_mode AS ENUM (
    'online',
    'offline'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date  date          NOT NULL,
  appointment_time  time          NOT NULL,
  mode              appointment_mode NOT NULL DEFAULT 'offline',
  reason            text,                        -- patient's reason for visit
  rejection_reason  text,                        -- doctor's reason if rejected
  status            appointment_status NOT NULL DEFAULT 'pending',
  notes             text,                        -- doctor's notes after approval
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id   ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id    ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON public.appointments (appointment_date);

-- 6. Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────────────

-- Drop existing policies before recreating (safe to re-run)
DROP POLICY IF EXISTS "patients can view own appointments"    ON public.appointments;
DROP POLICY IF EXISTS "patients can create appointments"      ON public.appointments;
DROP POLICY IF EXISTS "patients can cancel own appointments"  ON public.appointments;
DROP POLICY IF EXISTS "doctors can view their appointments"   ON public.appointments;
DROP POLICY IF EXISTS "doctors can update appointment status" ON public.appointments;
DROP POLICY IF EXISTS "admins have full access"               ON public.appointments;

-- Patients can see their own appointments
CREATE POLICY "patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can create (book) appointments
CREATE POLICY "patients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Patients can cancel their own pending appointments
CREATE POLICY "patients can cancel own appointments"
  ON public.appointments FOR UPDATE
  USING (
    auth.uid() = patient_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = patient_id
    AND status = 'cancelled'
  );

-- Doctors can see appointments addressed to them
CREATE POLICY "doctors can view their appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id);

-- Doctors can approve/reject/complete appointments
CREATE POLICY "doctors can update appointment status"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Admins have full access (role stored in profiles.role)
CREATE POLICY "admins have full access"
  ON public.appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- VERIFICATION QUERY — run after migration to confirm setup
-- ============================================================
-- SELECT table_name, row_security
-- FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'appointments';

-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'appointments';
