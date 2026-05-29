import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import {
  deals, quotations, jobs, supplierBills, serviceRecords, customers,
  fmtTHB, findCustomer, findSupplier,
} from "@/lib/mockData";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = ["hsl(217 45% 36%)", "hsl(217 55% 55%)", "hsl(145 28% 42%)", "hsl(38 70% 50%)", "hsl(4 65% 56%)"];

export default function Reports() {
  const pipelineData = (["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won", "Lost"] as const)
    .map((s) => ({ name: s, value: deals.filter((d) => d.status === s).length }));

  const winLoss = [
    { name: "Won", value: deals.filter((d) => d.status === "Won").length },
    { name: "Lost", value: deals.filter((d) => d.status === "Lost" || d.status === "Failed").length },
  ];

  const monthlyRevenue = [
    { month: "Jan", revenue: 240000, profit: 110000 },
    { month: "Feb", revenue: 310000, profit: 142000 },
    { month: "Mar", revenue: 280000, profit: 128000 },
    { month: "Apr", revenue: 360000, profit: 170000 },
    { month: "May", revenue: 460000, profit: 218000 },
  ];

  const jobProfit = jobs.map((j) => ({
    name: j.number, profit: j.sellPrice - j.actualCost,
  }));

  const supplierCost = Array.from(new Set(supplierBills.map((b) => b.supplierId))).map((sid) => ({
    name: findSupplier(sid)?.name ?? "—",
    total: supplierBills.filter((b) => b.supplierId === sid).reduce((s, b) => s + b.total, 0),
  }));

  const customerActivity = customers.map((c) => ({
    name: c.name,
    deals: deals.filter((d) => d.customerId === c.id).length,
    jobs: jobs.filter((j) => j.customerId === c.id).length,
  }));

  return (
    <>
      <PageHeader title="Reports" thai="รายงาน"
        description="Sales, jobs, payments, and after-sales — all on mock data."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Sales Pipeline</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Win / Loss</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={winLoss} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                <Cell fill="hsl(var(--success))" />
                <Cell fill="hsl(var(--destructive))" />
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="card-soft p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Monthly Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => fmtTHB(v)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Job Profit</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={jobProfit} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => fmtTHB(v)} />
              <Bar dataKey="profit" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Supplier Cost</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={supplierCost}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => fmtTHB(v)} />
              <Bar dataKey="total" fill="hsl(var(--primary-glow))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Payment Due (Quotations)</h3>
          <div className="space-y-2 text-sm">
            {quotations.filter((q) => q.status === "Sent").map((q) => (
              <div key={q.id} className="flex justify-between border-b last:border-0 py-2">
                <span>{q.number}</span>
                <span className="text-muted-foreground">expires {q.validUntil}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5">
          <h3 className="font-semibold mb-3">Service Due</h3>
          <div className="space-y-2 text-sm">
            {serviceRecords.map((s) => (
              <div key={s.id} className="flex justify-between border-b last:border-0 py-2">
                <span>{findCustomer(s.customerId)?.name} — {s.partName}</span>
                <span className="text-muted-foreground">{s.calibrationDueDate}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-soft p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Customer Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={customerActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="deals" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="jobs" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
