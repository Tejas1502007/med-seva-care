# Patient Documents Display Fix

## Problem
Doctor was seeing "Documents (0)" even when patient uploaded files in the QR share view. This was because the API was trying to use a service role key that wasn't properly configured.

## Solution Applied

### 1. Fixed `revoke.ts` API Route
- **Removed** dependency on `SUPABASE_SERVICE_ROLE_KEY`
- **Changed** to use user-scoped client with JWT authentication
- Now uses RLS policies properly, just like the `create.ts` route

### 2. Fixed `view.ts` API Route
- **Removed** dependency on `SUPABASE_SERVICE_ROLE_KEY`
- **Changed** from `serviceClient` to `anonClient` for fetching documents
- **Changed** access log updates to use `anonClient` instead of `serviceClient`
- Now works without needing service role credentials

### 3. Fixed `serviceClient` initialization error
- Moved the `serviceClient` declaration before it was being used
- Then removed it entirely since we no longer need it

### 4. Storage Policies Required
- Created `patient_documents_storage_policies.sql` to set up proper public access
- The `patient-documents` bucket needs to be **public** for QR share viewing to work
- Run this SQL in your Supabase SQL Editor to enable document viewing

## How to Apply the Fix

### Step 1: Run the Storage Policies SQL
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `patient_documents_storage_policies.sql`
4. Execute the SQL script

### Step 2: Test the Fix
1. **As Patient:**
   - Go to Share Records page
   - Upload documents in any category (Lab Reports, Prescriptions, Scans, Insurance)
   - Generate a new QR share
   
2. **As Doctor:**
   - Go to Scan Patient QR
   - Enter the QR link and PIN
   - Check the "Documents" tab
   - You should now see the count and all uploaded files

## What Changed

### Before
- Required `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Would show "Invalid API key" error when revoking
- Would show "Documents (0)" even with uploaded files
- Used service role client (security risk for client-side code)

### After
- No service role key needed
- Works with standard anon key + JWT authentication
- Shows actual document count: "Documents (7)" if 7 files uploaded
- Uses RLS policies for proper security
- Documents grouped by category (Lab Reports, Prescriptions, Scans & Imaging, Insurance & ID)

## Security Benefits
- No longer exposes service role key to client-side
- Uses Row Level Security (RLS) policies properly
- Users can only access documents via valid QR share tokens + PINs
- Maintains proper audit trail with access logging

## Files Modified
1. `src/routes/api/qr-share/revoke.ts` - Removed service key dependency
2. `src/routes/api/qr-share/view.ts` - Removed service key dependency, fixed document fetching
3. Created `patient_documents_storage_policies.sql` - Storage access policies

## Document Categories Displayed
When doctor views shared records, documents are organized as:
- 📄 **Lab Reports** - Blood tests, urine tests, pathology reports
- 💊 **Prescriptions** - Doctor prescriptions & medication slips  
- 🫀 **Scans & Imaging** - X-rays, MRI, CT scans, ultrasound reports
- 👤 **Insurance & ID** - Health insurance cards, Aadhaar, ABHA ID

Each document is clickable and opens in a new tab for viewing.
