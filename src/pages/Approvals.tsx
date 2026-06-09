import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { docApprovals, DOC_APPROVAL_STATUSES, APPROVAL_DOC_TYPES, type DocApprovalStatus } from "@/lib/mockExtended";
import { fmtTHB } from "@/lib/mockData";
import { Check, X, RotateCcw, ChevronDown, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useSearchParams, Link } from "react-router-dom";

const tone = (s: DocApprovalStatus) =>
  s === "Approved" ? "success" : s === "Rejected" ? "danger" :
  s === "Revision Required" ? "warning" : s === "Cancelled" ? "muted" :
  s === "Pending Review" ? "warning" : "info";

export default function Approvals() {
  const [params] = useSearchParams();
  const initialStatus = params.get("filter") ?? "all";
  const [items, setItems] = useState(docApprovals);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [st, setSt] = useState<string>(initialStatus);

  const update = (id: string, status: DocApprovalStatus, comment?: string) => {
    setItems(items.map((it) => it.id === id ? {
      ...it, status,
      approvedBy: status === "Approved" ? "Khun Somchai" : it.approvedBy,
      approvedDate: status === "Approved" ? new Date().toISOString().slice(0, 10) : it.approvedDate,
      history: [...it.history, { date: new Date().toISOString().slice(0, 16).replace("T", " "), from: it.status, to: status, by: "Khun Somchai", comment }],
    } : it));
    toast.success(`อัปเดตเป็น ${status}`);
  };

  const list = items.filter((it) =>
    (type === "all" || it.docType === type) && (st === "all" || it.status === st) &&
    (it.reference.toLowerCase().includes(q.toLowerCase()) || it.docType.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Approvals" thai="อนุมัติเอกสาร"
        description="ระบบอนุมัติเอกสารทั้งหมด — ใบเสนอราคา ใบสั่งซื้อ บิล ใบแจ้งหนี้ ใบสำคัญจ่าย คำขอเปลี่ยนแปลง เงินเดือน และการตัดสินทรัพย์" />

      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเอกสาร…" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {APPROVAL_DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={st} onValueChange={setSt}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {DOC_APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <div className="grid gap-3">
        {list.map((it) => (
          <Card key={it.id} className="card-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/approvals/${it.id}`} className="font-medium text-primary hover:underline">{it.reference}</Link>
                  <span className="text-xs text-muted-foreground">• {it.docType}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ขอโดย {it.requestedBy} • ผู้ตรวจ {it.reviewer}
                  {it.approvedBy && ` • อนุมัติโดย ${it.approvedBy} (${it.approvedDate})`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {it.amount !== undefined && <span className="text-sm font-medium">{fmtTHB(it.amount)}</span>}
                <StatusBadge status={it.status} tone={tone(it.status) as never} />
              </div>
            </div>
            {(it.status === "Submitted" || it.status === "Pending Review" || it.status === "Revision Required") && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" onClick={() => update(it.id, "Approved", "OK")}><Check className="w-4 h-4 mr-1" /> อนุมัติ</Button>
                <Button size="sm" variant="outline" onClick={() => update(it.id, "Revision Required", "ขอแก้ไข")}><RotateCcw className="w-4 h-4 mr-1" /> ขอแก้ไข</Button>
                <Button size="sm" variant="outline" onClick={() => update(it.id, "Rejected", "ไม่อนุมัติ")}><X className="w-4 h-4 mr-1" /> ปฏิเสธ</Button>
              </div>
            )}
            <Collapsible className="mt-3">
              <CollapsibleTrigger className="text-xs text-primary hover:underline flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> ดูประวัติสถานะ ({it.history.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 border rounded-md divide-y">
                {it.history.map((h, i) => (
                  <div key={i} className="px-3 py-2 text-xs flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.from} tone="muted" />
                    <span className="text-muted-foreground">→</span>
                    <StatusBadge status={h.to} tone={tone(h.to as DocApprovalStatus) as never} />
                    <span className="ml-auto text-muted-foreground">{h.by} • {h.date}</span>
                    {h.comment && <div className="w-full text-muted-foreground">{h.comment}</div>}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </>
  );
}
