// Add Activity dialog for customer or contact. Optionally creates calendar event.
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { customers, contacts, findCustomer } from "@/lib/mockData";
import { activities } from "@/lib/mockBusiness";
import { calendarEvents, type CalendarEvent } from "@/lib/mockCalendar";
import { audit } from "@/lib/store";
import { toast } from "sonner";

const TYPES = [
  "โทร", "Line", "Email", "นัดคุยออนไลน์", "นัดเข้าพบลูกค้า",
  "Onsite", "ส่งเอกสาร", "รับเอกสาร", "Follow-up", "Note", "อื่น ๆ",
] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
  defaultContactId?: string;
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export function AddActivityDialog({ open, onOpenChange, defaultCustomerId, defaultContactId }: Props) {
  const [type, setType] = useState<string>(TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? customers[0]?.id ?? "");
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [note, setNote] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [addCal, setAddCal] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomerId(defaultCustomerId ?? customers[0]?.id ?? "");
      setContactId(defaultContactId ?? "");
      setType(TYPES[0]); setCustomType(""); setNote(""); setNextFollowUp(""); setAddCal(false);
    }
  }, [open, defaultCustomerId, defaultContactId]);

  const custContacts = contacts.filter((c) => c.customerId === customerId);
  const finalType = type === "อื่น ๆ" ? (customType.trim() || "อื่น ๆ") : type;

  const submit = () => {
    if (!note.trim()) { toast.error("กรุณาใส่รายละเอียดกิจกรรม"); return; }
    activities.unshift({
      id: uid("ac"), date, type: finalType as never, user: "Khun Ploy",
      customerId, note: note.trim(), nextFollowUp: nextFollowUp || undefined,
    });
    audit("Khun Ploy", "Add Activity", `${finalType} • ${findCustomer(customerId)?.name ?? customerId}`, "Customers");
    if (addCal) {
      const ev: CalendarEvent = {
        id: uid("ev"), date, time, type: "Customer Follow-up", customerId,
        title: `🤖 ${finalType} — ${findCustomer(customerId)?.name ?? ""}`,
        notes: note, syncStatus: "Skipped",
      };
      calendarEvents.unshift(ev);
    }
    toast.success("บันทึกกิจกรรมแล้ว");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>เพิ่มกิจกรรม</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ประเภทกิจกรรม</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {type === "อื่น ๆ" && <Input className="mt-1" placeholder="ระบุ…" value={customType} onChange={(e) => setCustomType(e.target.value)} />}
            </div>
            <div className="grid gap-1.5"><Label>ลูกค้า</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5"><Label>ผู้ติดต่อ</Label>
            <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {custContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5"><Label>วันที่</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>เวลา</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>นัดติดตามครั้งถัดไป</Label><Input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>รายละเอียด / Note</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm rounded-md border p-3 bg-secondary/30">
            <Checkbox checked={addCal} onCheckedChange={(v) => setAddCal(!!v)} />
            เพิ่มลงปฏิทินด้วย
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
