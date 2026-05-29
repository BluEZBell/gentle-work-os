import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { suppliers } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, Lock, Plus } from "lucide-react";

export default function Suppliers() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  return (
    <>
      <PageHeader title="Suppliers" thai="ซัพพลายเออร์"
        description="Bank information is masked by default. Confidential suppliers are flagged."
        actions={<Button><Plus className="w-4 h-4 mr-1" /> Add supplier</Button>}
      />
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payment Term</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
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
                <TableCell><StatusBadge status={s.riskLevel} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
