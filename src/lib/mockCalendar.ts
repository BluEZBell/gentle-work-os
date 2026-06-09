// Calendar events, billing rules, payment vouchers, calendar sync — mock only.
import { customers } from "./mockData";

// ---------- Event types ----------
export const EVENT_TYPES = [
  "Receive Payment",
  "Pay Supplier",
  "Billing Submission",
  "Deliver Document",
  "Deliver Job",
  "Receive Goods",
  "QC Appointment",
  "Customer Follow-up",
  "Calibration Service",
  "Company Holiday",
  "Customer Billing Holiday",
] as const;
export type EventType = typeof EVENT_TYPES[number];

export const EVENT_TYPE_THAI: Record<EventType, string> = {
  "Receive Payment": "รับยอด",
  "Pay Supplier": "จ่ายเงิน",
  "Billing Submission": "วางบิล",
  "Deliver Document": "ส่งเอกสาร",
  "Deliver Job": "ส่งงาน",
  "Receive Goods": "รับสินค้า",
  "QC Appointment": "นัดตรวจงาน",
  "Customer Follow-up": "ติดตามลูกค้า",
  "Calibration Service": "นัด Calibration",
  "Company Holiday": "วันหยุดบริษัท",
  "Customer Billing Holiday": "วันหยุดลูกค้า",
};

// color tokens defined in index.css fallback to inline classes
export const EVENT_TYPE_COLOR: Record<EventType, { dot: string; chip: string; ring: string }> = {
  "Receive Payment":         { dot: "bg-emerald-500",  chip: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "border-l-emerald-500" },
  "Pay Supplier":            { dot: "bg-rose-500",     chip: "bg-rose-50 text-rose-700 border-rose-200",          ring: "border-l-rose-500" },
  "Billing Submission":      { dot: "bg-amber-500",    chip: "bg-amber-50 text-amber-800 border-amber-200",       ring: "border-l-amber-500" },
  "Deliver Document":        { dot: "bg-sky-500",      chip: "bg-sky-50 text-sky-700 border-sky-200",             ring: "border-l-sky-500" },
  "Deliver Job":             { dot: "bg-blue-500",     chip: "bg-blue-50 text-blue-700 border-blue-200",          ring: "border-l-blue-500" },
  "Receive Goods":           { dot: "bg-teal-500",     chip: "bg-teal-50 text-teal-700 border-teal-200",          ring: "border-l-teal-500" },
  "QC Appointment":          { dot: "bg-indigo-500",   chip: "bg-indigo-50 text-indigo-700 border-indigo-200",    ring: "border-l-indigo-500" },
  "Customer Follow-up":      { dot: "bg-purple-500",   chip: "bg-purple-50 text-purple-700 border-purple-200",    ring: "border-l-purple-500" },
  "Calibration Service":     { dot: "bg-fuchsia-500",  chip: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", ring: "border-l-fuchsia-500" },
  "Company Holiday":         { dot: "bg-gray-400",     chip: "bg-gray-100 text-gray-700 border-gray-200",         ring: "border-l-gray-400" },
  "Customer Billing Holiday":{ dot: "bg-gray-500",     chip: "bg-gray-100 text-gray-700 border-gray-300",         ring: "border-l-gray-500" },
};

export type RelatedRef =
  | { kind: "customer"; id: string }
  | { kind: "job"; id: string }
  | { kind: "invoice"; id: string }
  | { kind: "supplier-bill"; id: string }
  | { kind: "payment-voucher"; id: string }
  | { kind: "service"; id: string }
  | { kind: "purchase-order"; id: string };

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: EventType;
  customerId?: string;
  amount?: number;
  docNumber?: string;
  title?: string;
  notes?: string;
  urgent?: boolean;
  related?: RelatedRef[];
  // sync mock
  googleEventId?: string;
  syncStatus?: "Synced" | "Pending" | "Skipped" | "Failed";
  lastSyncedAt?: string;
  syncAction?: "Create" | "Edit" | "Delete" | "Skip";
  attendees?: string[];
  ownerEmail?: string;
  eventColorId?: string;
}

const shortName = (id?: string) => {
  if (!id) return "";
  const c = customers.find((x) => x.id === id);
  if (!c) return "";
  const map: Record<string, string> = {
    c1: "SPC", c2: "NAP", c3: "BPE", c4: "KTM", c5: "AMW",
  };
  return map[c.id] || c.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
};

export const eventTitle = (e: CalendarEvent) => {
  if (e.title) return e.title;
  const sn = shortName(e.customerId);
  const th = EVENT_TYPE_THAI[e.type];
  const extra = e.docNumber ? e.docNumber : e.amount != null ? e.amount.toLocaleString() : "";
  return [sn, th, extra].filter(Boolean).join(" ");
};

// ---------- Seed events ----------
const today = new Date();
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => { const d = new Date(today); d.setDate(today.getDate() + n); return ymd(d); };

export const calendarEvents: CalendarEvent[] = [
  { id: "ev1", date: addDays(0), time: "10:00", type: "Receive Payment", customerId: "c1", amount: 18000, related: [{ kind: "invoice", id: "inv1" }], syncStatus: "Synced", googleEventId: "g_001", ownerEmail: "owner@mto.co.th", attendees: ["finance@mto.co.th"], lastSyncedAt: "2026-06-08 09:00", syncAction: "Create", eventColorId: "10" },
  { id: "ev2", date: addDays(0), time: "14:00", type: "Pay Supplier", amount: 21400, docNumber: "PV-2026-0007", related: [{ kind: "supplier-bill", id: "sb1" }], syncStatus: "Pending", syncAction: "Create" },
  { id: "ev3", date: addDays(1), time: "09:30", type: "Billing Submission", customerId: "c2", docNumber: "INV-2026-0012", related: [{ kind: "invoice", id: "inv2" }], urgent: true, syncStatus: "Pending" },
  { id: "ev4", date: addDays(2), type: "Deliver Document", customerId: "c4", syncStatus: "Synced", googleEventId: "g_002", lastSyncedAt: "2026-06-07 16:20" },
  { id: "ev5", date: addDays(3), type: "Receive Goods", customerId: "c1", docNumber: "PO-2026-008", related: [{ kind: "purchase-order", id: "po2" }] },
  { id: "ev6", date: addDays(4), time: "13:00", type: "QC Appointment", customerId: "c3", related: [{ kind: "job", id: "j1" }] },
  { id: "ev7", date: addDays(5), type: "Customer Follow-up", customerId: "c3", notes: "ติดตามใบเสนอราคา QT-2026-0051" },
  { id: "ev8", date: addDays(6), type: "Deliver Job", customerId: "c5", docNumber: "JOB-1023", related: [{ kind: "job", id: "j3" }] },
  { id: "ev9", date: addDays(7), type: "Calibration Service", customerId: "c2", related: [{ kind: "service", id: "sv1" }] },
  { id: "ev10", date: addDays(10), type: "Receive Payment", customerId: "c4", amount: 56000 },
  { id: "ev11", date: addDays(-2), type: "Pay Supplier", amount: 12000, urgent: true },
  { id: "ev12", date: addDays(-1), type: "Billing Submission", customerId: "c1", docNumber: "INV-2026-0009" },
  { id: "ev13", date: addDays(14), type: "Company Holiday", title: "วันหยุดบริษัท - หยุดยาว" },
  { id: "ev14", date: addDays(20), type: "Customer Billing Holiday", customerId: "c1", title: "SPC ปิดรับเอกสาร" },
];

// ---------- Customer Billing Rules ----------
export const BILLING_METHODS = ["In person", "EMS", "Email", "Portal"] as const;
export type BillingMethod = typeof BILLING_METHODS[number];

export const REQUIRED_DOCS = [
  "Invoice",
  "Tax Invoice",
  "Delivery Note",
  "Purchase Order Copy",
  "Company Certificate",
  "Bank Account Copy",
  "Payment Voucher",
  "Other",
] as const;
export type RequiredDoc = typeof REQUIRED_DOCS[number];

export interface BillingRule {
  customerId: string;
  billingDayStart: number; // 1-31
  billingDayEnd: number;
  paymentDay: number;
  creditTermDays: number;
  moveIfHoliday: boolean;
  method: BillingMethod;
  billingAddress: string;
  accountingContact: string;
  paymentContact: string;
  requiredDocs: RequiredDoc[];
  annualNote: string;
  monthlyNote: string;
  attachmentName?: string;
}

export const billingRules: Record<string, BillingRule> = {
  c1: {
    customerId: "c1", billingDayStart: 25, billingDayEnd: 30, paymentDay: 15, creditTermDays: 45, moveIfHoliday: true,
    method: "In person", billingAddress: "120 Bang Na-Trad, Bangkok 10260",
    accountingContact: "Khun Malee 02-555-0101", paymentContact: "Khun Anan 081-234-5678",
    requiredDocs: ["Invoice", "Tax Invoice", "Delivery Note", "Purchase Order Copy"],
    annualNote: "งดรับเอกสารช่วง 28 ธ.ค. - 3 ม.ค.",
    monthlyNote: "ส่งบิลทุกวันที่ 25-30 รับเช็ควันที่ 15 ของเดือนถัดไป",
    attachmentName: "SPC-billing-rule.pdf",
  },
  c2: {
    customerId: "c2", billingDayStart: 1, billingDayEnd: 5, paymentDay: 28, creditTermDays: 30, moveIfHoliday: true,
    method: "EMS", billingAddress: "Lamphun Industrial Estate, Lamphun",
    accountingContact: "Khun Sopa 053-555-2020", paymentContact: "Khun Wirat 089-555-1212",
    requiredDocs: ["Invoice", "Tax Invoice", "Delivery Note", "Payment Voucher"],
    annualNote: "", monthlyNote: "วางบิลต้นเดือน รับโอนปลายเดือน",
  },
};

// ---------- Payment Voucher ----------
export const PV_METHODS = ["Cash", "Bank Transfer", "Cheque"] as const;
export type PVMethod = typeof PV_METHODS[number];

export interface PaymentVoucher {
  id: string;
  number: string;
  date: string;
  payTo: string;
  billNumber: string;
  description: string;
  amount: number;
  method: PVMethod;
  chequeDate?: string;
  chequeNumber?: string;
  amountInWords: string;
  collector: string;
  paidBy: string;
  approvedBy: string;
  approvalStatus: "Draft" | "Pending Approval" | "Approved" | "Paid";
  supplierBillId?: string;
  jobId?: string;
  customerId?: string;
  notes?: string;
}

export const paymentVouchers: PaymentVoucher[] = [
  {
    id: "pv1", number: "PV-2026-0007", date: addDays(0), payTo: "Thanasak Steel Co., Ltd.",
    billNumber: "SB-2026-0011", description: "ค่าวัตถุดิบเหล็ก S45C สำหรับงาน JOB-1022",
    amount: 21400, method: "Bank Transfer", amountInWords: "สองหมื่นหนึ่งพันสี่ร้อยบาทถ้วน",
    collector: "Khun Somchai", paidBy: "Khun Ploy", approvedBy: "Khun Anan",
    approvalStatus: "Pending Approval", supplierBillId: "sb1", jobId: "j1", customerId: "c1",
    notes: "โอนผ่าน KBank xxx-x-x1234-x",
  },
  {
    id: "pv2", number: "PV-2026-0006", date: addDays(-2), payTo: "Anodize Pro",
    billNumber: "SB-2026-0010", description: "ค่าอโนไดซ์ผิวงาน JOB-1019",
    amount: 8500, method: "Cheque", chequeDate: addDays(-1), chequeNumber: "0001234",
    amountInWords: "แปดพันห้าร้อยบาทถ้วน",
    collector: "Khun Somchai", paidBy: "Khun Ploy", approvedBy: "Khun Anan",
    approvalStatus: "Approved", supplierBillId: "sb2",
  },
  {
    id: "pv3", number: "PV-2026-0005", date: addDays(-5), payTo: "Bronze Metal Trading",
    billNumber: "SB-2026-0009", description: "ค่าทองเหลือง CuSn8",
    amount: 72000, method: "Bank Transfer", amountInWords: "เจ็ดหมื่นสองพันบาทถ้วน",
    collector: "Khun Somchai", paidBy: "Khun Ploy", approvedBy: "Khun Anan",
    approvalStatus: "Paid", supplierBillId: "sb3", jobId: "j3",
  },
];

export const pvFmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);

// ---------- Print Log ----------
export interface PrintLogEntry {
  id: string;
  printedBy: string;
  printedAt: string;
  copies: number;
  documentType: string;
  relatedId: string;
}
export const printLog: PrintLogEntry[] = [
  { id: "pl1", printedBy: "Khun Ploy", printedAt: "2026-06-07 11:24", copies: 2, documentType: "Payment Voucher", relatedId: "pv2" },
  { id: "pl2", printedBy: "Khun Ploy", printedAt: "2026-06-05 09:14", copies: 1, documentType: "Payment Voucher", relatedId: "pv3" },
];

export const copyLabel = (idx: number) => idx === 0 ? "ต้นฉบับ" : `สำเนา ${idx}`;

// ---------- Sync Categories (used by CalendarSync) ----------
export const SYNC_PERMISSIONS = [
  { id: "create", name: "Create Google Calendar Event", thai: "สร้างกิจกรรม" },
  { id: "edit",   name: "Edit Google Calendar Event",   thai: "แก้ไขกิจกรรม" },
  { id: "delete", name: "Delete Google Calendar Event", thai: "ลบกิจกรรม" },
  { id: "invite", name: "Invite related people",       thai: "เชิญผู้ที่เกี่ยวข้อง" },
  { id: "color",  name: "Sync event color",            thai: "ซิงค์สีกิจกรรม" },
  { id: "remind", name: "Sync reminder",               thai: "ซิงค์การแจ้งเตือน" },
  { id: "store",  name: "Store Google Event ID",       thai: "บันทึก Google Event ID" },
];

// ---------- Helpers ----------
export const eventsOn = (date: string) => calendarEvents.filter((e) => e.date === date);
export const upcomingEvents = (days = 7) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const end = new Date(t); end.setDate(t.getDate() + days);
  return calendarEvents
    .filter((e) => { const d = new Date(e.date); return d >= t && d <= end; })
    .sort((a, b) => a.date.localeCompare(b.date));
};
export const eventsByType = (type: EventType) => calendarEvents.filter((e) => e.type === type);

// Generate billing calendar from rule
export function generateBillingEvents(rule: BillingRule, monthsAhead = 3): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const cust = customers.find((c) => c.id === rule.customerId);
  const sn = cust ? cust.name.split(" ")[0] : rule.customerId;
  const now = new Date();
  for (let m = 0; m < monthsAhead; m++) {
    const submit = new Date(now.getFullYear(), now.getMonth() + m, rule.billingDayStart);
    const pay = new Date(now.getFullYear(), now.getMonth() + m, rule.paymentDay);
    out.push({
      id: `bg-s-${rule.customerId}-${m}`, date: ymd(submit), type: "Billing Submission",
      customerId: rule.customerId, title: `${sn} วางบิลรอบประจำเดือน`,
    });
    out.push({
      id: `bg-p-${rule.customerId}-${m}`, date: ymd(pay), type: "Receive Payment",
      customerId: rule.customerId, title: `${sn} รับยอดประจำเดือน`,
    });
  }
  return out;
}
