// Phase-2 business modules — mock data only.
import { customers, deals, jobs, suppliers, quotations } from "./mockData";

export const LEAD_SOURCES = ["Facebook", "LINE", "Referral", "Existing Customer", "Website", "Partner", "Other"] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

// ---------- Activities ----------
export const ACTIVITY_TYPES = ["Call", "Email", "LINE message", "Meeting", "Follow-up", "Quotation sent", "Customer replied", "Internal note"] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export interface Activity {
  id: string; date: string; type: ActivityType; user: string;
  customerId?: string; dealId?: string; jobId?: string; quotationId?: string;
  note: string; nextFollowUp?: string;
}

export const activities: Activity[] = [
  { id: "ac1", date: "2026-05-28", type: "Call", user: "Khun Ploy", customerId: "c1", dealId: "d1", note: "Confirmed delivery window for Batch 12", nextFollowUp: "2026-06-05" },
  { id: "ac2", date: "2026-05-26", type: "LINE message", user: "Khun Somchai", customerId: "c2", dealId: "d2", note: "Sent revised bracket spec on LINE", nextFollowUp: "2026-05-30" },
  { id: "ac3", date: "2026-05-22", type: "Meeting", user: "Khun Somchai", customerId: "c3", dealId: "d3", note: "Met procurement team. Price negotiation ongoing.", nextFollowUp: "2026-06-02" },
  { id: "ac4", date: "2026-05-20", type: "Quotation sent", user: "Khun Ploy", customerId: "c3", dealId: "d3", quotationId: "q3", note: "QT-2026-0051 sent" },
  { id: "ac5", date: "2026-05-18", type: "Customer replied", user: "Khun Ploy", customerId: "c2", quotationId: "q2", note: "Customer asked for 5% discount" },
  { id: "ac6", date: "2026-05-15", type: "Internal note", user: "Khun Somchai", jobId: "j1", note: "Material arrived from Thanasak, starting machining tomorrow" },
];

// ---------- Quotation Revisions ----------
export type QuotationRevStatus = "Draft" | "Sent" | "Accepted" | "Rejected";
export interface QuotationRevision {
  id: string; quotationId: string; revision: number; date: string;
  reason: string; previousTotal: number; newTotal: number; status: QuotationRevStatus;
}
export const quotationRevisions: QuotationRevision[] = [
  { id: "qr1", quotationId: "q2", revision: 1, date: "2026-05-08", reason: "Initial quotation", previousTotal: 0, newTotal: 220000, status: "Sent" },
  { id: "qr2", quotationId: "q2", revision: 2, date: "2026-05-19", reason: "Customer requested 5% discount", previousTotal: 220000, newTotal: 209000, status: "Sent" },
  { id: "qr3", quotationId: "q3", revision: 1, date: "2026-05-18", reason: "Initial quotation", previousTotal: 0, newTotal: 95000, status: "Sent" },
  { id: "qr4", quotationId: "q1", revision: 1, date: "2026-04-15", reason: "Initial quotation", previousTotal: 0, newTotal: 480000, status: "Accepted" },
  { id: "qr5", quotationId: "q1", revision: 2, date: "2026-04-20", reason: "Added mounting plates", previousTotal: 480000, newTotal: 480000, status: "Accepted" },
];

// ---------- Work Specs (per job) ----------
export interface WorkSpec {
  jobId: string; scope: string; material: string; size: string; quantity: string;
  specialRequirement: string; included: string[]; excluded: string[];
  customerNote: string; attachmentName?: string;
}
export const workSpecs: WorkSpec[] = [
  { jobId: "j1", scope: "Machine 50 precision jigs to drawing PJ-A-12 rev. C", material: "S45C steel, hardened", size: "120 × 80 × 30 mm", quantity: "50 pcs",
    specialRequirement: "Tolerance ±0.02 mm. Anodize black.", included: ["Material", "Machining", "Heat treatment", "Surface finish", "QC report"],
    excluded: ["Shipping insurance", "On-site installation"], customerNote: "Match previous batch finish exactly.", attachmentName: "PJ-A-12-rev-C.pdf" },
  { jobId: "j2", scope: "Annual ISO calibration for line A instruments", material: "—", size: "—", quantity: "1 service",
    specialRequirement: "Issue traceable certificate.", included: ["On-site visit", "Calibration", "Certificate"],
    excluded: ["Repairs"], customerNote: "Schedule on a Saturday." },
  { jobId: "j3", scope: "Cast and finish 8 marine bushings", material: "Bronze CuSn8", size: "Ø60 × 90 mm", quantity: "8 pcs",
    specialRequirement: "Salt-spray pass 96h", included: ["Casting", "Finishing", "QC"], excluded: ["Installation"], customerNote: "" },
  { jobId: "j4", scope: "Build tooling for custom brackets — batch run", material: "Tool steel", size: "Mold 300 × 200 mm", quantity: "1 tool",
    specialRequirement: "Match sample SBR-22.", included: ["Mold", "Trial run 10 pcs"], excluded: ["Production volume"], customerNote: "Tooling becomes property of customer." },
];

// ---------- Purchase Orders ----------
export const PO_STATUSES = ["Draft", "Sent", "Confirmed", "Partially Received", "Received", "Cancelled"] as const;
export type POStatus = typeof PO_STATUSES[number];

export interface POItem { id: string; name: string; qty: number; unitCost: number; }
export interface PurchaseOrder {
  id: string; number: string; supplierId: string; jobId: string;
  date: string; expectedDelivery: string; status: POStatus; items: POItem[];
}
export const purchaseOrders: PurchaseOrder[] = [
  { id: "po1", number: "PO-2026-021", supplierId: "s1", jobId: "j1", date: "2026-05-12", expectedDelivery: "2026-05-25", status: "Received",
    items: [{ id: "pi1", name: "S45C billet 120×80×35", qty: 60, unitCost: 1800 }, { id: "pi2", name: "Anodize service", qty: 50, unitCost: 320 }] },
  { id: "po2", number: "PO-2026-024", supplierId: "s1", jobId: "j4", date: "2026-05-20", expectedDelivery: "2026-06-10", status: "Sent",
    items: [{ id: "pi3", name: "Tool steel block", qty: 1, unitCost: 38000 }, { id: "pi4", name: "Mold base", qty: 1, unitCost: 22000 }] },
  { id: "po3", number: "PO-2026-019", supplierId: "s3", jobId: "j3", date: "2026-03-20", expectedDelivery: "2026-04-01", status: "Received",
    items: [{ id: "pi5", name: "CuSn8 bar", qty: 10, unitCost: 7200 }] },
  { id: "po4", number: "PO-2026-025", supplierId: "s2", jobId: "j2", date: "2026-04-05", expectedDelivery: "2026-04-22", status: "Confirmed",
    items: [{ id: "pi6", name: "Calibration on-site service", qty: 1, unitCost: 25000 }] },
  { id: "po5", number: "PO-2026-026", supplierId: "s1", jobId: "j4", date: "2026-05-25", expectedDelivery: "2026-06-15", status: "Draft",
    items: [{ id: "pi7", name: "Inserts (set of 4)", qty: 1, unitCost: 6500 }] },
];
export const poTotal = (po: PurchaseOrder) => po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);

// ---------- Supplier Quotation Compare (per job) ----------
export interface SupplierQuote {
  id: string; jobId: string; supplierId: string; quotedCost: number;
  leadTimeDays: number; paymentTerm: string; qualityNote: string;
  selected: boolean; reasonSelected?: string;
}
export const supplierQuotes: SupplierQuote[] = [
  { id: "sq1", jobId: "j1", supplierId: "s1", quotedCost: 188000, leadTimeDays: 12, paymentTerm: "30 Days", qualityNote: "Stable supplier, ISO 9001", selected: true, reasonSelected: "Best balance of price and quality" },
  { id: "sq2", jobId: "j1", supplierId: "s3", quotedCost: 172000, leadTimeDays: 22, paymentTerm: "60 Days", qualityNote: "Cheaper but longer lead time", selected: false },
  { id: "sq3", jobId: "j4", supplierId: "s1", quotedCost: 60500, leadTimeDays: 18, paymentTerm: "30 Days", qualityNote: "Reliable", selected: true, reasonSelected: "Existing tooling relationship" },
  { id: "sq4", jobId: "j4", supplierId: "s3", quotedCost: 58000, leadTimeDays: 25, paymentTerm: "60 Days", qualityNote: "QC variance noted last batch", selected: false },
  { id: "sq5", jobId: "j3", supplierId: "s3", quotedCost: 72000, leadTimeDays: 20, paymentTerm: "60 Days", qualityNote: "Foundry specialist", selected: true, reasonSelected: "Only viable bronze caster" },
];

// ---------- Receiving / QC ----------
export const QC_STATUSES = ["Pending", "Passed", "Failed", "Need Rework"] as const;
export type QCStatus = typeof QC_STATUSES[number];

export interface ReceivingRecord {
  id: string; poId: string; jobId: string; receivedDate: string;
  receivedQty: number; qcStatus: QCStatus; qcNote: string;
  issueFound: boolean; needRework: boolean;
}
export const receivingRecords: ReceivingRecord[] = [
  { id: "rc1", poId: "po1", jobId: "j1", receivedDate: "2026-05-24", receivedQty: 60, qcStatus: "Passed", qcNote: "Dimensions OK, surface OK", issueFound: false, needRework: false },
  { id: "rc2", poId: "po3", jobId: "j3", receivedDate: "2026-04-01", receivedQty: 10, qcStatus: "Need Rework", qcNote: "2 castings out of tolerance", issueFound: true, needRework: true },
  { id: "rc3", poId: "po4", jobId: "j2", receivedDate: "2026-04-22", receivedQty: 1, qcStatus: "Passed", qcNote: "Certificate received", issueFound: false, needRework: false },
];

// ---------- Customer Invoices ----------
export const INVOICE_STATUSES = ["Unpaid", "Partially Paid", "Paid", "Overdue"] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export interface CustomerInvoice {
  id: string; number: string; customerId: string; jobId: string;
  date: string; dueDate: string; amount: number; vat: number; total: number;
  status: InvoiceStatus; paymentDate?: string;
}
export const customerInvoices: CustomerInvoice[] = [
  { id: "inv1", number: "INV-CT-0042", customerId: "c2", jobId: "j2", date: "2026-04-25", dueDate: "2026-05-25", amount: 60000, vat: 4200, total: 64200, status: "Paid", paymentDate: "2026-05-20" },
  { id: "inv2", number: "INV-CT-0046", customerId: "c1", jobId: "j1", date: "2026-05-20", dueDate: "2026-06-19", amount: 240000, vat: 16800, total: 256800, status: "Partially Paid" },
  { id: "inv3", number: "INV-CT-0040", customerId: "c5", jobId: "j3", date: "2026-04-10", dueDate: "2026-05-10", amount: 160000, vat: 11200, total: 171200, status: "Overdue" },
  { id: "inv4", number: "INV-CT-0048", customerId: "c2", jobId: "j4", date: "2026-05-25", dueDate: "2026-06-24", amount: 110000, vat: 7700, total: 117700, status: "Unpaid" },
];

// ---------- Change Orders ----------
export const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export interface ChangeOrder {
  id: string; number: string; jobId: string; requestedBy: string;
  requestDate: string; description: string;
  costImpact: number; timelineImpactDays: number;
  approvalStatus: ApprovalStatus; additionalQuotationRequired: boolean;
}
export const changeOrders: ChangeOrder[] = [
  { id: "co1", number: "CO-2026-007", jobId: "j1", requestedBy: "Customer (Khun Anan)", requestDate: "2026-05-22", description: "Add 10 extra jigs to current batch", costImpact: 56000, timelineImpactDays: 4, approvalStatus: "Approved", additionalQuotationRequired: false },
  { id: "co2", number: "CO-2026-008", jobId: "j4", requestedBy: "Customer (Khun Wirat)", requestDate: "2026-05-26", description: "Change bracket angle from 30° to 25°", costImpact: 18000, timelineImpactDays: 7, approvalStatus: "Pending", additionalQuotationRequired: true },
  { id: "co3", number: "CO-2026-009", jobId: "j3", requestedBy: "Internal (Production)", requestDate: "2026-04-03", description: "Rework 2 bushings out of tolerance", costImpact: 4500, timelineImpactDays: 3, approvalStatus: "Approved", additionalQuotationRequired: false },
];

// ---------- Tasks ----------
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = typeof PRIORITIES[number];
export const TASK_STATUSES = ["Open", "In Progress", "Done", "Overdue"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export interface Task {
  id: string; name: string; customerId?: string; dealId?: string; jobId?: string;
  dueDate: string; priority: Priority; status: TaskStatus; owner: string; note: string;
}
export const tasks: Task[] = [
  { id: "t1", name: "Follow up BluePeak negotiation", customerId: "c3", dealId: "d3", dueDate: "2026-05-29", priority: "High", status: "Open", owner: "Khun Somchai", note: "Call procurement lead" },
  { id: "t2", name: "Send revised bracket quotation", customerId: "c2", dealId: "d2", dueDate: "2026-05-30", priority: "Medium", status: "In Progress", owner: "Khun Ploy", note: "Apply 5% discount" },
  { id: "t3", name: "QC inspection — Batch 12 final", customerId: "c1", jobId: "j1", dueDate: "2026-06-10", priority: "High", status: "Open", owner: "Khun Somchai", note: "" },
  { id: "t4", name: "Confirm tooling delivery date", jobId: "j4", customerId: "c2", dueDate: "2026-05-25", priority: "Urgent", status: "Overdue", owner: "Khun Ploy", note: "Supplier delay risk" },
  { id: "t5", name: "Send calibration certificate", jobId: "j2", customerId: "c2", dueDate: "2026-05-22", priority: "Medium", status: "Done", owner: "Khun Ploy", note: "" },
  { id: "t6", name: "Quote marine bushing reorder", customerId: "c5", dueDate: "2026-06-02", priority: "Low", status: "Open", owner: "Khun Somchai", note: "" },
];

// ---------- Lead Source map (kept here so we can apply without breaking Customer/Deal types) ----------
// Map id -> LeadSource. New customers/deals created via store assign here.
export const customerLeadSource: Record<string, LeadSource> = {
  c1: "Referral", c2: "Existing Customer", c3: "Website", c4: "Existing Customer", c5: "Partner",
};
export const dealLeadSource: Record<string, LeadSource> = {
  d1: "Existing Customer", d2: "Existing Customer", d3: "Website", d4: "Partner",
  d5: "Existing Customer", d6: "Existing Customer", d7: "Referral", d8: "Facebook",
};

// ---------- Helpers ----------
export const findPO = (id: string) => purchaseOrders.find((p) => p.id === id);
export const findInvoice = (id: string) => customerInvoices.find((i) => i.id === id);

// Silence unused warnings — these are intentionally imported so other modules
// can reach the seed entities via this single module if needed.
void customers; void deals; void jobs; void suppliers; void quotations;
