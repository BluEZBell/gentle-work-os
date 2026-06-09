import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assets, ASSET_STATUSES, assetMonthlyDep, assetAccumDep, assetBookValue, type AssetStatus } from "@/lib/mockExtended";
import { fmtTHB } from "@/lib/mockData";
import { Boxes, Wrench, Archive, TrendingDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { RowActions } from "@/components/RowActions";
import { toast } from "sonner";

export default function Assets() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<string>("all");
  const list = assets.filter((a) =>
    (f === "all" || a.status === f) &&
    (a.name.toLowerCase().includes(q.toLowerCase()) || a.code.toLowerCase().includes(q.toLowerCase()))
  );
  const totalValue = assets.reduce((s, a) => s + assetBookValue(a), 0);
  const totalMonthDep = assets.filter(a => a.status === "Active").reduce((s, a) => s + assetMonthlyDep(a), 0);
  const repair = assets.filter(a => a.status === "Repair").length;
  const retired = assets.filter(a => a.status === "Retired").length;

  return (
    <>
      <PageHeader title="Assets" thai="สินทรัพย์และค่าเสื่อม"
        description="จัดการสินทรัพย์ของบริษัท ค่าเสื่อมรายเดือน และมูลค่าตามบัญชี" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Asset Value" thai="มูลค่ารวม" value={fmtTHB(totalValue)} icon={Boxes} tone="success" />
        <StatCard label="Monthly Depreciation" thai="ค่าเสื่อม/เดือน" value={fmtTHB(totalMonthDep)} icon={TrendingDown} tone="warning" />
        <StatCard label="Under Repair" thai="ซ่อมอยู่" value={repair} icon={Wrench} tone="warning" />
        <StatCard label="Retired" thai="ปลดระวาง" value={retired} icon={Archive} tone="danger" />
      </div>

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาสินทรัพย์…" className="pl-9" />
        </div>
        <Select value={f} onValueChange={setF}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {ASSET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>รหัส</TableHead><TableHead>ชื่อสินทรัพย์</TableHead><TableHead>ประเภท</TableHead>
              <TableHead>วันที่ซื้อ</TableHead><TableHead className="text-right">ราคาทุน</TableHead>
              <TableHead className="text-right">ค่าเสื่อม/เดือน</TableHead><TableHead className="text-right">ค่าเสื่อมสะสม</TableHead>
              <TableHead className="text-right">มูลค่าคงเหลือ</TableHead>
              <TableHead>ที่ตั้ง</TableHead><TableHead>ผู้รับผิดชอบ</TableHead><TableHead>สถานะ</TableHead>
              <TableHead className="text-right w-28">การกระทำ</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs"><Link to={`/assets/${a.id}`} className="text-primary hover:underline">{a.code}</Link></TableCell>
                  <TableCell className="font-medium"><Link to={`/assets/${a.id}`} className="hover:underline">{a.name}</Link></TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.purchaseDate}</TableCell>
                  <TableCell className="text-right">{fmtTHB(a.purchasePrice)}</TableCell>
                  <TableCell className="text-right">{fmtTHB(assetMonthlyDep(a))}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmtTHB(assetAccumDep(a))}</TableCell>
                  <TableCell className="text-right font-medium">{fmtTHB(assetBookValue(a))}</TableCell>
                  <TableCell>{a.location}</TableCell>
                  <TableCell>{a.assignedUser}</TableCell>
                  <TableCell><StatusBadge status={a.status} tone={a.status === "Active" ? "success" : a.status === "Repair" ? "warning" : a.status === "Retired" ? "muted" : "info" as never} /></TableCell>
                  <TableCell>
                    <RowActions
                      viewHref={`/assets/${a.id}`}
                      onEdit={() => toast.info(`แก้ไข ${a.name}`)}
                      onDuplicate={() => toast.success(`ทำสำเนา ${a.code}`)}
                      onSubmitApproval={() => toast.success("ส่งขออนุมัติปลดระวาง")}
                      onAddToCalendar={() => toast.success("เพิ่มเตือนบำรุงรักษาในปฏิทิน")}
                      onDelete={() => toast.success(`ลบ ${a.name}`)}
                      deleteLabel={a.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
