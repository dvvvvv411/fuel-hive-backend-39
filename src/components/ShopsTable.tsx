
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Globe, Phone } from 'lucide-react';
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
  logo_url: string | null;
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

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'de': return 'Deutsch';
      case 'en': return 'English';
      case 'fr': return 'Français';
      default: return code;
    }
  };

  const getCheckoutModeLabel = (mode: string) => {
    switch (mode) {
      case 'standard': return 'Standard';
      case 'express': return 'Express';
      case 'custom': return 'Benutzerdefiniert';
      case 'instant': return 'Sofort';
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
                  <TableHead>Logo</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Sprache</TableHead>
                  <TableHead>Checkout-Modus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {shop.logo_url ? (
                          <img 
                            src={shop.logo_url} 
                            alt={`${shop.company_name} Logo`}
                            className="h-24 w-24 object-contain rounded"
                          />
                        ) : (
                          <div className="h-24 w-24 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-lg text-gray-400 font-medium">
                              {shop.company_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shop.company_name}</div>
                        <div className="text-sm text-gray-500">{shop.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{shop.company_email}</div>
                    </TableCell>
                    <TableCell>
                      {shop.company_phone ? (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {shop.company_phone}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">LEER</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {shop.company_website ? (
                        <a 
                          href={shop.company_website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getCountryName(shop.country_code)}</TableCell>
                    <TableCell>{getLanguageName(shop.language)}</TableCell>
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
