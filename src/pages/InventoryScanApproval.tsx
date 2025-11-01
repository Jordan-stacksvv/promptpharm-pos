import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Package, Loader2, AlertCircle } from "lucide-react";

interface ScannedInventoryItem {
  barcode: string;
  medicine?: any;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  found: boolean;
  batchNumber?: string;
  expiryDate?: string;
}

export default function InventoryScanApproval() {
  const navigate = useNavigate();
  const [scannedItems, setScannedItems] = useState<ScannedInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load scanned items from session storage or props
  useEffect(() => {
    const savedItems = sessionStorage.getItem("pendingInventoryScans");
    if (savedItems) {
      setScannedItems(JSON.parse(savedItems));
    }
  }, []);

  const updateQuantity = (index: number, quantity: number) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

  const updatePrice = (index: number, field: "unitCost" | "sellingPrice", value: number) => {
    setScannedItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const updateBatchNumber = (index: number, batchNumber: string) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, batchNumber } : item))
    );
  };

  const updateExpiryDate = (index: number, expiryDate: string) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, expiryDate } : item))
    );
  };

  const removeItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const approveAndAddToInventory = async () => {
    // Validate all items have been found
    const unknownItems = scannedItems.filter(item => !item.found);
    if (unknownItems.length > 0) {
      toast.error(`Please resolve ${unknownItems.length} unknown item(s) before approving`);
      return;
    }

    // Validate required fields
    for (const item of scannedItems) {
      if (!item.batchNumber || !item.expiryDate) {
        toast.error("All items must have batch number and expiry date");
        return;
      }
    }

    setLoading(true);

    try {
      // Update stock quantities and prices in database
      for (const item of scannedItems) {
        const { error } = await supabase
          .from("medicines")
          .update({
            stock_quantity: (item.medicine.stock_quantity || 0) + item.quantity,
            buying_price: item.unitCost,
            selling_price: item.sellingPrice,
            batch_number: item.batchNumber,
            expiry_date: item.expiryDate,
          })
          .eq("id", item.medicine.id);

        if (error) throw error;
      }

      toast.success("✅ All scanned items added to inventory successfully!");
      sessionStorage.removeItem("pendingInventoryScans");
      navigate("/inventory");
    } catch (error: any) {
      console.error("Error adding to inventory:", error);
      toast.error(`Failed to add items to inventory: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Review Scanned Items</h1>
            <p className="text-muted-foreground">
              Review and approve {scannedItems.length} scanned item(s) before adding to inventory
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/inventory")}>
            Cancel
          </Button>
          <Button
            onClick={approveAndAddToInventory}
            disabled={loading || scannedItems.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding to Inventory...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve & Add to Inventory
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scanned Items List */}
      {scannedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Items Scanned Yet</h3>
            <p className="text-muted-foreground mb-4">
              Return to inventory and start scanning items
            </p>
            <Button onClick={() => navigate("/inventory")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scannedItems.map((item, index) => (
            <Card
              key={index}
              className={`${
                !item.found
                  ? "border-2 border-red-300 bg-red-50"
                  : "border-green-200 bg-green-50/50"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {item.found ? item.medicine.name : "Unknown Item"}
                    </CardTitle>
                    {item.found ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        Found
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Barcode: {item.barcode}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`unitCost-${index}`}>Unit Cost</Label>
                    <Input
                      id={`unitCost-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) =>
                        updatePrice(index, "unitCost", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`sellingPrice-${index}`}>Selling Price</Label>
                    <Input
                      id={`sellingPrice-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={(e) =>
                        updatePrice(index, "sellingPrice", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost</Label>
                    <Input
                      value={`GHS ${(item.quantity * item.unitCost).toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {item.found && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`batch-${index}`}>Batch Number *</Label>
                      <Input
                        id={`batch-${index}`}
                        value={item.batchNumber || ""}
                        onChange={(e) => updateBatchNumber(index, e.target.value)}
                        placeholder="e.g., BATCH001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`expiry-${index}`}>Expiry Date *</Label>
                      <Input
                        id={`expiry-${index}`}
                        type="date"
                        value={item.expiryDate || ""}
                        onChange={(e) => updateExpiryDate(index, e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!item.found && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      This item was not found in the database. Please add it manually or remove it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
