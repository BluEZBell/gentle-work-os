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
