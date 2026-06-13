import { LT_STATUS_COLOR, type LtStage } from "@/lib/leadTimeStore";
import { cn } from "@/lib/utils";

interface Props {
  stages: LtStage[];
  todayIso?: string;
  compact?: boolean;
}

export function GanttPreview({ stages, todayIso, compact }: Props) {
  if (stages.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีขั้นตอน</div>;
  }
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  const starts = stages.map((s) => new Date(s.start).getTime());
  const ends = stages.map((s) => new Date(s.end).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = Math.max(1, max - min);
  const todayPct = ((new Date(today).getTime() - min) / span) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  return (
    <div className="space-y-1">
      {/* Desktop / tablet — Gantt bars */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[140px_1fr] gap-2 text-[11px] text-muted-foreground mb-1 px-1">
          <div>ขั้นตอน</div>
          <div className="flex justify-between">
            <span>{new Date(min).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}</span>
            <span>{new Date(max).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
        <div className="space-y-1.5 relative">
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary/60 z-10 pointer-events-none"
              style={{ left: `calc(140px + 8px + (100% - 140px - 8px) * ${todayPct / 100})` }}
            >
              <div className="text-[10px] text-primary -mt-3 -ml-3">today</div>
            </div>
          )}
          {stages.map((s) => {
            const sPct = ((new Date(s.start).getTime() - min) / span) * 100;
            const ePct = ((new Date(s.end).getTime() - min) / span) * 100;
            const widthPct = Math.max(2, ePct - sPct);
            const c = LT_STATUS_COLOR[s.status];
            return (
              <div key={s.id} className="grid grid-cols-[140px_1fr] gap-2 items-center">
                <div className="text-xs truncate" title={s.name}>{s.name}</div>
                <div className="relative h-6 bg-secondary/40 rounded">
                  <div
                    className={cn("absolute h-full rounded shadow-sm flex items-center px-2 text-[10px] text-white font-medium", c.bar)}
                    style={{ left: `${sPct}%`, width: `${widthPct}%` }}
                    title={`${s.start} → ${s.end} (${s.duration} วัน)`}
                  >
                    {!compact && <span className="truncate">{s.duration}d</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Mobile — vertical cards */}
      <div className="sm:hidden space-y-2">
        {stages.map((s) => {
          const c = LT_STATUS_COLOR[s.status];
          return (
            <div key={s.id} className="border rounded-md p-2.5 bg-card">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm">{s.name}</div>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", c.chip)}>{s.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.start} → {s.end} • {s.duration} วัน
              </div>
              <div className={cn("h-1.5 rounded mt-2", c.bar)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
