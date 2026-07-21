-- Check ALL remaining policies across all tables
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'vitals', 'health_reports', 'medications', 'medication_logs',
  'consultations', 'care_plans', 'chat_messages', 'doctor_profiles'
)
ORDER BY tablename, policyname;
