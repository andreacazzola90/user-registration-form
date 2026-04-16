-- Create storage bucket for slide images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'slide-images',
  'slide-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admins) to upload images
CREATE POLICY "Authenticated users can upload slide images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'slide-images'
    AND (storage.foldername(name))[1] = 'slides'
  );

-- Allow authenticated users to update their own uploaded images
CREATE POLICY "Authenticated users can update slide images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'slide-images'
    AND (storage.foldername(name))[1] = 'slides'
  )
  WITH CHECK (
    bucket_id = 'slide-images'
    AND (storage.foldername(name))[1] = 'slides'
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete slide images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'slide-images'
    AND (storage.foldername(name))[1] = 'slides'
  );

-- Allow public read access to slide images (they are meant to be public)
CREATE POLICY "Public can view slide images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'slide-images');
