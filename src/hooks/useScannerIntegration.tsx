import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Medicine {
  id: string;
  name: string;
  barcode?: string;
  [key: string]: any;
}

interface UseScannerIntegrationOptions {
  medicines: Medicine[];
  context: 'sales' | 'inventory';
  onScanSuccess?: (medicine: Medicine, barcode: string) => void;
}

export function useScannerIntegration({
  medicines,
  context,
  onScanSuccess
}: UseScannerIntegrationOptions) {
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  const logScan = useCallback(async (barcode: string, medicine: Medicine) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("scan_logs").insert({
          barcode: barcode,
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          quantity: 1,
          context: context,
          scanned_by: user.id
        });
      }
    } catch (error) {
      console.error("Error logging scan:", error);
    }
  }, [context]);

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode || barcode.length < 3) return;

    setScanning(true);
    setLastScanned(barcode);

    // Try to find medicine by barcode, ID, or name
    let medicine = medicines.find(med => med.barcode === barcode);
    
    if (!medicine) {
      medicine = medicines.find(med => med.id === barcode);
    }
    
    if (!medicine) {
      medicine = medicines.find(med => 
        med.name.toLowerCase().includes(barcode.toLowerCase())
      );
    }
    
    if (medicine) {
      await logScan(barcode, medicine);
      
      if (onScanSuccess) {
        onScanSuccess(medicine, barcode);
      }
      
      toast.success(`✅ Scanned and verified — ready for ${context}: ${medicine.name}`);
    } else {
      toast.error(`❌ No medicine found for: ${barcode}`);
    }

    setTimeout(() => setScanning(false), 500);
  }, [medicines, context, onScanSuccess, logScan]);

  // Setup USB barcode scanner listener
  useEffect(() => {
    let buffer = "";
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except the search field)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter' && buffer.length > 0) {
        handleScan(buffer);
        buffer = "";
        clearTimeout(timeout);
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = "";
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [handleScan]);

  return {
    lastScanned,
    scanning,
    handleScan
  };
}
