-- ============================================================
-- VERIFICATION QUERIES - Run these to confirm setup is complete
-- Copy and paste each query below into Supabase SQL Editor
-- ============================================================

-- Query 1: Verify All Columns in Medications Table
-- Expected: 14 columns (id, patient_id, name, dose, frequency, time, streak, is_active, created_at, updated_at, unit, quantity, notes, times)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'medications' 
ORDER BY ordinal_position;

---

-- Query 2: Verify Medication Logs Table Exists
-- Expected: Table exists with columns (id, medication_id, patient_id, status, logged_at, created_at)
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'medication_logs' 
ORDER BY ordinal_position;

---

-- Query 3: Verify RLS Policies on Medications
-- Expected: 6 policies (Service role, Patients insert/select/update/delete, Doctors read)
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'medications'
ORDER BY policyname;

---

-- Query 4: Verify RLS Policies on Medication Logs
-- Expected: 5 policies (Patients insert/select/update/delete, Doctors read)
SELECT 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'medication_logs'
ORDER BY policyname;

---

-- Query 5: Verify Indexes for Performance
-- Expected: Indexes on patient_id for both tables
SELECT 
  indexname, 
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('medications', 'medication_logs')
ORDER BY tablename, indexname;

---

-- Query 6: Count Current Medications
-- Shows how many medicines are in the system
SELECT 
  COUNT(*) as total_medicines,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_medicines,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_medicines
FROM public.medications;

---

-- Query 7: Count Medication Logs
-- Shows how many medicine-taken records exist (for adherence tracking)
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN status = 'Taken' THEN 1 END) as taken,
  COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'Missed' THEN 1 END) as missed
FROM public.medication_logs;

---

-- Query 8: View Sample Medicine with All New Fields
-- Shows a medicine with all the new fields (quantity, unit, times, notes)
SELECT 
  id,
  name,
  quantity,
  unit,
  dose,
  frequency,
  times,
  notes,
  streak,
  is_active,
  created_at,
  updated_at
FROM public.medications
LIMIT 1;

---

-- Query 9: View Sample Medication Log
-- Shows a log entry for adherence tracking
SELECT 
  id,
  medication_id,
  patient_id,
  status,
  logged_at
FROM public.medication_logs
LIMIT 1;

---

-- Query 10: Check RLS is Enabled on Both Tables
-- Expected: both should show 'true'
SELECT 
  tablename,
  rowsecurity
FROM pg_class 
JOIN information_schema.tables 
  ON pg_class.relname = information_schema.table_name
WHERE tablename IN ('medications', 'medication_logs')
AND table_schema = 'public';

---

-- Query 11: Summary Report
-- Shows overall status of the setup
SELECT 
  'Medications Table' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medications') as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'medications') as policy_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'medications') as index_count
UNION ALL
SELECT 
  'Medication Logs Table' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medication_logs') as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'medication_logs') as policy_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'medication_logs') as index_count;

---

-- ============================================================
-- EXPECTED RESULTS SUMMARY:
-- ============================================================
-- Query 1: 14 columns (medications table)
-- Query 2: 6 columns (medication_logs table)
-- Query 3: 6 policies (medications)
-- Query 4: 5 policies (medication_logs)
-- Query 5: Multiple indexes (at least 3)
-- Query 6: Shows total medicines count
-- Query 7: Shows adherence logs count
-- Query 8: Sample medicine with new fields (quantity, unit, times, notes)
-- Query 9: Sample medication log entry
-- Query 10: Both tables show RLS enabled (true)
-- Query 11: Summary showing columns/policies/indexes
-- ============================================================
