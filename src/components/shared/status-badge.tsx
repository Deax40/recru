import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CALL_STATUS_LABELS, QUOTE_STATUS_LABELS,
  COMMISSION_STATUS_LABELS, PROSPECT_STATUS_LABELS,
  SUPPORT_STATUS_LABELS, PRIORITY_LABELS
} from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const callStatusColors: Record<string, string> = {
  TO_CALL: "bg-slate-100 text-slate-700 border-slate-200",
  CALLED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_ANSWER: "bg-gray-100 text-gray-600 border-gray-200",
  WRONG_NUMBER: "bg-red-50 text-red-700 border-red-200",
  TO_CALLBACK: "bg-amber-50 text-amber-700 border-amber-200",
  NOT_INTERESTED: "bg-red-50 text-red-600 border-red-200",
  INTERESTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEETING_SCHEDULED: "bg-violet-50 text-violet-700 border-violet-200",
  QUOTE_REQUESTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  QUOTE_IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  QUOTE_SENT: "bg-cyan-50 text-cyan-700 border-cyan-200",
  QUOTE_SIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  QUOTE_REFUSED: "bg-red-50 text-red-700 border-red-200",
  LOST_CLIENT: "bg-gray-100 text-gray-500 border-gray-200",
  FINALIZED_CLIENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const quoteStatusColors: Record<string, string> = {
  INFO_TO_COMPLETE: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PREPARATION: "bg-blue-50 text-blue-700 border-blue-200",
  SENT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  WAITING_RESPONSE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  FOLLOW_UP_NEEDED: "bg-orange-50 text-orange-700 border-orange-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SIGNED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DEPOSIT_RECEIVED: "bg-teal-50 text-teal-700 border-teal-200",
  PARTIALLY_PAID: "bg-lime-50 text-lime-700 border-lime-200",
  FULLY_PAID: "bg-green-100 text-green-800 border-green-200",
  REFUSED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  EXPIRED: "bg-red-50 text-red-600 border-red-200",
};

const commissionStatusColors: Record<string, string> = {
  ESTIMATION: "bg-slate-50 text-slate-600 border-slate-200",
  WAITING_SIGNATURE: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200",
  TO_VALIDATE: "bg-blue-50 text-blue-700 border-blue-200",
  VALIDATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PAYMENT_SCHEDULED: "bg-violet-50 text-violet-700 border-violet-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
};

const prospectStatusColors: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INTERESTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEETING_SCHEDULED: "bg-violet-50 text-violet-700 border-violet-200",
  QUOTE_SENT: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CLIENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  LOST: "bg-gray-100 text-gray-500 border-gray-200",
  ARCHIVED: "bg-gray-50 text-gray-400 border-gray-200",
};

const supportStatusColors: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING: "bg-orange-50 text-orange-600 border-orange-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-50 text-slate-600 border-slate-200",
  NORMAL: "bg-blue-50 text-blue-600 border-blue-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  type: "call" | "quote" | "commission" | "prospect" | "support" | "priority";
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let label = status;
  let colorClass = "";

  if (type === "call") {
    label = CALL_STATUS_LABELS[status] || status;
    colorClass = callStatusColors[status] || "";
  } else if (type === "quote") {
    label = QUOTE_STATUS_LABELS[status] || status;
    colorClass = quoteStatusColors[status] || "";
  } else if (type === "commission") {
    label = COMMISSION_STATUS_LABELS[status] || status;
    colorClass = commissionStatusColors[status] || "";
  } else if (type === "prospect") {
    label = PROSPECT_STATUS_LABELS[status] || status;
    colorClass = prospectStatusColors[status] || "";
  } else if (type === "support") {
    label = SUPPORT_STATUS_LABELS[status] || status;
    colorClass = supportStatusColors[status] || "";
  } else if (type === "priority") {
    label = PRIORITY_LABELS[status] || status;
    colorClass = priorityColors[status] || "";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
