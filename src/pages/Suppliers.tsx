import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { suppliers, supplierBills, jobs, fmtTHB } from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, Lock, Search } from "lucide-react";
import { NewSupplierDialog } from "@/components/dialogs/NewSupplierDialog";
import { EmptyState } from "@/components/EmptyState";

export default function Suppliers() {
  useTick();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(q.toLowerCase()) ||
    s.type.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Suppliers" thai="ซัพพลายเออร์"
        description="Bank information is masked by default. Confidential suppliers are flagged."
        actions={<NewSupplierDialog />}
      />
      <Card className="card-soft p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search suppliers…" className="pl-9" />
        </div>
      </Card>
      <Card className="card-soft overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="No suppliers" /> :
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payment Term</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Open bills</TableHead>
              <TableHead>Active jobs</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const openBills = supplierBills.filter((b) => b.supplierId === s.id && b.status !== "Paid");
              const openBillTotal = openBills.reduce((a, b) => a + b.total, 0);
              const sJobs = jobs.filter((j) => j.supplierId === s.id && j.status !== "Closed");
              return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {s.confidential && <Lock className="w-3.5 h-3.5 text-warning" />}
                    {s.name}
                  </div>
                  {s.notes && <div className="text-xs text-muted-foreground">{s.notes}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{s.contactPerson}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </TableCell>
                <TableCell><StatusBadge status={s.type} tone="muted" /></TableCell>
                <TableCell>{s.paymentTerm}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    {revealed[s.id] ? "1234-5678-" + s.bankInfo.slice(-4) : s.bankInfo}
                    <button onClick={() => setRevealed((r) => ({ ...r, [s.id]: !r[s.id] }))}
                      className="text-muted-foreground hover:text-foreground">
                      {revealed[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{openBills.length}</div>
                  <div className="text-xs text-muted-foreground">{fmtTHB(openBillTotal)}</div>
                </TableCell>
                <TableCell className="text-sm">{sJobs.length}</TableCell>
                <TableCell><StatusBadge status={s.riskLevel} /></TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>}
      </Card>
    </>
  );
}
