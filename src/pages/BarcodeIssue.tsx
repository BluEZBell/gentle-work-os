import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScanBarcode, AlertTriangle } from "lucide-react";
import { warehouses, stockItems, barcodeIssues, stockTotal } from "@/lib/mockExtended";
import { jobs } from "@/lib/mockData";
import { toast } from "sonner";

export default function BarcodeIssue() {
  const [barcode, setBarcode] = useState("");
  const [itemId, setItemId] = useState("");
  const [wh, setWh] = useState("w1");
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [person, setPerson] = useState("Khun Wit");

  const scan = () => {
    const item = stockItems.find((s) => s.code.toLowerCase() === barcode.trim().toLowerCase());
    if (item) { setItemId(item.id); toast.success(`พบ ${item.name}`); }
    else toast.error("ไม่พบบาร์โค้ดนี้ (เดโม)");
  };

  const issue = () => {
    if (!itemId) { toast.error("เลือกชิ้นงานก่อน"); return; }
    const item = stockItems.find((s) => s.id === itemId)!;
    const available = item.byWarehouse[wh] ?? 0;
    if (qty > available) { toast.error(`สต๊อกไม่พอ คงเหลือ ${available}`); return; }
    item.byWarehouse[wh] = available - qty;
    barcodeIssues.unshift({
      id: "bi" + Math.random().toString(36).slice(2, 7),
      barcode: item.code, itemId, warehouseId: wh, jobId, quantity: qty,
      issuedBy: person, issueDate: new Date().toISOString().slice(0, 10), note: "",
    });
    toast.success("เบิกของเรียบร้อย (เดโม)");
    setBarcode(""); setItemId(""); setQty(1);
  };

  const lowStock = stockItems.filter((s) => stockTotal(s) < s.reorderPoint);

  return (
    <>
      <PageHeader title="Barcode Issue" thai="เบิกของด้วยบาร์โค้ด"
        description="สแกนบาร์โค้ดหรือเลือกรายการเพื่อเบิกของจากคลัง ระบบจะตัดสต๊อกและบันทึกค่าใช้จ่ายเข้างาน" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="card-soft p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1"><ScanBarcode className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">สแกนบาร์โค้ด (เดโม)</h3></div>
          <div className="flex gap-2">
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="ป้อนรหัสบาร์โค้ด เช่น BAR-001" />
            <Button onClick={scan} variant="outline">สแกน</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>คลัง</Label>
              <Select value={wh} onValueChange={setWh}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.thai})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>รายการ</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger><SelectValue placeholder="เลือก…" /></SelectTrigger>
                <SelectContent>{stockItems.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>งาน</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.number} — {j.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>จำนวน</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} /></div>
            <div className="grid gap-1.5 col-span-2"><Label>ผู้เบิก</Label>
              <Input value={person} onChange={(e) => setPerson(e.target.value)} /></div>
          </div>
          <Button onClick={issue} className="w-full">บันทึกการเบิก</Button>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-display text-lg font-semibold">สต๊อกต่ำกว่าจุดสั่งซื้อ</h3></div>
          <div className="space-y-2">
            {lowStock.length === 0 ? <div className="text-sm text-muted-foreground">ทุกรายการสต๊อกเพียงพอ</div> :
              lowStock.map((s) => (
                <div key={s.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                  <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.code}</div></div>
                  <div className="text-right"><div className="font-medium text-destructive">{stockTotal(s)} {s.unit}</div>
                    <div className="text-xs text-muted-foreground">จุดสั่ง {s.reorderPoint}</div></div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="card-soft mt-4 overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-display text-lg font-semibold">ประวัติการเบิกล่าสุด</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>วันที่</TableHead><TableHead>บาร์โค้ด</TableHead><TableHead>คลัง</TableHead>
              <TableHead>งาน</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead>ผู้เบิก</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {barcodeIssues.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.issueDate}</TableCell>
                  <TableCell className="font-mono text-xs">{b.barcode}</TableCell>
                  <TableCell>{warehouses.find((w) => w.id === b.warehouseId)?.thai}</TableCell>
                  <TableCell>{jobs.find((j) => j.id === b.jobId)?.number}</TableCell>
                  <TableCell className="text-right">{b.quantity}</TableCell>
                  <TableCell>{b.issuedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
