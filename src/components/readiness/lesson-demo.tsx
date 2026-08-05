import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Icon } from "@/components/icon";
import { CtaBand } from "@/components/readiness/cta-band";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";

/**
 * DEMO / enticement only — a single self-contained SAMPLE lesson ("Road Signs:
 * Shapes & Colours") reached from the assessment demo's "Start … lesson" CTA.
 * It shows what an in-app Learn lesson looks like, framed as marketing: the
 * DARK storefront theme with the lesson as a WHITE app-preview panel (same
 * pattern as the assessment demo — fixed --surface-* tokens inside the panel).
 *
 * Content is grounded in the K53 wiki (SARTSM colour code + regulatory signs +
 * Stop/Yield). Signs are the real PD SADC artwork the app serves.
 *
 * TRANSLATION LINE — the page chrome and framing are translated (`lessonDemo`);
 * what a sign MEANS is not. The SHAPES/COLOURS `means` fields, the Stop-vs-Yield
 * card bodies and the exam-phrasing examples stay English, because the library
 * this page is previewing is still English (the bilingual content pass is
 * deferred — see CLAUDE.md). Translating them would advertise an Afrikaans
 * product that does not exist yet. An Afrikaans reader gets Afrikaans headings
 * over English sign definitions, which is exactly what they get after paying.
 */

const INK = "text-[var(--surface-ink)]";
const INK2 = "text-[var(--surface-ink-2)]";
const CARD = "rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-4";

/** Shape → meaning, each with a real sign. */
const SHAPES: {
  code: string;
  name: string;
  shape: string;
  means: string;
}[] = [
  {
    code: "R1",
    name: "Stop",
    shape: "Octagon",
    means: "The only octagon in the system. A full stop, every time — even on an empty road.",
  },
  {
    code: "R2",
    name: "Yield",
    shape: "Inverted triangle",
    means: "Slow down and give way. You only stop if the way isn't clear.",
  },
  {
    code: "W308",
    name: "Children ahead",
    shape: "Triangle, red border",
    means: "A warning. Something ahead to prepare for — it doesn't order you to act.",
  },
  {
    code: "R3",
    name: "No entry",
    shape: "Circle, red border",
    means: "A prohibition. The red ring means “you must NOT”.",
  },
  {
    code: "R103",
    name: "Keep left",
    shape: "Circle, solid blue",
    means: "A command. Solid blue means “you MUST”.",
  },
];

/** SARTSM colour code — swatch + what it means. */
const COLOURS: { hex: string; label: string; means: string; border?: boolean }[] =
  [
    {
      hex: "#e5484d",
      label: "Red",
      means: "Stop, danger, or prohibition. A red ring or border always means “you must not”.",
    },
    {
      hex: "#1e5bd6",
      label: "Blue",
      means: "A command — “you must”. (Also the highest-class A1 freeway direction signs.)",
    },
    {
      hex: "#2e7d46",
      label: "Green",
      means: "Freeway and rural direction signs — not blue, which is a common trap.",
    },
    { hex: "#8a5a2b", label: "Brown", means: "Tourism and places of interest." },
    {
      hex: "#ffffff",
      label: "White background",
      means: "A permanent sign.",
      border: true,
    },
    {
      hex: "#f5c518",
      label: "Yellow background",
      means: "A temporary sign — roadworks.",
    },
  ];

/** Section eyebrow inside the white panel. */
function PanelHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold-400 text-xs font-semibold text-[#2A1C0B]">
        {n}
      </span>
      <h2 className={cn("font-display text-base font-semibold", INK)}>{title}</h2>
    </div>
  );
}

/** White-boxed sign — signs always sit on white. */
function SignBox({ code, name }: { code: string; name: string }) {
  return (
    <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-white p-2.5 shadow-sm">
      <SignImage svgFile={`signs/${code}.svg`} name={name} className="size-full" />
    </div>
  );
}

export function LessonDemo() {
  const t = useTranslations("lessonDemo");
  return (
    <div className="theme-dark min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-14 md:pt-20">
        {/* ---- Hero ---- */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-gold-300">
            <Icon name="i-spark" size="sm" /> {t("eyebrow")}
          </span>
          <h1 className="mx-auto mt-5 max-w-xl font-display text-[clamp(1.9rem,1.4rem+2vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
            {t("title1")} <span className="text-gold-400">{t("title2")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-mist">
            {t("intro")}
          </p>
          <p className="mx-auto mt-3 text-xs text-muted-dk">{t("readTime")}</p>
        </div>

        {/* ---- White app-preview panel ---- */}
        <div className="mt-7 flex flex-col gap-8 rounded-[24px] border border-ink-700 bg-surface p-4 shadow-[0_24px_60px_rgba(0,0,0,.45)] md:p-6">
          {/* 1 · Read the shape */}
          <section>
            <PanelHead n={1} title={t("s1")} />
            <p className={cn("mt-2 text-sm", INK2)}>
              {t("s1body")}
            </p>
            <ul className="mt-4 flex flex-col">
              {SHAPES.map((s) => (
                <li
                  key={s.code}
                  className="flex items-center gap-4 border-t border-[var(--surface-border)] py-4 first:border-t-0 first:pt-0"
                >
                  <SignBox code={s.code} name={s.name} />
                  <div>
                    <p className={cn("text-sm font-semibold", INK)}>
                      {s.shape}
                      <span className={cn("font-normal", INK2)}> · {s.name}</span>
                    </p>
                    <p className={cn("mt-0.5 text-sm", INK2)}>{s.means}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 2 · Read the colour */}
          <section>
            <PanelHead n={2} title={t("s2")} />
            <p className={cn("mt-2 text-sm", INK2)}>
              {t("s2body")}
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {COLOURS.map((c) => (
                <div key={c.label} className={cn(CARD, "flex items-start gap-3")}>
                  <span
                    className={cn(
                      "mt-0.5 size-5 shrink-0 rounded-md",
                      c.border && "ring-1 ring-[var(--surface-border-2)]",
                    )}
                    style={{ background: c.hex }}
                  />
                  <div>
                    <p className={cn("text-sm font-semibold", INK)}>{c.label}</p>
                    <p className={cn("mt-0.5 text-sm", INK2)}>{c.means}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Misconception callout (from SARTSM) */}
            <div className="mt-3 flex items-start gap-2.5 rounded-[12px] border-l-4 border-gold-400 bg-gold-400/[0.07] py-3 pl-3 pr-4">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-copper-500" />
              <p className={cn("text-sm", INK2)}>
                <span className={cn("font-semibold", INK)}>{t("trapLabel")}</span>
                {t("trapBody")}
              </p>
            </div>
          </section>

          {/* 3 · The two everyone confuses */}
          <section>
            <PanelHead n={3} title={t("s3")} />
            <p className={cn("mt-2 text-sm", INK2)}>
              {t("s3body")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={cn(CARD, "flex flex-col items-center text-center")}>
                <SignBox code="R1" name="Stop" />
                <p className={cn("mt-2 text-sm font-semibold", INK)}>Stop</p>
                <p className={cn("mt-1 text-sm", INK2)}>
                  Come to a <b>complete stop</b> at the line, every time. Then go
                  only when it&apos;s clear.
                </p>
              </div>
              <div className={cn(CARD, "flex flex-col items-center text-center")}>
                <SignBox code="R2" name="Yield" />
                <p className={cn("mt-2 text-sm font-semibold", INK)}>Yield</p>
                <p className={cn("mt-1 text-sm", INK2)}>
                  <b>Slow down</b> and give way. You only stop if traffic or
                  pedestrians are there.
                </p>
              </div>
            </div>
          </section>

          {/* 4 · You'll be asked */}
          <section>
            <PanelHead n={4} title={t("s4")} />
            <ul className={cn("mt-3 flex flex-col gap-2 text-sm", INK2)}>
              {[
                "“What does this sign mean?” — recognise the meaning from shape + colour.",
                "“What must you do when you see this sign?” — the required response.",
                "The trap answer: treating a Yield like a Stop, or reading a blue “must” as a red “must not”.",
              ].map((q) => (
                <li key={q} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-400" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ---- CTA band ---- */}
        <CtaBand
          className="mt-8"
          title={t("ctaTitle")}
          subtitle={t("ctaSub")}
          action={{ label: t("ctaBtn"), href: "/paywall" }}
        />

        {/* ---- Back to sample report ---- */}
        <div className="mt-6 text-center">
          <Link
            href="/readiness/assessment-demo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-ivory"
          >
            <ArrowLeft className="size-4" /> {t("back")}
          </Link>
        </div>
      </main>
    </div>
  );
}
