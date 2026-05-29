import { Plus, UserPlus, Briefcase, FileText, Wrench, ListTodo, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function QuickActionsFab() {
  const nav = useNavigate();
  const go = (path: string) => () => nav(path);
  return (
    <div className="md:hidden fixed bottom-5 right-5 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={go("/customers")}><UserPlus className="w-4 h-4 mr-2" />Add Customer</DropdownMenuItem>
          <DropdownMenuItem onClick={go("/deals")}><Briefcase className="w-4 h-4 mr-2" />Add Deal</DropdownMenuItem>
          <DropdownMenuItem onClick={go("/quotations")}><FileText className="w-4 h-4 mr-2" />Add Quotation</DropdownMenuItem>
          <DropdownMenuItem onClick={go("/jobs")}><Wrench className="w-4 h-4 mr-2" />Add Job</DropdownMenuItem>
          <DropdownMenuItem onClick={go("/tasks")}><ListTodo className="w-4 h-4 mr-2" />Add Task</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={go("/calendar")}><Bell className="w-4 h-4 mr-2" />View Notifications</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
