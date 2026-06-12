// Reusable Add Note dialog for customer or contact.
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addCustomerNote, addContactNote,
  CUSTOMER_NOTE_TYPES, CONTACT_NOTE_TYPES,
  type CustomerNoteType, type ContactNoteType,
} from "@/lib/notesStore";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: { kind: "customer"; id: string; label?: string } | { kind: "contact"; id: string; label?: string };
}

export function AddNoteDialog({ open, onOpenChange, target }: Props) {
  const types = target.kind === "customer" ? CUSTOMER_NOTE_TYPES : CONTACT_NOTE_TYPES;
  const [type, setType] = useState<string>(types[0]);
  const [body, setBody] = useState("");

  useEffect(() => { if (open) { setType(types[0]); setBody(""); } }, [open, target.kind]);

  const submit = () => {
    if (!body.trim()) { toast.error("กรุณาใส่เนื้อหา Note"); return; }
    if (target.kind === "customer") addCustomerNote(target.id, type as CustomerNoteType, body.trim(), "Khun Ploy");
    else addContactNote(target.id, type as ContactNoteType, body.trim(), "Khun Ploy");
    toast.success("บันทึก Note แล้ว");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>เพิ่ม Note {target.label ? `— ${target.label}` : ""}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>ประเภท Note</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5"><Label>เนื้อหา</Label>
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="เช่น ลูกค้าชอบให้ติดต่อผ่าน Line…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={submit}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
