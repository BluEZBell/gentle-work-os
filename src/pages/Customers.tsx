import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useParams } from "react-router-dom";
import {
  customers, contacts, deals, quotations, jobs, serviceRecords,
  findCustomer, fmtTHB,
} from "@/lib/mockData";
import { Lock, Search, Plus, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Customers() {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Customers" thai="ลูกค้า"
        description="Your CRM. Confidential customers are flagged and protected."
        actions={<Button><Plus className="w-4 h-4 mr-1" /> Add customer</Button>}
      />
      <Card className="card-soft p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="pl-9" />
        </div>
      </Card>
      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const dealCount = deals.filter((d) => d.customerId === c.id).length;
              return (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/customers/${c.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                      {c.confidential && <Lock className="w-3.5 h-3.5 text-warning" />}
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.address}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={c.type} tone={c.type === "Corporate" ? "primary" : c.type === "Existing" ? "info" : "muted"} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.updatedAt}</TableCell>
                  <TableCell className="text-right font-medium">{dealCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const c = findCustomer(id!);
  if (!c) return <div>Customer not found. <Link to="/customers" className="text-primary">Back</Link></div>;

  const cContacts = contacts.filter((x) => x.customerId === c.id);
  const cDeals = deals.filter((d) => d.customerId === c.id);
  const cQuots = quotations.filter((q) => q.customerId === c.id);
  const cJobs = jobs.filter((j) => j.customerId === c.id);
  const cSvc = serviceRecords.filter((s) => s.customerId === c.id);

  return (
    <>
      <Link to="/customers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to customers
      </Link>
      <PageHeader title={c.name}
        description={c.confidential ? "Confidential account — handle with care." : undefined}
        actions={<StatusBadge status={c.type} tone={c.type === "Corporate" ? "primary" : "info"} />}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="card-soft p-5 lg:col-span-1">
          <h3 className="font-semibold mb-3">Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {c.email}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {c.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {c.address}</div>
            <div className="pt-3 border-t mt-3 text-muted-foreground text-xs">
              Source: {c.source} • Created {c.createdAt}
            </div>
            {c.notes && <div className="mt-3 p-3 bg-secondary/60 rounded text-sm">{c.notes}</div>}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Contacts ({cContacts.length})</h3>
            <div className="space-y-2">
              {cContacts.map((ct) => (
                <div key={ct.id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                  <div>
                    <div className="font-medium">{ct.name}</div>
                    <div className="text-xs text-muted-foreground">{ct.role} • {ct.department}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{ct.email}</div>
                    <div>{ct.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3">Deals ({cDeals.length})</h3>
            <div className="space-y-2">
              {cDeals.map((d) => (
                <div key={d.id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{fmtTHB(d.estimatedValue)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">Quotations ({cQuots.length})</h3>
              {cQuots.map((q) => (
                <div key={q.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{q.number}</span>
                  <StatusBadge status={q.status} />
                </div>
              ))}
            </Card>
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">Jobs ({cJobs.length})</h3>
              {cJobs.map((j) => (
                <div key={j.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{j.number}</span>
                  <StatusBadge status={j.status} />
                </div>
              ))}
            </Card>
          </div>

          {cSvc.length > 0 && (
            <Card className="card-soft p-5">
              <h3 className="font-semibold mb-3">Service / Calibration ({cSvc.length})</h3>
              {cSvc.map((s) => (
                <div key={s.id} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                  <div>
                    <div>{s.partName}</div>
                    <div className="text-xs text-muted-foreground">Due {s.calibrationDueDate}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
