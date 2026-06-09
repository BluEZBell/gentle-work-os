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
import PurchaseOrders from "@/pages/PurchaseOrders";
import Invoices from "@/pages/Invoices";
import ChangeOrders from "@/pages/ChangeOrders";
import Tasks from "@/pages/Tasks";
import Assets from "@/pages/Assets";
import Payroll from "@/pages/Payroll";
import BarcodeIssue from "@/pages/BarcodeIssue";
import OcrDocuments from "@/pages/OcrDocuments";
import CustomerPortal from "@/pages/CustomerPortal";
import CalendarSync from "@/pages/CalendarSync";
import AiEmailIntake from "@/pages/AiEmailIntake";
import Approvals from "@/pages/Approvals";
import Warehouses from "@/pages/Warehouses";
import ThaiDocuments from "@/pages/ThaiDocuments";
import Notifications from "@/pages/Notifications";
import PaymentVouchers, { PaymentVoucherDetail } from "@/pages/PaymentVouchers";
import {
  JobDetail, QuotationDetail, DealDetail, CustomerPODetail, PurchaseOrderDetail,
  InvoiceDetail, SupplierBillDetail, ThaiDocumentDetail, ServiceDetail,
  ChangeOrderDetail, ApprovalDetail, AssetDetail, PayrollDetail,
  WarehouseDetail, OcrDocumentDetail, AiEmailDetail,
} from "@/pages/details/RecordDetails";
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
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/:id" element={<DealDetail />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/quotations/:id" element={<QuotationDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/parts" element={<Parts />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/supplier-bills" element={<SupplierBills />} />
              <Route path="/supplier-bills/:id" element={<SupplierBillDetail />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
              <Route path="/customer-po/:id" element={<CustomerPODetail />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/change-orders" element={<ChangeOrders />} />
              <Route path="/change-orders/:id" element={<ChangeOrderDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/payroll/:id" element={<PayrollDetail />} />
              <Route path="/barcode-issue" element={<BarcodeIssue />} />
              <Route path="/ocr-documents" element={<OcrDocuments />} />
              <Route path="/ocr-documents/:id" element={<OcrDocumentDetail />} />
              <Route path="/customer-portal" element={<CustomerPortal />} />
              <Route path="/calendar-sync" element={<CalendarSync />} />
              <Route path="/ai-email" element={<AiEmailIntake />} />
              <Route path="/ai-email/:id" element={<AiEmailDetail />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/approvals/:id" element={<ApprovalDetail />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouses/:id" element={<WarehouseDetail />} />
              <Route path="/thai-documents" element={<ThaiDocuments />} />
              <Route path="/thai-documents/:id" element={<ThaiDocumentDetail />} />
              <Route path="/service" element={<Service />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/payment-vouchers" element={<PaymentVouchers />} />
              <Route path="/payment-vouchers/:id" element={<PaymentVoucherDetail />} />
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
