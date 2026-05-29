import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  jobs, findCustomer, findSupplier, fmtTHB, jobStatusThai,
} from "@/lib/mockData";
import { CalendarDays, Plus, TrendingUp, Truck } from "lucide-react";

export default function Jobs() {
  return (
    <>
      <PageHeader title="Jobs" thai="งานผลิต/บริการ"
        description="Track production and service jobs with profit and supplier visibility."
        actions={<Button><Plus className="w-4 h-4 mr-1" /> New job</Button>}
      />
      <div className="grid gap-4">
        {jobs.map((j) => {
          const profit = j.sellPrice - j.actualCost;
          const margin = Math.round((profit / j.sellPrice) * 100);
          return (
            <Card key={j.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">{j.number}</span>
                    <StatusBadge status={j.status} />
                    <span className="text-xs text-muted-foreground">({jobStatusThai[j.status]})</span>
                  </div>
                  <div className="text-sm mt-1">{j.name}</div>
                  <div className="text-xs text-muted-foreground">{findCustomer(j.customerId)?.name}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <Card className="p-4 bg-success-soft border-success/20">
                  <div className="flex items-center gap-2 text-xs text-success font-medium">
                    <TrendingUp className="w-4 h-4" /> GROSS PROFIT
                  </div>
                  <div className="font-display text-2xl font-semibold mt-1">{fmtTHB(profit)}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtTHB(j.sellPrice)} sell − {fmtTHB(j.actualCost)} cost • {margin}% margin
                  </div>
                </Card>

                <Card className="p-4 bg-secondary/60">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="w-4 h-4" /> TIMELINE
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Start</span><span>{j.startDate}</span></div>
                    <div className="flex justify-between"><span>Due</span><span>{j.dueDate}</span></div>
                    {j.deliveryDate && <div className="flex justify-between text-success"><span>Delivered</span><span>{j.deliveryDate}</span></div>}
                  </div>
                </Card>

                <Card className="p-4 bg-secondary/60">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Truck className="w-4 h-4" /> SUPPLIER
                  </div>
                  <div className="mt-2 text-sm font-medium">{findSupplier(j.supplierId)?.name}</div>
                  <div className="text-xs text-muted-foreground">{findSupplier(j.supplierId)?.contactPerson}</div>
                  {j.notes && <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">{j.notes}</div>}
                </Card>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
