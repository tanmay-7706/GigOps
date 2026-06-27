import { clsx } from "clsx";

interface QualityScoreProps {
  score: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score < 3.5) {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (score <= 4.0) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
}

export function QualityScore({ score, className }: QualityScoreProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold tabular-nums",
        getScoreColor(score),
        className
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
