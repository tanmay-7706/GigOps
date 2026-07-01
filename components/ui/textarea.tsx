import * as React from "react";
import { cn } from "@/lib/utils";

/** Recessed clay textarea — pressed into the surface, lifts to white on focus. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full rounded-2xl border-0 bg-input px-5 py-4 text-clay-fg shadow-clayPressed outline-none transition-all duration-200",
        "placeholder:text-clay-muted focus:bg-white focus:ring-4 focus:ring-clay-accent/20 dark:focus:bg-white/10",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
