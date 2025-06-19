
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  orderNumber: string;
}

export function PDFViewerDialog({ open, onOpenChange, pdfUrl, orderNumber }: PDFViewerDialogProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Rechnung_${orderNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleIframeLoad = () => {
    console.log('PDF loaded successfully');
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    console.error('PDF loading error for URL:', pdfUrl);
    setIsLoading(false);
    setLoadError(true);
  };

  const validatePdfUrl = (url: string) => {
    // Enhanced validation for PDF URLs
    if (!url) return false;
    
    // Check if it's a Supabase storage URL or contains PDF-related indicators
    const isSupabaseUrl = url.includes('supabase.co/storage');
    const hasPdfExtension = url.toLowerCase().includes('.pdf');
    const hasPdfMimeType = url.includes('application/pdf');
    
    return isSupabaseUrl || hasPdfExtension || hasPdfMimeType;
  };

  const isValidPdfUrl = validatePdfUrl(pdfUrl);

  // Reset loading state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setIsLoading(true);
      setLoadError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rechnung #{orderNumber}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!isValidPdfUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Neuer Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!isValidPdfUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 w-full h-[80vh] relative">
          {!isValidPdfUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF nicht verfügbar</h3>
              <p className="text-gray-600 mb-4">
                Die PDF-Datei konnte nicht geladen werden. Möglicherweise wurde sie noch nicht generiert oder die URL ist ungültig.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                URL: {pdfUrl}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Seite neu laden
              </Button>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fehler beim Laden der PDF</h3>
              <p className="text-gray-600 mb-4">
                Die PDF-Datei konnte nicht in der Vorschau angezeigt werden. Sie können versuchen, sie herunterzuladen oder in einem neuen Tab zu öffnen.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  In neuem Tab öffnen
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </Button>
                <Button onClick={() => {
                  setLoadError(false);
                  setIsLoading(true);
                }} variant="outline">
                  Erneut versuchen
                </Button>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">PDF wird geladen...</p>
                  </div>
                </div>
              )}
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-full border rounded-md"
                title={`Rechnung ${orderNumber}`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ 
                  minHeight: '600px',
                  display: isLoading ? 'none' : 'block'
                }}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
