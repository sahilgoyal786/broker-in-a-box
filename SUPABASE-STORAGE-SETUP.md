# Supabase Storage Setup for Certificates

## Create Storage Bucket

1. Go to Supabase Dashboard → Storage
   https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/storage/buckets

2. Click "New bucket"

3. Enter settings:
   - **Name**: `certificates`
   - **Public bucket**: ✅ YES (agents need to view their own certs)
   - **Allowed MIME types**: Leave empty (allows all file types)
   - **File size limit**: 5 MB

4. Click "Create bucket"

5. Set bucket policies (click "Policies" tab):
   - Allow authenticated users to upload to their own folder
   - Allow authenticated users to read their own files

## Storage Policies (RLS)

After creating the bucket, add these policies:

### Policy 1: Allow agents to upload their own certificates
```sql
CREATE POLICY "Agents can upload their own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' 
  AND (storage.foldername(name))[1] = 'agents'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Policy 2: Allow agents to read their own certificates
```sql
CREATE POLICY "Agents can read their own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = 'agents'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM agents WHERE auth_user_id = auth.uid()
  )
);
```

### Policy 3: Allow brokers to read all certificates
```sql
CREATE POLICY "Brokers can read all certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND EXISTS (
    SELECT 1 FROM brokers WHERE auth_user_id = auth.uid()
  )
);
```

## File Structure

Certificates will be stored as:
```
certificates/
└── agents/
    └── {agent_id}/
        ├── nar_code_of_ethics_1234567890.pdf
        └── nar_fair_housing_1234567891.jpg
```
