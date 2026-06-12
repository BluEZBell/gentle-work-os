// Lightweight in-memory notes store for customers and contacts.
import { useEffect, useState } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
const bump = () => listeners.forEach((l) => l());
export function useNotesTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    listeners.add(l); return () => { listeners.delete(l); };
  }, []);
}

export const CUSTOMER_NOTE_TYPES = [
  "Customer Memo", "Internal Note", "Billing Note", "Sales Note", "Service Note", "Risk Note",
] as const;
export const CONTACT_NOTE_TYPES = [
  "Short Note", "Internal Memo", "Relationship Note", "Communication Preference", "Important Reminder",
] as const;

export type CustomerNoteType = typeof CUSTOMER_NOTE_TYPES[number];
export type ContactNoteType = typeof CONTACT_NOTE_TYPES[number];

export interface CustomerNote {
  id: string; customerId: string; type: CustomerNoteType; body: string; user: string; createdAt: string;
}
export interface ContactNote {
  id: string; contactId: string; type: ContactNoteType; body: string; user: string; createdAt: string;
}

const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export const customerNotes: CustomerNote[] = [
  { id: "cn1", customerId: "c1", type: "Customer Memo", body: "ลูกค้าชอบให้สรุปราคาเป็น PDF ก่อนโทรคุย", user: "Khun Ploy", createdAt: "2026-05-12 10:20" },
  { id: "cn2", customerId: "c1", type: "Billing Note", body: "ต้องส่งใบวางบิลทาง Email ก่อนทุก 25 ของเดือน", user: "Khun Somchai", createdAt: "2026-04-25 09:00" },
  { id: "cn3", customerId: "c2", type: "Sales Note", body: "เป็นลูกค้า Recurring — มี Calibration ทุกปี", user: "Khun Ploy", createdAt: "2026-04-10 14:30" },
  { id: "cn4", customerId: "c3", type: "Internal Note", body: "ลูกค้าใหม่ — ระวังเครดิต ขอ Cash ก่อน 2 บิลแรก", user: "Khun Somchai", createdAt: "2026-05-20 11:45" },
];

export const contactNotes: ContactNote[] = [
  { id: "ctn1", contactId: "ct1", type: "Communication Preference", body: "ชอบให้ติดต่อผ่าน Line มากกว่าโทร", user: "Khun Ploy", createdAt: "2026-05-10 09:30" },
  { id: "ctn2", contactId: "ct1", type: "Important Reminder", body: "เป็นคนอนุมัติ PO", user: "Khun Somchai", createdAt: "2026-04-20 16:00" },
  { id: "ctn3", contactId: "ct6", type: "Relationship Note", body: "ต้องส่งเอกสารให้ฝ่ายบัญชีอีกคน (Khun Aim)", user: "Khun Ploy", createdAt: "2026-03-15 10:00" },
];

export const addCustomerNote = (customerId: string, type: CustomerNoteType, body: string, user: string) => {
  customerNotes.unshift({ id: uid("cn"), customerId, type, body, user, createdAt: stamp() });
  bump();
};
export const addContactNote = (contactId: string, type: ContactNoteType, body: string, user: string) => {
  contactNotes.unshift({ id: uid("ctn"), contactId, type, body, user, createdAt: stamp() });
  bump();
};
