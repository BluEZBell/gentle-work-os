import { StatusBadge } from "@/components/StatusBadge";

export type ApprovalStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected";

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const tone =
    status === "Approved" ? "success" :
    status === "Rejected" ? "danger" :
    status === "Pending Approval" ? "warning" : "muted";
  return <StatusBadge status={status} tone={tone as never} />;
}
