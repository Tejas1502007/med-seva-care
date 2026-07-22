-- ─────────────────────────────────────────────────────────────────────────────
-- MedSeva — Discharge Protocol Migration (safe to re-run)
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. CREATE discharge_protocols
CREATE TABLE IF NOT EXISTS discharge_protocols (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users NOT NULL,
  raw_text         text,
  parsed_data      jsonb       NOT NULL DEFAULT '{}',
  activated        boolean     DEFAULT false,
  activated_at     timestamptz,
  protocol_end_date timestamptz,
  health_vault_id  uuid,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE discharge_protocols ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'discharge_protocols' AND policyname = 'Users own their protocols'
  ) THEN
    CREATE POLICY "Users own their protocols"
      ON discharge_protocols FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2. CREATE aara_scheduled_checkins
CREATE TABLE IF NOT EXISTS aara_scheduled_checkins (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users NOT NULL,
  protocol_id    uuid        REFERENCES discharge_protocols(id) ON DELETE CASCADE,
  day_number     integer     NOT NULL,
  scheduled_date date        NOT NULL,
  priority       text        DEFAULT 'ROUTINE'
                             CHECK (priority IN ('HIGH', 'ROUTINE')),
  questions      jsonb       NOT NULL DEFAULT '[]',
  escalate_if    text,
  status         text        DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED', 'MISSED')),
  response_data  jsonb,
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE aara_scheduled_checkins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'aara_scheduled_checkins' AND policyname = 'Users own their checkins'
  ) THEN
    CREATE POLICY "Users own their checkins"
      ON aara_scheduled_checkins FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_discharge_protocols_user_activated
  ON discharge_protocols (user_id, activated, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_aara_checkins_user_protocol
  ON aara_scheduled_checkins (user_id, protocol_id, day_number);

CREATE INDEX IF NOT EXISTS idx_aara_checkins_scheduled_date
  ON aara_scheduled_checkins (user_id, scheduled_date, status);
