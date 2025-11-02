import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "warning" | "error" | "success" | "info";
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch all medicines and filter in JavaScript for low stock
      const { data: allMeds, error: lowStockError } = await supabase
        .from("medicines")
        .select("id, name, stock_quantity, min_stock_level");
      
      const lowStockMeds = allMeds?.filter(
        (med) => med.stock_quantity < med.min_stock_level
      ) || [];

      if (lowStockError) throw lowStockError;

      // Fetch expiring medicines (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringMeds, error: expiringError } = await supabase
        .from("medicines")
        .select("id, name, expiry_date")
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gte("expiry_date", new Date().toISOString().split("T")[0]);

      if (expiringError) throw expiringError;

      // Fetch sales stats for current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("total_amount")
        .gte("created_at", firstDayOfMonth.toISOString());

      if (salesError) throw salesError;

      const totalSales = salesData?.reduce(
        (sum, sale) => sum + parseFloat(sale.total_amount.toString()),
        0
      ) || 0;

      // Assume monthly target is stored somewhere or hardcoded
      const monthlyTarget = 50000; // GHS 50,000
      const targetPercentage = Math.round((totalSales / monthlyTarget) * 100);

      // Build notifications array
      const newNotifications: Notification[] = [];

      if (lowStockMeds && lowStockMeds.length > 0) {
        newNotifications.push({
          id: 1,
          title: "Low Stock Alert",
          message: `${lowStockMeds.length} medicine(s) below minimum stock level`,
          type: "warning",
        });
      }

      if (expiringMeds && expiringMeds.length > 0) {
        newNotifications.push({
          id: 2,
          title: "Expiry Warning",
          message: `${expiringMeds.length} medicine(s) expiring within 30 days`,
          type: "error",
        });
      }

      if (targetPercentage >= 80) {
        newNotifications.push({
          id: 3,
          title: "Sales Target",
          message: `${targetPercentage}% of monthly target achieved`,
          type: "success",
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return { notifications, loading, refetch: fetchNotifications };
}
