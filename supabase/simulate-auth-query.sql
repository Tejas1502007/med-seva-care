-- Simulate exact query the app makes as authenticated user
-- Replace the UUID with your actual patient user ID
SELECT set_config('request.jwt.claims', 
  '{"sub":"997ad2cc-94a8-4ac3-9b88-8baf6151478e","role":"authenticated"}', 
  true);

SET LOCAL role TO authenticated;

SELECT * FROM public.patient_profiles 
WHERE id = '997ad2cc-94a8-4ac3-9b88-8baf6151478e';
