import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { parts, findCustomer, findSupplier, fmtTHB } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { RowActions } from "@/components/RowActions";
import { removePart, duplicatePart } from "@/lib/store";
import { toast } from "sonner";

export default function Parts() {
  return (
    <>
      <PageHeader title="Parts" thai="ชิ้นงาน"
        description="ข้อมูลชิ้นงาน พร้อมรอบการรับประกันและรอบ Calibration" />
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Sell</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>Calibration</TableHead>
              <TableHead className="text-right w-28">การกระทำ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.number} • {p.description}</div>
                </TableCell>
                <TableCell className="text-sm">{findCustomer(p.customerId)?.name}</TableCell>
                <TableCell className="text-sm">{findSupplier(p.supplierId)?.name}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(p.standardCost)}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(p.sellPrice)}</TableCell>
                <TableCell className="text-sm">{p.warrantyMonths} months</TableCell>
                <TableCell>
                  {p.calibrationRequired
                    ? <StatusBadge status={`Every ${p.calibrationCycleMonths}m`} tone="warning" />
                    : <StatusBadge status="Not required" tone="muted" />}
                </TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => toast.info(`เปิดรายละเอียดเพื่อแก้ไข ${p.name}`)}
                    onDuplicate={() => duplicatePart(p.id, "Khun Ploy")}
                    onAddToCalendar={() => toast.success("เพิ่มเตือน Calibration ในปฏิทินแล้ว")}
                    onDelete={() => removePart(p.id, "Khun Ploy")}
                    deleteLabel={p.name}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
