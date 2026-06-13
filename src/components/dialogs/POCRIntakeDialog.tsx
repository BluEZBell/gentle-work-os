// Customer PO OCR Intake — mock-only AI-assisted intake.
// 3 steps: Upload → Review (editable + confidence) → Confirm Import.
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customers, contacts, fmtTHB } from "@/lib/mockData";
import { audit } from "@/lib/store";
import {
  generateMockOcr, importCustomerPo, CONFIDENCE_TH, type OcrConfidence,
} from "@/lib/customerPoStore";
import { ShieldAlert, Upload, FileText, ScanLine, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "review";

interface ReviewItem {
  itemNumber: string; description: string; deliveryDate: string;
  quantity: string; unit: string; unitPrice: string; amount: string;
  confidence: { itemNumber: OcrConfidence; description: OcrConfidence; deliveryDate: OcrConfidence;
    quantity: OcrConfidence; unit: OcrConfidence; unitPrice: OcrConfidence; amount: OcrConfidence };
}

interface ReviewHeader {
  poNumber: string; poDate: string; deliveryDate: string; currency: string; notes: string;
  confidence: { poNumber: OcrConfidence; poDate: OcrConfidence; deliveryDate: OcrConfidence;
    currency: OcrConfidence; notes: OcrConfidence };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
}

const confClass = (c: OcrConfidence) =>
  c === "verified" ? "bg-success/15 text-success border-success/30"
  : c === "review" ? "bg-warning-soft text-warning-foreground border-warning/40"
  : "bg-destructive/15 text-destructive border-destructive/40";

function ConfBadge({ c }: { c: OcrConfidence }) {
  return <Badge variant="outline" className={"text-[10px] font-normal " + confClass(c)}>{CONFIDENCE_TH[c]}</Badge>;
}

export function POCRIntakeDialog({ open, onOpenChange, defaultCustomerId }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [customerId, setCustomerId] = useState<string>(defaultCustomerId ?? "");
  const [contactId, setContactId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [uploadNote, setUploadNote] = useState<string>("");
  const [header, setHeader] = useState<ReviewHeader | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (open) {
      setStep("upload");
      setCustomerId(defaultCustomerId ?? "");
      setContactId("");
      setFileName("");
      setUploadNote("");
      setHeader(null);
      setItems([]);
    }
  }, [open, defaultCustomerId]);

  const customerContacts = useMemo(() => contacts.filter((c) => c.customerId === customerId), [customerId]);

  const onPickFile = (f?: File | null) => {
    if (!f) return;
    setFileName(f.name);
  };

  const startOcr = () => {
    if (!customerId) { toast.error("กรุณาเลือกลูกค้าก่อน"); return; }
    if (!fileName) { toast.error("กรุณาเลือกไฟล์ PO ก่อน"); return; }
    const r = generateMockOcr(fileName);
    setHeader({
      poNumber: r.poNumber.value, poDate: r.poDate.value, deliveryDate: r.deliveryDate.value,
      currency: r.currency.value, notes: r.notes.value,
      confidence: {
        poNumber: r.poNumber.confidence, poDate: r.poDate.confidence,
        deliveryDate: r.deliveryDate.confidence, currency: r.currency.confidence, notes: r.notes.confidence,
      },
    });
    setItems(r.items.map((it) => ({
      itemNumber: it.itemNumber.value, description: it.description.value, deliveryDate: it.deliveryDate.value,
      quantity: String(it.quantity.value), unit: it.unit.value, unitPrice: String(it.unitPrice.value),
      amount: String(it.amount.value),
      confidence: {
        itemNumber: it.itemNumber.confidence, description: it.description.confidence,
        deliveryDate: it.deliveryDate.confidence, quantity: it.quantity.confidence,
        unit: it.unit.confidence, unitPrice: it.unitPrice.confidence, amount: it.amount.confidence,
      },
    })));
    setStep("review");
    toast.success("อ่านเอกสาร PO เรียบร้อย (เดโม) — กรุณาตรวจสอบก่อนนำเข้า");
  };

  const updateItem = (idx: number, patch: Partial<ReviewItem>) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      // Auto-recalc amount when qty/price changes
      if (patch.quantity !== undefined || patch.unitPrice !== undefined) {
        const q = Number(next.quantity), p = Number(next.unitPrice);
        if (!Number.isNaN(q) && !Number.isNaN(p)) next.amount = String(q * p);
      }
      return next;
    }));
  };

  const addRow = () => setItems((prev) => [...prev, {
    itemNumber: "", description: "", deliveryDate: header?.deliveryDate ?? "",
    quantity: "1", unit: "pcs", unitPrice: "0", amount: "0",
    confidence: { itemNumber: "uncertain", description: "uncertain", deliveryDate: "uncertain",
      quantity: "uncertain", unit: "uncertain", unitPrice: "uncertain", amount: "uncertain" },
  }]);
  const removeRow = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = (): string | null => {
    if (!header) return "ยังไม่มีข้อมูล OCR";
    if (!header.poNumber.trim()) return "กรุณากรอกเลขที่ PO";
    if (items.length === 0) return "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.deliveryDate) return `รายการที่ ${i + 1}: ต้องระบุวันส่ง`;
      if (Number.isNaN(Number(it.quantity)) || !it.quantity) return `รายการที่ ${i + 1}: จำนวนต้องเป็นตัวเลข`;
      if (Number.isNaN(Number(it.unitPrice))) return `รายการที่ ${i + 1}: ราคาต่อหน่วยต้องเป็นตัวเลข`;
      if (Number.isNaN(Number(it.amount))) return `รายการที่ ${i + 1}: ยอดรวมต้องเป็นตัวเลข`;
    }
    return null;
  };

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const confirmImport = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!header) return;
    const ct = contacts.find((c) => c.id === contactId);
    const po = importCustomerPo({
      customerId, contactId: ct?.id, contactName: ct?.name,
      fileName: fileName || undefined, notes: uploadNote || header.notes,
      poNumber: header.poNumber, poDate: header.poDate, deliveryDate: header.deliveryDate,
      currency: header.currency,
      items: items.map((it) => ({
        itemNumber: it.itemNumber, description: it.description, deliveryDate: it.deliveryDate,
        quantity: Number(it.quantity), unit: it.unit,
        unitPrice: Number(it.unitPrice), amount: Number(it.amount),
      })),
    }, "Khun Ploy");
    try {
      audit("Customer PO", po.id, "Imported from OCR",
        `${po.number} — ${items.length} รายการ • ${fmtTHB(total)}`, "Khun Ploy");
    } catch { /* non-blocking */ }
    toast.success("นำเข้า PO ลูกค้าเรียบร้อยแล้ว");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            สแกน / นำเข้า PO ลูกค้า {step === "review" && <span className="text-xs font-normal text-muted-foreground">— ขั้นตอน 2/2 ตรวจสอบและแก้ไข</span>}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Alert className="border-warning/40 bg-warning-soft">
              <ShieldAlert className="h-4 w-4 text-warning-foreground" />
              <AlertTitle className="text-warning-foreground">โหมดเดโม — OCR จำลอง</AlertTitle>
              <AlertDescription className="text-warning-foreground/80 text-xs">
                ระบบจะอ่านข้อมูลจากเอกสารและแสดงผลให้ตรวจสอบ ผู้ใช้ต้องยืนยันก่อนบันทึกทุกครั้ง
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>ลูกค้า *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="เลือกลูกค้า" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>ผู้ติดต่อ</Label>
                <Select value={contactId || "_none"} onValueChange={(v) => setContactId(v === "_none" ? "" : v)} disabled={!customerId}>
                  <SelectTrigger><SelectValue placeholder={customerId ? "เลือกผู้ติดต่อ" : "เลือกลูกค้าก่อน"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— ไม่ระบุ —</SelectItem>
                    {customerContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} {c.isPoApprover ? "(PO Approver)" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>ไฟล์เอกสาร PO (PDF / รูปภาพ)</Label>
              <label className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-secondary/40 transition cursor-pointer block">
                <input type="file" accept=".pdf,image/*" className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])} />
                <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm font-medium">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</div>
                <div className="text-xs text-muted-foreground mt-1">รองรับ PDF, JPG, PNG</div>
                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded text-xs">
                    <FileText className="w-3.5 h-3.5" /> {fileName}
                  </div>
                )}
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>โหมด OCR</Label>
                <Select value="mock" disabled><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="mock">Mock OCR (เดโม)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>หมายเหตุ</Label>
                <Input value={uploadNote} onChange={(e) => setUploadNote(e.target.value)} placeholder="เช่น PO รอบที่ 2 ของเดือน" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
              <Button onClick={startOcr}><ScanLine className="w-4 h-4 mr-1" />เริ่มอ่านเอกสาร PO</Button>
            </DialogFooter>
          </div>
        )}

        {step === "review" && header && (
          <div className="space-y-4">
            <Alert className="border-warning/40 bg-warning-soft">
              <ShieldAlert className="h-4 w-4 text-warning-foreground" />
              <AlertDescription className="text-warning-foreground/90 text-xs">
                กรุณาตรวจสอบข้อมูลจากเอกสารต้นฉบับก่อนนำเข้า ระบบ OCR อาจอ่านผิดได้
              </AlertDescription>
            </Alert>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Original preview placeholder */}
              <Card className="card-soft p-4">
                <div className="text-xs text-muted-foreground mb-2">ต้นฉบับ PO</div>
                <div className="border rounded bg-secondary/30 aspect-[3/4] flex flex-col items-center justify-center text-muted-foreground text-sm">
                  <FileText className="w-12 h-12 mb-2" />
                  <div className="font-medium">{fileName || "PO document"}</div>
                  <div className="text-xs mt-1">ตัวอย่างเอกสาร (เดโม)</div>
                </div>
              </Card>

              {/* Extracted header */}
              <Card className="card-soft p-4 space-y-3">
                <div className="text-sm font-semibold">ข้อมูลที่ระบบอ่านได้ — แก้ไขได้</div>
                <Field label="เลขที่ PO *" conf={header.confidence.poNumber}>
                  <Input value={header.poNumber} onChange={(e) => setHeader({ ...header, poNumber: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="วันที่ PO" conf={header.confidence.poDate}>
                    <Input type="date" value={header.poDate} onChange={(e) => setHeader({ ...header, poDate: e.target.value })} />
                  </Field>
                  <Field label="วันส่งของ" conf={header.confidence.deliveryDate}>
                    <Input type="date" value={header.deliveryDate} onChange={(e) => setHeader({ ...header, deliveryDate: e.target.value })} />
                  </Field>
                </div>
                <Field label="สกุลเงิน" conf={header.confidence.currency}>
                  <Input value={header.currency} onChange={(e) => setHeader({ ...header, currency: e.target.value })} />
                </Field>
                <Field label="หมายเหตุ" conf={header.confidence.notes}>
                  <Textarea rows={2} value={header.notes} onChange={(e) => setHeader({ ...header, notes: e.target.value })} />
                </Field>
              </Card>
            </div>

            {/* Items */}
            <Card className="card-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">รายการสินค้าที่อ่านได้ ({items.length})</div>
                <Button size="sm" variant="outline" onClick={addRow}><Plus className="w-4 h-4 mr-1" />เพิ่มรายการ</Button>
              </div>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-secondary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">รายการที่ {idx + 1}</div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeRow(idx)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <SmallField label="Item No." conf={it.confidence.itemNumber}>
                        <Input value={it.itemNumber} onChange={(e) => updateItem(idx, { itemNumber: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="คำอธิบาย" conf={it.confidence.description} className="md:col-span-2">
                        <Input value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="วันส่ง" conf={it.confidence.deliveryDate}>
                        <Input type="date" value={it.deliveryDate} onChange={(e) => updateItem(idx, { deliveryDate: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="จำนวน" conf={it.confidence.quantity}>
                        <Input value={it.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="หน่วย" conf={it.confidence.unit}>
                        <Input value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="ราคา/หน่วย" conf={it.confidence.unitPrice}>
                        <Input value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} className="h-8" />
                      </SmallField>
                      <SmallField label="ยอดรวม" conf={it.confidence.amount} className="md:col-span-2">
                        <Input value={it.amount} onChange={(e) => updateItem(idx, { amount: e.target.value })} className="h-8" />
                      </SmallField>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-end text-sm">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">ยอดรวมทั้ง PO</div>
                  <div className="text-lg font-semibold">{fmtTHB(total)}</div>
                </div>
              </div>
            </Card>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>ย้อนกลับ</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
              <Button onClick={confirmImport}><Check className="w-4 h-4 mr-1" />ยืนยันนำเข้า PO</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, conf, children }: { label: string; conf: OcrConfidence; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <ConfBadge c={conf} />
      </div>
      {children}
    </div>
  );
}
function SmallField({ label, conf, children, className }: { label: string; conf: OcrConfidence; children: React.ReactNode; className?: string }) {
  return (
    <div className={"grid gap-1 " + (className ?? "")}>
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
        <ConfBadge c={conf} />
      </div>
      {children}
    </div>
  );
}
