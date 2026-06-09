import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { findCustomer } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface Props {
  customerId?: string;
  className?: string;
  showLock?: boolean;
  muted?: boolean;
  fallback?: string;
}

/** Clickable customer name that links back to the Customer 360 page. */
export function CustomerLink({ customerId, className, showLock = true, muted, fallback = "—" }: Props) {
  if (!customerId) return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  const c = findCustomer(customerId);
  if (!c) return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  return (
    <Link
      to={`/customers/${c.id}`}
      className={cn(
        "inline-flex items-center gap-1 hover:underline",
        muted ? "text-foreground/80 hover:text-primary" : "text-primary",
        className,
      )}
    >
      {showLock && c.confidential && <Lock className="w-3 h-3 text-warning" />}
      <span className="truncate">{c.name}</span>
    </Link>
  );
}
