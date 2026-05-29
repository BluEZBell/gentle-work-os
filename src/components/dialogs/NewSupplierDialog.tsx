import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSupplier } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewSupplierDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", contactPerson: "", phone: "", email: "",
    paymentTerm: "30 Days" as "Cash" | "30 Days" | "60 Days",
    bankInfo: "•••• •••• 0000", type: "Raw material", notes: "",
    riskLevel: "Low" as "Low" | "Medium" | "High", confidential: false,
  });
  const submit = () => {
    if (!f.name.trim()) { toast.error("Name required"); return; }
    addSupplier(f, user?.name ?? "Demo User"); toast.success("Supplier added"); setOpen(false);
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
