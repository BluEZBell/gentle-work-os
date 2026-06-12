// Contact detail drawer (Sheet) — shows full contact info, related records & activity timeline.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { contacts, deals, quotations, jobs, serviceRecords, findCustomer, fmtTHB } from "@/lib/mockData";
import { activities, customerInvoices, purchaseOrders, tasks } from "@/lib/mockBusiness";
import { calendarEvents } from "@/lib/mockCalendar";
import { contactNotes, useNotesTick } from "@/lib/notesStore";
import { StatusBadge } from "@/components/StatusBadge";
import { useTick } from "@/lib/store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactId?: string;
}

export function ContactDetailSheet({ open, onOpenChange, contactId }: Props) {
  useTick(); useNotesTick();
  const c = contacts.find((x) => x.id === contactId);
  const cust = c ? findCustomer(c.customerId) : undefined;

  const related = useMemo(() => {
    if (!c) return null;
    const cDeals = deals.filter((d) => d.contactId === c.id);
    const cQuots = quotations.filter((q) => q.customerId === c.customerId);
    const cJobs = jobs.filter((j) => j.customerId === c.customerId);
    const cInvs = customerInvoices.filter((i) => i.customerId === c.customerId);
    const cPOs = purchaseOrders.filter((p) => cJobs.some((j) => j.id === p.jobId));
    const cSvc = serviceRecords.filter((s) => s.customerId === c.customerId);
    const cTasks = tasks.filter((t) => t.customerId === c.customerId);
    const cEvts = calendarEvents.filter((e) => e.customerId === c.customerId);
    return { cDeals, cQuots, cJobs, cInvs, cPOs, cSvc, cTasks, cEvts };
  }, [c]);

  const acts = c ? activities.filter((a) => a.customerId === c.customerId).slice(0, 12) : [];
  const notes = c ? contactNotes.filter((n) => n.contactId === c.id) : [];
  const lastAct = acts[0];
  const nextFu = c ? activities
    .filter((a) => a.customerId === c.customerId && a.nextFollowUp)
    .map((a) => a.nextFollowUp!).sort()[0] : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {!c ? <div className="p-6 text-sm text-muted-foreground">ไม่พบผู้ติดต่อ</div> : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 flex-wrap">
                {c.name}
                {c.isMain && <Badge className="bg-primary/15 text-primary border-primary/30">Main</Badge>}
                {c.isBilling && <Badge variant="secondary">Billing</Badge>}
                {c.isDelivery && <Badge variant="secondary">Delivery</Badge>}
                {c.isPoApprover && <Badge variant="secondary">PO Approver</Badge>}
              </SheetTitle>
              <SheetDescription>
                {c.role}{c.department ? ` • ${c.department}` : ""} {cust && <> • <Link to={`/customers/${cust.id}`} className="text-primary hover:underline">{cust.name}</Link></>}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 grid gap-4">
              <Card className="p-4 space-y-2 text-sm">
                {c.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></div>}
                {c.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></div>}
                {c.lineId && <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-muted-foreground" /> Line: {c.lineId}</div>}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  ประเภท: {c.contactType ?? "—"} • ช่องทางที่สะดวก: {c.preferredChannel ?? "—"}
                </div>
                {c.notes && <div className="text-xs p-2 rounded bg-secondary/60">📝 {c.notes}</div>}
                {c.internalNote && <div className="text-xs p-2 rounded bg-warning-soft/40">🔒 {c.internalNote}</div>}
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3"><div className="text-[11px] text-muted-foreground">Last Contacted</div>
                  <div className="text-sm font-medium">{lastAct ? `${lastAct.date} • ${lastAct.type}` : "—"}</div></Card>
                <Card className="p-3"><div className="text-[11px] text-muted-foreground">Next Follow-up</div>
                  <div className="text-sm font-medium">{nextFu ?? "—"}</div></Card>
              </div>

              {notes.length > 0 && (
                <Section title={`Notes (${notes.length})`}>
                  {notes.map((n) => (
                    <div key={n.id} className="text-sm border-b last:border-0 py-2">
                      <div className="flex justify-between"><span className="font-medium text-xs">{n.type}</span><span className="text-xs text-muted-foreground">{n.createdAt}</span></div>
                      <div className="text-xs mt-0.5">{n.body}</div>
                    </div>
                  ))}
                </Section>
              )}

              <Section title="Related Records">
                <RelList label="Deals" items={related!.cDeals.map((d) => ({ to: `/deals/${d.id}`, text: d.name, right: <StatusBadge status={d.status} /> }))} />
                <RelList label="Customer PO" items={related!.cPOs.map((p) => ({ to: `/customer-po/${p.id}`, text: p.number, right: <StatusBadge status={p.status} /> }))} />
                <RelList label="Quotations" items={related!.cQuots.map((q) => ({ to: `/quotations/${q.id}`, text: q.number, right: <StatusBadge status={q.status} /> }))} />
                <RelList label="Jobs" items={related!.cJobs.map((j) => ({ to: `/jobs/${j.id}`, text: j.number, right: <StatusBadge status={j.status} /> }))} />
                <RelList label="Invoices" items={related!.cInvs.map((i) => ({ to: `/invoices/${i.id}`, text: i.number, right: <span className="text-xs">{fmtTHB(i.total)}</span> }))} />
                <RelList label="Service" items={related!.cSvc.map((s) => ({ to: `/service/${s.id}`, text: s.partName, right: <StatusBadge status={s.status} /> }))} />
                <RelList label="Tasks" items={related!.cTasks.map((t) => ({ to: `/tasks`, text: t.name, right: <StatusBadge status={t.status} /> }))} />
                <RelList label="Calendar" items={related!.cEvts.map((e) => ({ to: `/calendar`, text: e.title, right: <span className="text-xs text-muted-foreground">{e.date}</span> }))} />
              </Section>

              <Section title={`กิจกรรม (${acts.length})`}>
                {acts.length === 0 ? <div className="text-xs text-muted-foreground">ยังไม่มีกิจกรรม</div> :
                  acts.map((a) => (
                    <div key={a.id} className="text-sm border-b last:border-0 py-2">
                      <div className="flex justify-between"><span className="font-medium">{a.type}</span><span className="text-xs text-muted-foreground">{a.date}</span></div>
                      <div className="text-xs text-muted-foreground">{a.note}</div>
                    </div>
                  ))}
              </Section>

              {cust && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/customers/${cust.id}`}><ExternalLink className="w-3.5 h-3.5 mr-1" />เปิดโปรไฟล์ลูกค้า</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{title}</div>
      <Card className="p-3">{children}</Card>
    </div>
  );
}
function RelList({ label, items }: { label: string; items: { to: string; text: string; right?: React.ReactNode }[] }) {
  if (!items.length) return null;
  return (
    <div className="py-1.5 border-b last:border-0">
      <div className="text-[11px] text-muted-foreground mb-1">{label} ({items.length})</div>
      {items.slice(0, 4).map((it, i) => (
        <div key={i} className="flex items-center justify-between text-sm py-0.5">
          <Link to={it.to} className="text-primary hover:underline truncate">{it.text}</Link>
          {it.right}
        </div>
      ))}
    </div>
  );
}
