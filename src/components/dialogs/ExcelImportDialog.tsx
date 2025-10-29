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
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ExcelImportDialogProps {
  onImportComplete?: () => void;
}

export function ExcelImportDialog({ onImportComplete }: ExcelImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Security validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/x-excel'
      ];

      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      if (!allowedTypes.includes(selectedFile.type) && 
          !selectedFile.name.toLowerCase().endsWith('.xlsx') && 
          !selectedFile.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const processExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const sanitizeInput = (input: any): string => {
    if (typeof input !== 'string') return String(input || '');
    return input.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
  };

  const validateCategory = (category: string): "over_counter" | "prescription" | "supplement" | "medical_device" => {
    const validCategories = ["over_counter", "prescription", "supplement", "medical_device"];
    const normalizedCategory = category.toLowerCase().replace(/[^a-z_]/g, '');
    return validCategories.includes(normalizedCategory) 
      ? normalizedCategory as "over_counter" | "prescription" | "supplement" | "medical_device"
      : "over_counter";
  };

  const mapExcelDataToMedicine = (data: any) => {
    // Map common Excel column names to our database fields with input sanitization
    return {
      name: sanitizeInput(data.name || data.Name || data.medicine_name || data['Medicine Name'] || ''),
      brand: sanitizeInput(data.brand || data.Brand || data.manufacturer || data.Manufacturer || ''),
      dosage: sanitizeInput(data.dosage || data.Dosage || data.strength || data.Strength || ''),
      category: validateCategory(data.category || data.Category || 'over_counter'),
      stock_quantity: Math.max(0, parseInt(data.stock_quantity || data['Stock Quantity'] || data.quantity || data.Quantity || '0') || 0),
      min_stock_level: Math.max(1, parseInt(data.min_stock_level || data['Min Stock'] || data.min_stock || '10') || 10),
      buying_price: Math.max(0, parseFloat(data.buying_price || data['Buying Price'] || data.unit_price || data['Unit Price'] || data.cost || data.Cost || '0') || 0),
      selling_price: Math.max(0, parseFloat(data.selling_price || data['Selling Price'] || data.price || data.Price || '0') || 0),
      expiry_date: data.expiry_date || data['Expiry Date'] || data.expiry || null,
      batch_number: sanitizeInput(data.batch_number || data['Batch Number'] || data.batch || 'BATCH-' + Date.now()),
      barcode: sanitizeInput(data.barcode || data.Barcode || data.sku || data.SKU || '')
    };
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Process Excel file with size limit check
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File is too large. Maximum size is 10MB.",
          variant: "destructive"
        });
        return;
      }

      const excelData = await processExcelFile(file);
      
      if (!excelData || excelData.length === 0) {
        toast({
          title: "Error",
          description: "No data found in the Excel file",
          variant: "destructive"
        });
        return;
      }

      // Limit number of records to prevent system overload
      if (excelData.length > 1000) {
        toast({
          title: "Error",
          description: "Too many records. Maximum 1000 records allowed per import.",
          variant: "destructive"
        });
        return;
      }

      // Map Excel data to medicine format
      const medicines = excelData.map(mapExcelDataToMedicine).filter(med => med.name);

      if (medicines.length === 0) {
        toast({
          title: "Error",
          description: "No valid medicine records found. Please check your Excel format.",
          variant: "destructive"
        });
        return;
      }

      // Insert medicines into database
      const { data, error } = await supabase
        .from('medicines')
        .insert(medicines)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully imported ${medicines.length} medicines from Excel file`
      });

      // Close dialog and reset
      setOpen(false);
      setFile(null);
      
      // Notify parent component
      if (onImportComplete) onImportComplete();

    } catch (error: any) {
      console.error('Error importing Excel file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import Excel file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Medicines from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with medicine data to bulk import into your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Excel file should contain columns: Name, Dosage, Stock Quantity, Unit Price, Selling Price. 
              Other supported columns: Generic Name, Description, Manufacturer, Category, Expiry Date, Batch Number, Barcode.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="excel-file">Select Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? "Importing..." : "Import Medicines"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}