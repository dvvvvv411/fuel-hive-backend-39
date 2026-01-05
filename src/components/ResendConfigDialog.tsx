
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface ResendConfig {
  id: string;
  config_name: string;
  resend_api_key: string;
  from_email: string;
  from_name: string;
  active: boolean;
}

interface ResendConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ResendConfig;
  onSave: (newConfigId?: string) => void;
}

export function ResendConfigDialog({ open, onOpenChange, config, onSave }: ResendConfigDialogProps) {
  const [formData, setFormData] = useState({
    resend_api_key: '',
    from_email: '',
    from_name: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        resend_api_key: config.resend_api_key,
        from_email: config.from_email,
        from_name: config.from_name,
        active: config.active,
      });
    } else {
      setFormData({
        resend_api_key: '',
        from_email: '',
        from_name: '',
        active: true,
      });
    }
  }, [config, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // config_name wird automatisch vom from_name übernommen
    const dataToSave = {
      ...formData,
      config_name: formData.from_name,
    };

    try {
      if (config) {
        const { error } = await supabase
          .from('resend_configs')
          .update(dataToSave)
          .eq('id', config.id);

        if (error) throw error;
        toast({
          title: 'Erfolg',
          description: 'Resend-Konfiguration wurde aktualisiert',
        });
        onSave();
      } else {
        const { data, error } = await supabase
          .from('resend_configs')
          .insert([dataToSave])
          .select('id')
          .single();

        if (error) throw error;
        toast({
          title: 'Erfolg',
          description: 'Resend-Konfiguration wurde erstellt',
        });
        onSave(data.id);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving resend config:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern der Resend-Konfiguration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Resend-Konfiguration bearbeiten' : 'Neue Resend-Konfiguration'}
          </DialogTitle>
          <DialogDescription>
            {config ? 'Bearbeiten Sie die Resend-Konfiguration' : 'Fügen Sie eine neue Resend-Konfiguration hinzu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="resend_api_key">Resend API-Key</Label>
            <Input
              id="resend_api_key"
              type="password"
              value={formData.resend_api_key}
              onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
              placeholder="re_xxxxxxxxxx"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_email">Absender-Email</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                placeholder="noreply@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="from_name">Absender-Name</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                placeholder="Ihr Unternehmen"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Aktiv</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
