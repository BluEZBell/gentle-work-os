import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { THAI_DOC_TYPES } from "@/lib/mockExtended";
import { Printer, FileText, FileDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ThaiDocLayout } from "@/components/ThaiDocLayouts";
import { RowActions } from "@/components/RowActions";

interface DocRow {
  id: string;
  typeId: string;
  number: string;
  date: string;
  customer: string;
  amount: number;
  status: "Draft" | "Issued" | "Sent" | "Paid";
}

const SEED: DocRow[] = [
  { id: "d1", typeId: "td1", number: "QT-2026-0042", date: "2026-05-20", customer: "Anan Precision", amount: 480000, status: "Sent" },
  { id: "d2", typeId: "td5", number: "INV-2026-0046", date: "2026-05-28", customer: "Anan Precision", amount: 256800, status: "Issued" },
  { id: "d3", typeId: "td6", number: "TAX-2026-0046", date: "2026-05-28", customer: "Anan Precision", amount: 256800, status: "Issued" },
  { id: "d4", typeId: "td4", number: "DN-2026-0021", date: "2026-05-26", customer: "Northern Auto", amount: 117700, status: "Issued" },
  { id: "d5", typeId: "td8", number: "PV-2026-0011", date: "2026-05-25", customer: "Thanasak Metals", amount: 108000, status: "Issued" },
  { id: "d6", typeId: "td9", number: "PO-2026-024", date: "2026-05-20", customer: "Thanasak Metals", amount: 60500, status: "Sent" },
  { id: "d7", typeId: "td7", number: "RCP-2026-0098", date: "2026-05-22", customer: "Northern Auto", amount: 64200, status: "Paid" },
];

const fmtTHB = (n: number) => n.toLocaleString() + " ฿";

export default function ThaiDocuments() {
  const [list, setList] = useState<DocRow[]>(SEED);
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = typeFilter === "all" ? list : list.filter((d) => d.typeId === typeFilter);

  const typeName = (id: string) => THAI_DOC_TYPES.find((t) => t.id === id)?.name ?? "—";
  const typeEn = (id: string) => THAI_DOC_TYPES.find((t) => t.id === id)?.en ?? "—";

  const duplicate = (d: DocRow) => {
    const next: DocRow = {
      ...d,
      id: `dup-${Date.now()}`,
      number: d.number.replace(/(\d+)$/, (m) => String(Number(m) + 1).padStart(m.length, "0")),
      status: "Draft",
      date: new Date().toISOString().slice(0, 10),
    };
    setList([next, ...list]);
  };
  const remove = (id: string) => setList(list.filter((d) => d.id !== id));

  return (
    <>
      <PageHeader title="Thai Documents" thai="เอกสารภาษาไทย"
        description="เทมเพลตเอกสารภายในตามมาตรฐานไทย แต่ละประเภทมีเลย์เอาต์ของตัวเอง พรีวิวก่อนพิมพ์และส่งออก PDF (เดโม)"
        actions={<Button size="sm" onClick={() => toast.info("เริ่มสร้างเอกสาร (เดโม)")}><Plus className="w-4 h-4 mr-1" /> สร้างเอกสารใหม่</Button>}
      />

      {/* Type cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setTypeFilter("all")}
          className={`text-left card-soft p-3 rounded-lg border transition ${typeFilter === "all" ? "border-primary bg-accent/40" : "hover:bg-accent/30"}`}
        >
          <div className="font-medium text-sm">ทั้งหมด</div>
          <div className="text-xs text-muted-foreground">All types · {list.length}</div>
        </button>
        {THAI_DOC_TYPES.map((d) => {
          const count = list.filter((x) => x.typeId === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => { setTypeFilter(d.id); setOpenId(d.id); }}
              className={`text-left card-soft p-3 rounded-lg border transition ${typeFilter === d.id ? "border-primary bg-accent/40" : "hover:bg-accent/30"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <div className="font-medium text-sm">{d.name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{d.en} · {count}</div>
            </button>
          );
        })}
      </div>

      {/* Sample preview launcher per type (when single type selected) */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              ตัวอย่าง {THAI_DOC_TYPES.find((d) => d.id === openId)?.name} — {THAI_DOC_TYPES.find((d) => d.id === openId)?.en}
            </DialogTitle>
          </DialogHeader>
          {openId && <ThaiDocLayout docTypeId={openId} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์เอกสาร (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> ดาวน์โหลด PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issued documents list */}
      <Card className="card-soft overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">เอกสารที่ออกแล้ว</h3>
            <p className="text-xs text-muted-foreground">ทุกเอกสารเชื่อมโยงกับลูกค้า งาน หรือบิลที่เกี่ยวข้อง</p>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">ประเภท</th>
                <th className="text-left px-4 py-2.5">เลขที่</th>
                <th className="text-left px-4 py-2.5">วันที่</th>
                <th className="text-left px-4 py-2.5">คู่ค้า</th>
                <th className="text-right px-4 py-2.5">จำนวนเงิน</th>
                <th className="text-left px-4 py-2.5">สถานะ</th>
                <th className="text-right px-4 py-2.5 w-40">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{typeName(d.typeId)}</div>
                    <div className="text-xs text-muted-foreground">{typeEn(d.typeId)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link to={`/thai-documents/${d.typeId}`} className="text-primary hover:underline font-medium">{d.number}</Link>
                  </td>
                  <td className="px-4 py-2.5">{d.date}</td>
                  <td className="px-4 py-2.5">{d.customer}</td>
                  <td className="px-4 py-2.5 text-right">{fmtTHB(d.amount)}</td>
                  <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{d.status}</span></td>
                  <td className="px-4 py-2.5">
                    <RowActions
                      viewHref={`/thai-documents/${d.typeId}`}
                      onEdit={() => toast.info(`แก้ไข ${d.number} (เดโม)`)}
                      onPrint={() => { setPreviewDoc(d); }}
                      onPdf={() => toast.info(`ดาวน์โหลด PDF ${d.number}`)}
                      onDuplicate={() => duplicate(d)}
                      onSubmitApproval={() => toast.info("ส่งขออนุมัติแล้ว (เดโม)")}
                      onApprove={() => toast.success(`อนุมัติ ${d.number}`)}
                      onReject={() => toast.error(`ไม่อนุมัติ ${d.number}`)}
                      onAddToCalendar={() => toast.success("เพิ่มลงปฏิทินแล้ว")}
                      onViewLog={() => toast.info("ดูประวัติเอกสาร (เดโม)")}
                      onDelete={() => remove(d.id)}
                      deleteLabel={`${typeName(d.typeId)} ${d.number}`}
                    />
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="text-center text-sm text-muted-foreground py-8">ยังไม่มีเอกสาร</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {filtered.map((d) => (
            <div key={d.id} className="p-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/thai-documents/${d.typeId}`} className="text-primary font-medium">{d.number}</Link>
                <div className="text-xs text-muted-foreground truncate">{typeName(d.typeId)} · {d.customer}</div>
                <div className="text-xs">{d.date} · {fmtTHB(d.amount)}</div>
              </div>
              <RowActions
                viewHref={`/thai-documents/${d.typeId}`}
                onEdit={() => toast.info(`แก้ไข ${d.number}`)}
                onPrint={() => setPreviewDoc(d)}
                onPdf={() => toast.info(`PDF ${d.number}`)}
                onDuplicate={() => duplicate(d)}
                onApprove={() => toast.success(`อนุมัติ ${d.number}`)}
                onReject={() => toast.error(`ไม่อนุมัติ ${d.number}`)}
                onDelete={() => remove(d.id)}
                deleteLabel={d.number}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Preview dialog for issued doc */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc && `${typeName(previewDoc.typeId)} — ${previewDoc.number}`}</DialogTitle>
          </DialogHeader>
          {previewDoc && <ThaiDocLayout docTypeId={previewDoc.typeId} number={previewDoc.number} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.info("พิมพ์แล้ว (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
            <Button onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
