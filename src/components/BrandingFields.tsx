
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BrandingFieldsProps {
  formData: any;
  onInputChange: (field: string, value: string | number) => void;
}

export function BrandingFields({ formData, onInputChange }: BrandingFieldsProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Fehler',
          description: 'Bitte wählen Sie eine Bild-Datei aus',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fehler',
          description: 'Die Datei ist zu groß. Maximale Größe: 5MB',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    setUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hochladen des Logos',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    onInputChange('logo_url', '');
  };

  const currentLogoUrl = formData.logo_url;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop-Branding</CardTitle>
        <CardDescription>
          Personalisieren Sie das Erscheinungsbild Ihres Shops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label>Shop-Logo</Label>
          
          {/* Current Logo Display */}
          {(currentLogoUrl || logoPreview) && (
            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
              <img
                src={logoPreview || currentLogoUrl}
                alt="Shop Logo"
                className="h-16 w-16 object-contain rounded border bg-white"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {logoFile ? 'Neues Logo (noch nicht gespeichert)' : 'Aktuelles Logo'}
                </p>
                <p className="text-xs text-gray-500">
                  {logoFile ? logoFile.name : 'Gespeichertes Logo'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentLogoUrl ? 'Logo ändern' : 'Logo hochladen'}
            </Button>
            {logoFile && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (logoPreview) {
                    const link = document.createElement('a');
                    link.href = logoPreview;
                    link.target = '_blank';
                    link.click();
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Unterstützte Formate: JPG, PNG, GIF. Maximale Größe: 5MB
          </p>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label htmlFor="accent_color">Akzentfarbe</Label>
          <div className="flex items-center space-x-3">
            <Input
              id="accent_color"
              type="color"
              value={formData.accent_color || '#2563eb'}
              onChange={(e) => onInputChange('accent_color', e.target.value)}
              className="w-16 h-10 p-1 border rounded cursor-pointer"
            />
            <Input
              type="text"
              placeholder="#2563eb"
              value={formData.accent_color || ''}
              onChange={(e) => onInputChange('accent_color', e.target.value)}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">
            Diese Farbe wird für Buttons und Akzente in Ihrem Shop verwendet
          </p>
        </div>

        {/* Support Phone */}
        <div className="space-y-2">
          <Label htmlFor="support_phone">Support-Telefon</Label>
          <Input
            id="support_phone"
            placeholder="+49 123 456-789"
            value={formData.support_phone || ''}
            onChange={(e) => onInputChange('support_phone', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Optionale Telefonnummer für Kundensupport (wird im Shop angezeigt)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
