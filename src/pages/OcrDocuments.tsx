import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ocrDocuments, OCR_TYPES, type OcrDocument, type OcrDocType } from "@/lib/mockExtended";
import { fmtTHB } from "@/lib/mockData";
import { FileScan, ShieldAlert, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function OcrDocuments() {
  const [docs, setDocs] = useState<OcrDocument[]>(ocrDocuments);
  const [docType, setDocType] = useState<OcrDocType>("Supplier Bill");
  const [fileName, setFileName] = useState("");

  const upload = () => {
    if (!fileName) { toast.error("ระบุชื่อไฟล์"); return; }
    const newDoc: OcrDocument = {
      id: "ocr" + Math.random().toString(36).slice(2, 7),
      fileName, uploadedDate: new Date().toISOString().slice(0, 10), docType,
      extracted: { docNumber: "AUTO-" + Math.floor(Math.random() * 9000 + 1000), date: new Date().toISOString().slice(0, 10), companyName: "Mock Vendor Co.", amount: 12500, vat: 875, total: 13375 },
      status: "Pending Review",
    };
    setDocs([newDoc, ...docs]);
    toast.success("อัปโหลดและสกัดข้อมูลแล้ว (เดโม) — โปรดตรวจสอบก่อนบันทึก");
    setFileName("");
  };
  const review = (id: string, approved: boolean) => {
    setDocs(docs.map((d) => d.id === id ? { ...d, status: approved ? "Approved" : "Rejected", reviewer: "Khun Ploy" } : d));
    toast.success(approved ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว");
  };

  return (
    <>
      <PageHeader title="OCR Documents" thai="สแกนเอกสาร"
        description="อัปโหลดเอกสารและให้ระบบสกัดข้อมูลอัตโนมัติ ก่อนบันทึกต้องผ่านการตรวจสอบโดยมนุษย์ทุกครั้ง" />

      <Alert className="mb-4 border-warning/40 bg-warning-soft">
        <ShieldAlert className="h-4 w-4 text-warning-foreground" />
        <AlertTitle className="text-warning-foreground">Human-in-the-loop</AlertTitle>
        <AlertDescription className="text-warning-foreground/80">
          AI สกัดข้อมูลจากเอกสารเท่านั้น ระบบจะไม่บันทึกหรืออนุมัติเอกสารทางการเงินโดยอัตโนมัติ
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-5 mb-4">
        <div className="flex items-center gap-2 mb-3"><FileScan className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">อัปโหลดเอกสาร</h3></div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="grid gap-1.5"><Label>ชื่อไฟล์/พาธ</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="scan.pdf หรือ photo.jpg" /></div>
          <div className="grid gap-1.5"><Label>ประเภทเอกสาร</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as OcrDocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OCR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="flex items-end"><Button className="w-full" onClick={upload}>อัปโหลดและสกัด</Button></div>
        </div>
      </Card>

      <div className="grid gap-3">
        {docs.map((d) => (
          <Card key={d.id} className="card-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-medium">{d.fileName}</div>
                <div className="text-xs text-muted-foreground">{d.docType} • อัปโหลด {d.uploadedDate}</div>
              </div>
              <StatusBadge status={d.status} tone={d.status === "Approved" ? "success" : d.status === "Rejected" ? "danger" : "warning"} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-secondary/40 rounded-lg p-3">
              <div><div className="text-xs text-muted-foreground">เลขเอกสาร</div><div className="font-medium">{d.extracted.docNumber}</div></div>
              <div><div className="text-xs text-muted-foreground">วันที่</div><div className="font-medium">{d.extracted.date}</div></div>
              <div><div className="text-xs text-muted-foreground">บริษัท</div><div className="font-medium">{d.extracted.companyName}</div></div>
              <div><div className="text-xs text-muted-foreground">ยอด</div><div className="font-medium">{fmtTHB(d.extracted.amount)}</div></div>
              <div><div className="text-xs text-muted-foreground">VAT</div><div className="font-medium">{fmtTHB(d.extracted.vat)}</div></div>
              <div><div className="text-xs text-muted-foreground">รวม</div><div className="font-medium">{fmtTHB(d.extracted.total)}</div></div>
            </div>
            {d.status === "Pending Review" ? (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => review(d.id, true)}><Check className="w-4 h-4 mr-1" /> อนุมัติและบันทึก</Button>
                <Button size="sm" variant="outline" onClick={() => review(d.id, false)}><X className="w-4 h-4 mr-1" /> ปฏิเสธ</Button>
              </div>
            ) : <div className="text-xs text-muted-foreground mt-2">ตรวจสอบโดย {d.reviewer}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}
