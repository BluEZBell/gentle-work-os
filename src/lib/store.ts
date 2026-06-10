// Lightweight reactive store on top of the in-memory mockData arrays.
// Mutates the exported arrays directly so existing imports keep working, then
// notifies subscribers so React components re-render via useTick().
import { useEffect, useState } from "react";
import {
  customers, contacts, deals, quotations, jobs, suppliers, supplierBills,
  serviceRecords, reminders, auditLogs, parts,
  type Customer, type Contact, type Deal, type DealStatus, type Quotation,
  type Job, type JobStatus, type Supplier, type SupplierBill, type ReviewStatus,
  type ServiceRecord, type Reminder, type AuditLog, type Part,
} from "./mockData";
import {
  customerInvoices, changeOrders, purchaseOrders,
  type ChangeOrder,
} from "./mockBusiness";
import { assets, type Asset } from "./mockExtended";

type Listener = () => void;
const listeners = new Set<Listener>();
const bump = () => listeners.forEach((l) => l());

export function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);
const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export const audit = (
  user: string, action: string, entity: string, module: string,
  status: AuditLog["status"] = "OK"
) => {
  auditLogs.unshift({ id: uid("a"), user, action, entity, module, status,
    ip: "10.0.1." + (20 + Math.floor(Math.random() * 30)), timestamp: stamp() });
};

// Customers
export const addCustomer = (c: Omit<Customer, "id" | "createdAt" | "updatedAt">, user: string) => {
  const n: Customer = { ...c, id: uid("c"), createdAt: today(), updatedAt: today() };
  customers.push(n);
  audit(user, "Create Customer", n.name, "Customers");
  bump(); return n;
};
export const updateCustomer = (id: string, patch: Partial<Customer>, user: string) => {
  const c = customers.find((x) => x.id === id); if (!c) return;
  Object.assign(c, patch, { updatedAt: today() });
  audit(user, "Edit Customer", c.name, "Customers");
  bump();
};

// Contacts
export const addContact = (c: Omit<Contact, "id">, user: string) => {
  const n: Contact = { ...c, id: uid("ct") };
  contacts.push(n); audit(user, "Create Contact", n.name, "Contacts"); bump(); return n;
};

// Deals
export const addDeal = (d: Omit<Deal, "id">, user: string) => {
  const n: Deal = { ...d, id: uid("d") };
  deals.push(n); audit(user, "Create Deal", n.name, "Deals"); bump(); return n;
};
export const setDealStatus = (id: string, status: DealStatus, user: string, reasonLost?: string) => {
  const d = deals.find((x) => x.id === id); if (!d) return;
  d.status = status; if (reasonLost) d.reasonLost = reasonLost;
  audit(user, "Change Deal Status", `${d.name} → ${status}`, "Deals"); bump();
};

// Quotations
export const addQuotation = (q: Omit<Quotation, "id">, user: string) => {
  const n: Quotation = { ...q, id: uid("q") };
  quotations.push(n); audit(user, "Create Quotation", n.number, "Quotations"); bump(); return n;
};

// Jobs
export const createJobFromDeal = (dealId: string, user: string) => {
  const d = deals.find((x) => x.id === dealId); if (!d) return;
  const q = quotations.find((x) => x.dealId === dealId);
  const number = "JOB-2026-" + String(20 + jobs.length).padStart(3, "0");
  const n: Job = {
    id: uid("j"), number, name: d.name, customerId: d.customerId,
    quotationId: q?.id ?? "", startDate: today(),
    dueDate: today(), status: "Pending",
    supplierId: suppliers[0].id, actualCost: Math.round(d.estimatedValue * 0.55),
    sellPrice: d.estimatedValue, notes: "Auto-created from won deal",
  };
  jobs.push(n); audit(user, "Create Job", number, "Jobs"); bump(); return n;
};
export const setJobStatus = (id: string, status: JobStatus, user: string) => {
  const j = jobs.find((x) => x.id === id); if (!j) return;
  j.status = status;
  if (status === "Delivered" && !j.deliveryDate) j.deliveryDate = today();
  audit(user, "Update Job", `${j.number} → ${status}`, "Jobs"); bump();
};
export const createServiceFromJob = (jobId: string, user: string) => {
  const j = jobs.find((x) => x.id === jobId); if (!j) return;
  const delivery = j.deliveryDate ?? today();
  const dueDate = new Date(delivery); dueDate.setFullYear(dueDate.getFullYear() + 1);
  const warrantyEnd = dueDate.toISOString().slice(0, 10);
  const n: ServiceRecord = {
    id: uid("sv"), customerId: j.customerId, jobId: j.id,
    partName: j.name, partNumber: j.number,
    deliveryDate: delivery, warrantyStart: delivery, warrantyEnd,
    calibrationDueDate: warrantyEnd, firstYearFree: true,
    renewalPrice: Math.round(j.sellPrice * 0.2), status: "Upcoming", opportunity: true,
  };
  serviceRecords.push(n);
  reminders.unshift({
    id: uid("r"), type: "Service / Calibration Due",
    title: `${j.name} — annual reminder`, date: warrantyEnd,
    refId: n.id, severity: "info",
  });
  audit(user, "Create Service Reminder", j.number, "Service"); bump(); return n;
};

// Suppliers
export const addSupplier = (s: Omit<Supplier, "id">, user: string) => {
  const n: Supplier = { ...s, id: uid("s") };
  suppliers.push(n); audit(user, "Create Supplier", n.name, "Suppliers"); bump(); return n;
};

// Bills
export const addBill = (b: Omit<SupplierBill, "id">, user: string) => {
  const n: SupplierBill = { ...b, id: uid("b") };
  supplierBills.push(n); audit(user, "Create Supplier Bill", n.number, "Supplier Bills"); bump(); return n;
};
export const setBillReview = (id: string, review: ReviewStatus, user: string) => {
  const b = supplierBills.find((x) => x.id === id); if (!b) return;
  b.reviewStatus = review;
  audit(user, review === "Approved" ? "Approve Supplier Bill" : "Reject Supplier Bill", b.number, "Supplier Bills");
  bump();
};
export const markBillPaid = (id: string, user: string) => {
  const b = supplierBills.find((x) => x.id === id); if (!b) return;
  b.status = "Paid"; audit(user, "Mark Bill Paid", b.number, "Supplier Bills"); bump();
};

// Parts
export const addPart = (p: Omit<Part, "id">, user: string) => {
  const n: Part = { ...p, id: uid("p") };
  parts.push(n); audit(user, "Create Part", n.name, "Parts"); bump(); return n;
};

// Reminders
export const addReminder = (r: Omit<Reminder, "id">) => {
  reminders.unshift({ ...r, id: uid("r") }); bump();
};
