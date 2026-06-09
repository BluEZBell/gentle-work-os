import { useState, useMemo } from "react";
import { PageHeader } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodFilter, defaultPeriod, matchesPeriod, type PeriodValue } from "@/components/PeriodFilter";
import { DashboardCharts } from "@/components/DashboardCharts";
import {
  AlertTriangle, Wallet, Banknote, Briefcase, CheckSquare, Boxes, Wrench,
  TrendingUp, Coins, CalendarCheck, ArrowRight, Bell, Truck,
} from "lucide-react";
import {
  deals, dealStatusThai, fmtTHB, findCustomer, findSupplier,
  supplierBills, serviceRecords, auditLogs, jobs,
} from "@/lib/mockData";
import {
  tasks, customerInvoices, changeOrders,
} from "@/lib/mockBusiness";
import { docApprovals, stockItems, stockTotal } from "@/lib/mockExtended";
import { calendarEvents, eventTitle, paymentVouchers } from "@/lib/mockCalendar";
import { useTick } from "@/lib/store";
import { useBizTick } from "@/lib/storeBusiness";
import { Link } from "react-router-dom";

const todayStr = new Date().toISOString().slice(0, 10);
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const weekEnd = inDays(7);

export default function Dashboard() {
  useTick(); useBizTick();
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());

  // ---- Period-aware slices ----
  const periodInvoices = useMemo(() =>
    customerInvoices.filter((i) => matchesPeriod(i.date, period) &&
      (period.customerId === "all" || i.customerId === period.customerId)),
    [period]);
  const periodBills = useMemo(() =>
    supplierBills.filter((b) => matchesPeriod(b.billDate, period)),
    [period]);
  const periodJobs = useMemo(() =>
    jobs.filter((j) => matchesPeriod(j.startDate, period) &&
      (period.customerId === "all" || j.customerId === period.customerId)),
    [period]);

  // ---- 1. Today's urgent ----
  const urgentToday = [
    ...tasks.filter((t) => t.status === "Overdue").map((t) => ({
      id: `t-${t.id}`, label: t.name, sub: `${t.owner} • ${t.dueDate}`, tone: "danger" as const, to: "/tasks", icon: Briefcase,
    })),
    ...customerInvoices.filter((i) => i.status === "Overdue").map((i) => ({
      id: `i-${i.id}`, label: `${i.number} ${fmtTHB(i.total)}`, sub: `${findCustomer(i.customerId)?.name} • เกินกำหนด ${i.dueDate}`, tone: "danger" as const, to: `/invoices/${i.id}`, icon: Wallet,
    })),
    ...supplierBills.filter((b) => b.status === "Overdue").map((b) => ({
      id: `b-${b.id}`, label: `${b.number} ${fmtTHB(b.total)}`, sub: `${findSupplier(b.supplierId)?.name} • ค้างจ่าย`, tone: "danger" as const, to: `/supplier-bills/${b.id}`, icon: Banknote,
    })),
    ...calendarEvents.filter((e) => e.date === todayStr).slice(0, 3).map((e) => ({
      id: `e-${e.id}`, label: eventTitle(e), sub: `กิจกรรมวันนี้ ${e.time ?? ""}`, tone: "warning" as const, to: "/calendar", icon: CalendarCheck,
    })),
  ].slice(0, 6);

  // ---- 2. Cash in/out ----
  const cashInWeek = periodInvoices.filter((i) => i.status !== "Paid" && i.dueDate >= todayStr && i.dueDate <= weekEnd).reduce((s, i) => s + i.total, 0);
  const cashOutWeek = periodBills.filter((b) => b.status !== "Paid" && b.dueDate >= todayStr && b.dueDate <= weekEnd).reduce((s, b) => s + b.total, 0);
  const overdueAR = periodInvoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.total, 0);
  const overdueAP = periodBills.filter((b) => b.status === "Overdue").reduce((s, b) => s + b.total, 0);

  // ---- 3. Jobs & delivery ----
  const activeJobs = periodJobs.filter((j) => j.status === "In Progress" || j.status === "Waiting Supplier");
  const deliveringSoon = periodJobs.filter((j) => j.dueDate >= todayStr && j.dueDate <= weekEnd);
  const monthRevenue = periodJobs.reduce((s, j) => s + j.sellPrice, 0);
  const monthProfit = periodJobs.reduce((s, j) => s + (j.sellPrice - j.actualCost), 0);

  // ---- 4. Approvals ----
  const pendingApprovals =
    docApprovals.filter((a) => a.status === "Pending Review" || a.status === "Submitted").length +
    changeOrders.filter((c) => c.approvalStatus === "Pending").length +
    paymentVouchers.filter((v) => v.approvalStatus === "Pending Approval").length;

  // ---- 5. Stock & service ----
  const lowStockCount = stockItems.filter((s) => stockTotal(s) < s.reorderPoint).length;
  const serviceDue = serviceRecords.filter((s) => s.status === "Due" || s.status === "Missed").length;

  // ---- 6. Pipeline ----
  const pipelineCols = ["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won"] as const;
  const pipeline = pipelineCols.map((col) => ({
    col, deals: deals.filter((d) => d.status === col),
  }));
  const wonValue = deals.filter((d) => d.status === "Won").reduce((s, d) => s + d.estimatedValue, 0);

  return (
    <>
      <PageHeader
        title="Dashboard" thai="แดชบอร์ด"
        description="สรุปสิ่งสำคัญของวันนี้ — เงินเข้า เงินออก งานที่ต้องส่ง และสิ่งที่รออนุมัติ"
      />

      <PeriodFilter value={period} onChange={setPeriod} showStatus={false} />

      {/* ========== 1. URGENT ACTIONS ========== */}
      <Card className="card-soft p-5 mb-4 border-l-4 border-l-destructive">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-destructive/10 grid place-items-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-semibold">งานด่วนวันนี้</h2>
              <p className="text-xs text-muted-foreground">สิ่งที่ต้องจัดการทันที</p>
            </div>
          </div>
          <Link to="/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {urgentToday.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">วันนี้ยังไม่มีงานด่วน 🎉</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {urgentToday.map((u) => {
              const Icon = u.icon;
              return (
                <Link key={u.id} to={u.to} className={`flex items-start gap-3 rounded-lg p-3 border-l-4 hover:shadow-sm transition ${
                  u.tone === "danger" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning-soft"
                }`}>
                  <Icon className={"w-4 h-4 mt-0.5 " + (u.tone === "danger" ? "text-destructive" : "text-warning-foreground")} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{u.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========== 2. CASH IN / OUT ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Link to="/invoices?filter=due-soon"><StatCard label="Cash In · 7 วัน" thai="เงินจะเข้า" value={fmtTHB(cashInWeek)} icon={Wallet} tone="success" /></Link>
        <Link to="/supplier-bills?filter=due-soon"><StatCard label="Cash Out · 7 วัน" thai="เงินจะออก" value={fmtTHB(cashOutWeek)} icon={Banknote} tone="warning" /></Link>
        <Link to="/invoices?filter=Overdue"><StatCard label="AR เกินกำหนด" thai="ลูกหนี้ค้าง" value={fmtTHB(overdueAR)} icon={AlertTriangle} tone="danger" /></Link>
        <Link to="/supplier-bills?filter=Overdue"><StatCard label="AP เกินกำหนด" thai="เจ้าหนี้ค้าง" value={fmtTHB(overdueAP)} icon={AlertTriangle} tone="danger" /></Link>
      </div>

      {/* ========== 3. JOBS & DELIVERY ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Link to="/jobs"><StatCard label="งานกำลังทำ" thai="Active" value={activeJobs.length} icon={Briefcase} tone="info" /></Link>
        <Link to="/jobs"><StatCard label="ส่งมอบใน 7 วัน" thai="Delivering" value={deliveringSoon.length} icon={Truck} tone="warning" /></Link>
        <StatCard label="รายได้ในช่วง" thai="Revenue" value={fmtTHB(monthRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="กำไรในช่วง" thai="Profit" value={fmtTHB(monthProfit)} icon={Coins} tone="success"
          hint={monthRevenue ? `${Math.round((monthProfit / monthRevenue) * 100)}% margin` : undefined} />
      </div>

      {/* ========== 4-5. APPROVALS · STOCK · SERVICE ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Link to="/approvals"><StatCard label="รออนุมัติ" thai="Approvals" value={pendingApprovals} icon={CheckSquare} tone="warning" /></Link>
        <Link to="/warehouses?filter=low"><StatCard label="สต๊อกใกล้หมด" thai="Low Stock" value={lowStockCount} icon={Boxes} tone="danger" /></Link>
        <Link to="/service?filter=due-soon"><StatCard label="บริการครบกำหนด" thai="Service Due" value={serviceDue} icon={Wrench} tone="warning" /></Link>
        <Link to="/notifications"><StatCard label="แจ้งเตือนใหม่" thai="Alerts" value={urgentToday.length} icon={Bell} tone="info" /></Link>
      </div>

      {/* ========== CHARTS ========== */}
      <div className="mb-4">
        <DashboardCharts period={period} />
      </div>

      {/* ========== 6. PIPELINE ========== */}
      <Card className="card-soft p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-semibold">Sales Pipeline (ไปป์ไลน์การขาย)</h2>
            <p className="text-xs text-muted-foreground">{deals.length} ดีล • ได้งานแล้ว {fmtTHB(wonValue)}</p>
          </div>
          <Link to="/deals" className="text-xs text-primary hover:underline flex items-center gap-1">
            จัดการดีล <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {pipeline.map(({ col, deals: ds }) => (
            <Link key={col} to="/deals" className="rounded-lg bg-secondary/60 hover:bg-secondary p-2.5 transition">
              <div className="text-[10px] font-medium text-muted-foreground leading-tight">{dealStatusThai[col]}</div>
              <div className="font-display text-xl font-semibold mt-1">{ds.length}</div>
              <div className="text-[11px] text-muted-foreground">{fmtTHB(ds.reduce((a, b) => a + b.estimatedValue, 0))}</div>
            </Link>
          ))}
        </div>
      </Card>

      {/* ========== Today's calendar + 7. RECENT ========== */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="card-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">ปฏิทินวันนี้ & สัปดาห์นี้</h2>
            <Link to="/calendar" className="text-xs text-primary hover:underline">เปิดปฏิทิน →</Link>
          </div>
          {calendarEvents.filter((e) => e.date >= todayStr && e.date <= weekEnd).slice(0, 6).length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">ไม่มีกิจกรรม</div>
          ) : (
            <div className="space-y-1.5">
              {calendarEvents.filter((e) => e.date >= todayStr && e.date <= weekEnd).slice(0, 6).map((e) => (
                <Link key={e.id} to="/calendar" className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 hover:bg-secondary/40 rounded px-2 -mx-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{eventTitle(e)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{e.date.slice(5)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display font-semibold mb-3">กิจกรรมล่าสุด</h2>
          <div className="space-y-1.5">
            {auditLogs.slice(0, 6).map((a) => (
              <div key={a.id} className="text-sm py-1.5 border-b last:border-0">
                <div className="flex justify-between gap-3">
                  <span className="font-medium truncate">{a.action}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{a.timestamp.slice(5)}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{a.user} — {a.entity}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
