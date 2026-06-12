// Thai display options for Customer & Sales zone.
// Values map to existing English types where applicable so filters keep working.

export const CUSTOMER_TYPES_TH: { value: string; label: string }[] = [
  { value: "New", label: "ลูกค้าใหม่" },
  { value: "Existing", label: "ลูกค้าเดิม" },
  { value: "Regular", label: "ลูกค้าประจำ" },
  { value: "Corporate", label: "ลูกค้าองค์กร" },
  { value: "Juristic", label: "ลูกค้านิติบุคคล" },
  { value: "Individual", label: "ลูกค้าบุคคลธรรมดา" },
  { value: "Partner", label: "คู่ค้า" },
  { value: "Key", label: "ลูกค้าสำคัญ" },
  { value: "FollowUp", label: "ลูกค้าที่ต้องติดตาม" },
  { value: "Suspended", label: "ระงับการซื้อขาย" },
];

export const customerTypeThai = (v: string) =>
  CUSTOMER_TYPES_TH.find((o) => o.value === v)?.label ?? v;

// Map to existing LEAD_SOURCES values where possible; new values are display-only.
export const LEAD_SOURCES_TH: { value: string; label: string }[] = [
  { value: "Referral", label: "ลูกค้าแนะนำ" },
  { value: "Existing Customer", label: "ลูกค้าเก่า" },
  { value: "PhoneIn", label: "โทรเข้ามา" },
  { value: "LINE", label: "Line OA" },
  { value: "Facebook", label: "Facebook" },
  { value: "Website", label: "เว็บไซต์" },
  { value: "TradeShow", label: "งานแสดงสินค้า" },
  { value: "SalesTeam", label: "ทีมขายหาเอง" },
  { value: "SupplierRef", label: "Supplier แนะนำ" },
  { value: "Partner", label: "Partner แนะนำ" },
  { value: "WalkIn", label: "Walk-in" },
  { value: "Other", label: "อื่น ๆ" },
];

export const leadSourceThai = (v?: string) =>
  LEAD_SOURCES_TH.find((o) => o.value === v)?.label ?? v ?? "—";
