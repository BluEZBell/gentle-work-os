import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supplierBills, findSupplier, fmtTHB } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Mail, FileSearch, ClipboardCheck, CalendarClock, CheckCircle2 } from "lucide-react";

const flow = [
  { icon: Mail, label: "Supplier Email" },
  { icon: FileSearch, label: "Extract Data" },
  { icon: ClipboardCheck, label: "Pending Review" },
  { icon: CheckCircle2, label: "Approved" },
  { icon: CalendarClock, label: "Calendar Reminder" },
];

export default function SupplierBills() {
  return (
    <>
      <PageHeader title="Supplier Bills" thai="บิลซัพพลายเออร์"
        description="Accounts payable with payment reminders and human-in-the-loop review."
      />

      <Alert className="mb-4 border-warning/40 bg-warning-soft">
        <AlertTriangle className="h-4 w-4 text-warning-foreground" />
        <AlertTitle className="text-warning-foreground">AI-extracted bills require human review before approval.</AlertTitle>
        <AlertDescription className="text-warning-foreground/80">
          Financial records are never auto-approved. An Owner must review the extracted data.
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-5 mb-4">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Automated Workflow (Demo)</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {flow.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/70 border min-w-max">
                <step.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{step.label}</span>
              </div>
              {i < flow.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Review</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierBills.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.number}</TableCell>
                <TableCell>
                  <div className="text-sm">{findSupplier(b.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">from {b.emailSource}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{b.billDate}</div>
                  <div className="text-xs text-muted-foreground">due {b.dueDate}</div>
                </TableCell>
                <TableCell className="text-right">{fmtTHB(b.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtTHB(b.vat)}</TableCell>
                <TableCell className="text-right font-medium">{fmtTHB(b.total)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                <TableCell><StatusBadge status={b.reviewStatus} /></TableCell>
                <TableCell>
                  {b.reviewStatus === "Pending Review" && (
                    <Button size="sm" variant="outline">Review</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
