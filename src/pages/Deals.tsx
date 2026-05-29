import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deals, dealStatusThai, findCustomer, fmtTHB, type DealStatus,
} from "@/lib/mockData";
import { Plus, ArrowRight, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const cols: DealStatus[] = ["New Lead", "Contacted", "Need Quotation", "Quotation Sent", "Negotiation", "Won", "Lost", "Failed"];

export default function Deals() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  return (
    <>
      <PageHeader title="Deals" thai="โอกาสการขาย"
        description="Your sales pipeline. When a deal is Won, create a job in one click."
        actions={<Button><Plus className="w-4 h-4 mr-1" /> New deal</Button>}
      />
      <Tabs value={view} onValueChange={(v) => setView(v as never)} className="mb-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {cols.map((col) => {
                const ds = deals.filter((d) => d.status === col);
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
                            <div className="font-medium text-sm">{d.name}</div>
                            <div className="text-xs text-muted-foreground">{cust?.name}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-medium text-sm">{fmtTHB(d.estimatedValue)}</span>
                              <span className="text-xs text-muted-foreground">{d.probability}%</span>
                            </div>
                            {d.status === "Won" && (
                              <Button size="sm" className="w-full mt-3 bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => toast.success(`Job created from "${d.name}"`)}>
                                <Trophy className="w-3.5 h-3.5 mr-1" /> Create Job from Won Deal
                              </Button>
                            )}
                            {d.reasonLost && (
                              <div className="text-xs text-destructive mt-2">Lost: {d.reasonLost}</div>
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
                {deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      <Link to={`/customers/${d.customerId}`} className="text-primary hover:underline">{findCustomer(d.customerId)?.name}</Link>
                    </TableCell>
                    <TableCell>{fmtTHB(d.estimatedValue)}</TableCell>
                    <TableCell>{d.probability}%</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.expectedCloseDate}</TableCell>
                    <TableCell>
                      {d.status === "Won" && (
                        <Button size="sm" variant="outline" onClick={() => toast.success(`Job created from "${d.name}"`)}>
                          Create Job <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
    </>
  );
}
