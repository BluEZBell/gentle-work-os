import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Contact, Briefcase, FileText, Wrench, Package,
  Truck, Receipt, CalendarDays, Headphones, BarChart3, Settings, ShieldCheck,
  LogOut, Lock, ShoppingCart, FileSpreadsheet, GitPullRequest, ListTodo, Menu,
} from "lucide-react";
import { useAuth, roleBadge } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { QuickActionsFab } from "@/components/QuickActionsFab";

const nav = [
  { to: "/", icon: LayoutDashboard, en: "Dashboard", th: "แดชบอร์ด", end: true },
  { to: "/tasks", icon: ListTodo, en: "Tasks", th: "งานที่ต้องทำ" },
  { to: "/customers", icon: Users, en: "Customers", th: "ลูกค้า" },
  { to: "/contacts", icon: Contact, en: "Contacts", th: "ผู้ติดต่อ" },
  { to: "/deals", icon: Briefcase, en: "Deals", th: "โอกาสการขาย" },
  { to: "/quotations", icon: FileText, en: "Quotations", th: "ใบเสนอราคา" },
  { to: "/jobs", icon: Wrench, en: "Jobs", th: "งานผลิต/บริการ" },
  { to: "/change-orders", icon: GitPullRequest, en: "Change Orders", th: "คำขอเปลี่ยนแปลง" },
  { to: "/parts", icon: Package, en: "Parts", th: "ชิ้นงาน" },
  { to: "/suppliers", icon: Truck, en: "Suppliers", th: "ซัพพลายเออร์" },
  { to: "/purchase-orders", icon: ShoppingCart, en: "Purchase Orders", th: "ใบสั่งซื้อ" },
  { to: "/supplier-bills", icon: Receipt, en: "Supplier Bills", th: "บิลซัพพลายเออร์" },
  { to: "/invoices", icon: FileSpreadsheet, en: "Invoices", th: "ใบแจ้งหนี้" },
  { to: "/calendar", icon: CalendarDays, en: "Calendar", th: "ปฏิทิน" },
  { to: "/service", icon: Headphones, en: "Service", th: "บริการหลังขาย" },
  { to: "/reports", icon: BarChart3, en: "Reports", th: "รายงาน" },
  { to: "/audit", icon: ShieldCheck, en: "Audit Log", th: "บันทึกการใช้งาน" },
  { to: "/settings", icon: Settings, en: "Settings", th: "ตั้งค่า" },
];

function SidebarNav({ onNav }: { onNav?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {nav.map((n) => (
        <NavLink
          key={n.to} to={n.to} end={n.end} onClick={onNav}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
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

export function PageHeader({ title, thai, description, actions }: {
  title: string; thai?: string; description?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
          {title} {thai && <span className="text-muted-foreground font-normal">({thai})</span>}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
