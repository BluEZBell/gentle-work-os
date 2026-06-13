import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Contact, Briefcase, FileText, Wrench, Package,
  Truck, Receipt, CalendarDays, Headphones, BarChart3, Settings, ShieldCheck,
  LogOut, Lock, ShoppingCart, FileSpreadsheet, GitPullRequest, ListTodo, Menu,
  Boxes, Wallet, ScanBarcode, FileScan, Globe, CalendarCheck, Mail, CheckSquare,
  Warehouse, FileSignature, ChevronDown, Bell, ClipboardCheck, ClipboardList,
  BadgeDollarSign,
} from "lucide-react";
import { useAuth, roleBadge } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState, type ComponentType } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { QuickActionsFab } from "@/components/QuickActionsFab";

type NavItem = { to: string; icon: ComponentType<{ className?: string }>; en: string; th: string; end?: boolean };
type Zone = { id: string; label: string; thai: string; items: NavItem[] };

const zones: Zone[] = [
  {
    id: "overview", label: "Overview", thai: "ภาพรวม",
    items: [
      { to: "/", icon: LayoutDashboard, en: "Dashboard", th: "แดชบอร์ด", end: true },
      { to: "/notifications", icon: Bell, en: "Notifications", th: "แจ้งเตือน" },
      { to: "/tasks", icon: ListTodo, en: "Tasks", th: "งานที่ต้องทำ" },
    ],
  },
  {
    id: "sales", label: "Customer & Sales", thai: "ลูกค้าและการขาย",
    items: [
      { to: "/customers", icon: Users, en: "Customers", th: "ลูกค้า" },
      { to: "/contacts", icon: Contact, en: "Contacts", th: "ผู้ติดต่อ" },
      { to: "/deals", icon: Briefcase, en: "Deals", th: "โอกาสการขาย" },
      { to: "/purchase-orders?type=customer", icon: ClipboardList, en: "Customer PO", th: "PO ลูกค้า" },
      { to: "/quotations", icon: FileText, en: "Quotations", th: "ใบเสนอราคา" },
    ],
  },
  {
    id: "ops", label: "Operations", thai: "งานปฏิบัติการ",
    items: [
      { to: "/jobs", icon: Wrench, en: "Jobs", th: "งานผลิต/งานบริการ" },
      { to: "/parts", icon: Package, en: "Work Specification", th: "สเปกงาน" },
      { to: "/change-orders", icon: GitPullRequest, en: "Change Orders", th: "เปลี่ยนแปลงงาน" },
      { to: "/barcode-issue?view=receiving", icon: ClipboardCheck, en: "Receiving / QC", th: "รับของและตรวจงาน" },
      { to: "/service", icon: Headphones, en: "Service / Calibration", th: "บริการหลังการขาย" },
      { to: "/suppliers", icon: Truck, en: "Suppliers", th: "ซัพพลายเออร์" },
    ],
  },
  {
    id: "docs", label: "Documents & Finance", thai: "เอกสารและการเงิน",
    items: [
      { to: "/thai-documents", icon: FileSignature, en: "Thai Documents", th: "เอกสารไทย" },
      { to: "/invoices", icon: FileSpreadsheet, en: "Customer Invoices", th: "ใบแจ้งหนี้ลูกค้า" },
      { to: "/supplier-bills", icon: Receipt, en: "Supplier Bills", th: "บิลซัพพลายเออร์" },
      { to: "/payment-vouchers", icon: BadgeDollarSign, en: "Payment Vouchers", th: "ใบสำคัญจ่าย" },
      { to: "/payable-forecast", icon: Wallet, en: "Payable Forecast", th: "แผนเงินจ่ายประจำเดือน" },
      { to: "/approvals", icon: CheckSquare, en: "Approvals", th: "อนุมัติเอกสาร" },
    ],
  },
  {
    id: "inv", label: "Inventory & Assets", thai: "สต๊อกและสินทรัพย์",
    items: [
      { to: "/warehouses", icon: Warehouse, en: "Inventory", th: "วัตถุดิบและพัสดุ" },
      { to: "/warehouses", icon: Boxes, en: "Warehouses", th: "คลังสินค้า" },
      { to: "/barcode-issue", icon: ScanBarcode, en: "Barcode Issue", th: "เบิกของ" },
      { to: "/assets", icon: Boxes, en: "Assets / Depreciation", th: "สินทรัพย์และค่าเสื่อม" },
    ],
  },
  {
    id: "people", label: "People", thai: "พนักงาน",
    items: [
      { to: "/payroll", icon: Wallet, en: "Payroll", th: "เงินเดือน" },
      { to: "/payroll?view=employees", icon: Users, en: "Employees", th: "พนักงาน" },
    ],
  },
  {
    id: "auto", label: "Automation", thai: "ระบบอัตโนมัติ",
    items: [
      { to: "/ocr-documents", icon: FileScan, en: "OCR Documents", th: "สแกนเอกสาร" },
      { to: "/ai-email", icon: Mail, en: "AI Email Intake", th: "อ่านอีเมล" },
      { to: "/calendar-sync", icon: CalendarCheck, en: "Calendar Sync", th: "เชื่อมต่อปฏิทิน" },
      { to: "/customer-portal", icon: Globe, en: "Customer Portal", th: "พอร์ทัลลูกค้า" },
      { to: "/calendar", icon: CalendarDays, en: "Calendar", th: "ปฏิทิน" },
    ],
  },
  {
    id: "admin", label: "Reports & Settings", thai: "รายงานและตั้งค่า",
    items: [
      { to: "/reports", icon: BarChart3, en: "Reports", th: "รายงาน" },
      { to: "/audit", icon: ShieldCheck, en: "Audit Log", th: "ประวัติการใช้งาน" },
      { to: "/settings", icon: Settings, en: "Settings", th: "ตั้งค่า" },
    ],
  },
];

const STORAGE_KEY = "mto-sidebar-zones";
const defaultOpen: Record<string, boolean> = {
  overview: true, sales: true, ops: true, docs: true,
  inv: false, people: false, auto: false, admin: false,
};

function ZoneGroup({ zone, openMap, toggle, onNav }: {
  zone: Zone;
  openMap: Record<string, boolean>;
  toggle: (id: string) => void;
  onNav?: () => void;
}) {
  const open = openMap[zone.id] ?? false;
  return (
    <div className="mb-1">
      <button
        onClick={() => toggle(zone.id)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors"
      >
        <span className="truncate">{zone.label} <span className="opacity-60 normal-case font-normal">({zone.thai})</span></span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", open ? "" : "-rotate-90")} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {zone.items.map((n) => (
            <NavLink
              key={`${zone.id}-${n.to}-${n.en}`}
              to={n.to}
              end={n.end}
              onClick={onNav}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <n.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">
                {n.en} <span className="opacity-60">({n.th})</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ onNav }: { onNav?: () => void }) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? { ...defaultOpen, ...JSON.parse(raw) } : defaultOpen;
    } catch { return defaultOpen; }
  });
  const toggle = (id: string) => {
    setOpenMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {zones.map((z) => (
        <ZoneGroup key={z.id} zone={z} openMap={openMap} toggle={toggle} onNav={onNav} />
      ))}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="px-5 py-5 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-display font-bold">
          M
        </div>
        <div>
          <div className="font-display font-semibold leading-tight">MTO Business OS</div>
          <div className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Private demo
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarUser() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="w-8 h-8 rounded-full bg-sidebar-accent grid place-items-center text-sm font-semibold">
          {user.name.charAt(5) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{user.name}</div>
          <div className={cn("inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5", roleBadge(user.role))}>
            {user.role}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => { logout(); navigate("/login"); }}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar text-sidebar-foreground flex-col">
        <SidebarBrand />
        <SidebarNav />
        <SidebarUser />
      </aside>

      {/* Mobile / Tablet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <div className="flex flex-col h-full">
            <SidebarBrand />
            <SidebarNav onNav={() => setMobileOpen(false)} />
            <SidebarUser />
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 h-14">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="lg:hidden font-display font-semibold text-sm">MTO OS</div>
            <div className="flex-1 max-w-xl">
              <GlobalSearch />
            </div>
            <NotificationCenter />
          </div>
        </header>

        <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
        <QuickActionsFab />
      </main>
    </div>
  );
}

export function PageHeader({ title, thai, description, actions, breadcrumbs }: {
  title: string; thai?: string; description?: string; actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-6">
      {breadcrumbs}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
            {title} {thai && <span className="text-muted-foreground font-normal">({thai})</span>}
          </h1>
          {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
