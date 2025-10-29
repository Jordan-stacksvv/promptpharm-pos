"use client";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Smartphone,
  AlertTriangle,
  Scan,
  ShieldCheck,
  Stethoscope,
  QrCode,
  CheckCircle,
  Loader2,
  Camera,
  Usb
} from "lucide-react";
import { usePhoneScanner } from "@/hooks/usePhoneScanner";
import { ScannerModal } from "@/components/ScannerModal";
import { BarcodeScanner } from "@/components/dialogs/BarcodeScanner";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  selling_price: number;
  stock_quantity: number;
  expiry_date: string | null;
  category: string;
  barcode?: string;
  brand?: string;
}

interface CartItem extends Medicine {
  quantity: number;
  verified: boolean;
}

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditionInput, setConditionInput] = useState("");
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showScannerOptions, setShowScannerOptions] = useState(false);
  const [currentVerifyingItem, setCurrentVerifyingItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone scanner hook
  const { session, lastScanned, generateSession, disconnect } = usePhoneScanner({
    onScan: handleBarcodeScan,
    context: 'sales'
  });

  // Fetch medicines
  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .gt("stock_quantity", 0)
        .order("name");

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast.error("Failed to fetch medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    setupBarcodeScanner();
  }, []);

  // Setup USB barcode scanner listener
  const setupBarcodeScanner = () => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLInputElement;
        const barcode = target?.value || '';
        if (barcode.length > 3 && barcode !== searchQuery) {
          handleBarcodeScan(barcode);
        }
      }
    };

    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.addEventListener('keypress', handleKeyPress);
    }

    return () => {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.removeEventListener('keypress', handleKeyPress);
      }
    };
  };

  async function handleBarcodeScan(barcode: string) {
    // First try exact barcode match
    let medicine = medicines.find(med => med.barcode === barcode);
    
    // If no exact barcode match, try ID match
    if (!medicine) {
      medicine = medicines.find(med => med.id === barcode);
    }
    
    // If still no match, try name contains (case insensitive)
    if (!medicine) {
      medicine = medicines.find(med => 
        med.name.toLowerCase().includes(barcode.toLowerCase())
      );
    }
    
    if (medicine) {
      // Add to cart with verified status
      const existingItem = cart.find((item) => item.id === medicine.id);
      
      if (existingItem) {
        if (existingItem.quantity + 1 > medicine.stock_quantity) {
          toast.error(`Only ${medicine.stock_quantity} items available in stock`);
          return;
        }
        setCart(cart.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1, verified: true }
            : item
        ));
      } else {
        if (medicine.stock_quantity === 0) {
          toast.error("This item is out of stock");
          return;
        }
        setCart([...cart, { ...medicine, quantity: 1, verified: true }]);
      }
      
      // Log scan to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("scan_logs").insert({
            barcode: barcode,
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            quantity: 1,
            context: 'sales',
            scanned_by: user.id
          });
        }
      } catch (error) {
        console.error("Error logging scan:", error);
      }
      
      toast.success(`✅ Scanned and verified — ready for sale: ${medicine.name}`);
    } else {
      toast.error(`❌ No medicine found for: ${barcode}`);
    }
  }

  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const handleCameraScan = () => {
    setShowScannerOptions(false);
    setShowCameraScanner(true);
  };

  const handleCameraScanComplete = (barcode: string) => {
    setShowCameraScanner(false);
    handleBarcodeScan(barcode);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowScannerOptions(false);
      toast.info("Processing barcode image...");
      // Simulate image processing
      setTimeout(() => {
        const sampleBarcodes = ["MED004567890", "MED005678901"];
        const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
        handleBarcodeScan(randomBarcode);
      }, 1500);
    }
  };

  const addToCart = (medicine: Medicine) => {
    // Check if already in cart
    const existingItem = cart.find((item) => item.id === medicine.id);
    
    if (existingItem) {
      // Check stock before increasing quantity
      if (existingItem.quantity + 1 > medicine.stock_quantity) {
        toast.error(`Only ${medicine.stock_quantity} items available in stock`);
        return;
      }
      updateQuantity(medicine.id, existingItem.quantity + 1);
    } else {
      // Check stock before adding new item
      if (medicine.stock_quantity === 0) {
        toast.error("This item is out of stock");
        return;
      }
      setCart([...cart, { ...medicine, quantity: 1, verified: false }]);
      toast.success(`🛒 ${medicine.name} added to cart`);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    // Check stock limit
    const item = cart.find(item => item.id === id);
    if (item && newQuantity > item.stock_quantity) {
      toast.error(`Only ${item.stock_quantity} items available in stock`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    setConditionInput("");
    disconnect();
    toast.info("Cart cleared");
  };

  const verifyItemWithBarcode = async (item: CartItem) => {
    setCurrentVerifyingItem(item.id);
    setShowScannerOptions(true);
  };

  const simulateVerification = (itemId: string) => {
    setCart(cart.map(cartItem => 
      cartItem.id === itemId 
        ? { ...cartItem, verified: true }
        : cartItem
    ));
    setCurrentVerifyingItem(null);
    setShowScannerOptions(false);
    
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item) {
      toast.success(`✅ ${item.name} verified successfully`);
    }
  };

  const completeSale = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const unverifiedItems = cart.filter(item => !item.verified);
    if (unverifiedItems.length > 0) {
      toast.error("❌ Please verify all items with barcode scan before payment");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
      const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          receipt_number: receiptNumber,
          cashier_id: user.id,
          total_amount: totalAmount,
          payment_method: paymentMethod.toLowerCase(),
          condition_noted: conditionInput || null,
          status: "completed"
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update stock
      for (const item of cart) {
        // Insert sale item
        const { error: itemError } = await supabase
          .from("sale_items")
          .insert({
            sale_id: sale.id,
            medicine_id: item.id,
            quantity: item.quantity,
            unit_price: item.selling_price,
            total_price: item.selling_price * item.quantity,
            verified_via_barcode: item.verified
          });

        if (itemError) throw itemError;

        // Update medicine stock
        const { error: stockError } = await supabase
          .from("medicines")
          .update({
            stock_quantity: item.stock_quantity - item.quantity
          })
          .eq("id", item.id);

        if (stockError) throw stockError;
      }

      toast.success(`🎉 ${paymentMethod} payment processed successfully! Receipt: ${receiptNumber}`);
      
      // Clear cart after successful sale
      setTimeout(() => {
        setCart([]);
        setConditionInput("");
        disconnect();
        fetchMedicines(); // Refresh stock
      }, 2000);

    } catch (error: any) {
      console.error("Error completing sale:", error);
      toast.error(`❌ Failed to complete sale: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.selling_price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const isLowStock = (stock: number) => stock <= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Point</h1>
            <p className="text-sm text-gray-600">Process customer transactions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                generateSession();
                setShowScannerModal(true);
              }}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Phone Scanner
            </Button>
          </div>
        </div>

        {/* Condition Input */}
        <Card className="mb-4 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Condition / Symptoms (Optional)</label>
                <Input
                  placeholder="e.g., Headache, Fever, Stomach pain, Malaria symptoms..."
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned Display */}
        {lastScanned && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Last Scanned:</span>
                <code className="text-xs bg-green-100 px-2 py-1 rounded">{lastScanned}</code>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Phone Scanner Modal */}
      <ScannerModal
        open={showScannerModal}
        onOpenChange={setShowScannerModal}
        sessionId={session?.sessionId || null}
        context="sales"
        isConnected={session?.isConnected || false}
        status={session?.status || 'disconnected'}
      />

      {/* Camera Scanner Dialog */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50">
          <BarcodeScanner onBarcodeScanned={handleCameraScanComplete} />
        </div>
      )}

      {/* Scanner Options Modal */}
      {showScannerOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4">
            <CardHeader>
              <CardTitle>Verify Barcode</CardTitle>
              <CardDescription>
                Scan barcode for {currentVerifyingItem ? cart.find(item => item.id === currentVerifyingItem)?.name : 'item'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleCameraScan}>
                <Camera className="mr-2 h-4 w-4" />
                Use Camera Scanner
              </Button>
              
              <Button variant="outline" className="w-full">
                <Usb className="mr-2 h-4 w-4" />
                USB Barcode Scanner
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Scan className="mr-2 h-4 w-4" />
                Upload Barcode Image
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Demo verification button */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Demo: Simulate verification</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => currentVerifyingItem && simulateVerification(currentVerifyingItem)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Simulate Successful Scan
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setShowScannerOptions(false);
                  setCurrentVerifyingItem(null);
                }}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicines Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-blue-100">
            <CardHeader className="bg-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Search className="h-5 w-5" />
                Medicine Search
              </CardTitle>
              <CardDescription className="text-blue-700">
                Search by name, dosage, or scan barcode (USB scanner ready)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="Search medicines or scan barcode with USB scanner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  type="text"
                />
                <Button 
                  onClick={() => {
                    generateSession();
                    setShowScannerModal(true);
                  }}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">Loading medicines...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {medicines
                    .filter((med) =>
                      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      med.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      med.barcode?.includes(searchQuery)
                    )
                    .map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                            <Badge variant="outline" className="text-xs">{medicine.dosage}</Badge>
                            {isLowStock(medicine.stock_quantity) && (
                              <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                            )}
                            {isExpiringSoon(medicine.expiry_date) && (
                              <Badge variant="outline" className="text-orange-600 text-xs border-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Stock: {medicine.stock_quantity}</span>
                            <span>Expires: {medicine.expiry_date || "N/A"}</span>
                            {medicine.barcode && (
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                📦 {medicine.barcode}
                              </span>
                            )}
                          </div>
                          {medicine.brand && (
                            <p className="text-xs text-gray-500 mt-1">Brand: {medicine.brand}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-600 text-lg">
                            GHS {medicine.selling_price.toFixed(2)}
                          </span>
                          <Button
                            onClick={() => addToCart(medicine)}
                            disabled={medicine.stock_quantity === 0}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-6">
          <Card className="shadow-lg border-green-100">
            <CardHeader className="bg-green-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cart.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-green-700">
                {cart.length} {cart.length === 1 ? "item" : "items"} in cart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium mb-2">Cart is empty</p>
                  <p className="text-sm">Add medicines or scan barcodes to get started</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div key={item.id} className="space-y-3 p-3 border rounded-lg bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              {item.verified ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 text-xs border-red-200">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{item.dosage}</p>
                            <p className="text-sm font-medium text-green-600">
                              GHS {item.selling_price.toFixed(2)} each
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock_quantity}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            onClick={() => verifyItemWithBarcode(item)}
                            disabled={item.verified || currentVerifyingItem === item.id}
                            size="sm"
                            variant={item.verified ? "default" : "outline"}
                            className={item.verified ? "bg-green-100 text-green-700 border-green-200" : ""}
                          >
                            {currentVerifyingItem === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : item.verified ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <Scan className="h-3 w-3" />
                            )}
                            {item.verified ? "Verified" : "Verify"}
                          </Button>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span className="font-medium">GHS {tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-green-600">GHS {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Verification Warning */}
                  {cart.some(item => !item.verified) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-medium">Verification Required</p>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        Please verify all items with barcode scan before payment
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          {cart.length > 0 && (
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-purple-50 rounded-t-lg">
                <CardTitle className="text-purple-900">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button
                  onClick={() => completeSale("Cash")}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <DollarSign className="mr-2 h-5 w-5" />
                  )}
                  {saving ? "Processing..." : "Cash Payment"}
                </Button>
                <Button
                  onClick={() => completeSale("Card")}
                  variant="outline"
                  className="w-full h-12 text-lg border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Card Payment
                </Button>
                <Button
                  onClick={() => completeSale("Mobile Money")}
                  variant="outline"
                  className="w-full h-12 text-lg border-purple-300 text-purple-700 hover:bg-purple-50"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  <Smartphone className="mr-2 h-5 w-5" />
                  Mobile Money
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
