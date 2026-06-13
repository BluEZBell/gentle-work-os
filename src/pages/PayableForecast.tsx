import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtTHB, findSupplier } from "@/lib/mockData";
import {
  forecastForMonth, paymentPlans, getSupplierKind, useSupPayTick,
  updateInstallmentStatus, isLateBilling,
} from "@/lib/supplierPaymentStore";
import { PaymentScheduleDialog } from "@/components/dialogs/PaymentScheduleDialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RowActions } from "@/components/RowActions";

const monthLabel = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

export default function PayableForecast() {
  useSupPayTick();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [kindFilter, setKindFilter] = useState<"all" | "Supplier" | "Maker" | "Both">("all");

  const rows = useMemo(() => forecastForMonth(year, month)
    .filter((r) => kindFilter === "all" || r.kind === kindFilter),
    [year, month, kindFilter, paymentPlans.length]);

  const sumSupplier = rows.filter((r) => r.kind === "Supplier").reduce((a, r) => a + r.net, 0);
  const sumMaker = rows.filter((r) => r.kind !== "Supplier").reduce((a, r) => a + r.net, 0);
  const sumPaid = rows.filter((r) => r.status === "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumPending = rows.filter((r) => r.status !== "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumOverdue = rows.filter((r) => new Date(r.dueDate) < new Date() && r.status !== "จ่ายแล้ว").reduce((a, r) => a + r.net, 0);
  const sumWhtMaker = rows.filter((r) => r.kind !== "Supplier").reduce((a, r) => a + r.wht, 0);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth());
  };

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

      <Card className="card-soft p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => shift(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="font-semibold min-w-[160px] text-center">{monthLabel(year, month)}</div>
          <Button size="icon" variant="outline" onClick={() => shift(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as never)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="Supplier">Supplier (ผู้ขายของ)</SelectItem>
            <SelectItem value="Maker">Maker (ผู้รับทำงาน)</SelectItem>
            <SelectItem value="Both">Supplier + Maker</SelectItem>
          </SelectContent>
        </Select>
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
          <div className="p-8 text-center text-sm text-muted-foreground">ไม่มีรายการที่ต้องจ่ายในเดือนนี้</div>
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
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.installmentId}>
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
                        <RowActions
                          onEdit={() => toast.info("แก้ไขแผนการจ่ายเงิน (mock)")}
                          onApprove={() => { updateInstallmentStatus(r.planId, r.installmentId, "จ่ายแล้ว"); toast.success("Mark Paid (mock)"); }}
                          onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                          onViewLog={() => toast.info("ดูประวัติ")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {rows.map((r) => (
                <div key={r.installmentId} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.supplierName}</div>
                    <StatusBadge status={r.kind} tone={r.kind === "Maker" ? "warning" : "muted"} />
                  </div>
                  <div className="text-xs text-muted-foreground">งวด #{r.no} • ครบกำหนด {r.dueDate}</div>
                  <div className="flex justify-between text-sm">
                    <span>ก่อนหัก</span><span>{fmtTHB(r.gross)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>WHT</span><span>{fmtTHB(r.wht)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>สุทธิ</span><span>{fmtTHB(r.net)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={r.status} />
                    <Button size="sm" variant="outline"
                      onClick={() => { updateInstallmentStatus(r.planId, r.installmentId, "จ่ายแล้ว"); toast.success("Mark Paid"); }}>
                      Mark Paid
                    </Button>
                  </div>
                </div>
              ))}
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
