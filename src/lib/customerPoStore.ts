// Mock store for Customer PO (PO ลูกค้า) imported via OCR intake.
// Demo-only — no real persistence. Provides records, items, and a mock OCR generator.
import { useEffect, useState } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
const bump = () => listeners.forEach((l) => l());
export function useCustomerPoTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

export const PO_OCR_STATUSES = [
  "Draft OCR", "Waiting Review", "Reviewed", "Imported", "Needs Correction",
] as const;
export type PoOcrStatus = typeof PO_OCR_STATUSES[number];

export const PO_OCR_STATUS_TH: Record<PoOcrStatus, string> = {
  "Draft OCR": "OCR ร่าง",
  "Waiting Review": "รอตรวจสอบ",
  "Reviewed": "ตรวจแล้ว",
  "Imported": "นำเข้าแล้ว",
  "Needs Correction": "ต้องแก้ไข",
};

export type OcrConfidence = "verified" | "review" | "uncertain";
export const CONFIDENCE_TH: Record<OcrConfidence, string> = {
  verified: "ตรวจแล้ว",
  review: "ควรตรวจสอบ",
  uncertain: "ไม่มั่นใจ",
};

export const INVOICE_STATUS_TH = {
  none: "ยังไม่ออก Invoice",
  partial: "ออก Invoice บางส่วน",
  full: "ออก Invoice ครบแล้ว",
} as const;
export type PoInvoiceStatus = keyof typeof INVOICE_STATUS_TH;

export interface CustomerPoItem {
  poItemId: string;
  customerPoId: string;
  customerId: string;
  itemNumber: string;
  description: string;
  deliveryDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  invoicedQuantity: number;
  remainingQuantity: number;
  invoiceStatus: PoInvoiceStatus;
}

export interface CustomerPo {
  id: string;
  number: string;
  customerId: string;
  contactId?: string;
  contactName?: string;
  poDate: string;
  deliveryDate: string;
  currency: string;
  notes?: string;
  fileName?: string;
  ocrStatus: PoOcrStatus;
  createdAt: string;
  createdBy: string;
  total: number;
}

export const customerPos: CustomerPo[] = [];
export const customerPoItems: CustomerPoItem[] = [];

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export interface MockOcrField<T = string> { value: T; confidence: OcrConfidence }
export interface MockOcrItem {
  itemNumber: MockOcrField;
  description: MockOcrField;
  deliveryDate: MockOcrField;
  quantity: MockOcrField<number>;
  unit: MockOcrField;
  unitPrice: MockOcrField<number>;
  amount: MockOcrField<number>;
}
export interface MockOcrResult {
  poNumber: MockOcrField;
  poDate: MockOcrField;
  deliveryDate: MockOcrField;
  currency: MockOcrField;
  notes: MockOcrField;
  items: MockOcrItem[];
}

// Generate a believable mock OCR extraction. Deterministic-ish per call.
export function generateMockOcr(fileName: string): MockOcrResult {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plusDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
  const poNum = "PO-" + Math.floor(Math.random() * 9000 + 1000);
  const samples = [
    { itemNumber: "P-A12", description: "Custom flange S45C 120×80", unit: "pcs", qty: 20, price: 1850 },
    { itemNumber: "P-B07", description: "Shaft sleeve CuSn8", unit: "pcs", qty: 8, price: 2400 },
    { itemNumber: "P-C33", description: "Cover plate AL6061 anodized", unit: "pcs", qty: 12, price: 1100 },
  ];
  return {
    poNumber: { value: poNum, confidence: "verified" },
    poDate: { value: iso(today), confidence: "verified" },
    deliveryDate: { value: plusDays(21), confidence: "review" },
    currency: { value: "THB", confidence: "verified" },
    notes: { value: "ส่งของที่โรงงาน BluePeak — ติดต่อ Khun Wirat ก่อนถึง 1 วัน", confidence: "review" },
    items: samples.map((s, i) => ({
      itemNumber: { value: s.itemNumber, confidence: "verified" },
      description: { value: s.description, confidence: i === 2 ? "uncertain" : "review" },
      deliveryDate: { value: plusDays(21 + i * 3), confidence: "review" },
      quantity: { value: s.qty, confidence: "verified" },
      unit: { value: s.unit, confidence: "verified" },
      unitPrice: { value: s.price, confidence: i === 1 ? "uncertain" : "verified" },
      amount: { value: s.qty * s.price, confidence: i === 1 ? "uncertain" : "verified" },
    })),
  };
}

export interface ImportPayload {
  customerId: string;
  contactId?: string;
  contactName?: string;
  fileName?: string;
  notes?: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  currency: string;
  items: Array<{
    itemNumber: string; description: string; deliveryDate: string;
    quantity: number; unit: string; unitPrice: number; amount: number;
  }>;
}

export function importCustomerPo(p: ImportPayload, user: string): CustomerPo {
  const id = uid("cpo");
  const total = p.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const po: CustomerPo = {
    id, number: p.poNumber, customerId: p.customerId, contactId: p.contactId,
    contactName: p.contactName, poDate: p.poDate, deliveryDate: p.deliveryDate,
    currency: p.currency || "THB", notes: p.notes, fileName: p.fileName,
    ocrStatus: "Imported", createdAt: stamp(), createdBy: user, total,
  };
  customerPos.unshift(po);
  p.items.forEach((it) => {
    customerPoItems.push({
      poItemId: uid("cpoi"), customerPoId: id, customerId: p.customerId,
      itemNumber: it.itemNumber, description: it.description, deliveryDate: it.deliveryDate,
      quantity: Number(it.quantity), unit: it.unit, unitPrice: Number(it.unitPrice), amount: Number(it.amount),
      invoicedQuantity: 0, remainingQuantity: Number(it.quantity), invoiceStatus: "none",
    });
  });
  bump();
  return po;
}

export const customerPosFor = (cid: string) => customerPos.filter((p) => p.customerId === cid);
export const itemsForPo = (poId: string) => customerPoItems.filter((i) => i.customerPoId === poId);
export const findCustomerPo = (id: string) => customerPos.find((p) => p.id === id);

// ============== PO-sourced Invoices (Phase 3B) ==============
export interface PoInvoiceLine {
  id: string; invoiceId: string; poItemId: string;
  itemNumber: string; description: string; quantity: number;
  unit: string; unitPrice: number; amount: number;
}

export interface PoInvoice {
  id: string;
  number: string;
  customerId: string;
  customerPoId: string;
  contactId?: string;
  contactName?: string;
  jobId?: string;
  quotationId?: string;
  date: string;
  dueDate: string;
  paymentTerm: string;
  billingRound: string;
  address: string;
  taxId: string;
  branch: string;
  notes: string;
  internalNote: string;
  discount: number;
  vatRate: number;
  whtRate: number;
  subtotal: number;
  vat: number;
  wht: number;
  total: number;
  customerCopies: number;
  internalCopies: number;
  createdAt: string;
  createdBy: string;
}

export const poInvoices: PoInvoice[] = [];
export const poInvoiceLines: PoInvoiceLine[] = [];

export interface CreatePoInvoicePayload {
  customerId: string;
  customerPoId: string;
  contactId?: string;
  contactName?: string;
  jobId?: string;
  quotationId?: string;
  number: string;
  date: string;
  dueDate: string;
  paymentTerm: string;
  billingRound: string;
  address: string;
  taxId: string;
  branch: string;
  notes: string;
  internalNote: string;
  discount: number;
  vatRate: number;
  whtRate: number;
  customerCopies: number;
  internalCopies: number;
  lines: Array<{ poItemId: string; quantity: number }>;
}

export function createPoInvoice(p: CreatePoInvoicePayload, user: string): PoInvoice {
  const id = uid("pinv");
  const expanded: PoInvoiceLine[] = [];
  let subtotal = 0;
  p.lines.forEach((l) => {
    const it = customerPoItems.find((i) => i.poItemId === l.poItemId);
    if (!it) return;
    const qty = Math.max(0, Math.min(Number(l.quantity) || 0, it.remainingQuantity));
    if (qty <= 0) return;
    const amount = qty * it.unitPrice;
    subtotal += amount;
    expanded.push({
      id: uid("pil"), invoiceId: id, poItemId: it.poItemId,
      itemNumber: it.itemNumber, description: it.description,
      quantity: qty, unit: it.unit, unitPrice: it.unitPrice, amount,
    });
    // Update PO item rollups
    it.invoicedQuantity += qty;
    it.remainingQuantity = Math.max(0, it.quantity - it.invoicedQuantity);
    it.invoiceStatus = it.remainingQuantity <= 0 ? "full"
      : it.invoicedQuantity > 0 ? "partial" : "none";
  });

  const base = Math.max(0, subtotal - (p.discount || 0));
  const vat = +(base * (p.vatRate / 100)).toFixed(2);
  const wht = +(base * (p.whtRate / 100)).toFixed(2);
  const total = +(base + vat - wht).toFixed(2);

  const inv: PoInvoice = {
    id, number: p.number, customerId: p.customerId, customerPoId: p.customerPoId,
    contactId: p.contactId, contactName: p.contactName, jobId: p.jobId, quotationId: p.quotationId,
    date: p.date, dueDate: p.dueDate, paymentTerm: p.paymentTerm, billingRound: p.billingRound,
    address: p.address, taxId: p.taxId, branch: p.branch, notes: p.notes, internalNote: p.internalNote,
    discount: p.discount, vatRate: p.vatRate, whtRate: p.whtRate,
    subtotal, vat, wht, total,
    customerCopies: p.customerCopies, internalCopies: p.internalCopies,
    createdAt: stamp(), createdBy: user,
  };
  poInvoices.unshift(inv);
  poInvoiceLines.push(...expanded);
  bump();
  return inv;
}

export const poInvoicesFor = (cid: string) => poInvoices.filter((i) => i.customerId === cid);
export const poInvoicesForPo = (poId: string) => poInvoices.filter((i) => i.customerPoId === poId);
export const linesForPoInvoice = (invId: string) => poInvoiceLines.filter((l) => l.invoiceId === invId);
export const findPoInvoice = (id: string) => poInvoices.find((i) => i.id === id);

export function updatePoInvoice(id: string, patch: Partial<PoInvoice>) {
  const inv = poInvoices.find((x) => x.id === id);
  if (!inv) return;
  Object.assign(inv, patch);
  bump();
}

export function nextInvoiceNumber(): string {
  const n = poInvoices.length + 1;
  return `INV-PO-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

