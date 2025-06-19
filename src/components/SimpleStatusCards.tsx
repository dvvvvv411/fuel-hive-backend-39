
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Send, CreditCard } from 'lucide-react';

interface StatusData {
  pending: { today: number; total: number };
  confirmed: { today: number; total: number };
  invoiceSent: { today: number; total: number };
  paid: { today: number; total: number };
}

interface SimpleStatusCardsProps {
  statusStats: StatusData;
}

export function SimpleStatusCards({ statusStats }: SimpleStatusCardsProps) {
  const statusItems = [
    {
      title: 'Pending',
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      data: statusStats.pending
    },
    {
      title: 'Bestätigt',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      data: statusStats.confirmed
    },
    {
      title: 'Rechnung versendet',
      icon: Send,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      data: statusStats.invoiceSent
    },
    {
      title: 'Bezahlt',
      icon: CreditCard,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      data: statusStats.paid
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statusItems.map((item) => (
        <Card key={item.title} className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={`${item.bgColor} ${item.textColor} ${item.borderColor} text-lg px-3 py-1`}>
                {item.data.total}
              </Badge>
              <span className="text-sm text-gray-600">Gesamt</span>
            </div>
            <div className="text-sm text-gray-600">Heute: <span className="font-semibold">{item.data.today}</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
