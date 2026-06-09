import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { payrollLines, payrollAllowances, payrollDeductions, payrollNetPay } from "@/lib/mockExtended";
import { Link } from "react-router-dom";
import { fmtTHB } from "@/lib/mockData";
import { Wallet, Minus, Plus, Coins } from "lucide-react";

export default function Payroll() {
  const totalBase = payrollLines.reduce((s, p) => s + p.baseSalary, 0);
  const totalAllow = payrollLines.reduce((s, p) => s + payrollAllowances(p), 0);
  const totalDed = payrollLines.reduce((s, p) => s + payrollDeductions(p), 0);
  const totalNet = payrollLines.reduce((s, p) => s + payrollNetPay(p), 0);

  return (
    <>
      <PageHeader title="Payroll" thai="เงินเดือน"
        description="คำนวณเงินเดือนรายเดือน รวม OT เบี้ยเลี้ยง ค่าน้ำมัน และรายการหักต่าง ๆ (ตัวอย่างเดโม)" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Payroll" thai="เงินเดือนรวม" value={fmtTHB(totalBase)} icon={Wallet} />
        <StatCard label="Total Deductions" thai="หักรวม" value={fmtTHB(totalDed)} icon={Minus} tone="danger" />
        <StatCard label="Total Allowances" thai="เบี้ยเลี้ยงรวม" value={fmtTHB(totalAllow)} icon={Plus} tone="success" />
        <StatCard label="Net Pay" thai="จ่ายสุทธิ" value={fmtTHB(totalNet)} icon={Coins} tone="success" />
      </div>

      <Card className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>พนักงาน</TableHead><TableHead>ตำแหน่ง</TableHead>
              <TableHead className="text-right">เงินเดือน</TableHead>
              <TableHead className="text-right">OT รวม</TableHead>
              <TableHead className="text-right">เบี้ยเลี้ยง</TableHead>
              <TableHead className="text-right">หัก</TableHead>
              <TableHead className="text-right">รับสุทธิ</TableHead>
              <TableHead>หมายเหตุ</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payrollLines.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium"><Link to={`/payroll/${p.id}`} className="text-primary hover:underline">{p.employeeName}</Link></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.role}</TableCell>
                  <TableCell className="text-right">{fmtTHB(p.baseSalary)}</TableCell>
                  <TableCell className="text-right">{fmtTHB(p.otWeekday + p.otHoliday)}</TableCell>
                  <TableCell className="text-right text-success">{fmtTHB(payrollAllowances(p))}</TableCell>
                  <TableCell className="text-right text-destructive">−{fmtTHB(payrollDeductions(p))}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtTHB(payrollNetPay(p))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="card-soft p-5 mt-4">
        <h3 className="font-display text-lg font-semibold mb-3">รายละเอียดรายการหักและเบี้ยเลี้ยง</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {payrollLines.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 space-y-1">
              <div className="font-medium">{p.employeeName}</div>
              <div className="text-xs text-muted-foreground">ประกันสังคม {fmtTHB(p.socialSecurity)}</div>
              <div className="text-xs text-muted-foreground">เบิกเงินล่วงหน้า {fmtTHB(p.salaryAdvance)} • เบิกฉุกเฉิน {fmtTHB(p.emergencyWithdrawal)}</div>
              <div className="text-xs text-muted-foreground">เงินกู้บริษัท {fmtTHB(p.companyLoan)} • รถส่วนตัว {fmtTHB(p.companyCarDeduction)}</div>
              <div className="text-xs text-muted-foreground">ค่าอาหาร 50/วัน {fmtTHB(p.mealAllowance)} • น้ำมัน {fmtTHB(p.fuelAllowance)}</div>
              <div className="text-xs text-muted-foreground">เดินทาง {fmtTHB(p.travelAllowance)} • หน้างาน {fmtTHB(p.fieldWorkAllowance)}</div>
              <div className="text-xs text-muted-foreground">เคลม {fmtTHB(p.reimbursement)} • ของขวัญ {fmtTHB(p.giftMoney)}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
