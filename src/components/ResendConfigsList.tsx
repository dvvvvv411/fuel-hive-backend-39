
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResendConfigDialog } from '@/components/ResendConfigDialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';

interface ResendConfig {
  id: string;
  config_name: string;
  resend_api_key: string;
  from_email: string;
  from_name: string;
  active: boolean;
  created_at: string;
}

export function ResendConfigsList() {
  const [configs, setConfigs] = useState<ResendConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ResendConfig | undefined>();

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('resend_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching resend configs:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Resend-Konfigurationen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleEdit = (config: ResendConfig) => {
    setSelectedConfig(config);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Konfiguration löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resend_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Resend-Konfiguration wurde gelöscht',
      });

      fetchConfigs();
    } catch (error) {
      console.error('Error deleting resend config:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen der Resend-Konfiguration',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('resend_configs')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: `Konfiguration wurde ${!active ? 'aktiviert' : 'deaktiviert'}`,
      });

      fetchConfigs();
    } catch (error) {
      console.error('Error toggling resend config:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Ändern der Konfiguration',
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedConfig(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">Resend-Konfigurationen</h1>
          <p className="text-gray-500 mt-2">Verwalten Sie Ihre E-Mail-Konfigurationen für den Versand</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Neue Konfiguration
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-orange-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Konfigurationen vorhanden</h3>
            <p className="text-gray-500 text-center mb-4">
              Erstellen Sie Ihre erste Resend-Konfiguration, um E-Mails versenden zu können.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Konfiguration erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {configs.map((config) => (
            <Card key={config.id} className="bg-white/80 backdrop-blur-sm shadow-md shadow-gray-200/50 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {config.config_name}
                    </CardTitle>
                    <CardDescription>
                      {config.from_name} ({config.from_email})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.active ? 'default' : 'secondary'}>
                      {config.active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(config.id, config.active)}
                    >
                      {config.active ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">API-Schlüssel:</span>
                    <p className="text-gray-900">*********************{config.resend_api_key.slice(-4)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Erstellt am:</span>
                    <p className="text-gray-900">
                      {new Date(config.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResendConfigDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        config={selectedConfig}
        onSave={() => {
          fetchConfigs();
          handleDialogClose();
        }}
      />
    </div>
  );
}
