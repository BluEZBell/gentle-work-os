import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/StatCard";
import { reminders, supplierBills, customerInvoices as ciFromMockData, serviceRecords } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { Bell, AlertTriangle, Clock, CheckCircle2, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tasks, customerInvoices, changeOrders, purchaseOrders } from "@/lib/mockBusiness";
import { docApprovals } from "@/lib/mockExtended";
import { findCustomer, findSupplier, findJob, fmtTHB } from "@/lib/mockData";
import { EmptyState } from "@/components/EmptyState";

type Note = {
  id: string; title: string; detail?: string; date: string;
  tone: "danger" | "warning" | "info" | "success";
  category: "Tasks" | "Payments" | "Approvals" | "Service" | "Operations";
  to: string;
};

function buildNotifications(): Note[] {
  const out: Note[] = [];
  reminders.forEach((r) => {
    const tone = r.severity === "danger" ? "danger" : r.severity === "warning" ? "warning" : r.severity === "success" ? "success" : "info";
    let to = "/";
    let category: Note["category"] = "Operations";
    if (r.type.includes("Supplier")) { const b = supplierBills.find((x) => x.id === r.refId); to = b ? `/supplier-bills/${b.id}` : "/supplier-bills"; category = "Payments"; }
    else if (r.type === "Job Due") { to = `/jobs/${r.refId}`; category = "Operations"; }
    else if (r.type === "Service / Calibration Due") { const s = serviceRecords.find((x) => x.id === r.refId); to = s ? `/service/${s.id}` : "/service"; category = "Service"; }
    else if (r.type === "Quotation Expiry") { to = `/quotations/${r.refId}`; category = "Operations"; }
    else if (r.type === "Customer Follow-up") { to = `/deals/${r.refId}`; category = "Tasks"; }
    out.push({ id: `rem-${r.id}`, title: r.title, date: r.date, tone, category, to });
  });
  tasks.filter((t) => t.status === "Overdue").forEach((t) =>
    out.push({ id: `t-${t.id}`, title: `งานเกินกำหนด: ${t.name}`, detail: t.owner, date: t.dueDate, tone: "danger", category: "Tasks", to: "/tasks" }));
  customerInvoices.filter((i) => i.status === "Overdue").forEach((i) =>
    out.push({ id: `ov-${i.id}`, title: `ใบแจ้งหนี้เกินกำหนด ${i.number}`, detail: `${findCustomer(i.customerId)?.name} • ${fmtTHB(i.total)}`, date: i.dueDate, tone: "danger", category: "Payments", to: `/invoices/${i.id}` }));
  docApprovals.filter((a) => a.status === "Pending Review" || a.status === "Submitted").forEach((a) =>
    out.push({ id: `ap-${a.id}`, title: `รออนุมัติ: ${a.docType} ${a.reference}`, detail: a.requestedBy, date: new Date().toISOString().slice(0, 10), tone: "warning", category: "Approvals", to: `/approvals/${a.id}` }));
  changeOrders.filter((c) => c.approvalStatus === "Pending").forEach((c) =>
    out.push({ id: `co-${c.id}`, title: `คำขอเปลี่ยนแปลงรออนุมัติ ${c.number}`, detail: `${findJob(c.jobId)?.number} • ${fmtTHB(c.costImpact)}`, date: c.requestDate, tone: "warning", category: "Approvals", to: `/change-orders/${c.id}` }));
  purchaseOrders.filter((p) => p.status === "Draft" || p.status === "Sent").forEach((p) =>
    out.push({ id: `po-${p.id}`, title: `ใบสั่งซื้อ ${p.number} • ${p.status}`, detail: findSupplier(p.supplierId)?.name, date: p.date, tone: "info", category: "Operations", to: `/purchase-orders/${p.id}` }));
  void ciFromMockData;
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

const toneClass = (t: Note["tone"]) =>
  t === "danger" ? "border-l-destructive bg-destructive/5" :
  t === "warning" ? "border-l-warning bg-warning-soft" :
  t === "success" ? "border-l-success bg-success-soft" :
  "border-l-primary bg-secondary/40";

export default function Notifications() {
  const all = buildNotifications();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [tab, setTab] = useState("all");
  const [read, setRead] = useState<Record<string, boolean>>({});

  const filtered = all.filter((n) =>
    (cat === "all" || n.category === cat) &&
    (tab === "all" || (tab === "unread" ? !read[n.id] : tab === "urgent" ? n.tone === "danger" : true)) &&
    (n.title.toLowerCase().includes(q.toLowerCase()) || (n.detail ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const counts = {
    urgent: all.filter((n) => n.tone === "danger").length,
    warning: all.filter((n) => n.tone === "warning").length,
    info: all.filter((n) => n.tone === "info" || n.tone === "success").length,
    unread: all.filter((n) => !read[n.id]).length,
  };

  return (
    <>
      <PageHeader title="Notifications" thai="แจ้งเตือน"
        description="ศูนย์รวมแจ้งเตือนจากทุกโมดูล — งานเกินกำหนด ใบแจ้งหนี้ค้าง บิลซัพพลายเออร์ใกล้ครบ และเอกสารรออนุมัติ" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Urgent" thai="ด่วน" value={counts.urgent} icon={AlertTriangle} tone="danger" />
        <StatCard label="Warning" thai="เตือน" value={counts.warning} icon={Clock} tone="warning" />
        <StatCard label="Info" thai="ทั่วไป" value={counts.info} icon={Bell} />
        <StatCard label="Unread" thai="ยังไม่อ่าน" value={counts.unread} icon={CheckCircle2} tone="info" />
      </div>

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาการแจ้งเตือน…" className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวด</SelectItem>
            <SelectItem value="Tasks">Tasks</SelectItem>
            <SelectItem value="Payments">Payments</SelectItem>
            <SelectItem value="Approvals">Approvals</SelectItem>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { const m: Record<string, boolean> = {}; all.forEach((n) => m[n.id] = true); setRead(m); }}>
          ทำเครื่องหมายอ่านทั้งหมด
        </Button>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({counts.unread})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({counts.urgent})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="card-soft"><EmptyState icon={Bell} title="ไม่มีการแจ้งเตือนในตัวกรองนี้" /></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => (
                <Card key={n.id} className={`card-soft p-4 border-l-4 ${toneClass(n.tone)} ${read[n.id] ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <Link to={n.to} className="flex-1 min-w-0" onClick={() => setRead({ ...read, [n.id]: true })}>
                      <div className="font-medium text-sm hover:underline">{n.title}</div>
                      {n.detail && <div className="text-xs text-muted-foreground">{n.detail}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">{n.category} • {n.date}</div>
                    </Link>
                    {!read[n.id] && (
                      <Button size="sm" variant="ghost" onClick={() => setRead({ ...read, [n.id]: true })}>อ่านแล้ว</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
