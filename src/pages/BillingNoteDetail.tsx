// Phase 3C — Billing Note detail page (purple original / gray copy).
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Timeline } from "@/components/Timeline";
import { Attachments } from "@/components/Attachments";
import { ReceiptDialog } from "@/components/dialogs/ReceiptDialog";
import { AddToCalendarDialog } from "@/components/dialogs/AddToCalendarDialog";
import { useAuth } from "@/lib/auth";
import { fmtTHB, findCustomer } from "@/lib/mockData";
import { poInvoices } from "@/lib/customerPoStore";
import {
  findBn, useBnTick, BN_STATUS_TH, updateBillingNote, deleteBillingNote,
  remindersForBn, REMINDER_LABEL, receiptsForBn, printLogFor, logPrint, isInvoicePaid,
} from "@/lib/billingReceiptStore";
import { audit } from "@/lib/store";
import { Printer, FileDown, Pencil, CalendarPlus, Trash2, Receipt, History, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function BillingNoteDetail() {
  useBnTick();
  const { user } = useAuth();
  const { id } = useParams();
  const bn = id ? findBn(id) : undefined;
  const [rcpOpen, setRcpOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [bnDate, setBnDate] = useState(bn?.billingDate ?? "");
  const [subDate, setSubDate] = useState(bn?.submissionDate ?? "");

  if (!bn) return <div className="p-6">ไม่พบใบวางบิล <Link to="/" className="text-primary">กลับ</Link></div>;

  const invs = poInvoices.filter((i) => bn.invoiceIds.includes(i.id));
  const cust = findCustomer(bn.customerId);
  const rems = remindersForBn(bn.id);
  const rcs = receiptsForBn(bn.id);
  const pl = printLogFor(bn.id);

  const print = (copyType: "ต้นฉบับ" | "สำเนา") => {
    logPrint({ documentType: "Billing Note", relatedId: bn.id, copyType, copies: 1, printedBy: user?.name ?? "Demo" });
    audit(user?.name ?? "Demo", `Print Billing Note (${copyType})`, bn.number, "Billing Notes");
    toast.success(`พิมพ์${copyType}แล้ว (เดโม)`);
  };

  const saveDates = () => {
    updateBillingNote(bn.id, { billingDate: bnDate || bn.billingDate, submissionDate: subDate || bn.submissionDate });
    audit(user?.name ?? "Demo", "Edit Billing Note Dates", bn.number, "Billing Notes");
    toast.success("บันทึกวันที่ใหม่แล้ว");
    setEditOpen(false);
  };

  return (
    <>
      <PageHeader
        title={bn.number}
        thai="ใบวางบิล"
        breadcrumbs={<Breadcrumbs items={[
          { label: "Customers", to: "/customers" },
          { label: cust?.name ?? "ลูกค้า", to: cust ? `/customers/${cust.id}` : "/customers" },
          { label: bn.number },
        ]} />}
        description={`รวม ${invs.length} ใบแจ้งหนี้ • ${fmtTHB(bn.total)} • สถานะ ${BN_STATUS_TH[bn.status]}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { setBnDate(bn.billingDate); setSubDate(bn.submissionDate); setEditOpen(true); }}><Pencil className="w-4 h-4 mr-1" />แก้ไขวันที่</Button>
            <Button size="sm" variant="outline" className="border-purple-300 text-purple-700" onClick={() => print("ต้นฉบับ")}><Printer className="w-4 h-4 mr-1" />พิมพ์ต้นฉบับ</Button>
            <Button size="sm" variant="outline" onClick={() => print("สำเนา")}><Printer className="w-4 h-4 mr-1" />พิมพ์สำเนา</Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setRcpOpen(true)}><Receipt className="w-4 h-4 mr-1" />สร้างใบเสร็จรับเงิน</Button>
            <Button size="sm" variant="outline" onClick={() => setCalOpen(true)}><CalendarPlus className="w-4 h-4 mr-1" />เพิ่มลงปฏิทิน</Button>
            <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}><History className="w-4 h-4 mr-1" />Print Log ({pl.length})</Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4 mr-1" />ลบ</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1 h-fit space-y-3">
          <div className="font-semibold flex items-center justify-between">หัวเอกสาร
            <Badge className="bg-purple-100 text-purple-700 border-purple-300" variant="outline">{BN_STATUS_TH[bn.status]}</Badge>
          </div>
          <Info2 label="ลูกค้า" value={cust ? <Link to={`/customers/${cust.id}`} className="text-primary hover:underline">{cust.name}</Link> : "—"} />
          <Info2 label="ผู้ติดต่อ" value={bn.contactName ?? "—"} />
          <Info2 label="วันที่ใบวางบิล" value={bn.billingDate} />
          <Info2 label="วันวางบิล" value={bn.submissionDate} />
          <Info2 label="วันคาดรับเงิน" value={bn.expectedPaymentDate} />
          <div className="pt-2 border-t text-xs space-y-1">
            <div className="text-muted-foreground">ที่อยู่ออกบิล</div>
            <div>{bn.address || "—"}</div>
            <div className="text-muted-foreground mt-1">TAX ID: {bn.taxId || "—"} • {bn.branch}</div>
          </div>
          {bn.notes && <div className="mt-3 p-2 bg-secondary/50 rounded text-xs">📝 {bn.notes}</div>}
          {bn.internalNote && <div className="p-2 bg-warning-soft/40 rounded text-xs text-warning-foreground">🔒 Internal: {bn.internalNote}</div>}
          <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
            <span>ยอดรวม</span><span className="text-purple-700">{fmtTHB(bn.total)}</span>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">ใบแจ้งหนี้ที่รวม ({invs.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-1.5">Invoice</th><th>วันที่</th><th>ครบกำหนด</th><th className="text-right">ยอด</th><th>ชำระแล้ว</th></tr>
                </thead>
                <tbody>
                  {invs.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-1.5 font-medium"><Link to={`/po-invoices/${i.id}`} className="text-primary hover:underline">{i.number}</Link></td>
                      <td>{i.date}</td>
                      <td>{i.dueDate}</td>
                      <td className="text-right">{fmtTHB(i.total)}</td>
                      <td>{isInvoicePaid(i.id) ? <Badge className="bg-success/15 text-success border-success/30" variant="outline">ชำระแล้ว</Badge> : <Badge variant="outline">ยังไม่ชำระ</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-3">
            <Preview accent="purple" tag="ต้นฉบับ" bn={bn} cust={cust?.name ?? "—"} invs={invs} />
            <Preview accent="gray" tag="สำเนา" bn={bn} cust={cust?.name ?? "—"} invs={invs} />
          </div>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />การแจ้งเตือนวางบิล ({rems.length})</h3>
            {rems.length === 0 ? <div className="text-xs text-muted-foreground">ยังไม่มีการแจ้งเตือน</div> : (
              <ul className="text-sm space-y-1">
                {rems.map((r) => (
                  <li key={r.id} className="flex justify-between border-b last:border-0 py-1">
                    <span>{REMINDER_LABEL[r.kind]}</span>
                    <span className="text-muted-foreground">{r.date} {r.fromBillingRule ? <Badge variant="outline" className="ml-1 text-[10px]">จากกฎวางบิล</Badge> : null}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {rcs.length > 0 && (
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">ใบเสร็จที่ออกแล้ว ({rcs.length})</h3>
              <ul className="text-sm space-y-1">
                {rcs.map((r) => (
                  <li key={r.id} className="flex justify-between border-b last:border-0 py-1">
                    <Link to={`/receipts/${r.id}`} className="text-primary hover:underline">{r.number}</Link>
                    <span>{fmtTHB(r.amount)} • {r.paymentReceivedDate}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Attachments</h3>
            <Attachments module="Billing Note" id={bn.id} />
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <Timeline events={[
              { id: "create", date: bn.createdAt, title: "สร้างใบวางบิลจาก Invoice", detail: `${bn.number} ← ${invs.length} ใบแจ้งหนี้ โดย ${bn.createdBy}`, tone: "info" },
              ...rcs.map((r) => ({ id: r.id, date: r.createdAt, title: "ออกใบเสร็จรับเงินจาก Invoice", detail: `${r.number} • ${fmtTHB(r.amount)}`, tone: "success" as const })),
            ]} />
          </Card>
        </div>
      </div>

      <ReceiptDialog open={rcpOpen} onOpenChange={setRcpOpen} billingNoteId={bn.id} customerId={bn.customerId} invoiceId={bn.invoiceIds[0]} />
      <AddToCalendarDialog open={calOpen} onOpenChange={setCalOpen} defaultCustomerId={bn.customerId} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>แก้ไขวันที่ใบวางบิล</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">วันที่ใบวางบิล</Label><Input type="date" value={bnDate} onChange={(e) => setBnDate(e.target.value)} /></div>
            <div><Label className="text-xs">วันวางบิล</Label><Input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveDates}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Print Log — {bn.number}</DialogTitle></DialogHeader>
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
          <AlertDialogHeader><AlertDialogTitle>ลบใบวางบิล {bn.number}?</AlertDialogTitle>
            <AlertDialogDescription>การลบจะนำใบวางบิลและการแจ้งเตือนที่เกี่ยวข้องออก (เดโม)</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteBillingNote(bn.id); audit(user?.name ?? "Demo", "Delete Billing Note", bn.number, "Billing Notes"); toast.success("ลบใบวางบิลแล้ว"); history.back(); }}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Info2({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="text-sm"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div>{value}</div></div>;
}

function Preview({ accent, tag, bn, cust, invs }: { accent: "purple" | "gray"; tag: string; bn: ReturnType<typeof findBn>; cust: string; invs: typeof poInvoices }) {
  if (!bn) return null;
  const isPurple = accent === "purple";
  const stripe = isPurple ? "bg-purple-600" : "bg-gray-400";
  const tagBg = isPurple ? "bg-purple-600 text-white" : "bg-gray-500 text-white";
  const titleColor = isPurple ? "text-purple-700" : "text-gray-700";
  const border = isPurple ? "border-purple-200" : "border-gray-300";
  return (
    <div className={`relative bg-white border-2 ${border} rounded-md overflow-hidden shadow-sm`}>
      <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-md ${tagBg}`}>{tag}</div>
      <div className={`h-1.5 ${stripe}`} />
      <div className="p-4 space-y-3 text-xs">
        <div>
          <div className={`text-lg font-bold ${titleColor}`}>ใบวางบิล / Billing Note</div>
          <div className="text-muted-foreground">เลขที่ {bn.number} • วันที่ {bn.billingDate}</div>
          <div className="text-muted-foreground">วันวางบิล {bn.submissionDate} • วันคาดรับเงิน {bn.expectedPaymentDate}</div>
        </div>
        <div className="border-t pt-2">
          <div className="font-semibold">วางบิลถึง</div>
          <div>{cust}</div>
          {bn.contactName && <div className="text-muted-foreground">ผู้ติดต่อ {bn.contactName}</div>}
          <div className="text-muted-foreground">{bn.address}</div>
        </div>
        <table className="w-full">
          <thead className="text-left border-b">
            <tr><th className="py-1">เลขที่ใบแจ้งหนี้</th><th>วันที่</th><th className="text-right">ยอด</th></tr>
          </thead>
          <tbody>
            {invs.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="py-1">{i.number}</td>
                <td>{i.date}</td>
                <td className="text-right">{fmtTHB(i.total)}</td>
              </tr>
            ))}
            <tr><td colSpan={2} className="py-2 text-right font-semibold">รวมยอดวางบิล</td><td className="py-2 text-right font-bold">{fmtTHB(bn.total)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
