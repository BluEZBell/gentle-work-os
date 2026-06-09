import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="breadcrumb" className={cn("flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-3", className)}>
      <Link to="/" className="inline-flex items-center hover:text-foreground"><Home className="w-3.5 h-3.5" /></Link>
      {items.map((it, idx) => (
        <span key={idx} className="inline-flex items-center gap-1">
          <ChevronRight className="w-3 h-3 opacity-60" />
          {it.to ? (
            <Link to={it.to} className="hover:text-foreground hover:underline truncate max-w-[200px]">{it.label}</Link>
          ) : (
            <span className="text-foreground truncate max-w-[260px]">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
