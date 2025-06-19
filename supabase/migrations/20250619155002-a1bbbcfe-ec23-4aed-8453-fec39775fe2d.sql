
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to delete invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete invoices" ON storage.objects;

-- Create storage bucket for invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Create new RLS policies for invoice storage
CREATE POLICY "Allow public read access to invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Allow service role to upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'service_role');

CREATE POLICY "Allow service role to update invoices"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.role() = 'service_role');

CREATE POLICY "Allow service role to delete invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.role() = 'service_role');
