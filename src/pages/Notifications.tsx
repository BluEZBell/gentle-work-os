import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  reminders, supplierBills, serviceRecords, customers,
  findCustomer, findSupplier, findJob, fmtTHB,
} from "@/lib/mockData";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, AlertTriangle, Clock, CheckCircle2, Search, Pin, PinOff,
  Wallet, Banknote, FileText, Briefcase, CheckSquare, Boxes, Wrench, CalendarSync,
  MoreHorizontal, X, MailOpen, Mail, Flame, ExternalLink, Cog,
} from "lucide-react";
import { tasks, customerInvoices, changeOrders, purchaseOrders } from "@/lib/mockBusiness";
import { docApprovals, stockItems, stockTotal } from "@/lib/mockExtended";
import { calendarEvents } from "@/lib/mockCalendar";
import { EmptyState } from "@/components/EmptyState";

type NoteType =
  | "Receive Payment" | "Pay Supplier" | "Billing Submission" | "Job Due"
  | "Approval Pending" | "Low Stock" | "Service Due" | "Calendar Sync" | "System";

type Note = {
  id: string; title: string; detail?: string; date: string;
  baseTone: "danger" | "warning" | "info" | "success";
  type: NoteType;
  to: string;
  customerId?: string;
};

const TYPE_META: Record<NoteType, { thai: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Receive Payment":    { thai: "รับเงิน",       icon: Wallet },
  "Pay Supplier":       { thai: "จ่ายเงิน",      icon: Banknote },
  "Billing Submission": { thai: "วางบิล",         icon: FileText },
  "Job Due":            { thai: "งานครบกำหนด",   icon: Briefcase },
  "Approval Pending":   { thai: "เอกสารรออนุมัติ", icon: CheckSquare },
  "Low Stock":          { thai: "ของใกล้หมด",    icon: Boxes },
  "Service Due":        { thai: "Service ใกล้ครบ", icon: Wrench },
  "Calendar Sync":      { thai: "Calendar Sync",  icon: CalendarSync },
  "System":             { thai: "System",         icon: Cog },
};

const TYPES = Object.keys(TYPE_META) as NoteType[];

function buildNotifications(): Note[] {
  const out: Note[] = [];
  const today = new Date().toISOString().slice(0, 10);

  customerInvoices.filter((i) => i.status !== "Paid").forEach((i) => {
    const overdue = i.dueDate < today;
    out.push({
      id: `inv-${i.id}`,
      title: `ใบแจ้งหนี้ ${i.number} • ${fmtTHB(i.total)}`,
      detail: `${findCustomer(i.customerId)?.name} • ${overdue ? "เกินกำหนด" : "ครบกำหนด"} ${i.dueDate}`,
      date: i.dueDate,
      baseTone: overdue ? "danger" : "warning",
      type: "Receive Payment",
      to: `/invoices/${i.id}`,
      customerId: i.customerId,
    });
  });

  supplierBills.filter((b) => b.status !== "Paid").forEach((b) => {
    const overdue = b.status === "Overdue";
    out.push({
      id: `bill-${b.id}`,
      title: `บิล ${b.number} • ${fmtTHB(b.total)}`,
      detail: `${findSupplier(b.supplierId)?.name} • ครบกำหนด ${b.dueDate}`,
      date: b.dueDate,
      baseTone: overdue ? "danger" : "warning",
      type: "Pay Supplier",
      to: `/supplier-bills/${b.id}`,
    });
  });

  calendarEvents.filter((e) => e.type === "Billing Submission").forEach((e) => {
    out.push({
      id: `bs-${e.id}`,
      title: `วางบิล ${e.docNumber ?? ""} ${e.amount ? `• ${fmtTHB(e.amount)}` : ""}`.trim(),
      detail: `${e.customerId ? findCustomer(e.customerId)?.name : ""} • ${e.date}`,
      date: e.date,
      baseTone: "info",
      type: "Billing Submission",
      to: "/calendar",
      customerId: e.customerId,
    });
  });

  reminders.filter((r) => r.type === "Job Due").forEach((r) => {
    const job = findJob(r.refId);
    out.push({
      id: `jd-${r.id}`,
      title: r.title,
      detail: `งานครบกำหนด ${r.date}`,
      date: r.date,
      baseTone: r.severity === "danger" ? "danger" : "warning",
      type: "Job Due",
      to: `/jobs/${r.refId}`,
      customerId: job?.customerId,
    });
  });
  tasks.filter((t) => t.status === "Overdue").forEach((t) =>
    out.push({
      id: `t-${t.id}`,
      title: `งานเกินกำหนด: ${t.name}`,
      detail: `${t.owner} • ${t.dueDate}`,
      date: t.dueDate,
      baseTone: "danger",
      type: "Job Due",
      to: "/tasks",
    }));

  docApprovals.filter((a) => a.status === "Pending Review" || a.status === "Submitted").forEach((a) =>
    out.push({
      id: `ap-${a.id}`,
      title: `รออนุมัติ: ${a.docType} ${a.reference}`,
      detail: `${a.requestedBy}${a.amount !== undefined ? ` • ${fmtTHB(a.amount)}` : ""}`,
      date: today,
      baseTone: "warning",
      type: "Approval Pending",
      to: `/approvals/${a.id}`,
    }));
  changeOrders.filter((c) => c.approvalStatus === "Pending").forEach((c) => {
    const job = findJob(c.jobId);
    out.push({
      id: `co-${c.id}`,
      title: `คำขอเปลี่ยนแปลง ${c.number}`,
      detail: `${job?.number} • ${fmtTHB(c.costImpact)}`,
      date: c.requestDate,
      baseTone: "warning",
      type: "Approval Pending",
      to: `/change-orders/${c.id}`,
      customerId: job?.customerId,
    });
  });
  purchaseOrders.filter((p) => p.status === "Draft" || p.status === "Sent").forEach((p) =>
    out.push({
      id: `po-${p.id}`,
      title: `ใบสั่งซื้อ ${p.number} • ${p.status}`,
      detail: findSupplier(p.supplierId)?.name ?? "",
      date: p.date,
      baseTone: "info",
      type: "Approval Pending",
      to: `/purchase-orders/${p.id}`,
    }));

  stockItems.filter((s) => stockTotal(s) < s.reorderPoint).forEach((s) =>
    out.push({
      id: `ls-${s.id}`,
      title: `สต๊อกต่ำ: ${s.name}`,
      detail: `คงเหลือ ${stockTotal(s)} ${s.unit} • จุดสั่ง ${s.reorderPoint}`,
      date: today,
      baseTone: "danger",
      type: "Low Stock",
      to: "/warehouses?filter=low",
    }));

  serviceRecords.filter((s) => s.status === "Due" || s.status === "Missed").forEach((s) =>
    out.push({
      id: `sv-${s.id}`,
      title: `${findCustomer(s.customerId)?.name} • ${s.partName}`,
      detail: `Calibration ครบกำหนด ${s.calibrationDueDate}`,
      date: s.calibrationDueDate,
      baseTone: s.status === "Missed" ? "danger" : "warning",
      type: "Service Due",
      to: `/service/${s.id}`,
      customerId: s.customerId,
    }));

  calendarEvents.filter((e) => e.syncStatus === "Pending" || !e.syncStatus).slice(0, 4).forEach((e) =>
    out.push({
      id: `cs-${e.id}`,
      title: `รอซิงค์ปฏิทิน: ${e.title ?? e.type}`,
      detail: `${e.date}`,
      date: e.date,
      baseTone: "info",
      type: "Calendar Sync",
      to: "/calendar-sync",
    }));

  return out.sort((a, b) => b.date.localeCompare(a.date));
}

type StatusFilter = "all" | "urgent" | "unread" | "read" | "pinned" | "today" | "overdue";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all:      "ทั้งหมด",
  urgent:   "Urgent (ด่วน)",
  unread:   "Unread (ยังไม่ได้อ่าน)",
  read:     "Read (อ่านแล้ว)",
  pinned:   "Pinned (ปักหมุด)",
  today:    "Today (วันนี้)",
  overdue:  "Overdue (เกินกำหนด)",
};

const STATUS_ORDER: StatusFilter[] = ["all", "urgent", "unread", "read", "pinned", "today", "overdue"];

export default function Notifications() {
  const all = useMemo(() => buildNotifications(), []);
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [moduleType, setModuleType] = useState<NoteType | "all">("all");
  const [custScope, setCustScope] = useState<"all" | "specific" | "general">("all");
  const [customerId, setCustomerId] = useState<string>("all");

  // Per-notification state overrides
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [urgentOverride, setUrgentOverride] = useState<Record<string, boolean | undefined>>({});

  const today = new Date().toISOString().slice(0, 10);

  const isUrgent = (n: Note) => {
    const o = urgentOverride[n.id];
    if (o !== undefined) return o;
    return n.baseTone === "danger";
  };

  const matchScope = (n: Note) => {
    if (custScope === "all") return true;
    if (custScope === "general") return !n.customerId;
    if (custScope === "specific") {
      if (!n.customerId) return false;
      if (customerId === "all") return true;
      return n.customerId === customerId;
    }
    return true;
  };

  const matchStatus = (n: Note) => {
    switch (status) {
      case "all": return true;
      case "urgent": return isUrgent(n);
      case "unread": return !read[n.id];
      case "read": return !!read[n.id];
      case "pinned": return !!pinned[n.id];
      case "today": return n.date === today;
      case "overdue": return n.date < today;
    }
  };

  const matchModule = (n: Note) => moduleType === "all" || n.type === moduleType;
  const matchSearch = (n: Note) =>
    !q || `${n.title} ${n.detail ?? ""}`.toLowerCase().includes(q.toLowerCase());

  const filtered = all.filter((n) => matchStatus(n) && matchModule(n) && matchScope(n) && matchSearch(n));

  const counts = useMemo(() => ({
    all: all.length,
    urgent: all.filter(isUrgent).length,
    unread: all.filter((n) => !read[n.id]).length,
    read: all.filter((n) => !!read[n.id]).length,
    pinned: all.filter((n) => !!pinned[n.id]).length,
    today: all.filter((n) => n.date === today).length,
    overdue: all.filter((n) => n.date < today).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [all, read, pinned, urgentOverride]);

  // Module chip counts reflect current status + scope + search (but ignore module
  // itself) so picking a status first updates the chips to that subset.
  const moduleScoped = all.filter((n) => matchStatus(n) && matchScope(n) && matchSearch(n));
  const moduleAllCount = moduleScoped.length;
  const moduleCounts = useMemo(() => {
    const m = {} as Record<NoteType, number>;
    TYPES.forEach((t) => { m[t] = moduleScoped.filter((n) => n.type === t).length; });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, status, custScope, customerId, q, read, pinned, urgentOverride]);

  const pinnedUrgent = all.filter((n) => pinned[n.id] && isUrgent(n));

  const resetFilters = () => {
    setStatus("all"); setModuleType("all");
    setCustScope("all"); setCustomerId("all"); setQ("");
  };

  const markAllReadFiltered = () => {
    const m = { ...read };
    filtered.forEach((n) => { m[n.id] = true; });
    setRead(m);
    toast({ title: "ทำเครื่องหมายว่าอ่านแล้วทั้งหมด" });
  };

  const toggleRead = (id: string) => setRead({ ...read, [id]: !read[id] });
  const togglePin = (id: string) => setPinned({ ...pinned, [id]: !pinned[id] });
  const toggleUrgent = (n: Note) =>
    setUrgentOverride({ ...urgentOverride, [n.id]: !isUrgent(n) });

  const isAnyFilter = status !== "all" || moduleType !== "all" || custScope !== "all" || q !== "";

  return (
    <>
      <PageHeader title="Notifications" thai="แจ้งเตือน"
        description="ศูนย์ควบคุมการแจ้งเตือน — กรอง อ่าน ปักหมุด รายการสำคัญได้ในที่เดียว" />

      {/* Large clickable status summary cards */}
      {(() => {
        const cards: { key: StatusFilter; label: string; thai: string; icon: typeof Bell; tone: string; iconCls: string }[] = [
          { key: "all",     label: "All",     thai: "ทั้งหมด",       icon: Bell,            tone: "bg-accent text-primary",                 iconCls: "text-primary" },
          { key: "urgent",  label: "Urgent",  thai: "ด่วน",          icon: AlertTriangle,   tone: "bg-destructive-soft text-destructive",   iconCls: "text-destructive" },
          { key: "unread",  label: "Unread",  thai: "ยังไม่อ่าน",   icon: Mail,            tone: "bg-warning-soft text-warning-foreground", iconCls: "text-warning" },
          { key: "read",    label: "Read",    thai: "อ่านแล้ว",      icon: MailOpen,        tone: "bg-muted text-muted-foreground",         iconCls: "text-muted-foreground" },
          { key: "pinned",  label: "Pinned",  thai: "ปักหมุด",       icon: Pin,             tone: "bg-info-soft text-info",                 iconCls: "text-info" },
          { key: "today",   label: "Today",   thai: "วันนี้",        icon: Clock,           tone: "bg-accent text-primary",                 iconCls: "text-primary" },
          { key: "overdue", label: "Overdue", thai: "เกินกำหนด",     icon: CalendarSync,    tone: "bg-destructive-soft text-destructive",   iconCls: "text-destructive" },
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
            {cards.map((c) => {
              const Icon = c.icon;
              const active = status === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setStatus(c.key)}
                  aria-pressed={active}
                  className={
                    "text-left rounded-xl border bg-card p-4 transition shadow-sm hover:shadow-md hover:-translate-y-0.5 " +
                    (active
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        {c.label}<span className="ml-1 normal-case text-[11px]">({c.thai})</span>
                      </div>
                      <div className="mt-1 font-display text-2xl font-semibold text-foreground">{counts[c.key]}</div>
                    </div>
                    <div className={"w-10 h-10 rounded-lg grid place-items-center shrink-0 " + c.tone}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Pinned urgent zone */}

      {pinnedUrgent.length > 0 && (
        <Card className="card-soft p-4 mb-4 border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-destructive" />
            <div className="font-semibold text-sm">รายการด่วนที่ปักหมุดไว้</div>
            <span className="text-xs text-muted-foreground">({pinnedUrgent.length})</span>
          </div>
          <div className="space-y-2">
            {pinnedUrgent.map((n) => {
              const Icon = TYPE_META[n.type].icon;
              const cust = n.customerId ? findCustomer(n.customerId)?.name : "ทั่วไป";
              return (
                <div key={`p-${n.id}`} className="flex items-start gap-3 p-2 rounded-md bg-background/70">
                  <Icon className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link to={n.to} className="font-medium text-sm hover:underline">{n.title}</Link>
                    <div className="text-xs text-muted-foreground truncate">
                      {cust} • {TYPE_META[n.type].thai} • {n.date}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleRead(n.id)}>
                    {read[n.id] ? "ยังไม่อ่าน" : "อ่านแล้ว"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(n.id)} title="ยกเลิกปักหมุด">
                    <PinOff className="w-3.5 h-3.5" />
                  </Button>
                  <Link to={n.to}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="เปิดรายการ">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}


      {/* Module filter (secondary) */}
      <Card className="card-soft p-3 mb-3">
        <div className="text-xs text-muted-foreground mb-2">โมดูล</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setModuleType("all")}
            className={
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs " +
              (moduleType === "all" ? "bg-secondary border-primary" : "bg-background hover:bg-secondary/60")
            }>
            ทั้งหมด <span className="text-[10px] opacity-70">({all.length})</span>
          </button>
          {TYPES.map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const active = moduleType === t;
            return (
              <button key={t} onClick={() => setModuleType(t)}
                className={
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs " +
                  (active ? "bg-secondary border-primary" : "bg-background hover:bg-secondary/60")
                }>
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.thai}</span>
                <span className="text-[10px] opacity-70">({moduleCounts[t]})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Customer + search + actions */}
      <Card className="card-soft p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาการแจ้งเตือน…" className="pl-9 h-9" />
        </div>

        <Select value={custScope} onValueChange={(v) => setCustScope(v as typeof custScope)}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="specific">ลูกค้าที่ระบุ</SelectItem>
            <SelectItem value="general">ทั่วไป / ไม่ผูกกับลูกค้า</SelectItem>
          </SelectContent>
        </Select>

        {custScope === "specific" && (
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกลูกค้า</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={markAllReadFiltered}>
          <MailOpen className="w-3.5 h-3.5 mr-1" />
          ทำเครื่องหมายว่าอ่านทั้งหมด
        </Button>
        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={resetFilters} disabled={!isAnyFilter}>
          <X className="w-3.5 h-3.5 mr-1" />
          ล้างตัวกรอง
        </Button>
      </Card>

      {filtered.length === 0 ? (
        <Card className="card-soft"><EmptyState icon={Bell} title="ไม่มีการแจ้งเตือนในตัวกรองนี้" /></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = TYPE_META[n.type].icon;
            const urgent = isUrgent(n);
            const isRead = !!read[n.id];
            const isPinned = !!pinned[n.id];
            const cust = n.customerId ? findCustomer(n.customerId)?.name : "ทั่วไป";

            const border = urgent
              ? "border-l-destructive bg-destructive/5"
              : isRead ? "border-l-border bg-background"
              : "border-l-primary bg-secondary/40";

            return (
              <Card key={n.id} className={`card-soft p-4 border-l-4 ${border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    {!isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${urgent ? "text-destructive" : "text-muted-foreground"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={n.to} className={`text-sm hover:underline ${isRead ? "font-normal" : "font-semibold"}`}>
                          {n.title}
                        </Link>
                        {urgent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">ด่วน</span>
                        )}
                        {isPinned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary inline-flex items-center gap-1">
                            <Pin className="w-3 h-3" />ปักหมุด
                          </span>
                        )}
                        {!isRead ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning-soft text-warning">ยังไม่ได้อ่าน</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">อ่านแล้ว</span>
                        )}
                      </div>
                      {n.detail && <div className="text-xs text-muted-foreground mt-0.5">{n.detail}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>{cust}</span><span>•</span>
                        <button onClick={() => setModuleType(n.type)} className="hover:underline">
                          {TYPE_META[n.type].thai}
                        </button>
                        <span>•</span><span>{n.date}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => toggleRead(n.id)}>
                        {isRead ? <><Mail className="w-4 h-4 mr-2" />ทำเครื่องหมายว่ายังไม่ได้อ่าน</>
                                : <><MailOpen className="w-4 h-4 mr-2" />ทำเครื่องหมายว่าอ่านแล้ว</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePin(n.id)}>
                        {isPinned ? <><PinOff className="w-4 h-4 mr-2" />ยกเลิกปักหมุด</>
                                  : <><Pin className="w-4 h-4 mr-2" />ปักหมุด</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleUrgent(n)}>
                        <Flame className="w-4 h-4 mr-2" />
                        {urgent ? "ยกเลิกด่วน" : "เปลี่ยนเป็นด่วน"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={n.to}>
                          <ExternalLink className="w-4 h-4 mr-2" />เปิดรายการที่เกี่ยวข้อง
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
