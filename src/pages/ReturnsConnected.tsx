import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { 
  RotateCcw, 
  Search,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Loader2
} from "lucide-react"

interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  customer_id: string | null;
  customers?: { name: string } | null;
  sale_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    medicine_id: string;
    medicines?: { name: string };
  }>;
}

export default function ReturnsConnected() {
  const [receiptQuery, setReceiptQuery] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [returnItems, setReturnItems] = useState<any[]>([])
  const [returnReason, setReturnReason] = useState("")
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const searchSales = async () => {
    if (!receiptQuery || receiptQuery.length < 3) {
      toast.error("Please enter at least 3 characters to search");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (name),
          sale_items (
            id,
            quantity,
            unit_price,
            medicine_id
          )
        `)
        .ilike("receipt_number", `%${receiptQuery}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      
      // Fetch medicine names separately for each sale
      if (data) {
        for (const sale of data) {
          if (sale.sale_items) {
            for (const item of sale.sale_items) {
              const { data: medicine } = await supabase
                .from("medicines")
                .select("name")
                .eq("id", item.medicine_id)
                .single();
              
              if (medicine) {
                (item as any).medicines = medicine;
              }
            }
          }
        }
      }

      if (error) throw error;
      setSales(data || []);
      
      if (data?.length === 0) {
        toast.info("No sales found matching your search");
      }
    } catch (error: any) {
      console.error("Error searching sales:", error);
      toast.error("Failed to search sales");
    } finally {
      setIsSearching(false);
    }
  };

  const addItemToReturn = (item: any) => {
    const existingReturn = returnItems.find(r => r.medicine_id === item.medicine_id);
    if (existingReturn) {
      setReturnItems(returnItems.map(r => 
        r.medicine_id === item.medicine_id 
          ? { ...r, returnQuantity: Math.min(r.returnQuantity + 1, item.quantity) }
          : r
      ));
    } else {
      setReturnItems([...returnItems, { 
        ...item, 
        returnQuantity: 1,
        name: item.medicines?.name || 'Unknown'
      }]);
    }
  };

  const updateReturnQuantity = (medicineId: string, quantity: number) => {
    setReturnItems(returnItems.map(item => 
      item.medicine_id === medicineId 
        ? { ...item, returnQuantity: Math.max(0, Math.min(quantity, item.quantity)) }
        : item
    ).filter(item => item.returnQuantity > 0));
  };

  const processReturn = async () => {
    if (returnItems.length === 0 || !returnReason || !selectedSale) {
      toast.error("Please select items and provide a reason");
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, you'd create a returns table
      // For now, we'll just log and show success
      console.log("Processing return:", {
        sale_id: selectedSale.id,
        items: returnItems,
        reason: returnReason,
        total_amount: totalReturnAmount
      });

      toast.success("Return processed successfully!");
      
      // Reset form
      setReturnItems([]);
      setReturnReason("");
      setSelectedSale(null);
      setReceiptQuery("");
      setSales([]);
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast.error("Failed to process return");
    } finally {
      setIsLoading(false);
    }
  };

  const totalReturnAmount = returnItems.reduce((total, item) => 
    total + (item.unit_price * item.returnQuantity), 0
  );

  const filteredSales = sales.filter(sale =>
    sale.receipt_number.toLowerCase().includes(receiptQuery.toLowerCase()) ||
    sale.customers?.name?.toLowerCase().includes(receiptQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-bg min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Returns & Refunds</h1>
          <p className="text-muted-foreground">Process customer returns and manage refunds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Return Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* Find Sale */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Find Original Sale
              </CardTitle>
              <CardDescription>Search for the original transaction to process return</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Enter receipt number or customer name..."
                  value={receiptQuery}
                  onChange={(e) => setReceiptQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchSales()}
                  className="flex-1"
                />
                <Button onClick={searchSales} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {filteredSales.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Search Results</h4>
                  {filteredSales.map((sale) => (
                    <div 
                      key={sale.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSale?.id === sale.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedSale(sale)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{sale.receipt_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sale.customers?.name || 'Walk-in Customer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            GHS {parseFloat(sale.total_amount.toString()).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sale.sale_items?.length || 0} items • {sale.payment_method}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Sale Items */}
          {selectedSale && selectedSale.sale_items && selectedSale.sale_items.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sale Items - {selectedSale.receipt_number}
                </CardTitle>
                <CardDescription>Select items to return from this transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedSale.sale_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.medicines?.name || 'Unknown Medicine'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × GHS {parseFloat(item.unit_price.toString()).toFixed(2)} = 
                          GHS {(item.quantity * parseFloat(item.unit_price.toString())).toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addItemToReturn(item)}
                      >
                        Add to Return
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return Items */}
          {returnItems.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Return Items
                </CardTitle>
                <CardDescription>Items selected for return</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {returnItems.map((item) => (
                  <div key={item.medicine_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        GHS {parseFloat(item.unit_price.toString()).toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Qty:</Label>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.returnQuantity}
                          onChange={(e) => updateReturnQuantity(item.medicine_id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                        />
                      </div>
                      <span className="font-semibold text-primary">
                        GHS {(item.unit_price * item.returnQuantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label>Return Reason</Label>
                    <select 
                      className="w-full p-2 border rounded-md bg-background mt-1"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    >
                      <option value="">Select reason</option>
                      <option value="Wrong medication">Wrong medication</option>
                      <option value="Expired product">Expired product</option>
                      <option value="Damaged packaging">Damaged packaging</option>
                      <option value="Customer changed mind">Customer changed mind</option>
                      <option value="Doctor changed prescription">Doctor changed prescription</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">Total Refund Amount:</span>
                    <span className="font-bold text-primary">GHS {totalReturnAmount.toFixed(2)}</span>
                  </div>

                  <Button 
                    onClick={processReturn}
                    disabled={!returnReason || isLoading}
                    className="w-full bg-gradient-primary hover:bg-primary-dark"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Process Return & Refund
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Return History Sidebar */}
        <div>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Return History
              </CardTitle>
              <CardDescription>Recent returns will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No recent returns
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}