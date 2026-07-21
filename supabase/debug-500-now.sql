-- ============================================================
-- Run each query ONE AT A TIME and share results
-- ============================================================

-- QUERY 1: All policies on patient_profiles right now
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'patient_profiles';

-- QUERY 2: All policies on profiles right now  
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- QUERY 3: Check enum values
SELECT enumlabel 
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- QUERY 4: Check patient_profiles columns (look for unexpected columns)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- QUERY 5: Try raw select as superuser (bypasses RLS entirely)
SET row_security = off;
SELECT id, risk_level, risk_score FROM public.patient_profiles LIMIT 3;
SET row_security = on;
