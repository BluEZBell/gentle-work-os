import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suppliers, fmtTHB } from "@/lib/mockData";
import {
  createPaymentPlan, defaultWhtRate, getSupplierKind,
} from "@/lib/supplierPaymentStore";
import { toast } from "sonner";
import { Plus, Trash2, Split } from "lucide-react";

interface Props {
  trigger?: React.ReactNode;
  initialSupplierId?: string;
  initialAmount?: number;
  poId?: string;
  billId?: string;
  jobId?: string;
}

const addDays = (d: string, n: number) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

export function PaymentScheduleDialog({ trigger, initialSupplierId, initialAmount, poId, billId, jobId }: Props) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? suppliers[0]?.id ?? "");
  const [total, setTotal] = useState(initialAmount ?? 100000);
  const [whtEnabled, setWhtEnabled] = useState(true);
  const [whtRate, setWhtRate] = useState(3);
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  type Row = { percent: number; billingDueDate: string; paymentDueDate: string };
  const [rows, setRows] = useState<Row[]>([
    { percent: 30, billingDueDate: addDays(today, 5), paymentDueDate: addDays(today, 25) },
    { percent: 40, billingDueDate: addDays(today, 35), paymentDueDate: addDays(today, 55) },
    { percent: 30, billingDueDate: addDays(today, 65), paymentDueDate: addDays(today, 85) },
  ]);

  useEffect(() => {
    if (!supplierId) return;
    const def = defaultWhtRate(supplierId);
    setWhtEnabled(def > 0);
    setWhtRate(def || 3);
  }, [supplierId]);

  const sumPercent = rows.reduce((a, r) => a + (Number(r.percent) || 0), 0);
  const kind = getSupplierKind(supplierId);

  const previewRows = useMemo(() => rows.map((r) => {
    const gross = Math.round(total * (r.percent / 100));
    const wht = whtEnabled ? Math.round(gross * (whtRate / 100)) : 0;
    return { ...r, gross, wht, net: gross - wht };
  }), [rows, total, whtEnabled, whtRate]);

  const autoSplit = () => {
    const n = rows.length || 1;
    const each = Math.floor(10000 / n) / 100;
    const remainder = 100 - each * (n - 1);
    setRows(rows.map((r, i) => ({ ...r, percent: i === n - 1 ? remainder : each })));
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows([...rows, { percent: 0,
      billingDueDate: addDays(last?.billingDueDate ?? today, 30),
      paymentDueDate: addDays(last?.paymentDueDate ?? today, 30) }]);
  };

  const submit = () => {
    if (!supplierId) { toast.error("เลือกคู่ค้า"); return; }
    if (!total || Number(total) <= 0) { toast.error("กรอกยอดรวมก่อนหัก ให้มากกว่า 0"); return; }
    if (Math.round(sumPercent) !== 100) { toast.error("เปอร์เซ็นต์รวมต้องเท่ากับ 100%"); return; }
    if (rows.some((r) => !r.billingDueDate || !r.paymentDueDate)) {
      toast.error("กรอกวันวางบิลและวันจ่ายเงินให้ครบทุกงวด"); return;
    }
    createPaymentPlan({
      supplierId, totalAmount: Number(total), whtEnabled, whtRate: Number(whtRate),
      poId, billId, jobId, notes, rows,
    });
    toast.success("บันทึกแผนการจ่ายเงินแล้ว", {
      description: "เพิ่มลงปฏิทิน และสร้างการแจ้งเตือนวันวางบิล / วันจ่าย",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> สร้างแผนการจ่ายเงิน</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างแผนการจ่ายเงิน (Payment Schedule)</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>คู่ค้า (Supplier / Maker)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} <span className="text-muted-foreground ml-1">({getSupplierKind(s.id)})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">ประเภท: <strong>{kind}</strong>
              {kind !== "Supplier" && " • Maker หัก ณ ที่จ่าย 3% ตามค่าเริ่มต้น"}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>ยอดรวมก่อนหัก (บาท)</Label>
            <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <Label className="m-0">หัก ณ ที่จ่าย</Label>
            <Switch checked={whtEnabled} onCheckedChange={setWhtEnabled} />
          </div>
          <div className="grid gap-1.5">
            <Label>WHT %</Label>
            <Input type="number" value={whtRate} onChange={(e) => setWhtRate(Number(e.target.value))} disabled={!whtEnabled} />
          </div>
          <Button type="button" variant="secondary" onClick={autoSplit}>
            <Split className="w-4 h-4 mr-1" /> แบ่งเท่ากันอัตโนมัติ
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/40 text-xs font-medium">
            <div className="col-span-1">งวด</div>
            <div className="col-span-2">%</div>
            <div className="col-span-2">วันวางบิล</div>
            <div className="col-span-2">วันจ่ายเงิน</div>
            <div className="col-span-2 text-right">ก่อนหัก</div>
            <div className="col-span-1 text-right">WHT</div>
            <div className="col-span-1 text-right">สุทธิ</div>
            <div className="col-span-1"></div>
          </div>
          {previewRows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 border-t items-center text-sm">
              <div className="col-span-1">#{idx + 1}</div>
              <div className="col-span-2">
                <Input type="number" value={rows[idx].percent}
                  onChange={(e) => { const v = Number(e.target.value); setRows(rows.map((row, i) => i === idx ? { ...row, percent: v } : row)); }} />
              </div>
              <div className="col-span-2">
                <Input type="date" value={rows[idx].billingDueDate}
                  onChange={(e) => setRows(rows.map((row, i) => i === idx ? { ...row, billingDueDate: e.target.value } : row))} />
              </div>
              <div className="col-span-2">
                <Input type="date" value={rows[idx].paymentDueDate}
                  onChange={(e) => setRows(rows.map((row, i) => i === idx ? { ...row, paymentDueDate: e.target.value } : row))} />
              </div>
              <div className="col-span-2 text-right">{fmtTHB(r.gross)}</div>
              <div className="col-span-1 text-right text-orange-600">{fmtTHB(r.wht)}</div>
              <div className="col-span-1 text-right font-medium">{fmtTHB(r.net)}</div>
              <div className="col-span-1 text-right">
                <Button size="icon" variant="ghost" onClick={() => setRows(rows.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="px-3 py-2 border-t flex items-center justify-between text-sm">
            <Button size="sm" variant="ghost" onClick={addRow}><Plus className="w-4 h-4 mr-1" /> เพิ่มงวด</Button>
            <div>
              รวม: <strong className={Math.round(sumPercent) === 100 ? "" : "text-destructive"}>{sumPercent}%</strong>
              <span className="mx-2 text-muted-foreground">|</span>
              สุทธิรวม: <strong>{fmtTHB(previewRows.reduce((a, x) => a + x.net, 0))}</strong>
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>หมายเหตุ</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เช่น แบ่ง 3 งวด ตามความคืบหน้างาน" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึกแผนการจ่ายเงิน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
