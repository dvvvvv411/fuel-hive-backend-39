
-- Add sms_sender_name to shops
ALTER TABLE shops ADD COLUMN sms_sender_name text;

-- Update existing shops with SMS sender names
UPDATE shops SET sms_sender_name = 'SmartHeizol' WHERE name ILIKE '%smartheiz%';
UPDATE shops SET sms_sender_name = 'HillHeizoel' WHERE name ILIKE '%hill%';
UPDATE shops SET sms_sender_name = 'HeizolAT' WHERE name ILIKE '%austria%';
UPDATE shops SET sms_sender_name = 'TotalEnerg' WHERE name ILIKE '%total%';
UPDATE shops SET sms_sender_name = 'Fioul24' WHERE name ILIKE '%fioul%';
UPDATE shops SET sms_sender_name = 'ELREYHeizol' WHERE name ILIKE '%elrey%';
UPDATE shops SET sms_sender_name = 'CDRHeizoel' WHERE name ILIKE '%cdr%';
UPDATE shops SET sms_sender_name = 'Blueline' WHERE name ILIKE '%blueline%';
UPDATE shops SET sms_sender_name = 'Marsell' WHERE name ILIKE '%marsell%';
UPDATE shops SET sms_sender_name = 'Knobloch' WHERE name ILIKE '%knobloch%';

-- Create sms_templates table
CREATE TABLE sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id),
  template_type text NOT NULL,
  template_text text NOT NULL,
  language text NOT NULL DEFAULT 'de',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, template_type, language)
);

-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates
CREATE POLICY "Allow authenticated users to view sms_templates" ON sms_templates FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to insert sms_templates" ON sms_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to update sms_templates" ON sms_templates FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to delete sms_templates" ON sms_templates FOR DELETE USING (auth.role() = 'authenticated'::text);

-- Insert default templates (shop_id = NULL)
INSERT INTO sms_templates (shop_id, template_type, template_text, language) VALUES
  (NULL, 'order_confirmation', 'Hallo {firstName} {lastName}, Ihre Bestellung #{orderNumber} ueber {liters}L wurde bestaetigt. Vielen Dank! Ihr {shopName}-Team', 'de'),
  (NULL, 'invoice', 'Hallo {firstName} {lastName}, Ihre Rechnung zu Bestellung #{orderNumber} wurde per E-Mail versendet. Bitte pruefen Sie Ihr Postfach. {shopName}', 'de'),
  (NULL, 'contact_attempt', 'Hallo {firstName} {lastName}, wir konnten Sie zu Bestellung #{orderNumber} nicht erreichen. Bitte rufen Sie uns an: {shopPhone}. {shopName}', 'de');
