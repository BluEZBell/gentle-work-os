// Phase 3C — Create Receipt from Invoice or Billing Note.
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt as ReceiptIcon, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { customers, fmtTHB } from "@/lib/mockData";
import { poInvoices } from "@/lib/customerPoStore";
import {
  createReceipt, nextReceiptNumber, PAYMENT_METHODS, type PaymentMethod, findBn,
} from "@/lib/billingReceiptStore";
import { audit } from "@/lib/store";

type Step = "form" | "preview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId?: string;
  billingNoteId?: string;
  customerId?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ReceiptDialog({ open, onOpenChange, invoiceId, billingNoteId, customerId }: Props) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");

  const [rcpNo, setRcpNo] = useState("");
  const [rcpDate, setRcpDate] = useState(todayIso());
  const [paidDate, setPaidDate] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod>("โอนธนาคาร");
  const [methodOther, setMethodOther] = useState("");
  const [bankAccount, setBankAccount] = useState("KBank xxx-x-1234-x");
  const [amount, setAmount] = useState("0");
  const [wht, setWht] = useState("0");
  const [notes, setNotes] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [contactName, setContactName] = useState("");
  const [pickedInvId, setPickedInvId] = useState<string>(invoiceId ?? "");
  const [pickedCust, setPickedCust] = useState<string>(customerId ?? "");

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setRcpNo(nextReceiptNumber());
    setRcpDate(todayIso());
    setPaidDate(todayIso());
    setMethod("โอนธนาคาร"); setMethodOther(""); setBankAccount("KBank xxx-x-1234-x");
    setNotes(""); setInternalNote("");
    setPickedInvId(invoiceId ?? "");
    setPickedCust(customerId ?? "");

    let inv = invoiceId ? poInvoices.find((i) => i.id === invoiceId) : undefined;
    if (!inv && billingNoteId) {
      const bn = findBn(billingNoteId);
      if (bn) {
        setPickedCust(bn.customerId);
        inv = poInvoices.find((i) => i.id === bn.invoiceIds[0]);
        if (inv) setPickedInvId(inv.id);
        setContactName(bn.contactName ?? "");
      }
    }
    if (inv) {
      setAmount(String(inv.total));
      setWht(String(inv.wht || 0));
      setPickedCust(inv.customerId);
      setContactName(inv.contactName ?? "");
    } else {
      setAmount("0"); setWht("0");
    }
  }, [open, invoiceId, billingNoteId, customerId]);

  const inv = pickedInvId ? poInvoices.find((i) => i.id === pickedInvId) : undefined;
  const bn = billingNoteId ? findBn(billingNoteId) : undefined;
  const cust = customers.find((c) => c.id === (inv?.customerId ?? pickedCust));

  const availableInvoices = poInvoices.filter((i) => !pickedCust || i.customerId === pickedCust);

  const submit = () => {
    if (!inv) return toast.error("เลือก Invoice");
    const r = createReceipt({
      number: rcpNo, customerId: inv.customerId, contactName,
      invoiceId: inv.id, billingNoteId,
      receiptDate: rcpDate, paymentReceivedDate: paidDate,
      method, methodOther: method === "อื่น ๆ" ? methodOther : undefined,
      bankAccount: method === "โอนธนาคาร" ? bankAccount : undefined,
      amount: Number(amount) || 0, whtAmount: Number(wht) || 0,
      notes, internalNote,
    }, user?.name ?? "Demo");
    audit(user?.name ?? "Demo", "Create Receipt", `${r.number} • Invoice ${inv.number} • ${fmtTHB(r.amount)}`, "Receipts");
    toast.success(`ออกใบเสร็จรับเงิน ${r.number}`, { description: `จาก Invoice ${inv.number}` });
    onOpenChange(false);
    setTimeout(() => nav(`/receipts/${r.id}`), 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-emerald-600" />
            สร้างใบเสร็จรับเงิน
            <Badge variant="outline" className="ml-2">{step === "form" ? "1. ข้อมูลการชำระ" : "2. พรีวิว"}</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ลูกค้า</Label>
              <select className="w-full mt-1 h-9 px-2 rounded-md border bg-background text-sm"
                value={pickedCust} onChange={(e) => { setPickedCust(e.target.value); setPickedInvId(""); }}>
                <option value="">— เลือกลูกค้า —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Invoice ที่รับชำระ</Label>
              <select className="w-full mt-1 h-9 px-2 rounded-md border bg-background text-sm"
                value={pickedInvId} onChange={(e) => {
                  setPickedInvId(e.target.value);
                  const i = poInvoices.find((x) => x.id === e.target.value);
                  if (i) { setAmount(String(i.total)); setWht(String(i.wht || 0)); setContactName(i.contactName ?? ""); }
                }}>
                <option value="">— เลือก Invoice —</option>
                {availableInvoices.map((i) => <option key={i.id} value={i.id}>{i.number} • {fmtTHB(i.total)}</option>)}
              </select>
            </div>

            <Field label="เลขที่ใบเสร็จรับเงิน" value={rcpNo} onChange={setRcpNo} />
            <Field label="วันที่ใบเสร็จ" type="date" value={rcpDate} onChange={setRcpDate} />
            <Field label="วันที่ได้รับชำระ" type="date" value={paidDate} onChange={setPaidDate} />
            <Field label="ผู้ติดต่อ" value={contactName} onChange={setContactName} />

            <div>
              <Label className="text-xs">วิธีชำระเงิน</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {method === "อื่น ๆ" && <Field label="ระบุวิธีอื่น ๆ" value={methodOther} onChange={setMethodOther} />}
            {method === "โอนธนาคาร" && <Field label="ธนาคาร / บัญชี" value={bankAccount} onChange={setBankAccount} />}

            <Field label="ยอดรับชำระ" type="number" value={amount} onChange={setAmount} />
            <Field label="หัก ณ ที่จ่าย" type="number" value={wht} onChange={setWht} />

            <div className="md:col-span-2">
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">โน้ตภายใน</Label>
              <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
            </div>

            {inv && (
              <Card className="md:col-span-2 p-3 bg-secondary/30 text-xs">
                <div className="font-semibold mb-1">อ้างอิง</div>
                <div>Invoice {inv.number} • {fmtTHB(inv.total)}</div>
                {bn && <div>ใบวางบิล {bn.number}</div>}
              </Card>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <RcPreview accent="green" tag="ต้นฉบับ" data={{ rcpNo, rcpDate, paidDate, method, methodOther, bankAccount, amount: Number(amount) || 0, wht: Number(wht) || 0, notes, customer: cust?.name ?? "—", contactName, invoice: inv?.number ?? "—", bn: bn?.number }} />
            <RcPreview accent="gray" tag="สำเนา" data={{ rcpNo, rcpDate, paidDate, method, methodOther, bankAccount, amount: Number(amount) || 0, wht: Number(wht) || 0, notes, customer: cust?.name ?? "—", contactName, invoice: inv?.number ?? "—", bn: bn?.number }} />
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "preview" && <Button variant="outline" onClick={() => setStep("form")}><ArrowLeft className="w-4 h-4 mr-1" />ย้อนกลับ</Button>}
          {step === "form" ? (
            <Button onClick={() => { if (!inv) return toast.error("เลือก Invoice"); setStep("preview"); }}>ถัดไป<ArrowRight className="w-4 h-4 ml-1" /></Button>
          ) : (
            <Button onClick={submit} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-4 h-4 mr-1" />สร้างใบเสร็จรับเงิน</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 mt-1" />
    </div>
  );
}

function RcPreview({ accent, tag, data }: { accent: "green" | "gray"; tag: string; data: { rcpNo: string; rcpDate: string; paidDate: string; method: PaymentMethod; methodOther?: string; bankAccount?: string; amount: number; wht: number; notes: string; customer: string; contactName: string; invoice: string; bn?: string } }) {
  const isGreen = accent === "green";
  const stripe = isGreen ? "bg-emerald-600" : "bg-gray-400";
  const tagBg = isGreen ? "bg-emerald-600 text-white" : "bg-gray-500 text-white";
  const titleColor = isGreen ? "text-emerald-700" : "text-gray-700";
  const border = isGreen ? "border-emerald-200" : "border-gray-300";
  const netReceived = data.amount - data.wht;
  return (
    <div className={`relative bg-white border-2 ${border} rounded-md overflow-hidden shadow-sm`}>
      <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-md ${tagBg}`}>{tag}</div>
      <div className={`h-1.5 ${stripe}`} />
      <div className="p-4 space-y-3 text-xs">
        <div>
          <div className={`text-lg font-bold ${titleColor}`}>ใบเสร็จรับเงิน / Receipt</div>
          <div className="text-muted-foreground">เลขที่ {data.rcpNo} • วันที่ {data.rcpDate}</div>
          <div className="text-muted-foreground">วันที่รับชำระ {data.paidDate}</div>
        </div>
        <div className="border-t pt-2">
          <div className="font-semibold">รับเงินจาก</div>
          <div>{data.customer}</div>
          {data.contactName && <div className="text-muted-foreground">ผู้ติดต่อ {data.contactName}</div>}
        </div>
        <div className="border-t pt-2 grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Invoice อ้างอิง</span><div>{data.invoice}</div></div>
          {data.bn && <div><span className="text-muted-foreground">ใบวางบิลอ้างอิง</span><div>{data.bn}</div></div>}
          <div><span className="text-muted-foreground">วิธีชำระเงิน</span><div>{data.method === "อื่น ๆ" ? `อื่น ๆ — ${data.methodOther ?? ""}` : data.method}{data.method === "โอนธนาคาร" && data.bankAccount ? ` • ${data.bankAccount}` : ""}</div></div>
        </div>
        <div className="border-t pt-2 space-y-1">
          <Row label="ยอดรับชำระ" value={fmtTHB(data.amount)} />
          {data.wht > 0 && <Row label="หัก ณ ที่จ่าย" value={`- ${fmtTHB(data.wht)}`} />}
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>ยอดสุทธิที่ได้รับ</span><span className={titleColor}>{fmtTHB(netReceived)}</span>
          </div>
        </div>
        {data.notes && <div className="border-t pt-2 text-muted-foreground"><b>หมายเหตุ:</b> {data.notes}</div>}
        <div className="border-t pt-3 flex justify-between text-[10px] text-muted-foreground">
          <div>ผู้รับเงิน: ____________________</div>
          <div>ผู้จ่ายเงิน: ____________________</div>
        </div>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
