
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentMethodDialog } from '@/components/PaymentMethodDialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export function PaymentMethodsList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Zahlungsmethoden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Zahlungsmethode löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Zahlungsmethode wurde gelöscht',
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen der Zahlungsmethode',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: `Zahlungsmethode wurde ${!active ? 'aktiviert' : 'deaktiviert'}`,
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Ändern der Zahlungsmethode',
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPaymentMethod(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zahlungsmethoden</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie verfügbare Zahlungsmethoden</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Zahlungsmethode
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Zahlungsmethoden vorhanden</h3>
            <p className="text-gray-500 text-center mb-4">
              Erstellen Sie Ihre erste Zahlungsmethode, um Bestellungen zu ermöglichen.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Zahlungsmethode erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {paymentMethods.map((paymentMethod) => (
            <Card key={paymentMethod.id} className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {paymentMethod.name}
                    </CardTitle>
                    <CardDescription>
                      Code: {paymentMethod.code}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentMethod.active ? 'default' : 'secondary'}>
                      {paymentMethod.active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(paymentMethod.id, paymentMethod.active)}
                    >
                      {paymentMethod.active ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(paymentMethod)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(paymentMethod.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {paymentMethod.description && (
                <CardContent>
                  <p className="text-gray-600">{paymentMethod.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <PaymentMethodDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        paymentMethod={selectedPaymentMethod}
        onSave={() => {
          fetchPaymentMethods();
          handleDialogClose();
        }}
      />
    </div>
  );
}
