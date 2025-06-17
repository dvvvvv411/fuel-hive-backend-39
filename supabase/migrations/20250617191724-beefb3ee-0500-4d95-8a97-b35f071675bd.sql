
-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true);

-- Create RLS policies for invoice storage
CREATE POLICY "Allow public read access to invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to update invoices"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to delete invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.role() = 'service_role');
