import { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Eye, Pencil, Printer, MoreHorizontal, Copy as CopyIcon, Trash2,
  Send, CheckCircle2, XCircle, History, CalendarPlus, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export interface RowActionsProps {
  /** Detail route, e.g. /customers/c1 — enables View */
  viewHref?: string;
  /** If true, shows Edit primary action */
  onEdit?: () => void;
  /** If document-related, shows Print primary action */
  onPrint?: () => void;
  onPdf?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSubmitApproval?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onAddToCalendar?: () => void;
  onViewLog?: () => void;
  /** Label shown in delete confirm. e.g. "ใบสำคัญจ่าย PV-001" */
  deleteLabel?: string;
  /** Optional warning (e.g. linked records) shown inside the delete confirmation */
  relatedWarning?: string;
  /** Extra custom items rendered at the top of the menu */
  extraMenu?: ReactNode;
}

export function RowActions(props: RowActionsProps) {
  const {
    viewHref, onEdit, onPrint, onPdf, onDuplicate, onDelete,
    onSubmitApproval, onApprove, onReject, onAddToCalendar, onViewLog,
    deleteLabel = "รายการนี้", relatedWarning, extraMenu,
  } = props;
  const isMobile = useIsMobile();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const callDuplicate = () => { onDuplicate?.(); toast.success("ทำสำเนาเรียบร้อย"); };

  const menuItems = (
    <>
      {extraMenu}
      {isMobile && viewHref && (
        <DropdownMenuItem asChild><Link to={viewHref}><Eye className="w-4 h-4 mr-2" /> ดูรายละเอียด</Link></DropdownMenuItem>
      )}
      {isMobile && onEdit && (
        <DropdownMenuItem onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> แก้ไข</DropdownMenuItem>
      )}
      {isMobile && onPrint && (
        <DropdownMenuItem onClick={onPrint}><Printer className="w-4 h-4 mr-2" /> พิมพ์</DropdownMenuItem>
      )}
      {isMobile && onPdf && (
        <DropdownMenuItem onClick={onPdf}><Download className="w-4 h-4 mr-2" /> ดาวน์โหลด PDF</DropdownMenuItem>
      )}
      {onDuplicate && (
        <DropdownMenuItem onClick={callDuplicate}><CopyIcon className="w-4 h-4 mr-2" /> ทำสำเนา</DropdownMenuItem>
      )}
      {onSubmitApproval && (
        <DropdownMenuItem onClick={onSubmitApproval}><Send className="w-4 h-4 mr-2" /> ส่งขออนุมัติ</DropdownMenuItem>
      )}
      {onApprove && (
        <DropdownMenuItem onClick={onApprove}><CheckCircle2 className="w-4 h-4 mr-2 text-success" /> อนุมัติ</DropdownMenuItem>
      )}
      {onReject && (
        <DropdownMenuItem onClick={onReject}><XCircle className="w-4 h-4 mr-2 text-destructive" /> ไม่อนุมัติ</DropdownMenuItem>
      )}
      {onAddToCalendar && (
        <DropdownMenuItem onClick={onAddToCalendar}><CalendarPlus className="w-4 h-4 mr-2" /> เพิ่มลงปฏิทิน</DropdownMenuItem>
      )}
      {onViewLog && (
        <DropdownMenuItem onClick={onViewLog}><History className="w-4 h-4 mr-2" /> ดูประวัติ</DropdownMenuItem>
      )}
      {onDelete && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> ลบ
          </DropdownMenuItem>
        </>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-end gap-0.5">
      {!isMobile && viewHref && (
        <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="ดู">
          <Link to={viewHref}><Eye className="w-4 h-4" /></Link>
        </Button>
      )}
      {!isMobile && onEdit && (
        <Button size="icon" variant="ghost" className="h-8 w-8" title="แก้ไข" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      {!isMobile && onPrint && (
        <Button size="icon" variant="ghost" className="h-8 w-8" title="พิมพ์" onClick={onPrint}>
          <Printer className="w-4 h-4" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะลบ <strong>{deleteLabel}</strong> การกระทำนี้ไม่สามารถย้อนกลับได้ (เดโม)
              {relatedWarning && (
                <span className="mt-2 block rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                  ⚠ {relatedWarning}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onDelete?.(); toast.success(`ลบ ${deleteLabel} แล้ว`); setConfirmDelete(false); }}
            >ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
