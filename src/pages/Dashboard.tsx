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
        description="A calm overview of your business — sales, jobs, payments, and after-sales reminders."
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
              <h2 className="font-display text-lg font-semibold">Sales Pipeline Overview</h2>
              <p className="text-xs text-muted-foreground">{deals.length} deals across {pipelineCols.length} stages</p>
            </div>
            <Link to="/deals" className="text-sm text-primary hover:underline">Open pipeline →</Link>
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
          <h2 className="font-display text-lg font-semibold mb-1">Profit Snapshot</h2>
          <p className="text-xs text-muted-foreground mb-4">Active & completed jobs</p>
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
                    <div className="text-xs text-muted-foreground">{margin}% margin</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Upcoming Payments</h2>
          <div className="space-y-2">
            {supplierBills.filter((b) => b.status !== "Paid").map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{findSupplier(b.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{b.number} • due {b.dueDate}</div>
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
          <h2 className="font-display text-lg font-semibold mb-3">Upcoming Service / Calibration</h2>
          <div className="space-y-2">
            {serviceRecords.filter((s) => s.status !== "Completed").map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{findCustomer(s.customerId)?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.partName} • due {s.calibrationDueDate}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Recent Activity</h2>
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

      <Card className="card-soft p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">All Reminders</h2>
          <Link to="/calendar" className="text-sm text-primary hover:underline">Open calendar →</Link>
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
