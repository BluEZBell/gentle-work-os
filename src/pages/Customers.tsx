import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useParams } from "react-router-dom";
import {
  customers, contacts, deals, quotations, jobs, serviceRecords,
  findCustomer, findJob, fmtTHB,
} from "@/lib/mockData";
import { useTick, removeCustomer, duplicateCustomer, relatedForCustomer, relatedWarning, updateContact } from "@/lib/store";
import {
  Lock, Search, Mail, Phone, MapPin, Eye, Pencil, Plus, StickyNote,
  Activity as ActivityIcon, CalendarPlus, FileText, ShoppingCart, Paperclip, ClipboardList,
  MessageCircle, Star, Receipt, Truck, MoreHorizontal, Copy as CopyIcon, Trash2,
  ArrowUpRight, ScanLine,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCustomerDialog } from "@/components/dialogs/NewCustomerDialog";
import { EmptyState } from "@/components/EmptyState";
import { Attachments } from "@/components/Attachments";
import { Timeline, type TimelineEvent } from "@/components/Timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getPlan as getLtPlan, useLtTick } from "@/lib/leadTimeStore";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  customerLeadSource, LEAD_SOURCES, customerInvoices, purchaseOrders, changeOrders,
  tasks, activities,
} from "@/lib/mockBusiness";
import { BillingRulesTab } from "@/components/BillingRulesTab";
import { RowActions } from "@/components/RowActions";
import { toast } from "sonner";
import { CUSTOMER_TYPES_TH, customerTypeThai, LEAD_SOURCES_TH, leadSourceThai } from "@/lib/thaiOptions";
import { AddToCalendarDialog } from "@/components/dialogs/AddToCalendarDialog";
import { QuickEditCustomerDialog } from "@/components/dialogs/QuickEditCustomerDialog";
import { ContactDialog } from "@/components/dialogs/ContactDialog";
import { ContactDetailSheet } from "@/components/dialogs/ContactDetailSheet";
import { AddNoteDialog } from "@/components/dialogs/AddNoteDialog";
import { AddActivityDialog } from "@/components/dialogs/AddActivityDialog";
import { customerNotes, contactNotes, useNotesTick } from "@/lib/notesStore";
import { POCRIntakeDialog } from "@/components/dialogs/POCRIntakeDialog";
import { InvoiceFromPODialog } from "@/components/dialogs/InvoiceFromPODialog";
import { customerPosFor, useCustomerPoTick, PO_OCR_STATUS_TH, itemsForPo, poInvoicesFor } from "@/lib/customerPoStore";
import { bnsFor, receiptsFor, arOutstandingFor, isInvoicePaid, useBnTick } from "@/lib/billingReceiptStore";
import type { Contact } from "@/lib/mockData";
import { removeContact } from "@/lib/store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const ACTIVITY_THAI: Record<string, string> = {
  "Call": "โทรติดตาม",
  "Email": "ส่งอีเมล",
  "LINE message": "คุยทาง Line",
  "Meeting": "นัด Onsite",
  "Follow-up": "Service follow-up",
  "Quotation sent": "ส่งใบเสนอราคา",
  "Customer replied": "ลูกค้าตอบกลับ",
  "Internal note": "บันทึกภายใน",
};

function lastActivityFor(cid: string): { label: string; date?: string } {
  const acts = activities.filter((a) => a.customerId === cid)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!acts.length) return { label: "ไม่มีความเคลื่อนไหว" };
  const a = acts[0];
  return { label: ACTIVITY_THAI[a.type] ?? a.type, date: a.date };
}
function nextFollowUpFor(cid: string): string | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return activities
    .filter((a) => a.customerId === cid && a.nextFollowUp && a.nextFollowUp >= today)
    .map((a) => a.nextFollowUp!)
    .sort()[0];
}
const OPEN_DEAL = new Set(["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation"]);
const ACTIVE_JOB = new Set(["Pending", "In Progress", "Waiting Supplier", "Waiting Customer", "Problem"]);

export default function Customers() {
  useTick();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [lead, setLead] = useState<string>("all");
  const [calOpen, setCalOpen] = useState(false);
  const [calCustomer, setCalCustomer] = useState<string | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<typeof customers[number] | undefined>();

  const filtered = customers.filter((c) => {
    const matches = c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(q.toLowerCase());
    const tOk = type === "all" || c.type === type;
    const lOk = lead === "all" || customerLeadSource[c.id] === lead;
    return matches && tOk && lOk;
  });

  const rows = useMemo(() => filtered.map((c) => {
    const openDeals = deals.filter((d) => d.customerId === c.id && OPEN_DEAL.has(d.status)).length;
    const activeJobs = jobs.filter((j) => j.customerId === c.id && ACTIVE_JOB.has(j.status)).length;
    const ar = customerInvoices.filter((i) => i.customerId === c.id && i.status !== "Paid")
      .reduce((s, i) => s + i.total, 0);
    return { c, openDeals, activeJobs, ar, last: lastActivityFor(c.id), next: nextFollowUpFor(c.id) };
  }), [filtered]);

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
          <SelectTrigger className="w-48"><SelectValue placeholder="ประเภทลูกค้า" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {CUSTOMER_TYPES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={lead} onValueChange={setLead}>
          <SelectTrigger className="w-52"><SelectValue placeholder="ที่มาของลูกค้า" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกที่มา</SelectItem>
            {LEAD_SOURCES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            {LEAD_SOURCES.filter((s) => !LEAD_SOURCES_TH.some((o) => o.value === s)).map((s) =>
              <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(q || type !== "all" || lead !== "all") && (
          <Button variant="outline" size="sm" onClick={() => { setQ(""); setType("all"); setLead("all"); }}>
            ล้างตัวกรอง
          </Button>
        )}
      </Card>
      <Card className="card-soft overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="ไม่พบลูกค้าที่ตรงกับการค้นหา" hint="ลองเปลี่ยนคำค้นหรือเปลี่ยนตัวกรองดู" />
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>ประเภทลูกค้า</TableHead>
              <TableHead>Main Contact</TableHead>
              <TableHead>Lead Source</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead className="text-right">Open Deals</TableHead>
              <TableHead className="text-right">Active Jobs</TableHead>
              <TableHead className="text-right">AR Outstanding</TableHead>
              <TableHead className="text-right w-36">การกระทำ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ c, openDeals, activeJobs, ar, last, next }) => {
              const rel = relatedForCustomer(c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to={`/customers/${c.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                      {c.confidential && <Lock className="w-3.5 h-3.5 text-warning" />}
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.address}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={customerTypeThai(c.type)} tone={c.type === "Corporate" || c.type === "Key" || c.type === "Juristic" ? "primary" : c.type === "Suspended" ? "danger" : c.type === "FollowUp" ? "warning" : c.type === "Existing" || c.type === "Regular" ? "info" : "muted"} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <StatusBadge status={leadSourceThai(customerLeadSource[c.id])} tone="info" />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{last.label}</div>
                    {last.date && <div className="text-xs text-muted-foreground">{last.date}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.updatedAt}</TableCell>
                  <TableCell className="text-sm">
                    {next ? <span className="text-foreground">{next}</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium">{openDeals}</TableCell>
                  <TableCell className="text-right font-medium">{activeJobs}</TableCell>
                  <TableCell className={"text-right font-medium " + (ar > 0 ? "text-warning-foreground" : "text-muted-foreground")}>
                    {ar > 0 ? fmtTHB(ar) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="ดูโปรไฟล์ลูกค้า">
                        <Link to={`/customers/${c.id}`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="แก้ไขด่วน"
                        onClick={() => { setEditCustomer(c); setEditOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <RowActions
                        onDuplicate={() => duplicateCustomer(c.id, "Khun Ploy")}
                        onAddToCalendar={() => { setCalCustomer(c.id); setCalOpen(true); }}
                        onViewLog={() => toast.info("ดูประวัติลูกค้า")}
                        onDelete={() => removeCustomer(c.id, "Khun Ploy")}
                        deleteLabel={c.name}
                        relatedWarning={relatedWarning({ Contacts: rel.contacts, Deals: rel.deals, Jobs: rel.jobs, Invoices: rel.invoices })}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </Card>

      <AddToCalendarDialog open={calOpen} onOpenChange={setCalOpen} defaultCustomerId={calCustomer} />
      <QuickEditCustomerDialog open={editOpen} onOpenChange={setEditOpen} customer={editCustomer} />
    </>
  );
}

export function CustomerDetail() {
  useTick();
  useNotesTick();
  useCustomerPoTick();
  useBnTick();
  const { id } = useParams();
  const c = findCustomer(id!);

  // Profile-level dialog state — declared before any early-return so hook order stays stable.
  const [editOpen, setEditOpen] = useState(false);
  const [editFocus, setEditFocus] = useState<"type" | "all">("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [contactOpen, setContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [contactDetailId, setContactDetailId] = useState<string | undefined>();
  const [noteOpen, setNoteOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [contactNoteFor, setContactNoteFor] = useState<Contact | undefined>();
  const [delContact, setDelContact] = useState<Contact | undefined>();
  const [ocrOpen, setOcrOpen] = useState(false);
  const [prepInv, setPrepInv] = useState<string | undefined>();

  const openEdit = (focus: "type" | "all" = "all") => { setEditFocus(focus); setEditOpen(true); };

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
  const cNotes = customerNotes.filter((n) => n.customerId === c.id);
  const paid = cInvoices.filter((i) => i.status === "Paid").reduce((a, b) => a + b.total, 0);
  const outstanding = cInvoices.filter((i) => i.status !== "Paid").reduce((a, b) => a + b.total, 0);
  const totalSales = cJobs.reduce((s, j) => s + j.sellPrice, 0);
  const openDeals = cDeals.filter((d) => !["Won", "Lost", "Failed"].includes(d.status)).length;
  const openQuots = cQuots.filter((q) => q.status === "Sent" || q.status === "Draft").length;
  const activeJobs = cJobs.filter((j) => !["Closed", "Delivered"].includes(j.status)).length;
  const svcDue = cSvc.filter((s) => s.status === "Due" || s.status === "Upcoming").length;
  const last = lastActivityFor(c.id);
  const nextFu = nextFollowUpFor(c.id);
  const mainContact = cContacts.find((x) => x.isMain) ?? cContacts[0];

  const setRoleFlag = (ct: Contact, field: "isMain" | "isBilling" | "isDelivery") => {
    if (field === "isMain") {
      cContacts.forEach((x) => { if (x.id !== ct.id && x.isMain) updateContact(x.id, { isMain: false }, "Khun Ploy"); });
    }
    updateContact(ct.id, { [field]: true }, "Khun Ploy");
    toast.success("อัปเดตบทบาทผู้ติดต่อแล้ว");
  };

  const openAddContact = () => { setEditingContact(undefined); setContactOpen(true); };

  return (
    <>
      <PageHeader
        title={c.name}
        breadcrumbs={<Breadcrumbs items={[{ label: "Customers (ลูกค้า)", to: "/customers" }, { label: c.name }]} />}
        description={c.confidential ? "ลูกค้าลับ — กรุณาดูแลข้อมูลเป็นพิเศษ" : "โปรไฟล์ 360° — ดูทุกข้อมูลที่เกี่ยวข้องกับลูกค้ารายนี้"}
        actions={
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openEdit("type")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {customerTypeThai(c.type)}
                  <Pencil className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>แก้ไขประเภทลูกค้า / สถานะ / Main Contact / Lead Source</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      {/* Top action bar — Group A: local profile actions | Group B: cross-module actions */}
      <Card className="card-soft p-3 mb-4">
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-wrap items-center gap-2">
            {/* Group A: local */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" onClick={() => openEdit("all")}><Pencil className="w-4 h-4 mr-1" />แก้ไขข้อมูลลูกค้า</Button>
              <Button size="sm" variant="secondary" onClick={openAddContact}><Plus className="w-4 h-4 mr-1" />เพิ่มผู้ติดต่อ</Button>
              <Button size="sm" variant="secondary" onClick={() => setActivityOpen(true)}><ActivityIcon className="w-4 h-4 mr-1" />เพิ่มกิจกรรม</Button>
              <Button size="sm" variant="secondary" onClick={() => setNoteOpen(true)}><StickyNote className="w-4 h-4 mr-1" />เพิ่ม Note</Button>
              <Button size="sm" variant="secondary" onClick={() => setCalOpen(true)}><CalendarPlus className="w-4 h-4 mr-1" />เพิ่มลงปฏิทิน</Button>
              <Button size="sm" variant="secondary" onClick={() => { setActiveTab("attach"); toast.info("เปิดแท็บไฟล์แนบ"); }}>
                <Paperclip className="w-4 h-4 mr-1" />ไปที่ไฟล์แนบ
              </Button>
              <Button size="sm" className="bg-primary/90 hover:bg-primary" onClick={() => setOcrOpen(true)}>
                <ScanLine className="w-4 h-4 mr-1" />สแกน / นำเข้า PO ลูกค้า
              </Button>
            </div>

            <div className="h-6 w-px bg-border mx-1" aria-hidden />
            <span className="text-[11px] text-muted-foreground hidden md:inline">ไปสร้างในโมดูลอื่น →</span>

            {/* Group B: cross-module */}
            <div className="flex flex-wrap gap-2">
              {[
                { to: `/deals?customerId=${c.id}`, icon: ClipboardList, label: "สร้าง Deal" },
                { to: `/quotations?customerId=${c.id}`, icon: FileText, label: "สร้างใบเสนอราคา" },
                { to: `/purchase-orders?type=customer&customerId=${c.id}`, icon: ShoppingCart, label: "สร้าง Customer PO" },
              ].map((b) => (
                <Tooltip key={b.label}>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="border-dashed" asChild>
                      <Link to={b.to}>
                        <b.icon className="w-4 h-4 mr-1" />
                        {b.label}
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>รายการนี้จะสร้างข้อมูลในโมดูลอื่น และเชื่อมกลับมาที่ลูกค้ารายนี้</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </Card>

      {/* Header KPI chips */}
      <Card className="card-soft p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <Kpi label="Main Contact" value={mainContact?.name ?? "—"} sub={mainContact?.role} />
          <Kpi label="Lead Source" value={leadSourceThai(customerLeadSource[c.id])} />
          <Kpi label="Last Activity" value={last.label} sub={last.date} />
          <Kpi label="Next Follow-up" value={nextFu ?? "—"} />
          <Kpi label="AR Outstanding" value={fmtTHB(outstanding)} tone={outstanding > 0 ? "warn" : undefined} />
          <Kpi label="Open Deals" value={String(openDeals)} />
          <Kpi label="Active Jobs" value={String(activeJobs)} />
          <Kpi label="Service Due" value={String(svcDue)} tone={svcDue > 0 ? "warn" : undefined} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold mb-3 flex items-center justify-between">โปรไฟล์ (Profile)
            <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit("all")}><Pencil className="w-3.5 h-3.5" /></Button>
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {c.email}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {c.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {c.address}</div>
            <div className="pt-3 border-t mt-3 text-muted-foreground text-xs">
              ที่มา: {leadSourceThai(customerLeadSource[c.id] ?? c.source)} • สร้างเมื่อ {c.createdAt}
            </div>
            {c.notes && <div className="mt-3 p-3 bg-secondary/60 rounded text-sm">{c.notes}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <MiniStat label="ยอดขายรวม" value={fmtTHB(totalSales)} />
            <MiniStat label="ค้างรับ" value={fmtTHB(outstanding)} tone="warn" />
            <MiniStat label="ชำระแล้ว" value={fmtTHB(paid)} tone="success" />
            <MiniStat label="Deal เปิดอยู่" value={String(openDeals)} />
            <MiniStat label="QT ค้าง" value={String(openQuots)} />
            <MiniStat label="งานที่ทำอยู่" value={String(activeJobs)} />
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto justify-start">
              <TabsTrigger value="overview">Overview (ภาพรวม)</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({cContacts.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({cNotes.length})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({cDeals.length})</TabsTrigger>
              <TabsTrigger value="pos">Customer PO ({cPOs.length + customerPosFor(c.id).length})</TabsTrigger>
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

            <TabsContent value="contacts" className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">ผู้ติดต่อทั้งหมด {cContacts.length} คน</div>
                <Button size="sm" onClick={openAddContact}><Plus className="w-4 h-4 mr-1" />เพิ่มผู้ติดต่อ</Button>
              </div>
              {cContacts.length === 0 ? (
                <Card className="card-soft p-5"><EmptyState title="ยังไม่มีผู้ติดต่อ" hint="เพิ่มผู้ติดต่อแรกของลูกค้ารายนี้" /></Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {cContacts.map((ct) => (
                    <Card key={ct.id} className="card-soft p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium flex items-center gap-1 flex-wrap">
                            {ct.name}
                            {ct.isMain && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30">Main</Badge>}
                            {ct.isBilling && <Badge variant="secondary" className="text-[10px]">Billing</Badge>}
                            {ct.isDelivery && <Badge variant="secondary" className="text-[10px]">Delivery</Badge>}
                            {ct.isPoApprover && <Badge variant="secondary" className="text-[10px]">PO</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{ct.role}{ct.department ? ` • ${ct.department}` : ""}</div>
                          {ct.contactType && <div className="text-[11px] text-muted-foreground mt-0.5">ประเภท: {ct.contactType}</div>}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="ดูรายละเอียด" onClick={() => setContactDetailId(ct.id)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="แก้ไข" onClick={() => { setEditingContact(ct); setContactOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => setContactNoteFor(ct)}><StickyNote className="w-4 h-4 mr-2" />เพิ่ม Note</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActivityOpen(true)}><ActivityIcon className="w-4 h-4 mr-2" />เพิ่มกิจกรรม</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setCalOpen(true)}><CalendarPlus className="w-4 h-4 mr-2" />เพิ่มลงปฏิทิน</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setRoleFlag(ct, "isMain")}><Star className="w-4 h-4 mr-2" />ตั้งเป็น Main Contact</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRoleFlag(ct, "isBilling")}><Receipt className="w-4 h-4 mr-2" />ตั้งเป็น Billing Contact</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRoleFlag(ct, "isDelivery")}><Truck className="w-4 h-4 mr-2" />ตั้งเป็น Delivery Contact</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDelContact(ct)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" />ลบ</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        {ct.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{ct.phone}</div>}
                        {ct.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{ct.email}</div>}
                        {ct.lineId && <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{ct.lineId}</div>}
                      </div>
                      {ct.notes && <div className="mt-2 text-xs p-2 bg-secondary/60 rounded">📝 {ct.notes}</div>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Notes ทั้งหมด {cNotes.length} รายการ</div>
                <Button size="sm" onClick={() => setNoteOpen(true)}><Plus className="w-4 h-4 mr-1" />เพิ่ม Note</Button>
              </div>
              {cNotes.length === 0 ? (
                <Card className="card-soft p-5"><EmptyState title="ยังไม่มี Note" hint="บันทึก Memo ลูกค้า เช่น Billing Note หรือ Risk Note" /></Card>
              ) : (
                <div className="space-y-2">
                  {cNotes.map((n) => (
                    <Card key={n.id} className="card-soft p-3 text-sm">
                      <div className="flex justify-between"><Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                        <span className="text-xs text-muted-foreground">{n.user} • {n.createdAt}</span></div>
                      <div className="mt-1.5">{n.body}</div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <ListCard items={cDeals} empty="ยังไม่มีดีล" render={(d) => (
                <Row key={d.id} left={<Link to={`/deals/${d.id}`} className="text-primary hover:underline">{d.name}</Link>}
                  right={<><span className="text-muted-foreground mr-2">{fmtTHB(d.estimatedValue)}</span><StatusBadge status={d.status} /></>}
                  sub={`ปิดคาด ${d.expectedCloseDate} • ${d.probability}%`} />
              )} />
            </TabsContent>

            <TabsContent value="pos" className="mt-4 space-y-3">
              <Card className="card-soft p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">Customer PO (PO ลูกค้า)</div>
                  <div className="text-xs text-muted-foreground">นำเข้า PO จากเอกสารสแกน เพื่อให้พร้อมออก Invoice</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setOcrOpen(true)}><ScanLine className="w-4 h-4 mr-1" />สแกน / นำเข้า PO ลูกค้า</Button>
                </div>
              </Card>

              {(() => {
                const imported = customerPosFor(c.id);
                return imported.length > 0 ? (
                  <Card className="card-soft p-4">
                    <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">PO ที่นำเข้าจาก OCR ({imported.length})</div>
                    <div className="space-y-2">
                      {imported.map((p) => {
                        const its = itemsForPo(p.id);
                        return (
                          <div key={p.id} className="border rounded-lg p-3 bg-secondary/20">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium flex items-center gap-2 flex-wrap">
                                  <span>{p.number}</span>
                                  <StatusBadge status={PO_OCR_STATUS_TH[p.ocrStatus]} tone="success" />
                                  {p.fileName && <Badge variant="outline" className="text-[10px]"><Paperclip className="w-3 h-3 mr-0.5" />{p.fileName}</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  วันที่ PO {p.poDate} • ส่ง {p.deliveryDate} • {its.length} รายการ
                                  {p.contactName ? ` • ผู้ติดต่อ ${p.contactName}` : ""}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold">{fmtTHB(p.total)}</div>
                                <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => setPrepInv(p.id)}>
                                  <Receipt className="w-3.5 h-3.5 mr-1" />เตรียมออก Invoice จากรายการ PO
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : null;
              })()}

              <ListCard items={cPOs} empty={customerPosFor(c.id).length ? "ยังไม่มี PO เชื่อมกับงาน (Job)" : "ยังไม่มี PO ลูกค้า — ลองสแกน/นำเข้า PO ด้วย OCR"} render={(p) => (
                <Row key={p.id} left={<Link to={`/customer-po/${p.id}`} className="text-primary hover:underline">{p.number}</Link>}
                  right={<StatusBadge status={p.status} />}
                  sub={`Job ${findJob(p.jobId)?.number ?? "—"} • ครบกำหนด ${p.expectedDelivery}`} />
              )} />
            </TabsContent>

            <TabsContent value="quotes" className="mt-4">
              <ListCard items={cQuots} empty="ยังไม่มีใบเสนอราคา" render={(q) => {
                const plan = getLtPlan(q.id);
                const ltSummary = plan
                  ? `Lead Time: ${plan.stages.length} ขั้น${plan.expectedDelivery ? ` • ส่งมอบ ${plan.expectedDelivery}` : ""}${plan.calendarLinked ? " • ✓ ผูกปฏิทิน" : ""}`
                  : "ยังไม่มีแผน Lead Time";
                return (
                  <Row key={q.id} left={<Link to={`/quotations/${q.id}`} className="text-primary hover:underline">{q.number}</Link>}
                    right={<StatusBadge status={q.status} />} sub={`${q.date} → ${q.validUntil} • ${ltSummary}`} />
                );
              }} />
            </TabsContent>


            <TabsContent value="jobs" className="mt-4">
              <ListCard items={cJobs} empty="ยังไม่มีงาน" render={(j) => (
                <Row key={j.id} left={<Link to={`/jobs/${j.id}`} className="text-primary hover:underline">{j.number}</Link>}
                  right={<StatusBadge status={j.status} />} sub={`${j.name} • ครบกำหนด ${j.dueDate}`} />
              )} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-4 space-y-4">
              {(() => {
                const poInvs = poInvoicesFor(c.id);
                const bns = bnsFor(c.id);
                const rcs = receiptsFor(c.id);
                const arOut = arOutstandingFor(c.id);
                return (
                  <>
                    {poInvs.length > 0 && (
                      <Card className="card-soft p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice ({poInvs.length})</div>
                          <div className="text-xs">AR ค้างรับ: <span className="font-semibold text-warning">{fmtTHB(arOut)}</span></div>
                        </div>
                        <div className="space-y-1">
                          {poInvs.map((inv) => (
                            <Row key={inv.id}
                              left={<Link to={`/po-invoices/${inv.id}`} className="text-primary hover:underline">{inv.number}</Link>}
                              right={<><span className="text-muted-foreground mr-2">{fmtTHB(inv.total)}</span>{isInvoicePaid(inv.id) ? <Badge variant="outline" className="bg-success/15 text-success border-success/30 text-[10px]">ชำระแล้ว</Badge> : <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 text-[10px]">ยังไม่ชำระ</Badge>}</>}
                              sub={`วันที่ ${inv.date} • ครบกำหนด ${inv.dueDate} • ${inv.paymentTerm}`} />
                          ))}
                        </div>
                      </Card>
                    )}
                    {bns.length > 0 && (
                      <Card className="card-soft p-4 border-purple-200">
                        <div className="text-xs font-semibold mb-2 text-purple-700 uppercase tracking-wide">ใบวางบิล ({bns.length})</div>
                        <div className="space-y-1">
                          {bns.map((b) => (
                            <Row key={b.id}
                              left={<Link to={`/billing-notes/${b.id}`} className="text-purple-700 hover:underline">{b.number}</Link>}
                              right={<><span className="text-muted-foreground mr-2">{fmtTHB(b.total)}</span><Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">{b.status}</Badge></>}
                              sub={`วันวางบิล ${b.submissionDate} • คาดรับเงิน ${b.expectedPaymentDate} • ${b.invoiceIds.length} ใบ`} />
                          ))}
                        </div>
                      </Card>
                    )}
                    {rcs.length > 0 && (
                      <Card className="card-soft p-4 border-emerald-200">
                        <div className="text-xs font-semibold mb-2 text-emerald-700 uppercase tracking-wide">ใบเสร็จรับเงิน ({rcs.length})</div>
                        <div className="space-y-1">
                          {rcs.map((r) => (
                            <Row key={r.id}
                              left={<Link to={`/receipts/${r.id}`} className="text-emerald-700 hover:underline">{r.number}</Link>}
                              right={<><span className="text-muted-foreground mr-2">{fmtTHB(r.amount)}</span><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{r.method}</Badge></>}
                              sub={`รับเงิน ${r.paymentReceivedDate}`} />
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                );
              })()}
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

            <TabsContent value="activities" className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">กิจกรรม {cActivities.length} รายการ</div>
                <Button size="sm" onClick={() => setActivityOpen(true)}><Plus className="w-4 h-4 mr-1" />เพิ่มกิจกรรม</Button>
              </div>
              <ListCard items={cActivities} empty="ยังไม่มีกิจกรรม บันทึกการโทร นัดหมาย หรือ Note แรก" render={(a) => (
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

      <QuickEditCustomerDialog open={editOpen} onOpenChange={setEditOpen} customer={c} focus={editFocus} />
      <ContactDialog open={contactOpen} onOpenChange={(v) => { setContactOpen(v); if (!v) setEditingContact(undefined); }}
        contact={editingContact} defaultCustomerId={c.id} />
      <ContactDetailSheet open={!!contactDetailId} onOpenChange={(v) => !v && setContactDetailId(undefined)} contactId={contactDetailId} />
      <AddNoteDialog open={noteOpen} onOpenChange={setNoteOpen} target={{ kind: "customer", id: c.id, label: c.name }} />
      <AddNoteDialog open={!!contactNoteFor} onOpenChange={(v) => !v && setContactNoteFor(undefined)}
        target={contactNoteFor ? { kind: "contact", id: contactNoteFor.id, label: contactNoteFor.name } : { kind: "contact", id: "" }} />
      <AddActivityDialog open={activityOpen} onOpenChange={setActivityOpen} defaultCustomerId={c.id} />
      <AddToCalendarDialog open={calOpen} onOpenChange={setCalOpen} defaultCustomerId={c.id} />
      <POCRIntakeDialog open={ocrOpen} onOpenChange={setOcrOpen} defaultCustomerId={c.id} />
      <InvoiceFromPODialog open={!!prepInv} onOpenChange={(v) => !v && setPrepInv(undefined)} defaultCustomerId={c.id} defaultPoId={prepInv} />

      <AlertDialog open={!!delContact} onOpenChange={(v) => !v && setDelContact(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบผู้ติดต่อ?</AlertDialogTitle>
            <AlertDialogDescription>คุณกำลังจะลบ <strong>{delContact?.name}</strong> — การกระทำนี้ไม่สามารถย้อนกลับได้ (เดโม)</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delContact) { removeContact(delContact.id, "Khun Ploy"); toast.success(`ลบ ${delContact.name} แล้ว`); } setDelContact(undefined); }}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" }) {
  return (
    <div className={"rounded-lg p-2.5 border " + (tone === "warn" ? "bg-warning-soft/40 border-warning/30" : "bg-secondary/40")}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold truncate">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}
function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "success" }) {
  return (
    <div className={"rounded-lg p-3 " + (tone === "warn" ? "bg-warning-soft" : "bg-secondary/60")}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={"font-display font-semibold " + (tone === "success" ? "text-success" : tone === "warn" ? "text-warning-foreground" : "")}>{value}</div>
    </div>
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
