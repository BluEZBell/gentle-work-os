import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { reminders, supplierBills, serviceRecords, findCustomer, findSupplier, findJob, fmtTHB } from "@/lib/mockData";
import { Link } from "react-router-dom";
import {
  Bell, AlertTriangle, Clock, CheckCircle2, Search,
  Wallet, Banknote, FileText, Briefcase, CheckSquare, Boxes, Wrench, CalendarSync,
} from "lucide-react";
import { tasks, customerInvoices, changeOrders, purchaseOrders } from "@/lib/mockBusiness";
import { docApprovals, stockItems, stockTotal } from "@/lib/mockExtended";
import { calendarEvents } from "@/lib/mockCalendar";
import { EmptyState } from "@/components/EmptyState";

type NoteType =
  | "Receive Payment" | "Pay Supplier" | "Billing Submission" | "Job Due"
  | "Approval Pending" | "Low Stock" | "Service Due" | "Calendar Sync";

type Note = {
  id: string; title: string; detail?: string; date: string;
  tone: "danger" | "warning" | "info" | "success";
  type: NoteType;
  to: string;
};

const TYPE_META: Record<NoteType, { thai: string; icon: React.ComponentType<{ className?: string }>; tone: "danger" | "warning" | "info" | "success" }> = {
  "Receive Payment":    { thai: "รับเงิน",       icon: Wallet,       tone: "success" },
  "Pay Supplier":       { thai: "จ่ายซัพพลายเออร์", icon: Banknote,     tone: "warning" },
  "Billing Submission": { thai: "วางบิล",         icon: FileText,     tone: "info" },
  "Job Due":            { thai: "งานครบกำหนด",   icon: Briefcase,    tone: "warning" },
  "Approval Pending":   { thai: "รออนุมัติ",      icon: CheckSquare,  tone: "warning" },
  "Low Stock":          { thai: "สต๊อกใกล้หมด",   icon: Boxes,        tone: "danger" },
  "Service Due":        { thai: "บริการ/Cal ครบ", icon: Wrench,       tone: "warning" },
  "Calendar Sync":      { thai: "ซิงค์ปฏิทิน",     icon: CalendarSync, tone: "info" },
};

const TYPES = Object.keys(TYPE_META) as NoteType[];

function buildNotifications(): Note[] {
  const out: Note[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Customer invoices → receive payment
  customerInvoices.filter((i) => i.status !== "Paid").forEach((i) => {
    const overdue = i.dueDate < today;
    out.push({
      id: `inv-${i.id}`,
      title: `ใบแจ้งหนี้ ${i.number} • ${fmtTHB(i.total)}`,
      detail: `${findCustomer(i.customerId)?.name} • ${overdue ? "เกินกำหนด" : "ครบกำหนด"} ${i.dueDate}`,
      date: i.dueDate,
      tone: overdue ? "danger" : "warning",
      type: "Receive Payment",
      to: `/invoices/${i.id}`,
    });
  });

  // Supplier bills → pay supplier
  supplierBills.filter((b) => b.status !== "Paid").forEach((b) => {
    const overdue = b.status === "Overdue";
    out.push({
      id: `bill-${b.id}`,
      title: `บิล ${b.number} • ${fmtTHB(b.total)}`,
      detail: `${findSupplier(b.supplierId)?.name} • ครบกำหนด ${b.dueDate}`,
      date: b.dueDate,
      tone: overdue ? "danger" : "warning",
      type: "Pay Supplier",
      to: `/supplier-bills/${b.id}`,
    });
  });

  // Billing submission events from calendar
  calendarEvents.filter((e) => e.type === "Billing Submission").forEach((e) => {
    out.push({
      id: `bs-${e.id}`,
      title: `วางบิล ${e.docNumber ?? ""} ${e.amount ? `• ${fmtTHB(e.amount)}` : ""}`.trim(),
      detail: `${e.customerId ? findCustomer(e.customerId)?.name : ""} • ${e.date}`,
      date: e.date,
      tone: "info",
      type: "Billing Submission",
      to: "/calendar",
    });
  });

  // Jobs due (from reminders + task overdue)
  reminders.filter((r) => r.type === "Job Due").forEach((r) => {
    out.push({
      id: `jd-${r.id}`,
      title: r.title,
      detail: `งานครบกำหนด ${r.date}`,
      date: r.date,
      tone: r.severity === "danger" ? "danger" : "warning",
      type: "Job Due",
      to: `/jobs/${r.refId}`,
    });
  });
  tasks.filter((t) => t.status === "Overdue").forEach((t) =>
    out.push({
      id: `t-${t.id}`,
      title: `งานเกินกำหนด: ${t.name}`,
      detail: `${t.owner} • ${t.dueDate}`,
      date: t.dueDate,
      tone: "danger",
      type: "Job Due",
      to: "/tasks",
    }));

  // Approvals
  docApprovals.filter((a) => a.status === "Pending Review" || a.status === "Submitted").forEach((a) =>
    out.push({
      id: `ap-${a.id}`,
      title: `รออนุมัติ: ${a.docType} ${a.reference}`,
      detail: `${a.requestedBy}${a.amount !== undefined ? ` • ${fmtTHB(a.amount)}` : ""}`,
      date: today,
      tone: "warning",
      type: "Approval Pending",
      to: `/approvals/${a.id}`,
    }));
  changeOrders.filter((c) => c.approvalStatus === "Pending").forEach((c) =>
    out.push({
      id: `co-${c.id}`,
      title: `คำขอเปลี่ยนแปลง ${c.number}`,
      detail: `${findJob(c.jobId)?.number} • ${fmtTHB(c.costImpact)}`,
      date: c.requestDate,
      tone: "warning",
      type: "Approval Pending",
      to: `/change-orders/${c.id}`,
    }));
  purchaseOrders.filter((p) => p.status === "Draft" || p.status === "Sent").forEach((p) =>
    out.push({
      id: `po-${p.id}`,
      title: `ใบสั่งซื้อ ${p.number} • ${p.status}`,
      detail: findSupplier(p.supplierId)?.name ?? "",
      date: p.date,
      tone: "info",
      type: "Approval Pending",
      to: `/purchase-orders/${p.id}`,
    }));

  // Low stock
  stockItems.filter((s) => stockTotal(s) < s.reorderPoint).forEach((s) =>
    out.push({
      id: `ls-${s.id}`,
      title: `สต๊อกต่ำ: ${s.name}`,
      detail: `คงเหลือ ${stockTotal(s)} ${s.unit} • จุดสั่ง ${s.reorderPoint}`,
      date: today,
      tone: "danger",
      type: "Low Stock",
      to: "/warehouses?filter=low",
    }));

  // Service due
  serviceRecords.filter((s) => s.status === "Due" || s.status === "Missed").forEach((s) =>
    out.push({
      id: `sv-${s.id}`,
      title: `${findCustomer(s.customerId)?.name} • ${s.partName}`,
      detail: `Calibration ครบกำหนด ${s.calibrationDueDate}`,
      date: s.calibrationDueDate,
      tone: s.status === "Missed" ? "danger" : "warning",
      type: "Service Due",
      to: `/service/${s.id}`,
    }));

  // Calendar sync
  const pendingSync = calendarEvents.filter((e) => e.syncStatus === "Pending" || !e.syncStatus).slice(0, 4);
  pendingSync.forEach((e) =>
    out.push({
      id: `cs-${e.id}`,
      title: `รอซิงค์ปฏิทิน: ${e.title ?? e.type}`,
      detail: `${e.date}`,
      date: e.date,
      tone: "info",
      type: "Calendar Sync",
      to: "/calendar-sync",
    }));

  return out.sort((a, b) => b.date.localeCompare(a.date));
}

const toneClass = (t: Note["tone"]) =>
  t === "danger" ? "border-l-destructive bg-destructive/5" :
  t === "warning" ? "border-l-warning bg-warning-soft" :
  t === "success" ? "border-l-success bg-success-soft" :
  "border-l-primary bg-secondary/40";

export default function Notifications() {
  const all = useMemo(() => buildNotifications(), []);
  const [q, setQ] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<NoteType>>(new Set());
  const [view, setView] = useState<"all" | "unread" | "urgent">("all");
  const [read, setRead] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => {
    const byType = {} as Record<NoteType, number>;
    TYPES.forEach((t) => { byType[t] = all.filter((n) => n.type === t).length; });
    return {
      byType,
      urgent: all.filter((n) => n.tone === "danger").length,
      warning: all.filter((n) => n.tone === "warning").length,
      info: all.filter((n) => n.tone === "info" || n.tone === "success").length,
      unread: all.filter((n) => !read[n.id]).length,
    };
  }, [all, read]);

  const filtered = all.filter((n) => {
    if (activeTypes.size > 0 && !activeTypes.has(n.type)) return false;
    if (view === "unread" && read[n.id]) return false;
    if (view === "urgent" && n.tone !== "danger") return false;
    if (q && !`${n.title} ${n.detail ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggleType = (t: NoteType) => {
    const s = new Set(activeTypes);
    if (s.has(t)) s.delete(t); else s.add(t);
    setActiveTypes(s);
  };

  return (
    <>
      <PageHeader title="Notifications" thai="แจ้งเตือน"
        description="ศูนย์รวมแจ้งเตือนจากทุกโมดูล — คลิกหมวดเพื่อกรอง" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Urgent" thai="ด่วน" value={counts.urgent} icon={AlertTriangle} tone="danger" />
        <StatCard label="Warning" thai="เตือน" value={counts.warning} icon={Clock} tone="warning" />
        <StatCard label="Info" thai="ทั่วไป" value={counts.info} icon={Bell} />
        <StatCard label="Unread" thai="ยังไม่อ่าน" value={counts.unread} icon={CheckCircle2} tone="info" />
      </div>

      {/* Clickable type chips */}
      <Card className="card-soft p-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const active = activeTypes.has(t);
            const count = counts.byType[t];
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background hover:bg-secondary/60 border-border")
                }>
                <Icon className="w-3.5 h-3.5" />
                <span>{t}</span>
                <span className="text-[10px] opacity-70">({meta.thai})</span>
                <span className={"ml-1 px-1.5 rounded-full text-[10px] " + (active ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
              </button>
            );
          })}
          {activeTypes.size > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveTypes(new Set())}>
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </Card>

      <Card className="card-soft p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาการแจ้งเตือน…" className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          {(["all", "unread", "urgent"] as const).map((v) => (
            <Button key={v} variant={view === v ? "default" : "outline"} size="sm" className="h-8 text-xs capitalize" onClick={() => setView(v)}>
              {v === "all" ? `ทั้งหมด (${all.length})` : v === "unread" ? `ยังไม่อ่าน (${counts.unread})` : `ด่วน (${counts.urgent})`}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs"
          onClick={() => { const m: Record<string, boolean> = {}; all.forEach((n) => m[n.id] = true); setRead(m); }}>
          ทำเครื่องหมายอ่านทั้งหมด
        </Button>
      </Card>

      {filtered.length === 0 ? (
        <Card className="card-soft"><EmptyState icon={Bell} title="ไม่มีการแจ้งเตือนในตัวกรองนี้" /></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = TYPE_META[n.type].icon;
            return (
              <Card key={n.id} className={`card-soft p-4 border-l-4 ${toneClass(n.tone)} ${read[n.id] ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <Link to={n.to} className="flex-1 min-w-0 flex items-start gap-3" onClick={() => setRead({ ...read, [n.id]: true })}>
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm hover:underline">{n.title}</div>
                      {n.detail && <div className="text-xs text-muted-foreground">{n.detail}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        <button onClick={(e) => { e.preventDefault(); toggleType(n.type); }} className="hover:underline">
                          {n.type}
                        </button>
                        {" • "}{n.date}
                      </div>
                    </div>
                  </Link>
                  {!read[n.id] && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setRead({ ...read, [n.id]: true })}>อ่านแล้ว</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
