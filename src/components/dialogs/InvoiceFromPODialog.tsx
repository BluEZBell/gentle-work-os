// Phase 3B — Create Invoice from selected Customer PO item rows (mock prototype).
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { customers, contacts, fmtTHB } from "@/lib/mockData";
import { audit } from "@/lib/store";
import {
  customerPosFor, itemsForPo, findCustomerPo,
  createPoInvoice, nextInvoiceNumber, INVOICE_STATUS_TH,
  type PoInvoiceStatus,
} from "@/lib/customerPoStore";
import { Receipt, Info, FileText, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

type Step = "select" | "header" | "preview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
  defaultPoId?: string;
}

const PAYMENT_TERMS = ["เก็บเงินสด", "เครดิต 7 วัน", "เครดิต 15 วัน", "เครดิต 30 วัน", "เครดิต 45 วัน", "เครดิต 60 วัน"];
const BILLING_ROUNDS = ["วางบิลทุกวันที่ 25", "วางบิลสิ้นเดือน", "วางบิลทันทีหลังส่งของ", "ตามข้อตกลงเฉพาะลูกค้า"];

function statusTone(s: PoInvoiceStatus) {
  return s === "full" ? "success" : s === "partial" ? "warning" : "muted";
}

export function InvoiceFromPODialog({ open, onOpenChange, defaultCustomerId, defaultPoId }: Props) {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("select");
  const [customerId, setCustomerId] = useState<string>(defaultCustomerId ?? "");
  const [poId, setPoId] = useState<string>(defaultPoId ?? "");
  const [qtys, setQtys] = useState<Record<string, string>>({}); // poItemId -> qty to invoice
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Header
  const [invNo, setInvNo] = useState("");
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [paymentTerm, setPaymentTerm] = useState(PAYMENT_TERMS[3]);
  const [billingRound, setBillingRound] = useState(BILLING_ROUNDS[0]);
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branch, setBranch] = useState("สำนักงานใหญ่");
  const [notes, setNotes] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [discount, setDiscount] = useState("0");
  const [vatRate, setVatRate] = useState("7");
  const [whtRate, setWhtRate] = useState("0");
  const [customerCopies, setCustomerCopies] = useState("2");
  const [internalCopies, setInternalCopies] = useState("3");

  useEffect(() => {
    if (!open) return;
    setStep("select");
    setCustomerId(defaultCustomerId ?? "");
    setPoId(defaultPoId ?? "");
    setQtys({}); setSelected({});
    setInvNo(nextInvoiceNumber());
    setInvDate(new Date().toISOString().slice(0, 10));
    const d = new Date(); d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().slice(0, 10));
    setContactId("");
    setNotes(""); setInternalNote("");
    setDiscount("0"); setVatRate("7"); setWhtRate("0");
    setCustomerCopies("2"); setInternalCopies("3");
  }, [open, defaultCustomerId, defaultPoId]);

  // When PO chosen, pre-fill customer + address from selected po
  useEffect(() => {
    const po = poId ? findCustomerPo(poId) : undefined;
    if (po) {
      setCustomerId(po.customerId);
      if (po.contactId) setContactId(po.contactId);
      const c = customers.find((x) => x.id === po.customerId);
      if (c) { setAddress(c.address || ""); setTaxId((c as { taxId?: string }).taxId || ""); }
    }
  }, [poId]);

  const customerPos = useMemo(() => customerId ? customerPosFor(customerId) : [], [customerId]);
  const po = poId ? findCustomerPo(poId) : undefined;
  const items = poId ? itemsForPo(poId) : [];
  const customerContacts = useMemo(() => contacts.filter((c) => c.customerId === customerId), [customerId]);

  const toggleItem = (poItemId: string, remaining: number) => {
    setSelected((p) => {
      const next = { ...p, [poItemId]: !p[poItemId] };
      if (next[poItemId] && !qtys[poItemId]) {
        setQtys((q) => ({ ...q, [poItemId]: String(remaining) }));
      }
      return next;
    });
  };
  const setQty = (poItemId: string, raw: string, remaining: number) => {
    const n = Math.max(0, Math.min(Number(raw) || 0, remaining));
    setQtys((p) => ({ ...p, [poItemId]: String(n) }));
  };

  const selectedLines = items
    .filter((it) => selected[it.poItemId])
    .map((it) => ({ ...it, qtyToInvoice: Number(qtys[it.poItemId] ?? it.remainingQuantity) }))
    .filter((l) => l.qtyToInvoice > 0);

  const subtotal = selectedLines.reduce((s, l) => s + l.qtyToInvoice * l.unitPrice, 0);
  const base = Math.max(0, subtotal - (Number(discount) || 0));
  const vat = +(base * ((Number(vatRate) || 0) / 100)).toFixed(2);
  const wht = +(base * ((Number(whtRate) || 0) / 100)).toFixed(2);
  const total = +(base + vat - wht).toFixed(2);

  const goHeader = () => {
    if (!po) { toast.error("กรุณาเลือก Customer PO"); return; }
    if (selectedLines.length === 0) { toast.error("กรุณาเลือกอย่างน้อย 1 รายการ"); return; }
    setStep("header");
  };

  const goPreview = () => {
    if (!invNo.trim()) { toast.error("กรุณากรอกเลขที่ Invoice"); return; }
    if (!invDate || !dueDate) { toast.error("กรุณากรอกวันที่และวันครบกำหนด"); return; }
    setStep("preview");
  };

  const create = () => {
    if (!po) return;
    const inv = createPoInvoice({
      customerId, customerPoId: po.id,
      contactId: contactId || undefined,
      contactName: contacts.find((c) => c.id === contactId)?.name,
      number: invNo, date: invDate, dueDate, paymentTerm, billingRound,
      address, taxId, branch, notes, internalNote,
      discount: Number(discount) || 0, vatRate: Number(vatRate) || 0, whtRate: Number(whtRate) || 0,
      customerCopies: Number(customerCopies) || 1, internalCopies: Number(internalCopies) || 1,
      lines: selectedLines.map((l) => ({ poItemId: l.poItemId, quantity: l.qtyToInvoice })),
    }, "Khun Ploy");
    try {
      audit("Khun Ploy", "Create Invoice from Customer PO",
        `${inv.number} ← ${po.number} • ${selectedLines.length} รายการ • ${fmtTHB(total)}`, "Customer PO");
    } catch { /* non-blocking */ }
    toast.success("สร้าง Invoice จากรายการ PO เรียบร้อยแล้ว");
    onOpenChange(false);
    setTimeout(() => nav(`/po-invoices/${inv.id}`), 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            เตรียมออก Invoice จากรายการ PO
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ขั้นตอน {step === "select" ? "1" : step === "header" ? "2" : "3"}/3
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — SELECT */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>ลูกค้า *</Label>
                <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPoId(""); }}>
                  <SelectTrigger><SelectValue placeholder="เลือกลูกค้า" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Customer PO No. *</Label>
                <Select value={poId} onValueChange={setPoId} disabled={!customerId}>
                  <SelectTrigger><SelectValue placeholder={customerId ? "เลือก PO" : "เลือกลูกค้าก่อน"} /></SelectTrigger>
                  <SelectContent>
                    {customerPos.length === 0 ? <SelectItem value="_none" disabled>ลูกค้านี้ยังไม่มี PO นำเข้า</SelectItem>
                      : customerPos.map((p) => <SelectItem key={p.id} value={p.id}>{p.number} • {fmtTHB(p.total)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>ผู้ติดต่อ</Label>
                <Select value={contactId || "_none"} onValueChange={(v) => setContactId(v === "_none" ? "" : v)} disabled={!customerId}>
                  <SelectTrigger><SelectValue placeholder="เลือกผู้ติดต่อ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— ไม่ระบุ —</SelectItem>
                    {customerContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {po && (
              <Card className="card-soft p-3 bg-secondary/30 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><div className="text-muted-foreground">PO No.</div><div className="font-medium">{po.number}</div></div>
                <div><div className="text-muted-foreground">PO Date</div><div className="font-medium">{po.poDate}</div></div>
                <div><div className="text-muted-foreground">วันส่ง</div><div className="font-medium">{po.deliveryDate}</div></div>
                <div><div className="text-muted-foreground">ยอด PO</div><div className="font-medium">{fmtTHB(po.total)}</div></div>
              </Card>
            )}

            {po && (
              <Card className="card-soft p-4">
                <div className="text-sm font-semibold mb-3">เลือกรายการที่ต้องการออก Invoice</div>
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground">PO นี้ไม่มีรายการสินค้า</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((it) => {
                      const isSel = !!selected[it.poItemId];
                      const qty = qtys[it.poItemId] ?? String(it.remainingQuantity);
                      const disabled = it.remainingQuantity <= 0;
                      return (
                        <div key={it.poItemId} className={"border rounded-lg p-3 " + (isSel ? "bg-primary/5 border-primary/30" : "bg-secondary/10")}>
                          <div className="flex items-start gap-3">
                            <Checkbox checked={isSel} disabled={disabled}
                              onCheckedChange={() => toggleItem(it.poItemId, it.remainingQuantity)} className="mt-1" />
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 flex-1 text-xs">
                              <Mini label="Item No." value={it.itemNumber} />
                              <Mini label="คำอธิบาย" value={it.description} className="md:col-span-2" />
                              <Mini label="วันส่ง" value={it.deliveryDate} />
                              <Mini label="PO Qty" value={`${it.quantity} ${it.unit}`} />
                              <Mini label="ออกแล้ว" value={`${it.invoicedQuantity}`} />
                              <Mini label="คงเหลือ" value={`${it.remainingQuantity}`} highlight={it.remainingQuantity > 0 ? "ok" : undefined} />
                              <div className="md:col-span-2">
                                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">จำนวนที่จะออก Invoice</Label>
                                <Input value={qty} disabled={!isSel || disabled} className="h-8 mt-1"
                                  onChange={(e) => setQty(it.poItemId, e.target.value, it.remainingQuantity)} />
                              </div>
                              <Mini label="ราคา/หน่วย" value={fmtTHB(it.unitPrice)} />
                              <Mini label="ยอดรวม" value={fmtTHB(it.unitPrice * (Number(qty) || 0))} highlight={isSel ? "ok" : undefined} />
                              <div className="md:col-span-2 flex items-end">
                                <Badge variant="outline" className={
                                  "text-[10px] " + (statusTone(it.invoiceStatus) === "success" ? "bg-success/15 text-success border-success/30"
                                    : statusTone(it.invoiceStatus) === "warning" ? "bg-warning-soft text-warning-foreground border-warning/40"
                                    : "bg-muted text-muted-foreground")}>
                                  {INVOICE_STATUS_TH[it.invoiceStatus]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t flex justify-end text-sm">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">ยอดรวมก่อน VAT</div>
                    <div className="text-lg font-semibold">{fmtTHB(subtotal)}</div>
                  </div>
                </div>
              </Card>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
              <Button onClick={goHeader}>ถัดไป <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2 — HEADER */}
        {step === "header" && po && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="card-soft p-4 space-y-3">
                <div className="text-sm font-semibold">ข้อมูล Invoice</div>
                <div className="grid grid-cols-2 gap-3">
                  <Tiny label="Invoice No. *"><Input value={invNo} onChange={(e) => setInvNo(e.target.value)} /></Tiny>
                  <Tiny label="วันที่ออก"><Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} /></Tiny>
                  <Tiny label="เงื่อนไขการชำระ">
                    <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Tiny>
                  <Tiny label="วันครบกำหนด"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Tiny>
                  <Tiny label="รอบวางบิล" className="col-span-2">
                    <Select value={billingRound} onValueChange={setBillingRound}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BILLING_ROUNDS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Tiny>
                </div>
              </Card>

              <Card className="card-soft p-4 space-y-3">
                <div className="text-sm font-semibold">ลูกค้า / ที่อยู่</div>
                <div className="text-xs text-muted-foreground">
                  อ้างอิง PO <span className="text-primary font-medium">{po.number}</span>
                  {" "}• ลูกค้า <span className="font-medium">{customers.find((c) => c.id === customerId)?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Tiny label="เลขผู้เสียภาษี"><Input value={taxId} onChange={(e) => setTaxId(e.target.value)} /></Tiny>
                  <Tiny label="สาขา"><Input value={branch} onChange={(e) => setBranch(e.target.value)} /></Tiny>
                  <Tiny label="ที่อยู่" className="col-span-2"><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></Tiny>
                </div>
              </Card>
            </div>

            <Card className="card-soft p-4 space-y-3">
              <div className="text-sm font-semibold">รายการที่จะออก Invoice ({selectedLines.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-1.5">Item No.</th><th>คำอธิบาย</th><th className="text-right">จำนวน</th><th>หน่วย</th><th className="text-right">ราคา/หน่วย</th><th className="text-right">ยอดรวม</th></tr>
                  </thead>
                  <tbody>
                    {selectedLines.map((l) => (
                      <tr key={l.poItemId} className="border-b last:border-0">
                        <td className="py-1.5">{l.itemNumber}</td><td>{l.description}</td>
                        <td className="text-right">{l.qtyToInvoice}</td><td>{l.unit}</td>
                        <td className="text-right">{fmtTHB(l.unitPrice)}</td>
                        <td className="text-right font-medium">{fmtTHB(l.qtyToInvoice * l.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Tiny label="หมายเหตุ (แสดงบนใบ)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Tiny>
                  <Tiny label="Internal Note (ภายใน)"><Textarea rows={2} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} /></Tiny>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Tiny label="ส่วนลด (฿)"><Input value={discount} onChange={(e) => setDiscount(e.target.value)} /></Tiny>
                    <Tiny label="VAT %"><Input value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></Tiny>
                    <Tiny label="หัก ณ ที่จ่าย %"><Input value={whtRate} onChange={(e) => setWhtRate(e.target.value)} /></Tiny>
                  </div>
                  <div className="rounded border bg-secondary/30 p-3 text-sm space-y-1">
                    <Row label="Subtotal" value={fmtTHB(subtotal)} />
                    <Row label="หัก ส่วนลด" value={`- ${fmtTHB(Number(discount) || 0)}`} />
                    <Row label={`VAT ${vatRate}%`} value={fmtTHB(vat)} />
                    {Number(whtRate) > 0 && <Row label={`หัก ณ ที่จ่าย ${whtRate}%`} value={`- ${fmtTHB(wht)}`} />}
                    <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-base">
                      <span>Grand Total</span><span>{fmtTHB(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="card-soft p-4 space-y-3">
              <div className="text-sm font-semibold">ตั้งค่าต้นฉบับ / สำเนา</div>
              <Alert className="border-info/40 bg-info-soft py-2">
                <Info className="h-4 w-4 text-info" />
                <AlertDescription className="text-info/90 text-xs">
                  ต้นฉบับ 1 ชุด สีเขียว • สำเนาสีเทา — ค่าเริ่มต้น: ลูกค้า 2 ชุด, เก็บภายใน 3 ชุด
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-3">
                <Tiny label="จำนวนสำเนาสำหรับลูกค้า"><Input type="number" min="1" value={customerCopies} onChange={(e) => setCustomerCopies(e.target.value)} /></Tiny>
                <Tiny label="จำนวนสำเนาเก็บภายใน"><Input type="number" min="1" value={internalCopies} onChange={(e) => setInternalCopies(e.target.value)} /></Tiny>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <Badge className="bg-success/15 text-success border-success/30" variant="outline">ต้นฉบับ</Badge>
                {Array.from({ length: Number(customerCopies) || 0 }).map((_, i) =>
                  <Badge key={"c" + i} variant="outline" className="bg-muted text-muted-foreground">สำเนาลูกค้า {i + 1}</Badge>)}
                {Array.from({ length: Number(internalCopies) || 0 }).map((_, i) =>
                  <Badge key={"i" + i} variant="outline" className="bg-muted text-muted-foreground">สำเนาเก็บภายใน {i + 1}</Badge>)}
              </div>
            </Card>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("select")}><ArrowLeft className="w-4 h-4 mr-1" />ย้อนกลับ</Button>
              <Button onClick={goPreview}>พรีวิว <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3 — PREVIEW + CREATE */}
        {step === "preview" && po && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <PreviewCard kind="original" inv={{ invNo, invDate, dueDate, address, taxId, branch, paymentTerm, total, customerName: customers.find((c) => c.id === customerId)?.name ?? "" }} poNumber={po.number} lines={selectedLines.map((l) => ({ desc: `${l.itemNumber} — ${l.description}`, qty: l.qtyToInvoice, unit: l.unit, price: l.unitPrice, amount: l.qtyToInvoice * l.unitPrice }))} subtotal={subtotal} vat={vat} />
              <PreviewCard kind="copy" inv={{ invNo, invDate, dueDate, address, taxId, branch, paymentTerm, total, customerName: customers.find((c) => c.id === customerId)?.name ?? "" }} poNumber={po.number} lines={selectedLines.map((l) => ({ desc: `${l.itemNumber} — ${l.description}`, qty: l.qtyToInvoice, unit: l.unit, price: l.unitPrice, amount: l.qtyToInvoice * l.unitPrice }))} subtotal={subtotal} vat={vat} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("header")}><ArrowLeft className="w-4 h-4 mr-1" />ย้อนกลับ</Button>
              <Button onClick={create}><Check className="w-4 h-4 mr-1" />สร้าง Invoice</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Mini({ label, value, className, highlight }: { label: string; value: string; className?: string; highlight?: "ok" }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={"text-xs truncate " + (highlight === "ok" ? "font-semibold text-primary" : "font-medium")}>{value}</div>
    </div>
  );
}
function Tiny({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1 " + (className ?? "")}><Label className="text-xs">{label}</Label>{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function PreviewCard({ kind, inv, poNumber, lines, subtotal, vat }: {
  kind: "original" | "copy";
  inv: { invNo: string; invDate: string; dueDate: string; address: string; taxId: string; branch: string; paymentTerm: string; total: number; customerName: string };
  poNumber: string;
  lines: Array<{ desc: string; qty: number; unit: string; price: number; amount: number }>;
  subtotal: number; vat: number;
}) {
  const isOrig = kind === "original";
  return (
    <Card className={"card-soft p-4 relative overflow-hidden " + (isOrig ? "border-success/40" : "border-muted-foreground/30")}>
      <div className={"absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl " + (isOrig ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
        {isOrig ? "ต้นฉบับ" : "สำเนา"}
      </div>
      <div className="flex items-center gap-2 mb-2"><FileText className={"w-4 h-4 " + (isOrig ? "text-success" : "text-muted-foreground")} />
        <div className="font-display font-semibold">ใบแจ้งหนี้ / ใบกำกับภาษี</div></div>
      <div className="text-xs space-y-0.5">
        <div><span className="text-muted-foreground">เลขที่:</span> <span className="font-medium">{inv.invNo}</span></div>
        <div><span className="text-muted-foreground">วันที่:</span> {inv.invDate} • <span className="text-muted-foreground">ครบกำหนด:</span> {inv.dueDate}</div>
        <div><span className="text-muted-foreground">อ้างอิง PO:</span> {poNumber}</div>
        <div className="pt-1"><span className="text-muted-foreground">ลูกค้า:</span> <span className="font-medium">{inv.customerName}</span></div>
        <div className="text-muted-foreground">{inv.address}{inv.taxId ? ` • TAX ID ${inv.taxId}` : ""}{inv.branch ? ` • ${inv.branch}` : ""}</div>
      </div>
      <table className="w-full text-[11px] mt-3 border-t pt-2">
        <thead className="text-left text-muted-foreground"><tr><th>รายการ</th><th className="text-right">จำนวน</th><th className="text-right">ราคา</th><th className="text-right">รวม</th></tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b last:border-0"><td className="py-1">{l.desc}</td><td className="text-right">{l.qty} {l.unit}</td><td className="text-right">{fmtTHB(l.price)}</td><td className="text-right">{fmtTHB(l.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-xs space-y-0.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtTHB(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>{fmtTHB(vat)}</span></div>
        <div className={"flex justify-between font-semibold border-t pt-1 mt-1 " + (isOrig ? "text-success" : "")}>
          <span>Grand Total</span><span>{fmtTHB(inv.total)}</span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">เงื่อนไขชำระ: {inv.paymentTerm}</div>
    </Card>
  );
}
