import { clsx } from "clsx";
import type { ProfessionalStatus } from "@/types";

interface StatusBadgeProps {
  status: ProfessionalStatus;
  className?: string;
}

const statusConfig: Record<ProfessionalStatus, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  flagged: {
    label: "Flagged",
    classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  "under-review": {
    label: "Under Review",
    classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  },
  deactivated: {
    label: "Deactivated",
    classes: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
