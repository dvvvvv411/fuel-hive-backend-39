
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { ShopDialog } from './ShopDialog';
import { VATDisplay } from './VATDisplay';

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
  vat_rate: number | null;
}

interface ShopsTableProps {
  shops: Shop[];
  onShopsChange: () => void;
}

export function ShopsTable({ shops, onShopsChange }: ShopsTableProps) {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleEdit = (shop: Shop) => {
    setSelectedShop(shop);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (shop: Shop) => {
    if (!confirm(`Sind Sie sicher, dass Sie den Shop "${shop.name}" löschen möchten?`)) {
      return;
    }

    setLoading(shop.id);
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shop.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Shop wurde erfolgreich gelöscht',
      });

      onShopsChange();
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen des Shops',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const toggleStatus = async (shop: Shop) => {
    setLoading(shop.id);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ active: !shop.active })
        .eq('id', shop.id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: `Shop wurde ${!shop.active ? 'aktiviert' : 'deaktiviert'}`,
      });

      onShopsChange();
    } catch (error) {
      console.error('Error updating shop status:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren des Shop-Status',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getCountryName = (code: string) => {
    switch (code) {
      case 'DE': return 'Deutschland';
      case 'AT': return 'Österreich';
      case 'CH': return 'Schweiz';
      default: return code;
    }
  };

  const getCheckoutModeLabel = (mode: string) => {
    switch (mode) {
      case 'standard': return 'Standard';
      case 'express': return 'Express';
      case 'custom': return 'Benutzerdefiniert';
      default: return mode;
    }
  };

  return (
    <>
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Shops</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Heizöl-Shops und deren Konfiguration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Währung</TableHead>
                  <TableHead>MwSt-Satz</TableHead>
                  <TableHead>Checkout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shop.name}</div>
                        <div className="text-sm text-gray-500">{shop.company_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shop.company_name}</div>
                        <div className="text-sm text-gray-500">
                          {shop.company_city}, {shop.company_postcode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCountryName(shop.country_code)}</TableCell>
                    <TableCell>{shop.currency}</TableCell>
                    <TableCell>
                      <VATDisplay vatRate={shop.vat_rate} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCheckoutModeLabel(shop.checkout_mode)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={shop.active ? "default" : "secondary"}
                        className={shop.active 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        <div className="flex items-center gap-1">
                          {shop.active ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {shop.active ? 'Aktiv' : 'Inaktiv'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={loading === shop.id}
                          >
                            <span className="sr-only">Menü öffnen</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(shop)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(shop)}>
                            {shop.active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deaktivieren
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aktivieren
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(shop)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ShopDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        shop={selectedShop}
        onSuccess={() => {
          onShopsChange();
          setSelectedShop(null);
        }}
      />
    </>
  );
}
