import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface BarcodeGeneratorDialogProps {
  medicineId?: string;
  medicineName?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}

export function BarcodeGeneratorDialog({
  medicineId,
  medicineName,
  onBarcodeGenerated,
}: BarcodeGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [customBarcode, setCustomBarcode] = useState("");
  
  // Generate barcode based on medicine ID or custom input
  const generatedBarcode = customBarcode || medicineId || "";

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(generatedBarcode);
    toast.success("Barcode copied to clipboard!");
  };

  const handleDownloadQR = () => {
    // Get the SVG element
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    // Convert SVG to image and download
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `barcode-${medicineName || generatedBarcode}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("QR code downloaded!");
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSaveBarcode = () => {
    if (onBarcodeGenerated && generatedBarcode) {
      onBarcodeGenerated(generatedBarcode);
      setOpen(false);
      toast.success("Barcode assigned to medicine!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="h-4 w-4" />
          Generate Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode & QR Code Generator
          </DialogTitle>
          <DialogDescription>
            {medicineName
              ? `Generate and print barcode for ${medicineName}`
              : "Generate a custom barcode or QR code"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Custom Barcode Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-barcode">Custom Barcode (Optional)</Label>
            <Input
              id="custom-barcode"
              placeholder="Enter custom barcode or leave empty to use medicine ID"
              value={customBarcode}
              onChange={(e) => setCustomBarcode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate based on medicine ID
            </p>
          </div>

          {/* QR Code Display */}
          {generatedBarcode && (
            <div className="flex flex-col items-center space-y-4 p-6 bg-muted/30 rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCode
                  id="qr-code-svg"
                  value={generatedBarcode}
                  size={200}
                  level="H"
                />
              </div>

              {/* Barcode Text */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Barcode Value:</p>
                <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                  {generatedBarcode}
                </code>
              </div>

              {/* Medicine Name */}
              {medicineName && (
                <p className="text-sm font-medium text-center">{medicineName}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyBarcode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadQR}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="font-medium text-blue-900 dark:text-blue-100">How to use:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Download the QR code and print it</li>
              <li>Stick the printed barcode on the medicine packaging</li>
              <li>Use your scanner to scan the barcode during sales or inventory</li>
              <li>The barcode will be permanently linked to this medicine</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {onBarcodeGenerated && (
            <Button onClick={handleSaveBarcode} disabled={!generatedBarcode}>
              Save & Assign Barcode
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
