
-- Erstelle payment_methods Tabelle
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle shop_payment_methods Tabelle (Many-to-Many)
CREATE TABLE public.shop_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, payment_method_id)
);

-- Erweitere orders Tabelle um payment_method_id
ALTER TABLE public.orders 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id);

-- Erstelle Standard-Zahlungsmethoden
INSERT INTO public.payment_methods (name, code, description) VALUES 
  ('Vorkasse', 'bank_transfer', 'Zahlung per Überweisung vor Lieferung'),
  ('Rechnung', 'invoice', 'Zahlung auf Rechnung nach Lieferung');

-- Erstelle Index für bessere Performance
CREATE INDEX idx_shop_payment_methods_shop_id ON public.shop_payment_methods(shop_id);
CREATE INDEX idx_shop_payment_methods_payment_method_id ON public.shop_payment_methods(payment_method_id);
CREATE INDEX idx_orders_payment_method_id ON public.orders(payment_method_id);
