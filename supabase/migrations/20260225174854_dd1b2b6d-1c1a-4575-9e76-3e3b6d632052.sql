
-- Add resend fields directly to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS resend_api_key text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS resend_from_email text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS resend_from_name text;

-- Migrate existing data from resend_configs to shops
UPDATE shops s
SET resend_api_key = rc.resend_api_key,
    resend_from_email = rc.from_email,
    resend_from_name = rc.from_name
FROM resend_configs rc
WHERE s.resend_config_id = rc.id;
