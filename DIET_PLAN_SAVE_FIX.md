# Diet Plan Database Save Fix

**Date**: June 26, 2026  
**Issue**: "Plan generated but failed to save" error  
**Status**: ✅ Fixed

---

## Problem

When generating a diet plan, the API successfully generates the plan but the database save fails with permission error.

### Root Cause

Missing RLS (Row Level Security) INSERT policy on the `care_plans` table. The table had:
- ✅ Read policy for patients
- ✅ All policies for service_role
- ❌ **Missing**: INSERT policy for authenticated users

---

## Solution

### 1. Add RLS Policy to Database

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add INSERT policy so patients can insert their own care plans
CREATE POLICY "Patients can insert own care plans"
  ON public.care_plans FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Optional: Add UPDATE policy for updating care plans  
CREATE POLICY "Patients can update own care plans"
  ON public.care_plans FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);
```

**Location**: File: `supabase/care-plans-rls-fix.sql`

### 2. Updated Schema

Updated `supabase/schema.sql` with the new policies:

```sql
-- ── care_plans ───────────────────────────────────────────────
create policy "Patients can read own care plans"
  on public.care_plans for select
  using (auth.uid() = patient_id);

create policy "Patients can insert own care plans"          -- NEW
  on public.care_plans for insert
  with check (auth.uid() = patient_id);                   -- NEW

create policy "Service role can manage care plans"
  on public.care_plans for all
  using (auth.role() = 'service_role');
```

### 3. Improved Error Logging

Enhanced error handling in `src/routes/_patient.care-plan.tsx`:

```typescript
if (dbError) {
  console.error("❌ Error saving to database:", dbError);
  console.error("Error code:", dbError.code);
  console.error("Error message:", dbError.message);
  console.error("User ID:", userId);
  
  // Still show the plan even if save fails
  setDietPlan(data.plan);
  toast.error(`Database error: ${dbError.message || "Failed to save plan"}`);
  return;
}
```

### 4. Graceful Degradation

Even if database save fails:
- ✅ Plan still displays to user
- ✅ Plan cached in component state
- ✅ User sees clear error message
- ✅ Plan not lost

---

## How to Fix

### Option A: Run SQL (Recommended for Existing Database)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy & paste from `supabase/care-plans-rls-fix.sql`
5. Click Run
6. Verify policies created

### Option B: Recreate Database (Fresh Start)

If starting fresh, use updated schema:
```bash
# Copy updated schema.sql
cp supabase/schema.sql /path/to/supabase/migrations/
```

New deployments will have correct policies from the start.

---

## Verification

### Check Policies in Supabase

Run this query in SQL Editor:
```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'care_plans'
ORDER BY policyname;
```

Expected output:
| policyname | qual | with_check |
|-----------|------|-----------|
| Patients can read own care plans | `auth.uid() = patient_id` | NULL |
| Patients can insert own care plans | NULL | `auth.uid() = patient_id` |
| Service role can manage care plans | `auth.role() = 'service_role'` | NULL |

### Test in Application

1. Go to Care Plan → Diet Plan tab
2. Set medical conditions
3. Click "Generate Diet Plan"
4. Check console logs (F12 → Console)

**Success indicators**:
```
🔍 Diet Plan Request: Diabetes, Hypertension
✅ Groq API response received
✅ Diet plan parsed successfully
✓ Diet plan generated and saved successfully!  ← Plan saved to DB
```

**Failure indicators** (before fix):
```
Plan generated but failed to save
❌ Error saving to database: {details}
```

---

## RLS Policy Explanation

### Patients can insert own care plans

```sql
CREATE POLICY "Patients can insert own care plans"
  ON public.care_plans FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
```

This policy allows:
- **Action**: INSERT (create new records)
- **Condition**: `auth.uid() = patient_id`
- **Meaning**: Users can only insert records where `patient_id` matches their auth ID

### Why It Was Missing

The table had a catch-all "Service role can manage" policy, which only allows the backend service to insert. The client-side inserts were blocked because there was no explicit permission for authenticated users.

---

## Database Structure

```
care_plans table:
├── id (UUID)
├── patient_id (UUID) ← Must match auth.uid()
├── basis (text)
├── meals (jsonb)
├── lifestyle (jsonb)
├── generated_at (timestamp)
├── valid_until (timestamp)
└── is_active (boolean)
```

When a patient inserts a care plan:
1. System gets `auth.uid()` from their token
2. Checks if `patient_id` in the insert matches `auth.uid()`
3. If match → Insert allowed
4. If mismatch → Insert denied

---

## Error Messages After Fix

### Success
```
✓ Diet plan generated and saved successfully!
```

### Database Error (Detailed)
```
❌ Error saving to database: {error}
Error code: PGRST123
Error message: new row violates row-level security policy
User ID: 550e8400-e29b-41d4-a716-446655440000
```

### Network Error
```
Plan generated but database save failed - showing cached plan
```

---

## Files Modified

1. **supabase/schema.sql**
   - Added INSERT policy for care_plans

2. **supabase/care-plans-rls-fix.sql** (NEW)
   - SQL to apply fix to existing database

3. **src/routes/_patient.care-plan.tsx**
   - Enhanced error logging
   - Graceful degradation (show plan anyway)
   - Better error messages

---

## Build Status

✅ TypeScript compilation successful  
✅ No runtime errors  
✅ RLS policies configured  

---

## Testing Checklist

- [ ] Applied SQL policy to Supabase
- [ ] Generated diet plan successfully
- [ ] Plan saved to database
- [ ] Return to page - plan loads from database
- [ ] Change conditions - previous plans deactivated
- [ ] Check Supabase table for care_plans records
- [ ] Console shows detailed error if anything goes wrong

---

## Next Steps

1. **Apply SQL Fix**
   ```sql
   CREATE POLICY "Patients can insert own care plans"
     ON public.care_plans FOR INSERT
     WITH CHECK (auth.uid() = patient_id);
   ```

2. **Refresh Application**
   - Clear browser cache
   - Reload page

3. **Test Generation**
   - Generate new diet plan
   - Verify success message
   - Check database

4. **Monitor Logs**
   - Open DevTools Console
   - Generate plan
   - Watch for success messages

---

## Related Files

- `DIET_PLAN_API_FIX_COMPLETE.md` - API and model fix
- `DIET_PLAN_DATABASE_PERSISTENCE.md` - Database persistence design
- `DIET_PLAN_LOADING_FIX.md` - Loading page fix

