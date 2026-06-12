import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateCustomer } from "@/lib/store";
import { customerLeadSource } from "@/lib/mockBusiness";
import { CUSTOMER_TYPES_TH, LEAD_SOURCES_TH } from "@/lib/thaiOptions";
import type { Customer, CustomerType } from "@/lib/mockData";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer?: Customer;
  /** "type" = highlight Customer Type & Status (opened from header badge). */
  focus?: "type" | "all";
}

const STATUSES = ["ใช้งานอยู่", "ลูกค้าที่ต้องติดตาม", "พักไว้", "ระงับการซื้อขาย"] as const;

export function QuickEditCustomerDialog({ open, onOpenChange, customer, focus = "all" }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomerType>("New");
  const [status, setStatus] = useState<typeof STATUSES[number]>("ใช้งานอยู่");
  const [contactPerson, setContactPerson] = useState("");
  const [lead, setLead] = useState<string>("");
  const [customLead, setCustomLead] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branch, setBranch] = useState("");
  const [memo, setMemo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && customer) {
      setName(customer.name);
      setType(customer.type);
      setStatus(customer.status ?? "ใช้งานอยู่");
      setContactPerson(customer.contactPerson);
      const ls = customerLeadSource[customer.id];
      const known = LEAD_SOURCES_TH.some((o) => o.value === ls);
      setLead(known ? ls : ls ? "Other" : "");
      setCustomLead(known ? "" : (ls ?? ""));
      setPhone(customer.phone);
      setEmail(customer.email);
      setAddress(customer.address);
      setTaxId(customer.taxId ?? "");
      setBranch(customer.branch ?? "");
      setMemo(customer.memo ?? "");
      setNotes(customer.notes);
    }
  }, [open, customer]);

  if (!customer) return null;

  const save = () => {
    updateCustomer(customer.id, {
      name, type, status, contactPerson, phone, email, address,
      taxId: taxId || undefined, branch: branch || undefined,
      memo: memo || undefined, notes,
    }, "Khun Ploy");
    const final = lead === "Other" ? (customLead || "Other") : lead;
    if (final) customerLeadSource[customer.id] = final as never;
    toast.success("บันทึกการแก้ไขแล้ว");
    onOpenChange(false);
  };

  const ring = (cond: boolean) => cond ? "ring-2 ring-primary/60 rounded-md p-2 -m-2" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า — {customer.name}</DialogTitle>
          {focus === "type" && (
            <DialogDescription>ปรับ ประเภทลูกค้า / สถานะ / ผู้ติดต่อหลัก / ที่มา ได้ที่นี่</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>ชื่อลูกค้า</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} /></div>

          <div className={"grid grid-cols-2 gap-3 " + ring(focus === "type")}>
            <div className="grid gap-1.5"><Label>ประเภทลูกค้า</Label>
              <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>สถานะลูกค้า</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof STATUSES[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5"><Label>ผู้ติดต่อหลัก (Main Contact)</Label>
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>

          <div className="grid gap-1.5"><Label>ที่มาของลูกค้า (Lead Source)</Label>
            <Select value={lead} onValueChange={setLead}>
              <SelectTrigger><SelectValue placeholder="เลือก…" /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {lead === "Other" && (
              <Input placeholder="ระบุที่มา…" value={customLead} onChange={(e) => setCustomLead(e.target.value)} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>เบอร์โทร</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>อีเมล</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>

          <div className="grid gap-1.5"><Label>ที่อยู่</Label>
            <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>เลขผู้เสียภาษี</Label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="0-1055-XXXXX-XX-X" /></div>
            <div className="grid gap-1.5"><Label>สาขา</Label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="สำนักงานใหญ่ / สาขา…" /></div>
          </div>

          <div className="grid gap-1.5"><Label>Customer Memo</Label>
            <Textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="บันทึกย่อเกี่ยวกับลูกค้า (เห็นได้ทั้งทีม)" /></div>

          <div className="grid gap-1.5"><Label>Internal Note</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="โน้ตภายในทีม" /></div>

          <div className="text-xs text-muted-foreground">
            กฎวางบิล: ปรับได้ที่แท็บ <span className="font-medium">Billing Rules</span> ในหน้าโปรไฟล์
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={save}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
