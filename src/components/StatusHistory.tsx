import { StatusBadge } from "@/components/StatusBadge";
import { History } from "lucide-react";

type Entry = { from: string; to: string; by: string; at: string; note?: string };

const seeds: Record<string, Entry[]> = {};

const sample = (key: string): Entry[] => {
  if (seeds[key]) return seeds[key];
  seeds[key] = [
    { from: "—", to: "Draft", by: "Khun Ploy", at: "2026-05-10 09:12", note: "Created" },
    { from: "Draft", to: "Pending Approval", by: "Khun Ploy", at: "2026-05-11 14:25" },
    { from: "Pending Approval", to: "Approved", by: "Khun Somchai", at: "2026-05-12 10:02", note: "Looks good" },
  ];
  return seeds[key];
};

export function StatusHistory({ recordKey }: { recordKey: string }) {
  const items = sample(recordKey);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <History className="w-4 h-4" /> Status history
      </div>
      <div className="border rounded-md divide-y">
        {items.map((e, i) => (
          <div key={i} className="px-3 py-2 text-sm flex flex-wrap items-center gap-2">
            <StatusBadge status={e.from} tone="muted" />
            <span className="text-muted-foreground">→</span>
            <StatusBadge status={e.to} />
            <div className="ml-auto text-xs text-muted-foreground">
              {e.by} • {e.at}
            </div>
            {e.note && <div className="w-full text-xs text-muted-foreground">{e.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
