import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Trash2, Package, Save, Camera, Loader2 } from "lucide-react";
import { BarcodeScanner } from "@/components/dialogs/BarcodeScanner";

interface ScannedItem {
  barcode: string;
  medicine_id: string | null;
  medicine_name: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  found: boolean;
}

export default function InventoryScanPreview() {
  const navigate = useNavigate();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scannerReady, setScannerReady] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBarcodeScan = async (barcode: string) => {
    setScannerReady(false);
    
    // Check if already scanned
    const existingIndex = scannedItems.findIndex(item => item.barcode === barcode);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...scannedItems];
      updated[existingIndex].quantity += 1;
      setScannedItems(updated);
      toast.success(`📦 Quantity increased for: ${updated[existingIndex].medicine_name}`);
    } else {
      // Search for medicine
      const { data: medicines, error } = await supabase
        .from("medicines")
        .select("*")
        .or(`barcode.eq.${barcode},id.eq.${barcode}`)
        .limit(1);

      if (error) {
        console.error("Error searching medicine:", error);
        toast.error("Error searching database");
      } else if (medicines && medicines.length > 0) {
        const med = medicines[0];
        setScannedItems([
          ...scannedItems,
          {
            barcode,
            medicine_id: med.id,
            medicine_name: med.name,
            quantity: 1,
            unit_cost: Number(med.buying_price) || 0,
            selling_price: Number(med.selling_price) || 0,
            found: true
          }
        ]);
        toast.success(`✅ Found: ${med.name}`);
      } else {
        // Unknown item
        setScannedItems([
          ...scannedItems,
          {
            barcode,
            medicine_id: null,
            medicine_name: "Unknown Item",
            quantity: 1,
            unit_cost: 0,
            selling_price: 0,
            found: false
          }
        ]);
        toast.info(`📝 Unknown item added: ${barcode}`);
      }
    }
    
    setTimeout(() => setScannerReady(true), 500);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updated = [...scannedItems];
    updated[index].quantity = quantity;
    setScannedItems(updated);
  };

  const updatePrice = (index: number, field: 'unit_cost' | 'selling_price', value: number) => {
    const updated = [...scannedItems];
    updated[index][field] = value;
    setScannedItems(updated);
  };

  const removeItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
    toast.info("Item removed");
  };

  const approveAndAddToInventory = async () => {
    if (scannedItems.length === 0) {
      toast.error("No items to approve");
      return;
    }

    const unknownItems = scannedItems.filter(item => !item.found);
    if (unknownItems.length > 0) {
      toast.error("Please resolve unknown items before approving");
      return;
    }

    setSaving(true);

    try {
      for (const item of scannedItems) {
        if (!item.medicine_id) continue;

        // Update stock quantity
        const { data: current } = await supabase
          .from("medicines")
          .select("stock_quantity")
          .eq("id", item.medicine_id)
          .single();

        if (current) {
          await supabase
            .from("medicines")
            .update({
              stock_quantity: current.stock_quantity + item.quantity,
              buying_price: item.unit_cost,
              selling_price: item.selling_price
            })
            .eq("id", item.medicine_id);
        }
      }

      toast.success(`🎉 ${scannedItems.length} items added to inventory!`);
      navigate("/inventory");
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📦 Inventory Scan Preview</h1>
            <p className="text-sm text-gray-600">Review and approve scanned items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              Cancel
            </Button>
            <Button
              onClick={approveAndAddToInventory}
              disabled={scannedItems.length === 0 || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Approve & Add to Inventory
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scanner Status */}
        <Card className={`mb-6 ${scannerReady ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${scannerReady ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-medium text-gray-900">
                  {scannerReady ? '✅ Scanner Ready' : '⏳ Processing...'}
                </span>
              </div>
              <Button onClick={() => setShowScanner(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Scan Barcode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Dialog */}
        {showScanner && (
          <div className="fixed inset-0 z-50">
            <BarcodeScanner 
              onBarcodeScanned={(code) => {
                handleBarcodeScan(code);
                setShowScanner(false);
              }} 
            />
          </div>
        )}

        {/* Scanned Items */}
        <div className="space-y-3">
          {scannedItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No items scanned yet</p>
                <p className="text-sm text-gray-500 mt-2">Start scanning to add items</p>
              </CardContent>
            </Card>
          ) : (
            scannedItems.map((item, index) => (
              <Card key={index} className={item.found ? 'border-green-200' : 'border-yellow-300 bg-yellow-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.found ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100">Unknown</Badge>
                        )}
                        <span className="font-medium">{item.medicine_name}</span>
                      </div>
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.barcode}
                      </code>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Qty</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-center"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Buying Price</label>
                        <Input
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => updatePrice(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-24 h-8"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Selling Price</label>
                        <Input
                          type="number"
                          value={item.selling_price}
                          onChange={(e) => updatePrice(index, 'selling_price', parseFloat(e.target.value) || 0)}
                          className="w-24 h-8"
                          step="0.01"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
