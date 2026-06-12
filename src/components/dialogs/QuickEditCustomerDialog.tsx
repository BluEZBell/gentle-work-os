import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { updateCustomer } from "@/lib/store";
import { customerLeadSource } from "@/lib/mockBusiness";
import { CUSTOMER_TYPES_TH, LEAD_SOURCES_TH } from "@/lib/thaiOptions";
import type { Customer } from "@/lib/mockData";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer?: Customer;
}

export function QuickEditCustomerDialog({ open, onOpenChange, customer }: Props) {
  const [type, setType] = useState<string>(customer?.type ?? "New");
  const [contactPerson, setContactPerson] = useState(customer?.contactPerson ?? "");
  const [lead, setLead] = useState<string>("");
  const [customLead, setCustomLead] = useState("");
  const [status, setStatus] = useState("ใช้งานอยู่");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState(customer?.notes ?? "");

  useEffect(() => {
    if (open && customer) {
      setType(customer.type);
      setContactPerson(customer.contactPerson);
      setLead(customerLeadSource[customer.id] ?? "");
      setPhone(customer.phone);
      setEmail(customer.email);
      setAddress(customer.address);
      setNotes(customer.notes);
      setCustomLead("");
    }
  }, [open, customer]);

  if (!customer) return null;

  const save = () => {
    updateCustomer(customer.id, {
      contactPerson, phone, email, address, notes,
      type: (["New", "Existing", "Corporate"].includes(type) ? type : customer.type) as Customer["type"],
    }, "Khun Ploy");
    if (lead) customerLeadSource[customer.id] = lead as never;
    toast.success("บันทึกการแก้ไขแล้ว");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>แก้ไขข้อมูลลูกค้า — {customer.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>ประเภทลูกค้า</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES_TH.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>สถานะลูกค้า</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ใช้งานอยู่", "ลูกค้าที่ต้องติดตาม", "พักไว้", "ระงับการซื้อขาย"].map((s) =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5"><Label>ผู้ติดต่อหลัก</Label>
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
            <div className="grid gap-1.5"><Label>กฎวางบิล</Label>
              <Button variant="outline" asChild size="sm" className="h-10 justify-start">
                <Link to={`/customers/${customer.id}`}>เปิดกฎวางบิลในหน้าโปรไฟล์ →</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-1.5"><Label>โน้ตภายใน</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={save}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
