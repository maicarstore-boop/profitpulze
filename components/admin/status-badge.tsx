import { Badge } from "@/components/ui/badge";

const VARIANT_BY_STATUS: Record<string, "success" | "danger" | "outline" | "primary" | "default"> = {
  active: "success",
  Filled: "success",
  Confirmed: "success",
  Resolved: "success",
  Success: "success",
  approved: "success",
  finished: "success",
  completed: "success",
  Open: "primary",
  Pending: "outline",
  pending: "outline",
  "Partially Filled": "outline",
  frozen: "outline",
  waiting: "outline",
  confirming: "outline",
  confirmed: "outline",
  sending: "outline",
  processing: "outline",
  Escalated: "danger",
  suspended: "danger",
  Cancelled: "danger",
  Rejected: "danger",
  rejected: "danger",
  Failed: "danger",
  failed: "danger",
  expired: "danger",
  refunded: "danger",
  Expired: "default",
  none: "default",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = VARIANT_BY_STATUS[status] ?? "default";
  return (
    <Badge variant={variant} className="capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
