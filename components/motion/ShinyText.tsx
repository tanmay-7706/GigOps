import { cn } from "@/lib/utils";

/** Muted text with a bright shine sweeping across it (ReactBits-style). */
export function ShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent",
        "[background-image:linear-gradient(110deg,#9ca3af_40%,#f9fafb_50%,#9ca3af_60%)]",
        "[background-size:200%_100%] animate-[gigops-shine_2.5s_linear_infinite]",
        className
      )}
    >
      {children}
    </span>
  );
}
