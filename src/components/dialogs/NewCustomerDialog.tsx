// Customer Add dialog
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCustomer } from "@/lib/store";
import { customerLeadSource } from "@/lib/mockBusiness";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CUSTOMER_TYPES_TH, LEAD_SOURCES_TH } from "@/lib/thaiOptions";
import type { CustomerType } from "@/lib/mockData";

export function NewCustomerDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", contactPerson: "", phone: "", email: "", address: "",
    type: "New" as CustomerType,
    leadSource: "Referral", leadOther: "",
    taxId: "", branch: "",
    confidential: false, notes: "",
  });
  const disabled = !can("edit");
  const submit = () => {
    if (!f.name.trim()) { toast.error("กรุณาระบุชื่อลูกค้า"); return; }
    const source = f.leadSource === "Other" ? (f.leadOther || "อื่น ๆ") : f.leadSource;
    const customer = addCustomer({
      name: f.name, contactPerson: f.contactPerson, phone: f.phone, email: f.email,
      address: f.address, type: f.type, source,
      confidential: f.confidential, notes: f.notes,
      taxId: f.taxId || undefined, branch: f.branch || undefined,
    }, user?.name ?? "Demo User");
    // Persist lead source mapping for filters/profile
    if (customer?.id) customerLeadSource[customer.id] = f.leadSource as never;
    toast.success(`เพิ่มลูกค้า "${f.name}" แล้ว`);
    setOpen(false);
    setF({ name: "", contactPerson: "", phone: "", email: "", address: "", type: "New", leadSource: "Referral", leadOther: "", taxId: "", branch: "", confidential: false, notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} title={disabled ? "บัญชี Viewer — อ่านได้อย่างเดียว" : undefined}>
          <Plus className="w-4 h-4 mr-1" /> เพิ่มลูกค้า
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>ชื่อลูกค้า *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ผู้ติดต่อหลัก</Label>
              <Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>เบอร์โทร</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>อีเมล</Label>
              <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>ที่อยู่</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ประเภทลูกค้า</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as CustomerType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>ที่มาของลูกค้า</Label>
              <Select value={f.leadSource} onValueChange={(v) => setF({ ...f, leadSource: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {f.leadSource === "Other" && (
            <div className="grid gap-1.5"><Label>ระบุที่มา</Label>
              <Input value={f.leadOther} onChange={(e) => setF({ ...f, leadOther: e.target.value })} placeholder="เช่น งานสัมมนา, แนะนำจาก…" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>เลขผู้เสียภาษี</Label>
              <Input value={f.taxId} onChange={(e) => setF({ ...f, taxId: e.target.value })} placeholder="0-1055-XXXXX-XX-X" /></div>
            <div className="grid gap-1.5"><Label>สาขา</Label>
              <Input value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} placeholder="สำนักงานใหญ่ / สาขา…" /></div>
          </div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div><div className="text-sm font-medium">ลูกค้าลับ (Confidential)</div>
              <div className="text-xs text-muted-foreground">มี NDA / จำกัดการเข้าถึง</div></div>
            <Switch checked={f.confidential} onCheckedChange={(v) => setF({ ...f, confidential: v })} />
          </div>
          <div className="grid gap-1.5"><Label>โน้ตภายใน</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึกลูกค้า</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
