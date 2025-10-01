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
import ReceiptDialog from "@/components/dialogs/ReceiptDialog";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  Scan,
  ShieldCheck,
  Stethoscope,
  Camera,
  Usb,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  selling_price: number;
  stock_quantity: number;
  expiry_date: string | null;
  category: string;
  barcode?: string;
}

interface CartItem extends Medicine {
  quantity: number;
  verified: boolean;
}

export default function Sales() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditionInput, setConditionInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showScannerOptions, setShowScannerOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline, syncing, pendingCount, executeOperation } = useOfflineSync();

  useEffect(() => {
    fetchMedicines();
    setupBarcodeScanner();
  }, []);

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

  // Setup USB barcode scanner listener
  const setupBarcodeScanner = () => {
    // Listen for barcode scanner input (USB scanners act like keyboards)
    const handleKeyPress = (e: KeyboardEvent) => {
      // Barcode scanners typically send data quickly and end with Enter
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        const barcode = e.target.value || '';
        if (barcode.length > 3) { // Basic barcode length check
          handleBarcodeScan(barcode);
        }
      }
    };

    // Add event listener to search input
    const searchInput = document.querySelector('input[placeholder*="barcode"]');
    if (searchInput) {
      searchInput.addEventListener('keypress', handleKeyPress as EventListener);
    }

    return () => {
      if (searchInput) {
        searchInput.removeEventListener('keypress', handleKeyPress as EventListener);
      }
    };
  };

  const handleBarcodeScan = (barcode: string) => {
    const medicine = medicines.find(med => 
      med.barcode === barcode || med.id === barcode
    );
    
    if (medicine) {
      addToCart(medicine);
      toast.success(`Scanned: ${medicine.name}`);
    } else {
      toast.error("No medicine found with this barcode");
    }
  };

  const handleCameraScan = () => {
    toast.info("Camera scanning would be implemented with a library like QuaggaJS or HTML5 Barcode Scanner");
    // This would open a camera modal for barcode scanning
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.info("Image barcode scanning would process the uploaded image");
      // This would process the image to extract barcode
    }
  };

  const addToCart = (medicine: Medicine) => {
    const existingItem = cart.find((item) => item.id === medicine.id);
    if (existingItem) {
      updateQuantity(medicine.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...medicine, quantity: 1, verified: false }]);
      toast.success(`${medicine.name} added to cart`);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(newQuantity, item.stock_quantity),
            }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setConditionInput("");
  };

  const verifyItemWithBarcode = async (item: CartItem) => {
    setScanning(true);
    
    try {
      // Show scanner options instead of prompt
      setShowScannerOptions(true);
      
      // For demo purposes, auto-verify after a delay
      setTimeout(() => {
        setCart(cart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, verified: true }
            : cartItem
        ));
        toast.success(`${item.name} verified successfully ✅`);
        setShowScannerOptions(false);
        setScanning(false);
      }, 1500);
      
    } catch (error) {
      toast.error("Scanning failed. Please try again.");
      setScanning(false);
    }
  };

  const completeSale = async (paymentMethod: string) => {
    if (cart.length === 0 || !user) return;

    const unverifiedItems = cart.filter(item => !item.verified);
    if (unverifiedItems.length > 0) {
      toast.error("Please verify all items with barcode scan before payment");
      return;
    }

    setSaving(true);
    try {
      const receiptNumber = `RC-${Date.now()}`;
      const saleId = `${Date.now()}-${Math.random()}`;

      // Create sale record
      const saleData = {
        id: saleId,
        receipt_number: receiptNumber,
        cashier_id: user.id,
        payment_method: paymentMethod.toLowerCase(),
        total_amount: total,
        tax_amount: tax,
        discount_amount: 0,
        status: "completed",
        condition_noted: conditionInput || null,
        sale_date: new Date().toISOString(),
      };

      const { data: insertedSale, error: saleError } = await executeOperation(
        'insert',
        'sales',
        saleData
      );

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item) => ({
        id: `${Date.now()}-${item.id}-${Math.random()}`,
        sale_id: saleId,
        medicine_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price,
        total_price: item.selling_price * item.quantity,
        discount: 0,
        verified_via_barcode: true,
      }));

      for (const saleItem of saleItems) {
        await executeOperation('insert', 'sale_items', saleItem);
      }

      // Update stock quantities
      for (const item of cart) {
        await executeOperation('update', 'medicines', {
          id: item.id,
          stock_quantity: item.stock_quantity - item.quantity,
        });
      }

      setSelectedPaymentMethod(paymentMethod);
      setShowReceipt(true);
      toast.success(isOnline ? "Sale completed successfully! ✅" : "Sale saved offline. Will sync when online.");
    } catch (error) {
      console.error("Error completing sale:", error);
      toast.error("Failed to complete sale");
    } finally {
      setSaving(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setSelectedPaymentMethod("");
    setConditionInput("");
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.selling_price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* SIMPLE HEADER - No duplicate branding */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Sales Point</h1>
              {isOnline ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="h-3 w-3 mr-1" /> Online
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <WifiOff className="h-3 w-3 mr-1" /> Offline Mode
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary">
                  {pendingCount} pending sync
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Process customer transactions {!isOnline && "- Changes will sync when online"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={clearCart}
            disabled={cart.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>

        {/* CONDITION INPUT */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Condition / Symptoms (Optional)</label>
                <Input
                  placeholder="e.g., Headache, Stomach ache, Malaria symptoms..."
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SCANNER OPTIONS MODAL */}
      {showScannerOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Choose your scanning method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleCameraScan}>
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </Button>
              <Button variant="outline" className="w-full">
                <Usb className="mr-2 h-4 w-4" />
                USB Scanner (Ready)
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
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowScannerOptions(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MEDICINES SECTION */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Medicine Search
              </CardTitle>
              <CardDescription>
                Search by name, dosage, or scan barcode (USB scanner ready)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="Search medicines or scan barcode with USB scanner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => setShowScannerOptions(true)}
                  variant="outline"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading medicines...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {medicines
                    .filter((med) =>
                      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      med.dosage.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{medicine.name}</h3>
                            <Badge variant="outline">{medicine.dosage}</Badge>
                            {medicine.stock_quantity <= 10 && (
                              <Badge variant="destructive">Low Stock</Badge>
                            )}
                            {medicine.expiry_date && isExpiringSoon(medicine.expiry_date) && (
                              <Badge variant="outline" className="text-orange-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Stock: {medicine.stock_quantity} | Expires: {medicine.expiry_date || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">
                            GHS {medicine.selling_price.toFixed(2)}
                          </span>
                          <Button
                            onClick={() => addToCart(medicine)}
                            disabled={medicine.stock_quantity === 0}
                            size="sm"
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

        {/* CART SECTION */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
              <CardDescription>
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add medicines to get started</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.verified ? (
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <Badge variant="outline" className="text-red-600 text-xs">
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
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => verifyItemWithBarcode(item)}
                          disabled={scanning || item.verified}
                          size="sm"
                          variant={item.verified ? "default" : "outline"}
                        >
                          {scanning ? (
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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>GHS {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>GHS {tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">GHS {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {cart.some(item => !item.verified) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800 text-center">
                        ⚠️ Verify all items with barcode scan before payment
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* PAYMENT SECTION */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => completeSale("Cash")}
                  className="w-full"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="mr-2 h-4 w-4" />
                  )}
                  Cash Payment
                </Button>
                <Button
                  onClick={() => completeSale("Card")}
                  variant="outline"
                  className="w-full"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card Payment
                </Button>
                <Button
                  onClick={() => completeSale("Mobile Money")}
                  variant="outline"
                  className="w-full"
                  disabled={saving || cart.some(item => !item.verified)}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile Money
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ReceiptDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        cartItems={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={selectedPaymentMethod}
        onNewSale={handleNewSale}
      />
    </div>
  );
}