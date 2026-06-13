// All record detail pages — single file to keep the demo lean.
// Each export is a small wrapper around <DetailShell> that pulls related
// data from the mock stores and links it back into the connected Business OS.
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DetailShell, MetaRow, NotFoundDetail } from "@/components/DetailShell";
import { type TimelineEvent } from "@/components/Timeline";
import {
  fmtTHB,
  findCustomer, findJob, findSupplier, findDeal,
  jobs, quotations, deals, customers, serviceRecords, supplierBills,
} from "@/lib/mockData";
import {
  purchaseOrders, poTotal, customerInvoices, changeOrders, tasks,
  activities, quotationRevisions, workSpecs, supplierQuotes, receivingRecords,
} from "@/lib/mockBusiness";
import {
  customerPos, customerPoItems, findCustomerPo, itemsForPo,
  poInvoicesForPo, useCustomerPoTick, PO_OCR_STATUS_TH, INVOICE_STATUS_TH,
  type PoInvoiceStatus,
} from "@/lib/customerPoStore";
import { Badge } from "@/components/ui/badge";
import { InvoiceFromPODialog } from "@/components/dialogs/InvoiceFromPODialog";
import { AddToCalendarDialog } from "@/components/dialogs/AddToCalendarDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScanLine, Receipt, Trash2, Paperclip, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  assets, assetMonthlyDep, assetAccumDep, assetBookValue,
  payrollLines, payrollAllowances, payrollDeductions, payrollNetPay,
  warehouses, stockItems, stockTotal, barcodeIssues,
  ocrDocuments, aiEmails, docApprovals, THAI_DOC_TYPES,
} from "@/lib/mockExtended";
import { Printer, FileDown, CalendarPlus, ArrowRightCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GanttPreview } from "@/components/quotation/GanttPreview";
import {
  getPlan, addPlanToCalendar, useLtTick, LT_STATUS_COLOR,
} from "@/lib/leadTimeStore";
import { audit } from "@/lib/store";
import { cn } from "@/lib/utils";

const root = (label: string, to: string) => ({ label, to });

// ===================== JOB =====================
export function JobDetail() {
  const { id } = useParams();
  const j = jobs.find((x) => x.id === id);
  if (!j) return <NotFoundDetail backTo="/jobs" label="Jobs" />;
  const cust = findCustomer(j.customerId);
  const sup = findSupplier(j.supplierId);
  const q = quotations.find((x) => x.id === j.quotationId);
  const profit = j.sellPrice - j.actualCost;
  const margin = Math.round((profit / j.sellPrice) * 100);
  const jobPOs = purchaseOrders.filter((p) => p.jobId === j.id);
  const jobInvs = customerInvoices.filter((i) => i.jobId === j.id);
  const jobBills = supplierBills.filter((b) => b.jobId === j.id);
  const jobCOs = changeOrders.filter((c) => c.jobId === j.id);
  const jobActs = activities.filter((a) => a.jobId === j.id);
  const jobTasks = tasks.filter((t) => t.jobId === j.id);
  const spec = workSpecs.find((w) => w.jobId === j.id);

  const timeline: TimelineEvent[] = [
    { id: `start-${j.id}`, date: j.startDate, title: "เริ่มงาน", detail: j.notes, tone: "info" as const },
    ...jobPOs.map((p) => ({ id: `po-${p.id}`, date: p.date, title: `PO ${p.number}`, detail: findSupplier(p.supplierId)?.name, tone: "info" as const })),
    ...jobBills.map((b) => ({ id: `b-${b.id}`, date: b.billDate, title: `Supplier bill ${b.number}`, detail: fmtTHB(b.total), tone: "warning" as const })),
    ...jobCOs.map((c) => ({ id: `co-${c.id}`, date: c.requestDate, title: `Change order ${c.number}`, detail: c.description, tone: "warning" as const })),
    ...jobInvs.map((i) => ({ id: `inv-${i.id}`, date: i.date, title: `Customer invoice ${i.number}`, detail: fmtTHB(i.total), tone: (i.status === "Paid" ? "success" : "info") as TimelineEvent["tone"] })),
    ...(j.deliveryDate ? [{ id: `d-${j.id}`, date: j.deliveryDate, title: "ส่งมอบแล้ว", tone: "success" as const }] : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <DetailShell
      module="Job" recordId={j.id}
      title={j.number} thai={j.name}
      breadcrumbs={[root("Jobs (งานผลิต)", "/jobs"), { label: j.number }]}
      status={<><StatusBadge status={j.status} /></>}
      customerId={j.customerId}
      meta={<>
        <MetaRow label="ชื่องาน">{j.name}</MetaRow>
        <MetaRow label="ลูกค้า">{cust?.name ?? "—"}</MetaRow>
        <MetaRow label="ซัพพลายเออร์">{sup?.name ?? "—"}</MetaRow>
        <MetaRow label="เริ่มงาน">{j.startDate}</MetaRow>
        <MetaRow label="ครบกำหนด">{j.dueDate}</MetaRow>
        {j.deliveryDate && <MetaRow label="ส่งมอบแล้ว">{j.deliveryDate}</MetaRow>}
        <MetaRow label="ยอดขาย">{fmtTHB(j.sellPrice)}</MetaRow>
        <MetaRow label="ต้นทุนจริง">{fmtTHB(j.actualCost)}</MetaRow>
        <MetaRow label="กำไรขั้นต้น"><span className="text-success font-medium">{fmtTHB(profit)} ({margin}%)</span></MetaRow>
      </>}
      related={[
        ...(q ? [{ label: "ใบเสนอราคา", to: `/quotations/${q.id}`, hint: q.number }] : []),
        ...jobPOs.map((p) => ({ label: "Supplier PO", to: `/purchase-orders/${p.id}`, hint: p.number })),
        ...jobBills.map((b) => ({ label: "Supplier bill", to: `/supplier-bills/${b.id}`, hint: b.number })),
        ...jobInvs.map((i) => ({ label: "Customer invoice", to: `/invoices/${i.id}`, hint: i.number })),
        ...jobCOs.map((c) => ({ label: "Change order", to: `/change-orders/${c.id}`, hint: c.number })),
      ]}
      timeline={timeline}
    >
      {spec && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Work Specification (สเปกงาน)</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <MetaRow label="ขอบเขต">{spec.scope}</MetaRow>
            <MetaRow label="วัสดุ">{spec.material}</MetaRow>
            <MetaRow label="ขนาด">{spec.size}</MetaRow>
            <MetaRow label="จำนวน">{spec.quantity}</MetaRow>
            <MetaRow label="ข้อกำหนดพิเศษ">{spec.specialRequirement}</MetaRow>
            <MetaRow label="รวมในงาน">{spec.included.join(", ")}</MetaRow>
            <MetaRow label="ไม่รวม">{spec.excluded.join(", ")}</MetaRow>
            {spec.customerNote && <MetaRow label="โน้ตจากลูกค้า">{spec.customerNote}</MetaRow>}
          </div>
        </Card>
      )}

      {jobTasks.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">งานที่ต้องทำในงานนี้ ({jobTasks.length})</h3>
          <div className="divide-y">
            {jobTasks.map((t) => (
              <div key={t.id} className="flex justify-between py-2 text-sm">
                <div><div className="font-medium">{t.name}</div><div className="text-xs text-muted-foreground">ครบกำหนด {t.dueDate} • {t.owner}</div></div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {jobActs.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">กิจกรรมที่เกี่ยวข้อง ({jobActs.length})</h3>
          <div className="divide-y">
            {jobActs.map((a) => (
              <div key={a.id} className="py-2 text-sm">
                <div className="flex justify-between"><span className="font-medium">{a.type}</span><span className="text-xs text-muted-foreground">{a.date}</span></div>
                <div className="text-xs text-muted-foreground">{a.note}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DetailShell>
  );
}

// ===================== QUOTATION =====================
export function QuotationDetail() {
  useLtTick();
  const { id } = useParams();
  const [convertOpen, setConvertOpen] = useState(false);
  const q = quotations.find((x) => x.id === id);
  if (!q) return <NotFoundDetail backTo="/quotations" label="Quotations" />;
  const total = q.items.reduce((s, i) => s + i.sellPrice * i.quantity, 0);
  const cost = q.items.reduce((s, i) => s + i.estimatedCost * i.quantity, 0);
  const profit = total - cost;
  const margin = Math.round((profit / total) * 100);
  const revs = quotationRevisions.filter((r) => r.quotationId === q.id);
  const relatedJob = jobs.find((j) => j.quotationId === q.id);
  const cust = findCustomer(q.customerId);
  const shortName = (cust?.name ?? "CUST").split(/\s+/)[0].slice(0, 6).toUpperCase();
  const plan = getPlan(q.id);

  const timeline: TimelineEvent[] = [
    ...revs.map((r) => ({
      id: r.id, date: r.date, title: `Revision ${r.revision} — ${r.status}`, detail: r.reason, tone: "info" as const,
    })),
    ...(plan ? [{
      id: `lt-${q.id}`, date: plan.createdAt.slice(0, 10),
      title: "สร้างแผน Lead Time", detail: `${plan.stages.length} ขั้นตอน`, tone: "info" as const,
    }] : []),
    ...(plan?.calendarLinked ? [{
      id: `ltcal-${q.id}`, date: plan.updatedAt.slice(0, 10),
      title: "เพิ่มแผนงานลงปฏิทินแล้ว", detail: `${plan.stages.length} events`, tone: "success" as const,
    }] : []),
  ];

  const onAddToCalendar = () => {
    if (!plan) { toast.error("กรุณาสร้างแผน Lead Time ในใบเสนอราคาก่อน"); return; }
    const evs = addPlanToCalendar(q.id, q.number, shortName);
    audit("Khun Ploy", "Add Lead Time to Calendar", `${q.number} (${evs.length} stages)`, "Quotations");
    toast.success(`เพิ่ม ${evs.length} แผนงานลงปฏิทินแล้ว`);
  };

  return (
    <DetailShell
      module="Quotation" recordId={q.id}
      title={q.number} thai="ใบเสนอราคา"
      breadcrumbs={[root("Quotations (ใบเสนอราคา)", "/quotations"), { label: q.number }]}
      status={<StatusBadge status={q.status} />}
      customerId={q.customerId}
      jobLink={relatedJob ? `/jobs/${relatedJob.id}` : undefined}
      jobLabel={relatedJob?.number}
      meta={<>
        <MetaRow label="วันที่ออก">{q.date}</MetaRow>
        <MetaRow label="ใช้ได้ถึง">{q.validUntil}</MetaRow>
        <MetaRow label="ยอดรวม">{fmtTHB(total)}</MetaRow>
        <MetaRow label="ต้นทุนประมาณ">{fmtTHB(cost)}</MetaRow>
        <MetaRow label="กำไรขั้นต้น"><span className="text-success">{fmtTHB(profit)} ({margin}%)</span></MetaRow>
        <MetaRow label="ดีล">{findDeal(q.dealId)?.name ?? "—"}</MetaRow>
        {plan?.expectedDelivery && <MetaRow label="คาดส่งมอบ">{plan.expectedDelivery}</MetaRow>}
      </>}
      related={[
        { label: "ดีล", to: `/deals/${q.dealId}`, hint: findDeal(q.dealId)?.name ?? q.dealId },
        ...(relatedJob ? [{ label: "งาน", to: `/jobs/${relatedJob.id}`, hint: relatedJob.number }] : []),
      ]}
      timeline={timeline}
      actions={<>
        <Button variant="outline" size="sm" onClick={onAddToCalendar}>
          <CalendarPlus className="w-3.5 h-3.5 mr-1" /> เพิ่มแผนงานลงปฏิทิน
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConvertOpen(true)}>
          <ArrowRightCircle className="w-3.5 h-3.5 mr-1" /> แปลง Lead Time เป็นแผนงาน Job
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.info("พิมพ์ใบเสนอราคา (เดโม)")}>
          <Printer className="w-3.5 h-3.5 mr-1" /> พิมพ์
        </Button>
      </>}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-3">รายการในใบเสนอราคา</h3>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Part</TableHead><TableHead>#</TableHead>
            <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Sell</TableHead>
            <TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Profit</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.partName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{it.partNumber}</TableCell>
                <TableCell className="text-right">{it.quantity}</TableCell>
                <TableCell className="text-right">{fmtTHB(it.sellPrice)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(it.estimatedCost)}</TableCell>
                <TableCell className="text-right text-success">{fmtTHB((it.sellPrice - it.estimatedCost) * it.quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {plan && plan.stages.length > 0 && (
        <>
          {/* Internal planning view */}
          <Card className="card-soft p-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> แผนภาพระยะเวลางาน (Gantt Chart)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  แสดงช่วงเวลาทำงานโดยประมาณจากใบเสนอราคา
                </p>
              </div>
              {plan.calendarLinked && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  ผูกกับปฏิทินแล้ว
                </span>
              )}
            </div>
            <GanttPreview stages={plan.stages} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">ขั้นตอน</th>
                    <th className="p-2 text-left">ช่วงเวลา</th>
                    <th className="p-2 text-left">ผู้รับผิดชอบ</th>
                    <th className="p-2 text-left">สถานะ</th>
                    <th className="p-2 text-left">ปฏิทิน</th>
                    <th className="p-2 text-left">โน้ต</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.stages.map((s) => {
                    const c = LT_STATUS_COLOR[s.status];
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2 text-xs">{s.start} → {s.end} <span className="text-muted-foreground">({s.duration}d)</span></td>
                        <td className="p-2 text-xs">{s.owner || "—"}</td>
                        <td className="p-2"><span className={cn("text-[10px] px-1.5 py-0.5 rounded border", c.chip)}>{s.status}</span></td>
                        <td className="p-2 text-xs">{s.calendarEventId ? "✓ เพิ่มแล้ว" : "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">{s.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Customer-facing preview */}
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-1">กำหนดระยะเวลาดำเนินงานโดยประมาณ</h3>
            <p className="text-xs text-muted-foreground mb-3">ตัวอย่างส่วนที่จะปรากฏในเอกสารใบเสนอราคาสำหรับลูกค้า</p>
            <div className="border rounded-md p-4 bg-secondary/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.stages.map((s) => (
                  <div key={s.id} className="flex justify-between border-b pb-2 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.start} → {s.end}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                * กำหนดการนี้เป็นการประมาณการ อาจเปลี่ยนแปลงตามความพร้อมของวัตถุดิบและการอนุมัติแบบ
              </div>
            </div>
          </Card>
        </>
      )}

      {revs.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">การแก้ไขใบเสนอราคา ({revs.length})</h3>
          <div className="divide-y">
            {revs.map((r) => (
              <div key={r.id} className="flex justify-between text-sm py-2">
                <div><div className="font-medium">Rev {r.revision} — {r.reason}</div><div className="text-xs text-muted-foreground">{r.date}</div></div>
                <div className="text-right"><div className="text-sm">{fmtTHB(r.newTotal)}</div><StatusBadge status={r.status} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แปลง Lead Time เป็นแผนงาน Job</DialogTitle>
            <DialogDescription>
              ขั้นตอนถัดไปจะนำ Lead Time จากใบเสนอราคาไปสร้าง Job Planning หลังจากลูกค้าอนุมัติหรือส่ง PO
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            ฟีเจอร์นี้จะเปิดใช้งานในเฟสถัดไป (Job Planning Module)
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailShell>
  );
}


// ===================== DEAL =====================
export function DealDetail() {
  const { id } = useParams();
  const d = deals.find((x) => x.id === id);
  if (!d) return <NotFoundDetail backTo="/deals" label="Deals" />;
  const cust = findCustomer(d.customerId);
  const dQuots = quotations.filter((q) => q.dealId === d.id);
  const dTasks = tasks.filter((t) => t.dealId === d.id);
  const dActs = activities.filter((a) => a.dealId === d.id);
  return (
    <DetailShell
      module="Deal" recordId={d.id}
      title={d.name} thai="โอกาสการขาย"
      breadcrumbs={[root("Deals (โอกาสการขาย)", "/deals"), { label: d.name }]}
      status={<StatusBadge status={d.status} />}
      customerId={d.customerId}
      meta={<>
        <MetaRow label="ลูกค้า">{cust?.name ?? "—"}</MetaRow>
        <MetaRow label="มูลค่า">{fmtTHB(d.estimatedValue)}</MetaRow>
        <MetaRow label="ความน่าจะปิด">{d.probability}%</MetaRow>
        <MetaRow label="คาดปิด">{d.expectedCloseDate}</MetaRow>
        {d.reasonLost && <MetaRow label="เหตุผลที่เสีย">{d.reasonLost}</MetaRow>}
        {d.notes && <MetaRow label="โน้ต">{d.notes}</MetaRow>}
      </>}
      related={dQuots.map((q) => ({ label: "ใบเสนอราคา", to: `/quotations/${q.id}`, hint: q.number }))}
      timeline={dActs.map((a) => ({ id: a.id, date: a.date, title: a.type, detail: a.note, tone: "info" }))}
    >
      {dQuots.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">ใบเสนอราคาในดีลนี้</h3>
          <div className="divide-y">
            {dQuots.map((q) => (
              <div key={q.id} className="flex justify-between py-2 text-sm">
                <Link to={`/quotations/${q.id}`} className="text-primary hover:underline">{q.number}</Link>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
      {dTasks.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">งานที่ต้องทำ ({dTasks.length})</h3>
          <div className="divide-y">
            {dTasks.map((t) => (
              <div key={t.id} className="flex justify-between py-2 text-sm">
                <div>{t.name}</div><StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </DetailShell>
  );
}

// ===================== CUSTOMER PO (mock derived from supplier POs flagged customer) =====================
export function CustomerPODetail() {
  useCustomerPoTick();
  const { id } = useParams();
  const cpo = id ? findCustomerPo(id) : undefined;

  // Fallback to legacy supplier-PO record if id isn't an OCR-imported Customer PO.
  if (!cpo) {
    const p = id ? purchaseOrders.find((x) => x.id === id) : undefined;
    if (!p) return <NotFoundDetail backTo="/purchase-orders?type=customer" label="Customer PO" />;
    const j = findJob(p.jobId);
    return (
      <DetailShell
        module="CustomerPO" recordId={p.id}
        title={p.number} thai="ใบสั่งซื้อจากลูกค้า"
        breadcrumbs={[root("Customer PO (PO ลูกค้า)", "/purchase-orders?type=customer"), { label: p.number }]}
        status={<StatusBadge status={p.status} />}
        customerId={j?.customerId}
        jobLink={j ? `/jobs/${j.id}` : undefined}
        jobLabel={j?.number}
        meta={<>
          <MetaRow label="วันที่ PO">{p.date}</MetaRow>
          <MetaRow label="คาดส่งมอบ">{p.expectedDelivery}</MetaRow>
          <MetaRow label="มูลค่ารวม">{fmtTHB(poTotal(p))}</MetaRow>
          <MetaRow label="จำนวนรายการ">{p.items.length}</MetaRow>
        </>}
        timeline={[{ id: p.id, date: p.date, title: `PO ${p.status}`, detail: p.number, tone: "info" }]}
      >
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">รายการในใบสั่งซื้อลูกค้า</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.name}</TableCell><TableCell className="text-right">{it.qty}</TableCell>
                  <TableCell className="text-right">{fmtTHB(it.unitCost)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtTHB(it.qty * it.unitCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </DetailShell>
    );
  }

  return <OcrCustomerPoDetail cpoId={cpo.id} />;
}

function statusTone(s: PoInvoiceStatus): "success" | "warning" | "muted" {
  return s === "full" ? "success" : s === "partial" ? "warning" : "muted";
}

function OcrCustomerPoDetail({ cpoId }: { cpoId: string }) {
  const [prepOpen, setPrepOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const cpo = findCustomerPo(cpoId)!;
  const cust = findCustomer(cpo.customerId);
  const items = itemsForPo(cpo.id);
  const invs = poInvoicesForPo(cpo.id);
  const fullyInvoiced = items.length > 0 && items.every((i) => i.invoiceStatus === "full");

  const doDelete = () => {
    const idx = customerPos.findIndex((x) => x.id === cpo.id);
    if (idx >= 0) customerPos.splice(idx, 1);
    // remove related items
    for (let i = customerPoItems.length - 1; i >= 0; i--) {
      if (customerPoItems[i].customerPoId === cpo.id) customerPoItems.splice(i, 1);
    }
    audit("Khun Ploy", "Delete Customer PO", cpo.number, "Customer PO");
    toast.success(`ลบ ${cpo.number} เรียบร้อย (เดโม)`);
    setDelOpen(false);
    history.back();
  };

  return (
    <DetailShell
      module="CustomerPO" recordId={cpo.id}
      title={cpo.number} thai="ใบสั่งซื้อจากลูกค้า (PO ลูกค้า)"
      breadcrumbs={[root("Customer PO (PO ลูกค้า)", "/purchase-orders?type=customer"), { label: cpo.number }]}
      status={
        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge variant="outline" className="bg-success/15 text-success border-success/30">{PO_OCR_STATUS_TH[cpo.ocrStatus]}</Badge>
          {fullyInvoiced && <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" />ออก Invoice ครบ</Badge>}
        </div>
      }
      customerId={cpo.customerId}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.info("เปิดเอกสารต้นฉบับ PO (เดโม)")}><Paperclip className="w-4 h-4 mr-1" />ดู PO ต้นฉบับ</Button>
          <Button size="sm" onClick={() => setPrepOpen(true)} disabled={fullyInvoiced}>
            <Receipt className="w-4 h-4 mr-1" />เตรียมออก Invoice
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCalOpen(true)}><CalendarPlus className="w-4 h-4 mr-1" />เพิ่มลงปฏิทิน</Button>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4 mr-1" />ลบ</Button>
        </div>
      }
      meta={<>
        <MetaRow label="ลูกค้า">{cust ? <Link to={`/customers/${cust.id}`} className="text-primary hover:underline">{cust.name}</Link> : "—"}</MetaRow>
        <MetaRow label="ผู้ติดต่อ">{cpo.contactName ?? "—"}</MetaRow>
        <MetaRow label="วันที่ PO">{cpo.poDate}</MetaRow>
        <MetaRow label="วันส่งของ">{cpo.deliveryDate}</MetaRow>
        <MetaRow label="สกุลเงิน">{cpo.currency}</MetaRow>
        <MetaRow label="ยอดรวม">{fmtTHB(cpo.total)}</MetaRow>
        <MetaRow label="ไฟล์ต้นฉบับ">{cpo.fileName ?? "—"}</MetaRow>
        <MetaRow label="นำเข้าโดย">{cpo.createdBy} • {cpo.createdAt}</MetaRow>
      </>}
      timeline={[
        { id: "imp", date: cpo.createdAt, title: "นำเข้า PO ลูกค้าจาก OCR", detail: `${cpo.number} • ${items.length} รายการ โดย ${cpo.createdBy}`, tone: "success" as const },
        ...invs.map((iv) => ({ id: iv.id, date: iv.createdAt, title: "ออก Invoice จากรายการ PO", detail: `${iv.number} • ${fmtTHB(iv.total)}`, tone: "info" as const })),
      ]}
    >
      <Alert className="border-warning/40 bg-warning-soft">
        <ScanLine className="h-4 w-4 text-warning-foreground" />
        <AlertDescription className="text-warning-foreground/90 text-xs">
          ข้อมูลในใบนี้ถูกอ่านด้วย OCR — กรุณาเทียบกับเอกสารต้นฉบับก่อนใช้งานในการออก Invoice
        </AlertDescription>
      </Alert>

      {cpo.notes && (
        <Card className="card-soft p-4 text-sm">
          <div className="text-xs text-muted-foreground mb-1">หมายเหตุจาก PO</div>
          {cpo.notes}
        </Card>
      )}

      <Card className="card-soft p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold">รายการสินค้าใน PO ({items.length})</h3>
          <div className="text-xs text-muted-foreground">
            ออกแล้ว {items.filter((i) => i.invoiceStatus !== "none").length} / {items.length} รายการ
          </div>
        </div>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีรายการสินค้าใน PO นี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="py-1.5">Item No.</th>
                  <th>คำอธิบาย</th>
                  <th>วันส่ง</th>
                  <th className="text-right">PO Qty</th>
                  <th className="text-right">ออกแล้ว</th>
                  <th className="text-right">คงเหลือ</th>
                  <th>หน่วย</th>
                  <th className="text-right">ราคา/หน่วย</th>
                  <th className="text-right">ยอดรวม</th>
                  <th>สถานะ Invoice</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const tone = statusTone(it.invoiceStatus);
                  const cls = tone === "success" ? "bg-success/15 text-success border-success/30"
                    : tone === "warning" ? "bg-warning-soft text-warning-foreground border-warning/40"
                    : "bg-muted text-muted-foreground";
                  return (
                    <tr key={it.poItemId} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{it.itemNumber}</td>
                      <td>{it.description}</td>
                      <td>{it.deliveryDate}</td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right">{it.invoicedQuantity}</td>
                      <td className="text-right font-medium">{it.remainingQuantity}</td>
                      <td>{it.unit}</td>
                      <td className="text-right">{fmtTHB(it.unitPrice)}</td>
                      <td className="text-right">{fmtTHB(it.amount)}</td>
                      <td><Badge variant="outline" className={"text-[10px] " + cls}>{INVOICE_STATUS_TH[it.invoiceStatus]}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-3">Invoice ที่เชื่อมโยง ({invs.length})</h3>
        {invs.length === 0 ? (
          <div className="text-sm text-muted-foreground">ยังไม่มี Invoice — กด "เตรียมออก Invoice" เพื่อสร้าง</div>
        ) : (
          <ul className="text-sm divide-y">
            {invs.map((iv) => (
              <li key={iv.id} className="py-1.5 flex justify-between">
                <Link to={`/po-invoices/${iv.id}`} className="text-primary hover:underline">{iv.number}</Link>
                <span className="text-muted-foreground">{iv.date} • {fmtTHB(iv.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <InvoiceFromPODialog open={prepOpen} onOpenChange={setPrepOpen} defaultCustomerId={cpo.customerId} defaultPoId={cpo.id} />
      <AddToCalendarDialog open={calOpen} onOpenChange={setCalOpen} defaultCustomerId={cpo.customerId} />

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Customer PO {cpo.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              {cpo.number} และ {items.length} รายการสินค้าจะถูกลบออก (เดโม)
              {invs.length > 0 && (
                <span className="block mt-2 text-warning-foreground">
                  ⚠️ มี Invoice ผูกอยู่ {invs.length} ฉบับ — Invoice เดิมจะไม่ถูกลบแต่จะอ้างอิง PO ที่หายไป
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailShell>
  );
}



// ===================== PURCHASE ORDER (Supplier PO) =====================
export function PurchaseOrderDetail() {
  const { id } = useParams();
  const p = purchaseOrders.find((x) => x.id === id);
  if (!p) return <NotFoundDetail backTo="/purchase-orders" label="Purchase Orders" />;
  const j = findJob(p.jobId);
  const sup = findSupplier(p.supplierId);
  const recv = receivingRecords.filter((r) => r.poId === p.id);
  const bill = supplierBills.find((b) => b.jobId === p.jobId && b.supplierId === p.supplierId);
  return (
    <DetailShell
      module="PO" recordId={p.id}
      title={p.number} thai="ใบสั่งซื้อ"
      breadcrumbs={[root("Purchase Orders (ใบสั่งซื้อ)", "/purchase-orders"), { label: p.number }]}
      status={<StatusBadge status={p.status} />}
      customerId={j?.customerId}
      jobLink={j ? `/jobs/${j.id}` : undefined}
      jobLabel={j?.number}
      meta={<>
        <MetaRow label="ซัพพลายเออร์">{sup?.name ?? "—"}</MetaRow>
        <MetaRow label="วันที่">{p.date}</MetaRow>
        <MetaRow label="คาดส่งมอบ">{p.expectedDelivery}</MetaRow>
        <MetaRow label="มูลค่ารวม">{fmtTHB(poTotal(p))}</MetaRow>
      </>}
      related={[
        ...(bill ? [{ label: "บิลซัพพลายเออร์", to: `/supplier-bills/${bill.id}`, hint: bill.number }] : []),
      ]}
      timeline={recv.map((r) => ({ id: r.id, date: r.receivedDate, title: `รับของ — QC ${r.qcStatus}`, detail: r.qcNote, tone: r.qcStatus === "Passed" ? "success" as const : "warning" as const }))}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-3">รายการ</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {p.items.map((it) => (
              <TableRow key={it.id}><TableCell>{it.name}</TableCell><TableCell className="text-right">{it.qty}</TableCell><TableCell className="text-right">{fmtTHB(it.unitCost)}</TableCell><TableCell className="text-right">{fmtTHB(it.qty * it.unitCost)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {recv.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">การรับของและ QC</h3>
          <div className="divide-y">
            {recv.map((r) => (
              <div key={r.id} className="py-2 text-sm flex justify-between">
                <div>รับ {r.receivedQty} • {r.receivedDate}<div className="text-xs text-muted-foreground">{r.qcNote}</div></div>
                <StatusBadge status={r.qcStatus} />
              </div>
            ))}
          </div>
        </Card>
      )}
      {sup && (
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">เปรียบเทียบเสนอราคาซัพพลายเออร์ในงานนี้</h3>
          <div className="divide-y">
            {supplierQuotes.filter((sq) => sq.jobId === p.jobId).map((sq) => (
              <div key={sq.id} className="py-2 text-sm flex justify-between">
                <div>{findSupplier(sq.supplierId)?.name} • {sq.leadTimeDays} วัน • {sq.paymentTerm}</div>
                <div className="text-right">{fmtTHB(sq.quotedCost)} {sq.selected && <StatusBadge status="Selected" tone="success" />}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DetailShell>
  );
}

// ===================== CUSTOMER INVOICE =====================
export function InvoiceDetail() {
  const { id } = useParams();
  const i = customerInvoices.find((x) => x.id === id);
  if (!i) return <NotFoundDetail backTo="/invoices" label="Invoices" />;
  const j = findJob(i.jobId);
  return (
    <DetailShell
      module="Invoice" recordId={i.id}
      title={i.number} thai="ใบแจ้งหนี้ลูกค้า"
      breadcrumbs={[root("Invoices (ใบแจ้งหนี้)", "/invoices"), { label: i.number }]}
      status={<StatusBadge status={i.status} />}
      customerId={i.customerId}
      jobLink={j ? `/jobs/${j.id}` : undefined}
      jobLabel={j?.number}
      meta={<>
        <MetaRow label="วันที่">{i.date}</MetaRow>
        <MetaRow label="ครบกำหนด">{i.dueDate}</MetaRow>
        {i.paymentDate && <MetaRow label="ชำระเมื่อ">{i.paymentDate}</MetaRow>}
        <MetaRow label="ยอดก่อน VAT">{fmtTHB(i.amount)}</MetaRow>
        <MetaRow label="VAT">{fmtTHB(i.vat)}</MetaRow>
        <MetaRow label="ยอดรวม"><span className="font-semibold">{fmtTHB(i.total)}</span></MetaRow>
      </>}
      timeline={[
        { id: `c-${i.id}`, date: i.date, title: "ออกใบแจ้งหนี้", tone: "info" },
        ...(i.paymentDate ? [{ id: `p-${i.id}`, date: i.paymentDate, title: "ลูกค้าชำระเงิน", tone: "success" as const }] : []),
      ]}
      actions={<Button variant="outline" size="sm" onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-3.5 h-3.5 mr-1" /> PDF</Button>}
    />
  );
}

// ===================== SUPPLIER BILL =====================
export function SupplierBillDetail() {
  const { id } = useParams();
  const b = supplierBills.find((x) => x.id === id);
  if (!b) return <NotFoundDetail backTo="/supplier-bills" label="Supplier Bills" />;
  const j = findJob(b.jobId);
  const sup = findSupplier(b.supplierId);
  const po = purchaseOrders.find((p) => p.jobId === b.jobId && p.supplierId === b.supplierId);
  return (
    <DetailShell
      module="SupplierBill" recordId={b.id}
      title={b.number} thai="บิลซัพพลายเออร์"
      breadcrumbs={[root("Supplier Bills (บิลซัพพลายเออร์)", "/supplier-bills"), { label: b.number }]}
      status={<><StatusBadge status={b.status} /><StatusBadge status={b.reviewStatus} /></>}
      customerId={j?.customerId}
      jobLink={j ? `/jobs/${j.id}` : undefined}
      jobLabel={j?.number}
      meta={<>
        <MetaRow label="ซัพพลายเออร์">{sup?.name ?? "—"}</MetaRow>
        <MetaRow label="วันที่บิล">{b.billDate}</MetaRow>
        <MetaRow label="ครบกำหนด">{b.dueDate}</MetaRow>
        <MetaRow label="ยอดก่อน VAT">{fmtTHB(b.amount)}</MetaRow>
        <MetaRow label="VAT">{fmtTHB(b.vat)}</MetaRow>
        <MetaRow label="ยอดรวม"><span className="font-semibold">{fmtTHB(b.total)}</span></MetaRow>
        <MetaRow label="ที่มา">{b.emailSource}</MetaRow>
      </>}
      related={po ? [{ label: "ใบสั่งซื้อต้นทาง", to: `/purchase-orders/${po.id}`, hint: po.number }] : []}
      timeline={[
        { id: `b-${b.id}`, date: b.billDate, title: "รับบิลจากซัพพลายเออร์", tone: "info" },
        { id: `r-${b.id}`, date: b.billDate, title: `Review — ${b.reviewStatus}`, tone: b.reviewStatus === "Approved" ? "success" : "warning" },
      ]}
    />
  );
}

// ===================== THAI DOCUMENT =====================
export function ThaiDocumentDetail() {
  const { id } = useParams();
  const d = THAI_DOC_TYPES.find((x) => x.id === id);
  if (!d) return <NotFoundDetail backTo="/thai-documents" label="Thai Documents" />;
  return (
    <DetailShell
      module="ThaiDoc" recordId={d.id}
      title={d.name} thai={d.en}
      breadcrumbs={[root("Thai Documents (เอกสารไทย)", "/thai-documents"), { label: d.name }]}
      status={<StatusBadge status="Template" tone="info" />}
      meta={<>
        <MetaRow label="ประเภท">{d.en}</MetaRow>
        <MetaRow label="หมวด">เอกสารตามมาตรฐานไทย</MetaRow>
        <MetaRow label="รูปแบบ">A4 / PDF</MetaRow>
      </>}
      actions={<><Button variant="outline" size="sm" onClick={() => toast.info("พิมพ์ (เดโม)")}><Printer className="w-3.5 h-3.5 mr-1" /> พิมพ์</Button><Button size="sm" onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-3.5 h-3.5 mr-1" /> PDF</Button></>}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-2">{d.name} — {d.en}</h3>
        <p className="text-sm text-muted-foreground">
          เทมเพลตเอกสารภายในสำหรับธุรกิจไทย ใช้สำหรับพิมพ์ ส่งลูกค้า หรือเก็บเข้าระบบบัญชีภายใน — เปิดหน้านี้แล้วเลือกพิมพ์หรือดาวน์โหลด PDF
        </p>
      </Card>
    </DetailShell>
  );
}

// ===================== SERVICE =====================
export function ServiceDetail() {
  const { id } = useParams();
  const s = serviceRecords.find((x) => x.id === id);
  if (!s) return <NotFoundDetail backTo="/service" label="Service" />;
  const j = findJob(s.jobId);
  return (
    <DetailShell
      module="Service" recordId={s.id}
      title={s.partName} thai="งานบริการหลังการขาย"
      breadcrumbs={[root("Service (บริการ)", "/service"), { label: s.partName }]}
      status={<StatusBadge status={s.status} />}
      customerId={s.customerId}
      jobLink={j ? `/jobs/${j.id}` : undefined}
      jobLabel={j?.number}
      meta={<>
        <MetaRow label="Part">{s.partName} ({s.partNumber})</MetaRow>
        <MetaRow label="ส่งมอบเมื่อ">{s.deliveryDate}</MetaRow>
        <MetaRow label="รับประกัน">{s.warrantyStart} → {s.warrantyEnd}</MetaRow>
        <MetaRow label="Calibration ครบ">{s.calibrationDueDate}</MetaRow>
        <MetaRow label="ปีแรกฟรี">{s.firstYearFree ? "ใช่" : "ไม่"}</MetaRow>
        <MetaRow label="ราคาต่ออายุ">{fmtTHB(s.renewalPrice)}</MetaRow>
      </>}
      timeline={[
        { id: `d-${s.id}`, date: s.deliveryDate, title: "ส่งมอบ", tone: "success" },
        { id: `cal-${s.id}`, date: s.calibrationDueDate, title: "Calibration ครบกำหนด", tone: "warning" },
      ]}
    />
  );
}

// ===================== CHANGE ORDER =====================
export function ChangeOrderDetail() {
  const { id } = useParams();
  const c = changeOrders.find((x) => x.id === id);
  if (!c) return <NotFoundDetail backTo="/change-orders" label="Change Orders" />;
  const j = findJob(c.jobId);
  return (
    <DetailShell
      module="ChangeOrder" recordId={c.id}
      title={c.number} thai="คำขอเปลี่ยนแปลงงาน"
      breadcrumbs={[root("Change Orders (คำขอเปลี่ยนแปลง)", "/change-orders"), { label: c.number }]}
      status={<StatusBadge status={c.approvalStatus} />}
      customerId={j?.customerId}
      jobLink={j ? `/jobs/${j.id}` : undefined}
      jobLabel={j?.number}
      meta={<>
        <MetaRow label="ขอโดย">{c.requestedBy}</MetaRow>
        <MetaRow label="วันที่ขอ">{c.requestDate}</MetaRow>
        <MetaRow label="กระทบต้นทุน">{fmtTHB(c.costImpact)}</MetaRow>
        <MetaRow label="กระทบเวลา">+{c.timelineImpactDays} วัน</MetaRow>
        <MetaRow label="ต้องเสนอราคาเพิ่ม">{c.additionalQuotationRequired ? "ใช่" : "ไม่"}</MetaRow>
      </>}
      timeline={[{ id: c.id, date: c.requestDate, title: `Change Order ${c.approvalStatus}`, detail: c.description, tone: "warning" }]}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-2">คำอธิบายการเปลี่ยนแปลง</h3>
        <p className="text-sm">{c.description}</p>
      </Card>
    </DetailShell>
  );
}

// ===================== APPROVAL =====================
const approvalRoute = (docType: string, ref: string): string | undefined => {
  const map: Record<string, (r: string) => string | undefined> = {
    "Quotation": (r) => { const q = quotations.find((x) => x.number === r); return q ? `/quotations/${q.id}` : undefined; },
    "Supplier PO": (r) => { const p = purchaseOrders.find((x) => x.number === r); return p ? `/purchase-orders/${p.id}` : undefined; },
    "Customer Invoice": (r) => { const i = customerInvoices.find((x) => x.number === r); return i ? `/invoices/${i.id}` : undefined; },
    "Supplier Bill": (r) => { const b = supplierBills.find((x) => x.number === r); return b ? `/supplier-bills/${b.id}` : undefined; },
    "Change Order": (r) => { const c = changeOrders.find((x) => x.number === r); return c ? `/change-orders/${c.id}` : undefined; },
  };
  return map[docType]?.(ref);
};

export function ApprovalDetail() {
  const { id } = useParams();
  const a = docApprovals.find((x) => x.id === id);
  if (!a) return <NotFoundDetail backTo="/approvals" label="Approvals" />;
  const docLink = approvalRoute(a.docType, a.reference);
  return (
    <DetailShell
      module="Approval" recordId={a.id}
      title={a.reference} thai={`อนุมัติ ${a.docType}`}
      breadcrumbs={[root("Approvals (อนุมัติเอกสาร)", "/approvals"), { label: a.reference }]}
      status={<StatusBadge status={a.status} />}
      documentLink={docLink}
      documentLabel={a.reference}
      meta={<>
        <MetaRow label="ประเภทเอกสาร">{a.docType}</MetaRow>
        <MetaRow label="ขอโดย">{a.requestedBy}</MetaRow>
        <MetaRow label="ผู้ตรวจ">{a.reviewer}</MetaRow>
        {a.approvedBy && <MetaRow label="อนุมัติโดย">{a.approvedBy} ({a.approvedDate})</MetaRow>}
        {a.amount !== undefined && <MetaRow label="มูลค่า">{fmtTHB(a.amount)}</MetaRow>}
      </>}
      timeline={a.history.map((h, i) => ({ id: `h-${i}`, date: h.date, title: `${h.from} → ${h.to}`, detail: `${h.by}${h.comment ? " — " + h.comment : ""}`, tone: h.to === "Approved" ? "success" : h.to === "Rejected" ? "danger" : "info" }))}
    />
  );
}

// ===================== ASSET =====================
export function AssetDetail() {
  const { id } = useParams();
  const a = assets.find((x) => x.id === id);
  if (!a) return <NotFoundDetail backTo="/assets" label="Assets" />;
  return (
    <DetailShell
      module="Asset" recordId={a.id}
      title={`${a.code} — ${a.name}`} thai="สินทรัพย์"
      breadcrumbs={[root("Assets (สินทรัพย์)", "/assets"), { label: a.code }]}
      status={<StatusBadge status={a.status} />}
      meta={<>
        <MetaRow label="ประเภท">{a.type}</MetaRow>
        <MetaRow label="วันที่ซื้อ">{a.purchaseDate}</MetaRow>
        <MetaRow label="ราคาทุน">{fmtTHB(a.purchasePrice)}</MetaRow>
        <MetaRow label="อายุการใช้งาน">{a.usefulLifeMonths} เดือน</MetaRow>
        <MetaRow label="ใช้งานมาแล้ว">{a.monthsInService} เดือน</MetaRow>
        <MetaRow label="ค่าเสื่อม/เดือน">{fmtTHB(assetMonthlyDep(a))}</MetaRow>
        <MetaRow label="ค่าเสื่อมสะสม">{fmtTHB(assetAccumDep(a))}</MetaRow>
        <MetaRow label="มูลค่าคงเหลือ"><span className="font-semibold">{fmtTHB(assetBookValue(a))}</span></MetaRow>
        <MetaRow label="ที่ตั้ง">{a.location}</MetaRow>
        <MetaRow label="ผู้รับผิดชอบ">{a.assignedUser}</MetaRow>
      </>}
      timeline={[{ id: a.id, date: a.purchaseDate, title: "ซื้อสินทรัพย์", detail: a.name, tone: "info" }]}
    >
      {a.notes && <Card className="card-soft p-5"><h3 className="font-semibold mb-2">หมายเหตุ</h3><p className="text-sm">{a.notes}</p></Card>}
    </DetailShell>
  );
}

// ===================== PAYROLL =====================
export function PayrollDetail() {
  const { id } = useParams();
  const p = payrollLines.find((x) => x.id === id);
  if (!p) return <NotFoundDetail backTo="/payroll" label="Payroll" />;
  return (
    <DetailShell
      module="Payroll" recordId={p.id}
      title={p.employeeName} thai={`รายละเอียดเงินเดือน — ${p.role}`}
      breadcrumbs={[root("Payroll (เงินเดือน)", "/payroll"), { label: p.employeeName }]}
      status={<StatusBadge status="Active" tone="success" />}
      meta={<>
        <MetaRow label="ตำแหน่ง">{p.role}</MetaRow>
        <MetaRow label="เงินเดือนฐาน">{fmtTHB(p.baseSalary)}</MetaRow>
        <MetaRow label="OT รวม">{fmtTHB(p.otWeekday + p.otHoliday)}</MetaRow>
        <MetaRow label="เบี้ยเลี้ยงรวม"><span className="text-success">{fmtTHB(payrollAllowances(p))}</span></MetaRow>
        <MetaRow label="รายการหักรวม"><span className="text-destructive">−{fmtTHB(payrollDeductions(p))}</span></MetaRow>
        <MetaRow label="รับสุทธิ"><span className="font-semibold">{fmtTHB(payrollNetPay(p))}</span></MetaRow>
      </>}
      timeline={[{ id: p.id, date: new Date().toISOString().slice(0, 10), title: "Payroll period", detail: `Net ${fmtTHB(payrollNetPay(p))}`, tone: "info" }]}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-3">เบี้ยเลี้ยงและรายการหัก</h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <MetaRow label="ประกันสังคม">{fmtTHB(p.socialSecurity)}</MetaRow>
          <MetaRow label="เบิกล่วงหน้า">{fmtTHB(p.salaryAdvance)}</MetaRow>
          <MetaRow label="เบิกฉุกเฉิน">{fmtTHB(p.emergencyWithdrawal)}</MetaRow>
          <MetaRow label="เงินกู้บริษัท">{fmtTHB(p.companyLoan)}</MetaRow>
          <MetaRow label="หักรถส่วนตัว">{fmtTHB(p.companyCarDeduction)}</MetaRow>
          <MetaRow label="ค่าอาหาร">{fmtTHB(p.mealAllowance)}</MetaRow>
          <MetaRow label="น้ำมัน">{fmtTHB(p.fuelAllowance)}</MetaRow>
          <MetaRow label="เดินทาง">{fmtTHB(p.travelAllowance)}</MetaRow>
          <MetaRow label="หน้างาน">{fmtTHB(p.fieldWorkAllowance)}</MetaRow>
          <MetaRow label="เคลม">{fmtTHB(p.reimbursement)}</MetaRow>
          <MetaRow label="ของขวัญ">{fmtTHB(p.giftMoney)}</MetaRow>
        </div>
        {p.notes && <div className="mt-3 text-xs text-muted-foreground">{p.notes}</div>}
      </Card>
    </DetailShell>
  );
}

// ===================== WAREHOUSE =====================
export function WarehouseDetail() {
  const { id } = useParams();
  const w = warehouses.find((x) => x.id === id);
  if (!w) return <NotFoundDetail backTo="/warehouses" label="Warehouses" />;
  const items = stockItems.map((s) => ({ s, qty: s.byWarehouse[w.id] ?? 0 })).filter((x) => x.qty > 0 || true);
  const total = items.reduce((sum, x) => sum + x.qty, 0);
  return (
    <DetailShell
      module="Warehouse" recordId={w.id}
      title={w.name} thai={w.thai}
      breadcrumbs={[root("Warehouses (คลังสินค้า)", "/warehouses"), { label: w.thai }]}
      status={<StatusBadge status="Active" tone="success" />}
      meta={<>
        <MetaRow label="ชื่อคลัง">{w.name}</MetaRow>
        <MetaRow label="ชื่อไทย">{w.thai}</MetaRow>
        <MetaRow label="จำนวนรายการ">{items.length}</MetaRow>
        <MetaRow label="จำนวนรวม">{total}</MetaRow>
      </>}
      timeline={barcodeIssues.filter((b) => b.warehouseId === w.id).map((b) => ({ id: b.id, date: b.issueDate, title: `เบิก ${b.barcode}`, detail: `${b.quantity} หน่วย โดย ${b.issuedBy}`, tone: "info" as const }))}
    >
      <Card className="card-soft p-5">
        <h3 className="font-semibold mb-3">สต๊อกในคลังนี้</h3>
        <Table>
          <TableHeader><TableRow><TableHead>รหัส</TableHead><TableHead>รายการ</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead className="text-right">จุดสั่ง</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((x) => (
              <TableRow key={x.s.id}>
                <TableCell className="font-mono text-xs">{x.s.code}</TableCell>
                <TableCell>{x.s.name}</TableCell>
                <TableCell className="text-right font-medium">{x.qty}</TableCell>
                <TableCell className="text-right text-muted-foreground">{x.s.reorderPoint}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </DetailShell>
  );
}

// ===================== OCR DOCUMENT =====================
export function OcrDocumentDetail() {
  const { id } = useParams();
  const o = ocrDocuments.find((x) => x.id === id);
  if (!o) return <NotFoundDetail backTo="/ocr-documents" label="OCR Documents" />;
  return (
    <DetailShell
      module="OCR" recordId={o.id}
      title={o.fileName} thai={`สแกน — ${o.docType}`}
      breadcrumbs={[root("OCR Documents (สแกนเอกสาร)", "/ocr-documents"), { label: o.fileName }]}
      status={<StatusBadge status={o.status} tone={o.status === "Approved" ? "success" : o.status === "Rejected" ? "danger" : "warning"} />}
      meta={<>
        <MetaRow label="ประเภทเอกสาร">{o.docType}</MetaRow>
        <MetaRow label="อัปโหลด">{o.uploadedDate}</MetaRow>
        <MetaRow label="เลขเอกสาร">{o.extracted.docNumber}</MetaRow>
        <MetaRow label="วันที่เอกสาร">{o.extracted.date}</MetaRow>
        <MetaRow label="บริษัท">{o.extracted.companyName}</MetaRow>
        <MetaRow label="ยอด">{fmtTHB(o.extracted.amount)}</MetaRow>
        <MetaRow label="VAT">{fmtTHB(o.extracted.vat)}</MetaRow>
        <MetaRow label="รวม"><span className="font-semibold">{fmtTHB(o.extracted.total)}</span></MetaRow>
        {o.reviewer && <MetaRow label="ตรวจสอบโดย">{o.reviewer}</MetaRow>}
      </>}
      timeline={[{ id: o.id, date: o.uploadedDate, title: `อัปโหลดและสกัด — ${o.status}`, detail: o.fileName, tone: "info" }]}
    />
  );
}

// ===================== AI EMAIL =====================
export function AiEmailDetail() {
  const { id } = useParams();
  const e = aiEmails.find((x) => x.id === id);
  if (!e) return <NotFoundDetail backTo="/ai-email" label="AI Email Intake" />;
  return (
    <DetailShell
      module="AIEmail" recordId={e.id}
      title={e.subject} thai="AI อ่านอีเมล"
      breadcrumbs={[root("AI Email (อีเมลอัตโนมัติ)", "/ai-email"), { label: e.subject }]}
      status={<StatusBadge status={e.status} tone={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "warning"} />}
      meta={<>
        <MetaRow label="จาก">{e.from}</MetaRow>
        <MetaRow label="วันที่รับ">{e.receivedDate}</MetaRow>
        <MetaRow label="ซัพพลายเออร์">{e.extracted.supplierName}</MetaRow>
        <MetaRow label="เลขที่บิล">{e.extracted.billNumber}</MetaRow>
        <MetaRow label="ครบกำหนด">{e.extracted.dueDate}</MetaRow>
        <MetaRow label="ยอดเงิน">{fmtTHB(e.extracted.amount)}</MetaRow>
      </>}
      timeline={[{ id: e.id, date: e.receivedDate, title: `รับอีเมล — ${e.status}`, detail: e.subject, tone: "info" }]}
    />
  );
}

// silence unused
void customers;
