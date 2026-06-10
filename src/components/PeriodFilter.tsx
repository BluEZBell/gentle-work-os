import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { customers as allCustomers } from "@/lib/mockData";

export interface PeriodValue {
  month: string; // "all" | "01".."12"
  year: string;  // "all" | "2024" etc
  from: string;  // "" or YYYY-MM-DD
  to: string;    // "" or YYYY-MM-DD
  customerId: string; // "all" or id
  status: string;     // "all" or value
}

export const defaultPeriod = (): PeriodValue => ({
  month: "all", year: "all", from: "", to: "", customerId: "all", status: "all",
});

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

interface Props {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  statuses?: readonly string[];
  showCustomer?: boolean;
  showStatus?: boolean;
  years?: string[];
  className?: string;
}

export function PeriodFilter({
  value, onChange, statuses, showCustomer = true, showStatus = true,
  years = ["2024", "2025", "2026", "2027"], className,
}: Props) {
  const set = (k: keyof PeriodValue, v: string) => onChange({ ...value, [k]: v });
  const isDirty = value.month !== "all" || value.year !== "all" || value.from || value.to ||
    value.customerId !== "all" || value.status !== "all";
  return (
    <Card className={"card-soft p-3 mb-4 flex flex-wrap gap-2 items-center " + (className ?? "")}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pr-1 shrink-0">
        <Calendar className="w-3.5 h-3.5" /> ช่วงเวลา
      </div>
      <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
        <Select value={value.month} onValueChange={(v) => set("month", v)}>
          <SelectTrigger className="h-9 w-24 sm:w-28 text-xs shrink-0"><SelectValue placeholder="เดือน" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกเดือน</SelectItem>
            {THAI_MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.year} onValueChange={(v) => set("year", v)}>
          <SelectTrigger className="h-9 w-20 sm:w-24 text-xs shrink-0"><SelectValue placeholder="ปี" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกปี</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <Input type="date" value={value.from} onChange={(e) => set("from", e.target.value)} className="h-9 flex-1 min-w-0 sm:flex-none text-xs" style={{ minWidth: 0 }} placeholder="ตั้งแต่" />
          <span className="text-xs text-muted-foreground px-0.5 shrink-0">→</span>
          <Input type="date" value={value.to} onChange={(e) => set("to", e.target.value)} className="h-9 flex-1 min-w-0 sm:flex-none text-xs" style={{ minWidth: 0 }} placeholder="ถึง" />
        </div>
        {showCustomer && (
          <Select value={value.customerId} onValueChange={(v) => set("customerId", v)}>
            <SelectTrigger className="h-9 flex-1 min-w-0 sm:w-44 sm:flex-none text-xs"><SelectValue placeholder="ลูกค้า" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกลูกค้า</SelectItem>
              {allCustomers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {showStatus && statuses && (
          <Select value={value.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="h-9 flex-1 min-w-0 sm:w-40 sm:flex-none text-xs"><SelectValue placeholder="สถานะ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {isDirty && (
          <Button variant="ghost" size="sm" className="h-8 text-xs shrink-0" onClick={() => onChange(defaultPeriod())}>
            <X className="w-3 h-3 mr-1" /> ล้างตัวกรอง
          </Button>
        )}
      </div>
    </Card>
  );
}

/** True if a YYYY-MM-DD date string passes the period filter. */
export function matchesPeriod(date: string | undefined, p: PeriodValue): boolean {
  if (!date) return true;
  const ym = date.slice(0, 7); // YYYY-MM
  const y = date.slice(0, 4);
  const m = date.slice(5, 7);
  if (p.year !== "all" && y !== p.year) return false;
  if (p.month !== "all" && m !== p.month) return false;
  if (p.from && date < p.from) return false;
  if (p.to && date > p.to) return false;
  return true;
}

/** Convenience hook-free filter using memo. */
export function usePeriodFilter<T>(
  items: T[],
  period: PeriodValue,
  pick: (t: T) => { date?: string; customerId?: string; status?: string },
) {
  return useMemo(() => items.filter((it) => {
    const f = pick(it);
    if (!matchesPeriod(f.date, period)) return false;
    if (period.customerId !== "all" && f.customerId !== period.customerId) return false;
    if (period.status !== "all" && f.status !== period.status) return false;
    return true;
  }), [items, period, pick]);
}
