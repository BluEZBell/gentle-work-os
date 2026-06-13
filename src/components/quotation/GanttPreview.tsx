import { useMemo, useState } from "react";
import { LT_STATUS_COLOR, LT_STATUSES, type LtStage } from "@/lib/leadTimeStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  stages: LtStage[];
  todayIso?: string;
  /** Hide the view-mode toggle + legend (for very compact embeds) */
  compact?: boolean;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dayDiff(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

export function GanttPreview({ stages, todayIso, compact }: Props) {
  const [view, setView] = useState<"week" | "month">("week");

  const data = useMemo(() => {
    if (stages.length === 0) return null;
    const starts = stages.map((s) => startOfDay(new Date(s.start)));
    const ends = stages.map((s) => startOfDay(new Date(s.end)));
    let min = new Date(Math.min(...starts.map((d) => d.getTime())));
    let max = new Date(Math.max(...ends.map((d) => d.getTime())));
    // pad to month boundaries
    min = new Date(min.getFullYear(), min.getMonth(), 1);
    max = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    const totalDays = dayDiff(min, max) + 1;
    // months
    const months: { label: string; startDay: number; days: number }[] = [];
    let cur = new Date(min);
    while (cur <= max) {
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const clampEnd = monthEnd > max ? max : monthEnd;
      const startDay = dayDiff(min, cur);
      const days = dayDiff(cur, clampEnd) + 1;
      months.push({
        label: `${THAI_MONTHS[cur.getMonth()]} ${cur.getFullYear() + 543}`,
        startDay, days,
      });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    // week ticks (Mondays)
    const weekTicks: number[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(min, i);
      if (d.getDay() === 1) weekTicks.push(i);
    }
    // month tick day-indexes
    const monthTicks = months.map((m) => m.startDay).filter((x) => x > 0);
    return { min, max, totalDays, months, weekTicks, monthTicks };
  }, [stages]);

  if (!data) {
    return <div className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีขั้นตอน</div>;
  }

  const { min, totalDays, months, weekTicks, monthTicks } = data;
  // pixel scale → enables horizontal scroll
  const dayPx = view === "month" ? 14 : 28;
  const chartWidth = totalDays * dayPx;

  const today = todayIso ? startOfDay(new Date(todayIso)) : startOfDay(new Date());
  const todayOffset = dayDiff(min, today);
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const ROW_H = 44;
  const LABEL_W = 168;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">
            ช่วงเวลา: {min.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
            {" → "}
            {data.max.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
            {" • "}{stages.length} ขั้นตอน
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground mr-1">มุมมอง:</span>
            <Button type="button" size="sm" variant={view === "week" ? "default" : "outline"}
              className="h-7 px-2" onClick={() => setView("week")}>สัปดาห์</Button>
            <Button type="button" size="sm" variant={view === "month" ? "default" : "outline"}
              className="h-7 px-2" onClick={() => setView("month")}>เดือน</Button>
          </div>
        </div>
      )}

      {/* Desktop / horizontal-scroll Gantt */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto border rounded-md bg-card">
          <div style={{ width: LABEL_W + chartWidth, minWidth: "100%" }}>
            {/* Month header */}
            <div className="flex border-b bg-secondary/40 sticky top-0">
              <div style={{ width: LABEL_W }} className="shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r">
                ขั้นตอน
              </div>
              <div className="flex" style={{ width: chartWidth }}>
                {months.map((m, i) => (
                  <div key={i} style={{ width: m.days * dayPx }}
                    className="px-2 py-2 text-xs font-semibold border-r last:border-r-0 text-center truncate">
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Day/week label sub-header (week view only) */}
            {view === "week" && (
              <div className="flex border-b bg-secondary/20 text-[10px] text-muted-foreground">
                <div style={{ width: LABEL_W }} className="shrink-0 border-r" />
                <div className="relative" style={{ width: chartWidth, height: 20 }}>
                  {weekTicks.map((d, i) => {
                    const date = addDays(min, d);
                    return (
                      <div key={i} className="absolute top-0 bottom-0 flex items-center pl-1"
                        style={{ left: d * dayPx }}>
                        {date.getDate()} {THAI_MONTHS_SHORT[date.getMonth()]}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Rows */}
            <div className="relative">
              {/* vertical grid lines */}
              <div className="absolute pointer-events-none" style={{ left: LABEL_W, top: 0, bottom: 0, width: chartWidth }}>
                {weekTicks.map((d) => (
                  <div key={`w${d}`} className="absolute top-0 bottom-0 border-l border-border/60"
                    style={{ left: d * dayPx }} />
                ))}
                {monthTicks.map((d) => (
                  <div key={`m${d}`} className="absolute top-0 bottom-0 border-l-2 border-border"
                    style={{ left: d * dayPx }} />
                ))}
                {showToday && (
                  <div className="absolute top-0 bottom-0 z-10" style={{ left: todayOffset * dayPx }}>
                    <div className="w-px h-full bg-primary/70" />
                    <div className="absolute -top-1 -translate-x-1/2 text-[10px] px-1 rounded bg-primary text-primary-foreground whitespace-nowrap">
                      วันนี้
                    </div>
                  </div>
                )}
              </div>
              {stages.map((s) => {
                const sOff = dayDiff(min, startOfDay(new Date(s.start)));
                const eOff = dayDiff(min, startOfDay(new Date(s.end)));
                const left = sOff * dayPx;
                const width = Math.max(dayPx * 0.6, (eOff - sOff + 1) * dayPx);
                const c = LT_STATUS_COLOR[s.status];
                return (
                  <div key={s.id} className="flex border-t" style={{ height: ROW_H }}>
                    <div style={{ width: LABEL_W }}
                      className="shrink-0 px-3 py-2 text-sm font-medium border-r flex items-center bg-card sticky left-0 z-[5]">
                      <span className={cn("w-2 h-2 rounded-full mr-2 shrink-0", c.dot)} />
                      <span className="truncate" title={s.name}>{s.name}</span>
                    </div>
                    <div className="relative" style={{ width: chartWidth }}>
                      <div
                        className={cn("absolute top-1/2 -translate-y-1/2 h-7 rounded-md shadow-sm flex items-center px-2 text-[11px] text-white font-medium overflow-hidden", c.bar)}
                        style={{ left, width }}
                        title={`${s.name}\n${s.start} → ${s.end} (${s.duration} วัน)${s.owner ? `\nผู้รับผิดชอบ: ${s.owner}` : ""}${s.note ? `\nหมายเหตุ: ${s.note}` : ""}`}
                      >
                        <span className="truncate">
                          {s.duration} วัน{s.owner ? ` • ${s.owner}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile — vertical timeline cards */}
      <div className="sm:hidden space-y-2">
        {stages.map((s) => {
          const c = LT_STATUS_COLOR[s.status];
          return (
            <div key={s.id} className="border rounded-md p-3 bg-card">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", c.dot)} />
                  {s.name}
                </div>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", c.chip)}>{s.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.start} → {s.end} • {s.duration} วัน
              </div>
              {s.owner && <div className="text-xs mt-1">ผู้รับผิดชอบ: {s.owner}</div>}
              {s.note && <div className="text-xs text-muted-foreground mt-0.5">หมายเหตุ: {s.note}</div>}
              <div className={cn("h-1.5 rounded mt-2", c.bar)} />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">สถานะ:</span>
          {LT_STATUSES.map((st) => {
            const c = LT_STATUS_COLOR[st];
            return (
              <span key={st} className="inline-flex items-center gap-1.5">
                <span className={cn("w-3 h-3 rounded-sm", c.bar)} />
                {st}
              </span>
            );
          })}
          {showToday && (
            <span className="inline-flex items-center gap-1.5 ml-auto">
              <span className="w-px h-3 bg-primary/70" />
              เส้น "วันนี้"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
