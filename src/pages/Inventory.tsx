import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AddMedicineDialog from "@/components/dialogs/AddMedicineDialog";
import ImportExcelDialog from "@/components/dialogs/ImportExcelDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  Package,
  Search,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2,
  Download,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<any>(null);
  const { toast } = useToast();
  const { isOnline, syncing, pendingCount, executeOperation } = useOfflineSync();

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddMedicine = async (newMedicine: any) => {
    try {
      const medicineData = {
        name: newMedicine.name,
        dosage: newMedicine.dosage,
        brand: newMedicine.brand,
        batch_number: newMedicine.batchNumber,
        stock_quantity: newMedicine.stock,
        min_stock_level: newMedicine.minStock,
        buying_price: newMedicine.buyingPrice,
        selling_price: newMedicine.sellingPrice,
        expiry_date: newMedicine.expiry,
        supplier: newMedicine.supplier,
        category: "over_counter",
      };

      const { data, error } = await supabase
        .from("medicines")
        .insert(medicineData)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        setInventory([data[0], ...inventory]);
        toast({
          title: "Success",
          description: "Medicine added successfully!",
        });
      }
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast({
        title: "Error",
        description: "Failed to add medicine. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    // Create template data for CSV
    const headers = [
      "name",
      "dosage",
      "brand",
      "batch_number",
      "stock_quantity",
      "min_stock_level",
      "buying_price",
      "selling_price",
      "expiry_date",
      "supplier",
      "category"
    ];
    
    const exampleData = [
      "Paracetamol",
      "500mg",
      "Generic",
      "BATCH001",
      "100",
      "10",
      "5.99",
      "9.99",
      "2024-12-31",
      "Supplier Co.",
      "over_counter"
    ];
    
    const csvContent = [
      headers.join(","),
      exampleData.join(","),
      "# Add your medicines below this line",
      "# Remove the # symbol to uncomment the line above"
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medicine_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditMedicine = async (updatedData: any) => {
    try {
      const { data, error } = await executeOperation('update', 'medicines', {
        id: editingMedicine.id,
        ...updatedData,
      });

      if (error) throw error;

      setInventory(inventory.map(item => 
        item.id === editingMedicine.id ? { ...item, ...updatedData } : item
      ));

      toast({
        title: "Success",
        description: "Medicine updated successfully!",
      });
      setEditingMedicine(null);
    } catch (error) {
      console.error("Error updating medicine:", error);
      toast({
        title: "Error",
        description: "Failed to update medicine",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedicine = async () => {
    if (!deletingMedicine) return;

    try {
      const { error } = await executeOperation('delete', 'medicines', {
        id: deletingMedicine.id,
      });

      if (error) throw error;

      setInventory(inventory.filter(item => item.id !== deletingMedicine.id));

      toast({
        title: "Success",
        description: "Medicine deleted successfully!",
      });
      setDeletingMedicine(null);
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
    }
  };

  const isLowStock = (stock: number, minStock: number) => stock <= minStock;
  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 90;
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dosage?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "lowStock")
      return (
        matchesSearch && isLowStock(item.stock_quantity, item.min_stock_level)
      );
    if (filterType === "expiring")
      return matchesSearch && isExpiringSoon(item.expiry_date);
    return matchesSearch;
  });

  const lowStockCount = inventory.filter((item) =>
    isLowStock(item.stock_quantity, item.min_stock_level)
  ).length;
  const expiringCount = inventory.filter((item) =>
    isExpiringSoon(item.expiry_date)
  ).length;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            {isOnline ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Wifi className="h-3 w-3 mr-1" /> Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <WifiOff className="h-3 w-3 mr-1" /> Offline
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="secondary">
                {pendingCount} pending sync
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage your medicine stock and monitor levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <ImportExcelDialog onImportComplete={fetchInventory} />
          <AddMedicineDialog onAddMedicine={handleAddMedicine} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {inventory.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Medicines</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {lowStockCount}
              </p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{expiringCount}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                $
                {inventory
                  .reduce(
                    (total, item) =>
                      total + item.stock_quantity * (item.selling_price || 0),
                    0
                  )
                  .toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">Stock Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="shadow-md">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search medicines by name, brand, or dosage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              All Items
            </Button>
            <Button
              variant={filterType === "lowStock" ? "default" : "outline"}
              onClick={() => setFilterType("lowStock")}
              size="sm"
            >
              <AlertTriangle className="mr-1 h-3 w-3" /> Low Stock
            </Button>
            <Button
              variant={filterType === "expiring" ? "default" : "outline"}
              onClick={() => setFilterType("expiring")}
              size="sm"
            >
              <Calendar className="mr-1 h-3 w-3" /> Expiring
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
          <CardDescription>
            Showing {filteredInventory.length} of {inventory.length} medicines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading medicines...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medicines found. Add your first medicine to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventory.map((medicine) => (
                <div
                  key={medicine.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {medicine.name}
                        </h3>
                        <Badge variant="outline">{medicine.dosage}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {medicine.brand} • {medicine.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Batch: {medicine.batch_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Stock Level</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            isLowStock(
                              medicine.stock_quantity,
                              medicine.min_stock_level
                            )
                              ? "text-amber-600"
                              : "text-blue-600"
                          }`}
                        >
                          {medicine.stock_quantity}
                        </span>
                        {isLowStock(
                          medicine.stock_quantity,
                          medicine.min_stock_level
                        ) && (
                          <Badge variant="destructive" className="text-xs">
                            Low
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Min: {medicine.min_stock_level}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Pricing</p>
                      <p className="text-sm text-muted-foreground">
                        Buy: ${medicine.buying_price?.toFixed(2)}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        Sell: ${medicine.selling_price?.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Expiry</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isExpiringSoon(medicine.expiry_date)
                              ? "text-red-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {medicine.expiry_date}
                        </span>
                        {isExpiringSoon(medicine.expiry_date) && (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-600 text-xs"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" /> Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {medicine.supplier || "No supplier"}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setEditingMedicine(medicine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingMedicine(medicine)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMedicine} onOpenChange={() => setEditingMedicine(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update medicine information</DialogDescription>
          </DialogHeader>
          {editingMedicine && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    defaultValue={editingMedicine.name}
                    onChange={(e) => setEditingMedicine({...editingMedicine, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input
                    defaultValue={editingMedicine.dosage}
                    onChange={(e) => setEditingMedicine({...editingMedicine, dosage: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input
                    defaultValue={editingMedicine.brand}
                    onChange={(e) => setEditingMedicine({...editingMedicine, brand: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    defaultValue={editingMedicine.batch_number}
                    onChange={(e) => setEditingMedicine({...editingMedicine, batch_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    defaultValue={editingMedicine.stock_quantity}
                    onChange={(e) => setEditingMedicine({...editingMedicine, stock_quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <Input
                    type="number"
                    defaultValue={editingMedicine.min_stock_level}
                    onChange={(e) => setEditingMedicine({...editingMedicine, min_stock_level: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Buying Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={editingMedicine.buying_price}
                    onChange={(e) => setEditingMedicine({...editingMedicine, buying_price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Selling Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={editingMedicine.selling_price}
                    onChange={(e) => setEditingMedicine({...editingMedicine, selling_price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    defaultValue={editingMedicine.expiry_date}
                    onChange={(e) => setEditingMedicine({...editingMedicine, expiry_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input
                    defaultValue={editingMedicine.supplier}
                    onChange={(e) => setEditingMedicine({...editingMedicine, supplier: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMedicine(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleEditMedicine(editingMedicine)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMedicine} onOpenChange={() => setDeletingMedicine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingMedicine?.name}</strong> from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedicine}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}