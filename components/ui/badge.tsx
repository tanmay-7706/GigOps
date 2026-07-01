import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all",
  {
    variants: {
      variant: {
        default: "bg-clay-accent/12 text-clay-accent",
        neutral: "bg-black/5 text-clay-muted dark:bg-white/10",
        critical: "bg-[#EF4444]/12 text-[#DC2626] dark:text-[#F87171]",
        warning: "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]",
        positive: "bg-[#10B981]/14 text-[#047857] dark:text-[#34D399]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
