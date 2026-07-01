import { cn } from "@/lib/utils";

/** Heading text with an animated candy gradient (clay accents). */
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#DB2777] bg-clip-text font-heading text-transparent",
        "[background-size:200%_auto] animate-[gigops-gradient_5s_linear_infinite]",
        className
      )}
    >
      {children}
    </span>
  );
}
