# Diet Plan Loading Fix

**Date**: June 26, 2026  
**Issue**: Page was hanging when loading diet plans from database  
**Status**: ✅ Fixed

---

## Problem

The care plan page was stuck in a loading state when trying to fetch the existing diet plan from the database.

### Root Cause

Used `.single()` on the Supabase query:
```typescript
// ❌ WRONG - throws error if no rows found
const { data: planData } = await supabase
  .from("care_plans")
  .select("*")
  .eq("patient_id", user.id)
  .eq("is_active", true)
  .order("generated_at", { ascending: false })
  .limit(1)
  .single();  // ← PROBLEM: throws if empty result
```

When no care plan exists (first visit), `.single()` throws an error that wasn't caught, causing the page to hang.

---

## Solution

Changed to return array and handle empty results:

```typescript
// ✅ CORRECT - returns array, handles empty results
try {
  const { data: planData, error: planError } = await supabase
    .from("care_plans")
    .select("*")
    .eq("patient_id", user.id)
    .eq("is_active", true)
    .order("generated_at", { ascending: false })
    .limit(1);  // ← No .single()

  if (planError) {
    console.error("Error loading care plan:", planError);
  } else if (planData && planData.length > 0) {
    setDietPlan(planData[0].meals || planData[0].lifestyle);
    console.log("✅ Loaded existing diet plan from database");
  } else {
    console.log("ℹ️ No active care plan found");
  }
} catch (err) {
  console.error("Exception loading care plan:", err);
}
```

### Changes Made

| Item | Before | After |
|------|--------|-------|
| Query method | `.single()` | Array return |
| Error handling | None (uncaught) | Try-catch + explicit check |
| Empty result | Error thrown | Gracefully handled |
| Condition check | `if (planData)` | `if (planData && planData.length > 0)` |
| Result access | `planData.meals` | `planData[0].meals` |

---

## User Experience

### First Time Visit (No Plan)
- ✅ Page loads instantly
- ✅ Shows "Generate Diet Plan" button
- ✅ No hanging or errors

### Return Visit (Has Plan)
- ✅ Page loads instantly
- ✅ Displays existing plan immediately
- ✅ Shows "Regenerate" option

### After Generation
- ✅ Page saves plan to database
- ✅ Toast confirms success
- ✅ Plan displays immediately

---

## Console Logs

Now you'll see helpful logs:

```
// First visit - no plan
ℹ️ No active care plan found

// Return visit - plan found
✅ Loaded existing diet plan from database

// Error case
Error loading care plan: {error details}
```

---

## Files Modified

- `src/routes/_patient.care-plan.tsx` - Fixed loadPatientData() function

---

## Build Status

✅ Successful - No errors  
✅ Ready for deployment

