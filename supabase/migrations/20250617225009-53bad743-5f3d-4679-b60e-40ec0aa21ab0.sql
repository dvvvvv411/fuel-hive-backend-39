
-- Erweitere shops-Tabelle um vat_rate Feld
ALTER TABLE public.shops 
ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 19.00;

-- Erweitere order_tokens-Tabelle um MwSt-Felder
ALTER TABLE public.order_tokens 
ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 19.00,
ADD COLUMN vat_amount DECIMAL(10,2) DEFAULT 0.00;

-- Kommentar für bessere Dokumentation
COMMENT ON COLUMN public.shops.vat_rate IS 'VAT rate in percentage (e.g., 19.00 for 19%)';
COMMENT ON COLUMN public.order_tokens.vat_rate IS 'VAT rate in percentage applied to this token';
COMMENT ON COLUMN public.order_tokens.vat_amount IS 'Calculated VAT amount for this token';
