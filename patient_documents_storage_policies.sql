-- Storage policies for patient-documents bucket
-- This allows public read access to patient documents for QR share viewing

-- First, make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can list patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Policy 1: Allow public to list files (needed for QR share viewing)
CREATE POLICY "Public can list patient documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents');

-- Policy 2: Allow public to read/download files (needed for QR share viewing)
CREATE POLICY "Public can read patient documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents');

-- Policy 3: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow authenticated users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
