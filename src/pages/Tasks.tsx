import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  tasks, TASK_STATUSES, PRIORITIES, type TaskStatus, type Priority,
} from "@/lib/mockBusiness";
import { addTask, setTaskStatus, setTaskPriority, useBizTick } from "@/lib/storeBusiness";
import { customers, deals, jobs, findCustomer, findJob, findDeal } from "@/lib/mockData";
import { CustomerLink } from "@/components/CustomerLink";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Plus, Search, CheckCircle2, ListTodo } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export default function Tasks() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", customerId: "none", dealId: "none", jobId: "none",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "Medium" as Priority, status: "Open" as TaskStatus,
    owner: "Khun Ploy", note: "",
  });

  const list = tasks.filter((t) => {
    const m = t.name.toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || t.status === filter;
    return m && s;
  });

  const submit = () => {
    if (!f.name.trim()) { toast.error("Task name required"); return; }
    addTask({
      name: f.name,
      customerId: f.customerId === "none" ? undefined : f.customerId,
      dealId: f.dealId === "none" ? undefined : f.dealId,
      jobId: f.jobId === "none" ? undefined : f.jobId,
      dueDate: f.dueDate, priority: f.priority, status: f.status,
      owner: f.owner, note: f.note,
    }, user?.name ?? "Demo");
    setOpen(false); toast.success("Task created");
    setF({ ...f, name: "", note: "" });
  };

  return (
    <>
      <PageHeader title="Tasks" thai="งานที่ต้องทำ"
        description="จัดการงานที่ต้องทำ ติดตามกำหนดเวลา และดูงานที่ค้างอยู่"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!can("edit")}><Plus className="w-4 h-4 mr-1" /> เพิ่มงาน</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>เพิ่มงานใหม่</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>ชื่องาน *</Label>
                  <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>วันครบกำหนด</Label>
                    <Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>ความสำคัญ</Label>
                    <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as Priority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5"><Label>สถานะ</Label>
                    <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as TaskStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_STATUSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>ลูกค้า</Label>
                    <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5"><Label>ดีล</Label>
                    <Select value={f.dealId} onValueChange={(v) => setF({ ...f, dealId: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {deals.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5"><Label>งาน</Label>
                    <Select value={f.jobId} onValueChange={(v) => setF({ ...f, jobId: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5"><Label>หมายเหตุ</Label>
                  <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button onClick={submit}>บันทึก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหางาน…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {list.length === 0 ? <Card className="card-soft"><EmptyState icon={ListTodo} title="ยังไม่มีงาน" /></Card> :
      <div className="grid gap-2">
        {list.map((t) => (
          <Card key={t.id} className="card-soft p-4 flex flex-wrap items-center gap-3">
            <button
              className="w-5 h-5 rounded border grid place-items-center hover:bg-secondary"
              onClick={() => setTaskStatus(t.id, t.status === "Done" ? "Open" : "Done")}
              aria-label="Toggle done">
              {t.status === "Done" && <CheckCircle2 className="w-4 h-4 text-success" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={"font-medium text-sm " + (t.status === "Done" ? "line-through text-muted-foreground" : "")}>
                {t.name}
              </div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1 flex-wrap">
                <span>Due {t.dueDate} • {t.owner}</span>
                {t.customerId && <><span>•</span><CustomerLink customerId={t.customerId} muted /></>}
                {t.dealId && <><span>•</span><Link to="/deals" className="hover:underline">{findDeal(t.dealId)?.name}</Link></>}
                {t.jobId && <><span>•</span><Link to="/jobs" className="hover:underline">{findJob(t.jobId)?.number}</Link></>}
              </div>
            </div>
            <Select value={t.priority} onValueChange={(v) => setTaskPriority(t.id, v as Priority)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
            </Select>
            <StatusBadge status={t.priority} />
            <Select value={t.status} onValueChange={(v) => setTaskStatus(t.id, v as TaskStatus)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
            </Select>
            <StatusBadge status={t.status} />
          </Card>
        ))}
      </div>}
    </>
  );
}
