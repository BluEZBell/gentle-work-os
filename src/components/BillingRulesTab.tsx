import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import {
  billingRules, BillingRule, BILLING_METHODS, REQUIRED_DOCS, RequiredDoc,
  generateBillingEvents, eventTitle, EVENT_TYPE_THAI,
} from "@/lib/mockCalendar";
import { CalendarPlus, FileUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_RULE = (customerId: string): BillingRule => ({
  customerId, billingDayStart: 25, billingDayEnd: 30, paymentDay: 15, creditTermDays: 30,
  moveIfHoliday: true, method: "In person", billingAddress: "",
  accountingContact: "", paymentContact: "",
  requiredDocs: ["Invoice", "Tax Invoice", "Delivery Note"],
  annualNote: "", monthlyNote: "",
});

const PRESETS: Array<{ name: string; rule: Partial<BillingRule> }> = [
  { name: "วางบิลต้นเดือน รับเงินสิ้นเดือน", rule: { billingDayStart: 1, billingDayEnd: 5, paymentDay: 28, creditTermDays: 30 } },
  { name: "วางบิลสิ้นเดือน รับเงินกลางเดือนถัดไป", rule: { billingDayStart: 25, billingDayEnd: 30, paymentDay: 15, creditTermDays: 45 } },
  { name: "เครดิต 60 วัน", rule: { creditTermDays: 60 } },
];

export function BillingRulesTab({ customerId }: { customerId: string }) {
  const [rule, setRule] = useState<BillingRule>(billingRules[customerId] || DEFAULT_RULE(customerId));
  const [generated, setGenerated] = useState<ReturnType<typeof generateBillingEvents>>([]);

  const set = <K extends keyof BillingRule>(k: K, v: BillingRule[K]) => setRule({ ...rule, [k]: v });
  const toggleDoc = (d: RequiredDoc) => {
    set("requiredDocs", rule.requiredDocs.includes(d) ? rule.requiredDocs.filter((x) => x !== d) : [...rule.requiredDocs, d]);
  };
  const applyPreset = (p: Partial<BillingRule>) => { setRule({ ...rule, ...p }); toast.success("ใช้พรีเซ็ตแล้ว"); };

  const save = () => { billingRules[customerId] = rule; toast.success("บันทึกกฎการวางบิลแล้ว"); };
  const generate = () => {
    const evs = generateBillingEvents(rule, 3);
    setGenerated(evs);
    toast.success(`สร้างกิจกรรมในปฏิทิน ${evs.length} รายการ (เดโม)`);
  };

  return (
    <div className="space-y-4">
      <Card className="card-soft p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">พรีเซ็ตที่ใช้บ่อย</span>
          {PRESETS.map((p) => (
            <Button key={p.name} size="sm" variant="outline" onClick={() => applyPreset(p.rule)}>{p.name}</Button>
          ))}
        </div>
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">รอบวางบิลและรับเงิน</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่เริ่มวางบิล"><DayPicker v={rule.billingDayStart} on={(v) => set("billingDayStart", v)} /></Field>
          <Field label="วันที่สิ้นสุดวางบิล"><DayPicker v={rule.billingDayEnd} on={(v) => set("billingDayEnd", v)} /></Field>
          <Field label="วันรับเงิน"><DayPicker v={rule.paymentDay} on={(v) => set("paymentDay", v)} /></Field>
          <Field label="เครดิตเทอม (วัน)">
            <Select value={String(rule.creditTermDays)} onValueChange={(v) => set("creditTermDays", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[7,15,30,45,60,90,120].map((d) => <SelectItem key={d} value={String(d)}>{d} วัน</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Switch checked={rule.moveIfHoliday} onCheckedChange={(v) => set("moveIfHoliday", v)} />
          <Label className="text-sm">ถ้าวันวางบิลตรงวันหยุด เลื่อนเป็นวันทำการถัดไป</Label>
        </div>
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">วิธีและที่อยู่วางบิล</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="ช่องทางวางบิล">
            <Select value={rule.method} onValueChange={(v) => set("method", v as BillingRule["method"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BILLING_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="ที่อยู่วางบิล"><Input value={rule.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} placeholder="ที่อยู่ออกบิล/ส่งเอกสาร" /></Field>
          <Field label="ผู้ติดต่อบัญชี"><Input value={rule.accountingContact} onChange={(e) => set("accountingContact", e.target.value)} placeholder="ชื่อ + เบอร์" /></Field>
          <Field label="ผู้ติดต่อจ่ายเงิน"><Input value={rule.paymentContact} onChange={(e) => set("paymentContact", e.target.value)} placeholder="ชื่อ + เบอร์" /></Field>
        </div>
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">เอกสารที่ลูกค้าต้องการ</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUIRED_DOCS.map((d) => (
            <label key={d} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-accent/30">
              <Checkbox checked={rule.requiredDocs.includes(d)} onCheckedChange={() => toggleDoc(d)} />
              <span className="text-sm">{d}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">หมายเหตุและไฟล์แนบ</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="หมายเหตุประจำเดือน" full><Textarea rows={2} value={rule.monthlyNote} onChange={(e) => set("monthlyNote", e.target.value)} placeholder="เช่น ส่งบิลทุกวันที่ 25-30" /></Field>
          <Field label="หมายเหตุประจำปี" full><Textarea rows={2} value={rule.annualNote} onChange={(e) => set("annualNote", e.target.value)} placeholder="เช่น งดรับเอกสารช่วง 28 ธ.ค.-3 ม.ค." /></Field>
        </div>
        <div className="mt-3">
          <Button variant="outline" size="sm"><FileUp className="w-4 h-4 mr-1" /> แนบไฟล์กฎการวางบิล</Button>
          {rule.attachmentName && <span className="text-xs text-muted-foreground ml-2">{rule.attachmentName}</span>}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save}>บันทึกการตั้งค่า</Button>
        <Button variant="outline" onClick={generate}><CalendarPlus className="w-4 h-4 mr-1" />Generate Billing Calendar</Button>
        <div className="text-xs text-muted-foreground">ระบบจะสร้างกิจกรรมวางบิลและรับเงินอัตโนมัติในปฏิทิน (เดโม)</div>
      </div>

      {generated.length > 0 && (
        <Card className="card-soft p-5">
          <h3 className="font-display text-lg font-semibold mb-3">กิจกรรมที่สร้าง ({generated.length})</h3>
          <div className="space-y-1.5">
            {generated.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                <div>
                  <div className="font-medium">{eventTitle(e)}</div>
                  <div className="text-xs text-muted-foreground">{e.date}</div>
                </div>
                <StatusBadge status={EVENT_TYPE_THAI[e.type]} tone="info" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function DayPicker({ v, on }: { v: number; on: (n: number) => void }) {
  return (
    <Select value={String(v)} onValueChange={(n) => on(Number(n))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-72">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <SelectItem key={d} value={String(d)}>วันที่ {d}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
