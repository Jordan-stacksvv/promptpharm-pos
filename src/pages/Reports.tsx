"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Filter,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  cashier_id: string;
  profiles?: { full_name: string };
  sale_items?: Array<{
    quantity: number;
    medicines?: { name: string };
  }>;
}

export default function Reports() {
  const [reports, setReports] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("sales")
        .select(`
          *,
          profiles!sales_cashier_id_fkey (full_name),
          sale_items!sale_items_sale_id_fkey (
            quantity,
            medicine_id,
            medicines!sale_items_medicine_id_fkey (name)
          )
        `)
        .order("created_at", { ascending: false });

      // Apply date filters if set
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error("Failed to load reports:", err.message);
      setError(err.message);
      toast.error("Failed to load sales reports");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (report: Sale) => {
    // Show sale details
    const itemsList = report.sale_items?.map(item => 
      `${item.quantity}x ${item.medicines?.name || 'Unknown'}`
    ).join('\n') || 'No items';
    
    toast.info(`Sale Details:\nReceipt: ${report.receipt_number}\nTotal: GHS ${report.total_amount}\nItems:\n${itemsList}`);
  };

  const downloadReport = () => {
    const csv = [
      ['Receipt', 'Date', 'Cashier', 'Payment Method', 'Total', 'Items'].join(','),
      ...reports.map(r => [
        r.receipt_number,
        new Date(r.created_at).toLocaleDateString(),
        r.profiles?.full_name || 'Unknown',
        r.payment_method,
        r.total_amount,
        r.sale_items?.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  };

  const totalSales = reports.reduce((sum, r) => sum + parseFloat(r.total_amount.toString()), 0);
  const totalTransactions = reports.length;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Sales Reports
          </h1>
          <p className="text-muted-foreground">View and analyze sales performance</p>
        </div>
        <Button onClick={downloadReport} disabled={reports.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  GHS {totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  GHS {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reports
          </CardTitle>
          <CardDescription>Filter sales by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={fetchReports} className="self-end">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {reports.length} transaction(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-center py-8">Loading reports...</p>}
          {error && <p className="text-center text-red-500 py-8">Error: {error}</p>}

          {!loading && !error && reports.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No sales found for the selected period.</p>
          )}

          {!loading && !error && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(report)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {report.receipt_number}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{report.payment_method}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.sale_items?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        GHS {parseFloat(report.total_amount.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
