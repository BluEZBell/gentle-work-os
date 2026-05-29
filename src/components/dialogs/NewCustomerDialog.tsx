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
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewCustomerDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", contactPerson: "", phone: "", email: "", address: "",
    type: "New" as "New" | "Existing" | "Corporate",
    source: "", confidential: false, notes: "",
  });
  const disabled = !can("edit");
  const submit = () => {
    if (!f.name.trim()) { toast.error("Name is required"); return; }
    addCustomer(f, user?.name ?? "Demo User");
    toast.success(`Customer "${f.name}" added`);
    setOpen(false);
    setF({ name: "", contactPerson: "", phone: "", email: "", address: "", type: "New", source: "", confidential: false, notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} title={disabled ? "Viewer role — read only" : undefined}>
          <Plus className="w-4 h-4 mr-1" /> Add customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Customer name *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Contact person</Label>
              <Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Email</Label>
              <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Address</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as never })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Existing">Existing</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Source</Label>
              <Input value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="Referral, website…" /></div>
          </div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div><div className="text-sm font-medium">Confidential account</div>
              <div className="text-xs text-muted-foreground">NDA / restricted handling</div></div>
            <Switch checked={f.confidential} onCheckedChange={(v) => setF({ ...f, confidential: v })} />
          </div>
          <div className="grid gap-1.5"><Label>Notes</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
