import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { roleBadge, useAuth } from "@/lib/auth";
import { users as userList } from "@/lib/mockData";
import { audit } from "@/lib/store";
import { toast } from "sonner";
import { ShieldCheck, Building2, Lock, Download, Brain, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const security = [
  { label: "VPN-only production access recommended", on: true },
  { label: "Database is not publicly exposed", on: true },
  { label: "Encrypted backup required", on: true },
  { label: "Export restricted to Owner", on: true },
  { label: "AI must not auto-approve financial records", on: true },
  { label: "Audit log enabled", on: true },
];

const aiRules = [
  { label: "Auto-extract supplier bill from email", on: true },
  { label: "Auto-suggest service reminders", on: true },
  { label: "Auto-approve financial records", on: false, locked: true },
  { label: "Auto-send quotations to customer", on: false },
];

const rolePerms = [
  { role: "Owner", access: "Full access — create, edit, delete, export, settings" },
  { role: "Operator", access: "Create / edit. Cannot delete or export." },
  { role: "Viewer", access: "Read-only across all modules." },
];

export default function Settings() {
  const { user, can } = useAuth();
  const tryExport = () => {
    if (!can("export")) {
      audit(user?.name ?? "Demo", "Export Attempt", "Customers CSV", "Settings", "DENIED");
      toast.error("Export restricted to Owner role");
      return;
    }
    audit(user?.name ?? "Demo", "Export Data", "Customers CSV", "Settings");
    toast.success("Export queued (demo)");
  };
  return (
    <>
      <PageHeader title="Settings" thai="ตั้งค่า"
        description="ตั้งค่าข้อมูลบริษัท ผู้ใช้งาน สิทธิ์การเข้าถึง และกฎการทำงานของระบบ"
      />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">โหมดเดโม</AlertTitle>
        <AlertDescription className="text-info/90">
          นี่เป็นเดโมส่วนตัวที่ใช้ข้อมูลตัวอย่างเท่านั้น ยังไม่ได้เชื่อมต่อกับระบบลูกค้า การเงิน ปฏิทิน หรืออีเมลจริง
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Company Profile</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Company Name</Label><Input defaultValue="Private MTO Co., Ltd." /></div>
            <div className="space-y-1.5"><Label>Tax ID</Label><Input defaultValue="0105563000000" /></div>
            <div className="space-y-1.5"><Label>Address</Label><Input defaultValue="Bangkok, Thailand" /></div>
          </div>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Security Settings</h3>
          </div>
          <div className="space-y-3">
            {security.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span>{s.label}</span>
                <Switch checked={s.on} disabled />
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">User Roles</h3>
          </div>
          <div className="space-y-2 mb-4">
            {rolePerms.map((r) => (
              <div key={r.role} className="text-sm border-b last:border-0 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", roleBadge(r.role as never))}>{r.role}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{r.access}</div>
              </div>
            ))}
          </div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Active users</div>
          {userList.map((u) => (
            <div key={u.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
              <span>{u.name}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium self-center", roleBadge(u.role))}>{u.role}</span>
            </div>
          ))}
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Backup & Export</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Last backup</span><StatusBadge status="2026-05-29 03:00" tone="success" /></div>
            <div className="flex justify-between"><span>Backup encryption</span><StatusBadge status="AES-256" tone="success" /></div>
            <div className="flex justify-between"><span>Data export</span><StatusBadge status="Owner only" tone="warning" /></div>
            <Button variant="outline" className="w-full mt-2" onClick={tryExport}>
              {can("export") ? "Request export (Owner)" : "Export blocked — Owner only"}
            </Button>
          </div>
        </Card>

        <Card className="card-soft p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">AI Automation Rules</h3>
          </div>
          <Alert className="mb-4 border-warning/40 bg-warning-soft">
            <ShieldAlert className="h-4 w-4 text-warning-foreground" />
            <AlertTitle className="text-warning-foreground">Human-in-the-loop required</AlertTitle>
            <AlertDescription className="text-warning-foreground/80">
              AI may extract and suggest, but financial records and customer-facing documents must be approved by a person.
            </AlertDescription>
          </Alert>
          <div className="grid md:grid-cols-2 gap-3">
            {aiRules.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                <span className={r.locked ? "text-muted-foreground" : ""}>{r.label}</span>
                <Switch checked={r.on} disabled={r.locked} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
