
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrdersTable } from './OrdersTable';

export function OrdersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Daten aktualisiert",
        description: "Die Bestellungen wurden erfolgreich aktualisiert.",
      });
    }, 1500);
  };

  const handleExport = () => {
    toast({
      title: "Export gestartet",
      description: "Die Bestellungen werden als CSV-Datei exportiert.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bestellungen</h2>
          <p className="text-gray-600">Verwalten Sie alle Heizöl-Bestellungen und deren Status</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            <Download className="h-4 w-4" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="glass-card border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Bestellungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            {/* Filter Button */}
            <Button variant="outline" className="gap-2 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">1,234</div>
              <div className="text-sm text-gray-500">Gesamt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">856</div>
              <div className="text-sm text-gray-500">Abgeschlossen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">234</div>
              <div className="text-sm text-gray-500">In Bearbeitung</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">144</div>
              <div className="text-sm text-gray-500">Ausstehend</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="glass-card border-0 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Bestellübersicht
              </CardTitle>
              <CardDescription className="text-gray-600">
                Detaillierte Auflistung aller Bestellungen mit Statusverfolgung
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {isLoading ? 'Wird geladen...' : '1,234 Bestellungen'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable />
        </CardContent>
      </Card>
    </div>
  );
}
