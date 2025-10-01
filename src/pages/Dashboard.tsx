import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Activity
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import pharmHeroImage from "@/assets/pharmacy-hero.jpg"

// Helper function to format currency in Ghanaian Cedis
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2
  }).format(amount)
}

// Alternative: If you prefer using the ₵ symbol directly
const formatCedi = (amount: number) => {
  return `₵${amount.toFixed(2)}`
}

export default function Dashboard() {
  const [todaysSales, setTodaysSales] = useState(0)
  const [transactions, setTransactions] = useState(0)
  const [customersServed, setCustomersServed] = useState(0)
  const [lowStock, setLowStock] = useState<any[]>([])
  const [expiringSoon, setExpiringSoon] = useState<any[]>([])
  const [topSelling, setTopSelling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isoToday = today.toISOString()
      const next30Days = new Date()
      next30Days.setDate(today.getDate() + 30)
      const iso30Days = next30Days.toISOString()

      // --- Today's sales ---
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id,total_amount,customer_id,created_at")
        .gte("created_at", isoToday)
      if (salesError) throw salesError

      const totalSales = salesData?.reduce((sum: number, sale: any) => sum + sale.total_amount, 0) || 0
      setTodaysSales(totalSales)
      setTransactions(salesData?.length || 0)
      const uniqueCustomers = Array.from(new Set(salesData?.map((s: any) => s.customer_id)))
      setCustomersServed(uniqueCustomers.length)

      // --- Low stock & expiring items ---
      const { data: medicines, error: medError } = await supabase
        .from("medicines")
        .select("*")
      if (medError) throw medError

      setLowStock(medicines?.filter((m: any) => m.stock_quantity <= m.min_stock_level) || [])
      setExpiringSoon(medicines?.filter((m: any) => new Date(m.expiry_date) <= next30Days) || [])

      // --- Top selling medicines today ---
      const { data: saleItems, error: itemsError } = await supabase
        .from("sale_items")
        .select("medicine_id, quantity, total_price")
        .gte("created_at", isoToday)
      if (itemsError) throw itemsError

      const topMap: Record<string, { quantity: number; totalRevenue: number }> = {}
      saleItems?.forEach((item: any) => {
        if (!topMap[item.medicine_id]) topMap[item.medicine_id] = { quantity: 0, totalRevenue: 0 }
        topMap[item.medicine_id].quantity += item.quantity
        topMap[item.medicine_id].totalRevenue += item.total_price
      })

      const topIds = Object.entries(topMap)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5)

      const topMedicineData: any[] = []
      for (let [id, info] of topIds) {
        const { data: med } = await supabase.from("medicines").select("name").eq("id", id).single()
        if (med) topMedicineData.push({ name: med.name, ...info })
      }
      setTopSelling(topMedicineData)

    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Optional: Auto-refresh every 30s
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6 bg-gradient-bg min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-primary text-primary-foreground p-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold mb-2">Welcome to PharmaPOS</h1>
          <p className="text-lg opacity-90 mb-6">
            Professional pharmacy management system for streamlined operations
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => window.location.href = '/sales'}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50"
              onClick={() => window.location.href = '/reports'}
            >
              View Reports
            </Button>
          </div>
        </div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${pharmHeroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-medical transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(todaysSales)}</div>
            {/* Alternative using ₵ symbol: */}
            {/* <div className="text-2xl font-bold text-primary">{formatCedi(todaysSales)}</div> */}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{transactions}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers Served</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{customersServed}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button className="h-20 flex-col gap-2 bg-gradient-primary hover:bg-primary-dark"
              onClick={() => window.location.href = '/sales'}>
              <ShoppingCart className="h-6 w-6" /> New Sale
            </Button>
            <Button variant="secondary" className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/purchases'}>
              <Package className="h-6 w-6" /> Add Stock
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 col-span-2"
              onClick={() => window.location.href = '/reports'}>
              <Calendar className="h-6 w-6" /> Reports
            </Button>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Notifications
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStock.length === 0 && expiringSoon.length === 0 && (
              <p className="text-sm text-muted-foreground">No alerts for today</p>
            )}
            {lowStock.map((item, idx) => (
              <div key={`low-${idx}`} className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name} Low Stock</p>
                  <p className="text-xs text-muted-foreground">{item.stock_quantity} left (min {item.min_stock_level})</p>
                </div>
              </div>
            ))}
            {expiringSoon.map((item, idx) => (
              <div key={`exp-${idx}`} className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <Calendar className="h-4 w-4 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name} Expiring Soon</p>
                  <p className="text-xs text-muted-foreground">Expiry: {new Date(item.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Medicines Today */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Top Selling Medicines Today</CardTitle>
          <CardDescription>Most frequently purchased items</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> :
            topSelling.length === 0 ? <p className="text-sm text-muted-foreground">No sales today</p> :
            <div className="space-y-4">
              {topSelling.map((medicine, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0">
                  <div>
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-sm text-muted-foreground">{medicine.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{formatCurrency(medicine.totalRevenue)}</p>
                    {/* Alternative using ₵ symbol: */}
                    {/* <p className="font-medium text-primary">{formatCedi(medicine.totalRevenue)}</p> */}
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  )
}