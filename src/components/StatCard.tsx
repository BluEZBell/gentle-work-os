import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Tone = "default" | "success" | "warning" | "danger" | "info";

export function StatCard({
  label, thai, value, icon: Icon, tone = "default", hint,
}: {
  label: string; thai?: string; value: React.ReactNode; icon?: LucideIcon;
  tone?: Tone; hint?: string;
}) {
  const toneCls: Record<Tone, string> = {
    default: "bg-accent text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    danger: "bg-destructive-soft text-destructive",
    info: "bg-info-soft text-info",
  };
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {label}{thai && <span className="ml-1 normal-case text-[11px]">({thai})</span>}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-foreground truncate">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-lg grid place-items-center shrink-0", toneCls[tone])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
