
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Globe, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  created_at: string;
}

export function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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
        title: 'Error',
        description: 'Failed to fetch shops',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading shops...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shops</h2>
          <p className="text-gray-600">Manage your heating oil shops</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by creating your first heating oil shop
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription>{shop.company_name}</CardDescription>
                  </div>
                  <Badge variant={shop.active ? "default" : "secondary"}>
                    {shop.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {shop.company_email}
                </div>
                
                {shop.company_phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {shop.company_phone}
                  </div>
                )}
                
                {shop.company_website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    {shop.company_website}
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <p>{shop.company_address}</p>
                  <p>{shop.company_postcode} {shop.company_city}</p>
                  <p>{shop.country_code}</p>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Currency: {shop.currency}</span>
                  <span>Language: {shop.language.toUpperCase()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
