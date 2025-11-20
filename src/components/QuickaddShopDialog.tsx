import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface QuickaddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: QuickaddData) => void;
}

export interface QuickaddData {
  name: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  company_address: string;
  company_city: string;
  company_postcode: string;
  vat_number: string;
  business_owner: string;
  court_name: string;
  registration_number: string;
  accent_color: string;
}

const parseQuickaddText = (text: string): QuickaddData => {
  const lines = text.split('\n').map(line => line.trim());
  
  return {
    name: lines[0] || '',
    company_name: lines[1] || '',
    company_email: lines[2] || '',
    company_phone: lines[3] || '',
    company_website: lines[4] || '',
    company_address: lines[5] || '',
    company_city: lines[6] || '',
    company_postcode: lines[7] || '',
    vat_number: lines[8] || '',
    business_owner: lines[9] || '',
    court_name: lines[10] || '',
    registration_number: lines[11] || '',
    accent_color: lines[12] || '#2563eb',
  };
};

export function QuickaddShopDialog({ open, onOpenChange, onConfirm }: QuickaddShopDialogProps) {
  const [inputText, setInputText] = useState('');

  const handleConfirm = () => {
    const lines = inputText.split('\n').filter(line => line.trim());
    
    if (lines.length < 13) {
      toast({
        title: 'Ungültige Eingabe',
        description: `Es werden 13 Zeilen erwartet, aber nur ${lines.length} gefunden.`,
        variant: 'destructive',
      });
      return;
    }

    const parsedData = parseQuickaddText(inputText);
    
    // Validate email
    if (parsedData.company_email && !parsedData.company_email.includes('@')) {
      toast({
        title: 'Ungültige E-Mail',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    // Validate accent color (hex format)
    if (parsedData.accent_color && !parsedData.accent_color.match(/^#[0-9A-Fa-f]{6}$/)) {
      toast({
        title: 'Ungültige Farbe',
        description: 'Die Akzentfarbe muss im Hex-Format sein (z.B. #2563eb).',
        variant: 'destructive',
      });
      return;
    }

    onConfirm(parsedData);
    setInputText('');
  };

  const handleCancel = () => {
    setInputText('');
    onOpenChange(false);
  };

  const lineCount = inputText.split('\n').filter(line => line.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>⚡ Quickadd - Shop Details</DialogTitle>
          <DialogDescription>
            Fügen Sie die Shop-Details ein (eine Zeile pro Feld). Es werden genau 13 Zeilen erwartet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Zeilen: {lineCount} / 13</span>
            {lineCount !== 13 && lineCount > 0 && (
              <span className="text-destructive">⚠️ 13 Zeilen erforderlich</span>
            )}
            {lineCount === 13 && (
              <span className="text-green-600">✓ Alle Zeilen vorhanden</span>
            )}
          </div>
          
          <Textarea
            placeholder={`Shop Name
Firmenname
E-Mail
Telefon
Website
Adresse
Stadt
Postleitzahl
USt-IdNr (USTID)
Geschäftsinhaber
Amtsgericht
Handelsregisternummer
Akzentfarbe (z.B. #2563eb)`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={16}
            className="font-mono text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={lineCount !== 13}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
