// Reactive actions for phase-2 business modules.
import { audit } from "./store";
import {
  activities, quotationRevisions, purchaseOrders, supplierQuotes,
  receivingRecords, customerInvoices, changeOrders, tasks,
  customerLeadSource, dealLeadSource,
  type Activity, type ActivityType, type QuotationRevision, type QuotationRevStatus,
  type PurchaseOrder, type POStatus, type SupplierQuote,
  type ReceivingRecord, type QCStatus, type CustomerInvoice, type InvoiceStatus,
  type ChangeOrder, type ApprovalStatus, type Task, type Priority, type TaskStatus,
  type LeadSource,
} from "./mockBusiness";

// shared bump — reuse listeners through store.ts by re-importing useTick consumers.
// We hook into the same bump by calling audit() (which bumps) when meaningful,
// but mostly we need a local bump. Simpler: expose minimal pub/sub here too.
type L = () => void;
const ls = new Set<L>();
const bump = () => ls.forEach((l) => l());
import { useEffect, useState } from "react";
export function useBizTick() {
  const [, set] = useState(0);
  useEffect(() => { const l = () => set((n) => n + 1); ls.add(l); return () => { ls.delete(l); }; }, []);
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);

// Activities
export const addActivity = (a: Omit<Activity, "id">) => {
  activities.unshift({ ...a, id: uid("ac") }); bump();
};

// Lead source
export const setCustomerLeadSource = (cid: string, src: LeadSource) => { customerLeadSource[cid] = src; bump(); };
export const setDealLeadSource = (did: string, src: LeadSource) => { dealLeadSource[did] = src; bump(); };

// Quotation revisions
export const addQuotationRevision = (r: Omit<QuotationRevision, "id">, user: string) => {
  quotationRevisions.push({ ...r, id: uid("qr") });
  audit(user, "Add Quotation Revision", `Rev.${r.revision} for ${r.quotationId}`, "Quotations");
  bump();
};
export const setRevisionStatus = (id: string, status: QuotationRevStatus) => {
  const r = quotationRevisions.find((x) => x.id === id); if (!r) return;
  r.status = status; bump();
};

// Purchase Orders
export const addPurchaseOrder = (p: Omit<PurchaseOrder, "id">, user: string) => {
  const n: PurchaseOrder = { ...p, id: uid("po") };
  purchaseOrders.push(n); audit(user, "Create Purchase Order", n.number, "Purchase Orders"); bump(); return n;
};
export const setPOStatus = (id: string, status: POStatus, user: string) => {
  const p = purchaseOrders.find((x) => x.id === id); if (!p) return;
  p.status = status; audit(user, "Update PO", `${p.number} → ${status}`, "Purchase Orders"); bump();
};

// Supplier quotes
export const addSupplierQuote = (q: Omit<SupplierQuote, "id">) => {
  supplierQuotes.push({ ...q, id: uid("sq") }); bump();
};
export const selectSupplierQuote = (jobId: string, quoteId: string, reason: string) => {
  supplierQuotes.forEach((q) => { if (q.jobId === jobId) q.selected = (q.id === quoteId); });
  const sel = supplierQuotes.find((q) => q.id === quoteId); if (sel) sel.reasonSelected = reason;
  bump();
};

// Receiving
export const addReceiving = (r: Omit<ReceivingRecord, "id">, user: string) => {
  receivingRecords.push({ ...r, id: uid("rc") });
  audit(user, "Record Receiving", r.poId, "Receiving"); bump();
};
export const setQCStatus = (id: string, status: QCStatus) => {
  const r = receivingRecords.find((x) => x.id === id); if (!r) return;
  r.qcStatus = status; r.needRework = status === "Need Rework";
  r.issueFound = status === "Failed" || status === "Need Rework"; bump();
};

// Customer Invoices
export const addInvoice = (i: Omit<CustomerInvoice, "id">, user: string) => {
  customerInvoices.push({ ...i, id: uid("inv") });
  audit(user, "Create Customer Invoice", i.number, "Invoices"); bump();
};
export const setInvoiceStatus = (id: string, status: InvoiceStatus, user: string) => {
  const i = customerInvoices.find((x) => x.id === id); if (!i) return;
  i.status = status;
  if (status === "Paid") i.paymentDate = today();
  audit(user, "Update Invoice", `${i.number} → ${status}`, "Invoices"); bump();
};

// Change Orders
export const addChangeOrder = (c: Omit<ChangeOrder, "id">, user: string) => {
  changeOrders.push({ ...c, id: uid("co") });
  audit(user, "Create Change Order", c.number, "Change Orders"); bump();
};
export const setChangeOrderStatus = (id: string, status: ApprovalStatus, user: string) => {
  const c = changeOrders.find((x) => x.id === id); if (!c) return;
  c.approvalStatus = status; audit(user, "Update Change Order", `${c.number} → ${status}`, "Change Orders"); bump();
};

// Tasks
export const addTask = (t: Omit<Task, "id">, user: string) => {
  const n = { ...t, id: uid("t") };
  tasks.push(n);
  audit(user, "Create Task", t.name, "Tasks"); bump();
  return n;
};
export const updateTask = (id: string, patch: Partial<Task>, user: string) => {
  const t = tasks.find((x) => x.id === id); if (!t) return;
  Object.assign(t, patch);
  audit(user, "Edit Task", t.name, "Tasks"); bump();
};
export const deleteTask = (id: string, user: string) => {
  const idx = tasks.findIndex((x) => x.id === id); if (idx < 0) return;
  const [t] = tasks.splice(idx, 1);
  audit(user, "Delete Task", t.name, "Tasks"); bump();
};
export const duplicateTask = (id: string, user: string) => {
  const t = tasks.find((x) => x.id === id); if (!t) return;
  const n: Task = { ...t, id: uid("t"), name: t.name + " (สำเนา)", status: "Open" };
  tasks.push(n);
  audit(user, "Duplicate Task", n.name, "Tasks"); bump();
  return n;
};
export const setTaskStatus = (id: string, status: TaskStatus) => {
  const t = tasks.find((x) => x.id === id); if (!t) return;
  t.status = status; bump();
};
export const setTaskPriority = (id: string, p: Priority) => {
  const t = tasks.find((x) => x.id === id); if (!t) return;
  t.priority = p; bump();
};
/** Map taskId -> calendar event id (mock linkage). */
const taskCalendarMap: Record<string, string> = {};
export const isTaskInCalendar = (taskId: string) => !!taskCalendarMap[taskId];
export const calendarTaskIds = () => Object.keys(taskCalendarMap);
/** Push a calendar event for a task. */
export const addTaskCalendarEvent = (taskId: string, user?: string) => {
  const t = tasks.find((x) => x.id === taskId); if (!t) return;
  if (taskCalendarMap[taskId]) return;
  import("./mockCalendar").then(({ calendarEvents }) => {
    const evId = uid("ev");
    calendarEvents.push({
      id: evId,
      date: t.dueDate,
      type: "Customer Follow-up",
      customerId: t.customerId,
      title: `🤖 งาน: ${t.name}`,
      notes: t.note,
      urgent: t.priority === "Urgent",
    });
    taskCalendarMap[taskId] = evId;
    if (user) audit(user, "Add Task to Calendar", t.name, "Tasks");
    bump();
  });
};
export const removeTaskCalendarEvent = (taskId: string, user?: string) => {
  const t = tasks.find((x) => x.id === taskId); if (!t) return;
  const evId = taskCalendarMap[taskId]; if (!evId) return;
  import("./mockCalendar").then(({ calendarEvents }) => {
    const idx = calendarEvents.findIndex((e) => e.id === evId);
    if (idx >= 0) calendarEvents.splice(idx, 1);
    delete taskCalendarMap[taskId];
    if (user) audit(user, "Remove Task from Calendar", t.name, "Tasks");
    bump();
  });
};
