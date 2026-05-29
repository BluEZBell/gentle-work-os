import { Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ImportExportButtons({ entity }: { entity: string }) {
  const demo = (action: string) =>
    toast.warning(`${action} — this is a mock action in demo mode.`);
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => demo("Imported from Excel")}>
        <Upload className="w-4 h-4 mr-1.5" />Import
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1.5" />Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => demo(`Exported ${entity} to Excel`)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Export to Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => demo(`Exported ${entity} to PDF`)}>
            <FileText className="w-4 h-4 mr-2" />Export to PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
