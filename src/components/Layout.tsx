import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Contact, Briefcase, FileText, Wrench, Package,
  Truck, Receipt, CalendarDays, Headphones, BarChart3, Settings, ShieldCheck,
  LogOut, Lock,
} from "lucide-react";
import { useAuth, roleBadge } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const nav = [
  { to: "/", icon: LayoutDashboard, en: "Dashboard", th: "แดชบอร์ด", end: true },
  { to: "/customers", icon: Users, en: "Customers", th: "ลูกค้า" },
  { to: "/contacts", icon: Contact, en: "Contacts", th: "ผู้ติดต่อ" },
  { to: "/deals", icon: Briefcase, en: "Deals", th: "โอกาสการขาย" },
  { to: "/quotations", icon: FileText, en: "Quotations", th: "ใบเสนอราคา" },
  { to: "/jobs", icon: Wrench, en: "Jobs", th: "งานผลิต/บริการ" },
  { to: "/parts", icon: Package, en: "Parts", th: "ชิ้นงาน" },
  { to: "/suppliers", icon: Truck, en: "Suppliers", th: "ซัพพลายเออร์" },
  { to: "/supplier-bills", icon: Receipt, en: "Supplier Bills", th: "บิลซัพพลายเออร์" },
  { to: "/calendar", icon: CalendarDays, en: "Calendar", th: "ปฏิทิน" },
  { to: "/service", icon: Headphones, en: "Service", th: "บริการหลังขาย" },
  { to: "/reports", icon: BarChart3, en: "Reports", th: "รายงาน" },
  { to: "/audit", icon: ShieldCheck, en: "Audit Log", th: "บันทึกการใช้งาน" },
  { to: "/settings", icon: Settings, en: "Settings", th: "ตั้งค่า" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-6 border-b border-sidebar-border">
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
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
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
        </nav>
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
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ title, thai, description, actions }: {
  title: string; thai?: string; description?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
          {title} {thai && <span className="text-muted-foreground font-normal">({thai})</span>}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
