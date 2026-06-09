import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RowActions } from "@/components/RowActions";
import { paymentVouchers as seed, PaymentVoucher, PV_METHODS, PVMethod, pvFmt, printLog as seedLog, PrintLogEntry, copyLabel } from "@/lib/mockCalendar";
import { customers, findCustomer } from "@/lib/mockData";
import { audit } from "@/lib/store";
import { Search, Plus, Eye, Printer, Download, Copy as CopyIcon, FileText, History } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE: Record<string, "muted" | "warning" | "success" | "info"> = {
  "Draft": "muted",
  "Pending Approval": "warning",
  "Approved": "info",
  "Paid": "success",
};

export default function PaymentVouchers() {
  const [list, setList] = useState<PaymentVoucher[]>(seed);
  const [log, setLog] = useState<PrintLogEntry[]>(seedLog);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<PaymentVoucher | null>(null);
  const [logFor, setLogFor] = useState<PaymentVoucher | null>(null);
  const [copies, setCopies] = useState<number>(2);
  const [customCopies, setCustomCopies] = useState<string>("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() =>
    list.filter((v) =>
      [v.number, v.payTo, v.billNumber, v.description].join(" ").toLowerCase().includes(q.toLowerCase())
    ), [list, q]);

  const doPrint = (v: PaymentVoucher, c: number) => {
    const entry: PrintLogEntry = {
      id: `pl-${Date.now()}`, printedBy: "Khun Ploy",
      printedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      copies: c, documentType: "Payment Voucher", relatedId: v.id,
    };
    setLog([entry, ...log]);
    audit("Khun Ploy", "Print Payment Voucher", `${v.number} × ${c} ชุด`, "Payment Vouchers");
    toast.success(`พิมพ์ ${v.number} จำนวน ${c} ชุด พร้อมบันทึก Print Log`);
  };

  const duplicate = (v: PaymentVoucher) => {
    const num = `PV-2026-${String(1000 + list.length + 1).slice(1)}`;
    const copied: PaymentVoucher = {
      ...v, id: `pv-${Date.now()}`, number: num, approvalStatus: "Draft",
      notes: `Copied from ${v.number}${v.notes ? ` • ${v.notes}` : ""}`,
    };
    setList([copied, ...list]);
    audit("Khun Ploy", "Duplicate Payment Voucher", `${num} (Copied from ${v.number})`, "Payment Vouchers");
    toast.success(`สร้างสำเนาเป็น ${num}`, { description: `Copied from ${v.number}` });
  };

  const removeVoucher = (v: PaymentVoucher) => {
    setList(list.filter((x) => x.id !== v.id));
    audit("Khun Ploy", "Delete Payment Voucher", v.number, "Payment Vouchers");
  };

  return (
    <>
      <PageHeader title="Payment Vouchers" thai="ใบสำคัญจ่าย"
        description="ออกใบสำคัญจ่าย พิมพ์ต้นฉบับและสำเนา ติดตามการอนุมัติและบันทึกการพิมพ์อัตโนมัติ"
        actions={<Button size="sm" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> ใบสำคัญจ่ายใหม่</Button>} />

      <Card className="card-soft p-3 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาเลขที่ ผู้รับ บิล หรือคำอธิบาย" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </Card>

      {/* Desktop table */}
      <Card className="card-soft overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">เลขที่</th>
              <th className="text-left px-4 py-2.5">วันที่</th>
              <th className="text-left px-4 py-2.5">จ่ายให้</th>
              <th className="text-left px-4 py-2.5">บิล</th>
              <th className="text-right px-4 py-2.5">จำนวนเงิน</th>
              <th className="text-left px-4 py-2.5">วิธีชำระ</th>
              <th className="text-left px-4 py-2.5">สถานะ</th>
              <th className="text-right px-4 py-2.5">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t hover:bg-accent/30">
                <td className="px-4 py-2.5"><Link to={`/payment-vouchers/${v.id}`} className="text-primary hover:underline font-medium">{v.number}</Link></td>
                <td className="px-4 py-2.5">{v.date}</td>
                <td className="px-4 py-2.5">{v.payTo}</td>
                <td className="px-4 py-2.5">{v.billNumber}</td>
                <td className="px-4 py-2.5 text-right">{pvFmt(v.amount)}</td>
                <td className="px-4 py-2.5">{v.method}</td>
                <td className="px-4 py-2.5"><StatusBadge status={v.approvalStatus} tone={STATUS_TONE[v.approvalStatus]} /></td>
                <td className="px-4 py-2.5 text-right">
                  <RowActions
                    viewHref={`/payment-vouchers/${v.id}`}
                    onEdit={() => toast.info(`แก้ไข ${v.number} (เดโม)`)}
                    onPrint={() => setPreview(v)}
                    onPdf={() => toast.info(`PDF ${v.number}`)}
                    onDuplicate={() => duplicate(v)}
                    onSubmitApproval={() => { setList(list.map((x) => x.id === v.id ? { ...x, approvalStatus: "Pending Approval" } : x)); toast.success("ส่งขออนุมัติแล้ว"); }}
                    onApprove={() => { setList(list.map((x) => x.id === v.id ? { ...x, approvalStatus: "Approved" } : x)); toast.success(`อนุมัติ ${v.number}`); }}
                    onReject={() => { setList(list.map((x) => x.id === v.id ? { ...x, approvalStatus: "Draft" } : x)); toast.error(`ไม่อนุมัติ ${v.number}`); }}
                    onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                    onViewLog={() => setLogFor(v)}
                    onDelete={() => removeVoucher(v)}
                    deleteLabel={`ใบสำคัญจ่าย ${v.number}`}
                    relatedWarning={v.supplierBillId || v.jobId ? "ใบสำคัญจ่ายนี้ผูกกับบิลซัพพลายเออร์/งาน หากลบความสัมพันธ์จะถูกตัด" : undefined}
                  />
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={8} className="text-center text-sm text-muted-foreground py-8">ยังไม่มีใบสำคัญจ่าย</td></tr>}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className="card-soft p-3">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/payment-vouchers/${v.id}`} className="text-primary font-medium">{v.number}</Link>
                <div className="text-xs text-muted-foreground">{v.date} · {v.payTo}</div>
              </div>
              <StatusBadge status={v.approvalStatus} tone={STATUS_TONE[v.approvalStatus]} />
            </div>
            <div className="text-sm mt-2 flex justify-between"><span>{v.method}</span><span className="font-medium">{pvFmt(v.amount)}</span></div>
            <div className="flex gap-2 mt-2 justify-end">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreview(v)}>ดู/พิมพ์</Button>
              <RowActions
                onEdit={() => toast.info(`แก้ไข ${v.number}`)}
                onPrint={() => setPreview(v)}
                onPdf={() => toast.info(`PDF ${v.number}`)}
                onDuplicate={() => duplicate(v)}
                onApprove={() => { setList(list.map((x) => x.id === v.id ? { ...x, approvalStatus: "Approved" } : x)); toast.success("อนุมัติแล้ว"); }}
                onReject={() => { setList(list.map((x) => x.id === v.id ? { ...x, approvalStatus: "Draft" } : x)); }}
                onViewLog={() => setLogFor(v)}
                onDelete={() => removeVoucher(v)}
                deleteLabel={v.number}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Print Log */}
      <Card className="card-soft p-5 mt-6">
        <h3 className="font-display text-lg font-semibold mb-3">ประวัติการพิมพ์ (Print Log)</h3>
        <div className="space-y-1.5">
          {log.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
              <div>
                <div className="font-medium">{l.documentType} · {l.relatedId}</div>
                <div className="text-xs text-muted-foreground">{l.printedBy} · {l.printedAt}</div>
              </div>
              <StatusBadge status={`${l.copies} ชุด`} tone="info" />
            </div>
          ))}
          {!log.length && <div className="text-sm text-muted-foreground">ยังไม่มีประวัติการพิมพ์</div>}
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>พรีวิวใบสำคัญจ่าย {preview?.number}</DialogTitle>
            <DialogDescription>เลือกจำนวนชุด พิมพ์ หรือดาวน์โหลด PDF (เดโม)</DialogDescription>
          </DialogHeader>

          {preview && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Label className="text-xs">จำนวนชุด</Label>
                {[1, 2, 3].map((n) => (
                  <Button key={n} size="sm" variant={copies === n ? "default" : "outline"} onClick={() => setCopies(n)}>
                    {n === 1 ? "ต้นฉบับเท่านั้น" : `ต้นฉบับ + สำเนา ${n - 1}`}
                  </Button>
                ))}
                <Input type="number" placeholder="กำหนดเอง" className="w-28 h-8"
                  value={customCopies} onChange={(e) => { setCustomCopies(e.target.value); if (e.target.value) setCopies(Number(e.target.value)); }} />
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => duplicate(preview)}><CopyIcon className="w-4 h-4 mr-1" />สำเนาใหม่</Button>
                  <Button size="sm" variant="outline" onClick={() => { doPrint(preview, copies); }}><Download className="w-4 h-4 mr-1" />PDF</Button>
                  <Button size="sm" onClick={() => { doPrint(preview, copies); window.print?.(); }}><Printer className="w-4 h-4 mr-1" />พิมพ์</Button>
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: Math.max(1, copies) }).map((_, idx) => (
                  <VoucherSheet key={idx} v={preview} label={copyLabel(idx)} />
                ))}
              </div>
            </>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* New voucher */}
      <NewVoucherDialog open={newOpen} onClose={() => setNewOpen(false)}
        onCreate={(v) => { setList([v, ...list]); setNewOpen(false); audit("Khun Ploy", "Create Payment Voucher", v.number, "Payment Vouchers"); toast.success(`สร้าง ${v.number} แล้ว`); }}
        nextNumber={`PV-2026-${String(1000 + list.length + 1).slice(1)}`} />

      {/* Per-voucher Print Log */}
      <Dialog open={!!logFor} onOpenChange={(o) => !o && setLogFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ประวัติการพิมพ์ — {logFor?.number}</DialogTitle>
            <DialogDescription>เฉพาะใบสำคัญจ่ายฉบับนี้</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
            {logFor && log.filter((l) => l.relatedId === logFor.id).map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                <div>
                  <div className="font-medium">{l.printedBy}</div>
                  <div className="text-xs text-muted-foreground">{l.printedAt}</div>
                </div>
                <StatusBadge status={`${l.copies} ชุด`} tone="info" />
              </div>
            ))}
            {logFor && !log.filter((l) => l.relatedId === logFor.id).length && (
              <div className="text-sm text-muted-foreground text-center py-6">ยังไม่มีการพิมพ์สำหรับใบนี้</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VoucherSheet({ v, label }: { v: PaymentVoucher; label: string }) {
  const cust = v.customerId ? findCustomer(v.customerId) : null;
  return (
    <div className="border rounded-lg p-6 bg-white text-black relative">
      <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded border bg-amber-50 text-amber-800 border-amber-200 font-medium">{label}</div>
      <div className="text-center mb-4">
        <div className="text-lg font-bold">ใบสำคัญจ่าย / Payment Voucher</div>
        <div className="text-xs text-muted-foreground">บริษัท MTO Business OS (เดโม)</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm border-y py-2 mb-3">
        <div><b>เลขที่:</b> {v.number}</div>
        <div className="text-right"><b>วันที่:</b> {v.date}</div>
        <div className="col-span-2"><b>จ่ายให้:</b> {v.payTo}</div>
        <div><b>เลขบิล:</b> {v.billNumber}</div>
        <div className="text-right"><b>วิธีชำระ:</b> {v.method}</div>
        {v.method === "Cheque" && <>
          <div><b>เลขเช็ค:</b> {v.chequeNumber}</div>
          <div className="text-right"><b>วันที่เช็ค:</b> {v.chequeDate}</div>
        </>}
      </div>
      <table className="w-full text-sm mb-3">
        <thead className="bg-gray-100">
          <tr><th className="text-left p-2">รายละเอียด</th><th className="text-right p-2 w-32">จำนวนเงิน</th></tr>
        </thead>
        <tbody>
          <tr><td className="p-2 border-t">{v.description}</td><td className="p-2 border-t text-right">{pvFmt(v.amount)}</td></tr>
          <tr><td className="p-2 border-t font-medium text-right">รวม</td><td className="p-2 border-t font-bold text-right">{pvFmt(v.amount)}</td></tr>
        </tbody>
      </table>
      <div className="text-sm mb-3"><b>จำนวนเงินตัวอักษร:</b> {v.amountInWords}</div>
      {cust && <div className="text-sm mb-3"><b>ลูกค้าที่เกี่ยวข้อง:</b> {cust.name}</div>}
      {v.notes && <div className="text-sm mb-3 text-muted-foreground"><b>หมายเหตุ:</b> {v.notes}</div>}
      <div className="grid grid-cols-3 gap-3 text-xs mt-8 pt-4">
        <Sign label="ผู้รับเงิน" name={v.collector} />
        <Sign label="ผู้จ่ายเงิน" name={v.paidBy} />
        <Sign label="ผู้อนุมัติ" name={v.approvedBy} />
      </div>
    </div>
  );
}

function Sign({ label, name }: { label: string; name: string }) {
  return (
    <div className="text-center">
      <div className="border-t mt-6 pt-1">{label}</div>
      <div className="text-muted-foreground">({name})</div>
    </div>
  );
}

function NewVoucherDialog({ open, onClose, onCreate, nextNumber }: {
  open: boolean; onClose: () => void; onCreate: (v: PaymentVoucher) => void; nextNumber: string;
}) {
  const [form, setForm] = useState<Partial<PaymentVoucher>>({
    number: nextNumber, date: new Date().toISOString().slice(0, 10),
    payTo: "", billNumber: "", description: "", amount: 0, method: "Bank Transfer",
    amountInWords: "", collector: "Khun Somchai", paidBy: "Khun Ploy", approvedBy: "Khun Anan",
    approvalStatus: "Draft",
  });
  const set = (k: keyof PaymentVoucher, v: unknown) => setForm({ ...form, [k]: v });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบสำคัญจ่ายใหม่</DialogTitle>
          <DialogDescription>กรอกข้อมูลพื้นฐาน ระบบจะออกเลขที่อัตโนมัติ</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="เลขที่"><Input value={form.number} onChange={(e) => set("number", e.target.value)} /></Field>
          <Field label="วันที่"><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="จ่ายให้ (Supplier/บุคคล)" full><Input value={form.payTo} onChange={(e) => set("payTo", e.target.value)} placeholder="Thanasak Steel" /></Field>
          <Field label="เลขที่บิล"><Input value={form.billNumber} onChange={(e) => set("billNumber", e.target.value)} placeholder="SB-2026-0011" /></Field>
          <Field label="จำนวนเงิน (บาท)"><Input type="number" value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} /></Field>
          <Field label="วิธีชำระ">
            <Select value={form.method as PVMethod} onValueChange={(v) => set("method", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PV_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="ลูกค้าที่เกี่ยวข้อง">
            <Select value={form.customerId || ""} onValueChange={(v) => set("customerId", v)}>
              <SelectTrigger><SelectValue placeholder="ไม่ระบุ" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {form.method === "Cheque" && <>
            <Field label="เลขเช็ค"><Input value={form.chequeNumber || ""} onChange={(e) => set("chequeNumber", e.target.value)} /></Field>
            <Field label="วันที่เช็ค"><Input type="date" value={form.chequeDate || ""} onChange={(e) => set("chequeDate", e.target.value)} /></Field>
          </>}
          <Field label="คำอธิบาย" full><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="ค่าวัตถุดิบ..." /></Field>
          <Field label="จำนวนเงินตัวอักษร" full><Input value={form.amountInWords} onChange={(e) => set("amountInWords", e.target.value)} placeholder="หนึ่งหมื่นบาทถ้วน" /></Field>
          <Field label="ผู้รับเงิน"><Input value={form.collector} onChange={(e) => set("collector", e.target.value)} /></Field>
          <Field label="ผู้จ่ายเงิน"><Input value={form.paidBy} onChange={(e) => set("paidBy", e.target.value)} /></Field>
          <Field label="ผู้อนุมัติ"><Input value={form.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} /></Field>
          <Field label="หมายเหตุ" full><Textarea rows={2} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => onCreate({ id: `pv-${Date.now()}`, ...form } as PaymentVoucher)}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// Detail page
export function PaymentVoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const v = seed.find((x) => x.id === id);
  if (!v) return <div className="p-6">ไม่พบใบสำคัญจ่าย <Button variant="link" onClick={() => navigate("/payment-vouchers")}>กลับ</Button></div>;
  return (
    <>
      <Breadcrumbs items={[{ label: "Payment Vouchers", to: "/payment-vouchers" }, { label: v.number }]} />
      <PageHeader title={v.number} thai="ใบสำคัญจ่าย"
        description={`จ่ายให้ ${v.payTo} จำนวน ${pvFmt(v.amount)}`}
        actions={<StatusBadge status={v.approvalStatus} tone={STATUS_TONE[v.approvalStatus]} />} />
      <Card className="card-soft p-0 overflow-hidden">
        <VoucherSheet v={v} label="ต้นฉบับ" />
      </Card>
      <Card className="card-soft p-5 mt-4">
        <div className="text-sm flex items-center gap-2 mb-2"><FileText className="w-4 h-4" /> เอกสารที่เกี่ยวข้อง</div>
        <div className="flex flex-wrap gap-2 text-sm">
          {v.supplierBillId && <Link to={`/supplier-bills/${v.supplierBillId}`} className="px-2 py-1 rounded border bg-secondary hover:bg-accent">บิลซัพพลายเออร์ · {v.supplierBillId}</Link>}
          {v.jobId && <Link to={`/jobs/${v.jobId}`} className="px-2 py-1 rounded border bg-secondary hover:bg-accent">งาน · {v.jobId}</Link>}
          {v.customerId && <Link to={`/customers/${v.customerId}`} className="px-2 py-1 rounded border bg-secondary hover:bg-accent">ลูกค้า · {findCustomer(v.customerId)?.name}</Link>}
        </div>
      </Card>
    </>
  );
}
