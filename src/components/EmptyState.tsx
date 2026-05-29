import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title, hint, action }: {
  icon?: typeof Inbox; title: string; hint?: string; action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-12 h-12 mx-auto rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="font-medium text-sm">{title}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
