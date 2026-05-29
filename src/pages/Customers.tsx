import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useParams } from "react-router-dom";
import {
  customers, contacts, deals, quotations, jobs, serviceRecords,
  findCustomer, fmtTHB,
} from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Lock, Search, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCustomerDialog } from "@/components/dialogs/NewCustomerDialog";
import { EmptyState } from "@/components/EmptyState";
import { ActivityLog } from "@/components/ActivityLog";
import { Attachments } from "@/components/Attachments";
import { Timeline, type TimelineEvent } from "@/components/Timeline";
import { customerLeadSource, LEAD_SOURCES, customerInvoices } from "@/lib/mockBusiness";


export default function Customers() {
  useTick();
  useTick();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [lead, setLead] = useState<string>("all");
  const filtered = customers.filter((c) => {
    const matches = c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(q.toLowerCase());
    const tOk = type === "all" || c.type === type;
    const lOk = lead === "all" || customerLeadSource[c.id] === lead;
    return matches && tOk && lOk;
  });
  return (
    <>
      <PageHeader title="Customers" thai="ลูกค้า"
        description="จัดการข้อมูลลูกค้า ผู้ติดต่อ ประวัติการคุย และงานที่เกี่ยวข้องในที่เดียว"
        actions={<NewCustomerDialog />}
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาลูกค้า…" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="ประเภท" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Existing">Existing</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lead} onValueChange={setLead}>
          <SelectTrigger className="w-48"><SelectValue placeholder="ที่มา" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกที่มาของลูกค้า</SelectItem>
            {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Card className="card-soft overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="ไม่พบลูกค้าที่ตรงกับการค้นหา" hint="ลองเปลี่ยนคำค้นหรือเปลี่ยนตัวกรองดู" />
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lead Source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const dealCount = deals.filter((d) => d.customerId === c.id).length;
              return (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/customers/${c.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                      {c.confidential && <Lock className="w-3.5 h-3.5 text-warning" />}
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.address}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={c.type} tone={c.type === "Corporate" ? "primary" : c.type === "Existing" ? "info" : "muted"} /></TableCell>
                  <TableCell className="text-sm"><StatusBadge status={customerLeadSource[c.id] ?? "Other"} tone="info" /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.updatedAt}</TableCell>
                  <TableCell className="text-right font-medium">{dealCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </Card>
    </>
  );
}

export function CustomerDetail() {
  useTick();
  const { id } = useParams();
  const c = findCustomer(id!);
  if (!c) return <div>ไม่พบข้อมูลลูกค้า <Link to="/customers" className="text-primary">กลับ</Link></div>;

  const cContacts = contacts.filter((x) => x.customerId === c.id);
  const cDeals = deals.filter((d) => d.customerId === c.id);
  const cQuots = quotations.filter((q) => q.customerId === c.id);
  const cJobs = jobs.filter((j) => j.customerId === c.id);
  const cSvc = serviceRecords.filter((s) => s.customerId === c.id);

  return (
    <>
      <Link to="/customers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปหน้าลูกค้า
      </Link>
      <PageHeader title={c.name}
        description={c.confidential ? "ลูกค้าลับ — กรุณาดูแลข้อมูลเป็นพิเศษ" : undefined}
        actions={<StatusBadge status={c.type} tone={c.type === "Corporate" ? "primary" : "info"} />}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1">
          <h3 className="font-semibold mb-3">โปรไฟล์ (Profile)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {c.email}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {c.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {c.address}</div>
            <div className="pt-3 border-t mt-3 text-muted-foreground text-xs">
              ที่มา: {c.source} • สร้างเมื่อ {c.createdAt}
            </div>
            {c.notes && <div className="mt-3 p-3 bg-secondary/60 rounded text-sm">{c.notes}</div>}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">ผู้ติดต่อ ({cContacts.length})</h3>
            {cContacts.length === 0 ? <EmptyState title="ยังไม่มีผู้ติดต่อ" /> :
            <div className="space-y-2">
              {cContacts.map((ct) => (
                <div key={ct.id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                  <div>
                    <div className="font-medium">{ct.name}</div>
                    <div className="text-xs text-muted-foreground">{ct.role} • {ct.department}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{ct.email}</div>
                    <div>{ct.phone}</div>
                  </div>
                </div>
              ))}
            </div>}
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">ดีล ({cDeals.length})</h3>
            {cDeals.length === 0 ? <EmptyState title="ยังไม่มีดีล" /> :
            <div className="space-y-2">
              {cDeals.map((d) => (
                <div key={d.id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{fmtTHB(d.estimatedValue)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>}
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">ใบเสนอราคา ({cQuots.length})</h3>
              {cQuots.length === 0 ? <div className="text-xs text-muted-foreground">ไม่มี</div> : cQuots.map((q) => (
                <div key={q.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{q.number}</span>
                  <StatusBadge status={q.status} />
                </div>
              ))}
            </Card>
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">งาน ({cJobs.length})</h3>
              {cJobs.length === 0 ? <div className="text-xs text-muted-foreground">ไม่มี</div> : cJobs.map((j) => (
                <div key={j.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{j.number}</span>
                  <StatusBadge status={j.status} />
                </div>
              ))}
            </Card>
          </div>

          {cSvc.length > 0 && (
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">บริการหลังการขาย / Calibration ({cSvc.length})</h3>
              {cSvc.map((s) => (
                <div key={s.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <div>
                    <div>{s.partName}</div>
                    <div className="text-xs text-muted-foreground">ครบกำหนด {s.calibrationDueDate}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">ไทม์ไลน์ (Timeline)</h3>
              <Timeline events={buildCustomerTimeline(c.id)} />
            </Card>
            <Card className="card-soft p-5">
              <Attachments module="Customer" id={c.id} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function buildCustomerTimeline(customerId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const c = findCustomer(customerId);
  if (c) events.push({ id: `c-${c.id}`, date: c.createdAt, title: "Customer created", detail: c.name, tone: "info" });
  deals.filter((d) => d.customerId === customerId).forEach((d) =>
    events.push({ id: `d-${d.id}`, date: d.expectedCloseDate, title: `Deal — ${d.status}`, detail: d.name,
      tone: d.status === "Won" ? "success" : d.status === "Lost" ? "danger" : "info" }));
  quotations.filter((q) => q.customerId === customerId).forEach((q) =>
    events.push({ id: `q-${q.id}`, date: q.date, title: `Quotation ${q.status.toLowerCase()}`, detail: q.number, tone: "info" }));
  jobs.filter((j) => j.customerId === customerId).forEach((j) =>
    events.push({ id: `j-${j.id}`, date: j.startDate, title: `Job created`, detail: j.number, tone: "info" }));
  customerInvoices.filter((i) => i.customerId === customerId).forEach((i) =>
    events.push({ id: `i-${i.id}`, date: i.date, title: `Invoice ${i.status.toLowerCase()}`, detail: i.number,
      tone: i.status === "Paid" ? "success" : i.status === "Overdue" ? "danger" : "warning" }));
  serviceRecords.filter((s) => s.customerId === customerId).forEach((s) =>
    events.push({ id: `sv-${s.id}`, date: s.deliveryDate, title: "Service reminder created", detail: s.partName, tone: "info" }));
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

