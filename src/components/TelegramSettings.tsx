
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Send, Store } from 'lucide-react';
import { ShopMultiSelect } from './ShopMultiSelect';

interface TelegramChatId {
  id: string;
  chat_id: string;
  label: string | null;
  active: boolean;
  created_at: string;
  shops: { id: string; shop_id: string }[];
}

interface Shop {
  id: string;
  name: string;
}

export function TelegramSettings() {
  const [chatIds, setChatIds] = useState<TelegramChatId[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [newChatId, setNewChatId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [chatResult, shopResult] = await Promise.all([
      supabase.from('telegram_chat_ids').select('*'),
      supabase.from('shops').select('id, name').eq('active', true).order('name'),
    ]);

    if (chatResult.error) {
      toast.error('Fehler beim Laden der Chat-IDs');
      console.error(chatResult.error);
    }

    if (shopResult.error) {
      toast.error('Fehler beim Laden der Shops');
      console.error(shopResult.error);
    }

    // Load shop assignments for each chat id
    const chatIdsWithShops: TelegramChatId[] = [];
    if (chatResult.data) {
      for (const chat of chatResult.data) {
        const { data: shopAssignments } = await supabase
          .from('telegram_chat_id_shops')
          .select('id, shop_id')
          .eq('telegram_chat_id_id', chat.id);
        
        chatIdsWithShops.push({
          ...chat,
          shops: shopAssignments || [],
        });
      }
    }

    setChatIds(chatIdsWithShops);
    setShops(shopResult.data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newChatId.trim()) {
      toast.error('Bitte Chat-ID eingeben');
      return;
    }

    const { data: inserted, error } = await supabase
      .from('telegram_chat_ids')
      .insert({ chat_id: newChatId.trim(), label: newLabel.trim() || null })
      .select()
      .single();

    if (error) {
      toast.error('Fehler beim Hinzufügen: ' + error.message);
      return;
    }

    // Add shop assignments
    if (selectedShops.length > 0 && inserted) {
      const { error: shopError } = await supabase
        .from('telegram_chat_id_shops')
        .insert(selectedShops.map(shopId => ({
          telegram_chat_id_id: inserted.id,
          shop_id: shopId,
        })));

      if (shopError) {
        toast.error('Fehler beim Zuweisen der Shops: ' + shopError.message);
      }
    }

    toast.success('Chat-ID hinzugefügt');
    setNewChatId('');
    setNewLabel('');
    setSelectedShops([]);
    loadData();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('telegram_chat_ids')
      .update({ active })
      .eq('id', id);

    if (error) {
      toast.error('Fehler: ' + error.message);
      return;
    }
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('telegram_chat_ids')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen: ' + error.message);
      return;
    }
    toast.success('Chat-ID gelöscht');
    loadData();
  };

  const toggleShopSelection = (shopId: string) => {
    setSelectedShops(prev =>
      prev.includes(shopId)
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    );
  };

  const getShopName = (shopId: string) => {
    return shops.find(s => s.id === shopId)?.name || shopId;
  };

  const handleTestMessage = async (chatId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { test: true, test_chat_id: chatId },
      });
      if (error) throw error;
      toast.success('Testnachricht gesendet!');
    } catch (err: any) {
      toast.error('Fehler beim Senden: ' + (err.message || 'Unbekannter Fehler'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-[3px] border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
          Telegram Notifications
        </h1>
        <p className="text-muted-foreground mt-2">Verwalte Chat-IDs für Bestellbenachrichtigungen per Telegram</p>
      </div>

      {/* Add new Chat ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Neue Chat-ID hinzufügen</CardTitle>
          <CardDescription>Füge eine Telegram Chat-ID hinzu, die Benachrichtigungen erhalten soll</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chat-ID *</Label>
              <Input
                placeholder="z.B. 123456789"
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder="z.B. Hauptgruppe"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shops zuweisen (leer = alle Shops)</Label>
            <div className="flex flex-wrap gap-2">
              {shops.map(shop => (
                <Badge
                  key={shop.id}
                  variant={selectedShops.includes(shop.id) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleShopSelection(shop.id)}
                >
                  <Store className="h-3 w-3 mr-1" />
                  {shop.name}
                </Badge>
              ))}
            </div>
            {selectedShops.length === 0 && (
              <p className="text-xs text-muted-foreground">Keine Shops ausgewählt → Benachrichtigungen für alle Shops</p>
            )}
          </div>

          <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* List of Chat IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktive Chat-IDs</CardTitle>
          <CardDescription>{chatIds.length} Chat-ID(s) konfiguriert</CardDescription>
        </CardHeader>
        <CardContent>
          {chatIds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Keine Chat-IDs konfiguriert</p>
          ) : (
            <div className="space-y-4">
              {chatIds.map(chat => (
                <div key={chat.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{chat.chat_id}</span>
                      {chat.label && (
                        <Badge variant="secondary">{chat.label}</Badge>
                      )}
                      <Badge variant={chat.active ? 'default' : 'outline'}>
                        {chat.active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {chat.shops.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Alle Shops</span>
                      ) : (
                        chat.shops.map(s => (
                          <Badge key={s.id} variant="outline" className="text-xs">
                            <Store className="h-3 w-3 mr-1" />
                            {getShopName(s.shop_id)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestMessage(chat.chat_id)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={chat.active}
                      onCheckedChange={(checked) => handleToggleActive(chat.id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(chat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
