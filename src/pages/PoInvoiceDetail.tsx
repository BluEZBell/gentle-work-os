// Phase 3B — PO-sourced Invoice detail page.
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  findPoInvoice, linesForPoInvoice, findCustomerPo, useCustomerPoTick,
} from "@/lib/customerPoStore";
import { findCustomer, fmtTHB } from "@/lib/mockData";
import { Timeline } from "@/components/Timeline";
import { Attachments } from "@/components/Attachments";
import { BillingNoteDialog } from "@/components/dialogs/BillingNoteDialog";
import { ReceiptDialog } from "@/components/dialogs/ReceiptDialog";
import { AddToCalendarDialog } from "@/components/dialogs/AddToCalendarDialog";
import { isInvoicePaid, useBnTick, bnsForInvoice, receiptsForInvoice } from "@/lib/billingReceiptStore";
import {
  Printer, FileDown, Pencil, CalendarPlus, Trash2, Receipt, FileText, History, Info,
} from "lucide-react";
import { toast } from "sonner";

export default function PoInvoiceDetail() {
  useCustomerPoTick();
  const { id } = useParams();
  const inv = id ? findPoInvoice(id) : undefined;
  const [billingOpen, setBillingOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [printLogOpen, setPrintLogOpen] = useState(false);

  if (!inv) return (
    <div className="p-6">ไม่พบ Invoice <Link to="/invoices" className="text-primary">กลับ</Link></div>
  );

  const lines = linesForPoInvoice(inv.id);
  const po = findCustomerPo(inv.customerPoId);
  const cust = findCustomer(inv.customerId);

  return (
    <>
      <PageHeader
        title={inv.number}
        thai="ใบแจ้งหนี้จาก PO ลูกค้า"
        breadcrumbs={<Breadcrumbs items={[
          { label: "Customer Invoices (ใบแจ้งหนี้ลูกค้า)", to: "/invoices" },
          { label: inv.number },
        ]} />}
        description={`ออกจาก PO ${po?.number ?? "—"} • ลูกค้า ${cust?.name ?? "—"}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.info("แก้ไข Invoice (เดโม)")}><Pencil className="w-4 h-4 mr-1" />แก้ไข</Button>
            <Button size="sm" variant="outline" onClick={() => toast.success(`พิมพ์ต้นฉบับ ${inv.number} (เดโม)`)}><Printer className="w-4 h-4 mr-1" />พิมพ์ต้นฉบับ</Button>
            <Button size="sm" variant="outline" onClick={() => toast.success(`พิมพ์สำเนา ${inv.customerCopies + inv.internalCopies} ชุด (เดโม)`)}><Printer className="w-4 h-4 mr-1" />พิมพ์สำเนา</Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
            <Button size="sm" onClick={() => setBillingOpen(true)}><Receipt className="w-4 h-4 mr-1" />สร้างใบวางบิลจาก Invoice</Button>
            <Button size="sm" variant="outline" onClick={() => setCalOpen(true)}><CalendarPlus className="w-4 h-4 mr-1" />เพิ่มลงปฏิทิน</Button>
            <Button size="sm" variant="outline" onClick={() => setPrintLogOpen(true)}><History className="w-4 h-4 mr-1" />Print Log</Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => toast.info("ยืนยันก่อนลบ (เดโม)")}><Trash2 className="w-4 h-4 mr-1" />ลบ</Button>
          </div>
        }
      />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertDescription className="text-info/90 text-xs">
          Invoice นี้สร้างจาก {lines.length} รายการของ Customer PO — รายการที่ออกแล้วจะถูกนับรวมในยอด "ออกแล้ว" บน PO อัตโนมัติ
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1 h-fit space-y-3">
          <div className="font-semibold flex items-center justify-between">หัวเอกสาร
            <Badge className="bg-success/15 text-success border-success/30" variant="outline">{inv.customerCopies} สำเนาลูกค้า</Badge>
          </div>
          <Info2 label="ลูกค้า" value={cust ? <Link to={`/customers/${cust.id}`} className="text-primary hover:underline">{cust.name}</Link> : "—"} />
          <Info2 label="ผู้ติดต่อ" value={inv.contactName ?? "—"} />
          <Info2 label="อ้างอิง Customer PO" value={po ? <Link to={`/purchase-orders?type=customer`} className="text-primary hover:underline">{po.number}</Link> : "—"} />
          <Info2 label="วันที่ออก" value={inv.date} />
          <Info2 label="วันครบกำหนด" value={inv.dueDate} />
          <Info2 label="เงื่อนไขชำระ" value={inv.paymentTerm} />
          <Info2 label="รอบวางบิล" value={inv.billingRound} />
          <div className="pt-2 border-t text-xs space-y-1">
            <div className="text-muted-foreground">ที่อยู่ออกบิล</div>
            <div>{inv.address || "—"}</div>
            <div className="text-muted-foreground mt-1">TAX ID: {inv.taxId || "—"} • {inv.branch}</div>
          </div>
          {inv.notes && <div className="mt-3 p-2 bg-secondary/50 rounded text-xs">📝 {inv.notes}</div>}
          {inv.internalNote && <div className="p-2 bg-warning-soft/40 rounded text-xs text-warning-foreground">🔒 Internal: {inv.internalNote}</div>}

          <div className="pt-2 border-t space-y-1 text-sm">
            <Row label="Subtotal" value={fmtTHB(inv.subtotal)} />
            <Row label="ส่วนลด" value={`- ${fmtTHB(inv.discount)}`} />
            <Row label={`VAT ${inv.vatRate}%`} value={fmtTHB(inv.vat)} />
            {inv.whtRate > 0 && <Row label={`หัก ณ ที่จ่าย ${inv.whtRate}%`} value={`- ${fmtTHB(inv.wht)}`} />}
            <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
              <span>Grand Total</span><span className="text-success">{fmtTHB(inv.total)}</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">รายการจาก PO ({lines.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-1.5">Item No.</th><th>คำอธิบาย</th><th className="text-right">จำนวน</th><th>หน่วย</th><th className="text-right">ราคา/หน่วย</th><th className="text-right">ยอดรวม</th></tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{l.itemNumber}</td>
                      <td>{l.description}</td>
                      <td className="text-right">{l.quantity}</td>
                      <td>{l.unit}</td>
                      <td className="text-right">{fmtTHB(l.unitPrice)}</td>
                      <td className="text-right font-medium">{fmtTHB(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />ตั้งค่าต้นฉบับ / สำเนา</h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge className="bg-success/15 text-success border-success/30" variant="outline">ต้นฉบับ (เขียว)</Badge>
              {Array.from({ length: inv.customerCopies }).map((_, i) =>
                <Badge key={"c" + i} variant="outline" className="bg-muted text-muted-foreground">สำเนาลูกค้า {i + 1}</Badge>)}
              {Array.from({ length: inv.internalCopies }).map((_, i) =>
                <Badge key={"i" + i} variant="outline" className="bg-muted text-muted-foreground">สำเนาเก็บภายใน {i + 1}</Badge>)}
            </div>
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Attachments</h3>
            <Attachments module="Customer Invoice" id={inv.id} />
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <Timeline events={[
              { id: "create", date: inv.createdAt, title: "สร้าง Invoice จากรายการ PO ลูกค้า", detail: `${inv.number} ← ${po?.number ?? "—"} โดย ${inv.createdBy}`, tone: "success" },
            ]} />
          </Card>
        </div>
      </div>

      <BillingNoteDialog open={billingOpen} onOpenChange={setBillingOpen} invoiceNumber={inv.number} />
      <AddToCalendarDialog open={calOpen} onOpenChange={setCalOpen} defaultCustomerId={inv.customerId} />

      {printLogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPrintLogOpen(false)}>
          <Card className="card-soft p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Print Log</h3>
            <p className="text-xs text-muted-foreground">ยังไม่มีประวัติการพิมพ์สำหรับ Invoice ฉบับนี้ — ระบบจะบันทึกเมื่อพิมพ์จริง (เดโม)</p>
            <div className="flex justify-end mt-3"><Button size="sm" onClick={() => setPrintLogOpen(false)}>ปิด</Button></div>
          </Card>
        </div>
      )}
    </>
  );
}

function Info2({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="text-sm"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div>{value}</div></div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
