
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
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold text-gray-500 tracking-wide">{title}</CardTitle>
        <div className={`h-12 w-12 rounded-xl ${iconBgColor} flex items-center justify-center shadow-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{mainValue}</div>
        <div className="text-base text-gray-500">{secondaryValue}</div>
      </CardContent>
    </Card>
  );
}
