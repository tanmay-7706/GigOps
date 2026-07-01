import { clsx } from "clsx";

interface QualityScoreProps {
  score: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score < 3.5) return "bg-gradient-to-br from-[#FB7185] to-[#EF4444] text-white";
  if (score <= 4.0) return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-white";
  return "bg-gradient-to-br from-[#34D399] to-[#10B981] text-white";
}

/** A small clay "orb" that reads the quality score with a colored, shadowed pill. */
export function QualityScore({ score, className }: QualityScoreProps) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-[3rem] items-center justify-center rounded-full px-3 py-1.5 font-heading text-sm font-extrabold tabular-nums shadow-clayButton",
        getScoreColor(score),
        className
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
