
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  orderNumber: string;
}

export function PDFViewerDialog({ open, onOpenChange, pdfUrl, orderNumber }: PDFViewerDialogProps) {
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleIframeError = () => {
    console.error('PDF loading error for URL:', pdfUrl);
    setLoadError(true);
  };

  const validatePdfUrl = (url: string) => {
    // Basic validation to check if URL looks like a PDF
    return url && (url.includes('.pdf') || url.includes('application/pdf'));
  };

  const isValidPdfUrl = validatePdfUrl(pdfUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rechnung #{orderNumber}</span>
            <div className="flex items-center gap-2">
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
        
        <div className="flex-1 w-full h-[75vh]">
          {!isValidPdfUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF nicht verfügbar</h3>
              <p className="text-gray-600 mb-4">
                Die PDF-Datei konnte nicht geladen werden. Möglicherweise wurde sie noch nicht generiert oder die URL ist ungültig.
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
                Die PDF-Datei konnte nicht angezeigt werden. Sie können versuchen, sie herunterzuladen.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Trotzdem herunterladen
                </Button>
                <Button onClick={() => setLoadError(false)} variant="outline">
                  Erneut versuchen
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded-md"
              title={`Rechnung ${orderNumber}`}
              onError={handleIframeError}
              onLoad={() => setLoadError(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
