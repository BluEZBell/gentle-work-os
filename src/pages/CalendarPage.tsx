import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { reminders } from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { Bell, CalendarClock } from "lucide-react";

const windows = [
  { label: "เกินกำหนด", filter: (r: typeof reminders[number]) => r.severity === "danger", tone: "danger" as const },
  { label: "ใกล้ครบกำหนด (ภายใน 7 วัน)", filter: (r: typeof reminders[number]) => r.severity === "warning", tone: "warning" as const },
  { label: "กำลังจะถึง (14–60 วัน)", filter: (r: typeof reminders[number]) => r.severity === "info", tone: "info" as const },
];

const timings = ["60d", "30d", "14d", "7d", "1d", "Due", "Overdue"];

export default function CalendarPage() {
  useTick();
  return (
    <>
      <PageHeader title="Calendar" thai="ปฏิทิน"
        description="ระบบจะแจ้งเตือนล่วงหน้า 60, 30, 14, 7, 1 วัน ก่อนถึงกำหนด และเมื่อเกินกำหนด"
      />

      <Card className="card-soft p-5 mb-4">
        <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-3">ตารางการแจ้งเตือน</div>
        <div className="flex items-center gap-2 flex-wrap">
          {timings.map((t, i) => (
            <span key={t} className={
              "px-3 py-1 rounded-full text-xs font-medium border " +
              (t === "Overdue" ? "bg-destructive-soft text-destructive border-destructive/30"
                : t === "Due" ? "bg-warning-soft text-warning-foreground border-warning/40"
                : "bg-info-soft text-info border-info/30")
            }>
              {t}{i < timings.length - 1 && ""}
            </span>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {windows.map(({ label, filter, tone }) => {
          const items = reminders.filter(filter);
          if (!items.length) return null;
          return (
            <Card key={label} className="card-soft p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{label}</h3>
                <StatusBadge status={`${items.length}`} tone={tone} />
              </div>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.type}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{r.date}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
