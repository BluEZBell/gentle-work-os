import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtTHB, findSupplier } from "@/lib/mockData";
import {
  forecastForMonth, paymentPlans, getSupplierKind, useSupPayTick,
  updateInstallmentStatus, isLateBilling,
} from "@/lib/supplierPaymentStore";
import { audit } from "@/lib/store";
import { PaymentScheduleDialog } from "@/components/dialogs/PaymentScheduleDialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, RotateCcw, Receipt } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RowActions } from "@/components/RowActions";

const monthLabel = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

const MONTHS_TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

export default function PayableForecast() {
  useSupPayTick();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | "all">(now.getMonth());
  const [kindFilter, setKindFilter] = useState<"all" | "Supplier" | "Maker" | "Both">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const today = new Date();
    const monthsToScan = month === "all" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [month];
    const all = monthsToScan.flatMap((m) => forecastForMonth(year, m));
    return all
      .filter((r) => kindFilter === "all" || r.kind === kindFilter)
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => !overdueOnly || (new Date(r.dueDate) < today && r.status !== "จ่ายแล้ว"))
      .filter((r) => !q || r.supplierName.toLowerCase().includes(q.toLowerCase()));
  }, [year, month, kindFilter, statusFilter, overdueOnly, q, paymentPlans.length]);

  const sumSupplier = rows.filter((r) => r.kind === "Supplier").reduce((a, r) => a + r.net, 0);
  const sumMaker = rows.filter((r) => r.kind !== "Supplier").reduce((a, r) => a + r.net, 0);
  const sumPaid = rows.filter((r) => r.status === "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumPending = rows.filter((r) => r.status !== "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumOverdue = rows.filter((r) => new Date(r.dueDate) < new Date() && r.status !== "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumWhtMaker = rows.filter((r) => r.kind !== "Supplier").reduce((a, r) => a + r.wht, 0);

  const shift = (delta: number) => {
    if (month === "all") return;
    const d = new Date(year, (month as number) + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth());
  };

  const resetFilters = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setKindFilter("all");
    setStatusFilter("all");
    setOverdueOnly(false);
    setQ("");
  };

  const markPaid = (planId: string, instId: string, name: string) => {
    updateInstallmentStatus(planId, instId, "จ่ายแล้ว");
    audit("Khun Ploy", "Mark Paid", `${name} • Installment ${instId}`, "Payable Forecast");
    toast.success("บันทึกการจ่ายเงินแล้ว");
  };

  const createVoucher = (r: typeof rows[number]) => {
    audit("Khun Ploy", "Create Payment Voucher", `${r.supplierName} งวด ${r.no} สุทธิ ${r.net}`, "Payable Forecast");
    toast.success(`เตรียมใบสำคัญจ่ายสำหรับ ${r.supplierName} งวด ${r.no}`, {
      description: `Gross ${fmtTHB(r.gross)} • WHT ${fmtTHB(r.wht)} • Net ${fmtTHB(r.net)}`,
    });
    navigate("/payment-vouchers");
  };

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <>
      <PageHeader
        title="Payable Forecast" thai="แผนเงินจ่ายประจำเดือน"
        description="แสดงยอดที่ต้องจ่าย Supplier / Maker, หัก ณ ที่จ่าย, สถานะการจ่าย และวันครบกำหนด"
        actions={<PaymentScheduleDialog />}
      />

      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>การคำนวณนี้เป็นข้อมูลตัวอย่าง (Mock)</AlertTitle>
        <AlertDescription>
          Maker หัก ณ ที่จ่าย 3% ตามค่าเริ่มต้น — Supplier ไม่หัก ณ ที่จ่ายโดยปริยาย
        </AlertDescription>
      </Alert>

      {/* Filters bar */}
      <Card className="card-soft p-3 mb-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => shift(-1)} disabled={month === "all"}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-semibold min-w-[160px] text-center">
              {month === "all" ? `ทั้งปี ${year}` : monthLabel(year, month as number)}
            </div>
            <Button size="icon" variant="outline" onClick={() => shift(1)} disabled={month === "all"}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-1" /> ล้างตัวกรอง
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <div className="grid gap-1">
            <Label className="text-xs">เดือน</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(v === "all" ? "all" : Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งปี</SelectItem>
                {MONTHS_TH.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">ปี</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">ประเภทคู่ค้า</Label>
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="Supplier">Supplier (ผู้ขายของ)</SelectItem>
                <SelectItem value="Maker">Maker (ผู้รับทำงาน)</SelectItem>
                <SelectItem value="Both">Supplier + Maker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">สถานะ</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="รอวางบิล">รอวางบิล</SelectItem>
                <SelectItem value="วางบิลแล้ว">วางบิลแล้ว</SelectItem>
                <SelectItem value="รอจ่าย">รอจ่าย</SelectItem>
                <SelectItem value="จ่ายบางส่วน">จ่ายบางส่วน</SelectItem>
                <SelectItem value="จ่ายแล้ว">จ่ายแล้ว</SelectItem>
                <SelectItem value="เลยกำหนด">เลยกำหนด</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">ค้นหา</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ชื่อคู่ค้า…" className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 h-10">
            <Switch checked={overdueOnly} onCheckedChange={setOverdueOnly} id="overdue-only" />
            <Label htmlFor="overdue-only" className="text-xs m-0">เลยกำหนดเท่านั้น</Label>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <SummaryCard label="ต้องจ่าย Supplier" value={sumSupplier} tone="text-foreground" />
        <SummaryCard label="ต้องจ่าย Maker" value={sumMaker} tone="text-foreground" />
        <SummaryCard label="จ่ายแล้ว" value={sumPaid} tone="text-emerald-600" />
        <SummaryCard label="รอจ่าย" value={sumPending} tone="text-amber-600" />
        <SummaryCard label="เลยกำหนด" value={sumOverdue} tone="text-destructive" />
        <SummaryCard label="WHT Maker 3%" value={sumWhtMaker} tone="text-orange-600" />
      </div>

      <Card className="card-soft overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">ไม่มีรายการที่ตรงกับตัวกรอง</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>คู่ค้า</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>PO / Job</TableHead>
                    <TableHead>งวด</TableHead>
                    <TableHead className="text-right">ก่อนหัก</TableHead>
                    <TableHead className="text-right">WHT</TableHead>
                    <TableHead className="text-right">สุทธิ</TableHead>
                    <TableHead>วันครบกำหนด</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="w-44 text-right">การกระทำ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const overdue = new Date(r.dueDate) < new Date() && r.status !== "จ่ายแล้ว";
                    return (
                    <TableRow key={r.installmentId} className={overdue ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="font-medium">{r.supplierName}</div>
                        <div className="text-xs text-muted-foreground">{findSupplier(r.supplierId)?.contactPerson}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={r.kind} tone={r.kind === "Maker" ? "warning" : "muted"} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.poId && <div>PO: {r.poId}</div>}
                        {r.jobId && <div>Job: <Link className="text-primary hover:underline" to={`/jobs/${r.jobId}`}>{r.jobId}</Link></div>}
                      </TableCell>
                      <TableCell>#{r.no}</TableCell>
                      <TableCell className="text-right">{fmtTHB(r.gross)}</TableCell>
                      <TableCell className="text-right text-orange-600">{fmtTHB(r.wht)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtTHB(r.net)}</TableCell>
                      <TableCell className="text-sm">{r.dueDate}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {r.status !== "จ่ายแล้ว" && (
                            <Button size="sm" variant="outline" onClick={() => createVoucher(r)}>
                              <Receipt className="w-3.5 h-3.5 mr-1" /> ใบสำคัญจ่าย
                            </Button>
                          )}
                          <RowActions
                            onEdit={() => toast.info("แก้ไขแผนการจ่ายเงิน (mock)")}
                            onApprove={() => markPaid(r.planId, r.installmentId, r.supplierName)}
                            onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                            onViewLog={() => toast.info("ดูประวัติ")}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {rows.map((r) => {
                const overdue = new Date(r.dueDate) < new Date() && r.status !== "จ่ายแล้ว";
                return (
                <div key={r.installmentId} className={`p-4 space-y-1 ${overdue ? "bg-destructive/5" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.supplierName}</div>
                    <StatusBadge status={r.kind} tone={r.kind === "Maker" ? "warning" : "muted"} />
                  </div>
                  <div className="text-xs text-muted-foreground">งวด #{r.no} • ครบกำหนด {r.dueDate}</div>
                  <div className="flex justify-between text-sm"><span>ก่อนหัก</span><span>{fmtTHB(r.gross)}</span></div>
                  <div className="flex justify-between text-sm text-orange-600"><span>WHT</span><span>{fmtTHB(r.wht)}</span></div>
                  <div className="flex justify-between text-sm font-semibold"><span>สุทธิ</span><span>{fmtTHB(r.net)}</span></div>
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <StatusBadge status={r.status} />
                    <div className="flex gap-1">
                      {r.status !== "จ่ายแล้ว" && (
                        <Button size="sm" variant="outline" onClick={() => createVoucher(r)}>
                          ใบสำคัญจ่าย
                        </Button>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => markPaid(r.planId, r.installmentId, r.supplierName)}>
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </div>
              );})}
            </div>
          </>
        )}
      </Card>

      {/* All plans */}
      <h2 className="mt-8 mb-2 font-semibold text-sm uppercase tracking-wider text-muted-foreground">แผนการจ่ายเงินทั้งหมด</h2>
      <Card className="card-soft p-3">
        {paymentPlans.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">ยังไม่มีแผนการจ่ายเงิน</div>
        ) : (
          <div className="space-y-3">
            {paymentPlans.map((p) => {
              const sup = findSupplier(p.supplierId);
              const kind = getSupplierKind(p.supplierId);
              const late = isLateBilling(p.supplierId, new Date().toISOString().slice(0, 10));
              return (
                <div key={p.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium">{sup?.name} <span className="text-xs text-muted-foreground">({kind})</span></div>
                      <div className="text-xs text-muted-foreground">
                        ยอดรวม {fmtTHB(p.totalAmount)} • WHT {p.whtEnabled ? `${p.whtRate}%` : "ไม่มี"}
                        {p.poId && ` • PO ${p.poId}`}
                        {p.jobId && ` • Job ${p.jobId}`}
                      </div>
                    </div>
                    {late && (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        ⚠ เลยรอบวางบิลที่กำหนด ระบบจะเลื่อนไปงวดจ่ายถัดไป
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                    {p.installments.map((i) => (
                      <div key={i.id} className="border rounded p-2">
                        <div className="flex justify-between">
                          <span>งวด #{i.no} ({i.percent}%)</span>
                          <StatusBadge status={i.status} />
                        </div>
                        <div className="text-muted-foreground">วางบิล {i.billingDueDate}</div>
                        <div className="text-muted-foreground">จ่าย {i.paymentDueDate}</div>
                        <div className="font-medium mt-1">สุทธิ {fmtTHB(i.net)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="card-soft p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone}`}>{fmtTHB(value)}</div>
    </Card>
  );
}
