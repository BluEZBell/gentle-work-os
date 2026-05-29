import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeOrders, APPROVAL_STATUSES, type ApprovalStatus } from "@/lib/mockBusiness";
import { setChangeOrderStatus, useBizTick } from "@/lib/storeBusiness";
import { findJob, findCustomer, fmtTHB } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { Search, GitPullRequest } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export default function ChangeOrders() {
  useBizTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const list = changeOrders.filter((c) => {
    const m = c.number.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || c.approvalStatus === filter;
    return m && s;
  });
  return (
    <>
      <PageHeader title="Change Orders" thai="คำขอเปลี่ยนแปลงงาน"
        description="Track scope and cost changes against active jobs."
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search change orders…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All approvals</SelectItem>
            {APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Card className="card-soft overflow-hidden">
        {list.length === 0 ? <EmptyState icon={GitPullRequest} title="No change orders" /> :
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CO #</TableHead>
              <TableHead>Job / Customer</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cost impact</TableHead>
              <TableHead className="text-right">Timeline</TableHead>
              <TableHead>Extra quote?</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => {
              const j = findJob(c.jobId);
              const cust = j ? findCustomer(j.customerId) : undefined;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.number}</TableCell>
                  <TableCell className="text-sm">
                    <div>{j?.number ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{cust?.name}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.requestedBy}<div className="text-xs text-muted-foreground">{c.requestDate}</div></TableCell>
                  <TableCell className="text-sm max-w-[280px]">{c.description}</TableCell>
                  <TableCell className="text-right font-medium">{fmtTHB(c.costImpact)}</TableCell>
                  <TableCell className="text-right text-sm">+{c.timelineImpactDays} d</TableCell>
                  <TableCell>{c.additionalQuotationRequired ? <StatusBadge status="Required" tone="warning" /> : <StatusBadge status="No" tone="muted" />}</TableCell>
                  <TableCell><StatusBadge status={c.approvalStatus} /></TableCell>
                  <TableCell>
                    <Select value={c.approvalStatus} disabled={!can("edit")}
                      onValueChange={(v) => { setChangeOrderStatus(c.id, v as ApprovalStatus, user?.name ?? "Demo"); toast.success(`CO → ${v}`); }}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>}
      </Card>
    </>
  );
}
