import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { serviceRecords, findCustomer, fmtTHB } from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Service() {
  useTick();
  return (
    <>
      <PageHeader title="Service" thai="บริการหลังขาย"
        description="Warranty & calibration reminders. First year free; renewal price = 20% of original job value."
      />
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Part</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>Calibration Due</TableHead>
              <TableHead>1st Year Free</TableHead>
              <TableHead className="text-right">Renewal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceRecords.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{findCustomer(s.customerId)?.name}</TableCell>
                <TableCell>
                  <div className="text-sm">{s.partName}</div>
                  <div className="text-xs text-muted-foreground">{s.partNumber}</div>
                </TableCell>
                <TableCell className="text-sm">{s.deliveryDate}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.warrantyStart} → {s.warrantyEnd}</TableCell>
                <TableCell className="text-sm">{s.calibrationDueDate}</TableCell>
                <TableCell>{s.firstYearFree ? <StatusBadge status="Yes" tone="success" /> : <StatusBadge status="No" tone="muted" />}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(s.renewalPrice)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={s.status} />
                    {s.opportunity && <Sparkles className="w-3.5 h-3.5 text-warning" aria-label="Opportunity" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline"
                    onClick={() => toast.success(`Follow-up scheduled with ${findCustomer(s.customerId)?.name}`)}>
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> Follow up
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
