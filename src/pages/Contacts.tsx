import { useState } from "react";
import { PageHeader } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { contacts, findCustomer, type Contact } from "@/lib/mockData";
import { useTick, removeContact, duplicateContact, updateContact } from "@/lib/store";
import { Search, Eye, Pencil, Plus, Phone, Mail, MessageCircle, StickyNote, CalendarPlus, Activity, Star, Receipt, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy as CopyIcon, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContactDialog } from "@/components/dialogs/ContactDialog";
import { ContactDetailSheet } from "@/components/dialogs/ContactDetailSheet";
import { AddNoteDialog } from "@/components/dialogs/AddNoteDialog";
import { AddActivityDialog } from "@/components/dialogs/AddActivityDialog";
import { AddToCalendarDialog } from "@/components/dialogs/AddToCalendarDialog";
import { toast } from "sonner";

export default function Contacts() {
  useTick();
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<Contact | undefined>();
  const [detailId, setDetailId] = useState<string | undefined>();
  const [noteFor, setNoteFor] = useState<Contact | undefined>();
  const [activityFor, setActivityFor] = useState<Contact | undefined>();
  const [calFor, setCalFor] = useState<Contact | undefined>();
  const [delTarget, setDelTarget] = useState<Contact | undefined>();

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase()) ||
    (findCustomer(c.customerId)?.name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const setRoleFlag = (c: Contact, field: "isMain" | "isBilling" | "isDelivery") => {
    // For Main: enforce single main per customer
    if (field === "isMain") {
      contacts.filter((x) => x.customerId === c.customerId).forEach((x) => {
        if (x.id !== c.id && x.isMain) updateContact(x.id, { isMain: false }, "Khun Ploy");
      });
    }
    updateContact(c.id, { [field]: true }, "Khun Ploy");
    toast.success(field === "isMain" ? "ตั้งเป็นผู้ติดต่อหลักแล้ว" : field === "isBilling" ? "ตั้งเป็นผู้ติดต่อบัญชีแล้ว" : "ตั้งเป็นผู้รับสินค้าแล้ว");
  };

  return (
    <>
      <PageHeader title="Contacts" thai="ผู้ติดต่อ"
        description="รายชื่อผู้ติดต่อในฝั่งลูกค้า เชื่อมโยงกับบริษัทแต่ละราย — คลิก 👁 เพื่อดูรายละเอียด หรือ ✎ เพื่อแก้ไข"
        actions={<Button onClick={() => { setEditing(undefined); setOpenAdd(true); }}><Plus className="w-4 h-4 mr-1" /> Add contact</Button>}
      />
      <Card className="card-soft p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาผู้ติดต่อ…" className="pl-9" />
        </div>
      </Card>

      <Card className="card-soft overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="ยังไม่มีผู้ติดต่อ" hint="เพิ่มผู้ติดต่อรายแรกของลูกค้านี้" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role / Department</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type / Badges</TableHead>
                <TableHead className="text-right w-40">การกระทำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const cust = findCustomer(c.customerId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}
                      {c.notes && <div className="text-xs text-muted-foreground truncate max-w-[220px]">📝 {c.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.role}</div>
                      <div className="text-xs text-muted-foreground">{c.department}</div>
                    </TableCell>
                    <TableCell>
                      {cust && <Link to={`/customers/${cust.id}`} className="text-primary hover:underline text-sm">{cust.name}</Link>}
                    </TableCell>
                    <TableCell className="text-xs space-y-0.5">
                      {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                      {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>}
                      {c.lineId && <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{c.lineId}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.contactType && <Badge variant="outline" className="text-[10px]">{c.contactType}</Badge>}
                        {c.isMain && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30">Main</Badge>}
                        {c.isBilling && <Badge variant="secondary" className="text-[10px]">Billing</Badge>}
                        {c.isDelivery && <Badge variant="secondary" className="text-[10px]">Delivery</Badge>}
                        {c.isPoApprover && <Badge variant="secondary" className="text-[10px]">PO Approver</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="ดูรายละเอียด"
                          onClick={() => setDetailId(c.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="แก้ไข"
                          onClick={() => { setEditing(c); setOpenAdd(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setNoteFor(c)}><StickyNote className="w-4 h-4 mr-2" /> เพิ่ม Note</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActivityFor(c)}><Activity className="w-4 h-4 mr-2" /> เพิ่มกิจกรรม</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCalFor(c)}><CalendarPlus className="w-4 h-4 mr-2" /> เพิ่มลงปฏิทิน</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRoleFlag(c, "isMain")}><Star className="w-4 h-4 mr-2" /> ตั้งเป็น Main Contact</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRoleFlag(c, "isBilling")}><Receipt className="w-4 h-4 mr-2" /> ตั้งเป็น Billing Contact</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRoleFlag(c, "isDelivery")}><Truck className="w-4 h-4 mr-2" /> ตั้งเป็น Delivery Contact</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { duplicateContact(c.id, "Khun Ploy"); toast.success("ทำสำเนาแล้ว"); }}>
                              <CopyIcon className="w-4 h-4 mr-2" /> ทำสำเนา
                            </DropdownMenuItem>
                            {cust && <DropdownMenuItem asChild><Link to={`/customers/${cust.id}`}><Eye className="w-4 h-4 mr-2" /> เปิดโปรไฟล์ลูกค้า</Link></DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDelTarget(c)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ContactDialog open={openAdd} onOpenChange={(v) => { setOpenAdd(v); if (!v) setEditing(undefined); }} contact={editing} />
      <ContactDetailSheet open={!!detailId} onOpenChange={(v) => !v && setDetailId(undefined)} contactId={detailId} />
      <AddNoteDialog open={!!noteFor} onOpenChange={(v) => !v && setNoteFor(undefined)}
        target={noteFor ? { kind: "contact", id: noteFor.id, label: noteFor.name } : { kind: "contact", id: "" }} />
      <AddActivityDialog open={!!activityFor} onOpenChange={(v) => !v && setActivityFor(undefined)}
        defaultCustomerId={activityFor?.customerId} defaultContactId={activityFor?.id} />
      <AddToCalendarDialog open={!!calFor} onOpenChange={(v) => !v && setCalFor(undefined)}
        defaultCustomerId={calFor?.customerId} />

      <AlertDialog open={!!delTarget} onOpenChange={(v) => !v && setDelTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription>คุณกำลังจะลบผู้ติดต่อ <strong>{delTarget?.name}</strong> — การกระทำนี้ไม่สามารถย้อนกลับได้ (เดโม)</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delTarget) { removeContact(delTarget.id, "Khun Ploy"); toast.success(`ลบ ${delTarget.name} แล้ว`); } setDelTarget(undefined); }}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
