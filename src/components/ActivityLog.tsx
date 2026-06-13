import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activities, ACTIVITY_TYPES, type ActivityType } from "@/lib/mockBusiness";
import { addActivity, useBizTick } from "@/lib/storeBusiness";
import { useAuth } from "@/lib/auth";
import { Phone, Mail, MessageSquare, Users, Bell, FileText, Reply, StickyNote, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";

const icon: Record<ActivityType, typeof Phone> = {
  "Call": Phone, "Email": Mail, "LINE message": MessageSquare, "Meeting": Users,
  "Follow-up": Bell, "Quotation sent": FileText, "Customer replied": Reply, "Internal note": StickyNote,
};

type Scope = { customerId?: string; dealId?: string; jobId?: string; quotationId?: string };

export function ActivityLog({ scope, title = "Activity & Follow-ups" }: { scope: Scope; title?: string }) {
  useBizTick();
  const { user } = useAuth();
  const [type, setType] = useState<ActivityType>("Call");
  const [note, setNote] = useState("");
  const [next, setNext] = useState("");

  const list = activities.filter((a) =>
    (scope.customerId ? a.customerId === scope.customerId : true) &&
    (scope.dealId ? a.dealId === scope.dealId : true) &&
    (scope.jobId ? a.jobId === scope.jobId : true) &&
    (scope.quotationId ? a.quotationId === scope.quotationId : true) &&
    (scope.customerId || scope.dealId || scope.jobId || scope.quotationId
      ? true
      : true)
  );

  const submit = () => {
    if (!note.trim()) { toast.error("กรุณาใส่โน้ตสั้นๆ"); return; }
    addActivity({
      date: new Date().toISOString().slice(0, 10),
      type, user: user?.name ?? "Demo",
      note, nextFollowUp: next || undefined, ...scope,
    });
    setNote(""); setNext(""); toast.success("บันทึกกิจกรรมแล้ว");
  };

  return (
    <Card className="card-soft p-5">
      <h3 className="font-semibold mb-3">{title}</h3>

      <div className="grid md:grid-cols-[160px,1fr,160px,auto] gap-2 mb-4">
        <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" />
        <div>
          <Label className="text-[10px] text-muted-foreground">Next follow-up</Label>
          <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} className="h-9" />
        </div>
        <Button onClick={submit} className="h-9"><Plus className="w-4 h-4 mr-1" />Log</Button>
      </div>

      {list.length === 0 ? <EmptyState title="No activity yet" hint="Log a call, email, or LINE message to start the timeline." /> :
        <div className="space-y-3">
          {list.map((a) => {
            const I = icon[a.type];
            return (
              <div key={a.id} className="flex gap-3 text-sm border-b last:border-0 pb-3 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center shrink-0">
                  <I className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <div className="font-medium">{a.type}</div>
                    <div className="text-xs text-muted-foreground">{a.date} • {a.user}</div>
                  </div>
                  <div className="text-sm mt-0.5">{a.note}</div>
                  {a.nextFollowUp && <div className="text-xs text-warning-foreground mt-1">Next follow-up: {a.nextFollowUp}</div>}
                </div>
              </div>
            );
          })}
        </div>}
    </Card>
  );
}
