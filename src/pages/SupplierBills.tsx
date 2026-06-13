import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supplierBills, findSupplier, fmtTHB } from "@/lib/mockData";
import { setBillReview, markBillPaid, useTick, removeBill, duplicateBill } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Mail, FileSearch, ClipboardCheck, CalendarClock, CheckCircle2, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSearchParams, Link } from "react-router-dom";
import { RowActions } from "@/components/RowActions";
import { ThaiDocLayout } from "@/components/ThaiDocLayouts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Printer, FileDown } from "lucide-react";
import { PaymentScheduleDialog } from "@/components/dialogs/PaymentScheduleDialog";

const flow = [
  { icon: Mail, label: "อีเมลจากซัพพลายเออร์" },
  { icon: FileSearch, label: "ดึงข้อมูลอัตโนมัติ" },
  { icon: ClipboardCheck, label: "รอตรวจสอบ" },
  { icon: CheckCircle2, label: "อนุมัติแล้ว" },
  { icon: CalendarClock, label: "แจ้งเตือนในปฏิทิน" },
];

export default function SupplierBills() {
  useTick();
  const { user, can } = useAuth();
  const [params] = useSearchParams();
  const initial = params.get("filter") ?? "all";
  const dueSoon = initial === "due-soon";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(dueSoon ? "all" : initial);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const list = supplierBills.filter((b) => {
    const sup = findSupplier(b.supplierId);
    const m = b.number.toLowerCase().includes(q.toLowerCase()) ||
      (sup?.name ?? "").toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || b.status === filter;
    const d = !dueSoon || b.status !== "Paid";
    return m && s && d;
  });
  const approvingBill = supplierBills.find((b) => b.id === approveId);

  return (
    <>
      <PageHeader title="Supplier Bills" thai="บิลซัพพลายเออร์"
        description="ติดตามบิลจากซัพพลายเออร์ วันที่ครบกำหนด และสถานะการชำระเงิน"
      />

      <Alert className="mb-4 border-warning/40 bg-warning-soft">
        <AlertTriangle className="h-4 w-4 text-warning-foreground" />
        <AlertTitle className="text-warning-foreground">บิลที่ AI ดึงข้อมูลมา ต้องให้คนตรวจสอบก่อนอนุมัติทุกครั้ง</AlertTitle>
        <AlertDescription className="text-warning-foreground/80">
          ระบบจะไม่อนุมัติเอกสารการเงินอัตโนมัติ เจ้าของกิจการต้องตรวจสอบข้อมูลที่ดึงมาก่อนทุกครั้ง
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-5 mb-4">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">ขั้นตอนอัตโนมัติ (ตัวอย่าง)</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {flow.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/70 border min-w-max">
                <step.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{step.label}</span>
              </div>
              {i < flow.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาบิล…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Review</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium"><Link to={`/supplier-bills/${b.id}`} className="text-primary hover:underline">{b.number}</Link></TableCell>
                <TableCell>
                  <div className="text-sm">{findSupplier(b.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">จาก {b.emailSource}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{b.billDate}</div>
                  <div className="text-xs text-muted-foreground">ครบกำหนด {b.dueDate}</div>
                </TableCell>
                <TableCell className="text-right">{fmtTHB(b.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(b.vat)}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(b.total)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                <TableCell><StatusBadge status={b.reviewStatus} /></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {b.reviewStatus === "Approved" && b.status !== "Paid" && (
                      <Button size="sm" variant="ghost" disabled={!can("edit")}
                        onClick={() => { markBillPaid(b.id, user?.name ?? "Demo"); toast.success("Marked paid"); }}>
                        Mark Paid
                      </Button>
                    )}
                    <PaymentScheduleDialog
                      initialSupplierId={b.supplierId}
                      initialAmount={b.total}
                      billId={b.id}
                      jobId={b.jobId}
                      trigger={<Button size="sm" variant="outline">แผนจ่าย</Button>}
                    />
                    <RowActions
                      viewHref={`/supplier-bills/${b.id}`}
                      onEdit={() => toast.info(`เปิดบิล ${b.number} เพื่อแก้ไข`)}
                      onPrint={() => setPreview(b.number)}
                      onPdf={() => toast.info(`PDF ${b.number}`)}
                      onDuplicate={() => { const n = duplicateBill(b.id, user?.name ?? "Demo"); if (n) toast.success(`สร้างสำเนา ${n.number}`); }}
                      onSubmitApproval={() => setApproveId(b.id)}
                      onApprove={() => { setBillReview(b.id, "Approved", user?.name ?? "Demo"); toast.success("Bill approved"); }}
                      onReject={() => { setBillReview(b.id, "Rejected", user?.name ?? "Demo"); toast.error("Bill rejected"); }}
                      onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                      onViewLog={() => toast.info("ดูประวัติบิล")}
                      onDelete={() => removeBill(b.id, user?.name ?? "Demo")}
                      deleteLabel={`บิล ${b.number}`}
                      relatedWarning={b.jobId ? `ผูกกับงาน ${b.jobId} • ${fmtTHB(b.total)} — ความสัมพันธ์จะถูกตัด` : undefined}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!approveId} onOpenChange={(o) => !o && setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve supplier bill?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve <strong>{approvingBill?.number}</strong> for{" "}
              <strong>{approvingBill && fmtTHB(approvingBill.total)}</strong>.
              Approving will allow the bill to be paid and recorded. AI cannot do this automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              if (!approveId) return;
              setBillReview(approveId, "Rejected", user?.name ?? "Demo");
              toast.success("Bill rejected"); setApproveId(null);
            }}>Reject</Button>
            <AlertDialogAction onClick={() => {
              if (!approveId) return;
              setBillReview(approveId, "Approved", user?.name ?? "Demo");
              toast.success("Bill approved"); setApproveId(null);
            }}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>พรีวิวบิล {preview}</DialogTitle></DialogHeader>
          {preview && <ThaiDocLayout docTypeId="td10" number={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์ (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
