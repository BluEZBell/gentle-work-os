import { PageHeader } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users, Briefcase, FileText, Trophy, XCircle, TrendingUp, Coins,
  Receipt, Wrench, AlertTriangle, Boxes, Wallet, CheckSquare, FileScan, Mail,
  Warehouse, Globe, CalendarCheck,
} from "lucide-react";
import {
  dashboardStats, deals, dealStatusThai, reminders, fmtTHB, findCustomer,
  supplierBills, findSupplier, serviceRecords, auditLogs, jobs,
} from "@/lib/mockData";
import {
  tasks, customerInvoices, purchaseOrders, changeOrders, receivingRecords,
} from "@/lib/mockBusiness";
import {
  assets, assetBookValue, assetMonthlyDep, payrollLines, payrollNetPay,
  stockItems, stockTotal, docApprovals, ocrDocuments, aiEmails, portalActivity,
} from "@/lib/mockExtended";
import { calendarEvents, eventTitle, paymentVouchers, printLog } from "@/lib/mockCalendar";
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
        <Link to="/supplier-bills?filter=due-soon"><StatCard label="Bills Due Soon" thai="บิลใกล้ครบ" value={s.billsDueSoon} icon={Receipt} tone="warning" /></Link>
        <Link to="/service?filter=due-soon"><StatCard label="Service Due Soon" thai="บริการใกล้ครบ" value={s.svcDueSoon} icon={Wrench} tone="warning" /></Link>
        <Link to="/invoices?filter=Overdue"><StatCard label="Overdue Alerts" thai="เกินกำหนด" value={s.overdue} icon={AlertTriangle} tone="danger" /></Link>
      </div>

      <CalendarBillingWidgets />

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
                <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between text-sm hover:bg-secondary/40 rounded px-1 -mx-1 py-1">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{j.number}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-success">{fmtTHB(profit)}</div>
                    <div className="text-xs text-muted-foreground">มาร์จิ้น {margin}%</div>
                  </div>
                </Link>
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
              <Link key={b.id} to={`/supplier-bills/${b.id}`} className="flex items-center justify-between text-sm py-2 border-b last:border-0 hover:bg-secondary/40 rounded px-1 -mx-1">
                <div>
                  <div className="font-medium">{findSupplier(b.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{b.number} • ครบกำหนด {b.dueDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{fmtTHB(b.total)}</div>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Upcoming Service / Calibration (บริการที่ใกล้ครบ)</h2>
          <div className="space-y-2">
            {serviceRecords.filter((s) => s.status !== "Completed").map((s) => (
              <Link key={s.id} to={`/service/${s.id}`} className="flex items-center justify-between text-sm py-2 border-b last:border-0 hover:bg-secondary/40 rounded px-1 -mx-1">
                <div className="min-w-0">
                  <div className="font-medium truncate">{findCustomer(s.customerId)?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.partName} • ครบกำหนด {s.calibrationDueDate}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </Link>
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

        <Link to="/invoices?filter=due-soon" className="block">
        <Card className="card-soft p-5 hover:shadow-md transition-shadow h-full">
          <h2 className="font-display text-lg font-semibold mb-1">Incoming Customer Payments (เงินที่จะเข้าจากลูกค้า)</h2>
          <p className="text-xs text-muted-foreground mb-3">คลิกเพื่อดูใบแจ้งหนี้ที่ยังไม่ชำระ</p>
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
        </Card>
        </Link>

        <Link to="/purchase-orders?filter=pending" className="block">
        <Card className="card-soft p-5 hover:shadow-md transition-shadow h-full">
          <h2 className="font-display text-lg font-semibold mb-1">Pending Purchase Orders (ใบสั่งซื้อรอดำเนินการ)</h2>
          <p className="text-xs text-muted-foreground mb-3">รอซัพพลายเออร์ตอบรับ — คลิกเพื่อดูทั้งหมด</p>
          <div className="space-y-2">
            {purchaseOrders.filter(p => p.status === "Draft" || p.status === "Sent" || p.status === "Confirmed").map(p => (
              <div key={p.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div><div className="font-medium">{p.number}</div>
                  <div className="text-xs text-muted-foreground">{findSupplier(p.supplierId)?.name}</div></div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </Card>
        </Link>

        <Link to="/barcode-issue?filter=qc-issue" className="block">
        <Card className="card-soft p-5 hover:shadow-md transition-shadow h-full">
          <h2 className="font-display text-lg font-semibold mb-1">QC Issues (ปัญหาคุณภาพงาน)</h2>
          <p className="text-xs text-muted-foreground mb-3">รายการที่ไม่ผ่าน QC หรือต้องแก้ไข — คลิกเพื่อดูรายละเอียด</p>
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
        </Link>

        <Link to="/change-orders?filter=Pending" className="block">
        <Card className="card-soft p-5 hover:shadow-md transition-shadow h-full">
          <h2 className="font-display text-lg font-semibold mb-1">Change Orders Pending (คำขอเปลี่ยนแปลงรออนุมัติ)</h2>
          <p className="text-xs text-muted-foreground mb-3">คลิกเพื่อดูคำขอที่รออนุมัติ</p>
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
        </Card>
        </Link>
      </div>

      {/* New: Peony Business OS module widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        <StatCard label="Asset Book Value" thai="มูลค่าสินทรัพย์" value={fmtTHB(assets.reduce((s, a) => s + assetBookValue(a), 0))} icon={Boxes} tone="success" />
        <StatCard label="Monthly Depreciation" thai="ค่าเสื่อม/เดือน" value={fmtTHB(assets.filter(a => a.status === "Active").reduce((s, a) => s + assetMonthlyDep(a), 0))} icon={TrendingUp} tone="warning" />
        <StatCard label="Payroll This Month" thai="เงินเดือนเดือนนี้" value={fmtTHB(payrollLines.reduce((s, p) => s + payrollNetPay(p), 0))} icon={Wallet} />
        <Link to="/approvals?filter=Pending Review"><StatCard label="Pending Approvals" thai="รออนุมัติ" value={docApprovals.filter(a => a.status === "Pending Review" || a.status === "Submitted").length} icon={CheckSquare} tone="warning" /></Link>
        <Link to="/warehouses?filter=low"><StatCard label="Low Stock Items" thai="สต๊อกต่ำ" value={stockItems.filter(s => stockTotal(s) < s.reorderPoint).length} icon={Warehouse} tone="danger" /></Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><FileScan className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">OCR Pending Review (สแกนรอตรวจสอบ)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">เอกสารที่ AI สกัดข้อมูลแล้ว ต้องตรวจสอบก่อนบันทึก</p>
          <div className="space-y-2">
            {ocrDocuments.filter(o => o.status === "Pending Review").map(o => (
              <div key={o.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{o.fileName}</div>
                  <div className="text-xs text-muted-foreground">{o.docType} • {o.extracted.companyName}</div></div>
                <div className="text-right text-sm font-medium">{fmtTHB(o.extracted.total)}</div>
              </div>
            ))}
            {ocrDocuments.filter(o => o.status === "Pending Review").length === 0 && <div className="text-xs text-muted-foreground">ไม่มีรายการรอตรวจสอบ</div>}
          </div>
          <Link to="/ocr-documents" className="text-xs text-primary hover:underline mt-3 inline-block">ดูเอกสารทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><Mail className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">AI Email Pending (อีเมลรอตรวจ)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">บิลที่ AI ดึงข้อมูลจากอีเมลซัพพลายเออร์</p>
          <div className="space-y-2">
            {aiEmails.filter(e => e.status === "Pending Review").map(e => (
              <div key={e.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{e.extracted.supplierName}</div>
                  <div className="text-xs text-muted-foreground">{e.extracted.billNumber} • ครบกำหนด {e.extracted.dueDate}</div></div>
                <div className="text-right text-sm font-medium">{fmtTHB(e.extracted.amount)}</div>
              </div>
            ))}
            {aiEmails.filter(e => e.status === "Pending Review").length === 0 && <div className="text-xs text-muted-foreground">ไม่มีอีเมลรอตรวจ</div>}
          </div>
          <Link to="/ai-email" className="text-xs text-primary hover:underline mt-3 inline-block">ดูอีเมลทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><Warehouse className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Low Stock Alert (สต๊อกใกล้หมด)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">รายการที่ต่ำกว่าจุดสั่งซื้อ</p>
          <div className="space-y-2">
            {stockItems.filter(s => stockTotal(s) < s.reorderPoint).map(s => (
              <div key={s.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.code}</div></div>
                <div className="text-right"><div className="font-medium text-destructive">{stockTotal(s)} {s.unit}</div>
                  <div className="text-xs text-muted-foreground">จุดสั่ง {s.reorderPoint}</div></div>
              </div>
            ))}
            {stockItems.filter(s => stockTotal(s) < s.reorderPoint).length === 0 && <div className="text-xs text-muted-foreground">สต๊อกเพียงพอ</div>}
          </div>
          <Link to="/warehouses" className="text-xs text-primary hover:underline mt-3 inline-block">ดูคลังทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><Globe className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Customer Portal Activity (กิจกรรมพอร์ทัล)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">สิ่งที่ลูกค้าทำในพอร์ทัล</p>
          <div className="space-y-2">
            {portalActivity.slice(0, 4).map(p => (
              <div key={p.id} className="text-sm py-1.5 border-b last:border-0">
                <div className="flex justify-between gap-2"><span className="font-medium truncate">{p.customerName}</span>
                  <span className="text-xs text-muted-foreground">{p.date.slice(11)}</span></div>
                <div className="text-xs text-muted-foreground">{p.action} • {p.reference}</div>
              </div>
            ))}
          </div>
          <Link to="/customer-portal" className="text-xs text-primary hover:underline mt-3 inline-block">เปิดพอร์ทัล →</Link>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><CheckSquare className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Pending Approvals (รออนุมัติ)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">เอกสารที่รอการตรวจสอบ</p>
          <div className="space-y-2">
            {docApprovals.filter(a => a.status === "Pending Review" || a.status === "Submitted").map(a => (
              <div key={a.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div className="min-w-0"><div className="truncate font-medium">{a.reference}</div>
                  <div className="text-xs text-muted-foreground">{a.docType} • {a.requestedBy}</div></div>
                {a.amount !== undefined && <div className="text-right text-sm font-medium">{fmtTHB(a.amount)}</div>}
              </div>
            ))}
          </div>
          <Link to="/approvals" className="text-xs text-primary hover:underline mt-3 inline-block">ดูทั้งหมด →</Link>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-1"><CalendarCheck className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Calendar Sync (สถานะปฏิทิน)</h2></div>
          <p className="text-xs text-muted-foreground mb-3">การเชื่อมต่อกับ Google Calendar (เดโม)</p>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span>สถานะ</span><StatusBadge status="Connected Demo" tone="success" /></div>
            <div className="flex justify-between"><span>ซิงค์ล่าสุด</span><span className="text-muted-foreground">2026-05-29 09:12</span></div>
            <div className="flex justify-between"><span>รายการที่ซิงค์</span><span className="text-muted-foreground">4 หมวด</span></div>
          </div>
          <Link to="/calendar-sync" className="text-xs text-primary hover:underline mt-3 inline-block">จัดการการซิงค์ →</Link>
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

function CalendarBillingWidgets() {
  const today = new Date().toISOString().slice(0, 10);
  const inDays = (n: number) => {
    const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
  };
  const weekEnd = inDays(7);
  const todayEvents = calendarEvents.filter((e) => e.date === today);
  const billingThisWeek = calendarEvents.filter((e) => e.type === "Billing Submission" && e.date >= today && e.date <= weekEnd);
  const incoming = calendarEvents.filter((e) => e.type === "Receive Payment" && e.date >= today && e.date <= weekEnd);
  const outgoing = calendarEvents.filter((e) => e.type === "Pay Supplier" && e.date >= today && e.date <= weekEnd);
  const pendingPV = paymentVouchers.filter((v) => v.approvalStatus === "Pending Approval");
  const printedToday = printLog.filter((l) => l.printedAt.startsWith(today));
  const syncQueue = calendarEvents.filter((e) => e.syncStatus === "Pending" || !e.syncStatus);

  const Widget = ({ title, thai, to, items, render, tone, empty }: {
    title: string; thai: string; to: string; items: unknown[]; tone?: "info" | "success" | "warning" | "danger";
    render: (x: unknown, i: number) => React.ReactNode; empty: string;
  }) => (
    <Card className="card-soft p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-display font-semibold text-sm">{title}</div>
          <div className="text-[11px] text-muted-foreground">{thai}</div>
        </div>
        <Link to={to} className="text-xs text-primary hover:underline">ดูทั้งหมด →</Link>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-3 text-center">{empty}</div>
      ) : (
        <div className="space-y-1 text-sm">{items.slice(0, 4).map(render)}</div>
      )}
      {items.length > 0 && tone && (
        <div className="mt-2"><StatusBadge status={`${items.length} รายการ`} tone={tone} /></div>
      )}
    </Card>
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      <Widget title="Today's Calendar" thai="กิจกรรมวันนี้" to="/calendar" items={todayEvents} tone="info" empty="ไม่มีกิจกรรมวันนี้"
        render={(e: unknown, i) => { const ev = e as typeof todayEvents[number]; return (
          <Link key={i} to="/calendar" className="block truncate hover:text-primary">• {eventTitle(ev)}</Link>
        ); }} />
      <Widget title="Billing Due This Week" thai="กำหนดวางบิลสัปดาห์นี้" to="/calendar" items={billingThisWeek} tone="warning" empty="ไม่มีกำหนดวางบิล"
        render={(e: unknown, i) => { const ev = e as typeof billingThisWeek[number]; return (
          <div key={i} className="flex justify-between"><span className="truncate">{eventTitle(ev)}</span><span className="text-xs text-muted-foreground ml-2">{ev.date.slice(5)}</span></div>
        ); }} />
      <Widget title="Expected Payments" thai="ยอดรับเงินสัปดาห์นี้" to="/calendar" items={incoming} tone="success" empty="ไม่มีรายการ"
        render={(e: unknown, i) => { const ev = e as typeof incoming[number]; return (
          <div key={i} className="flex justify-between"><span className="truncate">{eventTitle(ev)}</span><span className="text-xs ml-2">{ev.amount?.toLocaleString()}</span></div>
        ); }} />
      <Widget title="Supplier Payments" thai="ยอดต้องจ่ายสัปดาห์นี้" to="/payment-vouchers" items={outgoing} tone="danger" empty="ไม่มีรายการ"
        render={(e: unknown, i) => { const ev = e as typeof outgoing[number]; return (
          <div key={i} className="flex justify-between"><span className="truncate">{eventTitle(ev)}</span><span className="text-xs ml-2">{ev.amount?.toLocaleString()}</span></div>
        ); }} />
      <Widget title="Vouchers Pending" thai="ใบสำคัญจ่ายรออนุมัติ" to="/payment-vouchers" items={pendingPV} tone="warning" empty="ไม่มีรายการรออนุมัติ"
        render={(v: unknown, i) => { const pv = v as typeof pendingPV[number]; return (
          <Link key={i} to={`/payment-vouchers/${pv.id}`} className="flex justify-between hover:text-primary"><span>{pv.number}</span><span className="text-xs">{pv.amount.toLocaleString()}</span></Link>
        ); }} />
      <Widget title="Vouchers Printed Today" thai="พิมพ์วันนี้" to="/payment-vouchers" items={printedToday} tone="info" empty="ยังไม่มีการพิมพ์วันนี้"
        render={(l: unknown, i) => { const log = l as typeof printedToday[number]; return (
          <div key={i} className="flex justify-between"><span>{log.relatedId}</span><span className="text-xs">{log.copies} ชุด</span></div>
        ); }} />
      <Widget title="Calendar Sync Queue" thai="คิวซิงค์ Google" to="/calendar-sync" items={syncQueue} tone="info" empty="คิวว่าง"
        render={(e: unknown, i) => { const ev = e as typeof syncQueue[number]; return (
          <div key={i} className="truncate">• {eventTitle(ev)}</div>
        ); }} />
      <Widget title="Receive Goods" thai="รับสินค้าสัปดาห์นี้" to="/calendar"
        items={calendarEvents.filter((e) => e.type === "Receive Goods" && e.date >= today && e.date <= weekEnd)} tone="info" empty="ไม่มีรายการ"
        render={(e: unknown, i) => { const ev = e as typeof calendarEvents[number]; return (
          <div key={i} className="truncate">• {eventTitle(ev)}</div>
        ); }} />
    </div>
  );
}


