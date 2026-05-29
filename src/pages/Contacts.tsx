import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { contacts, findCustomer } from "@/lib/mockData";
import { useTick } from "@/lib/store";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { NewContactDialog } from "@/components/dialogs/NewContactDialog";
import { EmptyState } from "@/components/EmptyState";

export default function Contacts() {
  useTick();
  const [q, setQ] = useState("");
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase()) ||
    (findCustomer(c.customerId)?.name ?? "").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Contacts" thai="ผู้ติดต่อ"
        description="People linked to your customer accounts."
        actions={<NewContactDialog />}
      />
      <Card className="card-soft p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-9" />
        </div>
      </Card>
      <Card className="card-soft overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="No contacts" /> :
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role / Department</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const cust = findCustomer(c.customerId);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{c.role}</div>
                    <div className="text-xs text-muted-foreground">{c.department}</div>
                  </TableCell>
                  <TableCell>
                    {cust && <Link to={`/customers/${cust.id}`} className="text-primary hover:underline text-sm">{cust.name}</Link>}
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.phone}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>}
      </Card>
    </>
  );
}
