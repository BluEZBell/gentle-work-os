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

// ===================== Related-record counts =====================
export const relatedForCustomer = (id: string) => ({
  contacts: contacts.filter((x) => x.customerId === id).length,
  deals: deals.filter((x) => x.customerId === id).length,
  jobs: jobs.filter((x) => x.customerId === id).length,
  invoices: customerInvoices.filter((x) => x.customerId === id).length,
});
export const relatedForSupplier = (id: string) => ({
  bills: supplierBills.filter((x) => x.supplierId === id).length,
  jobs: jobs.filter((x) => x.supplierId === id).length,
  pos: purchaseOrders.filter((x) => x.supplierId === id).length,
});
export const relatedForJob = (id: string) => ({
  invoices: customerInvoices.filter((x) => x.jobId === id).length,
  pos: purchaseOrders.filter((x) => x.jobId === id).length,
  changeOrders: changeOrders.filter((x) => x.jobId === id).length,
});
export const relatedForBill = (id: string) => ({
  // payment vouchers live in mockCalendar — leave for caller to format
  job: supplierBills.find((b) => b.id === id)?.jobId,
});

export const relatedWarning = (counts: Record<string, number | string | undefined>) => {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(counts)) {
    if (typeof v === "number" && v > 0) parts.push(`${v} ${k}`);
  }
  return parts.length ? `มีรายการเกี่ยวข้อง: ${parts.join(", ")} — ความสัมพันธ์จะถูกตัด` : undefined;
};

// ===================== Generic remove/duplicate =====================
const removeFromArr = <T extends { id: string }>(arr: T[], id: string) => {
  const idx = arr.findIndex((x) => x.id === id); if (idx >= 0) arr.splice(idx, 1);
};

// Customers
export const removeCustomer = (id: string, user: string) => {
  const c = customers.find((x) => x.id === id); if (!c) return;
  removeFromArr(customers, id); audit(user, "Delete Customer", c.name, "Customers"); bump();
};
export const duplicateCustomer = (id: string, user: string) => {
  const c = customers.find((x) => x.id === id); if (!c) return;
  const n: Customer = { ...c, id: uid("c"), name: c.name + " (สำเนา)", createdAt: today(), updatedAt: today() };
  customers.push(n); audit(user, "Duplicate Customer", n.name, "Customers"); bump(); return n;
};

// Contacts
export const removeContact = (id: string, user: string) => {
  const c = contacts.find((x) => x.id === id); if (!c) return;
  removeFromArr(contacts, id); audit(user, "Delete Contact", c.name, "Contacts"); bump();
};
export const duplicateContact = (id: string, user: string) => {
  const c = contacts.find((x) => x.id === id); if (!c) return;
  const n: Contact = { ...c, id: uid("ct"), name: c.name + " (สำเนา)" };
  contacts.push(n); audit(user, "Duplicate Contact", n.name, "Contacts"); bump(); return n;
};
export const updateContact = (id: string, patch: Partial<Contact>, user: string) => {
  const c = contacts.find((x) => x.id === id); if (!c) return;
  Object.assign(c, patch); audit(user, "Edit Contact", c.name, "Contacts"); bump();
};

// Suppliers
export const removeSupplier = (id: string, user: string) => {
  const s = suppliers.find((x) => x.id === id); if (!s) return;
  removeFromArr(suppliers, id); audit(user, "Delete Supplier", s.name, "Suppliers"); bump();
};
export const duplicateSupplier = (id: string, user: string) => {
  const s = suppliers.find((x) => x.id === id); if (!s) return;
  const n: Supplier = { ...s, id: uid("s"), name: s.name + " (สำเนา)" };
  suppliers.push(n); audit(user, "Duplicate Supplier", n.name, "Suppliers"); bump(); return n;
};
export const updateSupplier = (id: string, patch: Partial<Supplier>, user: string) => {
  const s = suppliers.find((x) => x.id === id); if (!s) return;
  Object.assign(s, patch); audit(user, "Edit Supplier", s.name, "Suppliers"); bump();
};

// Deals
export const removeDeal = (id: string, user: string) => {
  const d = deals.find((x) => x.id === id); if (!d) return;
  removeFromArr(deals, id); audit(user, "Delete Deal", d.name, "Deals"); bump();
};
export const duplicateDeal = (id: string, user: string) => {
  const d = deals.find((x) => x.id === id); if (!d) return;
  const n: Deal = { ...d, id: uid("d"), name: d.name + " (สำเนา)", status: "New Lead" };
  deals.push(n); audit(user, "Duplicate Deal", n.name, "Deals"); bump(); return n;
};

// Jobs
export const removeJob = (id: string, user: string) => {
  const j = jobs.find((x) => x.id === id); if (!j) return;
  removeFromArr(jobs, id); audit(user, "Delete Job", j.number, "Jobs"); bump();
};
export const duplicateJob = (id: string, user: string) => {
  const j = jobs.find((x) => x.id === id); if (!j) return;
  const number = "JOB-2026-" + String(20 + jobs.length).padStart(3, "0");
  const n: Job = { ...j, id: uid("j"), number, name: j.name + " (สำเนา)", status: "Pending", deliveryDate: undefined };
  jobs.push(n); audit(user, "Duplicate Job", number, "Jobs"); bump(); return n;
};
export const updateJob = (id: string, patch: Partial<Job>, user: string) => {
  const j = jobs.find((x) => x.id === id); if (!j) return;
  Object.assign(j, patch); audit(user, "Edit Job", j.number, "Jobs"); bump();
};

// Supplier Bills
export const removeBill = (id: string, user: string) => {
  const b = supplierBills.find((x) => x.id === id); if (!b) return;
  removeFromArr(supplierBills, id); audit(user, "Delete Supplier Bill", b.number, "Supplier Bills"); bump();
};
export const duplicateBill = (id: string, user: string) => {
  const b = supplierBills.find((x) => x.id === id); if (!b) return;
  const number = b.number.replace(/(\d+)$/, (m) => String(Number(m) + 100).padStart(m.length, "0"));
  const n: SupplierBill = { ...b, id: uid("b"), number, status: "Unpaid", reviewStatus: "Pending Review" };
  supplierBills.push(n); audit(user, "Duplicate Supplier Bill", number, "Supplier Bills"); bump(); return n;
};

// Parts
export const removePart = (id: string, user: string) => {
  const p = parts.find((x) => x.id === id); if (!p) return;
  removeFromArr(parts, id); audit(user, "Delete Part", p.name, "Parts"); bump();
};
export const duplicatePart = (id: string, user: string) => {
  const p = parts.find((x) => x.id === id); if (!p) return;
  const n: Part = { ...p, id: uid("p"), name: p.name + " (สำเนา)", number: p.number + "-COPY" };
  parts.push(n); audit(user, "Duplicate Part", n.name, "Parts"); bump(); return n;
};

// Change Orders
export const removeChangeOrder = (id: string, user: string) => {
  const c = changeOrders.find((x) => x.id === id); if (!c) return;
  removeFromArr(changeOrders, id); audit(user, "Delete Change Order", c.number, "Change Orders"); bump();
};
export const duplicateChangeOrder = (id: string, user: string) => {
  const c = changeOrders.find((x) => x.id === id); if (!c) return;
  const number = c.number.replace(/(\d+)$/, (m) => String(Number(m) + 100).padStart(m.length, "0"));
  const n: ChangeOrder = { ...c, id: uid("co"), number, approvalStatus: "Pending" };
  changeOrders.push(n); audit(user, "Duplicate Change Order", number, "Change Orders"); bump(); return n;
};

// Assets
export const removeAsset = (id: string, user: string) => {
  const a = assets.find((x) => x.id === id); if (!a) return;
  removeFromArr(assets, id); audit(user, "Delete Asset", a.name, "Assets"); bump();
};
export const duplicateAsset = (id: string, user: string) => {
  const a = assets.find((x) => x.id === id); if (!a) return;
  const code = a.code.replace(/(\d+)$/, (m) => String(Number(m) + 100).padStart(m.length, "0"));
  const n: Asset = { ...a, id: uid("a"), code, name: a.name + " (สำเนา)", monthsInService: 0 };
  assets.push(n); audit(user, "Duplicate Asset", n.name, "Assets"); bump(); return n;
};
