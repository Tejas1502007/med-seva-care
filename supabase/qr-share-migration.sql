-- QR-based Document Sharing System
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.qr_shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,
  pin           text NOT NULL,
  share_vitals      boolean DEFAULT true,
  share_reports     boolean DEFAULT true,
  share_medications boolean DEFAULT true,
  share_profile     boolean DEFAULT true,
  is_active     boolean DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  last_accessed_at  timestamptz,
  access_count  integer DEFAULT 0,
  access_log    jsonb DEFAULT '[]'::jsonb
);

-- RLS
ALTER TABLE public.qr_shares ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "patient_own_shares" ON public.qr_shares;
DROP POLICY IF EXISTS "public_read_by_token" ON public.qr_shares;
DROP POLICY IF EXISTS "patient_insert" ON public.qr_shares;
DROP POLICY IF EXISTS "patient_select" ON public.qr_shares;
DROP POLICY IF EXISTS "patient_update" ON public.qr_shares;

-- Patient can INSERT their own shares
CREATE POLICY "patient_insert" ON public.qr_shares
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Patient can SELECT their own shares
CREATE POLICY "patient_select" ON public.qr_shares
  FOR SELECT USING (auth.uid() = patient_id);

-- Patient can UPDATE their own shares (revoke)
CREATE POLICY "patient_update" ON public.qr_shares
  FOR UPDATE USING (auth.uid() = patient_id);

-- Service role can do everything (used by server-side API for view/access-log update)
-- This is handled automatically by the service role key bypass

-- Public SELECT for doctor view (token+pin validated in API code)
CREATE POLICY "public_read_by_token" ON public.qr_shares
  FOR SELECT USING (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS qr_shares_token_idx ON public.qr_shares(token);
CREATE INDEX IF NOT EXISTS qr_shares_patient_idx ON public.qr_shares(patient_id);
