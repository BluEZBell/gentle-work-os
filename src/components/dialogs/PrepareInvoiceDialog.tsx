// Placeholder dialog — explains the upcoming flow for issuing invoices from PO items.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Info } from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; poNumber?: string }

export function PrepareInvoiceDialog({ open, onOpenChange, poNumber }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />
            เตรียมออก Invoice {poNumber ? `จาก ${poNumber}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-secondary/40 p-4 text-sm flex gap-2">
          <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <div>
            ขั้นตอนถัดไปจะให้เลือก Item จาก PO เพื่อออก Invoice บางส่วนหรือเต็มจำนวน
            <div className="text-xs text-muted-foreground mt-2">ฟีเจอร์นี้จะเปิดในเฟสถัดไป — ตอนนี้ยังเป็นเดโม</div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>เข้าใจแล้ว</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
