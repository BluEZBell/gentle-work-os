import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { customers, contacts, deals, quotations } from "@/lib/mockData";
import { purchaseOrders } from "@/lib/mockBusiness";
import { calendarEvents, type CalendarEvent } from "@/lib/mockCalendar";
import { toast } from "sonner";

export const CALENDAR_EVENT_TYPES = [
  "โทรติดตาม",
  "นัดคุยออนไลน์",
  "นัดเข้าพบลูกค้า",
  "Onsite ลูกค้า",
  "นัดสำรวจหน้างาน",
  "นัดรับ Brief / Requirement",
  "ติดตามใบเสนอราคา",
  "ติดตาม PO ลูกค้า",
  "นัดส่งตัวอย่าง / Sample",
  "นัดส่งแบบ / Drawing",
  "นัดส่งงาน",
  "นัดวางบิล",
  "นัดรับเช็ค / รับโอน",
  "นัด Follow-up หลังส่งงาน",
  "นัด Service / Calibration",
  "อื่น ๆ",
];

const SHORT: Record<string, string> = { c1: "SPC", c2: "NAP", c3: "BPE", c4: "KTM", c5: "AMW" };
const shortName = (id?: string) =>
  id ? SHORT[id] ?? customers.find((c) => c.id === id)?.name.split(" ")[0] ?? "" : "";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
  defaultRelated?: { kind: "deal" | "quotation" | "po"; id: string; label: string };
  googleEnabled?: boolean;
}

export function AddToCalendarDialog({ open, onOpenChange, defaultCustomerId, defaultRelated, googleEnabled = false }: Props) {
  const [eventType, setEventType] = useState(CALENDAR_EVENT_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? customers[0]?.id ?? "");
  const [contactId, setContactId] = useState<string>("");
  const [relatedKey, setRelatedKey] = useState<string>(defaultRelated ? `${defaultRelated.kind}:${defaultRelated.id}` : "none");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState("30");
  const [addBiz, setAddBiz] = useState(true);
  const [addGoogle, setAddGoogle] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomerId(defaultCustomerId ?? customers[0]?.id ?? "");
      setRelatedKey(defaultRelated ? `${defaultRelated.kind}:${defaultRelated.id}` : "none");
      setContactId("");
      setTitle("");
      setCustomType("");
    }
  }, [open, defaultCustomerId, defaultRelated]);

  const custContacts = contacts.filter((c) => c.customerId === customerId);
  const custDeals = deals.filter((d) => d.customerId === customerId);
  const custQuots = quotations.filter((q) => q.customerId === customerId);
  const custPOs = purchaseOrders.filter((p) => {
    // PO is linked via job→customer; approximate by checking quote
    return custQuots.some((q) => q.id);
  }).slice(0, 0); // keep empty unless wired

  const finalType = eventType === "อื่น ๆ" ? (customType.trim() || "อื่น ๆ") : eventType;

  const relatedLabel = (() => {
    if (relatedKey === "none") return "";
    const [kind, id] = relatedKey.split(":");
    if (kind === "deal") return deals.find((d) => d.id === id)?.name ?? "";
    if (kind === "quotation") return quotations.find((q) => q.id === id)?.number ?? "";
    if (kind === "po") return purchaseOrders.find((p) => p.id === id)?.number ?? "";
    return "";
  })();

  const generatedTitle = `🤖 ${shortName(customerId)} ${finalType}${relatedLabel ? ` ${relatedLabel}` : ""}`.trim();

  const submit = () => {
    if (!addBiz && !addGoogle) {
      toast.error("เลือกอย่างน้อย 1 ปฏิทิน");
      return;
    }
    const ev: CalendarEvent = {
      id: `ev${Math.random().toString(36).slice(2, 8)}`,
      date,
      time,
      type: "Customer Follow-up",
      customerId,
      title: title.trim() || generatedTitle,
      notes: [notes, location ? `สถานที่: ${location}` : "", `เตือนล่วงหน้า ${reminder} นาที`].filter(Boolean).join(" • "),
      syncStatus: addGoogle ? "Pending" : "Skipped",
    };
    if (addBiz) calendarEvents.unshift(ev);
    toast.success("เพิ่มลงปฏิทินแล้ว", { description: ev.title });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>เพิ่มลงปฏิทิน</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>ประเภทกิจกรรม</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {CALENDAR_EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {eventType === "อื่น ๆ" && (
              <Input placeholder="ระบุประเภทกิจกรรม…" value={customType} onChange={(e) => setCustomType(e.target.value)} />
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>หัวข้อ (ไม่ใส่จะสร้างให้อัตโนมัติ)</Label>
            <Input placeholder={generatedTitle} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>ลูกค้า</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>ผู้ติดต่อ</Label>
              <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {custContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>เกี่ยวข้องกับ Deal / Quotation / PO</Label>
            <Select value={relatedKey} onValueChange={setRelatedKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {custDeals.map((d) => <SelectItem key={d.id} value={`deal:${d.id}`}>Deal: {d.name}</SelectItem>)}
                {custQuots.map((q) => <SelectItem key={q.id} value={`quotation:${q.id}`}>QT: {q.number}</SelectItem>)}
                {custPOs.map((p) => <SelectItem key={p.id} value={`po:${p.id}`}>PO: {p.number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5"><Label>วันที่</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>เวลา</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>เตือน (นาที)</Label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["0", "15", "30", "60", "1440"].map((m) => <SelectItem key={m} value={m}>{m === "1440" ? "1 วัน" : `${m} นาที`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5"><Label>สถานที่</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="เช่น สำนักงานลูกค้า / Zoom" /></div>

          <div className="grid gap-1.5"><Label>โน้ต</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

          <div className="rounded-md border p-3 space-y-2 bg-secondary/30">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={addBiz} onCheckedChange={(v) => setAddBiz(!!v)} />
              เพิ่มลง Business Calendar (mock)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={addGoogle} onCheckedChange={(v) => setAddGoogle(!!v)} disabled={!googleEnabled} />
              เพิ่มลง Google Calendar (mock) {!googleEnabled && <span className="text-xs text-muted-foreground">— ยังไม่ได้เชื่อมต่อ</span>}
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
