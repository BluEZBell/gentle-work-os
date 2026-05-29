import { Circle } from "lucide-react";

export type TimelineEvent = {
  id: string; date: string; title: string; detail?: string; tone?: "info" | "success" | "warning" | "danger";
};

const toneColor = (t?: string) =>
  t === "success" ? "text-success" :
  t === "warning" ? "text-warning" :
  t === "danger" ? "text-destructive" : "text-primary";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0)
    return <div className="text-xs text-muted-foreground">No activity yet.</div>;
  return (
    <ol className="relative border-l border-border ml-2 space-y-4 py-1">
      {events.map((e) => (
        <li key={e.id} className="ml-5">
          <span className="absolute -left-[7px] mt-1.5 bg-background">
            <Circle className={`w-3.5 h-3.5 ${toneColor(e.tone)}`} fill="currentColor" />
          </span>
          <div className="text-sm font-medium">{e.title}</div>
          {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
          <div className="text-[11px] text-muted-foreground mt-0.5">{e.date}</div>
        </li>
      ))}
    </ol>
  );
}
