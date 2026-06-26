# Medicine Management Update - Setup Instructions

## Overview
The medicine management system has been updated to support:
- ✅ Tablets, capsules, ML, MG, drops, spoons, injections
- ✅ Multiple times per day with proper time inputs (HH:MM format)
- ✅ Quantity + Unit separation (1 tablet, 2 capsules, 5 ML, etc.)
- ✅ Special instructions/notes for each medicine
- ✅ Full database integration

## What Changed

### Database Changes
The `medications` table has new columns:
- `quantity` (numeric): Number of units to take per dose
- `unit` (text): Unit of measurement (tablet, capsule, ml, mg, drop, spoon, injection)
- `times` (text[]): Array of times to take medication (e.g., ["08:00", "14:00", "20:00"])
- `notes` (text): Special instructions (e.g., "with meals", "before bed")

### Frontend Changes
1. **Care Plan Page** (`src/routes/_patient.care-plan.tsx`):
   - Updated form to include quantity, unit, and multiple times
   - Proper validation for all fields
   - Database integration for saving and loading medicines
   - Display format: "Medicine Name (quantity unit)" + multiple times

2. **Dashboard** (`src/routes/_patient.dashboard.tsx`):
   - Updated medicine display to show new format
   - Shows all times instead of just one time

3. **Mock Data** (`src/lib/mock-data.ts`):
   - Updated mock medicines with new fields

## Setup Instructions

### Step 1: Run Database Migration
Copy this SQL and run it in **Supabase Dashboard → SQL Editor → New Query**:

```bash
cat supabase/medications-update.sql
```

Or copy from the file content below and paste in Supabase SQL Editor:

```sql
-- Add unit column if it doesn't exist
alter table public.medications
  add column if not exists unit text default 'tablet';

-- Add quantity column if it doesn't exist  
alter table public.medications
  add column if not exists quantity numeric default 1;

-- Add notes column for special instructions
alter table public.medications
  add column if not exists notes text;

-- Add multiple_times column to store times for multiple daily doses
alter table public.medications
  add column if not exists times text[] default array[]::text[];

-- Simple bulk update to default values for existing records
update public.medications 
set quantity = 1,
    unit = 'tablet'
where quantity is null and unit is null;

-- Add comments for new columns
comment on column public.medications.unit is 'Unit of measurement: tablet, capsule, ml, mg, etc.';
comment on column public.medications.quantity is 'Number of units to take per dose';
comment on column public.medications.times is 'Array of times to take medication (e.g., ["08:00", "14:00", "20:00"])';
comment on column public.medications.notes is 'Special instructions: with food, before bed, etc.';
```

### Step 2: Verify Migration
Check that columns were added:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'medications' 
ORDER BY ordinal_position;
```

Should show: id, patient_id, name, dose, frequency, time, streak, is_active, created_at, updated_at, unit, quantity, times, notes

### Step 3: Test the Application
1. Log in as a patient
2. Go to **My Care Plan** → **Medications**
3. Try adding a medicine with:
   - Name: "Aspirin"
   - Quantity: 2
   - Unit: "tablet"
   - Frequency: "Twice daily"
   - Times: 08:00, 20:00
   - Notes: "Take with water"
4. Verify it saves and displays correctly

## Form Usage

### Adding a Medicine

**Field: Medication Name***
- Example: "Metformin", "Aspirin", "Paracetamol"
- Required: Yes

**Field: Quantity***
- Number to take per dose
- Example: 1, 2, 0.5
- Accepts decimals
- Required: Yes

**Field: Unit***
- Measurement unit
- Options: Tablet, Capsule, ML, MG, Drop, Spoon, Injection
- Display format: "2 tablet", "1 capsule", "5 ml"
- Required: Yes

**Field: Frequency***
- How often to take
- Options: Once daily, Twice daily, Thrice daily, Four times daily, Every alternate day, Weekly
- Required: Yes

**Field: Times to Take Medicine***
- Individual time inputs for each dose
- Format: HH:MM (24-hour format)
- Can add up to 4 times
- Example for "Twice daily": 08:00, 20:00
- Example for "Thrice daily": 08:00, 14:00, 20:00
- Use "+" button to add more times
- Use "Remove" button if too many
- Required: Yes (at least one time)

**Field: Special Instructions**
- Optional notes about taking the medicine
- Examples:
  - "Take with meals"
  - "Avoid dairy products"
  - "Take with water"
  - "Before bed"
- Required: No

## Data Persistence

All medicines are saved to Supabase database:
- ✅ Survives page refresh
- ✅ Accessible from dashboard
- ✅ Accessible from care plan
- ✅ Can be marked as taken
- ✅ Maintains adherence streak

## Display Format

### In Care Plan (List View)
```
Metformin (1 tablet)
Twice daily • 08:00, 20:00
📝 Take with meals
```

### In Care Plan (Table View)
| Medicine | Dose | Time | Frequency | Status | Action |
|----------|------|------|-----------|--------|--------|
| Metformin | 1 tablet | 08:00, 20:00 | Twice daily | Pending | Mark Taken |

### In Dashboard
```
Metformin (1 tablet)
at 08:00, 20:00
```

## Troubleshooting

### Medicine not saving?
1. Check if user is authenticated (log in again if needed)
2. Check browser console for error messages
3. Verify Supabase connection in `.env` file

### Old medicines not showing?
1. Database migration might not have run
2. Check Supabase SQL error messages
3. Verify columns exist in medications table

### Times not showing properly?
1. Ensure times are in HH:MM format (24-hour)
2. Check that `times` array field is populated in database

## API Response Example

When you add a medicine, it saves to database like this:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_id": "user-uuid-here",
  "name": "Metformin",
  "dose": "1 tablet",
  "quantity": 1,
  "unit": "tablet",
  "frequency": "Twice daily",
  "times": ["08:00", "20:00"],
  "notes": "Take with meals",
  "streak": 0,
  "is_active": true,
  "created_at": "2026-06-26T10:30:00Z"
}
```

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Test adding a medicine
3. ✅ Verify it appears in dashboard
4. ✅ Mark it as taken to test functionality

## Support

If you encounter issues:
1. Check `.kiro/specs/medicine-management/implementation.md` for technical details
2. Review Supabase logs for database errors
3. Check browser console for JavaScript errors
4. Verify environment variables in `.env` file
