import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Keyboard, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { BarcodeScanner } from "@/components/dialogs/BarcodeScanner";

export default function PhoneScanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId] = useState(searchParams.get("session") || "");
  const [context] = useState<'sales' | 'inventory'>(
    window.location.pathname.includes('inventory') ? 'inventory' : 'sales'
  );
  const [manualCode, setManualCode] = useState("");
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      toast.error("Invalid scanner session");
      navigate("/");
      return;
    }

    // Test connection
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('scanner_sessions' as any).select('session_id').limit(1);
        if (!error) {
          setIsConnected(true);
        }
      } catch (err) {
        setIsConnected(false);
        toast.error("Connection failed. Please check your internet connection.");
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 5000);

    return () => clearInterval(interval);
  }, [sessionId, navigate]);

  const sendBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      toast.error("Please enter a valid barcode");
      return;
    }

    try {
      const { error } = await supabase
        .from('scanned_barcodes' as any)
        .insert({
          session_id: sessionId,
          barcode: barcode.trim()
        });

      if (error) throw error;

      setScannedItems(prev => [barcode, ...prev.slice(0, 9)]);
      setManualCode("");
      setShowManualEntry(false);
      
      toast.success("✅ Barcode sent successfully!");
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (error: any) {
      console.error("Error sending barcode:", error);
      toast.error("Failed to send barcode. Please try again.");
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    sendBarcode(barcode);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendBarcode(manualCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* Header */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isConnected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">
              {context === 'sales' ? '🛒 Sales Scanner' : '📦 Inventory Scanner'}
            </CardTitle>
            <CardDescription>
              Scan barcodes to add items to {context === 'sales' ? 'cart' : 'inventory'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Scanner Options */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowManualEntry(!showManualEntry)}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              {showManualEntry ? 'Hide' : 'Show'} Manual Entry
            </Button>

            {showManualEntry && (
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter barcode manually..."
                  className="text-lg"
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                  Send Code
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Scanned Items History */}
        {scannedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recently Scanned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scannedItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <code className="text-sm font-mono">{item}</code>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-1">
                <p className="font-medium">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Keep this page open while scanning</li>
                  <li>Scanned items appear instantly on POS</li>
                  <li>Use manual entry if camera fails</li>
                  <li>Check connection status above</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
