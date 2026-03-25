-- Create the workspace-data storage bucket for primary app data storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('workspace-data', 'workspace-data', false, 52428800, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- Allow any anon user to upload (insert) workspace data files
CREATE POLICY "Anyone can upload workspace data"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'workspace-data');

-- Allow any anon user to update workspace data files  
CREATE POLICY "Anyone can update workspace data"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'workspace-data');

-- Allow any anon user to read workspace data files
CREATE POLICY "Anyone can read workspace data"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'workspace-data');

-- Super admins can delete workspace data files (for admin panel)
CREATE POLICY "Super admins can delete workspace data"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'workspace-data' AND
  public.is_super_admin(auth.uid())
);