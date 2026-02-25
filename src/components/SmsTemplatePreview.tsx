import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmsTemplatePreviewProps {
  selectedShopId: string | null;
  language: string;
}

const TEMPLATE_TYPES = [
  { value: 'order_confirmation', label: 'Bestellbestätigung' },
  { value: 'invoice', label: 'Rechnung' },
  { value: 'contact_attempt', label: 'Kontaktversuch' },
];

const SAMPLE_REPLACEMENTS: Record<string, string> = {
  '{firstName}': 'Max',
  '{lastName}': 'Mustermann',
  '{orderNumber}': '1234567',
  '{liters}': '1000',
  '{shopName}': 'HeizölShop',
  '{shopPhone}': '+49 123 456789',
};

export function SmsTemplatePreview({ selectedShopId, language }: SmsTemplatePreviewProps) {
  const [templateType, setTemplateType] = useState('order_confirmation');
  const [templateText, setTemplateText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplate();
  }, [selectedShopId, templateType, language]);

  const loadTemplate = async () => {
    try {
      // Try shop-specific first, then default
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('language', language)
        .or(selectedShopId ? `shop_id.eq.${selectedShopId},shop_id.is.null` : 'shop_id.is.null')
        .order('shop_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading SMS template:', error);
        return;
      }

      if (data) {
        setTemplateText(data.template_text);
        setOriginalText(data.template_text);
        setIsDefault(data.shop_id === null);
        setTemplateId(data.shop_id !== null ? data.id : null);
      } else {
        setTemplateText('');
        setOriginalText('');
        setIsDefault(true);
        setTemplateId(null);
      }
    } catch (err) {
      console.error('Error loading template:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedShopId) return;
    setSaving(true);

    try {
      if (templateId) {
        // Update existing shop-specific template
        const { error } = await supabase
          .from('sms_templates')
          .update({ template_text: templateText, updated_at: new Date().toISOString() })
          .eq('id', templateId);
        if (error) throw error;
      } else {
        // Create new shop-specific template (upsert)
        const { error } = await supabase
          .from('sms_templates')
          .upsert({
            shop_id: selectedShopId,
            template_type: templateType,
            template_text: templateText,
            language,
          }, { onConflict: 'shop_id,template_type,language' });
        if (error) throw error;
      }

      toast({ title: 'Gespeichert', description: 'SMS-Template wurde gespeichert.' });
      setOriginalText(templateText);
      setIsDefault(false);
      await loadTemplate();
    } catch (err: any) {
      console.error('Error saving template:', err);
      toast({ title: 'Fehler', description: 'Fehler beim Speichern.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const previewText = Object.entries(SAMPLE_REPLACEMENTS).reduce(
    (text, [key, value]) => text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value),
    templateText
  );

  const hasChanges = templateText !== originalText;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium mb-2">Template-Typ</label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Template-Text {isDefault && <span className="text-muted-foreground">(Default)</span>}
            </label>
            <span className={`text-xs ${templateText.length > 160 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              {templateText.length}/160 Zeichen
            </span>
          </div>
          <Textarea
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            rows={4}
            className="font-mono text-sm"
            placeholder="SMS Template Text..."
          />
          <p className="text-xs text-muted-foreground">
            Platzhalter: {'{firstName}'}, {'{lastName}'}, {'{orderNumber}'}, {'{liters}'}, {'{shopName}'}, {'{shopPhone}'}
          </p>
        </div>

        {templateText && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Vorschau</label>
            <div className="p-3 bg-muted rounded-lg text-sm font-mono border">
              {previewText}
            </div>
            <span className={`text-xs ${previewText.length > 160 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              Vorschau: {previewText.length}/160 Zeichen
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges || !selectedShopId} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
