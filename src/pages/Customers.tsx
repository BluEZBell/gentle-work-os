import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useParams } from "react-router-dom";
import {
  customers, contacts, deals, quotations, jobs, serviceRecords,
  findCustomer, findJob, fmtTHB,
} from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Lock, Search, Mail, Phone, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCustomerDialog } from "@/components/dialogs/NewCustomerDialog";
import { EmptyState } from "@/components/EmptyState";
import { Attachments } from "@/components/Attachments";
import { Timeline, type TimelineEvent } from "@/components/Timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  customerLeadSource, LEAD_SOURCES, customerInvoices, purchaseOrders, changeOrders,
  tasks, activities,
} from "@/lib/mockBusiness";
import { BillingRulesTab } from "@/components/BillingRulesTab";


export default function Customers() {
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
        description="จัดการข้อมูลลูกค้า ผู้ติดต่อ ประวัติการคุย และงานที่เกี่ยวข้องในที่เดียว — คลิกชื่อลูกค้าเพื่อดูโปรไฟล์ 360°"
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
  const cJobIds = new Set(cJobs.map((j) => j.id));
  const cInvoices = customerInvoices.filter((i) => i.customerId === c.id);
  const cPOs = purchaseOrders.filter((p) => cJobIds.has(p.jobId));
  const cCOs = changeOrders.filter((co) => cJobIds.has(co.jobId));
  const cTasks = tasks.filter((t) => t.customerId === c.id || (t.jobId && cJobIds.has(t.jobId)));
  const cActivities = activities.filter((a) => a.customerId === c.id);
  const cSvc = serviceRecords.filter((s) => s.customerId === c.id);
  const paid = cInvoices.filter((i) => i.status === "Paid").reduce((a, b) => a + b.total, 0);
  const outstanding = cInvoices.filter((i) => i.status !== "Paid").reduce((a, b) => a + b.total, 0);

  return (
    <>
      <PageHeader
        title={c.name}
        breadcrumbs={<Breadcrumbs items={[{ label: "Customers (ลูกค้า)", to: "/customers" }, { label: c.name }]} />}
        description={c.confidential ? "ลูกค้าลับ — กรุณาดูแลข้อมูลเป็นพิเศษ" : "โปรไฟล์ 360° — ดูทุกข้อมูลที่เกี่ยวข้องกับลูกค้ารายนี้"}
        actions={<StatusBadge status={c.type} tone={c.type === "Corporate" ? "primary" : "info"} />}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold mb-3">โปรไฟล์ (Profile)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {c.email}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {c.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {c.address}</div>
            <div className="pt-3 border-t mt-3 text-muted-foreground text-xs">
              ที่มา: {customerLeadSource[c.id] ?? c.source} • สร้างเมื่อ {c.createdAt}
            </div>
            {c.notes && <div className="mt-3 p-3 bg-secondary/60 rounded text-sm">{c.notes}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-lg bg-secondary/60 p-3">
              <div className="text-[11px] text-muted-foreground">ชำระแล้ว</div>
              <div className="font-display font-semibold text-success">{fmtTHB(paid)}</div>
            </div>
            <div className="rounded-lg bg-warning-soft p-3">
              <div className="text-[11px] text-muted-foreground">ค้างรับ</div>
              <div className="font-display font-semibold text-warning-foreground">{fmtTHB(outstanding)}</div>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <div className="text-[11px] text-muted-foreground">งานทั้งหมด</div>
              <div className="font-display font-semibold">{cJobs.length}</div>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <div className="text-[11px] text-muted-foreground">ดีล</div>
              <div className="font-display font-semibold">{cDeals.length}</div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap h-auto justify-start">
              <TabsTrigger value="overview">Overview (ภาพรวม)</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({cContacts.length})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({cDeals.length})</TabsTrigger>
              <TabsTrigger value="pos">Customer PO ({cPOs.length})</TabsTrigger>
              <TabsTrigger value="quotes">Quotations ({cQuots.length})</TabsTrigger>
              <TabsTrigger value="jobs">Jobs ({cJobs.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({cInvoices.length})</TabsTrigger>
              <TabsTrigger value="service">Service ({cSvc.length})</TabsTrigger>
              <TabsTrigger value="activities">Activities ({cActivities.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({cTasks.length})</TabsTrigger>
              <TabsTrigger value="billing">Billing Rules (กฎวางบิล)</TabsTrigger>
              <TabsTrigger value="attach">Attachments</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 grid md:grid-cols-2 gap-4">
              <SectionCard title={`ดีลล่าสุด (${cDeals.length})`} empty={!cDeals.length}>
                {cDeals.slice(0, 4).map((d) => (
                  <Row key={d.id} left={<Link to={`/deals/${d.id}`} className="text-primary hover:underline">{d.name}</Link>} right={<><span className="text-muted-foreground mr-2">{fmtTHB(d.estimatedValue)}</span><StatusBadge status={d.status} /></>} />
                ))}
              </SectionCard>
              <SectionCard title={`งานล่าสุด (${cJobs.length})`} empty={!cJobs.length}>
                {cJobs.slice(0, 4).map((j) => (
                  <Row key={j.id} left={<Link to={`/jobs/${j.id}`} className="text-primary hover:underline">{j.number}</Link>} right={<StatusBadge status={j.status} />} sub={j.name} />
                ))}
              </SectionCard>
              <SectionCard title={`ใบเสนอราคา (${cQuots.length})`} empty={!cQuots.length}>
                {cQuots.slice(0, 4).map((q) => (
                  <Row key={q.id} left={<Link to={`/quotations/${q.id}`} className="text-primary hover:underline">{q.number}</Link>} right={<StatusBadge status={q.status} />} />
                ))}
              </SectionCard>
              <SectionCard title={`ใบแจ้งหนี้ (${cInvoices.length})`} empty={!cInvoices.length}>
                {cInvoices.slice(0, 4).map((i) => (
                  <Row key={i.id} left={<Link to={`/invoices/${i.id}`} className="text-primary hover:underline">{i.number}</Link>}
                    right={<><span className="text-muted-foreground mr-2">{fmtTHB(i.total)}</span><StatusBadge status={i.status} /></>} />
                ))}
              </SectionCard>
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <Card className="card-soft p-5">
                {cContacts.length === 0 ? <EmptyState title="ยังไม่มีผู้ติดต่อ" /> :
                  cContacts.map((ct) => (
                    <div key={ct.id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                      <div>
                        <div className="font-medium">{ct.name}</div>
                        <div className="text-xs text-muted-foreground">{ct.role} • {ct.department}</div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{ct.email}</div><div>{ct.phone}</div>
                      </div>
                    </div>
                  ))}
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <ListCard items={cDeals} empty="ยังไม่มีดีล" render={(d) => (
                <Row key={d.id} left={<Link to={`/deals/${d.id}`} className="text-primary hover:underline">{d.name}</Link>}
                  right={<><span className="text-muted-foreground mr-2">{fmtTHB(d.estimatedValue)}</span><StatusBadge status={d.status} /></>}
                  sub={`ปิดคาด ${d.expectedCloseDate} • ${d.probability}%`} />
              )} />
            </TabsContent>

            <TabsContent value="pos" className="mt-4">
              <ListCard items={cPOs} empty="ยังไม่มี PO ลูกค้า" render={(p) => (
                <Row key={p.id} left={<Link to={`/customer-po/${p.id}`} className="text-primary hover:underline">{p.number}</Link>}
                  right={<StatusBadge status={p.status} />}
                  sub={`Job ${findJob(p.jobId)?.number ?? "—"} • ครบกำหนด ${p.expectedDelivery}`} />
              )} />
            </TabsContent>

            <TabsContent value="quotes" className="mt-4">
              <ListCard items={cQuots} empty="ยังไม่มีใบเสนอราคา" render={(q) => (
                <Row key={q.id} left={<Link to={`/quotations/${q.id}`} className="text-primary hover:underline">{q.number}</Link>}
                  right={<StatusBadge status={q.status} />} sub={`${q.date} → ${q.validUntil}`} />
              )} />
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <ListCard items={cJobs} empty="ยังไม่มีงาน" render={(j) => (
                <Row key={j.id} left={<Link to={`/jobs/${j.id}`} className="text-primary hover:underline">{j.number}</Link>}
                  right={<StatusBadge status={j.status} />} sub={`${j.name} • ครบกำหนด ${j.dueDate}`} />
              )} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-4 space-y-4">
              <ListCard items={cInvoices} empty="ยังไม่มีใบแจ้งหนี้" render={(i) => (
                <Row key={i.id} left={<Link to={`/invoices/${i.id}`} className="text-primary hover:underline">{i.number}</Link>}
                  right={<><span className="text-muted-foreground mr-2">{fmtTHB(i.total)}</span><StatusBadge status={i.status} /></>}
                  sub={`Job ${findJob(i.jobId)?.number ?? "—"} • ครบกำหนด ${i.dueDate}${i.paymentDate ? ` • ชำระแล้ว ${i.paymentDate}` : ""}`} />
              )} />
              {cCOs.length > 0 && (
                <Card className="card-soft p-5">
                  <h3 className="font-semibold mb-3">คำขอเปลี่ยนแปลงงาน ({cCOs.length})</h3>
                  {cCOs.map((co) => (
                    <Row key={co.id} left={<Link to={`/change-orders/${co.id}`} className="text-primary hover:underline">{co.number}</Link>}
                      right={<><span className="text-muted-foreground mr-2">{fmtTHB(co.costImpact)}</span><StatusBadge status={co.approvalStatus} /></>}
                      sub={co.description} />
                  ))}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="service" className="mt-4">
              <ListCard items={cSvc} empty="ยังไม่มีงานบริการ" render={(s) => (
                <Row key={s.id} left={<Link to={`/service/${s.id}`} className="text-primary hover:underline">{s.partName}</Link>} right={<StatusBadge status={s.status} />}
                  sub={`ครบกำหนด calibration ${s.calibrationDueDate}`} />
              )} />
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <ListCard items={cActivities} empty="ยังไม่มีกิจกรรม" render={(a) => (
                <Row key={a.id} left={<><span className="font-medium">{a.type}</span></>}
                  right={<span className="text-xs text-muted-foreground">{a.date}</span>}
                  sub={`${a.note} — ${a.user}${a.nextFollowUp ? ` • ติดตาม ${a.nextFollowUp}` : ""}`} />
              )} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <ListCard items={cTasks} empty="ยังไม่มีงานที่ต้องทำ" render={(t) => (
                <Row key={t.id} left={<Link to="/tasks" className="text-primary hover:underline">{t.name}</Link>}
                  right={<StatusBadge status={t.status} />} sub={`ครบกำหนด ${t.dueDate} • ${t.owner}`} />
              )} />
            </TabsContent>

            <TabsContent value="billing" className="mt-4">
              <BillingRulesTab customerId={c.id} />
            </TabsContent>


            <TabsContent value="attach" className="mt-4">
              <Card className="card-soft p-5"><Attachments module="Customer" id={c.id} /></Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card className="card-soft p-5">
                <Timeline events={buildCustomerTimeline(c.id)} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function SectionCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <Card className="card-soft p-5">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      {empty ? <div className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</div> : <div className="space-y-1">{children}</div>}
    </Card>
  );
}
function ListCard<T>({ items, render, empty }: { items: T[]; render: (item: T) => React.ReactNode; empty: string }) {
  return (
    <Card className="card-soft p-5">
      {items.length === 0 ? <EmptyState title={empty} /> : <div className="space-y-1">{items.map(render)}</div>}
    </Card>
  );
}
function Row({ left, right, sub }: { left: React.ReactNode; right?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b last:border-0 py-2 text-sm">
      <div className="min-w-0">
        <div className="font-medium truncate">{left}</div>
        {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
      </div>
      {right && <div className="text-right shrink-0 flex items-center gap-2">{right}</div>}
    </div>
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
