"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

/** Glass-clay card that floats up on hover with a cursor-following spotlight. */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(124, 58, 237, 0.18)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        "group/spot relative overflow-hidden rounded-[28px] border border-white/50 bg-clay-card shadow-clayCard backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover dark:border-white/10",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--mx) var(--my), ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
