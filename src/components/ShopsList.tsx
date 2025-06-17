
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Globe, Mail, Phone, MapPin } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="text-gray-600 mt-1">Manage your heating oil shops</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Get started by creating your first heating oil shop to begin managing your business
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Shop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{shop.name}</CardTitle>
                    <CardDescription className="text-gray-600">{shop.company_name}</CardDescription>
                  </div>
                  <Badge 
                    variant={shop.active ? "default" : "secondary"}
                    className={shop.active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                  >
                    {shop.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{shop.company_email}</span>
                  </div>
                  
                  {shop.company_phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{shop.company_phone}</span>
                    </div>
                  )}
                  
                  {shop.company_website && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{shop.company_website}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p>{shop.company_address}</p>
                      <p>{shop.company_postcode} {shop.company_city}</p>
                      <p>{shop.country_code}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="bg-gray-50 px-2 py-1 rounded">Currency: {shop.currency}</span>
                    <span className="bg-gray-50 px-2 py-1 rounded">Lang: {shop.language.toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
