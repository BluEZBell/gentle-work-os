import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  tasks, TASK_STATUSES, PRIORITIES, type TaskStatus, type Priority,
} from "@/lib/mockBusiness";
import {
  addTask, updateTask, deleteTask, duplicateTask, setTaskStatus, setTaskPriority,
  addTaskCalendarEvent, removeTaskCalendarEvent, isTaskInCalendar, useBizTick,
} from "@/lib/storeBusiness";
import { customers, deals, jobs, findJob, findDeal } from "@/lib/mockData";
import { CustomerLink } from "@/components/CustomerLink";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Plus, Search, ListTodo, MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2,
  CalendarPlus, CalendarCheck2, CalendarX2, Calendar as CalendarIcon, X,
  ListChecks, AlertTriangle, Clock, PlayCircle, PauseCircle, CheckCircle, CalendarClock, Flame, CalendarDays,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

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

type StatusCardKey =
  | "all" | "today" | "urgent" | "open" | "inprogress" | "waiting"
  | "done" | "overdue" | "calendar";

const todayISO = () => new Date().toISOString().slice(0, 10);
const isWaiting = (name: string) =>
  /follow ?up|ติดตาม|รอ/i.test(name);

export default function Tasks() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [statusCard, setStatusCard] = useState<StatusCardKey>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all"); // all|customer|deal|job|general
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState(blankForm());

  const today = todayISO();
  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.owner))).sort(),
    // re-eval when tasks length changes via useBizTick
    [tasks.length],
  );

  const matchCard = (t: typeof tasks[number]) => {
    switch (statusCard) {
      case "all": return true;
      case "today": return t.dueDate === today && t.status !== "Done";
      case "urgent": return t.priority === "Urgent";
      case "open": return t.status === "Open";
      case "inprogress": return t.status === "In Progress";
      case "waiting": return isWaiting(t.name);
      case "done": return t.status === "Done";
      case "overdue": return t.status === "Overdue";
      case "calendar": return isTaskInCalendar(t.id);
    }
  };

  const matchSecondary = (t: typeof tasks[number]) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (customerFilter !== "all" && t.customerId !== customerFilter) return false;
    if (assigneeFilter !== "all" && t.owner !== assigneeFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (moduleFilter !== "all") {
      if (moduleFilter === "customer" && !t.customerId) return false;
      if (moduleFilter === "deal" && !t.dealId) return false;
      if (moduleFilter === "job" && !t.jobId) return false;
      if (moduleFilter === "general" && (t.customerId || t.dealId || t.jobId)) return false;
    }
    return true;
  };

  const list = useMemo(
    () => tasks.filter((t) => matchCard(t) && matchSecondary(t)),
    [q, statusCard, customerFilter, assigneeFilter, priorityFilter, moduleFilter, tasks.length],
  );

  const counts = useMemo(() => {
    const c = (fn: (t: typeof tasks[number]) => boolean) => tasks.filter(fn).length;
    return {
      all: tasks.length,
      today: c((t) => t.dueDate === today && t.status !== "Done"),
      urgent: c((t) => t.priority === "Urgent"),
      open: c((t) => t.status === "Open"),
      inprogress: c((t) => t.status === "In Progress"),
      waiting: c((t) => isWaiting(t.name)),
      done: c((t) => t.status === "Done"),
      overdue: c((t) => t.status === "Overdue"),
      calendar: c((t) => isTaskInCalendar(t.id)),
    };
  }, [tasks.length, today]);

  const cards: { key: StatusCardKey; label: string; icon: any; tone: string }[] = [
    { key: "all",        label: "ทั้งหมด",      icon: ListChecks,    tone: "text-foreground" },
    { key: "today",      label: "ต้องทำวันนี้",  icon: Clock,         tone: "text-primary" },
    { key: "urgent",     label: "ด่วน",         icon: Flame,         tone: "text-destructive" },
    { key: "open",       label: "ยังไม่เริ่ม",   icon: PauseCircle,   tone: "text-muted-foreground" },
    { key: "inprogress", label: "กำลังทำ",      icon: PlayCircle,    tone: "text-sky-600" },
    { key: "waiting",    label: "รอติดตาม",     icon: CalendarClock, tone: "text-warning" },
    { key: "done",       label: "เสร็จแล้ว",     icon: CheckCircle,   tone: "text-success" },
    { key: "overdue",    label: "เกินกำหนด",    icon: AlertTriangle, tone: "text-destructive" },
    { key: "calendar",   label: "อยู่ในปฏิทิน",  icon: CalendarDays,  tone: "text-primary" },
  ];

  const clearFilters = () => {
    setStatusCard("all"); setModuleFilter("all"); setCustomerFilter("all");
    setAssigneeFilter("all"); setPriorityFilter("all"); setQ("");
  };

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

  const toggleCalendar = (id: string) => {
    if (isTaskInCalendar(id)) {
      removeTaskCalendarEvent(id, user?.name ?? "Demo");
      toast.success("ลบงานออกจากปฏิทินแล้ว");
    } else {
      addTaskCalendarEvent(id, user?.name ?? "Demo");
      toast.success("เพิ่มงานลงปฏิทินแล้ว");
    }
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

      {/* Status Summary Cards */}
      <div className="mb-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">สถานะงาน</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {cards.map((c) => {
            const active = statusCard === c.key;
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setStatusCard(c.key)}
                className={
                  "text-left rounded-lg border bg-card p-3 transition shadow-sm hover:shadow-md hover:border-primary/40 " +
                  (active ? "ring-2 ring-primary/30 border-primary bg-primary/5" : "")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <Icon className={"w-4 h-4 " + c.tone} />
                </div>
                <div className="font-display text-2xl font-semibold mt-1 tabular-nums">
                  {counts[c.key]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary filters */}
      <Card className="card-soft p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหางาน…" className="pl-9 h-9" />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="เกี่ยวกับ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="customer">ลูกค้า</SelectItem>
              <SelectItem value="deal">ดีล</SelectItem>
              <SelectItem value="job">งาน</SelectItem>
              <SelectItem value="general">ทั่วไป</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="ลูกค้า" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกลูกค้า</SelectItem>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="ผู้รับผิดชอบ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคน</SelectItem>
              {assignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="ความสำคัญ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระดับ</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
            <X className="w-3.5 h-3.5 mr-1" /> ล้างตัวกรอง
          </Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card className="card-soft"><EmptyState icon={ListTodo} title="ยังไม่มีงานในตัวกรองนี้" /></Card>
      ) : (
        <TooltipProvider delayDuration={200}>
        <Card className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%]">งาน</TableHead>
                  <TableHead className="w-16 text-center">ปฏิทิน</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>เกี่ยวกับ</TableHead>
                  <TableHead>วันครบกำหนด</TableHead>
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
                  const inCal = isTaskInCalendar(t.id);
                  const rowTone =
                    t.status === "Done" ? "opacity-60" :
                    t.status === "Overdue" ? "bg-warning-soft/30" :
                    t.priority === "Urgent" ? "bg-destructive/5" : "";
                  return (
                    <TableRow key={t.id} className={rowTone}>
                      <TableCell>
                        <div className={"font-medium text-sm " + (t.status === "Done" ? "line-through" : "")}>{t.name}</div>
                        {t.note && <div className="text-xs text-muted-foreground truncate max-w-[260px]">{t.note}</div>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleCalendar(t.id)}
                              aria-label="toggle calendar"
                            >
                              {inCal
                                ? <CalendarCheck2 className="w-4 h-4 text-primary" />
                                : <CalendarIcon className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{inCal ? "อยู่ในปฏิทินแล้ว" : "ยังไม่ได้เพิ่มในปฏิทิน"}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.customerId
                          ? <CustomerLink customerId={t.customerId} />
                          : <span className="text-muted-foreground">ทั่วไป</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {related ? (
                          <Link to={related.to} className="text-primary hover:underline">
                            <span className="text-[10px] uppercase text-muted-foreground mr-1">{related.kind}</span>{related.label}
                          </Link>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap tabular-nums">{t.dueDate}</TableCell>
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openEdit(t.id)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { duplicateTask(t.id, user?.name ?? "Demo"); toast.success("ทำสำเนางานแล้ว"); }}>
                              <Copy className="w-3.5 h-3.5 mr-2" /> ทำสำเนา
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setTaskStatus(t.id, "Done"); toast.success("ทำเครื่องหมายเสร็จแล้ว"); }}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> ทำเครื่องหมายเสร็จ
                            </DropdownMenuItem>
                            {inCal ? (
                              <DropdownMenuItem onClick={() => toggleCalendar(t.id)}>
                                <CalendarX2 className="w-3.5 h-3.5 mr-2" /> ลบออกจากปฏิทิน
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => toggleCalendar(t.id)}>
                                <CalendarPlus className="w-3.5 h-3.5 mr-2" /> เพิ่มในปฏิทิน
                              </DropdownMenuItem>
                            )}
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
        </TooltipProvider>
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
