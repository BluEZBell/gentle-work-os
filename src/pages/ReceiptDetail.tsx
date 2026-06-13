// Phase 3C — Receipt detail page (green original / gray copy).
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Timeline } from "@/components/Timeline";
import { Attachments } from "@/components/Attachments";
import { useAuth } from "@/lib/auth";
import { fmtTHB, findCustomer } from "@/lib/mockData";
import { poInvoices } from "@/lib/customerPoStore";
import {
  findReceipt, useBnTick, findBn, deleteReceipt, printLogFor, logPrint,
} from "@/lib/billingReceiptStore";
import { audit } from "@/lib/store";
import { Printer, FileDown, Pencil, Trash2, History, Info } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ReceiptDetail() {
  useBnTick();
  const { user } = useAuth();
  const { id } = useParams();
  const r = id ? findReceipt(id) : undefined;
  const [logOpen, setLogOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  if (!r) return <div className="p-6">ไม่พบใบเสร็จ <Link to="/" className="text-primary">กลับ</Link></div>;

  const inv = poInvoices.find((i) => i.id === r.invoiceId);
  const bn = r.billingNoteId ? findBn(r.billingNoteId) : undefined;
  const cust = findCustomer(r.customerId);
  const pl = printLogFor(r.id);

  const print = (copyType: "ต้นฉบับ" | "สำเนา") => {
    logPrint({ documentType: "Receipt", relatedId: r.id, copyType, copies: 1, printedBy: user?.name ?? "Demo" });
    audit(user?.name ?? "Demo", `Print Receipt (${copyType})`, r.number, "Receipts");
    toast.success(`พิมพ์${copyType}แล้ว (เดโม)`);
  };

  return (
    <>
      <PageHeader
        title={r.number}
        thai="ใบเสร็จรับเงิน"
        breadcrumbs={<Breadcrumbs items={[
          { label: "Customers", to: "/customers" },
          { label: cust?.name ?? "ลูกค้า", to: cust ? `/customers/${cust.id}` : "/customers" },
          { label: r.number },
        ]} />}
        description={`รับชำระ ${fmtTHB(r.amount)} • ${r.method} • วันที่ ${r.paymentReceivedDate}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.info("แก้ไขใบเสร็จ (เดโม)")}><Pencil className="w-4 h-4 mr-1" />แก้ไข</Button>
            <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => print("ต้นฉบับ")}><Printer className="w-4 h-4 mr-1" />พิมพ์ต้นฉบับ</Button>
            <Button size="sm" variant="outline" onClick={() => print("สำเนา")}><Printer className="w-4 h-4 mr-1" />พิมพ์สำเนา</Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
            <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}><History className="w-4 h-4 mr-1" />Print Log ({pl.length})</Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4 mr-1" />ลบ</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1 h-fit space-y-3">
          <div className="font-semibold flex items-center justify-between">หัวเอกสาร
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300" variant="outline">ออกใบเสร็จแล้ว</Badge>
          </div>
          <Info2 label="ลูกค้า" value={cust ? <Link to={`/customers/${cust.id}`} className="text-primary hover:underline">{cust.name}</Link> : "—"} />
          <Info2 label="ผู้ติดต่อ" value={r.contactName ?? "—"} />
          <Info2 label="Invoice อ้างอิง" value={inv ? <Link to={`/po-invoices/${inv.id}`} className="text-primary hover:underline">{inv.number}</Link> : "—"} />
          <Info2 label="ใบวางบิลอ้างอิง" value={bn ? <Link to={`/billing-notes/${bn.id}`} className="text-primary hover:underline">{bn.number}</Link> : "—"} />
          <Info2 label="วันที่ใบเสร็จ" value={r.receiptDate} />
          <Info2 label="วันที่ได้รับชำระ" value={r.paymentReceivedDate} />
          <Info2 label="วิธีชำระเงิน" value={r.method === "อื่น ๆ" ? `อื่น ๆ — ${r.methodOther ?? ""}` : r.method} />
          {r.method === "โอนธนาคาร" && r.bankAccount && <Info2 label="ธนาคาร / บัญชี" value={r.bankAccount} />}
          <div className="pt-2 border-t space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ยอดรับชำระ</span><span>{fmtTHB(r.amount)}</span></div>
            {r.whtAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">หัก ณ ที่จ่าย</span><span>- {fmtTHB(r.whtAmount)}</span></div>}
            <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
              <span>ยอดสุทธิที่ได้รับ</span><span className="text-emerald-700">{fmtTHB(r.amount - r.whtAmount)}</span>
            </div>
          </div>
          {r.notes && <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">📝 {r.notes}</div>}
          {r.internalNote && <div className="p-2 bg-warning-soft/40 rounded text-xs text-warning-foreground">🔒 Internal: {r.internalNote}</div>}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Preview accent="green" tag="ต้นฉบับ" r={r} cust={cust?.name ?? "—"} invNo={inv?.number ?? "—"} bnNo={bn?.number} />
            <Preview accent="gray" tag="สำเนา" r={r} cust={cust?.name ?? "—"} invNo={inv?.number ?? "—"} bnNo={bn?.number} />
          </div>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Attachments</h3>
            <Attachments module="Receipt" id={r.id} />
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <Timeline events={[
              { id: "create", date: r.createdAt, title: "ออกใบเสร็จรับเงินจาก Invoice", detail: `${r.number} ← ${inv?.number ?? "—"} โดย ${r.createdBy}`, tone: "success" },
            ]} />
          </Card>
        </div>
      </div>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Print Log — {r.number}</DialogTitle></DialogHeader>
          {pl.length === 0 ? (
            <Alert><Info className="h-4 w-4" /><AlertDescription className="text-xs">ยังไม่มีประวัติการพิมพ์</AlertDescription></Alert>
          ) : (
            <ul className="text-sm divide-y">
              {pl.map((e) => (
                <li key={e.id} className="py-1.5 flex justify-between">
                  <div>{e.copyType} × {e.copies}</div>
                  <div className="text-muted-foreground">{e.printedBy} • {e.printedAt}</div>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter><Button onClick={() => setLogOpen(false)}>ปิด</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>ลบใบเสร็จ {r.number}?</AlertDialogTitle>
            <AlertDialogDescription>การลบจะคืนสถานะการชำระของ Invoice นี้ (เดโม)</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteReceipt(r.id); audit(user?.name ?? "Demo", "Delete Receipt", r.number, "Receipts"); toast.success("ลบใบเสร็จแล้ว"); history.back(); }}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Info2({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="text-sm"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div>{value}</div></div>;
}

function Preview({ accent, tag, r, cust, invNo, bnNo }: { accent: "green" | "gray"; tag: string; r: NonNullable<ReturnType<typeof findReceipt>>; cust: string; invNo: string; bnNo?: string }) {
  const isGreen = accent === "green";
  const stripe = isGreen ? "bg-emerald-600" : "bg-gray-400";
  const tagBg = isGreen ? "bg-emerald-600 text-white" : "bg-gray-500 text-white";
  const titleColor = isGreen ? "text-emerald-700" : "text-gray-700";
  const border = isGreen ? "border-emerald-200" : "border-gray-300";
  const net = r.amount - r.whtAmount;
  return (
    <div className={`relative bg-white border-2 ${border} rounded-md overflow-hidden shadow-sm`}>
      <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-md ${tagBg}`}>{tag}</div>
      <div className={`h-1.5 ${stripe}`} />
      <div className="p-4 space-y-3 text-xs">
        <div>
          <div className={`text-lg font-bold ${titleColor}`}>ใบเสร็จรับเงิน / Receipt</div>
          <div className="text-muted-foreground">เลขที่ {r.number} • วันที่ {r.receiptDate}</div>
          <div className="text-muted-foreground">วันที่รับชำระ {r.paymentReceivedDate}</div>
        </div>
        <div className="border-t pt-2">
          <div className="font-semibold">รับเงินจาก</div>
          <div>{cust}</div>
          {r.contactName && <div className="text-muted-foreground">ผู้ติดต่อ {r.contactName}</div>}
        </div>
        <div className="border-t pt-2 grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Invoice อ้างอิง</span><div>{invNo}</div></div>
          {bnNo && <div><span className="text-muted-foreground">ใบวางบิลอ้างอิง</span><div>{bnNo}</div></div>}
          <div><span className="text-muted-foreground">วิธีชำระเงิน</span><div>{r.method === "อื่น ๆ" ? `อื่น ๆ — ${r.methodOther ?? ""}` : r.method}</div></div>
        </div>
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">ยอดรับชำระ</span><span>{fmtTHB(r.amount)}</span></div>
          {r.whtAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">หัก ณ ที่จ่าย</span><span>- {fmtTHB(r.whtAmount)}</span></div>}
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>ยอดสุทธิที่ได้รับ</span><span className={titleColor}>{fmtTHB(net)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
