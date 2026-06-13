import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import {
  defaultTemplate, daysBetween, validateStages, LT_STATUSES,
  type LtStage, type LtStatus,
} from "@/lib/leadTimeStore";
import { GanttPreview } from "./GanttPreview";
import { cn } from "@/lib/utils";

interface Props {
  value: LtStage[];
  onChange: (stages: LtStage[]) => void;
  startHint?: string;
}

export function LeadTimePlanning({ value, onChange, startHint }: Props) {
  const [stages, setStages] = useState<LtStage[]>(value);
  useEffect(() => setStages(value), [value]);

  const push = (next: LtStage[]) => { setStages(next); onChange(next); };

  const applyTemplate = () => push(defaultTemplate(startHint));
  const addRow = () => {
    const last = stages[stages.length - 1];
    const baseStart = last?.end ?? startHint ?? new Date().toISOString().slice(0, 10);
    const s = new Date(baseStart); s.setDate(s.getDate() + 1);
    const e = new Date(s); e.setDate(e.getDate() + 2);
    push([...stages, {
      id: `st-${Math.random().toString(36).slice(2, 8)}`,
      name: "ขั้นตอนใหม่",
      start: s.toISOString().slice(0, 10),
      end: e.toISOString().slice(0, 10),
      duration: 3,
      owner: "", note: "", status: "ยังไม่เริ่ม",
    }]);
  };
  const remove = (i: number) => push(stages.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<LtStage>) => {
    const next = stages.slice();
    next[i] = { ...next[i], ...patch };
    // recompute duration if start/end changed
    if (patch.start || patch.end) {
      next[i].duration = Math.max(1, daysBetween(next[i].start, next[i].end));
    } else if (patch.duration != null) {
      const e = new Date(next[i].start);
      e.setDate(e.getDate() + Math.max(1, patch.duration) - 1);
      next[i].end = e.toISOString().slice(0, 10);
    }
    push(next);
  };

  const v = validateStages(stages);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Label className="text-sm font-semibold">แผนระยะเวลางาน (Lead Time)</Label>
          <p className="text-xs text-muted-foreground">วางแผน Design / Order / Check / Delivery สำหรับงาน Make-to-Order</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={applyTemplate}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> ใช้ Template Lead Time
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มขั้นตอน
          </Button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีแผนระยะเวลา — กด <b>ใช้ Template Lead Time</b> เพื่อเริ่มต้น
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">ขั้นตอน</th>
                  <th className="p-2 text-left w-32">เริ่ม</th>
                  <th className="p-2 text-left w-32">สิ้นสุด</th>
                  <th className="p-2 text-right w-16">วัน</th>
                  <th className="p-2 text-left w-32">ผู้รับผิดชอบ</th>
                  <th className="p-2 text-left w-32">สถานะ</th>
                  <th className="p-2 text-left">หมายเหตุ</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-1"><Input value={s.name} onChange={(e) => update(i, { name: e.target.value })} className="h-8" /></td>
                    <td className="p-1"><Input type="date" value={s.start} onChange={(e) => update(i, { start: e.target.value })} className="h-8" /></td>
                    <td className="p-1"><Input type="date" value={s.end} onChange={(e) => update(i, { end: e.target.value })} className="h-8" /></td>
                    <td className="p-1"><Input type="number" min={1} value={s.duration} onChange={(e) => update(i, { duration: Number(e.target.value) })} className="h-8 text-right" /></td>
                    <td className="p-1"><Input value={s.owner} onChange={(e) => update(i, { owner: e.target.value })} placeholder="—" className="h-8" /></td>
                    <td className="p-1">
                      <Select value={s.status} onValueChange={(v) => update(i, { status: v as LtStatus })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{LT_STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-1"><Input value={s.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="—" className="h-8" /></td>
                    <td className="p-1">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(v.errors.length > 0 || v.warnings.length > 0) && (
            <div className={cn("rounded-md border p-2 text-xs flex gap-2",
              v.errors.length > 0 ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-amber-300 bg-amber-50 text-amber-800")}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <ul className="space-y-0.5">
                {v.errors.map((er, i) => <li key={`e${i}`}>• {er}</li>)}
                {v.warnings.map((w, i) => <li key={`w${i}`}>• {w}</li>)}
              </ul>
            </div>
          )}

          <div className="border rounded-md p-3 bg-secondary/20">
            <div className="text-xs font-semibold mb-2">Gantt พรีวิว</div>
            <GanttPreview stages={stages} />
          </div>
        </>
      )}
    </div>
  );
}
