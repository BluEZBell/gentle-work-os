import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  calendarEvents as seedEvents,
  CalendarEvent, EventType, EVENT_TYPES, EVENT_TYPE_COLOR, EVENT_TYPE_THAI,
  eventTitle,
} from "@/lib/mockCalendar";
import { bnCalendarEvents, useBnTick } from "@/lib/billingReceiptStore";
import { customers, findCustomer } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, CalendarDays, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const days: Date[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(new Date(year, month, 1 - (startDay - i)));
  }
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(new Date(year, month, last + (days.length % 7)));
  return days;
}

function weekDays(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}

function EventChip({ ev, onClick }: { ev: CalendarEvent; onClick: () => void }) {
  const c = EVENT_TYPE_COLOR[ev.type];
  return (
    <button onClick={onClick} className={cn("w-full text-left px-1.5 py-0.5 rounded text-[11px] border truncate flex items-center gap-1", c.chip, ev.urgent && "ring-1 ring-orange-400")}>
      {ev.urgent && <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />}
      <span className="truncate">{eventTitle(ev)}</span>
    </button>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents);
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState<string>(ymd(new Date()));

  const filtered = useMemo(
    () => events.filter((e) => filterType === "all" || e.type === filterType),
    [events, filterType]
  );

  const eventsOnDay = (d: Date) => filtered.filter((e) => e.date === ymd(d));

  const goPrev = () => {
    const c = new Date(cursor);
    if (view === "month") c.setMonth(c.getMonth() - 1);
    else if (view === "week") c.setDate(c.getDate() - 7);
    else c.setDate(c.getDate() - 14);
    setCursor(c);
  };
  const goNext = () => {
    const c = new Date(cursor);
    if (view === "month") c.setMonth(c.getMonth() + 1);
    else if (view === "week") c.setDate(c.getDate() + 7);
    else c.setDate(c.getDate() + 14);
    setCursor(c);
  };

  const monthLabel = cursor.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Business Calendar" thai="ปฏิทินธุรกิจ"
        description="ดูกิจกรรมรายเดือน รายสัปดาห์ หรือรายการ ผูกกับลูกค้า งาน บิล และเอกสารได้ตรงๆ" />

      <Card className="card-soft p-3 md:p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>วันนี้</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
          <div className="font-display font-semibold text-base md:text-lg ml-1">{monthLabel}</div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" />ประเภท</div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as EventType | "all")}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t} ({EVENT_TYPE_THAI[t]})</SelectItem>)}
              </SelectContent>
            </Select>
            <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week" | "list")}>
              <TabsList>
                <TabsTrigger value="month">เดือน</TabsTrigger>
                <TabsTrigger value="week">สัปดาห์</TabsTrigger>
                <TabsTrigger value="list">รายการ</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={() => { setAddDate(ymd(new Date())); setAddOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> เพิ่มกิจกรรม
            </Button>
          </div>
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EVENT_TYPES.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={cn("w-2.5 h-2.5 rounded-full", EVENT_TYPE_COLOR[t].dot)} />
              {EVENT_TYPE_THAI[t]}
            </span>
          ))}
        </div>
      </Card>

      {view === "month" && (
        <Card className="card-soft p-2 md:p-3">
          <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-muted-foreground mb-1">
            {["อา","จ","อ","พ","พฤ","ศ","ส"].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthMatrix(cursor.getFullYear(), cursor.getMonth()).map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = ymd(d) === ymd(new Date());
              const evs = eventsOnDay(d);
              return (
                <div key={i} className={cn(
                  "min-h-[88px] md:min-h-[110px] rounded border p-1 flex flex-col gap-0.5 cursor-pointer hover:bg-accent/30",
                  !inMonth && "opacity-40",
                  isToday && "border-primary bg-primary/5"
                )}
                  onClick={() => { setAddDate(ymd(d)); setAddOpen(true); }}>
                  <div className="text-[11px] font-medium flex items-center justify-between">
                    <span>{d.getDate()}</span>
                    {evs.length > 0 && <span className="text-[10px] text-muted-foreground">{evs.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                        <EventChip ev={e} onClick={() => setSelected(e)} />
                      </div>
                    ))}
                    {evs.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+ อีก {evs.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "week" && (
        <Card className="card-soft p-2 md:p-3">
          <div className="grid grid-cols-7 gap-2">
            {weekDays(cursor).map((d) => {
              const isToday = ymd(d) === ymd(new Date());
              const evs = eventsOnDay(d);
              return (
                <div key={ymd(d)} className={cn("rounded border p-2 min-h-[280px] flex flex-col gap-1", isToday && "border-primary bg-primary/5")}>
                  <div className="text-xs font-medium flex items-center justify-between mb-1">
                    <span>{d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric" })}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddDate(ymd(d)); setAddOpen(true); }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {evs.map((e) => (
                      <div key={e.id} onClick={() => setSelected(e)} className={cn("rounded border-l-4 bg-card border p-1.5 text-[11px] cursor-pointer hover:bg-accent/40", EVENT_TYPE_COLOR[e.type].ring)}>
                        <div className="font-medium truncate">{eventTitle(e)}</div>
                        <div className="text-muted-foreground text-[10px]">{e.time || "ทั้งวัน"} · {EVENT_TYPE_THAI[e.type]}</div>
                      </div>
                    ))}
                    {!evs.length && <div className="text-[10px] text-muted-foreground italic">ว่าง</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "list" && (
        <Card className="card-soft p-0 overflow-hidden">
          <div className="divide-y">
            {filtered.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <button key={e.id} onClick={() => setSelected(e)}
                className={cn("w-full text-left flex items-center gap-3 p-3 hover:bg-accent/30 border-l-4", EVENT_TYPE_COLOR[e.type].ring)}>
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div className="w-24 text-xs text-muted-foreground">{e.date}{e.time ? ` · ${e.time}` : ""}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {e.urgent && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                    {eventTitle(e)}
                  </div>
                  <div className="text-xs text-muted-foreground">{EVENT_TYPE_THAI[e.type]}{e.customerId ? ` · ${findCustomer(e.customerId)?.name}` : ""}</div>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[10px] border", EVENT_TYPE_COLOR[e.type].chip)}>{EVENT_TYPE_THAI[e.type]}</span>
              </button>
            ))}
            {!filtered.length && <div className="p-6 text-center text-sm text-muted-foreground">ไม่มีกิจกรรมในรายการนี้</div>}
          </div>
        </Card>
      )}

      {/* Event Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded-full", EVENT_TYPE_COLOR[selected.type].dot)} />
                  {eventTitle(selected)}
                </SheetTitle>
                <SheetDescription>รายละเอียดกิจกรรม</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 mt-4 text-sm">
                <Row k="ประเภท" v={`${selected.type} (${EVENT_TYPE_THAI[selected.type]})`} />
                <Row k="วันที่" v={`${selected.date}${selected.time ? ` เวลา ${selected.time}` : ""}`} />
                {selected.customerId && <Row k="ลูกค้า" v={
                  <Link to={`/customers/${selected.customerId}`} className="text-primary hover:underline">{findCustomer(selected.customerId)?.name}</Link>
                } />}
                {selected.amount != null && <Row k="จำนวนเงิน" v={selected.amount.toLocaleString() + " บาท"} />}
                {selected.docNumber && <Row k="เลขเอกสาร" v={selected.docNumber} />}
                {selected.notes && <Row k="หมายเหตุ" v={selected.notes} />}
                {selected.related?.length ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">เอกสารที่เกี่ยวข้อง</div>
                    <div className="flex flex-wrap gap-2">
                      {selected.related.map((r, i) => (
                        <Link key={i} to={
                          r.kind === "job" ? `/jobs/${r.id}` :
                          r.kind === "invoice" ? `/invoices/${r.id}` :
                          r.kind === "supplier-bill" ? `/supplier-bills/${r.id}` :
                          r.kind === "purchase-order" ? `/purchase-orders/${r.id}` :
                          r.kind === "service" ? `/service/${r.id}` :
                          r.kind === "customer" ? `/customers/${r.id}` :
                          `/payment-vouchers/${r.id}`
                        } className="text-xs px-2 py-1 rounded border bg-secondary hover:bg-accent">
                          {r.kind} · {r.id}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="border-t pt-3 mt-3 space-y-1">
                  <div className="text-xs text-muted-foreground">การซิงค์ Google Calendar</div>
                  <Row k="สถานะ" v={selected.syncStatus || "ยังไม่ซิงค์"} />
                  {selected.googleEventId && <Row k="Event ID" v={selected.googleEventId} />}
                  {selected.lastSyncedAt && <Row k="ซิงค์ล่าสุด" v={selected.lastSyncedAt} />}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Quick Add Event */}
      <QuickAddDialog open={addOpen} onClose={() => setAddOpen(false)} date={addDate}
        onAdd={(e) => { setEvents([...events, e]); setAddOpen(false); }} />
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground text-xs">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function QuickAddDialog({ open, onClose, date, onAdd }: {
  open: boolean; onClose: () => void; date: string;
  onAdd: (e: CalendarEvent) => void;
}) {
  const [type, setType] = useState<EventType>("Receive Payment");
  const [customerId, setCustomerId] = useState<string>("c1");
  const [amount, setAmount] = useState<string>("");
  const [docNumber, setDocNumber] = useState<string>("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>เพิ่มกิจกรรม</SheetTitle>
          <SheetDescription>เลือกประเภท ใส่ลูกค้าและจำนวนเงินหรือเลขเอกสาร</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <div>
            <Label>วันที่</Label>
            <Input value={date} readOnly className="bg-muted" />
          </div>
          <div>
            <Label>ประเภทกิจกรรม</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t} ({EVENT_TYPE_THAI[t]})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ลูกค้า (ถ้ามี)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>เวลา</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <Label>จำนวนเงิน (ถ้ามี)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>เลขเอกสาร (ถ้ามี)</Label>
            <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="INV-2026-0012" />
          </div>
          <div>
            <Label>หมายเหตุ</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={urgent} onCheckedChange={setUrgent} />
            <Label className="text-sm">ทำเครื่องหมายว่าด่วน</Label>
          </div>
          <Button className="w-full" onClick={() => {
            onAdd({
              id: `ev-${Date.now()}`, date, time: time || undefined, type,
              customerId, amount: amount ? Number(amount) : undefined,
              docNumber: docNumber || undefined, notes: notes || undefined, urgent,
              syncStatus: "Pending", syncAction: "Create",
            });
            setAmount(""); setDocNumber(""); setNotes(""); setUrgent(false); setTime("");
          }}>บันทึกกิจกรรม</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
