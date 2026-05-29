import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addContact } from "@/lib/store";
import { customers } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewContactDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", role: "", department: "", phone: "", email: "", customerId: customers[0]?.id ?? "", notes: "" });
  const submit = () => {
    if (!f.name.trim()) { toast.error("Name required"); return; }
    addContact(f, user?.name ?? "Demo User"); toast.success("Contact added"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!can("edit")}><Plus className="w-4 h-4 mr-1" /> Add contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Name *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Role</Label>
              <Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Department</Label>
              <Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Email</Label>
              <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Customer</Label>
            <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
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
