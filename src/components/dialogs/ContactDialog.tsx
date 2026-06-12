// Add / Edit contact dialog. Real edit, not toast.
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { customers, type Contact, type ContactType, type ContactChannel } from "@/lib/mockData";
import { addContact, updateContact } from "@/lib/store";
import { toast } from "sonner";

const CONTACT_TYPES: { v: ContactType; label: string }[] = [
  { v: "Buyer", label: "ฝ่ายจัดซื้อ" },
  { v: "Engineer", label: "วิศวกร" },
  { v: "Accountant", label: "ฝ่ายบัญชี" },
  { v: "Owner", label: "เจ้าของกิจการ" },
  { v: "Manager", label: "ผู้จัดการ" },
  { v: "Receiver", label: "ผู้รับสินค้า" },
  { v: "Approver", label: "ผู้อนุมัติ PO" },
  { v: "Other", label: "อื่น ๆ" },
];
const CHANNELS: { v: ContactChannel; label: string }[] = [
  { v: "LINE", label: "Line" }, { v: "Phone", label: "โทรศัพท์" },
  { v: "Email", label: "อีเมล" }, { v: "Meeting", label: "นัดเจอ" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact?: Contact;            // if provided → edit
  defaultCustomerId?: string;   // for add
}

export function ContactDialog({ open, onOpenChange, contact, defaultCustomerId }: Props) {
  const isEdit = !!contact;
  const [f, setF] = useState({
    name: "", role: "", department: "", customerId: defaultCustomerId ?? customers[0]?.id ?? "",
    phone: "", email: "", lineId: "", contactType: "Buyer" as ContactType,
    isMain: false, isBilling: false, isDelivery: false, isPoApprover: false,
    preferredChannel: "Phone" as ContactChannel,
    notes: "", internalNote: "",
  });

  useEffect(() => {
    if (!open) return;
    if (contact) {
      setF({
        name: contact.name, role: contact.role, department: contact.department,
        customerId: contact.customerId, phone: contact.phone, email: contact.email,
        lineId: contact.lineId ?? "", contactType: contact.contactType ?? "Buyer",
        isMain: !!contact.isMain, isBilling: !!contact.isBilling,
        isDelivery: !!contact.isDelivery, isPoApprover: !!contact.isPoApprover,
        preferredChannel: contact.preferredChannel ?? "Phone",
        notes: contact.notes ?? "", internalNote: contact.internalNote ?? "",
      });
    } else {
      setF((p) => ({ ...p, customerId: defaultCustomerId ?? customers[0]?.id ?? "" }));
    }
  }, [open, contact, defaultCustomerId]);

  const submit = () => {
    if (!f.name.trim()) { toast.error("กรุณาระบุชื่อผู้ติดต่อ"); return; }
    if (isEdit && contact) {
      updateContact(contact.id, f, "Khun Ploy");
      toast.success("บันทึกข้อมูลผู้ติดต่อแล้ว");
    } else {
      addContact(f, "Khun Ploy");
      toast.success("เพิ่มผู้ติดต่อแล้ว");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? `แก้ไขผู้ติดต่อ — ${contact!.name}` : "เพิ่มผู้ติดต่อ"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ชื่อผู้ติดต่อ *</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>บริษัท / ลูกค้า</Label>
              <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ตำแหน่ง</Label>
              <Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>แผนก</Label>
              <Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5"><Label>เบอร์โทร</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>อีเมล</Label>
              <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Line ID</Label>
              <Input value={f.lineId} onChange={(e) => setF({ ...f, lineId: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ประเภทผู้ติดต่อ</Label>
              <Select value={f.contactType} onValueChange={(v) => setF({ ...f, contactType: v as ContactType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTACT_TYPES.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>ช่องทางติดต่อที่สะดวก</Label>
              <Select value={f.preferredChannel} onValueChange={(v) => setF({ ...f, preferredChannel: v as ContactChannel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border p-3 bg-secondary/30 grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={f.isMain} onCheckedChange={(v) => setF({ ...f, isMain: !!v })} /> เป็นผู้ติดต่อหลัก</label>
            <label className="flex items-center gap-2"><Checkbox checked={f.isBilling} onCheckedChange={(v) => setF({ ...f, isBilling: !!v })} /> ผู้ติดต่อฝ่ายบัญชี</label>
            <label className="flex items-center gap-2"><Checkbox checked={f.isDelivery} onCheckedChange={(v) => setF({ ...f, isDelivery: !!v })} /> ผู้รับสินค้า</label>
            <label className="flex items-center gap-2"><Checkbox checked={f.isPoApprover} onCheckedChange={(v) => setF({ ...f, isPoApprover: !!v })} /> ผู้อนุมัติ PO</label>
          </div>
          <div className="grid gap-1.5"><Label>Note / Memo</Label>
            <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Internal Note (เห็นเฉพาะภายใน)</Label>
            <Textarea rows={2} value={f.internalNote} onChange={(e) => setF({ ...f, internalNote: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
