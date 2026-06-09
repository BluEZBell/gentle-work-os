import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe, FileText, Briefcase, Truck, Receipt, Wrench, Paperclip, Info } from "lucide-react";
import { portalActivity } from "@/lib/mockExtended";

const features = [
  { icon: FileText, title: "Quotation Status", thai: "สถานะใบเสนอราคา" },
  { icon: Briefcase, title: "Customer PO", thai: "ใบสั่งซื้อจากลูกค้า" },
  { icon: Wrench, title: "Job Status", thai: "สถานะงาน" },
  { icon: Truck, title: "Delivery Status", thai: "สถานะการส่งมอบ" },
  { icon: Receipt, title: "Invoice Status", thai: "สถานะใบแจ้งหนี้" },
  { icon: Wrench, title: "Service / Calibration", thai: "ตารางสอบเทียบ/บริการ" },
  { icon: Paperclip, title: "Attached Documents", thai: "เอกสารแนบ" },
];

export default function CustomerPortal() {
  return (
    <>
      <PageHeader title="Customer Portal" thai="พอร์ทัลลูกค้า"
        description="พื้นที่ให้ลูกค้าดูสถานะงาน เอกสาร และตารางบริการของตัวเอง (เดโมเท่านั้น ยังไม่เปิดให้ภายนอกเข้าใช้)" />

      <Alert className="mb-4 border-info/40 bg-info-soft">
        <Info className="h-4 w-4 text-info" />
        <AlertTitle className="text-info">โหมดเดโม</AlertTitle>
        <AlertDescription className="text-info/90">
          นี่เป็นพรีวิวสิ่งที่ลูกค้าจะเห็นเมื่อเปิดใช้งานในเวอร์ชันโปรดักชัน ระบบจริงจะต้องมีระบบล็อกอินและสิทธิ์เฉพาะลูกค้าแต่ละราย
        </AlertDescription>
      </Alert>

      <Card className="card-soft p-5 mb-4">
        <div className="flex items-center gap-2 mb-3"><Globe className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">สิ่งที่ลูกค้าจะเห็น</h3></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div key={f.title} className="border rounded-lg p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent text-primary grid place-items-center"><f.icon className="w-4 h-4" /></div>
              <div><div className="font-medium text-sm">{f.title}</div><div className="text-xs text-muted-foreground">{f.thai}</div></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="card-soft p-5">
        <h3 className="font-display text-lg font-semibold mb-3">กิจกรรมลูกค้าในพอร์ทัล (จำลอง)</h3>
        <div className="space-y-2">
          {portalActivity.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between text-sm py-2 border-b last:border-0">
              <div><div className="font-medium">{p.customerName}</div>
                <div className="text-xs text-muted-foreground">{p.action} • {p.reference}</div></div>
              <StatusBadge status={p.date} tone="info" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
