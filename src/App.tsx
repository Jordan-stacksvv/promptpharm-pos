import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Returns from "./pages/Returns";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SaleComplete from "./pages/SaleComplete";
import PurchaseComplete from "./pages/PurchaseComplete";
import PhoneScanner from "./pages/PhoneScanner";
import InventoryScanPreview from "./pages/InventoryScanPreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/scan" element={<PhoneScanner />} />
            <Route
              path="/*" 
              element={
                <ProtectedRoute>
                  <PharmacyLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/sale-complete" element={<SaleComplete />} />
            <Route path="/purchase-complete" element={<PurchaseComplete />} />
            <Route path="/inventory-scan-preview" element={<InventoryScanPreview />} />
            <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PharmacyLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
