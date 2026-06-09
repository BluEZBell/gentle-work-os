import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { warehouses, stockItems, stockTotal } from "@/lib/mockExtended";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRightLeft, Warehouse, AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function Warehouses() {
  const [params] = useSearchParams();
  const lowOnly = params.get("filter") === "low";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ itemId: stockItems[0]?.id ?? "", from: "w1", to: "w2", qty: 1 });

  const transfer = () => {
    const item = stockItems.find((s) => s.id === f.itemId);
    if (!item) return;
    const avail = item.byWarehouse[f.from] ?? 0;
    if (f.qty > avail) { toast.error(`โอนได้สูงสุด ${avail}`); return; }
    item.byWarehouse[f.from] = avail - f.qty;
    item.byWarehouse[f.to] = (item.byWarehouse[f.to] ?? 0) + f.qty;
    toast.success("โอนสต๊อกระหว่างคลังแล้ว");
    setOpen(false);
  };

  return (
    <>
      <PageHeader title="Warehouses" thai="คลังสินค้า"
        description="ดูสต๊อกแยกตามคลัง โอนของระหว่างคลัง และตรวจสอบสต๊อกต่ำกว่าจุดสั่งซื้อ"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><ArrowRightLeft className="w-4 h-4 mr-1" /> โอนสต๊อก</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>โอนสต๊อกระหว่างคลัง</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>รายการ</Label>
                  <Select value={f.itemId} onValueChange={(v) => setF({ ...f, itemId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{stockItems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>จากคลัง</Label>
                    <Select value={f.from} onValueChange={(v) => setF({ ...f, from: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.thai}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="grid gap-1.5"><Label>ไปคลัง</Label>
                    <Select value={f.to} onValueChange={(v) => setF({ ...f, to: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.thai}</SelectItem>)}</SelectContent>
                    </Select></div>
                </div>
                <div className="grid gap-1.5"><Label>จำนวน</Label>
                  <Input type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: parseInt(e.target.value) || 1 })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button onClick={transfer}>โอน</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {warehouses.map((w) => {
          const total = stockItems.reduce((s, it) => s + (it.byWarehouse[w.id] ?? 0), 0);
          return (
            <Card key={w.id} className="card-soft p-4">
              <div className="flex items-center gap-2 mb-1">
                <Warehouse className="w-4 h-4 text-primary" />
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{w.name}</div>
              </div>
              <div className="font-display text-2xl font-semibold">{total}</div>
              <div className="text-xs text-muted-foreground">{w.thai}</div>
            </Card>
          );
        })}
      </div>

      <Card className="card-soft overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-display text-lg font-semibold">สต๊อกตามคลัง</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>รหัส</TableHead><TableHead>รายการ</TableHead>
              {warehouses.map((w) => <TableHead key={w.id} className="text-right">{w.thai}</TableHead>)}
              <TableHead className="text-right">รวม</TableHead><TableHead className="text-right">จุดสั่ง</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stockItems.filter((s) => !lowOnly || stockTotal(s) < s.reorderPoint).map((s) => {
                const total = stockTotal(s);
                const low = total < s.reorderPoint;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    {warehouses.map((w) => (
                      <TableCell key={w.id} className="text-right">{s.byWarehouse[w.id] ?? 0}</TableCell>
                    ))}
                    <TableCell className="text-right font-medium">{total}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.reorderPoint}</TableCell>
                    <TableCell>
                      {low ? <span className="inline-flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="w-3 h-3" /> ต่ำ</span>
                        : <span className="text-success text-xs">เพียงพอ</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
