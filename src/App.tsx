import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers, { CustomerDetail } from "@/pages/Customers";
import Contacts from "@/pages/Contacts";
import Deals from "@/pages/Deals";
import Quotations from "@/pages/Quotations";
import Jobs from "@/pages/Jobs";
import Parts from "@/pages/Parts";
import Suppliers from "@/pages/Suppliers";
import SupplierBills from "@/pages/SupplierBills";
import CalendarPage from "@/pages/CalendarPage";
import Service from "@/pages/Service";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import AuditLogPage from "@/pages/AuditLog";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/parts" element={<Parts />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/supplier-bills" element={<SupplierBills />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/service" element={<Service />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit" element={<AuditLogPage />} />
            </Route>
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
