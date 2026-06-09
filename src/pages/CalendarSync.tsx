import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, Info, RefreshCw, Send } from "lucide-react";
import { calSyncCategories, type CalSyncStatus } from "@/lib/mockExtended";
import { SYNC_PERMISSIONS, calendarEvents, eventTitle, EVENT_TYPE_THAI } from "@/lib/mockCalendar";
import { toast } from "sonner";

export default function CalendarSync() {
  const [status, setStatus] = useState<CalSyncStatus>("Connected Demo");
  const [lastSync, setLastSync] = useState("2026-06-08 09:12");
  const [cats, setCats] = useState(calSyncCategories);
  const [perms, setPerms] = useState<Record<string, boolean>>(
    Object.fromEntries(SYNC_PERMISSIONS.map((p) => [p.id, true]))
  );
  const [ownerEmail, setOwnerEmail] = useState("owner@mto.co.th");
  const [attendees, setAttendees] = useState("finance@mto.co.th, ops@mto.co.th");

  const queue = calendarEvents.filter((e) => e.syncStatus === "Pending" || !e.syncStatus).slice(0, 6);
  const synced = calendarEvents.filter((e) => e.syncStatus === "Synced").slice(0, 5);

  const sync = () => {
    setLastSync(new Date().toISOString().slice(0, 16).replace("T", " "));
    toast.success("ซิงค์ปฏิทินเรียบร้อย (เดโม)");
  };

  return (
    <>
      <PageHeader title="Calendar Sync" thai="เชื่อมต่อ Google Calendar"
        description="ซิงค์กิจกรรมธุรกิจเข้าปฏิทินส่วนตัว (โหมดเดโม ยังไม่ได้เชื่อมต่อ Google จริง)" />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">โหมดเดโม</AlertTitle>
        <AlertDescription className="text-info/90">
          การเชื่อมต่อจริงต้องใช้ Google OAuth ในเวอร์ชันโปรดักชัน หน้านี้เป็นการแสดงสิทธิ์ ฟิลด์ และคิวที่จะซิงค์
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent text-primary grid place-items-center"><CalendarCheck className="w-5 h-5" /></div>
            <div>
              <div className="font-medium">สถานะการเชื่อมต่อ</div>
              <div className="text-xs text-muted-foreground">ซิงค์ล่าสุด {lastSync}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} tone={status === "Connected Demo" ? "success" : "muted"} />
            <Button variant="outline" size="sm" onClick={() => setStatus(status === "Connected Demo" ? "Not Connected" : "Connected Demo")}>
              {status === "Connected Demo" ? "ยกเลิกการเชื่อมต่อ" : "เชื่อมต่อ (เดโม)"}
            </Button>
            <Button size="sm" onClick={sync} disabled={status !== "Connected Demo"}>
              <RefreshCw className="w-4 h-4 mr-1" /> ซิงค์ทันที
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="card-soft p-5">
          <h3 className="font-display text-lg font-semibold mb-3">บัญชีและผู้ที่เกี่ยวข้อง</h3>
          <div className="space-y-3">
            <div>
              <Label>Google Calendar Owner Email</Label>
              <Input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@mto.co.th" />
            </div>
            <div>
              <Label>Attendees (คั่นด้วย ,)</Label>
              <Input value={attendees} onChange={(e) => setAttendees(e.target.value)} />
              <div className="text-xs text-muted-foreground mt-1">ใส่อีเมลผู้ที่ต้องเชิญในกิจกรรม</div>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-display text-lg font-semibold mb-3">สิทธิ์การเข้าถึง (Mock)</h3>
          <div className="space-y-2">
            {SYNC_PERMISSIONS.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.thai}</div>
                </div>
                <Switch checked={!!perms[p.id]} onCheckedChange={(v) => setPerms({ ...perms, [p.id]: v })} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="card-soft p-5 mt-4">
        <h3 className="font-display text-lg font-semibold mb-3">เลือกประเภทที่จะซิงค์</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2.5">
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.thai}</div>
              </div>
              <Switch checked={c.enabled} onCheckedChange={(v) =>
                setCats(cats.map((x) => x.id === c.id ? { ...x, enabled: v } : x))} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card className="card-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">คิวรอซิงค์</h3>
            <StatusBadge status={`${queue.length} รายการ`} tone="warning" />
          </div>
          <div className="space-y-2">
            {queue.map((e) => (
              <div key={e.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{eventTitle(e)}</div>
                  <div className="text-xs text-muted-foreground">{e.date} · {EVENT_TYPE_THAI[e.type]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.syncAction || "Create"} tone="info" />
                  <Button size="sm" variant="outline"><Send className="w-3 h-3 mr-1" />ซิงค์</Button>
                </div>
              </div>
            ))}
            {!queue.length && <div className="text-sm text-muted-foreground">ไม่มีกิจกรรมในคิว</div>}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-display text-lg font-semibold mb-3">ซิงค์ล่าสุด</h3>
          <div className="space-y-2">
            {synced.map((e) => (
              <div key={e.id} className="border rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="truncate">{eventTitle(e)}</span>
                  <StatusBadge status="Synced" tone="success" />
                </div>
                <div className="text-xs text-muted-foreground">{e.googleEventId} · {e.lastSyncedAt}</div>
              </div>
            ))}
            {!synced.length && <div className="text-sm text-muted-foreground">ยังไม่มีรายการที่ซิงค์แล้ว</div>}
          </div>
        </Card>
      </div>
    </>
  );
}
