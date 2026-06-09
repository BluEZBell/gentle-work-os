import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, Info, RefreshCw } from "lucide-react";
import { calSyncCategories, type CalSyncStatus } from "@/lib/mockExtended";
import { toast } from "sonner";

export default function CalendarSync() {
  const [status, setStatus] = useState<CalSyncStatus>("Connected Demo");
  const [lastSync, setLastSync] = useState("2026-05-29 09:12");
  const [cats, setCats] = useState(calSyncCategories);

  const sync = () => {
    setLastSync(new Date().toISOString().slice(0, 16).replace("T", " "));
    toast.success("ซิงค์ปฏิทินเรียบร้อย (เดโม)");
  };

  return (
    <>
      <PageHeader title="Calendar Sync" thai="เชื่อมต่อ Google Calendar"
        description="ซิงค์รายการที่ครบกำหนดเข้าปฏิทินส่วนตัว (โหมดเดโม ยังไม่ได้เชื่อมต่อบัญชี Google จริง)" />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">โหมดเดโม</AlertTitle>
        <AlertDescription className="text-info/90">
          การเชื่อมต่อจริงต้องใช้ Google OAuth ในเวอร์ชันโปรดักชัน หน้านี้เป็นเพียงการแสดงสิ่งที่จะซิงค์
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

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">เลือกรายการที่จะซิงค์</h3>
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2.5">
              <div><div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.thai}</div></div>
              <Switch checked={c.enabled} onCheckedChange={(v) =>
                setCats(cats.map((x) => x.id === c.id ? { ...x, enabled: v } : x))} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
