import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditLogs } from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function AuditLogPage() {
  useTick();
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");
  const modules = Array.from(new Set(auditLogs.map((a) => a.module)));
  const list = auditLogs.filter((a) => {
    const m = `${a.user} ${a.action} ${a.entity}`.toLowerCase().includes(q.toLowerCase());
    const s = mod === "all" || a.module === mod;
    return m && s;
  });
  return (
    <>
      <PageHeader title="Audit Log" thai="บันทึกการใช้งาน"
        description="Every meaningful action is recorded for security review."
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search audit log…" className="pl-9" />
        </div>
        <Select value={mod} onValueChange={setMod}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm font-mono text-muted-foreground">{a.timestamp}</TableCell>
                <TableCell className="text-sm">{a.user}</TableCell>
                <TableCell className="text-sm font-medium">{a.action}</TableCell>
                <TableCell><StatusBadge status={a.module} tone="muted" /></TableCell>
                <TableCell className="text-sm">{a.entity}</TableCell>
                <TableCell><StatusBadge status={a.status} tone={a.status === "OK" ? "success" : a.status === "DENIED" ? "danger" : "warning"} /></TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{a.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
