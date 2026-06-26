# Apply Diet Plan Save Fix - Step by Step

**This fixes: "Plan generated but failed to save" error**

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
- Go to https://app.supabase.com
- Select your MedSeva project

### Step 2: Open SQL Editor
- Click **SQL Editor** in left sidebar
- Click **New Query** button

### Step 3: Copy & Paste This SQL

```sql
-- Add INSERT permission for patients to save their own care plans
CREATE POLICY "Patients can insert own care plans"
  ON public.care_plans FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Add UPDATE permission for patients to update their care plans
CREATE POLICY "Patients can update own care plans"
  ON public.care_plans FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);
```

### Step 4: Run the Query
- Click **Run** button (or Ctrl+Enter)
- Wait for success message
- You should see: `Query successful`

### Step 5: Verify
- You should see no errors
- Query executed successfully

---

## ✅ Test It

1. Refresh your MedSeva app in browser
2. Go to **Care Plan** → **Diet Plan**
3. Set medical conditions
4. Click **Generate Diet Plan**
5. Should see: **"✓ Diet plan generated and saved successfully!"**

---

## 🐛 If Still Having Issues

### Check Console Logs
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Generate diet plan
4. Look for error details
5. Share the error with support

### Error Examples

**Good - Now Works**:
```
✓ Diet plan generated and saved successfully!
```

**RLS Issue - Run SQL Above**:
```
Error saving to database: new row violates row-level security policy
```

**Network Issue - Check Internet**:
```
Failed to fetch
```

---

## 📝 What Changed

- Added permission for users to INSERT diet plans
- Added permission for users to UPDATE diet plans
- Now diet plans save to database successfully
- Plans load on return visits automatically

---

## ❓ Questions?

Check these docs:
- `DIET_PLAN_SAVE_FIX.md` - Detailed explanation
- `DIET_PLAN_DATABASE_PERSISTENCE.md` - How saving works
- `DIET_PLAN_API_FIX_COMPLETE.md` - API details

