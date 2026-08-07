import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/icon";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LandingQuizDemo } from "@/components/landing/quiz-demo";
import { ReadinessRing, BAND_BADGE_CLASS } from "@/components/readiness-ring";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";
import {
  ENTITLEMENT_DAYS,
  ENTITLEMENT_PRICE_LABEL,
  SCHOOL_PRICE_LABEL,
} from "@/lib/pricing";

/* Topic taxonomy is content, not UI chrome — kept in English (see CLAUDE.md). */
const TOPICS = [
  { label: "Road Signs", icon: "i-sign", color: "var(--topic-signs)", pct: 72 },
  { label: "Rules of the Road", icon: "i-rules", color: "var(--topic-rules)", pct: 61 },
  { label: "Vehicle Controls", icon: "i-controls", color: "var(--topic-controls)", pct: 58 },
  { label: "Road Safety", icon: "i-safety", color: "var(--topic-safety)", pct: 65 },
] as const;

/**
 * Illustrative readiness examples for the "What Coach K tells you" row.
 *
 * The percentages are invented and MUST stay labelled as such by
 * `landing.exampleDisclaimer` — the progress page deliberately stopped showing
 * learners numbers they had not earned, and a landing page is not an exemption.
 * Band labels come from the shared `bands` namespace, never re-typed here.
 */
const EXAMPLES = [
  { band: "not-ready", percent: 38, bodyKey: "example1Body" },
  { band: "almost-ready", percent: 62, bodyKey: "example2Body" },
  { band: "test-ready", percent: 84, bodyKey: "example3Body" },
] as const;

/** FAQ entries are `faqQ{n}`/`faqA{n}`; bump this when copy adds one. */
const FAQ_COUNT = 5;

/** Semicircular readiness gauge (data-driven, gold gradient). */
function Gauge({ value }: { value: number }) {
  return (
    <div className="relative w-[150px] max-w-full">
      <svg viewBox="0 0 200 120" role="img" aria-label={`Readiness ${value} percent`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB24D" />
            <stop offset="1" stopColor="#FFC46B" />
          </linearGradient>
        </defs>
        <path d="M20,100 A80,80 0 0 1 180,100" pathLength={100} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={14} strokeLinecap="round" />
        <path d="M20,100 A80,80 0 0 1 180,100" pathLength={100} fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round" strokeDasharray={100} strokeDashoffset={100 - value} />
      </svg>
      <div className="absolute inset-x-0 top-[38%] text-center font-display">
        <b className="text-[2.25rem] leading-none font-bold text-ivory">
          {value}
          <sup className="top-[-1.1em] text-[0.9rem] font-semibold text-mist">%</sup>
        </b>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  // The coach teaser reuses two strings that already exist as keys elsewhere —
  // the readiness band label and the coach-card heading. Re-typing them here is
  // how the same sentence ends up translated in one place and English in another.
  const tBands = useTranslations("bands");
  const tQuiz = useTranslations("quiz");

  const features: { icon: IconName; title: string; body: string }[] = [
    { icon: "i-explain", title: t("feat1Title"), body: t("feat1Body") },
    { icon: "i-exam", title: t("feat2Title"), body: t("feat2Body") },
    { icon: "i-progress", title: t("feat3Title"), body: t("feat3Body") },
    { icon: "i-device", title: t("feat4Title"), body: t("feat4Body") },
  ];

  return (
    <div className="theme-dark min-h-dvh bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* ---- HERO ---- */}
        <section
          className="relative overflow-hidden bg-cover bg-[center_42%] bg-no-repeat"
          style={{
            marginTop: "-58px",
            paddingTop: "calc(64px + 58px)",
            paddingBottom: "48px",
            backgroundImage:
              "linear-gradient(180deg, rgba(18,16,22,.86) 0%, rgba(18,16,22,.32) 16%, rgba(18,16,22,.08) 46%, rgba(18,16,22,.55) 84%, var(--ink-850) 100%), linear-gradient(90deg, rgba(9,8,11,.94) 0%, rgba(11,10,14,.62) 42%, rgba(11,10,14,.18) 72%, rgba(11,10,14,.5) 100%), url('/img/hero-night-road.jpg')",
          }}
        >
          <div className="mx-auto grid w-[min(1180px,92vw)] items-center gap-12 md:grid-cols-[1.05fr_.95fr]">
            <div className="[text-shadow:0_2px_28px_rgba(0,0,0,.45)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-gold-300">
                <Icon name="i-spark" size="sm" /> {t("badge")}
              </span>
              <h1 className="mt-5 mb-4 text-[clamp(2rem,1.4rem+2.4vw,2.75rem)] leading-[1.12] font-bold tracking-tight">
                {t("titleLead")} {t("titleMid")}{" "}
                <span className="text-gold-400">{t("titleEmph")}</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-mist">{t("subtitle")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="h-12 rounded-[14px] px-5 text-base font-display font-semibold" render={<Link href="/readiness">{t("cta")}</Link>} />
                <Button variant="secondary" className="h-12 rounded-[14px] border border-ink-600 bg-transparent px-5 text-base font-display font-semibold text-ivory hover:border-gold-400" render={<a href="#how">{t("navHow")} →</a>} />
              </div>
              <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-dk">
                {[t("trust1"), t("trust2"), t("trust3")].map((tx) => (
                  <span key={tx} className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-success">✓</span> {tx}
                  </span>
                ))}
              </div>
            </div>

            {/* Readiness scene */}
            <div
              className="relative overflow-hidden rounded-[24px] border border-ink-700 p-6 shadow-[0_24px_60px_rgba(0,0,0,.4)]"
              style={{
                background:
                  "radial-gradient(120% 80% at 80% 10%, rgba(255,200,120,.20), transparent 55%), linear-gradient(180deg, #2a2433, #1c1822 60%, #14202a)",
              }}
            >
              <span className="absolute right-[16%] top-[18%] size-[38px] rounded-full" style={{ background: "radial-gradient(circle, #ffe6b0, #ffb24d)", boxShadow: "0 0 40px 10px rgba(255,178,77,.35)" }} />
              <div className="relative rounded-[18px] border border-ink-600 bg-[rgba(20,17,24,.72)] p-5 backdrop-blur">
                <div className="text-sm text-mist">{t("readinessLabel")}</div>
                <div className="mt-2 flex items-center gap-5">
                  <Gauge value={67} />
                  <div>
                    <div className="text-sm font-semibold text-gold-300">{t("readinessHint")}</div>
                    <div className="mt-1 text-xs text-mist">{t("readinessNote")}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TOPICS.map((tp) => (
                    <div key={tp.label} className="flex items-center gap-2.5 rounded-[14px] border border-ink-600 bg-[rgba(20,17,24,.72)] px-2.5 py-2.5">
                      <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] text-white" style={{ background: tp.color }}>
                        <Icon name={tp.icon} size="sm" />
                      </span>
                      <span className="text-[0.8rem] leading-tight text-sand">{tp.label}</span>
                      <span className="ml-auto font-display font-bold">{tp.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- MEET COACH K — the persona introduction ---- */}
        <section className="border-t border-ink-700 py-14 md:py-16">
          <div className="mx-auto grid w-[min(1180px,92vw)] items-center gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-12">
            <div className="mx-auto w-[200px] max-w-full md:mx-0 md:w-full">
              <Image
                src="/img/coach-k.png"
                alt={`${t("coachMeetName")} — ${t("coachMeetRole")}`}
                width={512}
                height={512}
                className="h-auto w-full drop-shadow-[0_18px_46px_rgba(0,0,0,.45)]"
              />
            </div>
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">
                {t("coachMeetKicker")}
              </p>
              <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight">
                {t("coachMeetIntro")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-mist">
                {t("coachMeetBody")}
              </p>
              <p className="mt-3 font-display text-base font-semibold text-gold-300">
                {t("coachMeetClose")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button
                  className="h-12 rounded-[14px] px-5 text-base font-display font-semibold"
                  render={<Link href="/readiness">{t("coachMeetCta")}</Link>}
                />
                <span className="text-sm text-mist">{t("coachMeetCtaSub")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- AI COACH SHOWCASE — the differentiator, spotlit on a warm beige band ---- */}
        <section
          id="coach"
          className="theme-light border-y border-[var(--surface-border)] bg-background py-16 md:py-20"
        >
          <div className="mx-auto grid w-[min(1180px,92vw)] items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            {/* Copy + CTAs */}
            <div className="max-w-xl">
              {/* Persona row — the artwork carries its own wordmark, so the
                  avatar crop is used here and the name is set in copy. */}
              <div className="mb-5 flex items-center gap-3.5">
                <Image
                  src="/img/coach-k-avatar.png"
                  alt=""
                  width={64}
                  height={64}
                  className="size-14 shrink-0 rounded-full ring-2 ring-gold-400/60 md:size-16"
                />
                <div>
                  <p className="font-display text-base font-semibold text-[var(--surface-ink)]">
                    {t("coachMeetName")}
                  </p>
                  <p className="text-xs text-[var(--surface-ink-2)]">
                    {t("coachMeetRole")}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-copper-500">
                {t("coachEyebrow")}
              </p>
              <h2 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--surface-ink)]">
                {t("coachTitle1")}{" "}
                <span className="text-copper-500">{t("coachTitle2")}</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--surface-ink-2)]">
                {t("coachBody")}
              </p>
              <ul className="mt-5 grid gap-2.5 text-sm text-[var(--surface-ink-2)]">
                {[
                  t("coachBullet1"),
                  t("coachBullet2"),
                  t("coachBullet3"),
                ].map((li) => (
                  <li key={li} className="flex gap-2">
                    <span className="font-bold text-copper-500">✓</span> {li}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="h-12 rounded-[14px] px-5 text-base font-display font-semibold"
                  render={
                    <Link href="/readiness/assessment-demo">
                      {t("coachCtaReport")}
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  className="h-12 rounded-[14px] border-[var(--surface-border-2)] bg-transparent px-5 text-base font-display font-semibold text-[var(--surface-ink)] hover:border-gold-400"
                  render={
                    <Link href="/readiness/lesson-demo">{t("coachCtaLesson")}</Link>
                  }
                />
              </div>
            </div>

            {/* Clickable white app-preview teaser → the full sample report */}
            <Link
              href="/readiness/assessment-demo"
              aria-label={t("coachTeaserAria")}
              className="group block rounded-[24px] border border-[var(--surface-border)] bg-surface p-5 shadow-[0_20px_50px_rgba(120,90,40,.15)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <ReadinessRing
                  percent={60}
                  band="almost-ready"
                  size={124}
                  stroke={11}
                  sublabel="readiness"
                />
                <div>
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
                      BAND_BADGE_CLASS["almost-ready"],
                    )}
                  >
                    {tBands("almost-ready")}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-[var(--surface-ink)]">
                    {t("coachTeaserHeadline")}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--surface-ink-2)]">
                    {t("coachTeaserSub")}
                  </p>
                </div>
              </div>

              {/* Coach snippet */}
              <div className="mt-4 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-3">
                <p className="flex items-center gap-1.5 font-display text-xs font-semibold text-copper-500">
                  <Icon name="i-spark" size="sm" /> {tQuiz("coach")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--surface-ink-2)]">
                  {t("coachTeaserSnippet")}
                </p>
              </div>

              {/* Sign mini + affordance */}
              <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-white p-1.5 shadow-sm">
                  <SignImage svgFile="signs/R1.svg" name="Stop" className="size-full" />
                </div>
                <span className="text-[var(--surface-ink-2)]">→</span>
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-white p-1.5 shadow-sm">
                  <SignImage svgFile="signs/R2.svg" name="Yield" className="size-full" />
                </div>
                <span className="ml-auto text-xs font-semibold text-copper-500 group-hover:underline">
                  {t("coachTeaserMore")}
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ---- WHAT COACH K TELLS YOU — three illustrative results ---- */}
        <section className="py-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("exampleKicker")}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight">{t("exampleTitle")}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {EXAMPLES.map((ex) => (
                <div key={ex.band} className="flex flex-col items-center gap-3 rounded-[18px] border border-ink-700 bg-card p-6 text-center">
                  <ReadinessRing percent={ex.percent} band={ex.band} size={112} stroke={10} sublabel="readiness" />
                  <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", BAND_BADGE_CLASS[ex.band])}>
                    {tBands(ex.band)}
                  </span>
                  <p className="text-sm leading-relaxed text-mist">{t(ex.bodyKey)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-dk">{t("exampleDisclaimer")}</p>
          </div>
        </section>

        {/* ---- CREDIBILITY STRIP (real facts, no fabricated counts) ---- */}
        <section className="border-y border-ink-700 bg-ink-900/40 py-10">
          <div className="mx-auto grid w-[min(1180px,92vw)] gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { icon: "i-check", title: t("cred1Title"), body: t("cred1Body") },
                { icon: "i-sign", title: t("cred2Title"), body: t("cred2Body") },
                { icon: "i-globe", title: t("cred3Title"), body: t("cred3Body") },
                { icon: "i-lock", title: t("cred4Title"), body: t("cred4Body") },
              ] as { icon: IconName; title: string; body: string }[]
            ).map((c) => (
              <div key={c.title} className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-gold-400/10 text-gold-400">
                  <Icon name={c.icon} size="sm" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-sm text-mist">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- FEATURES ---- */}
        <section id="how" className="py-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("whyKicker")}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight">
                {t("whyTitle")} <span className="text-gold-400">{t("whyTitleEmph")}</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3.5 rounded-[18px] border border-ink-700 bg-card p-5">
                  <span className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-gold-400/10 text-gold-400">
                    <Icon name={f.icon} />
                  </span>
                  <div>
                    <h3 className="font-display text-[1.0625rem] font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-mist">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- A · INTERACTIVE QUIZ DEMO (try it live) ---- */}
        <section id="demo" className="py-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("demoKicker")}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight">{t("demoTitle")}</h2>
              <p className="mt-2 text-sm text-mist">{t("demoSub")}</p>
            </div>
            <LandingQuizDemo />
            <div className="mt-6">
              <Button className="h-12 rounded-[14px] px-5 text-base font-display font-semibold" render={<Link href="/readiness">{t("demoCta")} →</Link>} />
            </div>
          </div>
        </section>

        {/* ---- PRICING ---- */}
        <section id="pricing" className="py-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("pricingKicker")}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight">
                {t("pricingHead")} <span className="text-gold-400">{t("pricingHeadEmph")}</span>
              </h2>
            </div>
            <div className="grid max-w-[820px] gap-5 sm:grid-cols-2">
              {/* Free */}
              <div className="rounded-[18px] border border-ink-700 bg-card p-6">
                <h3 className="font-display text-xl font-semibold">{t("freeName")}</h3>
                <div className="mt-1.5 font-display text-4xl font-bold">
                  R0 <span className="text-sm font-medium text-mist">{t("freePer")}</span>
                </div>
                <ul className="my-5 grid gap-2.5 text-[0.92rem] text-sand">
                  {[t("freeF1"), t("freeF2"), t("freeF3")].map((li) => (
                    <li key={li} className="flex gap-2"><span className="font-bold text-gold-400">✓</span> {li}</li>
                  ))}
                </ul>
                <Button variant="secondary" className="h-12 w-full rounded-[14px] border border-ink-600 bg-transparent font-display font-semibold text-ivory hover:border-gold-400" render={<Link href="/readiness">{t("freeCta")}</Link>} />
              </div>
              {/* Best value */}
              <div className="relative rounded-[18px] border-2 border-gold-400 bg-card p-6 shadow-[var(--glow-gold)]">
                <span className="absolute -top-3 right-5 rounded-full bg-gold-400 px-3 py-1 text-xs font-medium text-[#2A1C0B]">{t("bestFlag")}</span>
                <h3 className="font-display text-xl font-semibold">{t("planName")}</h3>
                <div className="mt-1.5 font-display text-4xl font-bold">
                  {ENTITLEMENT_PRICE_LABEL} <span className="text-sm font-medium text-mist">{t("planPer")}</span>
                </div>
                <ul className="my-5 grid gap-2.5 text-[0.92rem] text-sand">
                  {[t("planF1"), t("planF2"), t("planF3"), t("planF4"), t("planF5"), t("planF6")].map((li) => (
                    <li key={li} className="flex gap-2"><span className="font-bold text-gold-400">✓</span> {li}</li>
                  ))}
                </ul>
                <Button className="h-12 w-full rounded-[14px] font-display font-semibold" render={<Link href="/readiness">{t("planCta")}</Link>} />
              </div>
            </div>
            <p className="mt-5 max-w-[820px] text-sm text-mist">
              {t("pricingNoteLead")} <b className="text-ivory">{t("pricingNoteBold")}</b> {t("pricingNoteRest")} &nbsp;·&nbsp; <b className="text-ivory">{t("pricingSchoolsBold")}</b> {t("pricingSchoolsRest", { price: SCHOOL_PRICE_LABEL, days: ENTITLEMENT_DAYS })}
            </p>
          </div>
        </section>

        {/* ---- FOR PARENTS ---- */}
        <section id="parents" className="pb-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="flex flex-wrap items-center gap-6 rounded-[18px] border border-ink-700 bg-ink-750 p-6 shadow-[var(--shadow-md)]">
              <div className="min-w-[260px] flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("parentsKicker")}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{t("parentsTitle")}</h2>
                <p className="mt-2 text-sm text-mist">{t("parentsBody")}</p>
              </div>
              <Button className="h-12 rounded-[14px] px-5 font-display font-semibold" render={<Link href="/readiness"><Icon name="i-share" size="sm" /> {t("parentsCta")}</Link>} />
            </div>
          </div>
        </section>

        {/* ---- D · FAQ ---- */}
        <section id="faq" className="py-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-400">{t("faqKicker")}</p>
                <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight">{t("faqTitle")}</h2>
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: FAQ_COUNT }, (_, i) => i + 1).map((n) => (
                  <details key={n} className="group rounded-[14px] border border-ink-700 bg-card px-5 py-1 open:border-ink-600">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[0.95rem] font-semibold marker:hidden">
                      {t(`faqQ${n}`)}
                      <svg className="size-4 shrink-0 text-mist transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <p className="pr-8 pb-4 text-sm leading-relaxed text-mist">{t(`faqA${n}`, { price: ENTITLEMENT_PRICE_LABEL })}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- B · FINAL LOW-FRICTION CTA BAND ---- */}
        <section className="pb-16">
          <div className="mx-auto w-[min(1180px,92vw)]">
            <div
              className="relative overflow-hidden rounded-[24px] border border-gold-400/40 px-6 py-10 text-center shadow-[var(--glow-gold)]"
              style={{ background: "radial-gradient(120% 120% at 50% 0%, rgba(255,196,107,.14), transparent 60%), var(--ink-800)" }}
            >
              <h2 className="mx-auto max-w-2xl text-[1.6rem] font-semibold tracking-tight md:text-[2rem]">{t("ctaBandTitle")}</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-mist">{t("ctaBandSub")}</p>
              <Button className="mx-auto mt-6 h-12 rounded-[14px] px-6 text-base font-display font-semibold" render={<Link href="/readiness">{t("ctaBandBtn")} →</Link>} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
