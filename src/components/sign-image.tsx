import { SignGlyph } from "@/components/signs";
import { cn } from "@/lib/utils";

/**
 * Renders a road sign: the real (Public-Domain SADC) SVG asset when one has
 * been ingested, otherwise the original-redraw placeholder glyph. Real signs
 * carry meaningful colour, so they're shown as <img> (no recolouring) inside a
 * square contain box.
 */
export function SignImage({
  glyph,
  svgFile,
  name,
  className,
}: {
  glyph?: string;
  svgFile?: string | null;
  name: string;
  className?: string;
}) {
  if (svgFile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/${svgFile}`}
        alt={`${name} road sign`}
        className={cn("object-contain", className)}
      />
    );
  }
  return <SignGlyph glyph={glyph ?? ""} className={className} aria-label={name} />;
}
