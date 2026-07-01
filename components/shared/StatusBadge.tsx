import { clsx } from "clsx";
import type { ProfessionalStatus } from "@/types";

interface StatusBadgeProps {
  status: ProfessionalStatus;
  className?: string;
}

const statusConfig: Record<ProfessionalStatus, { label: string; classes: string }> = {
  active: { label: "Active", classes: "bg-[#10B981]/14 text-[#047857] dark:text-[#34D399]" },
  flagged: { label: "Flagged", classes: "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]" },
  "under-review": { label: "Under Review", classes: "bg-[#F97316]/14 text-[#C2410C] dark:text-[#FB923C]" },
  deactivated: { label: "Deactivated", classes: "bg-[#EF4444]/12 text-[#DC2626] dark:text-[#F87171]" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize tracking-wide",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
