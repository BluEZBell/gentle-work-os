import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDeal } from "@/lib/store";
import { customers, dealStatusThai, type DealStatus } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewDealDialog() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", customerId: customers[0]?.id ?? "", contactId: "",
    estimatedValue: 100000, probability: 50, status: "New Lead" as DealStatus,
    expectedCloseDate: new Date().toISOString().slice(0, 10), notes: "",
  });
  const disabled = !can("edit");
  const submit = () => {
    if (!f.name.trim()) { toast.error("กรุณากรอกชื่อดีล"); return; }
    addDeal(f, user?.name ?? "Demo User");
    toast.success(`Deal "${f.name}" created`);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}><Plus className="w-4 h-4 mr-1" /> New deal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Deal name *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Customer</Label>
            <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5"><Label>Value (THB)</Label>
              <Input type="number" value={f.estimatedValue}
                onChange={(e) => setF({ ...f, estimatedValue: Number(e.target.value) })} /></div>
            <div className="grid gap-1.5"><Label>Probability %</Label>
              <Input type="number" value={f.probability}
                onChange={(e) => setF({ ...f, probability: Number(e.target.value) })} /></div>
            <div className="grid gap-1.5"><Label>Close date</Label>
              <Input type="date" value={f.expectedCloseDate}
                onChange={(e) => setF({ ...f, expectedCloseDate: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as DealStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(dealStatusThai) as DealStatus[]).map((s) =>
                  <SelectItem key={s} value={s}>{s} ({dealStatusThai[s]})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save deal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
