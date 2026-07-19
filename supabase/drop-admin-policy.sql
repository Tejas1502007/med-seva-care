-- Remove the admin policy that calls get_my_role()
-- This is the most likely cause of the 500
DROP POLICY IF EXISTS "admin_reads_all_patients" ON public.patient_profiles;
DROP POLICY IF EXISTS "Admins can read all patient profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Verify what's left
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'patient_profiles')
ORDER BY tablename, policyname;
