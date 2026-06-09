import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  tasks, TASK_STATUSES, PRIORITIES, type TaskStatus, type Priority,
} from "@/lib/mockBusiness";
import {
  addTask, updateTask, deleteTask, duplicateTask, setTaskStatus, setTaskPriority,
  addTaskCalendarEvent, useBizTick,
} from "@/lib/storeBusiness";
import { customers, deals, jobs, findJob, findDeal } from "@/lib/mockData";
import { CustomerLink } from "@/components/CustomerLink";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Plus, Search, ListTodo, MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2, CalendarPlus,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { PeriodFilter, defaultPeriod, matchesPeriod, type PeriodValue } from "@/components/PeriodFilter";

const priorityTone: Record<Priority, string> = {
  Urgent: "text-destructive border-destructive/40 bg-destructive/5",
  High:   "text-warning border-warning/40 bg-warning-soft",
  Medium: "text-primary border-primary/30 bg-primary/5",
  Low:    "text-muted-foreground border-border bg-secondary/40",
};
const statusTone: Record<TaskStatus, string> = {
  Open:          "text-primary border-primary/30 bg-primary/5",
  "In Progress": "text-sky-700 border-sky-300 bg-sky-50",
  Done:          "text-success border-success/30 bg-success-soft",
  Overdue:       "text-destructive border-destructive/40 bg-destructive/5",
};

const blankForm = () => ({
  name: "", customerId: "none", dealId: "none", jobId: "none",
  dueDate: new Date().toISOString().slice(0, 10),
  priority: "Medium" as Priority, status: "Open" as TaskStatus,
  owner: "Khun Ploy", note: "",
});

export default function Tasks() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState(blankForm());

  const list = useMemo(() => tasks.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (!matchesPeriod(t.dueDate, period)) return false;
    if (period.customerId !== "all" && t.customerId !== period.customerId) return false;
    if (period.status !== "all" && t.status !== period.status) return false;
    return true;
  }), [q, period]);

  const openCreate = () => { setEditingId(null); setF(blankForm()); setOpen(true); };
  const openEdit = (id: string) => {
    const t = tasks.find((x) => x.id === id); if (!t) return;
    setEditingId(id);
    setF({
      name: t.name, customerId: t.customerId ?? "none", dealId: t.dealId ?? "none", jobId: t.jobId ?? "none",
      dueDate: t.dueDate, priority: t.priority, status: t.status, owner: t.owner, note: t.note,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!f.name.trim()) { toast.error("กรุณาใส่ชื่องาน"); return; }
    const payload = {
      name: f.name,
      customerId: f.customerId === "none" ? undefined : f.customerId,
      dealId: f.dealId === "none" ? undefined : f.dealId,
      jobId: f.jobId === "none" ? undefined : f.jobId,
      dueDate: f.dueDate, priority: f.priority, status: f.status,
      owner: f.owner, note: f.note,
    };
    if (editingId) { updateTask(editingId, payload, user?.name ?? "Demo"); toast.success("แก้ไขงานแล้ว"); }
    else { addTask(payload, user?.name ?? "Demo"); toast.success("สร้างงานแล้ว"); }
    setOpen(false);
  };

  const counts = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "Open" || t.status === "In Progress").length,
    overdue: tasks.filter((t) => t.status === "Overdue").length,
    done: tasks.filter((t) => t.status === "Done").length,
  };

  return (
    <>
      <PageHeader title="Tasks" thai="งานที่ต้องทำ"
        description="จัดการงานที่ต้องทำ ติดตามกำหนดเวลา และดูงานที่ค้างอยู่"
        actions={
          <Button disabled={!can("edit")} onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> เพิ่มงาน
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="card-soft p-3"><div className="text-xs text-muted-foreground">ทั้งหมด</div><div className="font-display text-xl font-semibold">{counts.total}</div></Card>
        <Card className="card-soft p-3"><div className="text-xs text-muted-foreground">กำลังทำ</div><div className="font-display text-xl font-semibold text-primary">{counts.open}</div></Card>
        <Card className="card-soft p-3"><div className="text-xs text-muted-foreground">เกินกำหนด</div><div className="font-display text-xl font-semibold text-destructive">{counts.overdue}</div></Card>
        <Card className="card-soft p-3"><div className="text-xs text-muted-foreground">เสร็จแล้ว</div><div className="font-display text-xl font-semibold text-success">{counts.done}</div></Card>
      </div>

      <PeriodFilter value={period} onChange={setPeriod} statuses={TASK_STATUSES} />

      <Card className="card-soft p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหางาน…" className="pl-9 h-9" />
        </div>
      </Card>

      {list.length === 0 ? (
        <Card className="card-soft"><EmptyState icon={ListTodo} title="ยังไม่มีงานในตัวกรองนี้" /></Card>
      ) : (
        <Card className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">งาน</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>เกี่ยวข้อง</TableHead>
                  <TableHead>กำหนดเสร็จ</TableHead>
                  <TableHead className="w-32">ความสำคัญ</TableHead>
                  <TableHead className="w-36">สถานะ</TableHead>
                  <TableHead>ผู้รับผิดชอบ</TableHead>
                  <TableHead className="w-10 text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => {
                  const related = t.jobId ? { kind: "Job", label: findJob(t.jobId)?.number ?? "—", to: `/jobs/${t.jobId}` }
                    : t.dealId ? { kind: "Deal", label: findDeal(t.dealId)?.name ?? "—", to: `/deals/${t.dealId}` }
                    : null;
                  return (
                    <TableRow key={t.id} className={t.status === "Done" ? "opacity-60" : ""}>
                      <TableCell>
                        <div className={"font-medium text-sm " + (t.status === "Done" ? "line-through" : "")}>{t.name}</div>
                        {t.note && <div className="text-xs text-muted-foreground truncate max-w-[260px]">{t.note}</div>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.customerId ? <CustomerLink customerId={t.customerId} /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {related ? (
                          <Link to={related.to} className="text-primary hover:underline">
                            <span className="text-[10px] uppercase text-muted-foreground mr-1">{related.kind}</span>{related.label}
                          </Link>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{t.dueDate}</TableCell>
                      <TableCell>
                        <Select value={t.priority} onValueChange={(v) => setTaskPriority(t.id, v as Priority)}>
                          <SelectTrigger className={"h-8 w-28 text-xs border " + priorityTone[t.priority]}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={t.status} onValueChange={(v) => setTaskStatus(t.id, v as TaskStatus)}>
                          <SelectTrigger className={"h-8 w-32 text-xs border " + statusTone[t.status]}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{t.owner}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEdit(t.id)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { duplicateTask(t.id, user?.name ?? "Demo"); toast.success("ทำสำเนางานแล้ว"); }}>
                              <Copy className="w-3.5 h-3.5 mr-2" /> ทำสำเนา
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setTaskStatus(t.id, "Done"); toast.success("ทำเครื่องหมายเสร็จแล้ว"); }}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> ทำเครื่องหมายเสร็จ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { addTaskCalendarEvent(t.id); toast.success("เพิ่มในปฏิทินแล้ว"); }}>
                              <CalendarPlus className="w-3.5 h-3.5 mr-2" /> เพิ่มในปฏิทิน
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { deleteTask(t.id, user?.name ?? "Demo"); toast.success("ลบงานแล้ว"); }}
                              className="text-destructive focus:text-destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>ชื่องาน *</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="grid gap-1.5"><Label>วันครบกำหนด</Label>
                <Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>ความสำคัญ</Label>
                <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid gap-1.5"><Label>สถานะ</Label>
                <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="grid gap-1.5"><Label>ลูกค้า</Label>
                <Select value={f.customerId} onValueChange={(v) => setF({ ...f, customerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="grid gap-1.5"><Label>ดีล</Label>
                <Select value={f.dealId} onValueChange={(v) => setF({ ...f, dealId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {deals.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="grid gap-1.5"><Label>งาน</Label>
                <Select value={f.jobId} onValueChange={(v) => setF({ ...f, jobId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.number}</SelectItem>)}
                  </SelectContent>
                </Select></div>
            </div>
            <div className="grid gap-1.5"><Label>ผู้รับผิดชอบ</Label>
              <Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>หมายเหตุ</Label>
              <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={submit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
