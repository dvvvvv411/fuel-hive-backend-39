
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  orderNumber: string;
}

export function PDFViewerDialog({ open, onOpenChange, pdfUrl, orderNumber }: PDFViewerDialogProps) {
  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

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
              >
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 w-full h-[75vh]">
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded-md"
            title={`Rechnung ${orderNumber}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
