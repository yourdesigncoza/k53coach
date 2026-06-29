import { cn } from "@/lib/utils";

/** K53 AI Coach wordmark + mark. Original mark: a rounded "road + check". */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        className="size-8 shrink-0"
        role="img"
        aria-label="K53 AI Coach"
      >
        <rect width="40" height="40" rx="12" fill="var(--primary)" />
        <path
          d="M11 28 L20 12 L29 28"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 24 h10"
          stroke="var(--primary-foreground)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
      </svg>
      {showWord && (
        <span className="text-lg font-semibold tracking-tight whitespace-nowrap">
          K53 <span className="text-primary">AI Coach</span>
        </span>
      )}
    </span>
  );
}
