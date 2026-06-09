// Extended mock data for Peony Business OS modules (assets, payroll, barcode,
// OCR, customer portal, calendar sync, AI email, approvals, warehouses).

export const ASSET_STATUSES = ["Active", "Repair", "Retired", "Sold"] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export interface Asset {
  id: string; code: string; name: string; type: string;
  purchaseDate: string; purchasePrice: number; usefulLifeMonths: number;
  monthsInService: number; location: string; assignedUser: string;
  status: AssetStatus; notes: string;
}

export const assets: Asset[] = [
  { id: "a1", code: "AST-001", name: "CNC Mill DMG CMX 600V", type: "เครื่องจักร", purchaseDate: "2023-06-10", purchasePrice: 2800000, usefulLifeMonths: 84, monthsInService: 35, location: "โรงงานหลัก", assignedUser: "Khun Somchai", status: "Active", notes: "บำรุงรักษาทุก 6 เดือน" },
  { id: "a2", code: "AST-002", name: "Toyota Hilux Revo 4dr", type: "ยานพาหนะ", purchaseDate: "2022-03-15", purchasePrice: 980000, usefulLifeMonths: 60, monthsInService: 38, location: "On-site", assignedUser: "Khun Ploy", status: "Active", notes: "ใช้ส่งของและออกหน้างาน" },
  { id: "a3", code: "AST-003", name: "Mitutoyo CMM Crysta-Apex", type: "เครื่องวัด", purchaseDate: "2021-11-05", purchasePrice: 1450000, usefulLifeMonths: 96, monthsInService: 54, location: "QC Room", assignedUser: "Khun Somchai", status: "Repair", notes: "หัววัดต้องสอบเทียบ" },
  { id: "a4", code: "AST-004", name: "Lathe Mori Seiki SL-25", type: "เครื่องจักร", purchaseDate: "2019-04-20", purchasePrice: 1900000, usefulLifeMonths: 96, monthsInService: 84, location: "โรงงานหลัก", assignedUser: "—", status: "Retired", notes: "ปลดระวางปลายปี 2025" },
  { id: "a5", code: "AST-005", name: "Office iMac 24\"", type: "อุปกรณ์สำนักงาน", purchaseDate: "2024-02-12", purchasePrice: 78000, usefulLifeMonths: 48, monthsInService: 16, location: "Office", assignedUser: "Khun Ploy", status: "Active", notes: "" },
];

export const assetMonthlyDep = (a: Asset) => a.purchasePrice / a.usefulLifeMonths;
export const assetAccumDep = (a: Asset) => Math.min(a.purchasePrice, assetMonthlyDep(a) * a.monthsInService);
export const assetBookValue = (a: Asset) => Math.max(0, a.purchasePrice - assetAccumDep(a));

// ---------- Payroll ----------
export interface PayrollLine {
  id: string; employeeName: string; role: string; baseSalary: number;
  socialSecurity: number; salaryAdvance: number; emergencyWithdrawal: number;
  companyLoan: number; companyCarDeduction: number;
  otWeekday: number; otHoliday: number;
  mealAllowance: number; fuelAllowance: number; travelAllowance: number;
  fieldWorkAllowance: number; reimbursement: number; giftMoney: number;
  notes: string;
}

export const payrollLines: PayrollLine[] = [
  { id: "p1", employeeName: "Khun Somchai", role: "เจ้าของ/ช่างหลัก", baseSalary: 65000, socialSecurity: 750, salaryAdvance: 0, emergencyWithdrawal: 0, companyLoan: 0, companyCarDeduction: 2000, otWeekday: 3200, otHoliday: 2400, mealAllowance: 1100, fuelAllowance: 3000, travelAllowance: 1500, fieldWorkAllowance: 2000, reimbursement: 850, giftMoney: 0, notes: "" },
  { id: "p2", employeeName: "Khun Ploy", role: "ผู้จัดการ/ขาย", baseSalary: 48000, socialSecurity: 750, salaryAdvance: 5000, emergencyWithdrawal: 0, companyLoan: 1500, companyCarDeduction: 0, otWeekday: 1200, otHoliday: 0, mealAllowance: 1100, fuelAllowance: 1800, travelAllowance: 800, fieldWorkAllowance: 0, reimbursement: 320, giftMoney: 1000, notes: "ของขวัญวันเกิด" },
  { id: "p3", employeeName: "Khun Wit", role: "ช่างประกอบ", baseSalary: 22000, socialSecurity: 750, salaryAdvance: 0, emergencyWithdrawal: 2000, companyLoan: 0, companyCarDeduction: 0, otWeekday: 2400, otHoliday: 1600, mealAllowance: 1100, fuelAllowance: 0, travelAllowance: 0, fieldWorkAllowance: 1500, reimbursement: 0, giftMoney: 0, notes: "" },
];

export const payrollAllowances = (p: PayrollLine) =>
  p.otWeekday + p.otHoliday + p.mealAllowance + p.fuelAllowance + p.travelAllowance + p.fieldWorkAllowance + p.reimbursement + p.giftMoney;
export const payrollDeductions = (p: PayrollLine) =>
  p.socialSecurity + p.salaryAdvance + p.emergencyWithdrawal + p.companyLoan + p.companyCarDeduction;
export const payrollNetPay = (p: PayrollLine) => p.baseSalary + payrollAllowances(p) - payrollDeductions(p);

// ---------- Warehouses & Stock ----------
export const warehouses = [
  { id: "w1", name: "Main Warehouse", thai: "คลังหลัก" },
  { id: "w2", name: "Tool Room", thai: "ห้องเครื่องมือ" },
  { id: "w3", name: "Consumables Storage", thai: "ของสิ้นเปลือง" },
  { id: "w4", name: "Supplier Holding", thai: "ของรอรับจากซัพพลายเออร์" },
  { id: "w5", name: "On-site / Field Work", thai: "หน้างาน/นอกสถานที่" },
];

export interface StockItem {
  id: string; code: string; name: string; unit: string;
  reorderPoint: number;
  byWarehouse: Record<string, number>;
}

export const stockItems: StockItem[] = [
  { id: "si1", code: "BAR-001", name: "S45C billet 120×80×35", unit: "pcs", reorderPoint: 20, byWarehouse: { w1: 18, w2: 0, w3: 0, w4: 12, w5: 0 } },
  { id: "si2", code: "BAR-002", name: "CuSn8 bar", unit: "pcs", reorderPoint: 10, byWarehouse: { w1: 6, w2: 0, w3: 0, w4: 0, w5: 0 } },
  { id: "si3", code: "TOOL-101", name: "Carbide end mill 6mm", unit: "ea", reorderPoint: 12, byWarehouse: { w1: 0, w2: 22, w3: 0, w4: 0, w5: 2 } },
  { id: "si4", code: "CON-301", name: "Cutting oil 5L", unit: "btl", reorderPoint: 6, byWarehouse: { w1: 0, w2: 0, w3: 9, w4: 0, w5: 0 } },
  { id: "si5", code: "FAS-450", name: "M8 socket cap screw", unit: "pcs", reorderPoint: 200, byWarehouse: { w1: 50, w2: 0, w3: 320, w4: 0, w5: 30 } },
];

export const stockTotal = (s: StockItem) => Object.values(s.byWarehouse).reduce((a, b) => a + b, 0);

// ---------- Barcode Stock Issues ----------
export interface BarcodeIssue {
  id: string; barcode: string; itemId: string; warehouseId: string;
  jobId: string; quantity: number; issuedBy: string; issueDate: string; note: string;
}
export const barcodeIssues: BarcodeIssue[] = [
  { id: "bi1", barcode: "BAR-001", itemId: "si1", warehouseId: "w1", jobId: "j1", quantity: 4, issuedBy: "Khun Wit", issueDate: "2026-05-25", note: "เบิกเพิ่มสำหรับ batch 12" },
  { id: "bi2", barcode: "TOOL-101", itemId: "si3", warehouseId: "w2", jobId: "j4", quantity: 2, issuedBy: "Khun Somchai", issueDate: "2026-05-27", note: "" },
];

// ---------- OCR Documents ----------
export const OCR_TYPES = ["Quotation", "Customer PO", "Supplier Bill", "Receipt", "Tax Invoice", "Payment Voucher"] as const;
export type OcrDocType = typeof OCR_TYPES[number];
export type OcrStatus = "Pending Review" | "Approved" | "Rejected";

export interface OcrDocument {
  id: string; fileName: string; uploadedDate: string; docType: OcrDocType;
  extracted: { docNumber: string; date: string; companyName: string; amount: number; vat: number; total: number };
  status: OcrStatus; reviewer?: string;
}
export const ocrDocuments: OcrDocument[] = [
  { id: "ocr1", fileName: "scan_thanasak_bill_4521.pdf", uploadedDate: "2026-05-28", docType: "Supplier Bill",
    extracted: { docNumber: "TNS-4521", date: "2026-05-26", companyName: "Thanasak Metals Co., Ltd.", amount: 88000, vat: 6160, total: 94160 }, status: "Pending Review" },
  { id: "ocr2", fileName: "customer_po_bluepeak_882.pdf", uploadedDate: "2026-05-27", docType: "Customer PO",
    extracted: { docNumber: "BP-PO-882", date: "2026-05-25", companyName: "BluePeak Industries", amount: 95000, vat: 6650, total: 101650 }, status: "Pending Review" },
  { id: "ocr3", fileName: "receipt_office_supplies.jpg", uploadedDate: "2026-05-22", docType: "Receipt",
    extracted: { docNumber: "RCP-09921", date: "2026-05-22", companyName: "Office Mate", amount: 1850, vat: 129.5, total: 1979.5 }, status: "Approved", reviewer: "Khun Ploy" },
];

// ---------- Customer Portal mock activity ----------
export interface PortalActivity {
  id: string; customerName: string; action: string; reference: string; date: string;
}
export const portalActivity: PortalActivity[] = [
  { id: "pa1", customerName: "Anan Precision", action: "เปิดดูใบเสนอราคา", reference: "QT-2026-0042", date: "2026-05-28 14:21" },
  { id: "pa2", customerName: "Chaiyo Trading", action: "อัพโหลด PO", reference: "CT-PO-991", date: "2026-05-27 10:05" },
  { id: "pa3", customerName: "BluePeak Industries", action: "ตรวจสอบสถานะงาน", reference: "JOB-2026-0007", date: "2026-05-26 16:40" },
  { id: "pa4", customerName: "Marine Spec", action: "ดาวน์โหลดใบกำกับภาษี", reference: "INV-CT-0040", date: "2026-05-25 09:12" },
];

// ---------- Calendar Sync (mock) ----------
export type CalSyncStatus = "Not Connected" | "Connected Demo";
export interface CalSyncCategory { id: string; name: string; thai: string; enabled: boolean }
export const calSyncCategories: CalSyncCategory[] = [
  { id: "cs1", name: "Supplier payment due date", thai: "วันครบกำหนดจ่ายซัพพลายเออร์", enabled: true },
  { id: "cs2", name: "Customer invoice due date", thai: "วันครบกำหนดเก็บเงินจากลูกค้า", enabled: true },
  { id: "cs3", name: "Job due date", thai: "วันส่งมอบงาน", enabled: true },
  { id: "cs4", name: "Service / calibration due date", thai: "วันสอบเทียบ/บริการหลังขาย", enabled: true },
  { id: "cs5", name: "Customer follow-up", thai: "นัดติดตามลูกค้า", enabled: false },
];

// ---------- AI Email Intake ----------
export type AiEmailStatus = "Pending Review" | "Approved" | "Rejected";
export interface AiEmail {
  id: string; from: string; subject: string; receivedDate: string;
  extracted: { supplierName: string; billNumber: string; dueDate: string; amount: number };
  status: AiEmailStatus;
}
export const aiEmails: AiEmail[] = [
  { id: "ae1", from: "billing@thanasak.co.th", subject: "Invoice TNS-4521", receivedDate: "2026-05-28 08:14",
    extracted: { supplierName: "Thanasak Metals", billNumber: "TNS-4521", dueDate: "2026-06-25", amount: 94160 }, status: "Pending Review" },
  { id: "ae2", from: "accounts@kiatchai.com", subject: "Monthly statement May 2026", receivedDate: "2026-05-27 11:02",
    extracted: { supplierName: "Kiatchai Hardware", billNumber: "KCH-0512", dueDate: "2026-06-15", amount: 38500 }, status: "Pending Review" },
  { id: "ae3", from: "finance@foundryco.co.th", subject: "Invoice FCB-2210", receivedDate: "2026-05-22 09:30",
    extracted: { supplierName: "Foundry Co.", billNumber: "FCB-2210", dueDate: "2026-06-05", amount: 72000 }, status: "Approved" },
];

// ---------- Document Approvals ----------
export const DOC_APPROVAL_STATUSES = ["Draft", "Submitted", "Pending Review", "Approved", "Rejected", "Revision Required", "Cancelled"] as const;
export type DocApprovalStatus = typeof DOC_APPROVAL_STATUSES[number];
export const APPROVAL_DOC_TYPES = ["Quotation", "Customer PO Revision", "Supplier PO", "Supplier Bill", "Customer Invoice", "Payment Voucher", "Change Order", "Payroll", "Asset Disposal"] as const;
export type ApprovalDocType = typeof APPROVAL_DOC_TYPES[number];

export interface ApprovalHistoryEntry { date: string; from: DocApprovalStatus | "—"; to: DocApprovalStatus; by: string; comment?: string }
export interface DocApproval {
  id: string; docType: ApprovalDocType; reference: string;
  requestedBy: string; reviewer: string; approvedBy?: string; approvedDate?: string;
  comment?: string; status: DocApprovalStatus; amount?: number;
  history: ApprovalHistoryEntry[];
}

export const docApprovals: DocApproval[] = [
  { id: "ap1", docType: "Supplier PO", reference: "PO-2026-024", requestedBy: "Khun Ploy", reviewer: "Khun Somchai", status: "Pending Review", amount: 60500,
    history: [
      { date: "2026-05-20 10:12", from: "—", to: "Draft", by: "Khun Ploy" },
      { date: "2026-05-20 14:30", from: "Draft", to: "Submitted", by: "Khun Ploy" },
      { date: "2026-05-21 09:00", from: "Submitted", to: "Pending Review", by: "System" },
    ] },
  { id: "ap2", docType: "Customer Invoice", reference: "INV-CT-0046", requestedBy: "Khun Ploy", reviewer: "Khun Somchai", status: "Approved", amount: 256800, approvedBy: "Khun Somchai", approvedDate: "2026-05-22",
    history: [
      { date: "2026-05-21 11:10", from: "—", to: "Draft", by: "Khun Ploy" },
      { date: "2026-05-21 15:40", from: "Draft", to: "Submitted", by: "Khun Ploy" },
      { date: "2026-05-22 09:55", from: "Submitted", to: "Approved", by: "Khun Somchai", comment: "OK ส่งไปลูกค้าได้" },
    ] },
  { id: "ap3", docType: "Change Order", reference: "CO-2026-008", requestedBy: "Customer (Khun Wirat)", reviewer: "Khun Somchai", status: "Pending Review", amount: 18000,
    history: [{ date: "2026-05-26 10:00", from: "—", to: "Pending Review", by: "Khun Ploy" }] },
  { id: "ap4", docType: "Payroll", reference: "PAYROLL-2026-05", requestedBy: "Khun Ploy", reviewer: "Khun Somchai", status: "Submitted",
    history: [
      { date: "2026-05-28 17:10", from: "—", to: "Draft", by: "Khun Ploy" },
      { date: "2026-05-28 18:00", from: "Draft", to: "Submitted", by: "Khun Ploy" },
    ] },
  { id: "ap5", docType: "Quotation", reference: "QT-2026-0051", requestedBy: "Khun Ploy", reviewer: "Khun Somchai", status: "Revision Required", amount: 95000,
    history: [
      { date: "2026-05-18 13:00", from: "—", to: "Submitted", by: "Khun Ploy" },
      { date: "2026-05-19 09:20", from: "Submitted", to: "Revision Required", by: "Khun Somchai", comment: "ขอเพิ่มอัตราส่วนกำไร" },
    ] },
];

// ---------- Internal Thai Document Templates ----------
export const THAI_DOC_TYPES = [
  { id: "td1", name: "ใบเสนอราคา", en: "Quotation" },
  { id: "td2", name: "ใบวางบิล", en: "Billing Note" },
  { id: "td3", name: "ใบรวมบิล", en: "Combined Billing" },
  { id: "td4", name: "ใบส่งสินค้า", en: "Delivery Note" },
  { id: "td5", name: "ใบแจ้งหนี้", en: "Invoice" },
  { id: "td6", name: "ใบกำกับภาษี", en: "Tax Invoice" },
  { id: "td7", name: "ใบเสร็จรับเงิน", en: "Receipt" },
  { id: "td8", name: "ใบสำคัญจ่าย", en: "Payment Voucher" },
  { id: "td9", name: "ใบสั่งซื้อ", en: "Purchase Order" },
  { id: "td10", name: "ใบรับสินค้า", en: "Goods Receipt" },
];
