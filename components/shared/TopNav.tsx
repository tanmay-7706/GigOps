"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Activity, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feedback", label: "Feedback Queue" },
];

/** Reactively track the `.dark` class on <html> without effect-setState. */
function useTheme() {
  const dark = useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("gigops-theme", next ? "dark" : "light");
    } catch {}
  }
  return { dark, toggle };
}

export function TopNav() {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();

  return (
    <div className="sticky top-4 z-30 mx-auto w-full max-w-7xl px-4">
      <header className="flex h-16 items-center gap-4 rounded-[28px] border border-white/50 bg-clay-card px-4 shadow-clayCard backdrop-blur-xl dark:border-white/10 sm:h-[68px] sm:px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 pl-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-black tracking-tight text-clay-fg">GigOps</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-2xl px-3.5 py-2 text-sm font-bold transition-colors sm:px-4",
                  active ? "text-clay-accent" : "text-clay-muted hover:text-clay-fg"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-clay-accent/12"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-card text-clay-fg shadow-clayButton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-clayButtonHover active:scale-[0.94] active:shadow-clayPressed"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>
    </div>
  );
}
