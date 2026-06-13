import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import {
  quotations as seed, customers, fmtTHB, quotationTotal, quotationCost, quotationProfit,
  type Quotation,
} from "@/lib/mockData";
import { warehouses } from "@/lib/mockExtended";
import { CustomerLink } from "@/components/CustomerLink";
import { RowActions } from "@/components/RowActions";
import { useTick, audit } from "@/lib/store";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Paperclip, Plus, Printer, FileDown, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ThaiDocLayout } from "@/components/ThaiDocLayouts";
import { LeadTimePlanning } from "@/components/quotation/LeadTimePlanning";
import { GanttPreview } from "@/components/quotation/GanttPreview";
import { getPlan, setPlan as savePlan, validateStages, useLtTick, addPlanToCalendar, type LtStage } from "@/lib/leadTimeStore";
import { Clock, CalendarPlus } from "lucide-react";

export default function Quotations() {
  useTick();
  useLtTick();
  const navigate = useNavigate();
  const [list, setList] = useState<Quotation[]>(seed);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [ganttFor, setGanttFor] = useState<Quotation | null>(null);

  const duplicate = (q: Quotation) => {
    const num = `QT-2026-${String(60 + list.length + 1).padStart(4, "0")}`;
    setList([{ ...q, id: `q-${Date.now()}`, number: num, status: "Draft" }, ...list]);
    audit("Khun Ploy", "Duplicate Quotation", `${num} (Copied from ${q.number})`, "Quotations");
    toast.success(`สร้างสำเนาเป็น ${num}`, { description: `Copied from ${q.number}` });
  };
  const remove = (q: Quotation) => {
    setList(list.filter((x) => x.id !== q.id));
    audit("Khun Ploy", "Delete Quotation", q.number, "Quotations");
  };
  const upsert = (q: Quotation) => {
    if (list.some((x) => x.id === q.id)) {
      setList(list.map((x) => (x.id === q.id ? q : x)));
      toast.success(`บันทึก ${q.number} แล้ว`);
    } else {
      setList([q, ...list]);
      toast.success(`สร้าง ${q.number} แล้ว`);
    }
    setFormOpen(false); setEditing(null);
  };
  const setStatus = (q: Quotation, status: Quotation["status"]) => {
    setList(list.map((x) => (x.id === q.id ? { ...x, status } : x)));
    toast.success(`สถานะ → ${status}`);
  };

  return (
    <>
      <PageHeader title="Quotations" thai="ใบเสนอราคา"
        description="สร้างและติดตามใบเสนอราคา พร้อมดูต้นทุน กำไร และส่งขออนุมัติ"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> สร้างใบเสนอราคา
          </Button>
        }
      />

      <div className="space-y-4">
        {list.map((q) => {
          const total = quotationTotal(q);
          const cost = quotationCost(q);
          const profit = quotationProfit(q);
          const margin = total > 0 ? Math.round((profit / total) * 100) : 0;
          const plan = getPlan(q.id);
          const cust = customers.find((c) => c.id === q.customerId);
          const shortName = (cust?.name ?? "CUST").split(/\s+/)[0].slice(0, 6).toUpperCase();
          const onAddCal = () => {
            if (!plan || plan.stages.length === 0) {
              toast.error("ยังไม่มีแผน Lead Time — เปิดใบเสนอราคาเพื่อสร้างแผน");
              return;
            }
            const evs = addPlanToCalendar(q.id, q.number, shortName);
            audit("Khun Ploy", "Add Lead Time to Calendar", `${q.number} (${evs.length} stages)`, "Quotations");
            toast.success(`เพิ่ม ${evs.length} แผนงานลงปฏิทินแล้ว`);
          };
          return (
            <Card key={q.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="w-4 h-4 text-primary" />
                    <Link to={`/quotations/${q.id}`} className="font-display font-semibold text-primary hover:underline">{q.number}</Link>
                    <StatusBadge status={q.status} />
                    {plan && plan.stages.length > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full border bg-secondary/60 text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Lead Time {plan.stages.length} ขั้น
                        {plan.expectedDelivery ? ` • ส่งมอบ ${plan.expectedDelivery}` : ""}
                      </span>
                    )}
                    {plan?.calendarLinked && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        ✓ ผูกปฏิทินแล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                    <CustomerLink customerId={q.customerId} /> <span>• {q.date} → ใช้ได้ถึง {q.validUntil}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <div className="font-display text-xl font-semibold">{fmtTHB(total)}</div>
                    <div className="text-xs text-success font-medium">+{fmtTHB(profit)} กำไร ({margin}%)</div>
                  </div>
                  <RowActions
                    viewHref={`/quotations/${q.id}`}
                    onEdit={() => { setEditing(q); setFormOpen(true); }}
                    onPrint={() => setPreview(q)}
                    onPdf={() => toast.info(`PDF ${q.number}`)}
                    onDuplicate={() => duplicate(q)}
                    onSubmitApproval={() => setStatus(q, "Sent")}
                    onApprove={() => setStatus(q, "Accepted")}
                    onReject={() => setStatus(q, "Rejected")}
                    onAddToCalendar={onAddCal}
                    onViewLog={() => navigate(`/quotations/${q.id}`)}
                    onDelete={() => remove(q)}
                    relatedWarning="หากใบเสนอราคานี้ผูกกับ Job หรือ Invoice แล้ว ความสัมพันธ์อาจถูกตัด"
                    deleteLabel={`ใบเสนอราคา ${q.number}`}
                    extraMenu={
                      <button
                        onClick={() => toast.info("แปลง Lead Time เป็นแผนงาน Job — เปิดในหน้าใบเสนอราคา")}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                      >→ แปลงเป็นงาน</button>
                    }
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.partName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{it.partNumber}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{fmtTHB(it.sellPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtTHB(it.estimatedCost)}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {fmtTHB((it.sellPrice - it.estimatedCost) * it.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Paperclip className="w-3.5 h-3.5 mr-1" /> แนบไฟล์ (ตัวอย่าง)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <QuotationForm
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={upsert}
        nextNumber={`QT-2026-${String(60 + list.length + 1).padStart(4, "0")}`}
      />

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>พรีวิวใบเสนอราคา {preview?.number}</DialogTitle>
            <DialogDescription>ตัวอย่างก่อนพิมพ์หรือดาวน์โหลด PDF (เดโม)</DialogDescription>
          </DialogHeader>
          {preview && (
            <ThaiDocLayout
              docTypeId="td1"
              number={preview.number}
              leadStages={getPlan(preview.id)?.stages.map((s) => ({ name: s.name, start: s.start, end: s.end }))}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์ (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ItemDraft { id: string; partName: string; partNumber: string; quantity: number; unit: string; sellPrice: number; discount: number; estimatedCost: number; }
interface FormState {
  number: string; date: string; validUntil: string;
  customerId: string; address: string; taxId: string; branch: string;
  contactPerson: string; creditTerm: string; salesperson: string;
  projectName: string; reference: string; warehouseId: string;
  priceIncludesVat: boolean; whtPercent: number;
  items: ItemDraft[];
  customerNotes: string; internalNotes: string;
  leadStages: LtStage[];
}

function QuotationForm({
  open, editing, onClose, onSave, nextNumber,
}: {
  open: boolean; editing: Quotation | null; onClose: () => void;
  onSave: (q: Quotation) => void; nextNumber: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const blank = (): FormState => ({
    number: editing?.number ?? nextNumber,
    date: editing?.date ?? today,
    validUntil: editing?.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    customerId: editing?.customerId ?? customers[0]?.id ?? "",
    address: "456 นิคมอุตสาหกรรมบางปะอิน อยุธยา 13160",
    taxId: "0105560000000",
    branch: "สำนักงานใหญ่",
    contactPerson: "คุณอนันต์",
    creditTerm: "30 วัน",
    salesperson: "คุณพลอย",
    projectName: editing ? `ต่อยอด ${editing.number}` : "Batch ใหม่",
    reference: "",
    warehouseId: warehouses[0]?.id ?? "",
    priceIncludesVat: false,
    whtPercent: 3,
    items: editing?.items.map((it, i) => ({
      id: `it${i}`, partName: it.partName, partNumber: it.partNumber,
      quantity: it.quantity, unit: "ชิ้น", sellPrice: it.sellPrice,
      discount: 0, estimatedCost: it.estimatedCost,
    })) ?? [
      { id: "it1", partName: "", partNumber: "", quantity: 1, unit: "ชิ้น", sellPrice: 0, discount: 0, estimatedCost: 0 },
    ],
    customerNotes: "ราคามีผล 30 วัน • รับประกัน 1 ปี",
    internalNotes: "",
    leadStages: editing ? (getPlan(editing.id)?.stages ?? []) : [],
  });

  const [f, setF] = useState<FormState>(blank);

  // Reset form when dialog opens or when editing record changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setF(blank()); }, [open, editing?.id]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setF({ ...f, [k]: v });
  const updateItem = (i: number, patch: Partial<ItemDraft>) => {
    const items = f.items.slice(); items[i] = { ...items[i], ...patch }; setF({ ...f, items });
  };
  const addItem = () => setF({ ...f, items: [...f.items, { id: `it${Date.now()}`, partName: "", partNumber: "", quantity: 1, unit: "ชิ้น", sellPrice: 0, discount: 0, estimatedCost: 0 }] });
  const removeItem = (i: number) => setF({ ...f, items: f.items.filter((_, idx) => idx !== i) });

  const subtotal = f.items.reduce((s, it) => s + it.quantity * it.sellPrice - it.discount, 0);
  const vat = f.priceIncludesVat ? Math.round(subtotal * 7 / 107) : Math.round(subtotal * 0.07);
  const base = f.priceIncludesVat ? subtotal - vat : subtotal;
  const wht = Math.round(base * f.whtPercent / 100);
  const total = (f.priceIncludesVat ? subtotal : subtotal + vat) - wht;

  const save = (status: Quotation["status"]) => {
    if (f.leadStages.length > 0) {
      const v = validateStages(f.leadStages);
      if (!v.ok) { toast.error(v.errors[0]); return; }
      if (v.warnings.length > 0) toast.warning(v.warnings[0]);
    }
    const id = editing?.id ?? `q-${Date.now()}`;
    const q: Quotation = {
      id, number: f.number, customerId: f.customerId,
      dealId: editing?.dealId ?? "",
      date: f.date, validUntil: f.validUntil, status,
      items: f.items.map((it) => ({
        id: it.id, partName: it.partName || "—", partNumber: it.partNumber || "—",
        quantity: it.quantity, sellPrice: it.sellPrice, estimatedCost: it.estimatedCost,
      })),
    };
    if (f.leadStages.length > 0) {
      savePlan(id, f.leadStages);
      audit("Khun Ploy", "Save Lead Time Plan", `${f.number} (${f.leadStages.length} stages)`, "Quotations");
    }
    onSave(q);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขใบเสนอราคา" : "สร้างใบเสนอราคาใหม่"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลตามแบบฟอร์มไทยมาตรฐาน — ระบบคำนวณ VAT และหัก ณ ที่จ่ายอัตโนมัติ</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="เลขที่เอกสาร"><Input value={f.number} onChange={(e) => setField("number", e.target.value)} /></Field>
          <Field label="วันที่"><Input type="date" value={f.date} onChange={(e) => setField("date", e.target.value)} /></Field>
          <Field label="วันครบกำหนด"><Input type="date" value={f.validUntil} onChange={(e) => setField("validUntil", e.target.value)} /></Field>

          <Field label="ลูกค้า">
            <Select value={f.customerId} onValueChange={(v) => setField("customerId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="ผู้ติดต่อ"><Input value={f.contactPerson} onChange={(e) => setField("contactPerson", e.target.value)} /></Field>
          <Field label="พนักงานขาย"><Input value={f.salesperson} onChange={(e) => setField("salesperson", e.target.value)} /></Field>

          <Field label="ที่อยู่ลูกค้า" full><Input value={f.address} onChange={(e) => setField("address", e.target.value)} /></Field>
          <Field label="เลขประจำตัวผู้เสียภาษี"><Input value={f.taxId} onChange={(e) => setField("taxId", e.target.value)} /></Field>
          <Field label="สาขา"><Input value={f.branch} onChange={(e) => setField("branch", e.target.value)} /></Field>
          <Field label="เครดิตเทอม">
            <Select value={f.creditTerm} onValueChange={(v) => setField("creditTerm", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["เงินสด", "7 วัน", "15 วัน", "30 วัน", "45 วัน", "60 วัน", "90 วัน"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="โปรเจกต์"><Input value={f.projectName} onChange={(e) => setField("projectName", e.target.value)} /></Field>
          <Field label="เลขที่อ้างอิง (RFQ/PO)"><Input value={f.reference} onChange={(e) => setField("reference", e.target.value)} /></Field>
          <Field label="คลังสินค้า">
            <Select value={f.warehouseId} onValueChange={(v) => setField("warehouseId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.thai}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="ราคาสินค้า">
            <Select value={f.priceIncludesVat ? "inc" : "exc"} onValueChange={(v) => setField("priceIncludesVat", v === "inc")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exc">ไม่รวมภาษี (เพิ่ม VAT 7%)</SelectItem>
                <SelectItem value="inc">รวมภาษีแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="หัก ณ ที่จ่าย (%)">
            <Select value={String(f.whtPercent)} onValueChange={(v) => setField("whtPercent", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[0, 1, 3, 5].map((p) => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>

        {/* Items */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-semibold">รายการสินค้า</Label>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มรายการ</Button>
          </div>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Part Name</th>
                  <th className="p-2 text-left">Part Number</th>
                  <th className="p-2 text-right w-16">จำนวน</th>
                  <th className="p-2 text-left w-20">หน่วย</th>
                  <th className="p-2 text-right w-28">ราคา/หน่วย</th>
                  <th className="p-2 text-right w-24">ส่วนลด</th>
                  <th className="p-2 text-right w-28">รวมเงิน</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {f.items.map((it, i) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-1"><Input value={it.partName} onChange={(e) => updateItem(i, { partName: e.target.value })} className="h-8" /></td>
                    <td className="p-1"><Input value={it.partNumber} onChange={(e) => updateItem(i, { partNumber: e.target.value })} className="h-8" /></td>
                    <td className="p-1"><Input type="number" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className="h-8 text-right" /></td>
                    <td className="p-1">
                      <Select value={it.unit} onValueChange={(v) => updateItem(i, { unit: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{["ชิ้น", "กล่อง", "ชุด", "ม.", "กก.", "งาน"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-1"><Input type="number" value={it.sellPrice} onChange={(e) => updateItem(i, { sellPrice: Number(e.target.value) })} className="h-8 text-right" /></td>
                    <td className="p-1"><Input type="number" value={it.discount} onChange={(e) => updateItem(i, { discount: Number(e.target.value) })} className="h-8 text-right" /></td>
                    <td className="p-2 text-right font-medium">{(it.quantity * it.sellPrice - it.discount).toLocaleString()}</td>
                    <td className="p-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(i)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-3">
          <div className="w-72 space-y-1 text-sm border rounded-md p-3 bg-secondary/30">
            <div className="flex justify-between"><span>รวมเงิน</span><span>{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>VAT 7%</span><span>{vat.toLocaleString()}</span></div>
            <div className="flex justify-between text-destructive"><span>หัก ณ ที่จ่าย {f.whtPercent}%</span><span>−{wht.toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>ยอดสุทธิ</span><span>{total.toLocaleString()} ฿</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="หมายเหตุ (แสดงในเอกสาร)" full><Textarea rows={2} value={f.customerNotes} onChange={(e) => setField("customerNotes", e.target.value)} /></Field>
          <Field label="โน้ตภายใน (ไม่แสดงในเอกสาร)" full><Textarea rows={2} value={f.internalNotes} onChange={(e) => setField("internalNotes", e.target.value)} /></Field>
        </div>

        <div className="mt-5 pt-4 border-t">
          <LeadTimePlanning
            value={f.leadStages}
            onChange={(s) => setField("leadStages", s)}
            startHint={f.date}
          />
        </div>


        <div className="flex flex-wrap gap-2 mt-2">
          <Button variant="outline" size="sm"><Paperclip className="w-3.5 h-3.5 mr-1" /> แนบไฟล์</Button>
          <Button variant="outline" size="sm">ลายเซ็นอิเล็กทรอนิกส์</Button>
          <Button variant="outline" size="sm">ตรายางบริษัท</Button>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button variant="outline" onClick={() => save("Draft")}>บันทึก Draft</Button>
          <Button variant="outline" onClick={() => save("Sent")}>ส่งขออนุมัติ</Button>
          <Button onClick={() => save("Accepted")}>อนุมัติและบันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-3" : ""}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
