import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deals, dealStatusThai, findCustomer, fmtTHB, type DealStatus,
} from "@/lib/mockData";
import { setDealStatus, createJobFromDeal, useTick } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NewDealDialog } from "@/components/dialogs/NewDealDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const cols: DealStatus[] = ["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won", "Lost", "Failed"];

export default function Deals() {
  useTick();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = deals.filter((d) => {
    const cust = findCustomer(d.customerId);
    const m = d.name.toLowerCase().includes(q.toLowerCase()) ||
      (cust?.name ?? "").toLowerCase().includes(q.toLowerCase());
    const s = statusFilter === "all" || d.status === statusFilter;
    return m && s;
  });

  const onStatusChange = (id: string, next: DealStatus) => {
    if (!can("edit")) { toast.error("Read-only role"); return; }
    if (next === "Lost" || next === "Failed") { setLostFor(id); return; }
    setDealStatus(id, next, user?.name ?? "Demo");
    toast.success(`Status → ${next}`);
  };
  const onWin = (id: string) => {
    if (!can("edit")) return;
    const job = createJobFromDeal(id, user?.name ?? "Demo");
    if (job) { toast.success(`Job ${job.number} created`); navigate("/jobs"); }
  };
  const confirmLost = () => {
    if (!lostFor) return;
    setDealStatus(lostFor, "Lost", user?.name ?? "Demo", reason || "Not specified");
    toast.success("Deal marked Lost");
    setLostFor(null); setReason("");
  };

  return (
    <>
      <PageHeader title="Deals" thai="โอกาสการขาย"
        description="ติดตามโอกาสการขายตั้งแต่เริ่มติดต่อ ส่งใบเสนอราคา จนถึงปิดงาน"
        actions={<NewDealDialog />}
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาดีล…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {cols.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Tabs value={view} onValueChange={(v) => setView(v as never)} className="mb-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {cols.map((col) => {
                const ds = filtered.filter((d) => d.status === col);
                return (
                  <div key={col} className="w-72 shrink-0">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div>
                        <div className="text-sm font-semibold">{col}</div>
                        <div className="text-[11px] text-muted-foreground">{dealStatusThai[col]}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{ds.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[120px] p-2 rounded-lg bg-secondary/40">
                      {ds.map((d) => {
                        const cust = findCustomer(d.customerId);
                        return (
                          <Card key={d.id} className="p-3 card-soft">
                            <Link to={`/deals/${d.id}`} className="font-medium text-sm text-primary hover:underline">{d.name}</Link>
                            <div className="text-xs text-muted-foreground"><Link to={`/customers/${d.customerId}`} className="hover:underline">{cust?.name}</Link></div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-medium text-sm">{fmtTHB(d.estimatedValue)}</span>
                              <span className="text-xs text-muted-foreground">{d.probability}%</span>
                            </div>
                            <Select value={d.status} onValueChange={(v) => onStatusChange(d.id, v as DealStatus)}>
                              <SelectTrigger className="h-8 mt-2 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {cols.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {d.status === "Won" && (
                              <Button size="sm" className="w-full mt-2 bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => onWin(d.id)}>
                                <Trophy className="w-3.5 h-3.5 mr-1" /> สร้างงาน
                              </Button>
                            )}
                            {d.reasonLost && (
                              <div className="text-xs text-destructive mt-2">เหตุผลที่เสียดีล: {d.reasonLost}</div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <Card className="card-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Prob.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium"><Link to={`/deals/${d.id}`} className="text-primary hover:underline">{d.name}</Link></TableCell>
                    <TableCell>
                      <Link to={`/customers/${d.customerId}`} className="text-primary hover:underline">{findCustomer(d.customerId)?.name}</Link>
                    </TableCell>
                    <TableCell>{fmtTHB(d.estimatedValue)}</TableCell>
                    <TableCell>{d.probability}%</TableCell>
                    <TableCell>
                      <Select value={d.status} onValueChange={(v) => onStatusChange(d.id, v as DealStatus)}>
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {cols.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.expectedCloseDate}</TableCell>
                    <TableCell>
                      {d.status === "Won" && (
                        <Button size="sm" variant="outline" onClick={() => onWin(d.id)}>
                          สร้างงาน <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!lostFor} onOpenChange={(o) => !o && setLostFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ทำเครื่องหมายว่าเสียดีลใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>กรุณาบันทึกเหตุผล เพื่อใช้วิเคราะห์ในรายงาน Win/Loss</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-1.5">
            <Label>เหตุผลที่เสียดีล</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="เช่น ราคาสูงไป จังหวะไม่ลงตัว เสียให้คู่แข่ง…" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost}>ยืนยันว่าเสียดีล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
