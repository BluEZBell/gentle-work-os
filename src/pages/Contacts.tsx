import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { contacts, findCustomer } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export default function Contacts() {
  return (
    <>
      <PageHeader title="Contacts" thai="ผู้ติดต่อ"
        description="People linked to your customer accounts."
        actions={<Button><Plus className="w-4 h-4 mr-1" /> Add contact</Button>}
      />
      <Card className="card-soft overflow-hidden">
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
            {contacts.map((c) => {
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
        </Table>
      </Card>
    </>
  );
}
