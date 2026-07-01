import { cn } from "@/lib/utils";

/** Text with an animated moving gradient (ReactBits-style). */
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
        "bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent",
        "[background-size:200%_auto] animate-[gigops-gradient_5s_linear_infinite]",
        className
      )}
    >
      {children}
    </span>
  );
}
