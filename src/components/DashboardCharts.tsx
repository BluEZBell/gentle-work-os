import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend,
} from "recharts";
import {
  deals, jobs, supplierBills, fmtTHB, findSupplier,
} from "@/lib/mockData";
import { customerInvoices } from "@/lib/mockBusiness";
import { stockItems, stockTotal } from "@/lib/mockExtended";
import { matchesPeriod, type PeriodValue } from "./PeriodFilter";

const ACCENT = "hsl(var(--primary))";
const GOOD = "hsl(145 45% 42%)";
const BAD = "hsl(4 70% 56%)";
const WARN = "hsl(38 80% 50%)";
const MUTED = "hsl(var(--muted-foreground))";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({ title, thai, children, right }: { title: string; thai: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card className="card-soft p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-sm">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{thai}</p>
        </div>
        {right}
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DashboardCharts({ period }: { period: PeriodValue }) {
  // ---- Cash In vs Cash Out (monthly, last 6 months) ----
  const months: { ym: string; label: string }[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ ym, label: ym.slice(2) });
  }
  const cashflow = months.map(({ ym, label }) => {
    const cashIn = customerInvoices
      .filter((i) => (i.paymentDate || i.date).startsWith(ym) && (i.status === "Paid" || i.status === "Partially Paid"))
      .reduce((s, i) => s + i.total, 0);
    const cashOut = supplierBills
      .filter((b) => b.billDate.startsWith(ym))
      .reduce((s, b) => s + b.total, 0);
    return { month: label, cashIn, cashOut };
  });

  // ---- Job Profit ----
  const profitJobs = jobs
    .filter((j) => matchesPeriod(j.startDate, period))
    .filter((j) => period.customerId === "all" || j.customerId === period.customerId)
    .map((j) => ({ name: j.number.replace("JOB-", ""), profit: j.sellPrice - j.actualCost }));

  // ---- Sales Pipeline ----
  const pipelineCols = ["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won"] as const;
  const pipeline = pipelineCols.map((col) => ({
    name: col, count: deals.filter((d) => d.status === col).length,
    value: deals.filter((d) => d.status === col).reduce((s, d) => s + d.estimatedValue, 0),
  }));

  // ---- Invoice Aging ----
  const todayStr = new Date().toISOString().slice(0, 10);
  const buckets = [
    { name: "ยังไม่ครบกำหนด", min: -9999, max: -1, color: GOOD },
    { name: "0-7 วัน", min: 0, max: 7, color: WARN },
    { name: "8-30 วัน", min: 8, max: 30, color: WARN },
    { name: ">30 วัน", min: 31, max: 9999, color: BAD },
  ];
  const aging = buckets.map((b) => {
    const total = customerInvoices
      .filter((i) => i.status !== "Paid")
      .filter((i) => {
        const days = Math.floor((Date.parse(todayStr) - Date.parse(i.dueDate)) / 86400000);
        return days >= b.min && days <= b.max;
      })
      .reduce((s, i) => s + i.total, 0);
    return { name: b.name, total, color: b.color };
  });

  // ---- Supplier Payment Due (by supplier) ----
  const supDue = Array.from(new Set(supplierBills.filter((b) => b.status !== "Paid").map((b) => b.supplierId))).map((sid) => ({
    name: findSupplier(sid)?.name.split(" ")[0] ?? "—",
    total: supplierBills.filter((b) => b.supplierId === sid && b.status !== "Paid").reduce((s, b) => s + b.total, 0),
  }));

  // ---- Low Stock ----
  const lowStock = stockItems
    .map((s) => ({ name: s.code, current: stockTotal(s), reorder: s.reorderPoint }))
    .filter((s) => s.current < s.reorder)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <ChartCard title="Cash In vs Cash Out" thai="กระแสเงินสดเข้า-ออก รายเดือน">
        <LineChart data={cashflow}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtTHB(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="cashIn" stroke={GOOD} strokeWidth={2.5} name="เงินเข้า" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="cashOut" stroke={BAD} strokeWidth={2.5} name="เงินออก" dot={{ r: 3 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Job Profit" thai="กำไรต่องาน">
        <BarChart data={profitJobs}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtTHB(v)} />
          <Bar dataKey="profit" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Sales Pipeline" thai="ไปป์ไลน์การขาย (มูลค่า)">
        <BarChart data={pipeline} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: MUTED }} width={92} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtTHB(v)} />
          <Bar dataKey="value" fill={ACCENT} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Invoice Aging" thai="อายุหนี้ค้างชำระ">
        <BarChart data={aging}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtTHB(v)} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {aging.map((b, i) => <Cell key={i} fill={b.color} />)}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard title="Supplier Payment Due" thai="ยอดที่ต้องจ่ายซัพพลายเออร์">
        <BarChart data={supDue}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtTHB(v)} />
          <Bar dataKey="total" fill={BAD} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Low Stock" thai="สต๊อกต่ำกว่าจุดสั่งซื้อ">
        <BarChart data={lowStock}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="current" fill={BAD} name="คงเหลือ" radius={[6, 6, 0, 0]} />
          <Bar dataKey="reorder" fill={MUTED} name="จุดสั่งซื้อ" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
