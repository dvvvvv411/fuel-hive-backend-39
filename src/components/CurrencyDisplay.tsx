import { formatCurrencyTwoLine } from '@/utils/bankingUtils';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  eurAmount?: number;
}

export function CurrencyDisplay({ amount, currency, eurAmount }: CurrencyDisplayProps) {
  const { mainAmount, eurAmount: eurDisplay } = formatCurrencyTwoLine(amount, currency, eurAmount);

  return (
    <div className="space-y-0.5">
      <div className="font-medium">{mainAmount}</div>
      {eurDisplay && (
        <div className="text-sm text-muted-foreground">{eurDisplay}</div>
      )}
    </div>
  );
}