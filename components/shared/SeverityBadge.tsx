import { clsx } from "clsx";
import type { Severity } from "@/types";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityConfig: Record<Severity, { label: string; classes: string; dot: string }> = {
  CRITICAL: {
    label: "Critical",
    classes: "bg-[#EF4444]/12 text-[#DC2626] dark:text-[#F87171]",
    dot: "bg-[#EF4444]",
  },
  WARNING: {
    label: "Warning",
    classes: "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]",
    dot: "bg-[#F59E0B]",
  },
  POSITIVE: {
    label: "Positive",
    classes: "bg-[#10B981]/14 text-[#047857] dark:text-[#34D399]",
    dot: "bg-[#10B981]",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        config.classes,
        className
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
