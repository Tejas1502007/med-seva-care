-- Test 1: Does select * work with RLS on?
SET role authenticated;
SET request.jwt.claims TO '{"sub":"997ad2cc-94a8-4ac3-9b88-8baf6151478e","role":"authenticated"}';
SELECT * FROM public.patient_profiles WHERE id = '997ad2cc-94a8-4ac3-9b88-8baf6151478e';
RESET role;
RESET request.jwt.claims;

-- Test 2: Check all columns on patient_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- Test 3: Check if dob/height/weight/address columns exist
-- (these were added in fix scripts but may have type issues)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'patient_profiles'
  AND column_name IN ('dob','height','weight','address','alternate_phone','addictions');
