
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Truck, Gift } from 'lucide-react';

interface ProductData {
  standard: number;
  premium: number;
  avgLiters: number;
  freeDeliveries: number;
  paidDeliveries: number;
}

interface SimpleProductStatsProps {
  productStats: ProductData;
  totalOrders: number;
}

export function SimpleProductStats({ productStats, totalOrders }: SimpleProductStatsProps) {
  const freeDeliveryPercentage = totalOrders > 0 ? ((productStats.freeDeliveries / totalOrders) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Heizöl-Verkäufe */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Heizöl-Verkäufe</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-600">Standard:</span>
              <Badge variant="outline" className="bg-gray-50 text-lg px-3 py-1">
                {productStats.standard}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-600">Premium:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-lg px-3 py-1">
                {productStats.premium}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durchschnittliche Liter */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Ø Liter/Bestellung</CardTitle>
          <Droplets className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {productStats.avgLiters.toFixed(0)}L
          </div>
          <div className="text-base text-gray-600">pro Bestellung</div>
        </CardContent>
      </Card>

      {/* Kostenlose Lieferungen */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Kostenlose Lieferungen</CardTitle>
          <Gift className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {productStats.freeDeliveries}
          </div>
          <div className="text-base text-gray-600">
            {freeDeliveryPercentage}% aller Bestellungen
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
