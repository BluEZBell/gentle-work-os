import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Calendar, CalendarIcon, X } from "lucide-react";
import { customers as allCustomers } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export interface PeriodValue {
  month: string;
  year: string;
  from: string; // YYYY-MM-DD
  to: string;
  customerId: string;
  status: string;
}

export const defaultPeriod = (): PeriodValue => ({
  month: "all", year: "all", from: "", to: "", customerId: "all", status: "all",
});

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const toDDMMYYYY = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};
const isoFromDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseIso = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

interface DateBtnProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}
function DateButton({ label, value, onChange }: DateBtnProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 rounded-md px-2.5 text-xs font-normal gap-1.5 justify-between shrink-0",
            "w-[140px] tabular-nums",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            <span className="text-muted-foreground mr-1">{label}</span>
            {value ? toDDMMYYYY(value) : "วว-ดด-ปปปป"}
          </span>
          <CalendarIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <CalendarPicker
          mode="single"
          selected={parseIso(value)}
          onSelect={(d) => onChange(d ? isoFromDate(d) : "")}
          initialFocus
          className="pointer-events-auto"
        />
        {value && (
          <div className="p-2 border-t flex justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange("")}>
              <X className="w-3 h-3 mr-1" /> ล้างวันที่
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

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
        <div className="flex items-center gap-1.5 flex-wrap">
          <DateButton label="ตั้งแต่" value={value.from} onChange={(v) => set("from", v)} />
          <span className="text-xs text-muted-foreground shrink-0">→</span>
          <DateButton label="ถึง" value={value.to} onChange={(v) => set("to", v)} />
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

export function matchesPeriod(date: string | undefined, p: PeriodValue): boolean {
  if (!date) return true;
  const y = date.slice(0, 4);
  const m = date.slice(5, 7);
  if (p.year !== "all" && y !== p.year) return false;
  if (p.month !== "all" && m !== p.month) return false;
  if (p.from && date < p.from) return false;
  if (p.to && date > p.to) return false;
  return true;
}

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
