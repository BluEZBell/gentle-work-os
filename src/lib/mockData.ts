// Mock data for Private MTO Business OS demo. No backend — pure in-memory fixtures.

export type Role = "Owner" | "Operator" | "Viewer";

export interface User { id: string; name: string; email: string; role: Role; }

export const users: User[] = [
  { id: "u1", name: "Khun Somchai (Owner)", email: "owner@mto.demo", role: "Owner" },
  { id: "u2", name: "Khun Ploy (Operator)", email: "operator@mto.demo", role: "Operator" },
  { id: "u3", name: "Khun Aim (Viewer)", email: "viewer@mto.demo", role: "Viewer" },
];

export interface Customer {
  id: string; name: string; contactPerson: string; phone: string; email: string;
  address: string; type: "New" | "Existing" | "Corporate"; source: string;
  confidential: boolean; notes: string; createdAt: string; updatedAt: string;
}

export const customers: Customer[] = [
  { id: "c1", name: "Siam Precision Co., Ltd.", contactPerson: "Khun Anan", phone: "+66 81-234-5678", email: "anan@siamprecision.co.th", address: "Bang Na, Bangkok", type: "Corporate", source: "Referral", confidential: true, notes: "Long-term key account. Pays on time.", createdAt: "2024-03-12", updatedAt: "2026-05-12" },
  { id: "c2", name: "Northern Auto Parts", contactPerson: "Khun Wirat", phone: "+66 89-555-1212", email: "wirat@napauto.co.th", address: "Lamphun Industrial Estate", type: "Existing", source: "Trade show 2024", confidential: false, notes: "Reorders calibration yearly.", createdAt: "2023-11-02", updatedAt: "2026-04-22" },
  { id: "c3", name: "BluePeak Electronics", contactPerson: "Khun Ratchada", phone: "+66 82-888-7777", email: "ratchada@bluepeak.co.th", address: "Rayong", type: "New", source: "Website inquiry", confidential: false, notes: "First quote in pipeline.", createdAt: "2026-04-30", updatedAt: "2026-05-20" },
  { id: "c4", name: "Krungthep Machining", contactPerson: "Khun Pichai", phone: "+66 86-101-2020", email: "pichai@kmach.co.th", address: "Samut Prakan", type: "Existing", source: "Past customer", confidential: false, notes: "", createdAt: "2024-08-18", updatedAt: "2026-05-01" },
  { id: "c5", name: "Andaman Marine Works", contactPerson: "Khun Suda", phone: "+66 75-220-330", email: "suda@andamanmarine.co.th", address: "Phuket", type: "Corporate", source: "LinkedIn", confidential: true, notes: "Confidential client — NDA on file.", createdAt: "2025-01-25", updatedAt: "2026-03-15" },
];

export type ContactType = "Buyer" | "Engineer" | "Accountant" | "Owner" | "Manager" | "Receiver" | "Approver" | "Other";
export type ContactChannel = "Phone" | "LINE" | "Email" | "Meeting";

export interface Contact {
  id: string; name: string; role: string; department: string; phone: string; email: string;
  customerId: string; notes: string;
  lineId?: string; contactType?: ContactType;
  isMain?: boolean; isBilling?: boolean; isDelivery?: boolean; isPoApprover?: boolean;
  preferredChannel?: ContactChannel; internalNote?: string;
}

export const contacts: Contact[] = [
  { id: "ct1", name: "Khun Anan", role: "Purchasing Manager", department: "Procurement", phone: "+66 81-234-5678", email: "anan@siamprecision.co.th", customerId: "c1", notes: "Primary buyer", lineId: "anan.spc", contactType: "Buyer", isMain: true, isPoApprover: true, preferredChannel: "LINE" },
  { id: "ct2", name: "Khun Mali", role: "Engineer", department: "QA", phone: "+66 81-234-9090", email: "mali@siamprecision.co.th", customerId: "c1", notes: "Technical signoff", contactType: "Engineer", preferredChannel: "Email" },
  { id: "ct3", name: "Khun Wirat", role: "Owner", department: "Management", phone: "+66 89-555-1212", email: "wirat@napauto.co.th", customerId: "c2", notes: "", contactType: "Owner", isMain: true, isPoApprover: true, preferredChannel: "Phone" },
  { id: "ct4", name: "Khun Ratchada", role: "Procurement Lead", department: "Procurement", phone: "+66 82-888-7777", email: "ratchada@bluepeak.co.th", customerId: "c3", notes: "", contactType: "Buyer", isMain: true, preferredChannel: "Email" },
  { id: "ct5", name: "Khun Pichai", role: "Production Manager", department: "Production", phone: "+66 86-101-2020", email: "pichai@kmach.co.th", customerId: "c4", notes: "", contactType: "Manager", isMain: true, preferredChannel: "Phone" },
  { id: "ct6", name: "Khun Suda", role: "Operations Director", department: "Operations", phone: "+66 75-220-330", email: "suda@andamanmarine.co.th", customerId: "c5", notes: "Signs all POs", contactType: "Approver", isMain: true, isBilling: true, isPoApprover: true, preferredChannel: "Email" },
];


export type DealStatus = "New Lead" | "Contacted" | "Need Quotation" | "Quotation Sent" | "Negotiation" | "Won" | "Lost" | "Failed";

export const dealStatusThai: Record<DealStatus, string> = {
  "New Lead": "ลูกค้าใหม่",
  "Contacted": "ติดต่อแล้ว",
  "Need Quotation": "รอเสนอราคา",
  "Quotation Sent": "ส่งใบเสนอราคาแล้ว",
  "Negotiation": "กำลังต่อรอง",
  "Won": "ได้งาน",
  "Lost": "ไม่ได้งาน",
  "Failed": "งานล้มเหลว/ยกเลิก",
};

export interface Deal {
  id: string; name: string; customerId: string; contactId: string;
  estimatedValue: number; probability: number; status: DealStatus;
  expectedCloseDate: string; reasonLost?: string; notes: string;
}

export const deals: Deal[] = [
  { id: "d1", name: "Precision Jig — Batch 12", customerId: "c1", contactId: "ct1", estimatedValue: 480000, probability: 90, status: "Won", expectedCloseDate: "2026-05-10", notes: "Recurring order" },
  { id: "d2", name: "Custom Bracket Run", customerId: "c2", contactId: "ct3", estimatedValue: 220000, probability: 70, status: "Quotation Sent", expectedCloseDate: "2026-06-12", notes: "" },
  { id: "d3", name: "Sensor Housing Prototype", customerId: "c3", contactId: "ct4", estimatedValue: 95000, probability: 40, status: "Negotiation", expectedCloseDate: "2026-06-20", notes: "Price-sensitive" },
  { id: "d4", name: "Marine Bushing Set", customerId: "c5", contactId: "ct6", estimatedValue: 360000, probability: 60, status: "Need Quotation", expectedCloseDate: "2026-07-01", notes: "Awaiting spec" },
  { id: "d5", name: "Spindle Repair Kit", customerId: "c4", contactId: "ct5", estimatedValue: 140000, probability: 20, status: "Contacted", expectedCloseDate: "2026-07-15", notes: "" },
  { id: "d6", name: "Calibration Service 2026", customerId: "c2", contactId: "ct3", estimatedValue: 60000, probability: 95, status: "Won", expectedCloseDate: "2026-04-22", notes: "Annual" },
  { id: "d7", name: "Mold Refurbishment", customerId: "c4", contactId: "ct5", estimatedValue: 180000, probability: 0, status: "Lost", expectedCloseDate: "2026-04-01", reasonLost: "Price too high", notes: "" },
  { id: "d8", name: "Quick Inquiry — Plates", customerId: "c3", contactId: "ct4", estimatedValue: 35000, probability: 10, status: "New Lead", expectedCloseDate: "2026-07-30", notes: "" },
];

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

export interface QuotationItem {
  id: string; partName: string; partNumber: string; quantity: number;
  sellPrice: number; estimatedCost: number;
}

export interface Quotation {
  id: string; number: string; customerId: string; dealId: string;
  date: string; validUntil: string; status: QuotationStatus;
  items: QuotationItem[]; attachment?: string;
}

export const quotations: Quotation[] = [
  { id: "q1", number: "QT-2026-0042", customerId: "c1", dealId: "d1", date: "2026-04-20", validUntil: "2026-05-20", status: "Accepted",
    items: [
      { id: "qi1", partName: "Precision Jig Type A", partNumber: "PJ-A-12", quantity: 50, sellPrice: 7200, estimatedCost: 4400 },
      { id: "qi2", partName: "Mounting Plate", partNumber: "MP-44", quantity: 50, sellPrice: 2400, estimatedCost: 1500 },
    ] },
  { id: "q2", number: "QT-2026-0048", customerId: "c2", dealId: "d2", date: "2026-05-08", validUntil: "2026-06-08", status: "Sent",
    items: [{ id: "qi3", partName: "Custom Bracket", partNumber: "CB-22", quantity: 200, sellPrice: 1100, estimatedCost: 720 }] },
  { id: "q3", number: "QT-2026-0051", customerId: "c3", dealId: "d3", date: "2026-05-18", validUntil: "2026-06-17", status: "Sent",
    items: [{ id: "qi4", partName: "Sensor Housing", partNumber: "SH-01", quantity: 25, sellPrice: 3800, estimatedCost: 2600 }] },
  { id: "q4", number: "QT-2026-0033", customerId: "c4", dealId: "d7", date: "2026-03-10", validUntil: "2026-04-10", status: "Rejected",
    items: [{ id: "qi5", partName: "Mold Insert", partNumber: "MI-7", quantity: 4, sellPrice: 45000, estimatedCost: 30000 }] },
  { id: "q5", number: "QT-2026-0029", customerId: "c2", dealId: "d6", date: "2026-04-01", validUntil: "2026-05-01", status: "Accepted",
    items: [{ id: "qi6", partName: "Calibration Service", partNumber: "CAL-2026", quantity: 1, sellPrice: 60000, estimatedCost: 25000 }] },
];

export type JobStatus = "Pending" | "In Progress" | "Waiting Supplier" | "Waiting Customer" | "Delivered" | "Closed" | "Problem";

export const jobStatusThai: Record<JobStatus, string> = {
  "Pending": "รอเริ่ม", "In Progress": "กำลังดำเนินงาน", "Waiting Supplier": "รอ Supplier",
  "Waiting Customer": "รอลูกค้า", "Delivered": "ส่งมอบแล้ว", "Closed": "ปิดงาน", "Problem": "มีปัญหา",
};

export interface Job {
  id: string; number: string; name: string; customerId: string; quotationId: string;
  startDate: string; dueDate: string; deliveryDate?: string; status: JobStatus;
  supplierId: string; actualCost: number; sellPrice: number; notes: string;
}

export const jobs: Job[] = [
  { id: "j1", number: "JOB-2026-018", name: "Precision Jig — Batch 12", customerId: "c1", quotationId: "q1",
    startDate: "2026-05-12", dueDate: "2026-06-15", status: "In Progress",
    supplierId: "s1", actualCost: 268000, sellPrice: 480000, notes: "Materials secured" },
  { id: "j2", number: "JOB-2026-014", name: "Calibration Service 2026", customerId: "c2", quotationId: "q5",
    startDate: "2026-04-05", dueDate: "2026-04-25", deliveryDate: "2026-04-22", status: "Delivered",
    supplierId: "s2", actualCost: 25000, sellPrice: 60000, notes: "Calibration cert issued" },
  { id: "j3", number: "JOB-2026-011", name: "Bushing Prototype", customerId: "c5", quotationId: "q1",
    startDate: "2026-03-15", dueDate: "2026-04-10", deliveryDate: "2026-04-08", status: "Closed",
    supplierId: "s3", actualCost: 88000, sellPrice: 160000, notes: "" },
  { id: "j4", number: "JOB-2026-019", name: "Bracket Tooling", customerId: "c2", quotationId: "q2",
    startDate: "2026-05-20", dueDate: "2026-06-30", status: "Waiting Supplier",
    supplierId: "s1", actualCost: 60000, sellPrice: 220000, notes: "Awaiting raw material" },
];

export interface Part {
  id: string; name: string; number: string; description: string;
  customerId: string; supplierId: string; standardCost: number; sellPrice: number;
  warrantyMonths: number; calibrationRequired: boolean; calibrationCycleMonths: number;
}

export const parts: Part[] = [
  { id: "p1", name: "Precision Jig Type A", number: "PJ-A-12", description: "Custom alignment jig", customerId: "c1", supplierId: "s1", standardCost: 4400, sellPrice: 7200, warrantyMonths: 12, calibrationRequired: true, calibrationCycleMonths: 12 },
  { id: "p2", name: "Mounting Plate", number: "MP-44", description: "Steel mounting plate", customerId: "c1", supplierId: "s1", standardCost: 1500, sellPrice: 2400, warrantyMonths: 12, calibrationRequired: false, calibrationCycleMonths: 0 },
  { id: "p3", name: "Custom Bracket", number: "CB-22", description: "Bent steel bracket", customerId: "c2", supplierId: "s1", standardCost: 720, sellPrice: 1100, warrantyMonths: 12, calibrationRequired: false, calibrationCycleMonths: 0 },
  { id: "p4", name: "Sensor Housing", number: "SH-01", description: "Aluminum sensor housing", customerId: "c3", supplierId: "s2", standardCost: 2600, sellPrice: 3800, warrantyMonths: 24, calibrationRequired: true, calibrationCycleMonths: 12 },
  { id: "p5", name: "Marine Bushing", number: "MB-9", description: "Bronze marine bushing", customerId: "c5", supplierId: "s3", standardCost: 1800, sellPrice: 3200, warrantyMonths: 24, calibrationRequired: false, calibrationCycleMonths: 0 },
];

export interface Supplier {
  id: string; name: string; contactPerson: string; phone: string; email: string;
  paymentTerm: "Cash" | "30 Days" | "60 Days"; bankInfo: string; type: string;
  notes: string; riskLevel: "Low" | "Medium" | "High"; confidential: boolean;
}

export const suppliers: Supplier[] = [
  { id: "s1", name: "Thanasak Steel Co.", contactPerson: "Khun Niran", phone: "+66 81-700-1100", email: "niran@thanasak.co.th", paymentTerm: "30 Days", bankInfo: "•••• •••• 4421", type: "Raw material", notes: "Reliable", riskLevel: "Low", confidential: false },
  { id: "s2", name: "PrecisionLab Calibration", contactPerson: "Khun Tida", phone: "+66 82-555-0033", email: "tida@precisionlab.co.th", paymentTerm: "Cash", bankInfo: "•••• •••• 8812", type: "Service", notes: "", riskLevel: "Low", confidential: false },
  { id: "s3", name: "BronzeWorks Foundry", contactPerson: "Khun Korn", phone: "+66 83-090-7711", email: "korn@bronzeworks.co.th", paymentTerm: "60 Days", bankInfo: "•••• •••• 2245", type: "Casting", notes: "Watch lead times", riskLevel: "Medium", confidential: true },
];

export type BillStatus = "Unpaid" | "Paid" | "Overdue";
export type ReviewStatus = "Pending Review" | "Approved" | "Rejected";

export interface SupplierBill {
  id: string; number: string; supplierId: string; jobId: string;
  billDate: string; dueDate: string; amount: number; vat: number; total: number;
  status: BillStatus; paymentTerm: string; attachment?: string;
  emailSource: string; reviewStatus: ReviewStatus;
}

export const supplierBills: SupplierBill[] = [
  { id: "b1", number: "INV-TH-9921", supplierId: "s1", jobId: "j1", billDate: "2026-05-12", dueDate: "2026-06-11", amount: 180000, vat: 12600, total: 192600, status: "Unpaid", paymentTerm: "30 Days", emailSource: "billing@thanasak.co.th", reviewStatus: "Approved" },
  { id: "b2", number: "INV-PL-0413", supplierId: "s2", jobId: "j2", billDate: "2026-04-22", dueDate: "2026-04-22", amount: 25000, vat: 1750, total: 26750, status: "Paid", paymentTerm: "Cash", emailSource: "ar@precisionlab.co.th", reviewStatus: "Approved" },
  { id: "b3", number: "INV-BW-2240", supplierId: "s3", jobId: "j3", billDate: "2026-03-20", dueDate: "2026-05-19", amount: 88000, vat: 6160, total: 94160, status: "Overdue", paymentTerm: "60 Days", emailSource: "finance@bronzeworks.co.th", reviewStatus: "Approved" },
  { id: "b4", number: "INV-TH-9988", supplierId: "s1", jobId: "j4", billDate: "2026-05-22", dueDate: "2026-06-21", amount: 60000, vat: 4200, total: 64200, status: "Unpaid", paymentTerm: "30 Days", emailSource: "billing@thanasak.co.th", reviewStatus: "Pending Review" },
];

export type ServiceStatus = "Upcoming" | "Due" | "Completed" | "Missed";

export interface ServiceRecord {
  id: string; customerId: string; jobId: string; partName: string; partNumber: string;
  deliveryDate: string; warrantyStart: string; warrantyEnd: string;
  calibrationDueDate: string; firstYearFree: boolean; renewalPrice: number;
  status: ServiceStatus; opportunity: boolean;
}

export const serviceRecords: ServiceRecord[] = [
  { id: "sv1", customerId: "c2", jobId: "j2", partName: "Calibration Service", partNumber: "CAL-2026", deliveryDate: "2026-04-22", warrantyStart: "2026-04-22", warrantyEnd: "2027-04-22", calibrationDueDate: "2027-04-22", firstYearFree: true, renewalPrice: 12000, status: "Upcoming", opportunity: true },
  { id: "sv2", customerId: "c5", jobId: "j3", partName: "Marine Bushing", partNumber: "MB-9", deliveryDate: "2026-04-08", warrantyStart: "2026-04-08", warrantyEnd: "2028-04-08", calibrationDueDate: "2026-06-10", firstYearFree: false, renewalPrice: 32000, status: "Due", opportunity: true },
  { id: "sv3", customerId: "c1", jobId: "j1", partName: "Precision Jig Type A", partNumber: "PJ-A-12", deliveryDate: "2025-06-15", warrantyStart: "2025-06-15", warrantyEnd: "2026-06-15", calibrationDueDate: "2026-06-15", firstYearFree: true, renewalPrice: 96000, status: "Due", opportunity: true },
  { id: "sv4", customerId: "c4", jobId: "j3", partName: "Spindle Kit", partNumber: "SP-3", deliveryDate: "2025-02-12", warrantyStart: "2025-02-12", warrantyEnd: "2026-02-12", calibrationDueDate: "2026-02-12", firstYearFree: false, renewalPrice: 28000, status: "Missed", opportunity: false },
];

export type ReminderType = "Quotation Expiry" | "Job Due" | "Supplier Payment Due" | "Supplier Payment Overdue" | "Service / Calibration Due" | "Customer Follow-up";

export interface Reminder {
  id: string; type: ReminderType; title: string; date: string; refId: string;
  severity: "info" | "warning" | "danger" | "success";
}

export const reminders: Reminder[] = [
  { id: "r1", type: "Supplier Payment Overdue", title: "BronzeWorks INV-BW-2240 — ฿94,160", date: "2026-05-19", refId: "b3", severity: "danger" },
  { id: "r2", type: "Supplier Payment Due", title: "Thanasak INV-TH-9921 — ฿192,600", date: "2026-06-11", refId: "b1", severity: "warning" },
  { id: "r3", type: "Job Due", title: "JOB-2026-018 Precision Jig — Batch 12", date: "2026-06-15", refId: "j1", severity: "warning" },
  { id: "r4", type: "Service / Calibration Due", title: "Siam Precision — Annual Calibration", date: "2026-06-15", refId: "sv3", severity: "warning" },
  { id: "r5", type: "Service / Calibration Due", title: "Andaman Marine — Bushing inspection", date: "2026-06-10", refId: "sv2", severity: "warning" },
  { id: "r6", type: "Quotation Expiry", title: "QT-2026-0048 expires soon", date: "2026-06-08", refId: "q2", severity: "info" },
  { id: "r7", type: "Customer Follow-up", title: "BluePeak — negotiation follow-up", date: "2026-06-02", refId: "d3", severity: "info" },
  { id: "r8", type: "Job Due", title: "JOB-2026-019 Bracket Tooling", date: "2026-06-30", refId: "j4", severity: "info" },
];

export interface AuditLog {
  id: string; user: string; action: string; entity: string; module: string;
  status: "OK" | "DENIED" | "WARN"; ip: string; timestamp: string;
}

export const auditLogs: AuditLog[] = [
  { id: "a1", user: "Khun Somchai", action: "Login", entity: "Session", module: "Auth", status: "OK", ip: "10.0.1.21", timestamp: "2026-05-29 09:02" },
  { id: "a2", user: "Khun Ploy", action: "Create Customer", entity: "BluePeak Electronics", module: "Customers", status: "OK", ip: "10.0.1.32", timestamp: "2026-05-28 14:55" },
  { id: "a3", user: "Khun Ploy", action: "Edit Quotation", entity: "QT-2026-0051", module: "Quotations", status: "OK", ip: "10.0.1.32", timestamp: "2026-05-28 15:21" },
  { id: "a4", user: "Khun Somchai", action: "Change Deal Status", entity: "Deal d1 → Won", module: "Deals", status: "OK", ip: "10.0.1.21", timestamp: "2026-05-27 10:10" },
  { id: "a5", user: "Khun Ploy", action: "Create Job", entity: "JOB-2026-018", module: "Jobs", status: "OK", ip: "10.0.1.32", timestamp: "2026-05-27 10:12" },
  { id: "a6", user: "Khun Somchai", action: "Approve Supplier Bill", entity: "INV-TH-9921", module: "Supplier Bills", status: "OK", ip: "10.0.1.21", timestamp: "2026-05-26 16:40" },
  { id: "a7", user: "Khun Aim", action: "Export Attempt", entity: "Customers CSV", module: "Customers", status: "DENIED", ip: "10.0.1.44", timestamp: "2026-05-25 11:02" },
  { id: "a8", user: "Khun Somchai", action: "Download Attachment", entity: "QT-2026-0042.pdf", module: "Quotations", status: "OK", ip: "10.0.1.21", timestamp: "2026-05-25 09:15" },
  { id: "a9", user: "Khun Somchai", action: "Change Settings", entity: "AI Automation Rules", module: "Settings", status: "OK", ip: "10.0.1.21", timestamp: "2026-05-24 17:35" },
];

// Helpers
export const fmtTHB = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export const findCustomer = (id: string) => customers.find((c) => c.id === id);
export const findContact = (id: string) => contacts.find((c) => c.id === id);
export const findDeal = (id: string) => deals.find((d) => d.id === id);
export const findQuotation = (id: string) => quotations.find((q) => q.id === id);
export const findJob = (id: string) => jobs.find((j) => j.id === id);
export const findSupplier = (id: string) => suppliers.find((s) => s.id === id);

export const quotationTotal = (q: Quotation) =>
  q.items.reduce((s, it) => s + it.sellPrice * it.quantity, 0);
export const quotationCost = (q: Quotation) =>
  q.items.reduce((s, it) => s + it.estimatedCost * it.quantity, 0);
export const quotationProfit = (q: Quotation) => quotationTotal(q) - quotationCost(q);

export const dashboardStats = () => {
  const now = new Date("2026-05-29");
  const won = deals.filter((d) => d.status === "Won");
  const lost = deals.filter((d) => d.status === "Lost" || d.status === "Failed");
  const active = deals.filter((d) => !["Won", "Lost", "Failed"].includes(d.status));
  const monthlyRevenue = jobs.reduce((s, j) => s + j.sellPrice, 0);
  const monthlyProfit = jobs.reduce((s, j) => s + (j.sellPrice - j.actualCost), 0);
  const qThisMonth = quotations.filter((q) => q.date.startsWith("2026-05")).length;
  const billsDueSoon = supplierBills.filter((b) => b.status !== "Paid").length;
  const svcDueSoon = serviceRecords.filter((s) => s.status === "Due" || s.status === "Upcoming").length;
  const overdue = supplierBills.filter((b) => b.status === "Overdue").length +
    serviceRecords.filter((s) => s.status === "Missed").length;
  return {
    customers: customers.length, active: active.length, qThisMonth,
    won: won.length, lost: lost.length, monthlyRevenue, monthlyProfit,
    billsDueSoon, svcDueSoon, overdue, now,
  };
};
