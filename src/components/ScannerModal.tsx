import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { QrCode, Wifi, WifiOff, Copy, ExternalLink } from "lucide-react";

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  context: 'sales' | 'inventory';
  isConnected: boolean;
  status: 'connected' | 'reconnecting' | 'disconnected';
}

export function ScannerModal({ 
  open, 
  onOpenChange, 
  sessionId, 
  context,
  isConnected,
  status 
}: ScannerModalProps) {
  const scannerUrl = `${window.location.origin}/scan?session=${sessionId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(scannerUrl);
    toast.success("Scanner link copied to clipboard!");
  };

  const openInNewTab = () => {
    window.open(scannerUrl, '_blank');
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'reconnecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Reconnecting...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <WifiOff className="h-3 w-3 mr-1" />
            Waiting for connection
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Phone Scanner - {context === 'sales' ? 'Sales' : 'Inventory'}
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to use it as a barcode scanner
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Connection Status */}
          <div className="w-full flex justify-center">
            {getStatusBadge()}
          </div>

          {/* QR Code */}
          <div className="p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
            <QRCodeSVG 
              value={scannerUrl}
              size={200}
              level="M"
              includeMargin
            />
          </div>
          
          {/* Instructions */}
          <div className="text-center space-y-2 w-full">
            <p className="text-sm text-muted-foreground">
              Open your phone camera and scan the QR code
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyLink}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Link
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>

            {/* Status Message */}
            {isConnected && (
              <div className="text-xs text-green-600 font-medium pt-2">
                ✓ Phone connected! Start scanning barcodes
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
