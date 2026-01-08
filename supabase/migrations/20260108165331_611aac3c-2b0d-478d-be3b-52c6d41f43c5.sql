-- Add file_url column to prebooks for Rate Confirmation uploads
ALTER TABLE public.prebooks ADD COLUMN file_url TEXT;

-- Create storage bucket for prebook files
INSERT INTO storage.buckets (id, name, public) VALUES ('prebook-files', 'prebook-files', true);

-- Create storage policies for prebook files
CREATE POLICY "Users can upload their own prebook files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prebook-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own prebook files"
ON storage.objects FOR SELECT
USING (bucket_id = 'prebook-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prebook files"
ON storage.objects FOR DELETE
USING (bucket_id = 'prebook-files' AND auth.uid()::text = (storage.foldername(name))[1]);