import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { serviceRecords, findCustomer, fmtTHB } from "@/lib/mockData";
import { CustomerLink } from "@/components/CustomerLink";
import { useTick } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, MessageCircle } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";

export default function Service() {
  useTick();
  const [params] = useSearchParams();
  const dueSoon = params.get("filter") === "due-soon";
  const list = serviceRecords.filter((s) => !dueSoon || s.status !== "Completed");
  return (
    <>
      <PageHeader title="Service" thai="บริการหลังขาย"
        description="จัดการงานบริการหลังการขาย การรับประกัน และรอบ Calibration (ปีแรกฟรี ค่าต่ออายุ 20% ของมูลค่างาน)"
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
            {list.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium"><CustomerLink customerId={s.customerId} /></TableCell>
                <TableCell>
                  <div className="text-sm"><Link to={`/service/${s.id}`} className="text-primary hover:underline">{s.partName}</Link></div>
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
