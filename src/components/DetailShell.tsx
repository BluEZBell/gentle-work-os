import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/Layout";
import { Attachments } from "@/components/Attachments";
import { Timeline, type TimelineEvent } from "@/components/Timeline";
import { CustomerLink } from "@/components/CustomerLink";
import { ExternalLink, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

export interface RelatedLink {
  label: string;
  to: string;
  hint?: string;
}

interface DetailShellProps {
  title: string;
  thai?: string;
  description?: string;
  breadcrumbs: Crumb[];
  status?: ReactNode;
  customerId?: string;
  jobId?: string;
  jobLabel?: string;
  jobLink?: string;
  documentLabel?: string;
  documentLink?: string;
  meta?: ReactNode;
  related?: RelatedLink[];
  timeline?: TimelineEvent[];
  module: string;
  recordId: string;
  children?: ReactNode;
  actions?: ReactNode;
}

const notesStore: Record<string, { id: string; text: string; date: string; user: string }[]> = {};

export function DetailShell(p: DetailShellProps) {
  const key = `${p.module}:${p.recordId}`;
  const [notes, setNotes] = useState(notesStore[key] ?? []);
  const [draft, setDraft] = useState("");

  const addNote = () => {
    if (!draft.trim()) return;
    const next = [{ id: Math.random().toString(36).slice(2, 8), text: draft, date: new Date().toISOString().slice(0, 16).replace("T", " "), user: "Khun Ploy" }, ...notes];
    notesStore[key] = next;
    setNotes(next);
    setDraft("");
    toast.success("บันทึกหมายเหตุแล้ว");
  };

  return (
    <>
      <PageHeader
        title={p.title}
        thai={p.thai}
        breadcrumbs={<Breadcrumbs items={p.breadcrumbs} />}
        description={p.description ?? "หน้ารายละเอียดเชื่อมโยงข้อมูลที่เกี่ยวข้องทั้งหมด คลิกลิงก์เพื่อนำทางไปยังเรคคอร์ดอื่น"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {p.status}
            {p.actions}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3 text-sm">ข้อมูลหลัก (Overview)</h3>
            <div className="space-y-2 text-sm">{p.meta}</div>
          </Card>

          <Card className="card-soft p-5">
            <h3 className="font-semibold mb-3 text-sm">เรคคอร์ดที่เกี่ยวข้อง (Related)</h3>
            <div className="space-y-2 text-sm">
              {p.customerId && (
                <Row label="ลูกค้า">
                  <CustomerLink customerId={p.customerId} />
                </Row>
              )}
              {p.jobLink && (
                <Row label="งาน">
                  <Link to={p.jobLink} className="text-primary hover:underline inline-flex items-center gap-1">
                    {p.jobLabel ?? "ดูงาน"} <ExternalLink className="w-3 h-3" />
                  </Link>
                </Row>
              )}
              {p.documentLink && (
                <Row label="เอกสาร">
                  <Link to={p.documentLink} className="text-primary hover:underline inline-flex items-center gap-1">
                    {p.documentLabel ?? "ดูเอกสาร"} <ExternalLink className="w-3 h-3" />
                  </Link>
                </Row>
              )}
              {(p.related ?? []).map((r, i) => (
                <Row key={i} label={r.label}>
                  <Link to={r.to} className="text-primary hover:underline inline-flex items-center gap-1">
                    {r.hint ?? "เปิด"} <ExternalLink className="w-3 h-3" />
                  </Link>
                </Row>
              ))}
              {!p.customerId && !p.jobLink && !p.documentLink && !(p.related ?? []).length && (
                <div className="text-xs text-muted-foreground">ไม่มีเรคคอร์ดที่ผูกไว้</div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="flex flex-wrap h-auto justify-start">
              <TabsTrigger value="details">รายละเอียด</TabsTrigger>
              <TabsTrigger value="timeline">Timeline ({(p.timeline ?? []).length})</TabsTrigger>
              <TabsTrigger value="notes">Activity / Notes ({notes.length})</TabsTrigger>
              <TabsTrigger value="attach">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              {p.children}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card className="card-soft p-5">
                <Timeline events={p.timeline ?? []} />
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card className="card-soft p-5">
                <div className="flex flex-col gap-2 mb-4">
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                    placeholder="เพิ่มหมายเหตุ การติดต่อ หรือข้อความภายในทีม…" />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={addNote}><MessageSquarePlus className="w-3.5 h-3.5 mr-1" /> บันทึกหมายเหตุ</Button>
                  </div>
                </div>
                {notes.length === 0 ? (
                  <div className="text-xs text-muted-foreground">ยังไม่มีหมายเหตุสำหรับเรคคอร์ดนี้</div>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div key={n.id} className="text-sm border-b last:border-0 py-2">
                        <div className="text-foreground">{n.text}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{n.user} • {n.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="attach" className="mt-4">
              <Card className="card-soft p-5">
                <Attachments module={p.module} id={p.recordId} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm text-right min-w-0">{children}</div>
    </div>
  );
}

export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm text-right min-w-0">{children}</div>
    </div>
  );
}

export function NotFoundDetail({ backTo, label }: { backTo: string; label: string }) {
  return (
    <Card className="card-soft p-8 text-center">
      <div className="text-sm text-muted-foreground mb-3">ไม่พบเรคคอร์ดนี้ อาจถูกลบหรือเปลี่ยนหมายเลข</div>
      <Link to={backTo} className="text-primary hover:underline">← กลับไปยัง {label}</Link>
    </Card>
  );
}
