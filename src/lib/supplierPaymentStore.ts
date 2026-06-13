// Phase 3E: Supplier / Maker Payment Planning store (mock only).
import { useEffect, useState } from "react";
import { suppliers, supplierBills, jobs, findSupplier } from "./mockData";
import { purchaseOrders } from "./mockBusiness";

export type SupplierKind = "Supplier" | "Maker" | "Both";
export const SUPPLIER_KIND_TH: Record<SupplierKind, string> = {
  Supplier: "Supplier (ผู้ขายของ / วัสดุ)",
  Maker: "Maker (ผู้รับทำงาน)",
  Both: "Supplier + Maker (ทั้งขายของและรับทำงาน)",
};

export type InstallmentStatus =
  | "รอวางบิล" | "วางบิลแล้ว" | "รอจ่าย" | "จ่ายบางส่วน"
  | "จ่ายแล้ว" | "เลยกำหนด" | "เลื่อนไปงวดถัดไป";

export interface Installment {
  id: string;
  no: number;
  percent: number;
  gross: number;
  wht: number;
  net: number;
  billingDueDate: string;
  paymentDueDate: string;
  status: InstallmentStatus;
  notes?: string;
  voucherId?: string;
}

export interface PaymentPlan {
  id: string;
  supplierId: string;
  poId?: string;
  billId?: string;
  jobId?: string;
  totalAmount: number;
  whtEnabled: boolean;
  whtRate: number; // %
  installments: Installment[];
  createdAt: string;
  notes?: string;
}

export interface BillingRule {
  openDay: number;        // วันเปิดรับวางบิล
  closeDay: number;       // วันปิดรับวางบิล
  rolloverIfLate: boolean;
  payDay: number;
  paymentTerm: string;
  deliveryMethod: "ส่งเอง" | "Email" | "Line" | "ไปรษณีย์" | "Portal" | "อื่น ๆ";
  documents: string[];
  notes?: string;
}

const DEFAULT_DOC_CHECKLIST = ["ใบแจ้งหนี้", "ใบวางบิล", "ใบกำกับภาษี", "ใบส่งของ"];

// Reactive ticks
type L = () => void;
const listeners = new Set<L>();
const bump = () => listeners.forEach((l) => l());
export function useSupPayTick() {
  const [, set] = useState(0);
  useEffect(() => { const l = () => set((n) => n + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
}

// In-memory maps keyed by supplier id
export const supplierKinds: Record<string, SupplierKind> = {
  s1: "Supplier", s2: "Maker", s3: "Both",
};
export const billingRules: Record<string, BillingRule> = {
  s1: { openDay: 25, closeDay: 5, rolloverIfLate: true, payDay: 30, paymentTerm: "30 Days",
        deliveryMethod: "Email", documents: [...DEFAULT_DOC_CHECKLIST] },
  s2: { openDay: 1, closeDay: 10, rolloverIfLate: true, payDay: 25, paymentTerm: "Cash",
        deliveryMethod: "Line", documents: [...DEFAULT_DOC_CHECKLIST, "ใบหัก ณ ที่จ่าย"] },
  s3: { openDay: 20, closeDay: 28, rolloverIfLate: true, payDay: 15, paymentTerm: "60 Days",
        deliveryMethod: "ส่งเอง", documents: [...DEFAULT_DOC_CHECKLIST] },
};

export const setSupplierKind = (id: string, k: SupplierKind) => { supplierKinds[id] = k; bump(); };
export const getSupplierKind = (id: string): SupplierKind => supplierKinds[id] ?? "Supplier";
export const defaultWhtRate = (id: string): number =>
  getSupplierKind(id) === "Maker" || getSupplierKind(id) === "Both" ? 3 : 0;

export const setBillingRule = (id: string, r: Partial<BillingRule>) => {
  billingRules[id] = { ...(billingRules[id] ?? {
    openDay: 25, closeDay: 5, rolloverIfLate: true, payDay: 30, paymentTerm: "30 Days",
    deliveryMethod: "Email", documents: [...DEFAULT_DOC_CHECKLIST],
  }), ...r };
  bump();
};

// Plans
export const paymentPlans: PaymentPlan[] = [];

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, n: number) => {
  const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
};

export interface SupPayCalendarEvent {
  id: string; date: string; title: string; kind: "bill" | "pay"; planId: string; supplierId: string;
}
export const supPayCalendarEvents: SupPayCalendarEvent[] = [];

export interface SupPayNotif {
  id: string; title: string; detail: string; date: string;
  severity: "info" | "warning" | "danger" | "success"; link: string; category: string;
}
export const supPayNotifications: SupPayNotif[] = [];

const addCalendarFor = (plan: PaymentPlan) => {
  const sup = findSupplier(plan.supplierId);
  const tag = (sup?.name ?? "Supplier").slice(0, 3).toUpperCase();
  plan.installments.forEach((i) => {
    supPayCalendarEvents.push({
      id: uid("spe"), date: i.billingDueDate, kind: "bill", planId: plan.id, supplierId: plan.supplierId,
      title: `🤖 ${tag} วางบิล ${getSupplierKind(plan.supplierId)} งวด ${i.no}`,
    });
    supPayCalendarEvents.push({
      id: uid("spe"), date: i.paymentDueDate, kind: "pay", planId: plan.id, supplierId: plan.supplierId,
      title: `🤖 ${tag} จ่าย ${getSupplierKind(plan.supplierId)} งวด ${i.no} สุทธิ ${i.net.toLocaleString()}`,
    });
  });
};

const addNotifsFor = (plan: PaymentPlan) => {
  const sup = findSupplier(plan.supplierId);
  const kind = getSupplierKind(plan.supplierId);
  plan.installments.forEach((i) => {
    supPayNotifications.push({
      id: uid("spn"), title: "ใกล้วางบิลคู่ค้า",
      detail: `${sup?.name} งวด ${i.no} • ${i.gross.toLocaleString()} บาท`,
      date: i.billingDueDate, severity: "info",
      link: `/payable-forecast`, category: "Payable",
    });
    supPayNotifications.push({
      id: uid("spn"),
      title: kind === "Maker" ? "วันจ่าย Maker (หัก ณ ที่จ่าย 3%)" : "วันจ่ายคู่ค้า",
      detail: `${sup?.name} งวด ${i.no} สุทธิ ${i.net.toLocaleString()} บาท`,
      date: i.paymentDueDate,
      severity: new Date(i.paymentDueDate) < new Date() ? "danger" : "warning",
      link: `/payable-forecast`, category: "Payable",
    });
  });
};

export const createPaymentPlan = (input: {
  supplierId: string; totalAmount: number; whtRate: number; whtEnabled: boolean;
  poId?: string; billId?: string; jobId?: string; notes?: string;
  rows: { percent: number; billingDueDate: string; paymentDueDate: string; notes?: string }[];
}): PaymentPlan => {
  const plan: PaymentPlan = {
    id: uid("pp"), supplierId: input.supplierId, poId: input.poId, billId: input.billId, jobId: input.jobId,
    totalAmount: input.totalAmount, whtEnabled: input.whtEnabled, whtRate: input.whtRate,
    createdAt: today(), notes: input.notes,
    installments: input.rows.map((r, idx) => {
      const gross = Math.round(input.totalAmount * (r.percent / 100));
      const wht = input.whtEnabled ? Math.round(gross * (input.whtRate / 100)) : 0;
      return {
        id: uid("pi"), no: idx + 1, percent: r.percent, gross, wht, net: gross - wht,
        billingDueDate: r.billingDueDate, paymentDueDate: r.paymentDueDate,
        status: "รอวางบิล" as InstallmentStatus, notes: r.notes,
      };
    }),
  };
  paymentPlans.push(plan);
  addCalendarFor(plan);
  addNotifsFor(plan);
  bump();
  return plan;
};

export const updateInstallmentStatus = (planId: string, instId: string, status: InstallmentStatus) => {
  const p = paymentPlans.find((x) => x.id === planId); if (!p) return;
  const i = p.installments.find((x) => x.id === instId); if (!i) return;
  i.status = status; bump();
};

export const linkVoucher = (planId: string, instId: string, voucherId: string) => {
  const p = paymentPlans.find((x) => x.id === planId); if (!p) return;
  const i = p.installments.find((x) => x.id === instId); if (!i) return;
  i.voucherId = voucherId; i.status = "จ่ายแล้ว"; bump();
};

// Monthly forecast helpers
export interface ForecastRow {
  planId: string; installmentId: string;
  supplierId: string; supplierName: string; kind: SupplierKind;
  poId?: string; jobId?: string;
  no: number; gross: number; wht: number; net: number;
  dueDate: string; status: InstallmentStatus;
}

export const forecastForMonth = (year: number, month: number): ForecastRow[] => {
  const rows: ForecastRow[] = [];
  paymentPlans.forEach((p) => {
    p.installments.forEach((i) => {
      const d = new Date(i.paymentDueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const sup = findSupplier(p.supplierId);
        rows.push({
          planId: p.id, installmentId: i.id,
          supplierId: p.supplierId, supplierName: sup?.name ?? "—",
          kind: getSupplierKind(p.supplierId),
          poId: p.poId, jobId: p.jobId,
          no: i.no, gross: i.gross, wht: i.wht, net: i.net,
          dueDate: i.paymentDueDate, status: i.status,
        });
      }
    });
  });
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

// Seed: a couple of demo plans so the page isn't empty
const seed = () => {
  if (paymentPlans.length) return;
  // Maker plan tied to s2 with 3% WHT
  createPaymentPlan({
    supplierId: "s2", totalAmount: 100000, whtEnabled: true, whtRate: 3,
    jobId: "j2", poId: purchaseOrders[0]?.id,
    rows: [
      { percent: 30, billingDueDate: "2026-06-05", paymentDueDate: "2026-06-25" },
      { percent: 40, billingDueDate: "2026-07-05", paymentDueDate: "2026-07-25" },
      { percent: 30, billingDueDate: "2026-08-05", paymentDueDate: "2026-08-25" },
    ],
    notes: "Maker — แบ่งจ่าย 3 งวด หัก ณ ที่จ่าย 3%",
  });
  // Supplier plan tied to s1
  createPaymentPlan({
    supplierId: "s1", totalAmount: 192600, whtEnabled: false, whtRate: 0,
    billId: "b1", jobId: "j1",
    rows: [
      { percent: 50, billingDueDate: "2026-05-30", paymentDueDate: "2026-06-11" },
      { percent: 50, billingDueDate: "2026-06-30", paymentDueDate: "2026-07-11" },
    ],
    notes: "Supplier — จ่ายตามบิล INV-TH-9921",
  });
};
seed();

// Late billing helper: returns true if a billing was submitted after closeDay
export const isLateBilling = (supplierId: string, submittedDate: string): boolean => {
  const rule = billingRules[supplierId]; if (!rule) return false;
  const d = new Date(submittedDate);
  return d.getDate() > rule.closeDay;
};
