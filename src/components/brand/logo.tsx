import { cn } from "@/lib/utils";

/**
 * K53 Coach wordmark + mark. The approved prototype mark is a rounded gold
 * gradient tile with a dark "K"; the wordmark uses `currentColor` so it reads
 * ivory on the dark marketing chrome and ink on the white app chrome.
 */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-bold whitespace-nowrap",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[0.95rem] font-extrabold text-[#2a1c0b] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
        style={{
          background:
            "linear-gradient(145deg, var(--gold-400), var(--copper-500))",
        }}
      >
        K
      </span>
      {showWord && (
        <span className="text-lg tracking-tight">K53 Coach</span>
      )}
    </span>
  );
}
