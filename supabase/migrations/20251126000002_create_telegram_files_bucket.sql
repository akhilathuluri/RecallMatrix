-- Create Storage Bucket for Telegram Files
-- Migration: 20251126000002_create_telegram_files_bucket.sql

-- Create storage bucket for telegram attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'telegram-files',
  'telegram-files',
  true, -- Public bucket so files are accessible
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for telegram-files bucket
CREATE POLICY "Authenticated users can upload telegram files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view telegram files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'telegram-files');

CREATE POLICY "Users can update own telegram files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own telegram files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMENT ON TABLE storage.buckets IS 'Storage bucket for Telegram bot file attachments';
