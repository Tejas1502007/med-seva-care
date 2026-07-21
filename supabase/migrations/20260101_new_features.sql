-- ============================================================
-- MedSeva — New Features Migration
-- Run this entire file in Supabase SQL Editor
-- Features: ABHA, Health Vault, Discharge Protocol,
--           Alert Escalation, Drug Interaction, Govt Schemes,
--           Record Sharing, Caregiver Portal
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- FEATURE A — ABHA ID + profile extras
-- ────────────────────────────────────────────────────────────
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS abha_id text;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS abha_verified boolean DEFAULT false;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS income_category text;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS city text;

-- ────────────────────────────────────────────────────────────
-- FEATURE B — Health Vault (Medical DigiLocker)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_vault (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'lab_report', 'discharge', 'prescription',
    'scan', 'vaccination', 'insurance', 'govt_card', 'other'
  )),
  document_date date,
  uploaded_by text DEFAULT 'self' CHECK (uploaded_by IN ('self', 'doctor', 'hospital')),
  tags text[],
  ai_summary jsonb,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their vault docs"
  ON health_vault FOR ALL
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FEATURE C — Discharge Protocol Engine
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discharge_protocols (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  health_vault_id uuid REFERENCES health_vault(id),
  raw_text text,
  parsed_data jsonb NOT NULL DEFAULT '{}',
  activated boolean DEFAULT false,
  activated_at timestamptz,
  protocol_end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discharge_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their discharge protocols"
  ON discharge_protocols FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS aara_scheduled_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  protocol_id uuid REFERENCES discharge_protocols(id),
  day_number integer NOT NULL,
  scheduled_date date NOT NULL,
  priority text CHECK (priority IN ('HIGH', 'ROUTINE')) DEFAULT 'ROUTINE',
  questions jsonb NOT NULL DEFAULT '[]',
  escalate_if text NOT NULL DEFAULT '',
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED', 'MISSED')),
  response_data jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aara_scheduled_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their checkins"
  ON aara_scheduled_checkins FOR ALL
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FEATURE D — Alert Escalation Chain
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_escalations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'high_sugar', 'low_sugar', 'high_bp', 'critical_bp',
    'missed_meds', 'checkin_response', 'drug_interaction'
  )),
  trigger_value text NOT NULL,
  severity text CHECK (severity IN ('MODERATE', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
  steps jsonb NOT NULL DEFAULT '[]',
  current_step integer DEFAULT 0,
  resolved boolean DEFAULT false,
  resolved_by text CHECK (resolved_by IN ('patient', 'doctor', 'caregiver', 'auto')),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alert_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their alerts"
  ON alert_escalations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient alerts"
  ON alert_escalations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Enable realtime on alert_escalations
ALTER PUBLICATION supabase_realtime ADD TABLE alert_escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE aara_scheduled_checkins;

-- ────────────────────────────────────────────────────────────
-- FEATURE E — Drug Interaction Checker
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drug_interaction_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  drugs_checked jsonb NOT NULL DEFAULT '[]',
  interactions_found jsonb DEFAULT '[]',
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE drug_interaction_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their drug checks"
  ON drug_interaction_checks FOR ALL
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FEATURE F — Government Scheme Eligibility
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheme_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  scheme_name text NOT NULL,
  eligibility_status text CHECK (eligibility_status IN ('ELIGIBLE', 'LIKELY_ELIGIBLE', 'NOT_ELIGIBLE')) DEFAULT 'LIKELY_ELIGIBLE',
  applied boolean DEFAULT false,
  applied_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their scheme applications"
  ON scheme_applications FOR ALL
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FEATURE G — Doctor Record Sharing
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS record_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES auth.users NOT NULL,
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  doctor_name text,
  doctor_contact text,
  share_categories jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  accessed_at timestamptz,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE record_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients own their shares"
  ON record_shares FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Anyone with token can read share"
  ON record_shares FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────
-- FEATURE H — Caregiver Portal
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregivers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid REFERENCES auth.users NOT NULL,
  patient_id uuid REFERENCES auth.users NOT NULL,
  relationship text,
  is_active boolean DEFAULT true,
  linked_at timestamptz DEFAULT now(),
  UNIQUE(caregiver_id, patient_id)
);

ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers own their links"
  ON caregivers FOR ALL
  USING (auth.uid() = caregiver_id OR auth.uid() = patient_id);

CREATE TABLE IF NOT EXISTS caregiver_observations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid REFERENCES auth.users NOT NULL,
  patient_id uuid REFERENCES auth.users NOT NULL,
  observation_date date NOT NULL DEFAULT current_date,
  mood text CHECK (mood IN ('good', 'okay', 'poor')),
  appetite text CHECK (appetite IN ('good', 'reduced', 'very_poor')),
  energy text CHECK (energy IN ('normal', 'low', 'very_low')),
  pain_level integer CHECK (pain_level BETWEEN 0 AND 10),
  confusion_noted boolean DEFAULT false,
  free_text text,
  ai_flag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caregiver_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregiver owns their observations"
  ON caregiver_observations FOR ALL
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Patient can read their observations"
  ON caregiver_observations FOR SELECT
  USING (auth.uid() = patient_id);

-- Enable realtime on vitals too (for dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE vitals;

-- ────────────────────────────────────────────────────────────
-- Storage bucket for Health Vault
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-vault', 'health-vault', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to their vault folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'health-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their vault files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'health-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their vault files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'health-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
