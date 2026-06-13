// Phase 3D — Quotation Lead Time + Gantt Planning mock store.
// Demo only. No persistence. Connects Quotation → Lead Time → Calendar.
import { useEffect, useState } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
const bump = () => listeners.forEach((l) => l());
export function useLtTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

export type LtStatus = "ยังไม่เริ่ม" | "กำลังทำ" | "เสร็จแล้ว" | "ล่าช้า" | "รอตรวจสอบ";
export const LT_STATUSES: LtStatus[] = ["ยังไม่เริ่ม", "กำลังทำ", "เสร็จแล้ว", "ล่าช้า", "รอตรวจสอบ"];

export const LT_STATUS_COLOR: Record<LtStatus, { bar: string; chip: string; dot: string }> = {
  "ยังไม่เริ่ม": { bar: "bg-gray-400",    chip: "bg-gray-100 text-gray-700 border-gray-200",       dot: "bg-gray-400" },
  "กำลังทำ":   { bar: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500" },
  "เสร็จแล้ว":  { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "ล่าช้า":     { bar: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200",        dot: "bg-rose-500" },
  "รอตรวจสอบ":  { bar: "bg-amber-500",   chip: "bg-amber-50 text-amber-800 border-amber-200",     dot: "bg-amber-500" },
};

export interface LtStage {
  id: string;
  name: string;
  start: string;       // YYYY-MM-DD
  end: string;
  duration: number;    // days
  owner: string;
  note: string;
  status: LtStatus;
  calendarEventId?: string;
}

export interface LeadTimePlan {
  quotationId: string;
  stages: LtStage[];
  itemBindings: Record<string, string>;  // itemId → group/stage id (optional)
  expectedDelivery?: string;
  calendarLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

// keyed by quotationId
const plans: Record<string, LeadTimePlan> = {};

export function getPlan(quotationId: string): LeadTimePlan | undefined {
  return plans[quotationId];
}

export function setPlan(quotationId: string, stages: LtStage[], itemBindings: Record<string, string> = {}) {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const existing = plans[quotationId];
  const deliveryStage = stages.find((s) => /deliver|delivery|ส่งมอบ/i.test(s.name));
  plans[quotationId] = {
    quotationId,
    stages,
    itemBindings,
    expectedDelivery: deliveryStage?.end ?? stages[stages.length - 1]?.end,
    calendarLinked: existing?.calendarLinked ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  bump();
  return plans[quotationId];
}

export function defaultTemplate(startDate?: string): LtStage[] {
  const start = startDate ? new Date(startDate) : new Date();
  const mkStage = (name: string, offsetStart: number, dur: number): LtStage => {
    const s = new Date(start); s.setDate(s.getDate() + offsetStart);
    const e = new Date(s); e.setDate(e.getDate() + dur - 1);
    return {
      id: `st-${name.replace(/\W/g, "").toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      start: s.toISOString().slice(0, 10),
      end: e.toISOString().slice(0, 10),
      duration: dur,
      owner: "",
      note: "",
      status: "ยังไม่เริ่ม",
    };
  };
  return [
    mkStage("Design / Detail", 0, 5),
    mkStage("Order", 5, 10),
    mkStage("Check", 15, 3),
    mkStage("Delivery", 18, 2),
  ];
}

export function daysBetween(a: string, b: string): number {
  const x = new Date(a).getTime();
  const y = new Date(b).getTime();
  return Math.round((y - x) / 86400000) + 1;
}

export interface LtValidation { ok: boolean; errors: string[]; warnings: string[]; }
export function validateStages(stages: LtStage[]): LtValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  stages.forEach((s, i) => {
    if (new Date(s.end) < new Date(s.start)) errors.push(`${s.name}: วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม`);
    if (s.duration <= 0) errors.push(`${s.name}: จำนวนวันต้องมากกว่า 0`);
    if (i > 0) {
      const prev = stages[i - 1];
      if (new Date(s.start) < new Date(prev.end)) {
        warnings.push(`${s.name} เริ่มก่อน ${prev.name} จะจบ (ซ้อนทับ)`);
      }
    }
  });
  const last = stages[stages.length - 1];
  if (last && !/deliver|delivery|ส่งมอบ/i.test(last.name)) {
    warnings.push("ขั้นตอนสุดท้ายควรเป็น Delivery / ส่งมอบ");
  }
  return { ok: errors.length === 0, errors, warnings };
}

// ---------- Calendar integration ----------
export interface LtCalendarEvent {
  id: string;
  quotationId: string;
  quotationNumber: string;
  customerShortName: string;
  stageId: string;
  stageName: string;
  date: string;     // start date
  endDate: string;
}
export const ltCalendarEvents: LtCalendarEvent[] = [];

export function addPlanToCalendar(
  quotationId: string,
  quotationNumber: string,
  customerShortName: string,
) {
  const plan = plans[quotationId];
  if (!plan) return [];
  // remove old
  for (let i = ltCalendarEvents.length - 1; i >= 0; i--) {
    if (ltCalendarEvents[i].quotationId === quotationId) ltCalendarEvents.splice(i, 1);
  }
  const created: LtCalendarEvent[] = [];
  plan.stages.forEach((s) => {
    const ev: LtCalendarEvent = {
      id: `lt-${quotationId}-${s.id}`,
      quotationId,
      quotationNumber,
      customerShortName,
      stageId: s.id,
      stageName: s.name,
      date: s.start,
      endDate: s.end,
    };
    ltCalendarEvents.push(ev);
    s.calendarEventId = ev.id;
    created.push(ev);
  });
  plan.calendarLinked = true;
  bump();
  return created;
}

export function ltEventTitle(e: LtCalendarEvent) {
  return `🤖 ${e.customerShortName} ${e.quotationNumber} ${e.stageName}`;
}
