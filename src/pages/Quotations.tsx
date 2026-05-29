import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  quotations, findCustomer, fmtTHB, quotationTotal, quotationCost, quotationProfit,
} from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, FileText, Paperclip, Plus } from "lucide-react";

export default function Quotations() {
  useTick();
  return (
    <>
      <PageHeader title="Quotations" thai="ใบเสนอราคา"
        description="สร้างและติดตามใบเสนอราคา พร้อมดูต้นทุน กำไร และสถานะการอนุมัติ"
        actions={<Button><Plus className="w-4 h-4 mr-1" /> สร้างใบเสนอราคา</Button>}
      />
      <div className="space-y-4">
        {quotations.map((q) => {
          const total = quotationTotal(q);
          const cost = quotationCost(q);
          const profit = quotationProfit(q);
          const margin = Math.round((profit / total) * 100);
          return (
            <Card key={q.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-display font-semibold">{q.number}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {findCustomer(q.customerId)?.name} • {q.date} → ใช้ได้ถึง {q.validUntil}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-semibold">{fmtTHB(total)}</div>
                  <div className="text-xs text-success font-medium">+{fmtTHB(profit)} กำไร ({margin}%)</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.partName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{it.partNumber}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{fmtTHB(it.sellPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtTHB(it.estimatedCost)}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {fmtTHB((it.sellPrice - it.estimatedCost) * it.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                  <a href={q.flowAccountLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in FlowAccount (mock)
                  </a>
                </Button>
                <Button variant="outline" size="sm">
                  <Paperclip className="w-3.5 h-3.5 mr-1" /> Attachment placeholder
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
