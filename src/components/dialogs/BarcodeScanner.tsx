import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scan, Camera, StopCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string) => void;
}

export function BarcodeScanner({ onBarcodeScanned }: BarcodeScannerProps) {
  const [open, setOpen] = useState(true); // Auto-open
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>("");
  const { toast } = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const elementId = "barcode-scanner";
  
  // Auto-start scanning on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !scanning) {
      setTimeout(() => startScanning(), 500);
    }
  }, []);

  const sanitizeBarcode = (barcode: string): string => {
    // Remove any HTML tags and special characters, keep only alphanumeric and common barcode characters
    return barcode.replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 50);
  };

  const onScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log(`Barcode scanned: ${decodedText}`, decodedResult);
    
    // Sanitize the barcode input
    const sanitizedBarcode = sanitizeBarcode(decodedText);
    
    if (!sanitizedBarcode) {
      toast({
        title: "Invalid Barcode",
        description: "The scanned barcode contains invalid characters",
        variant: "destructive"
      });
      return;
    }
    
    setLastScanned(sanitizedBarcode);
    
    toast({
      title: "Barcode Scanned",
      description: `Scanned: ${sanitizedBarcode}`
    });

    // Stop scanning after successful scan
    stopScanning();
    
    // Pass sanitized barcode to parent component
    if (onBarcodeScanned) {
      onBarcodeScanned(sanitizedBarcode);
    }
    
    // Close dialog
    setOpen(false);
  };

  const onScanFailure = (error: string) => {
    // Handle scan failure silently or log for debugging
    console.warn(`Barcode scan error: ${error}`);
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      
      // Request camera permissions explicitly first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: "environment" } // Prefer back camera on mobile
        } 
      });
      
      // Stop the test stream after confirming permissions
      stream.getTracks().forEach(track => track.stop());
      
      // Now initialize the scanner with proper mobile settings
      scannerRef.current = new Html5QrcodeScanner(
        elementId,
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Mobile-optimized settings
          showTorchButtonIfSupported: true,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          videoConstraints: {
            facingMode: { ideal: "environment" } // Use back camera
          }
        },
        false
      );
      
      scannerRef.current.render(onScanSuccess, onScanFailure);
      
      toast({
        title: "Camera Ready",
        description: "Point camera at barcode to scan"
      });
    } catch (error: any) {
      console.error("Error starting scanner:", error);
      
      let errorMessage = "Please allow camera access to scan barcodes";
      
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Camera not supported. Please use HTTPS.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: "Camera Access Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error("Error stopping scanner:", error);
      });
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && scanning) {
      stopScanning();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          Scan Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Scan a barcode to automatically fill medicine information or search existing inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            {!scanning ? (
              <div className="space-y-4">
                <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Start Scanning" to activate your camera and scan barcodes
                  </p>
                  {lastScanned && (
                    <p className="text-sm font-medium">
                      Last scanned: <code className="bg-muted px-2 py-1 rounded">{lastScanned}</code>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div id={elementId} className="w-full"></div>
                <p className="text-sm text-muted-foreground">
                  Point your camera at a barcode to scan it
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          {!scanning ? (
            <Button onClick={startScanning}>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive">
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}