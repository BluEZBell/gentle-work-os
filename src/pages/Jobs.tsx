import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  jobs, findCustomer, findSupplier, fmtTHB, jobStatusThai, type JobStatus,
} from "@/lib/mockData";
import { setJobStatus, createServiceFromJob, useTick } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Search, Sparkles, TrendingUp, Truck, Headphones } from "lucide-react";
import { toast } from "sonner";

const statuses: JobStatus[] = ["Pending", "In Progress", "Waiting Supplier", "Waiting Customer", "Delivered", "Closed", "Problem"];

export default function Jobs() {
  useTick();
  const { user, can } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const list = jobs.filter((j) => {
    const m = j.name.toLowerCase().includes(q.toLowerCase()) || j.number.toLowerCase().includes(q.toLowerCase());
    const s = filter === "all" || j.status === filter;
    return m && s;
  });

  return (
    <>
      <PageHeader title="Jobs" thai="งานผลิต/บริการ"
        description="Track production and service jobs with profit and supplier visibility."
      />
      <Card className="card-soft p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <div className="grid gap-4">
        {list.map((j) => {
          const profit = j.sellPrice - j.actualCost;
          const margin = Math.round((profit / j.sellPrice) * 100);
          return (
            <Card key={j.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold">{j.number}</span>
                    <StatusBadge status={j.status} />
                    <span className="text-xs text-muted-foreground">({jobStatusThai[j.status]})</span>
                  </div>
                  <div className="text-sm mt-1">{j.name}</div>
                  <div className="text-xs text-muted-foreground">{findCustomer(j.customerId)?.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={j.status} disabled={!can("edit")}
                    onValueChange={(v) => { setJobStatus(j.id, v as JobStatus, user?.name ?? "Demo"); toast.success(`Status → ${v}`); }}>
                    <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {j.status === "Delivered" && (
                    <Button size="sm" variant="outline" disabled={!can("edit")}
                      onClick={() => {
                        const sv = createServiceFromJob(j.id, user?.name ?? "Demo");
                        if (sv) toast.success("Service / Calibration reminder created");
                      }}>
                      <Headphones className="w-3.5 h-3.5 mr-1" /> Create Service Reminder
                    </Button>
                  )}
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
                  {j.notes && <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-start gap-1"><Sparkles className="w-3 h-3 mt-0.5" />{j.notes}</div>}
                </Card>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
