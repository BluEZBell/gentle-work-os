import { PageHeader } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users, Briefcase, FileText, Trophy, XCircle, TrendingUp, Coins,
  Receipt, Wrench, AlertTriangle,
} from "lucide-react";
import {
  dashboardStats, deals, dealStatusThai, reminders, fmtTHB, findCustomer,
  supplierBills, findSupplier, serviceRecords, auditLogs, jobs,
} from "@/lib/mockData";
import {
  tasks, customerInvoices, purchaseOrders, changeOrders, receivingRecords,
} from "@/lib/mockBusiness";
import { useTick } from "@/lib/store";
import { Link } from "react-router-dom";


const pipelineCols: Array<keyof typeof dealStatusThai> = [
  "New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won",
];

export default function Dashboard() {
  useTick();
  const s = dashboardStats();
  const pipeline = pipelineCols.map((col) => ({
    col, deals: deals.filter((d) => d.status === col),
  }));

  return (
    <>
      <PageHeader
        title="Dashboard" thai="แดชบอร์ด"
        description="ภาพรวมธุรกิจของคุณ ทั้งงานขาย งานที่กำลังดำเนินการ การชำระเงิน และการแจ้งเตือนหลังการขาย"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Customers" thai="ลูกค้า" value={s.customers} icon={Users} />
        <StatCard label="Active Deals" thai="กำลังขาย" value={s.active} icon={Briefcase} tone="info" />
        <StatCard label="Quotations This Month" value={s.qThisMonth} icon={FileText} />
        <StatCard label="Won Deals" thai="ได้งาน" value={s.won} icon={Trophy} tone="success" />
        <StatCard label="Lost Deals" thai="ไม่ได้งาน" value={s.lost} icon={XCircle} tone="danger" />
        <StatCard label="Est. Monthly Revenue" value={fmtTHB(s.monthlyRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Est. Gross Profit" value={fmtTHB(s.monthlyProfit)} icon={Coins} tone="success"
          hint={`${Math.round((s.monthlyProfit / s.monthlyRevenue) * 100)}% margin`} />
        <StatCard label="Bills Due Soon" thai="บิลใกล้ครบ" value={s.billsDueSoon} icon={Receipt} tone="warning" />
        <StatCard label="Service Due Soon" thai="บริการใกล้ครบ" value={s.svcDueSoon} icon={Wrench} tone="warning" />
        <StatCard label="Overdue Alerts" thai="เกินกำหนด" value={s.overdue} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="card-soft p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Sales Pipeline Overview (ภาพรวมไปป์ไลน์การขาย)</h2>
              <p className="text-xs text-muted-foreground">{deals.length} ดีลใน {pipelineCols.length} ขั้น</p>
            </div>
            <Link to="/deals" className="text-sm text-primary hover:underline">ดูไปป์ไลน์ทั้งหมด →</Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {pipeline.map(({ col, deals: ds }) => (
              <div key={col} className="rounded-lg bg-secondary/60 p-2.5">
                <div className="text-[11px] font-medium text-muted-foreground leading-tight">
                  {col}
                </div>
                <div className="font-display text-xl font-semibold mt-1">{ds.length}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtTHB(ds.reduce((a, b) => a + b.estimatedValue, 0))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Profit Snapshot (สรุปกำไร)</h2>
          <p className="text-xs text-muted-foreground mb-4">งานที่กำลังทำและงานที่เสร็จแล้ว</p>
          <div className="space-y-3">
            {jobs.map((j) => {
              const profit = j.sellPrice - j.actualCost;
              const margin = Math.round((profit / j.sellPrice) * 100);
              return (
                <div key={j.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{j.number}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-success">{fmtTHB(profit)}</div>
                    <div className="text-xs text-muted-foreground">มาร์จิ้น {margin}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Upcoming Payments (รายการที่ต้องจ่าย)</h2>
          <div className="space-y-2">
            {supplierBills.filter((b) => b.status !== "Paid").map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{findSupplier(b.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{b.number} • ครบกำหนด {b.dueDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{fmtTHB(b.total)}</div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Upcoming Service / Calibration (บริการที่ใกล้ครบ)</h2>
          <div className="space-y-2">
            {serviceRecords.filter((s) => s.status !== "Completed").map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{findCustomer(s.customerId)?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.partName} • ครบกำหนด {s.calibrationDueDate}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Recent Activity (กิจกรรมล่าสุด)</h2>
          <div className="space-y-2">
            {auditLogs.slice(0, 6).map((a) => (
              <div key={a.id} className="text-sm py-2 border-b last:border-0">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-xs text-muted-foreground">{a.timestamp}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.user} — {a.entity}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Today's Tasks (งานวันนี้)</h2>
          <p className="text-xs text-muted-foreground mb-3">{tasks.filter(t => t.dueDate === "2026-05-29" && t.status !== "Done").length} รายการครบกำหนดวันนี้</p>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== "Done").slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.owner} • {t.dueDate}</div></div>
                <StatusBadge status={t.priority} tone={t.priority === "Urgent" ? "danger" : t.priority === "High" ? "warning" : "info"} />
              </div>
            ))}
          </div>
          <Link to="/tasks" className="text-xs text-primary hover:underline mt-3 inline-block">ดูงานทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Overdue Tasks (งานเกินกำหนด)</h2>
          <p className="text-xs text-muted-foreground mb-3">{tasks.filter(t => t.status === "Overdue").length} รายการเกินกำหนด</p>
          <div className="space-y-2">
            {tasks.filter(t => t.status === "Overdue").map(t => (
              <div key={t.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div><div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">ครบกำหนด {t.dueDate}</div></div>
                <StatusBadge status="Overdue" tone="danger" />
              </div>
            ))}
            {tasks.filter(t => t.status === "Overdue").length === 0 && <div className="text-xs text-muted-foreground">ไม่มีงานที่เกินกำหนด</div>}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Incoming Customer Payments (เงินที่จะเข้าจากลูกค้า)</h2>
          <p className="text-xs text-muted-foreground mb-3">ยอดที่ต้องรับจากลูกค้า</p>
          <div className="space-y-2">
            {customerInvoices.filter(i => i.status !== "Paid").map(i => (
              <div key={i.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{findCustomer(i.customerId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{i.number} • ครบกำหนด {i.dueDate}</div></div>
                <div className="text-right"><div className="font-medium">{fmtTHB(i.total)}</div>
                  <StatusBadge status={i.status} /></div>
              </div>
            ))}
          </div>
          <Link to="/invoices" className="text-xs text-primary hover:underline mt-3 inline-block">ดูใบแจ้งหนี้ทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Pending Purchase Orders (ใบสั่งซื้อรอดำเนินการ)</h2>
          <p className="text-xs text-muted-foreground mb-3">รอซัพพลายเออร์ตอบรับ</p>
          <div className="space-y-2">
            {purchaseOrders.filter(p => p.status === "Draft" || p.status === "Sent" || p.status === "Confirmed").map(p => (
              <div key={p.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div><div className="font-medium">{p.number}</div>
                  <div className="text-xs text-muted-foreground">{findSupplier(p.supplierId)?.name}</div></div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
          <Link to="/purchase-orders" className="text-xs text-primary hover:underline mt-3 inline-block">ดูใบสั่งซื้อทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">QC Issues (ปัญหาคุณภาพงาน)</h2>
          <p className="text-xs text-muted-foreground mb-3">รายการที่ไม่ผ่าน QC หรือต้องแก้ไข</p>
          <div className="space-y-2">
            {receivingRecords.filter(r => r.issueFound || r.needRework).map(r => (
              <div key={r.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{r.qcNote}</div>
                  <div className="text-xs text-muted-foreground">{r.poId} • {r.receivedDate}</div></div>
                <StatusBadge status={r.qcStatus} tone="warning" />
              </div>
            ))}
            {receivingRecords.filter(r => r.issueFound || r.needRework).length === 0 && <div className="text-xs text-muted-foreground">ยังไม่มีปัญหา QC</div>}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Change Orders Pending (คำขอเปลี่ยนแปลงรออนุมัติ)</h2>
          <p className="text-xs text-muted-foreground mb-3">รอการอนุมัติจากผู้รับผิดชอบ</p>
          <div className="space-y-2">
            {changeOrders.filter(c => c.approvalStatus === "Pending").map(c => (
              <div key={c.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{c.number}</div>
                  <div className="text-xs text-muted-foreground">{c.description}</div></div>
                <div className="text-right"><div className="font-medium">{fmtTHB(c.costImpact)}</div>
                  <div className="text-xs text-muted-foreground">+{c.timelineImpactDays} วัน</div></div>
              </div>
            ))}
            {changeOrders.filter(c => c.approvalStatus === "Pending").length === 0 && <div className="text-xs text-muted-foreground">ไม่มีคำขอที่รออนุมัติ</div>}
          </div>
          <Link to="/change-orders" className="text-xs text-primary hover:underline mt-3 inline-block">ดูคำขอเปลี่ยนแปลงทั้งหมด →</Link>
        </Card>
      </div>

      <Card className="card-soft p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">All Reminders (การแจ้งเตือนทั้งหมด)</h2>
          <Link to="/calendar" className="text-sm text-primary hover:underline">ดูปฏิทิน →</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.type} • {r.date}</div>
              </div>
              <StatusBadge
                status={r.severity === "danger" ? "Overdue" : r.severity === "warning" ? "Due Soon" : "Upcoming"}
              />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

