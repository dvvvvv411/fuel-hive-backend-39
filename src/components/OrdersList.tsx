
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OrdersTable } from './OrdersTable';

export function OrdersList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bestellungen</h2>
          <p className="text-gray-600">Verwalten Sie alle Heizöl-Bestellungen</p>
        </div>
      </div>

      <OrdersTable />
    </div>
  );
}
