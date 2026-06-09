import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, ShieldAlert, Check, X } from "lucide-react";
import { aiEmails, type AiEmail } from "@/lib/mockExtended";
import { fmtTHB } from "@/lib/mockData";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AiEmailIntake() {
  const [list, setList] = useState<AiEmail[]>(aiEmails);
  const review = (id: string, approved: boolean) => {
    setList(list.map((e) => e.id === id ? { ...e, status: approved ? "Approved" : "Rejected" } : e));
    toast.success(approved ? "สร้างบิลซัพพลายเออร์และการแจ้งเตือนแล้ว (เดโม)" : "ปฏิเสธอีเมลแล้ว");
  };

  return (
    <>
      <PageHeader title="AI Email Intake" thai="AI อ่านอีเมล"
        description="AI อ่านอีเมลจากซัพพลายเออร์และดึงข้อมูลบิล แต่ต้องให้คนตรวจสอบและอนุมัติก่อนทุกครั้ง" />

      <Alert className="mb-4 border-warning/40 bg-warning-soft">
        <ShieldAlert className="h-4 w-4 text-warning-foreground" />
        <AlertTitle className="text-warning-foreground">ห้าม AI อนุมัติเอกสารทางการเงิน</AlertTitle>
        <AlertDescription className="text-warning-foreground/80">
          ระบบจะสร้างบิลเข้าระบบเฉพาะหลังจากผู้ใช้กดอนุมัติ
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        {list.map((e) => (
          <Card key={e.id} className="card-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent text-primary grid place-items-center"><Mail className="w-5 h-5" /></div>
                <div>
                  <Link to={`/ai-email/${e.id}`} className="font-medium text-primary hover:underline">{e.subject}</Link>
                  <div className="text-xs text-muted-foreground">จาก {e.from} • รับเมื่อ {e.receivedDate}</div>
                </div>
              </div>
              <StatusBadge status={e.status} tone={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "warning"} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-secondary/40 rounded-lg p-3">
              <div><div className="text-xs text-muted-foreground">ซัพพลายเออร์</div><div className="font-medium">{e.extracted.supplierName}</div></div>
              <div><div className="text-xs text-muted-foreground">เลขที่บิล</div><div className="font-medium">{e.extracted.billNumber}</div></div>
              <div><div className="text-xs text-muted-foreground">ครบกำหนด</div><div className="font-medium">{e.extracted.dueDate}</div></div>
              <div><div className="text-xs text-muted-foreground">ยอดเงิน</div><div className="font-medium">{fmtTHB(e.extracted.amount)}</div></div>
            </div>
            {e.status === "Pending Review" && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => review(e.id, true)}><Check className="w-4 h-4 mr-1" /> อนุมัติ — สร้างบิลและการแจ้งเตือน</Button>
                <Button size="sm" variant="outline" onClick={() => review(e.id, false)}><X className="w-4 h-4 mr-1" /> ปฏิเสธ</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
