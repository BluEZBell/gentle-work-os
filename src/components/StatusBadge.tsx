import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted" | "primary";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning-foreground border-warning/30",
  danger: "bg-destructive-soft text-destructive border-destructive/20",
  info: "bg-info-soft text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-accent text-accent-foreground border-primary/10",
};

const map: Record<string, Tone> = {
  // Deals
  "New Lead": "muted", "Contacted": "info", "Need Quotation": "warning",
  "Quotation Sent": "info", "Negotiation": "warning",
  "Won": "success", "Lost": "danger", "Failed": "danger",
  // Quotations
  "Draft": "muted", "Sent": "info", "Accepted": "success", "Rejected": "danger", "Expired": "warning",
  // Jobs
  "Pending": "muted", "In Progress": "info", "Waiting Supplier": "warning",
  "Waiting Customer": "warning", "Delivered": "success", "Closed": "success", "Problem": "danger",
  // Bills
  "Unpaid": "warning", "Paid": "success", "Overdue": "danger",
  "Pending Review": "warning", "Approved": "success", "Rejected ": "danger",
  // Service
  "Upcoming": "info", "Due": "warning", "Completed": "success", "Missed": "danger",
  // Risk
  "Low": "success", "Medium": "warning", "High": "danger",
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  const t = tone ?? map[status] ?? "muted";
  return (
    <Badge variant="outline" className={cn("font-medium border", toneClasses[t], className)}>
      {status}
    </Badge>
  );
}
