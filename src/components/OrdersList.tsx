import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { OrdersTable } from './OrdersTable';

export function OrdersList() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Fetch ready orders count (only for special user)
  useEffect(() => {
    if (currentUser?.id === '70156cbe-8d83-4b7c-b421-3bbe6ca71298') {
      fetchReadyCount();
    }
  }, [currentUser]);

  const fetchReadyCount = async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready');

      if (error) throw error;
      setReadyCount(count || 0);
    } catch (error) {
      console.error('Error fetching ready count:', error);
    }
  };

  const handleBadgeClick = () => {
    // Toggle: Wenn Filter aktiv ist, dann zurücksetzen, sonst auf 'ready' setzen
    if (statusFilter.length > 0) {
      setStatusFilter([]);
    } else {
      setStatusFilter(['ready']);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">Bestellungen</h2>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">Verwalten Sie alle Heizöl-Bestellungen</p>
              {currentUser?.id === '70156cbe-8d83-4b7c-b421-3bbe6ca71298' && (
                <Badge 
                  onClick={handleBadgeClick}
                  className={`${
                    statusFilter.includes('ready') 
                      ? 'bg-cyan-700 hover:bg-cyan-800' 
                      : 'bg-cyan-500 hover:bg-cyan-600'
                  } text-white cursor-pointer transition-colors`}
                >
                  {readyCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrdersTable initialStatusFilter={statusFilter} />
    </div>
  );
}
