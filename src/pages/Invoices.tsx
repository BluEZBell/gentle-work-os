import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerInvoices, INVOICE_STATUSES, type InvoiceStatus } from "@/lib/mockBusiness";
import { setInvoiceStatus, useBizTick } from "@/lib/storeBusiness";
import { findCustomer, findJob, fmtTHB } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { Link, useSearchParams } from "react-router-dom";
import { CustomerLink } from "@/components/CustomerLink";
import { Search, Receipt, Info, Printer, FileDown, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { RowActions } from "@/components/RowActions";
import { ThaiDocLayout } from "@/components/ThaiDocLayouts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { InvoiceFromPODialog } from "@/components/dialogs/InvoiceFromPODialog";
import { poInvoices, useCustomerPoTick, findCustomerPo, linesForPoInvoice } from "@/lib/customerPoStore";

export default function Invoices() {
  useBizTick();
  useCustomerPoTick();
  const { user, can } = useAuth();
  const [params] = useSearchParams();
  const initial = params.get("filter") ?? "all";
  const dueSoon = initial === "due-soon";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(dueSoon ? "all" : initial);
  const [preview, setPreview] = useState<{ number: string; type: string } | null>(null);
  const [poInvOpen, setPoInvOpen] = useState(false);
  const list = customerInvoices.filter((i) => {
    const cust = findCustomer(i.customerId);
    const m = i.number.toLowerCase().includes(q.toLowerCase()) ||
      (cust?.name ?? "").toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || i.status === filter;
    const d = !dueSoon || i.status !== "Paid";
    return m && s && d;
  });
  const outstanding = customerInvoices.filter((i) => i.status !== "Paid").reduce((a, b) => a + b.total, 0);
  return (
    <>
      <PageHeader title="Customer Invoices" thai="ใบแจ้งหนี้ลูกค้า"
        description="ติดตามใบแจ้งหนี้ลูกค้า ยอดที่ต้องรับ และสถานะการชำระเงิน"
        actions={<Button onClick={() => setPoInvOpen(true)}><ScanLine className="w-4 h-4 mr-1" />สร้าง Invoice จาก PO ลูกค้า</Button>}
      />

      {poInvoices.length > 0 && (
        <Card className="card-soft p-4 mb-4">
          <div className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Invoice ที่ออกจาก Customer PO ({poInvoices.length})
          </div>
          <div className="space-y-2">
            {poInvoices.map((inv) => {
              const po = findCustomerPo(inv.customerPoId);
              const ls = linesForPoInvoice(inv.id);
              return (
                <div key={inv.id} className="border rounded-lg p-3 bg-secondary/20 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <Link to={`/po-invoices/${inv.id}`} className="text-primary hover:underline">{inv.number}</Link>
                      <Badge className="bg-success/15 text-success border-success/30 text-[10px]" variant="outline">จาก PO</Badge>
                      {po && <span className="text-xs text-muted-foreground">← {po.number}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      วันที่ {inv.date} • ครบกำหนด {inv.dueDate} • {ls.length} รายการ • {inv.paymentTerm}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmtTHB(inv.total)}</div>
                    <Button asChild size="sm" variant="outline" className="mt-1 h-7 text-xs">
                      <Link to={`/po-invoices/${inv.id}`}>เปิดดู Invoice</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">ยอดค้างรับรวม: {fmtTHB(outstanding)}</AlertTitle>
        <AlertDescription className="text-info/90">
          เงินที่กำลังเข้าจะแสดงในแดชบอร์ด การเปลี่ยนสถานะจะถูกบันทึกในบันทึกการใช้งานทุกครั้ง
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาใบแจ้งหนี้…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium"><Link to={`/invoices/${i.id}`} className="text-primary hover:underline">{i.number}</Link></TableCell>
                <TableCell><CustomerLink customerId={i.customerId} /></TableCell>
                <TableCell className="text-sm"><Link to={`/jobs/${i.jobId}`} className="text-primary hover:underline">{findJob(i.jobId)?.number}</Link></TableCell>
                <TableCell className="text-sm">
                  <div>{i.date}</div>
                  <div className="text-xs text-muted-foreground">ครบกำหนด {i.dueDate}{i.paymentDate ? ` • ชำระแล้ว ${i.paymentDate}` : ""}</div>
                </TableCell>
                <TableCell className="text-right">{fmtTHB(i.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(i.vat)}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(i.total)}</TableCell>
                <TableCell><StatusBadge status={i.status} /></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Select value={i.status} disabled={!can("edit")}
                      onValueChange={(v) => { setInvoiceStatus(i.id, v as InvoiceStatus, user?.name ?? "Demo"); toast.success(`Invoice → ${v}`); }}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <RowActions
                      viewHref={`/invoices/${i.id}`}
                      onEdit={() => toast.info(`แก้ไข ${i.number}`)}
                      onPrint={() => setPreview({ number: i.number, type: "td5" })}
                      onPdf={() => toast.info(`PDF ${i.number}`)}
                      onDuplicate={() => toast.success(`ทำสำเนา ${i.number}`, { description: `Copied from ${i.number}` })}
                      onSubmitApproval={() => toast.success("ส่งขออนุมัติแล้ว")}
                      onApprove={() => toast.success(`อนุมัติ ${i.number}`)}
                      onReject={() => toast.error(`ไม่อนุมัติ ${i.number}`)}
                      onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                      onViewLog={() => toast.info("ดูประวัติเอกสาร")}
                      onDelete={() => { const idx = customerInvoices.findIndex(x => x.id === i.id); if (idx >= 0) customerInvoices.splice(idx, 1); setInvoiceStatus(i.id, i.status, user?.name ?? "Demo"); }}
                      deleteLabel={`ใบแจ้งหนี้ ${i.number}`}
                      relatedWarning={`ใบนี้ผูกกับงาน ${findJob(i.jobId)?.number ?? ""} หากลบประวัติงานจะหายไป`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Receipt className="w-4 h-4" /> ยังไม่มีใบแจ้งหนี้</div>}
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>พรีวิว {preview?.number}</DialogTitle></DialogHeader>
          {preview && <ThaiDocLayout docTypeId={preview.type} number={preview.number} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์ (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceFromPODialog open={poInvOpen} onOpenChange={setPoInvOpen} />
    </>
  );
}
