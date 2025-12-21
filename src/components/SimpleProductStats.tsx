
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
      <Card className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500">Heizöl-Verkäufe</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500">Standard:</span>
              <Badge variant="outline" className="bg-gray-50 text-lg px-4 py-1.5 rounded-full font-semibold">
                {productStats.standard}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500">Premium:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-lg px-4 py-1.5 rounded-full font-semibold shadow-sm">
                {productStats.premium}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durchschnittliche Liter */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500">Ø Liter/Bestellung</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Droplets className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {productStats.avgLiters.toFixed(0)}L
          </div>
          <div className="text-base text-gray-500">pro Bestellung</div>
        </CardContent>
      </Card>

      {/* Kostenlose Lieferungen */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500">Kostenlose Lieferungen</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Gift className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {productStats.freeDeliveries}
          </div>
          <div className="text-base text-gray-500">
            {freeDeliveryPercentage}% aller Bestellungen
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
