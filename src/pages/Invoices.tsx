import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerInvoices, INVOICE_STATUSES, type InvoiceStatus } from "@/lib/mockBusiness";
import { setInvoiceStatus, useBizTick } from "@/lib/storeBusiness";
import { findCustomer, findJob, fmtTHB } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { Search, Receipt, Info } from "lucide-react";
import { toast } from "sonner";

export default function Invoices() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const list = customerInvoices.filter((i) => {
    const cust = findCustomer(i.customerId);
    const m = i.number.toLowerCase().includes(q.toLowerCase()) ||
      (cust?.name ?? "").toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || i.status === filter;
    return m && s;
  });
  const outstanding = customerInvoices.filter((i) => i.status !== "Paid").reduce((a, b) => a + b.total, 0);
  return (
    <>
      <PageHeader title="Customer Invoices" thai="ใบแจ้งหนี้ลูกค้า"
        description="ติดตามใบแจ้งหนี้ลูกค้า ยอดที่ต้องรับ และสถานะการชำระเงิน"
      />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">ยอดค้างรับรวม: {fmtTHB(outstanding)}</AlertTitle>
        <AlertDescription className="text-info/90">
          เงินที่กำลังเข้าจะแสดงในแดชบอร์ด การเปลี่ยนสถานะจะถูกบันทึกในบันทึกการใช้งานทุกครั้ง
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาใบแจ้งหนี้…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.number}</TableCell>
                <TableCell>{findCustomer(i.customerId)?.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{findJob(i.jobId)?.number}</TableCell>
                <TableCell className="text-sm">
                  <div>{i.date}</div>
                  <div className="text-xs text-muted-foreground">ครบกำหนด {i.dueDate}{i.paymentDate ? ` • ชำระแล้ว ${i.paymentDate}` : ""}</div>
                </TableCell>
                <TableCell className="text-right">{fmtTHB(i.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(i.vat)}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(i.total)}</TableCell>
                <TableCell><StatusBadge status={i.status} /></TableCell>
                <TableCell>
                  <Select value={i.status} disabled={!can("edit")}
                    onValueChange={(v) => { setInvoiceStatus(i.id, v as InvoiceStatus, user?.name ?? "Demo"); toast.success(`Invoice → ${v}`); }}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Receipt className="w-4 h-4" /> No invoices</div>}
      </Card>
    </>
  );
}
