import { useState } from "react";
import { Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Att = { id: string; name: string; type: string; uploadedAt: string; module: string; size: string };

const seed: Record<string, Att[]> = {};

const sample = (module: string, id: string): Att[] => {
  const key = `${module}:${id}`;
  if (seed[key]) return seed[key];
  seed[key] = [
    { id: "a1", name: `${module}-${id}-spec.pdf`, type: "pdf", uploadedAt: "2026-05-20", module, size: "182 KB" },
    { id: "a2", name: `${module}-${id}-photo.jpg`, type: "image", uploadedAt: "2026-05-22", module, size: "1.1 MB" },
  ];
  return seed[key];
};

const icon = (t: string) =>
  t === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> :
  t === "xlsx" ? <FileSpreadsheet className="w-4 h-4 text-muted-foreground" /> :
  <FileText className="w-4 h-4 text-muted-foreground" />;

export function Attachments({ module, id }: { module: string; id: string }) {
  const [items, setItems] = useState<Att[]>(sample(module, id));
  const add = () => {
    const n: Att = {
      id: "a" + Math.random().toString(36).slice(2, 6),
      name: `${module}-${id}-note-${items.length + 1}.pdf`,
      type: "pdf", uploadedAt: new Date().toISOString().slice(0, 10),
      module, size: "96 KB",
    };
    const next = [...items, n];
    setItems(next);
    seed[`${module}:${id}`] = next;
    toast.success("แนบไฟล์แล้ว (เดโม)");
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium"><Paperclip className="w-4 h-4" /> Attachments ({items.length})</div>
        <Button size="sm" variant="outline" onClick={add}><Upload className="w-3.5 h-3.5 mr-1.5" />Upload</Button>
      </div>
      <div className="divide-y border rounded-md">
        {items.length === 0 && <div className="p-3 text-xs text-muted-foreground">No attachments yet.</div>}
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            {icon(a.type)}
            <div className="flex-1 min-w-0">
              <div className="truncate">{a.name}</div>
              <div className="text-[11px] text-muted-foreground">{a.module} • {a.uploadedAt} • {a.size}</div>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => toast.info("ดาวน์โหลด (เดโม)")}><Download className="w-3.5 h-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
