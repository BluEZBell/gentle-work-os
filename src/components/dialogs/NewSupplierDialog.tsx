import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSupplier } from "@/lib/store";
import { setSupplierKind, SUPPLIER_KIND_TH, type SupplierKind } from "@/lib/supplierPaymentStore";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewSupplierDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SupplierKind>("Supplier");
  const [f, setF] = useState({
    name: "", contactPerson: "", phone: "", email: "",
    paymentTerm: "30 Days" as "Cash" | "30 Days" | "60 Days",
    bankInfo: "•••• •••• 0000", type: "Raw material", notes: "",
    riskLevel: "Low" as "Low" | "Medium" | "High", confidential: false,
  });
  const submit = () => {
    if (!f.name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    const created = addSupplier(f, user?.name ?? "Demo User");
    if (created) setSupplierKind(created.id, kind);
    toast.success("เพิ่ม Supplier / Maker แล้ว"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!can("edit")}><Plus className="w-4 h-4 mr-1" /> Add supplier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New supplier</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Supplier name *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid gap-1.5">
            <Label>ประเภทคู่ค้า *</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as SupplierKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Supplier">{SUPPLIER_KIND_TH.Supplier}</SelectItem>
                <SelectItem value="Maker">{SUPPLIER_KIND_TH.Maker}</SelectItem>
                <SelectItem value="Both">{SUPPLIER_KIND_TH.Both}</SelectItem>
              </SelectContent>
            </Select>
            {(kind === "Maker" || kind === "Both") && (
              <div className="text-xs text-orange-600">Maker หัก ณ ที่จ่าย 3% ตามค่าเริ่มต้น</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Contact</Label>
              <Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Email</Label>
              <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Type</Label>
              <Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Payment term</Label>
              <Select value={f.paymentTerm} onValueChange={(v) => setF({ ...f, paymentTerm: v as never })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="30 Days">30 Days</SelectItem>
                  <SelectItem value="60 Days">60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Risk level</Label>
              <Select value={f.riskLevel} onValueChange={(v) => setF({ ...f, riskLevel: v as never })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div className="text-sm">Confidential</div>
            <Switch checked={f.confidential} onCheckedChange={(v) => setF({ ...f, confidential: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
