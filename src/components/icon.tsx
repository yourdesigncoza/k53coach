import { cn } from "@/lib/utils";

/**
 * Crafted icon set — references the shared SVG sprite in
 * /public/styleguide/icons.svg (single source of truth, kept in sync with the
 * style guide + prototype). Glyphs inherit `currentColor`, so each context
 * recolours the same icon. Size via the `.gi`/`.gi-sm`/`.gi-lg` helpers
 * (globals.css) or a Tailwind size-* class.
 */
export type IconName =
  | "i-explain"
  | "i-exam"
  | "i-progress"
  | "i-device"
  | "i-spark"
  | "i-dashboard"
  | "i-practice"
  | "i-topics"
  | "i-mock"
  | "i-trophy"
  | "i-lock"
  | "i-bulb"
  | "i-sign"
  | "i-rules"
  | "i-controls"
  | "i-safety"
  | "i-face-sad"
  | "i-face-neutral"
  | "i-face-happy"
  | "i-share"
  | "i-bell"
  | "i-user"
  | "i-globe"
  | "i-check"
  | "i-x";

export function Icon({
  name,
  className,
  size = "md",
}: {
  name: IconName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <svg
      className={cn(
        "gi",
        size === "sm" && "gi-sm",
        size === "lg" && "gi-lg",
        className,
      )}
      aria-hidden="true"
    >
      <use href={`/styleguide/icons.svg#${name}`} />
    </svg>
  );
}
