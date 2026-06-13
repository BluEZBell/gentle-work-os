// Phase 3C — Create Billing Note from one or more Invoices (real flow, mock data).
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Receipt, Info, ArrowRight, ArrowLeft, Check, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { customers, fmtTHB } from "@/lib/mockData";
import { poInvoices } from "@/lib/customerPoStore";
import { billingRules } from "@/lib/mockCalendar";
import {
  createBillingNote, nextBnNumber, createRemindersForBn,
  addBnCalendarEvents, addNotificationsForBn, isInvoicePaid,
  bnsForInvoice,
} from "@/lib/billingReceiptStore";
import { audit } from "@/lib/store";

type Step = "select" | "header" | "preview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceNumber?: string;          // legacy compat
  defaultInvoiceId?: string;
  defaultCustomerId?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export function BillingNoteDialog({ open, onOpenChange, defaultInvoiceId, defaultCustomerId }: Props) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("select");
  const [customerId, setCustomerId] = useState<string>(defaultCustomerId ?? "");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Header
  const [bnNo, setBnNo] = useState("");
  const [bnDate, setBnDate] = useState(todayIso());
  const [submitDate, setSubmitDate] = useState(todayIso());
  const [expectDate, setExpectDate] = useState(addDays(todayIso(), 30));
  const [contactName, setContactName] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branch, setBranch] = useState("สำนักงานใหญ่");
  const [notes, setNotes] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [addSubmitToCal, setAddSubmitToCal] = useState(true);
  const [addPayToCal, setAddPayToCal] = useState(true);

  useEffect(() => {
    if (!open) return;
    setStep("select");
    setCustomerId(defaultCustomerId ?? "");
    const init: Record<string, boolean> = {};
    if (defaultInvoiceId) init[defaultInvoiceId] = true;
    setSelected(init);
    setBnNo(nextBnNumber());
    setBnDate(todayIso());
    setSubmitDate(todayIso());
    setExpectDate(addDays(todayIso(), 30));
    setContactName(""); setAddress(""); setTaxId(""); setBranch("สำนักงานใหญ่");
    setNotes(""); setInternalNote("");
    setAddSubmitToCal(true); setAddPayToCal(true);
  }, [open, defaultInvoiceId, defaultCustomerId]);

  // If defaultInvoiceId set, derive customer
  useEffect(() => {
    if (defaultInvoiceId) {
      const inv = poInvoices.find((i) => i.id === defaultInvoiceId);
      if (inv) setCustomerId(inv.customerId);
    }
  }, [defaultInvoiceId]);

  // Apply billing rule defaults when customer changes
  useEffect(() => {
    if (!customerId) return;
    const rule = billingRules[customerId];
    if (rule) {
      setAddress(rule.billingAddress);
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setContactName(cust.contactPerson);
      if (!address) setAddress(cust.address ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const availableInvoices = useMemo(
    () => poInvoices.filter((i) => customerId ? i.customerId === customerId : true),
    [customerId]
  );
  const chosen = availableInvoices.filter((i) => selected[i.id]);
  const total = chosen.reduce((s, i) => s + i.total, 0);
  const rule = billingRules[customerId];

  const goNext = () => {
    if (step === "select") {
      if (!customerId) return toast.error("เลือกลูกค้า");
      if (chosen.length === 0) return toast.error("เลือกอย่างน้อย 1 Invoice");
      setStep("header");
    } else if (step === "header") {
      if (!bnNo.trim()) return toast.error("กรอกเลขที่ใบวางบิล");
      setStep("preview");
    }
  };
  const goBack = () => setStep(step === "preview" ? "header" : "select");

  const submit = () => {
    const bn = createBillingNote({
      number: bnNo, customerId, contactName, billingDate: bnDate, submissionDate: submitDate,
      expectedPaymentDate: expectDate, address, taxId, branch,
      invoiceIds: chosen.map((i) => i.id), notes, internalNote,
    }, user?.name ?? "Demo");
    createRemindersForBn(bn);
    addNotificationsForBn(bn);
    if (addSubmitToCal || addPayToCal) addBnCalendarEvents(bn, { addSubmit: addSubmitToCal, addPayment: addPayToCal });
    audit(user?.name ?? "Demo", "Create Billing Note", `${bn.number} • ${chosen.length} ใบแจ้งหนี้ • ${fmtTHB(bn.total)}`, "Billing Notes");
    toast.success(`สร้างใบวางบิล ${bn.number} แล้ว`, { description: `${chosen.length} ใบแจ้งหนี้ • รวม ${fmtTHB(bn.total)}` });
    onOpenChange(false);
    setTimeout(() => nav(`/billing-notes/${bn.id}`), 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            สร้างใบวางบิลจาก Invoice
            <Badge variant="outline" className="ml-2">{step === "select" ? "1. เลือก Invoice" : step === "header" ? "2. ข้อมูลเอกสาร" : "3. พรีวิว"}</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">ลูกค้า</Label>
              <select className="w-full mt-1 h-9 px-2 rounded-md border bg-background text-sm"
                value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSelected({}); }}>
                <option value="">— เลือกลูกค้า —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-2">เลือก Invoice ที่ต้องการรวมในใบวางบิลนี้</div>
              {availableInvoices.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">ยังไม่มี Invoice สำหรับลูกค้ารายนี้</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="py-1.5 w-8"></th>
                        <th>Invoice No.</th>
                        <th>วันที่</th>
                        <th>ครบกำหนด</th>
                        <th className="text-right">ยอด</th>
                        <th>สถานะวางบิล</th>
                        <th>สถานะชำระ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableInvoices.map((i) => {
                        const inBn = bnsForInvoice(i.id).length > 0;
                        const paid = isInvoicePaid(i.id);
                        return (
                          <tr key={i.id} className="border-b last:border-0">
                            <td>
                              <Checkbox checked={!!selected[i.id]} onCheckedChange={(v) => setSelected({ ...selected, [i.id]: !!v })} disabled={paid} />
                            </td>
                            <td className="font-medium">{i.number}</td>
                            <td>{i.date}</td>
                            <td>{i.dueDate}</td>
                            <td className="text-right">{fmtTHB(i.total)}</td>
                            <td><Badge variant="outline" className={inBn ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-muted text-muted-foreground"}>{inBn ? "มีใบวางบิลแล้ว" : "ยังไม่ได้วางบิล"}</Badge></td>
                            <td><Badge variant="outline" className={paid ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>{paid ? "ชำระแล้ว" : "ยังไม่ชำระ"}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t text-sm">
                <span className="text-muted-foreground">เลือก {chosen.length} ใบ</span>
                <span className="font-semibold">รวม {fmtTHB(total)}</span>
              </div>
            </Card>
          </div>
        )}

        {step === "header" && (
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="เลขที่ใบวางบิล" value={bnNo} onChange={setBnNo} />
            <Field label="วันที่ใบวางบิล" type="date" value={bnDate} onChange={setBnDate} />
            <Field label="วันวางบิล (แก้ไขได้)" type="date" value={submitDate} onChange={setSubmitDate} />
            <Field label="วันคาดว่าจะรับเงิน" type="date" value={expectDate} onChange={setExpectDate} />
            <Field label="ผู้ติดต่อ" value={contactName} onChange={setContactName} />
            <Field label="สาขา" value={branch} onChange={setBranch} />
            <Field label="เลขประจำตัวผู้เสียภาษี" value={taxId} onChange={setTaxId} />
            <Field label="ที่อยู่ออกบิล" value={address} onChange={setAddress} textarea />
            <div className="md:col-span-2">
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">โน้ตภายใน</Label>
              <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
            </div>

            <div className="md:col-span-2">
              {rule ? (
                <Alert className="border-success/40 bg-success/10">
                  <Info className="h-4 w-4 text-success" />
                  <AlertDescription className="text-xs">
                    ใช้กฎวางบิลของลูกค้า: ส่งบิลวันที่ {rule.billingDayStart}-{rule.billingDayEnd} • รับเงินวันที่ {rule.paymentDay} • เครดิต {rule.creditTermDays} วัน • วิธีส่ง {rule.method}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-warning/40 bg-warning-soft">
                  <Info className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-xs">
                    ยังไม่ได้ตั้งค่าระเบียบวางบิลของลูกค้ารายนี้ ระบบจะใช้วันที่ที่เลือกเองในเอกสารนี้
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Card className="md:col-span-2 p-3 bg-secondary/30">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1"><CalendarPlus className="w-3.5 h-3.5" />ปฏิทินธุรกิจ</div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={addSubmitToCal} onCheckedChange={(v) => setAddSubmitToCal(!!v)} />เพิ่มวันวางบิลในปฏิทิน</label>
              <label className="flex items-center gap-2 text-sm mt-1"><Checkbox checked={addPayToCal} onCheckedChange={(v) => setAddPayToCal(!!v)} />เพิ่มวันคาดรับเงินในปฏิทิน</label>
            </Card>

            <Card className="md:col-span-2 p-3">
              <div className="text-xs font-semibold mb-2">รวม {chosen.length} ใบแจ้งหนี้</div>
              {chosen.map((i) => (
                <div key={i.id} className="flex justify-between text-sm border-b last:border-0 py-1">
                  <span>{i.number}</span><span>{fmtTHB(i.total)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 mt-1 border-t">
                <span>รวมยอดวางบิล</span><span className="text-purple-700">{fmtTHB(total)}</span>
              </div>
            </Card>
          </div>
        )}

        {step === "preview" && (
          <div className="grid md:grid-cols-2 gap-3">
            <BnPreview accent="purple" tag="ต้นฉบับ" header={{ bnNo, bnDate, submitDate, expectDate, address, taxId, branch, contactName, notes, customerId }} invoices={chosen} total={total} />
            <BnPreview accent="gray" tag="สำเนา" header={{ bnNo, bnDate, submitDate, expectDate, address, taxId, branch, contactName, notes, customerId }} invoices={chosen} total={total} />
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== "select" && <Button variant="outline" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-1" />ย้อนกลับ</Button>}
          {step !== "preview" ? (
            <Button onClick={goNext}>ถัดไป<ArrowRight className="w-4 h-4 ml-1" /></Button>
          ) : (
            <Button onClick={submit} className="bg-purple-600 hover:bg-purple-700 text-white"><Check className="w-4 h-4 mr-1" />สร้างใบวางบิล</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      )}
    </div>
  );
}

interface PreviewHeader {
  bnNo: string; bnDate: string; submitDate: string; expectDate: string;
  address: string; taxId: string; branch: string; contactName: string; notes: string;
  customerId: string;
}
function BnPreview({ accent, tag, header, invoices, total }: {
  accent: "purple" | "gray";
  tag: string;
  header: PreviewHeader;
  invoices: typeof poInvoices;
  total: number;
}) {
  const cust = customers.find((c) => c.id === header.customerId);
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
          <div className="text-muted-foreground">เลขที่ {header.bnNo} • วันที่ {header.bnDate}</div>
          <div className="text-muted-foreground">วันวางบิล {header.submitDate} • วันคาดรับเงิน {header.expectDate}</div>
        </div>
        <div className="border-t pt-2">
          <div className="font-semibold">วางบิลถึง</div>
          <div>{cust?.name ?? "—"}</div>
          {header.contactName && <div className="text-muted-foreground">ผู้ติดต่อ {header.contactName}</div>}
          <div className="text-muted-foreground">{header.address}</div>
          {header.taxId && <div className="text-muted-foreground">TAX ID {header.taxId} • {header.branch}</div>}
        </div>
        <table className="w-full">
          <thead className="text-left border-b">
            <tr><th className="py-1">เลขที่ใบแจ้งหนี้</th><th>วันที่</th><th>ครบกำหนด</th><th className="text-right">ยอด</th></tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="py-1">{i.number}</td>
                <td>{i.date}</td>
                <td>{i.dueDate}</td>
                <td className="text-right">{fmtTHB(i.total)}</td>
              </tr>
            ))}
            <tr><td colSpan={3} className="py-2 text-right font-semibold">รวมยอดวางบิล</td><td className="py-2 text-right font-bold">{fmtTHB(total)}</td></tr>
          </tbody>
        </table>
        {header.notes && <div className="border-t pt-2 text-muted-foreground"><b>หมายเหตุ:</b> {header.notes}</div>}
        <div className="border-t pt-3 flex justify-between text-[10px] text-muted-foreground">
          <div>ผู้วางบิล: ____________________</div>
          <div>ผู้รับวางบิล: ____________________</div>
        </div>
      </div>
    </div>
  );
}
