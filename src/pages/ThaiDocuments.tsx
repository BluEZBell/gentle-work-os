import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { THAI_DOC_TYPES } from "@/lib/mockExtended";
import { Printer, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";

const sampleItems = [
  { name: "Precision Jig Type A", number: "PJ-A-12", qty: 50, unit: 7200, discount: 0 },
  { name: "Mounting Plate", number: "MP-44", qty: 50, unit: 2400, discount: 0 },
];

function ThaiDocPreview({ name, en }: { name: string; en: string }) {
  const sub = sampleItems.reduce((s, i) => s + (i.qty * i.unit - i.discount), 0);
  const vat = Math.round(sub * 0.07);
  const wht = en === "Payment Voucher" || en === "Invoice" ? Math.round(sub * 0.03) : 0;
  const total = sub + vat - wht;
  return (
    <div className="border rounded-md p-6 bg-white text-foreground space-y-4 text-sm max-h-[70vh] overflow-y-auto">
      <div className="flex justify-between items-start border-b pb-3">
        <div>
          <div className="font-display text-lg font-semibold">บริษัท พีโอนี เอ็มทีโอ จำกัด</div>
          <div className="text-xs text-muted-foreground">Peony MTO Co., Ltd. (สำนักงานใหญ่)</div>
          <div className="text-xs">123 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310</div>
          <div className="text-xs">เลขประจำตัวผู้เสียภาษี 0105563000000</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-base">{name}</div>
          <div className="text-xs text-muted-foreground">{en}</div>
          <div className="text-xs mt-2">เลขที่ DOC-2026-0001</div>
          <div className="text-xs">วันที่ 29/05/2026</div>
          <div className="text-xs">เครดิต 30 วัน</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-b pb-3">
        <div>
          <div className="text-xs text-muted-foreground">ลูกค้า / Customer</div>
          <div className="font-medium">บริษัท อนันต์ พรีซิชั่น จำกัด</div>
          <div className="text-xs">456 นิคมอุตสาหกรรมบางปะอิน อยุธยา 13160</div>
          <div className="text-xs">เลขผู้เสียภาษี 0105560000000 • สาขาสำนักงานใหญ่</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">ผู้ติดต่อ</div>
          <div className="font-medium">คุณอนันต์</div>
          <div className="text-xs">02-555-1234 • anan@example.com</div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs text-muted-foreground">
          <th className="py-1">รายการ / Part Name</th><th className="py-1">Part No.</th>
          <th className="py-1 text-right">จำนวน</th><th className="py-1 text-right">ราคา/หน่วย</th>
          <th className="py-1 text-right">ส่วนลด</th><th className="py-1 text-right">รวม</th>
        </tr></thead>
        <tbody>
          {sampleItems.map((it, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1.5">{it.name}</td>
              <td className="py-1.5">{it.number}</td>
              <td className="py-1.5 text-right">{it.qty}</td>
              <td className="py-1.5 text-right">{it.unit.toLocaleString()}</td>
              <td className="py-1.5 text-right">{it.discount.toLocaleString()}</td>
              <td className="py-1.5 text-right">{(it.qty * it.unit - it.discount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>รวมเงิน</span><span>{sub.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>{vat.toLocaleString()}</span></div>
          {wht > 0 && <div className="flex justify-between text-destructive"><span>หัก ณ ที่จ่าย 3%</span><span>−{wht.toLocaleString()}</span></div>}
          <div className="flex justify-between font-semibold border-t pt-1"><span>ยอดสุทธิ (THB)</span><span>{total.toLocaleString()}</span></div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground border-t pt-3">
        วิธีการชำระเงิน: โอนเข้าบัญชี ธ.กรุงเทพ เลขที่ 123-4-56789-0 ชื่อบัญชี บริษัท พีโอนี เอ็มทีโอ จำกัด
      </div>
      <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
        <div className="border-t pt-1">ผู้จัดทำ</div>
        <div className="border-t pt-1">ผู้ตรวจสอบ</div>
        <div className="border-t pt-1">ผู้อนุมัติ</div>
      </div>
      <div className="text-[10px] text-muted-foreground text-center">เอกสารตัวอย่างสำหรับเดโม Peony Business OS</div>
    </div>
  );
}

export default function ThaiDocuments() {
  const [openId, setOpenId] = useState<string | null>(null);
  const current = THAI_DOC_TYPES.find((d) => d.id === openId);

  return (
    <>
      <PageHeader title="Thai Documents" thai="เอกสารภาษาไทย"
        description="เทมเพลตเอกสารภายในตามมาตรฐานไทย พร้อมพรีวิวก่อนพิมพ์และส่งออก PDF (เดโม)" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {THAI_DOC_TYPES.map((d) => (
          <Card key={d.id} className="card-soft p-5 flex flex-col gap-3">
            <Link to={`/thai-documents/${d.id}`} className="flex items-start gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-accent text-primary grid place-items-center"><FileText className="w-5 h-5" /></div>
              <div>
                <div className="font-medium group-hover:underline">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.en}</div>
              </div>
            </Link>
            <div className="flex gap-2 mt-auto">
              <Dialog open={openId === d.id} onOpenChange={(o) => setOpenId(o ? d.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1"><Printer className="w-3.5 h-3.5 mr-1" /> พรีวิว</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>{d.name} — {d.en}</DialogTitle></DialogHeader>
                  {current && <ThaiDocPreview name={current.name} en={current.en} />}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => toast.info("พิมพ์เอกสาร (เดโม)")}><Printer className="w-4 h-4 mr-1" /> พิมพ์</Button>
                    <Button onClick={() => toast.info("ดาวน์โหลด PDF (เดโม)")}><FileDown className="w-4 h-4 mr-1" /> ดาวน์โหลด PDF</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button asChild size="sm" variant="ghost"><Link to={`/thai-documents/${d.id}`}>เปิด</Link></Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
