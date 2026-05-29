// Derive notifications from current mock data.
import { reminders, quotations, jobs, supplierBills, serviceRecords } from "./mockData";
import { tasks, customerInvoices, changeOrders, receivingRecords } from "./mockBusiness";

export type Notif = {
  id: string;
  title: string;
  detail: string;
  date: string;
  severity: "info" | "warning" | "danger" | "success";
  link: string;
  category: string;
};

const within = (date: string, days: number) => {
  const t = new Date("2026-05-29").getTime();
  const d = new Date(date).getTime();
  return (d - t) / 86400000 <= days;
};

export const buildNotifications = (): Notif[] => {
  const out: Notif[] = [];
  // Reminders
  reminders.forEach((r) => out.push({
    id: r.id, title: r.type, detail: r.title, date: r.date,
    severity: r.severity, link: "/calendar", category: "Reminder",
  }));
  // Quotation expiring
  quotations.filter((q) => q.status === "Sent" && within(q.validUntil, 14)).forEach((q) =>
    out.push({ id: `qx-${q.id}`, title: "Quotation expiring", detail: `${q.number} valid until ${q.validUntil}`,
      date: q.validUntil, severity: "warning", link: "/quotations", category: "Quotation" }));
  // Job due
  jobs.filter((j) => j.status !== "Closed" && j.status !== "Delivered" && within(j.dueDate, 14)).forEach((j) =>
    out.push({ id: `jd-${j.id}`, title: "Job due soon", detail: `${j.number} due ${j.dueDate}`,
      date: j.dueDate, severity: "warning", link: "/jobs", category: "Job" }));
  // Supplier bill due
  supplierBills.filter((b) => b.status !== "Paid").forEach((b) =>
    out.push({ id: `sb-${b.id}`, title: b.status === "Overdue" ? "Supplier bill overdue" : "Supplier bill due",
      detail: `${b.number}`, date: b.dueDate,
      severity: b.status === "Overdue" ? "danger" : "warning", link: "/supplier-bills", category: "Bill" }));
  // Customer invoice due
  customerInvoices.filter((i) => i.status !== "Paid").forEach((i) =>
    out.push({ id: `ci-${i.id}`, title: i.status === "Overdue" ? "Customer invoice overdue" : "Customer invoice due",
      detail: `${i.number}`, date: i.dueDate,
      severity: i.status === "Overdue" ? "danger" : "info", link: "/invoices", category: "Invoice" }));
  // Service due
  serviceRecords.filter((s) => s.status === "Due" || s.status === "Missed").forEach((s) =>
    out.push({ id: `sv-${s.id}`, title: "Service / calibration due", detail: `${s.partName}`,
      date: s.calibrationDueDate, severity: s.status === "Missed" ? "danger" : "warning",
      link: "/service", category: "Service" }));
  // Overdue / pending tasks
  tasks.filter((t) => t.status === "Overdue" || (t.status !== "Done" && within(t.dueDate, 3))).forEach((t) =>
    out.push({ id: `tk-${t.id}`, title: t.status === "Overdue" ? "Overdue task" : "Task due soon",
      detail: t.name, date: t.dueDate,
      severity: t.status === "Overdue" ? "danger" : "info", link: "/tasks", category: "Task" }));
  // Pending approval (change orders)
  changeOrders.filter((c) => c.approvalStatus === "Pending").forEach((c) =>
    out.push({ id: `co-${c.id}`, title: "Change order pending approval", detail: c.number,
      date: c.requestDate, severity: "warning", link: "/change-orders", category: "Approval" }));
  // QC issues
  receivingRecords.filter((r) => r.qcStatus === "Failed" || r.qcStatus === "Need Rework").forEach((r) =>
    out.push({ id: `qc-${r.id}`, title: "QC issue", detail: r.qcNote, date: r.receivedDate,
      severity: "danger", link: "/jobs", category: "QC" }));
  return out.sort((a, b) => a.date.localeCompare(b.date));
};
