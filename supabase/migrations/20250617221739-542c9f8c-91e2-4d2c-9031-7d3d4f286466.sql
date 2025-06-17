
-- Erweitere shops-Tabelle um Branding-Felder
ALTER TABLE public.shops 
ADD COLUMN logo_url TEXT,
ADD COLUMN accent_color TEXT DEFAULT '#2563eb',
ADD COLUMN support_phone TEXT;

-- Erstelle Storage Bucket für Shop-Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-logos', 'shop-logos', true);

-- Erstelle RLS Policy für Shop-Logo Storage (öffentlicher Zugriff)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'shop-logos' );

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'shop-logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'shop-logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'shop-logos' AND auth.role() = 'authenticated' );
