
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface LargeMetricCardProps {
  title: string;
  mainValue: string;
  secondaryValue: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function LargeMetricCard({ 
  title, 
  mainValue, 
  secondaryValue, 
  icon: Icon, 
  iconColor, 
  iconBgColor 
}: LargeMetricCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium text-gray-600">{title}</CardTitle>
        <div className={`h-12 w-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="text-5xl font-bold text-gray-900 mb-3">{mainValue}</div>
        <div className="text-lg text-gray-600">{secondaryValue}</div>
      </CardContent>
    </Card>
  );
}
