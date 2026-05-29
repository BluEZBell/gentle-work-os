// Global search across mock data.
import {
  customers, contacts, deals, quotations, jobs, parts, suppliers,
  supplierBills, serviceRecords,
} from "./mockData";
import { purchaseOrders, customerInvoices, tasks } from "./mockBusiness";

export type SearchHit = {
  id: string; label: string; sub: string; module: string; link: string;
};

export const globalSearch = (q: string): SearchHit[] => {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const m = (txt: string) => txt.toLowerCase().includes(s);
  const out: SearchHit[] = [];
  customers.forEach((c) => (m(c.name) || m(c.contactPerson)) &&
    out.push({ id: c.id, label: c.name, sub: c.contactPerson, module: "Customer", link: `/customers/${c.id}` }));
  contacts.forEach((c) => (m(c.name) || m(c.email)) &&
    out.push({ id: c.id, label: c.name, sub: `${c.role} • ${c.email}`, module: "Contact", link: `/contacts` }));
  deals.forEach((d) => m(d.name) &&
    out.push({ id: d.id, label: d.name, sub: d.status, module: "Deal", link: `/deals` }));
  quotations.forEach((q) => m(q.number) &&
    out.push({ id: q.id, label: q.number, sub: q.status, module: "Quotation", link: `/quotations` }));
  jobs.forEach((j) => (m(j.number) || m(j.name)) &&
    out.push({ id: j.id, label: j.number, sub: j.name, module: "Job", link: `/jobs` }));
  parts.forEach((p) => (m(p.name) || m(p.number)) &&
    out.push({ id: p.id, label: p.name, sub: p.number, module: "Part", link: `/parts` }));
  suppliers.forEach((s2) => m(s2.name) &&
    out.push({ id: s2.id, label: s2.name, sub: s2.contactPerson, module: "Supplier", link: `/suppliers` }));
  supplierBills.forEach((b) => m(b.number) &&
    out.push({ id: b.id, label: b.number, sub: b.status, module: "Bill", link: `/supplier-bills` }));
  purchaseOrders.forEach((p) => m(p.number) &&
    out.push({ id: p.id, label: p.number, sub: p.status, module: "PO", link: `/purchase-orders` }));
  customerInvoices.forEach((i) => m(i.number) &&
    out.push({ id: i.id, label: i.number, sub: i.status, module: "Invoice", link: `/invoices` }));
  serviceRecords.forEach((sv) => (m(sv.partName) || m(sv.partNumber)) &&
    out.push({ id: sv.id, label: sv.partName, sub: sv.partNumber, module: "Service", link: `/service` }));
  tasks.forEach((t) => m(t.name) &&
    out.push({ id: t.id, label: t.name, sub: t.status, module: "Task", link: `/tasks` }));
  return out.slice(0, 30);
};
