-- ============================================================
-- MedSeva — Update Medications Table Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

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

-- Update database types in your application
-- The application needs to regenerate types with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
