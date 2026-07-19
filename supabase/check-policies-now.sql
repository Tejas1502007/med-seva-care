-- ============================================================
-- STEP 1: See exactly what policies exist RIGHT NOW
-- Run this first and check the output
-- ============================================================
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename IN ('patient_profiles', 'profiles')
ORDER BY tablename, policyname;
