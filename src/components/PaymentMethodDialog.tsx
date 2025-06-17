
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const paymentMethodFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  code: z.string().min(1, 'Code ist erforderlich').regex(/^[a-z_]+$/, 'Code darf nur Kleinbuchstaben und Unterstriche enthalten'),
  description: z.string().optional(),
  active: z.boolean(),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod?: any;
  onSave: () => void;
}

export function PaymentMethodDialog({ open, onOpenChange, paymentMethod, onSave }: PaymentMethodDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!paymentMethod;

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (paymentMethod) {
        form.reset({
          name: paymentMethod.name || '',
          code: paymentMethod.code || '',
          description: paymentMethod.description || '',
          active: paymentMethod.active ?? true,
        });
      } else {
        form.reset({
          name: '',
          code: '',
          description: '',
          active: true,
        });
      }
    }
  }, [open, paymentMethod, form]);

  const onSubmit = async (values: PaymentMethodFormValues) => {
    setLoading(true);
    try {
      const paymentMethodData = {
        name: values.name,
        code: values.code,
        description: values.description || null,
        active: values.active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('payment_methods')
          .update(paymentMethodData)
          .eq('id', paymentMethod.id);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Zahlungsmethode wurde erfolgreich aktualisiert',
        });
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert(paymentMethodData);

        if (error) throw error;

        toast({
          title: 'Erfolg',
          description: 'Zahlungsmethode wurde erfolgreich erstellt',
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: 'Fehler',
        description: 'Beim Speichern der Zahlungsmethode ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Zahlungsmethode bearbeiten' : 'Neue Zahlungsmethode erstellen'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Bearbeiten Sie die Zahlungsmethoden-Informationen.' 
              : 'Erstellen Sie eine neue Zahlungsmethode für Ihre Shops.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Vorkasse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. bank_transfer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschreibung der Zahlungsmethode..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktiv</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Zahlungsmethode für Shops verfügbar machen
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Wird gespeichert...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
