-- ============================================================
-- DIAGNOSTIC — run each block separately to find the 500 error
-- ============================================================

-- 1. Check what policies exist on patient_profiles
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patient_profiles';

-- 2. Check if 'admin' exists in the user_role enum
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 3. Check for any broken functions referenced by policies
SELECT proname, prosrc FROM pg_proc
WHERE proname = 'handle_new_user' OR proname = 'handle_updated_at';

-- 4. Try a direct count (bypasses RLS, run as postgres role)
SELECT COUNT(*) FROM public.patient_profiles;
