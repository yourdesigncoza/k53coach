/**
 * Original SVG road-sign glyph library.
 *
 * Every glyph here is drawn from primitive shapes (polygons, circles, paths) —
 * NOT traced or copied from any manual, app, or PDF. This is the start of the
 * proprietary sign asset library described in overview §12.1.
 */
import type { SVGProps } from "react";

const RED = "#d6342c";
const BLUE = "#1f6fb2";
const DARK = "#1c2b2b";
const WHITE = "#ffffff";

type GlyphProps = SVGProps<SVGSVGElement>;

function frame(props: GlyphProps, children: React.ReactNode) {
  return (
    <svg viewBox="0 0 100 100" role="img" {...props}>
      {children}
    </svg>
  );
}

const Stop = (p: GlyphProps) =>
  frame(
    p,
    <>
      <polygon
        points="30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30"
        fill={RED}
        stroke={WHITE}
        strokeWidth="4"
      />
      <text
        x="50"
        y="59"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={WHITE}
        fontFamily="system-ui, sans-serif"
      >
        STOP
      </text>
    </>,
  );

const Yield = (p: GlyphProps) =>
  frame(
    p,
    <>
      <polygon
        points="50,92 6,12 94,12"
        fill={WHITE}
        stroke={RED}
        strokeWidth="10"
        strokeLinejoin="round"
      />
    </>,
  );

const NoEntry = (p: GlyphProps) =>
  frame(
    p,
    <>
      <circle cx="50" cy="50" r="44" fill={RED} />
      <rect x="22" y="42" width="56" height="16" rx="2" fill={WHITE} />
    </>,
  );

const Speed60 = (p: GlyphProps) =>
  frame(
    p,
    <>
      <circle cx="50" cy="50" r="44" fill={WHITE} stroke={RED} strokeWidth="10" />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontSize="40"
        fontWeight="700"
        fill={DARK}
        fontFamily="system-ui, sans-serif"
      >
        60
      </text>
    </>,
  );

const car = (x: number, fill: string) => (
  <g transform={`translate(${x},0)`}>
    <rect x="0" y="18" width="26" height="12" rx="3" fill={fill} />
    <rect x="4" y="10" width="16" height="10" rx="3" fill={fill} />
    <circle cx="6" cy="32" r="4" fill={fill} />
    <circle cx="20" cy="32" r="4" fill={fill} />
  </g>
);

const NoOvertaking = (p: GlyphProps) =>
  frame(
    p,
    <>
      <circle cx="50" cy="50" r="44" fill={WHITE} stroke={RED} strokeWidth="10" />
      <g transform="translate(50,32)">{car(0, DARK)}</g>
      <g transform="translate(24,32)">{car(0, RED)}</g>
    </>,
  );

const NoStopping = (p: GlyphProps) =>
  frame(
    p,
    <>
      <circle cx="50" cy="50" r="44" fill={BLUE} stroke={RED} strokeWidth="8" />
      <line x1="22" y1="22" x2="78" y2="78" stroke={RED} strokeWidth="8" />
      <line x1="78" y1="22" x2="22" y2="78" stroke={RED} strokeWidth="8" />
    </>,
  );

function warnFrame(p: GlyphProps, inner: React.ReactNode) {
  return frame(
    p,
    <>
      <polygon
        points="50,8 92,86 8,86"
        fill={WHITE}
        stroke={RED}
        strokeWidth="9"
        strokeLinejoin="round"
      />
      {inner}
    </>,
  );
}

const Pedestrian = (p: GlyphProps) =>
  warnFrame(
    p,
    <g fill={DARK}>
      <circle cx="50" cy="42" r="6" />
      <rect x="46" y="50" width="8" height="20" rx="3" />
      <rect x="38" y="54" width="24" height="6" rx="3" transform="rotate(-12 50 57)" />
      <rect x="44" y="66" width="6" height="14" rx="3" transform="rotate(12 47 73)" />
      <rect x="50" y="66" width="6" height="14" rx="3" transform="rotate(-12 53 73)" />
    </g>,
  );

const Signal = (p: GlyphProps) =>
  warnFrame(
    p,
    <>
      <rect x="42" y="34" width="16" height="42" rx="4" fill={DARK} />
      <circle cx="50" cy="42" r="4" fill={RED} />
      <circle cx="50" cy="55" r="4" fill="#e8b81e" />
      <circle cx="50" cy="68" r="4" fill="#2fae5e" />
    </>,
  );

const Crossroads = (p: GlyphProps) =>
  warnFrame(
    p,
    <g fill={DARK}>
      <rect x="46" y="36" width="8" height="44" rx="2" />
      <rect x="28" y="54" width="44" height="8" rx="2" />
    </g>,
  );

const OneWay = (p: GlyphProps) =>
  frame(
    p,
    <>
      <rect x="6" y="36" width="88" height="28" rx="6" fill={BLUE} />
      <path
        d="M24 50 H70 M58 38 L74 50 L58 62"
        fill="none"
        stroke={WHITE}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );

const GLYPHS: Record<string, (p: GlyphProps) => React.ReactNode> = {
  stop: Stop,
  yield: Yield,
  "no-entry": NoEntry,
  "speed-60": Speed60,
  "no-overtaking": NoOvertaking,
  "no-stopping": NoStopping,
  pedestrian: Pedestrian,
  signal: Signal,
  crossroads: Crossroads,
  "one-way": OneWay,
};

export function SignGlyph({
  glyph,
  className,
  ...rest
}: { glyph: string } & GlyphProps) {
  const Comp = GLYPHS[glyph];
  if (!Comp) {
    return (
      <svg viewBox="0 0 100 100" className={className} {...rest}>
        <rect x="6" y="6" width="88" height="88" rx="12" fill="#e5e7eb" />
      </svg>
    );
  }
  return <>{Comp({ className, ...rest })}</>;
}
