
import { supabase } from '@/integrations/supabase/client';

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const calculateDailyUsage = async (bankAccountId: string): Promise<number> => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('selected_bank_account_id', bankAccountId)
      .eq('invoice_date', todayString)
      .eq('invoice_pdf_generated', true)
      .in('status', ['confirmed', 'invoice_sent', 'paid']);

    if (error) {
      console.error('Error calculating daily usage:', error);
      return 0;
    }

    return data?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
  } catch (error) {
    console.error('Error calculating daily usage:', error);
    return 0;
  }
};

export const getDailyUsagePercentage = (usage: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.min((usage / limit) * 100, 100);
};
