import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { useTick } from "@/lib/store";

const toneClass = (s: string) =>
  s === "danger" ? "bg-destructive" :
  s === "warning" ? "bg-warning" :
  s === "success" ? "bg-success" : "bg-primary";

export function NotificationCenter() {
  useTick();
  const nav = useNavigate();
  const items = buildNotifications();
  const urgent = items.filter((i) => i.severity === "danger" || i.severity === "warning").length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          {urgent > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold grid place-items-center">
              {urgent}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="px-4 py-3 border-b">
          <div className="font-semibold text-sm">การแจ้งเตือน</div>
          <div className="text-xs text-muted-foreground">ทั้งหมด {items.length} • ต้องดำเนินการ {urgent}</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y">
          {items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</div>
          )}
          {items.map((n) => (
            <button key={n.id} onClick={() => nav(n.link)}
              className="w-full text-left px-4 py-3 hover:bg-secondary/60 flex gap-3">
              <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", toneClass(n.severity))} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground truncate">{n.detail}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{n.category} • {n.date}</div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
