# Medicine Management - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1️⃣: Run Database Migration
Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste this SQL:
```sql
alter table public.medications add column if not exists unit text default 'tablet';
alter table public.medications add column if not exists quantity numeric default 1;
alter table public.medications add column if not exists notes text;
alter table public.medications add column if not exists times text[] default array[]::text[];

update public.medications 
set quantity = 1, unit = 'tablet'
where quantity is null and unit is null;

comment on column public.medications.unit is 'Unit of measurement: tablet, capsule, ml, mg, etc.';
comment on column public.medications.quantity is 'Number of units to take per dose';
comment on column public.medications.times is 'Array of times to take medication (e.g., ["08:00", "14:00", "20:00"])';
comment on column public.medications.notes is 'Special instructions: with food, before bed, etc.';
```

Then click **Execute** and verify: ✅ Success!

---

### Step 2️⃣: Test the App
1. Login as a patient
2. Go to **My Care Plan**
3. Click **Medications** tab
4. Fill in the form:
   - **Name**: Aspirin
   - **Quantity**: 2
   - **Unit**: tablet
   - **Frequency**: Twice daily
   - **Times**: 08:00 and 20:00
   - **Notes**: Take with water
5. Click **Add Medication**
6. ✅ Medicine appears in list and table

---

### Step 3️⃣: Verify It Works
- Check **Dashboard** → medicine shows with new format
- Refresh page → medicine still there
- Mark as taken → status updates

**Done!** 🎉

---

## 📋 Form Cheat Sheet

| Field | Options | Example |
|-------|---------|---------|
| **Name** | Any medicine | Metformin, Aspirin |
| **Quantity** | Any number | 1, 2, 0.5 |
| **Unit** | Tablet, Capsule, ML, MG, Drop, Spoon, Injection | tablet |
| **Frequency** | Once daily, Twice daily, Thrice daily, Four times daily, Every alternate day, Weekly | Twice daily |
| **Times** | HH:MM format (24-hour) | 08:00, 20:00 |
| **Notes** | Any text | with meals, before bed |

---

## 💾 What Gets Saved

```javascript
{
  name: "Aspirin",
  quantity: 2,
  unit: "tablet",
  frequency: "Twice daily",
  times: ["08:00", "20:00"],
  notes: "Take with water",
  
  // Auto-generated:
  dose: "2 tablet",
  is_active: true,
  streak: 0
}
```

---

## 🎯 Display Examples

### Care Plan List
```
Aspirin (2 tablet)
Twice daily • 08:00, 20:00
📝 Take with water
🔥 0 days
```

### Care Plan Table
| Medicine | Dose | Time | Frequency |
|----------|------|------|-----------|
| Aspirin | 2 tablet | 08:00, 20:00 | Twice daily |

### Dashboard
```
Aspirin (2 tablet)
at 08:00, 20:00
```

---

## ❌ Common Issues & Fixes

### Medicine not saving?
- [ ] Are you logged in as a patient?
- [ ] Did you fill all required fields (marked with *)?
- [ ] Check browser console for errors

### Old medicines not showing?
- [ ] Did you run the SQL migration?
- [ ] Go to Supabase → medications table → refresh
- [ ] Verify columns exist: unit, quantity, times, notes

### Times showing as blank?
- [ ] Ensure times are in HH:MM format (24-hour)
- [ ] Example: 09:00 (not 9:00 or 9 AM)

---

## 📞 Support

**Still having issues?**
1. Check browser console (F12 → Console tab)
2. Verify Supabase credentials in `.env`
3. Check that medicines table exists in Supabase
4. Review `MEDICINES_UPDATE.md` for detailed setup

---

## ✨ Features

✅ Add medicines with tablets, capsules, ml, mg  
✅ Set multiple times per day  
✅ Add special instructions  
✅ All data saved to database  
✅ Persists after page refresh  
✅ Works on mobile  
✅ Mark as taken  
✅ Track adherence  

---

## 🔄 Full Database Schema

After migration, your medications table has:
- id, patient_id, name, dose
- **quantity** ← new
- **unit** ← new
- **times** ← new
- **notes** ← new
- frequency, time, streak, is_active
- created_at, updated_at

---

**You're all set! Start adding medicines now.** 🚀
