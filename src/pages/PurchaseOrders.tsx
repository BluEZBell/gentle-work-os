import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseOrders, poTotal, PO_STATUSES, type POStatus } from "@/lib/mockBusiness";
import { setPOStatus, useBizTick } from "@/lib/storeBusiness";
import { findSupplier, findJob, fmtTHB } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { Search, Truck } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CustomerLink } from "@/components/CustomerLink";
import { RowActions } from "@/components/RowActions";
import { ThaiDocLayout } from "@/components/ThaiDocLayouts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";

export default function PurchaseOrders() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const list = purchaseOrders.filter((p) => {
    const sup = findSupplier(p.supplierId);
    const m = p.number.toLowerCase().includes(q.toLowerCase()) ||
      (sup?.name ?? "").toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || p.status === filter;
    return m && s;
  });
  return (
    <>
      <PageHeader title="Purchase Orders" thai="ใบสั่งซื้อ"
        description="จัดการใบสั่งซื้อถึงซัพพลายเออร์ ตั้งแต่ออกใบสั่ง จนถึงรับของและตรวจคุณภาพ"
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาใบสั่งซื้อ…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {PO_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      {list.length === 0 ? <Card className="card-soft"><EmptyState icon={Truck} title="ยังไม่มีใบสั่งซื้อ" /></Card> :
      <div className="space-y-4">
        {list.map((p) => {
          const total = poTotal(p);
          const j = findJob(p.jobId);
          return (
            <Card key={p.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/purchase-orders/${p.id}`} className="font-display font-semibold text-primary hover:underline">{p.number}</Link>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                    {findSupplier(p.supplierId)?.name} • งาน {j ? <Link to={`/jobs/${j.id}`} className="text-primary hover:underline">{j.number}</Link> : "—"} • <CustomerLink customerId={j?.customerId} muted /> • {p.date} → คาดว่าจะได้รับ {p.expectedDelivery}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-display text-xl font-semibold">{fmtTHB(total)}</div>
                    <div className="text-xs text-muted-foreground">{p.items.length} รายการ</div>
                  </div>
                  <Select value={p.status} disabled={!can("edit")}
                    onValueChange={(v) => { setPOStatus(p.id, v as POStatus, user?.name ?? "Demo"); toast.success(`PO → ${v}`); }}>
                    <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PO_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <RowActions
                    viewHref={`/purchase-orders/${p.id}`}
                    onEdit={() => toast.info(`แก้ไข ${p.number}`)}
                    onPrint={() => setPreview(p.number)}
                    onPdf={() => toast.info(`PDF ${p.number}`)}
                    onDuplicate={() => toast.success(`ทำสำเนา ${p.number}`)}
                    onSubmitApproval={() => toast.success("ส่งขออนุมัติแล้ว")}
                    onApprove={() => toast.success(`อนุมัติ ${p.number}`)}
                    onReject={() => toast.error(`ไม่อนุมัติ ${p.number}`)}
                    onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                    onViewLog={() => toast.info("ดูประวัติ PO")}
                    onDelete={() => toast.success(`ลบ ${p.number}`)}
                    deleteLabel={`ใบสั่งซื้อ ${p.number}`}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-sm">{it.name}</TableCell>
                      <TableCell className="text-right">{it.qty}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtTHB(it.unitCost)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtTHB(it.qty * it.unitCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          );
        })}
      </div>}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>พรีวิวใบสั่งซื้อ {preview}</DialogTitle></DialogHeader>
          {preview && <ThaiDocLayout docTypeId="td9" number={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์ (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
