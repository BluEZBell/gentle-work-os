// Phase 3C — Billing Note + Receipt + Billing Reminder mock store.
// Demo only. No persistence. Connects PO-sourced Invoices to BN/Receipt flow.
import { useEffect, useState } from "react";
import { poInvoices, type PoInvoice } from "./customerPoStore";
import { billingRules } from "./mockCalendar";

type Listener = () => void;
const listeners = new Set<Listener>();
const bump = () => listeners.forEach((l) => l());
export function useBnTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

// ---------- Billing Note ----------
export type BnStatus = "Draft" | "Submitted" | "Partially Paid" | "Paid" | "Completed";
export const BN_STATUS_TH: Record<BnStatus, string> = {
  Draft: "ร่าง", Submitted: "วางบิลแล้ว", "Partially Paid": "รับชำระบางส่วน",
  Paid: "รับชำระแล้ว", Completed: "ปิดบัญชี",
};

export interface BillingNote {
  id: string;
  number: string;
  customerId: string;
  contactName?: string;
  billingDate: string;            // วันที่เอกสาร
  submissionDate: string;         // วันวางบิล (editable)
  expectedPaymentDate: string;    // วันคาดรับชำระ
  address: string;
  taxId: string;
  branch: string;
  invoiceIds: string[];           // linked invoice IDs (from poInvoices)
  total: number;
  notes: string;
  internalNote: string;
  status: BnStatus;
  createdAt: string;
  createdBy: string;
}

export const billingNotes: BillingNote[] = [];

export interface CreateBnPayload {
  number: string;
  customerId: string;
  contactName?: string;
  billingDate: string;
  submissionDate: string;
  expectedPaymentDate: string;
  address: string;
  taxId: string;
  branch: string;
  invoiceIds: string[];
  notes: string;
  internalNote: string;
}

export function createBillingNote(p: CreateBnPayload, user: string): BillingNote {
  const total = poInvoices.filter((i) => p.invoiceIds.includes(i.id)).reduce((s, i) => s + i.total, 0);
  const bn: BillingNote = {
    id: uid("bn"), number: p.number, customerId: p.customerId, contactName: p.contactName,
    billingDate: p.billingDate, submissionDate: p.submissionDate, expectedPaymentDate: p.expectedPaymentDate,
    address: p.address, taxId: p.taxId, branch: p.branch,
    invoiceIds: [...p.invoiceIds], total, notes: p.notes, internalNote: p.internalNote,
    status: "Draft", createdAt: stamp(), createdBy: user,
  };
  billingNotes.unshift(bn);
  bump();
  return bn;
}

export function updateBillingNote(id: string, patch: Partial<BillingNote>) {
  const bn = billingNotes.find((x) => x.id === id);
  if (!bn) return;
  Object.assign(bn, patch);
  bump();
}

export function deleteBillingNote(id: string) {
  const i = billingNotes.findIndex((x) => x.id === id);
  if (i >= 0) { billingNotes.splice(i, 1); bump(); }
}

export const findBn = (id: string) => billingNotes.find((b) => b.id === id);
export const bnsFor = (customerId: string) => billingNotes.filter((b) => b.customerId === customerId);
export const bnsForInvoice = (invId: string) => billingNotes.filter((b) => b.invoiceIds.includes(invId));

export function nextBnNumber(): string {
  const n = billingNotes.length + 1;
  return `BN-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

// ---------- Receipt ----------
export const PAYMENT_METHODS = ["เงินสด", "โอนธนาคาร", "เช็ค", "อื่น ๆ"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface Receipt {
  id: string;
  number: string;
  customerId: string;
  contactName?: string;
  invoiceId: string;            // primary invoice
  billingNoteId?: string;
  receiptDate: string;
  paymentReceivedDate: string;
  method: PaymentMethod;
  methodOther?: string;
  bankAccount?: string;
  amount: number;
  whtAmount: number;
  notes: string;
  internalNote: string;
  createdAt: string;
  createdBy: string;
}

export const receipts: Receipt[] = [];
// Track invoice payment state independently from PoInvoice base type to avoid mutation conflicts.
export const invoicePaid = new Set<string>();

export interface CreateReceiptPayload {
  number: string;
  customerId: string;
  contactName?: string;
  invoiceId: string;
  billingNoteId?: string;
  receiptDate: string;
  paymentReceivedDate: string;
  method: PaymentMethod;
  methodOther?: string;
  bankAccount?: string;
  amount: number;
  whtAmount: number;
  notes: string;
  internalNote: string;
}

export function createReceipt(p: CreateReceiptPayload, user: string): Receipt {
  const r: Receipt = {
    id: uid("rc"), number: p.number, customerId: p.customerId, contactName: p.contactName,
    invoiceId: p.invoiceId, billingNoteId: p.billingNoteId,
    receiptDate: p.receiptDate, paymentReceivedDate: p.paymentReceivedDate,
    method: p.method, methodOther: p.methodOther, bankAccount: p.bankAccount,
    amount: p.amount, whtAmount: p.whtAmount, notes: p.notes, internalNote: p.internalNote,
    createdAt: stamp(), createdBy: user,
  };
  receipts.unshift(r);
  invoicePaid.add(p.invoiceId);
  if (p.billingNoteId) {
    const bn = findBn(p.billingNoteId);
    if (bn) {
      const allPaid = bn.invoiceIds.every((id) => invoicePaid.has(id));
      bn.status = allPaid ? "Paid" : "Partially Paid";
    }
  }
  bump();
  return r;
}

export function updateReceipt(id: string, patch: Partial<Receipt>) {
  const r = receipts.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, patch);
  bump();
}

export function deleteReceipt(id: string) {
  const i = receipts.findIndex((x) => x.id === id);
  if (i >= 0) {
    const r = receipts[i];
    invoicePaid.delete(r.invoiceId);
    receipts.splice(i, 1);
    bump();
  }
}

export const findReceipt = (id: string) => receipts.find((r) => r.id === id);
export const receiptsFor = (customerId: string) => receipts.filter((r) => r.customerId === customerId);
export const receiptsForInvoice = (invId: string) => receipts.filter((r) => r.invoiceId === invId);
export const receiptsForBn = (bnId: string) => receipts.filter((r) => r.billingNoteId === bnId);

export function nextReceiptNumber(): string {
  const n = receipts.length + 1;
  return `RCP-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

export function isInvoicePaid(invId: string): boolean {
  return invoicePaid.has(invId);
}

// ---------- Outstanding AR (mock) ----------
export function arOutstandingFor(customerId: string): number {
  return poInvoices
    .filter((i) => i.customerId === customerId && !invoicePaid.has(i.id))
    .reduce((s, i) => s + i.total, 0);
}

// ---------- Billing Reminders ----------
export type ReminderKind = "before-submit" | "on-submit" | "overdue-submit" | "expect-payment";
export const REMINDER_LABEL: Record<ReminderKind, string> = {
  "before-submit": "แจ้งเตือนก่อนวันวางบิล",
  "on-submit": "แจ้งเตือนในวันวางบิล",
  "overdue-submit": "เลยกำหนดวางบิลแล้วยังไม่ได้วางบิล",
  "expect-payment": "วันคาดว่าจะรับเงิน",
};

export interface BillingReminder {
  id: string;
  bnId: string;
  customerId: string;
  bnNumber: string;
  date: string;
  kind: ReminderKind;
  fromBillingRule: boolean;
}

export const billingReminders: BillingReminder[] = [];

export function createRemindersForBn(bn: BillingNote): BillingReminder[] {
  const rule = billingRules[bn.customerId];
  const fromRule = !!rule;
  const submit = bn.submissionDate;
  const dminus = (n: number) => {
    const d = new Date(submit); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const made: BillingReminder[] = [
    { id: uid("rem"), bnId: bn.id, customerId: bn.customerId, bnNumber: bn.number, date: dminus(2), kind: "before-submit", fromBillingRule: fromRule },
    { id: uid("rem"), bnId: bn.id, customerId: bn.customerId, bnNumber: bn.number, date: submit, kind: "on-submit", fromBillingRule: fromRule },
    { id: uid("rem"), bnId: bn.id, customerId: bn.customerId, bnNumber: bn.number, date: dminus(-1), kind: "overdue-submit", fromBillingRule: fromRule },
    { id: uid("rem"), bnId: bn.id, customerId: bn.customerId, bnNumber: bn.number, date: bn.expectedPaymentDate, kind: "expect-payment", fromBillingRule: fromRule },
  ];
  billingReminders.push(...made);
  bump();
  return made;
}

export const remindersForBn = (bnId: string) => billingReminders.filter((r) => r.bnId === bnId);
export const remindersForCustomer = (cid: string) => billingReminders.filter((r) => r.customerId === cid);

// ---------- Print log ----------
export interface BnPrintLogEntry {
  id: string;
  documentType: "Billing Note" | "Receipt";
  relatedId: string;
  copyType: "ต้นฉบับ" | "สำเนา";
  copies: number;
  printedBy: string;
  printedAt: string;
}
export const bnPrintLog: BnPrintLogEntry[] = [];
export function logPrint(e: Omit<BnPrintLogEntry, "id" | "printedAt"> & { printedAt?: string }) {
  bnPrintLog.unshift({ id: uid("pl"), printedAt: e.printedAt ?? stamp(), ...e });
  bump();
}
export const printLogFor = (relatedId: string) => bnPrintLog.filter((p) => p.relatedId === relatedId);

// ---------- Linked Calendar Events (mock, additive) ----------
export interface BnCalendarEvent {
  id: string;
  bnId: string;
  date: string;
  title: string;
  kind: "submit" | "expect-payment";
}
export const bnCalendarEvents: BnCalendarEvent[] = [];
export function addBnCalendarEvents(bn: BillingNote, opts: { addSubmit: boolean; addPayment: boolean }) {
  const sn = (bn.customerId || "TNC").slice(0, 3).toUpperCase();
  const out: BnCalendarEvent[] = [];
  if (opts.addSubmit) out.push({ id: uid("bnev"), bnId: bn.id, date: bn.submissionDate, title: `🤖 ${sn} วางบิล ${bn.number}`, kind: "submit" });
  if (opts.addPayment) out.push({ id: uid("bnev"), bnId: bn.id, date: bn.expectedPaymentDate, title: `🤖 ${sn} คาดว่าจะรับเงิน ${bn.invoiceIds[0] ? poInvoices.find((p) => p.id === bn.invoiceIds[0])?.number ?? bn.number : bn.number}`, kind: "expect-payment" });
  bnCalendarEvents.push(...out);
  bump();
  return out;
}
export const bnEventsFor = (cid: string) => bnCalendarEvents.filter((e) => {
  const bn = findBn(e.bnId);
  return bn && bn.customerId === cid;
});

// ---------- Notifications (mock, additive) ----------
export interface BnNotif {
  id: string;
  bnId: string;
  customerId: string;
  invoiceId?: string;
  title: string;
  detail: string;
  date: string;
  severity: "info" | "warning" | "danger" | "success";
  link: string;
  category: "Billing";
  kind: ReminderKind;
}
export const bnNotifications: BnNotif[] = [];

export function addNotificationsForBn(bn: BillingNote) {
  const list: BnNotif[] = [
    { id: uid("n"), bnId: bn.id, customerId: bn.customerId, title: "วางบิลใกล้ถึงกำหนด", detail: `${bn.number} วางบิล ${bn.submissionDate}`, date: bn.submissionDate, severity: "info", link: `/billing-notes/${bn.id}`, category: "Billing", kind: "before-submit" },
    { id: uid("n"), bnId: bn.id, customerId: bn.customerId, title: "วันนี้ต้องวางบิล", detail: `${bn.number} ลูกค้า ${bn.contactName ?? ""}`, date: bn.submissionDate, severity: "warning", link: `/billing-notes/${bn.id}`, category: "Billing", kind: "on-submit" },
    { id: uid("n"), bnId: bn.id, customerId: bn.customerId, title: "เลยกำหนดวางบิล", detail: `${bn.number} ยังไม่ได้วางบิล`, date: bn.submissionDate, severity: "danger", link: `/billing-notes/${bn.id}`, category: "Billing", kind: "overdue-submit" },
    { id: uid("n"), bnId: bn.id, customerId: bn.customerId, invoiceId: bn.invoiceIds[0], title: "คาดว่าจะรับเงิน", detail: `${bn.number} วันที่ ${bn.expectedPaymentDate}`, date: bn.expectedPaymentDate, severity: "success", link: `/billing-notes/${bn.id}`, category: "Billing", kind: "expect-payment" },
  ];
  bnNotifications.unshift(...list);
  bump();
  return list;
}
