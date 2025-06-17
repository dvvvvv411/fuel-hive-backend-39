
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
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
}

interface ShopsTableProps {
  shops: Shop[];
  onShopsChange: () => void;
}

export function ShopsTable({ shops, onShopsChange }: ShopsTableProps) {
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleActive = async (shop: Shop) => {
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
      console.error('Error toggling shop status:', error);
      toast({
        title: 'Fehler',
        description: 'Beim Ändern des Shop-Status ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setIsDialogOpen(true);
  };

  const handleDelete = async (shop: Shop) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Shop löschen möchten?')) {
      return;
    }

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
        description: 'Beim Löschen des Shops ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const getCheckoutModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      standard: 'Standard',
      express: 'Express',
      custom: 'Benutzerdefiniert',
    };
    return modes[mode] || mode;
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingShop(null);
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900">Shop Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Firma</TableHead>
              <TableHead className="font-semibold text-gray-900">Website</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Checkout-Modus</TableHead>
              <TableHead className="font-semibold text-gray-900">Währung</TableHead>
              <TableHead className="font-semibold text-gray-900">Aktiv</TableHead>
              <TableHead className="font-semibold text-gray-900 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shops.map((shop) => (
              <TableRow key={shop.id} className="border-b border-gray-100 hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  <div>
                    <div className="font-semibold">{shop.name}</div>
                    <div className="text-sm text-gray-500">{shop.company_email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  <div>
                    <div className="font-medium">{shop.company_name}</div>
                    <div className="text-sm text-gray-500">
                      {shop.company_city}, {shop.country_code}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  {shop.company_website ? (
                    <a 
                      href={shop.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {shop.company_website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={shop.active ? "default" : "secondary"}
                    className={
                      shop.active 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {shop.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-700">
                  <Badge variant="outline">
                    {getCheckoutModeLabel(shop.checkout_mode)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-700">
                  <span className="font-mono text-sm">{shop.currency}</span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={shop.active}
                    onCheckedChange={() => handleToggleActive(shop)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleEdit(shop)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(shop)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {shops.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">Keine Shops gefunden</p>
          </div>
        )}
      </div>

      <ShopDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        shop={editingShop}
        onSuccess={onShopsChange}
      />
    </>
  );
}
