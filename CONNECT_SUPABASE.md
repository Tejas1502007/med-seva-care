# 🔌 Connect Medicine Management to Supabase - Step by Step

## Prerequisites ✅
- You have Supabase project URL
- You have Supabase API keys
- Your `.env` file is configured (already done ✅)

## Current Status
Your `.env` file already has:
- ✅ `VITE_SUPABASE_URL` → Configured
- ✅ `VITE_SUPABASE_ANON_KEY` → Configured
- ✅ Backend already uses Supabase client

---

## 🚀 Step-by-Step Connection Guide

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project: **med-seva-care**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

---

### Step 2: Copy the Complete Migration Script
Copy this entire script (all content from `supabase/SETUP_MEDICINES.sql`):

**Full Script:**
```sql
-- Add new columns
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'tablet';

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS times TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing records
UPDATE public.medications 
SET quantity = 1, unit = 'tablet'
WHERE quantity IS NULL AND unit IS NULL;

UPDATE public.medications
SET times = ARRAY[time]
WHERE (times IS NULL OR times = ARRAY[]::TEXT[]) AND time IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.medications.unit IS 'Unit of measurement: tablet, capsule, ml, mg, drop, spoon, injection';
COMMENT ON COLUMN public.medications.quantity IS 'Number of units to take per dose';
COMMENT ON COLUMN public.medications.times IS 'Array of times in HH:MM format';
COMMENT ON COLUMN public.medications.notes IS 'Special instructions';

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Patients can manage own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read patient medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can insert own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can select own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can update own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can delete own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read assigned patient medications" ON public.medications;
DROP POLICY IF EXISTS "Service role full access medications" ON public.medications;

-- Service role access
CREATE POLICY "Service role full access medications"
  ON public.medications
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Patient INSERT
CREATE POLICY "Patients can insert own medications"
  ON public.medications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patient SELECT
CREATE POLICY "Patients can select own medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Patient UPDATE
CREATE POLICY "Patients can update own medications"
  ON public.medications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Patient DELETE
CREATE POLICY "Patients can delete own medications"
  ON public.medications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctor SELECT
CREATE POLICY "Doctors can read assigned patient medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.id = medications.patient_id
        AND pp.assigned_doctor_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(patient_id, is_active);
```

---

### Step 3: Paste & Execute in Supabase
1. Paste the script in the SQL Editor
2. Click **Run** button (or Ctrl+Enter)
3. Wait for completion (should take 5-10 seconds)

**Expected Result:**
```
✓ ALTER TABLE 0
✓ UPDATE N (where N is number of records)
✓ COMMENT 4
✓ ALTER TABLE 0
✓ DROP POLICY N
✓ CREATE POLICY N
✓ CREATE INDEX (if not exists)
```

---

### Step 4: Verify Migration Completed
Run this verification query in a new SQL tab:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medications' 
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- patient_id (uuid)
- name (text)
- dose (text)
- frequency (text)
- time (text)
- streak (smallint)
- is_active (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- **unit (text)** ← NEW
- **quantity (numeric)** ← NEW
- **notes (text)** ← NEW
- **times (text[])** ← NEW

If you see all 14 columns → ✅ **Migration Successful!**

---

### Step 5: Verify RLS Policies
Run this query:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'medications'
ORDER BY policyname;
```

**Expected policies:**
- Doctors can read assigned patient medications
- Patients can delete own medications
- Patients can insert own medications
- Patients can select own medications
- Patients can update own medications
- Service role full access medications

If all 6 policies exist → ✅ **Policies Successful!**

---

### Step 6: Test the Connection
1. Start your application: `npm run dev` or `yarn dev`
2. Login as a patient
3. Go to **My Care Plan** → **Medications** tab
4. Add a test medicine:
   - Name: "Test Medicine"
   - Quantity: 1
   - Unit: "tablet"
   - Frequency: "Once daily"
   - Time: 09:00
5. Click **Add Medication**

**Expected Result:**
- ✅ Toast shows "Medication added successfully"
- ✅ Medicine appears in list
- ✅ Shows as "Test Medicine (1 tablet)"
- ✅ Refresh page → medicine still there

---

### Step 7: Verify in Supabase Table Editor
1. Go to **Table Editor** in Supabase
2. Click **medications** table
3. Look for your new record with:
   - name = "Test Medicine"
   - quantity = 1
   - unit = "tablet"
   - times = ["09:00"]
   - notes = NULL or empty

✅ **Connection Complete!**

---

## 🔍 Troubleshooting

### Error: "Permission denied"
**Solution:** 
- Verify you're logged in as patient (not doctor)
- Check RLS policies were created (Step 5)
- Try logging out and back in

### Error: "Column does not exist"
**Solution:**
- Run the full migration script again
- Verify all columns exist (Step 4)
- Clear browser cache and refresh

### Error: "RLS policy violation"
**Solution:**
- Ensure auth.uid() matches patient_id
- Verify RLS policies (Step 5)
- Check Supabase logs for details

### Medicine not saving but no error?
**Solution:**
- Check browser console (F12 → Console)
- Check Supabase logs (Dashboard → Logs)
- Verify Supabase credentials in `.env`
- Make sure you're authenticated

### Medicine saving but not showing?
**Solution:**
- Refresh page
- Check Supabase Table Editor to confirm it saved
- Verify patient_id matches logged-in user
- Check browser console for JavaScript errors

---

## 📊 What Gets Connected

### Frontend → Supabase Flow
```
User Input Form
       ↓
Validate Input
       ↓
Get User ID (supabase.auth.getUser())
       ↓
Insert to Database (supabase.from("medications").insert())
       ↓
Check RLS Policies
       ↓
Save to medications table
       ↓
Return new record
       ↓
Update UI with new medicine
       ↓
Show success toast
```

### Database Saves
When you add a medicine, Supabase saves:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_id": "your-user-id",
  "name": "Test Medicine",
  "dose": "1 tablet",
  "quantity": 1,
  "unit": "tablet",
  "frequency": "Once daily",
  "times": ["09:00"],
  "notes": null,
  "streak": 0,
  "is_active": true,
  "created_at": "2026-06-26T10:30:00Z",
  "updated_at": "2026-06-26T10:30:00Z"
}
```

---

## 🔐 Security Details

### RLS Policies (Row Level Security)
- **Patients** can only see/edit their own medicines
- **Doctors** can only see medicines of their assigned patients
- **Service role** can do anything (for server operations)

### Columns Protected by RLS
- `patient_id` column determines ownership
- Policies check `auth.uid() = patient_id`
- Prevents users from accessing others' medicines

---

## ✨ Features Now Connected

✅ Save medicines to database  
✅ Load medicines from database  
✅ Show multiple times (08:00, 20:00)  
✅ Display quantity + unit (1 tablet, 2 capsules)  
✅ Add special instructions  
✅ Persist after refresh  
✅ Secure access with RLS  
✅ Works for multiple patients  

---

## 🎯 Next Steps

1. ✅ Run Step 1-3 (Run migration)
2. ✅ Run Step 4 (Verify columns)
3. ✅ Run Step 5 (Verify policies)
4. ✅ Run Step 6 (Test app)
5. ✅ Run Step 7 (Check Supabase)

**You're done!** 🎉

---

## 📞 Quick Reference

| Step | Action | Time |
|------|--------|------|
| 1 | Go to Supabase | 30 sec |
| 2 | Copy script | 1 min |
| 3 | Run script | 1 min |
| 4 | Verify columns | 1 min |
| 5 | Verify policies | 1 min |
| 6 | Test app | 2 min |
| 7 | Check table | 1 min |
| **Total** | | **~8 min** |

---

## File Locations

- Migration script: `supabase/SETUP_MEDICINES.sql`
- Frontend form: `src/routes/_patient.care-plan.tsx`
- Dashboard: `src/routes/_patient.dashboard.tsx`
- Mock data: `src/lib/mock-data.ts`
- Database types: `src/lib/database.types.ts`

---

**Ready to connect?** Follow the 7 steps above and you'll have full Supabase integration! 🚀
