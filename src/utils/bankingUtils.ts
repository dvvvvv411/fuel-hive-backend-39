
import { supabase } from '@/integrations/supabase/client';

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const calculateDailyUsage = async (bankAccountId: string): Promise<number> => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, shops!inner(bank_account_id)')
      .eq('shops.bank_account_id', bankAccountId)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .in('status', ['confirmed', 'invoice_sent', 'paid']);

    if (error) {
      console.error('Error calculating daily usage:', error);
      return 0;
    }

    return data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  } catch (error) {
    console.error('Error calculating daily usage:', error);
    return 0;
  }
};

export const getDailyUsagePercentage = (usage: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.min((usage / limit) * 100, 100);
};
