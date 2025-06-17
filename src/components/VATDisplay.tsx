
import { Badge } from '@/components/ui/badge';

interface VATDisplayProps {
  vatRate: number | null;
}

export function VATDisplay({ vatRate }: VATDisplayProps) {
  if (vatRate === null || vatRate === undefined) {
    return <Badge variant="outline">Nicht festgelegt</Badge>;
  }

  const getVATLabel = (rate: number) => {
    switch (rate) {
      case 0:
        return 'Steuerbefreit';
      case 7:
        return 'Ermäßigt';
      case 19:
        return 'Regelsteuersatz';
      case 20:
        return 'AT Standard';
      case 7.7:
        return 'CH Standard';
      case 21:
        return 'NL/BE Standard';
      case 25:
        return 'DK/SE Standard';
      default:
        return 'Benutzerdefiniert';
    }
  };

  const getVATColor = (rate: number) => {
    if (rate === 0) return 'bg-gray-100 text-gray-800';
    if (rate >= 15 && rate <= 21) return 'bg-blue-100 text-blue-800';
    if (rate > 21) return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge className={getVATColor(vatRate)}>
        {vatRate}%
      </Badge>
      <span className="text-xs text-gray-500">
        {getVATLabel(vatRate)}
      </span>
    </div>
  );
}
