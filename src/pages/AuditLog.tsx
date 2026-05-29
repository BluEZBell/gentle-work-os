import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { auditLogs } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

const toneFor = (action: string) => {
  if (action.includes("DENIED")) return "danger";
  if (action === "Approve Supplier Bill") return "success";
  if (action === "Login") return "info";
  return "muted";
};

export default function AuditLogPage() {
  return (
    <>
      <PageHeader title="Audit Log" thai="บันทึกการใช้งาน"
        description="Every meaningful action is recorded for security review."
      />
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm font-mono text-muted-foreground">{a.timestamp}</TableCell>
                <TableCell className="text-sm">{a.user}</TableCell>
                <TableCell><StatusBadge status={a.action} tone={toneFor(a.entity.includes("DENIED") ? "DENIED" : a.action) as never} /></TableCell>
                <TableCell className="text-sm">{a.entity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
