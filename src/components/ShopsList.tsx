
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ShopsTable } from './ShopsTable';
import { ShopDialog } from './ShopDialog';

interface Shop {
  id: string;
  name: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_website: string | null;
  company_address: string;
  company_city: string;
  company_postcode: string;
  country_code: string;
  currency: string;
  language: string;
  active: boolean;
  checkout_mode: string;
  created_at: string;
  bank_account_id: string | null;
  resend_config_id: string | null;
  vat_number: string | null;
  court_name: string | null;
  business_owner: string | null;
  registration_number: string | null;
}

export function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Shops',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = () => {
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop-Verwaltung</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihre Heizöl-Shops</p>
        </div>
        <Button 
          onClick={handleAddShop}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Shop hinzufügen
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Noch keine Shops</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Erstellen Sie Ihren ersten Heizöl-Shop, um mit der Verwaltung Ihres Geschäfts zu beginnen
            </p>
            <Button 
              onClick={handleAddShop}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ersten Shop erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ShopsTable shops={shops} onShopsChange={fetchShops} />
      )}

      <ShopDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchShops}
      />
    </div>
  );
}
