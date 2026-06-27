import Link from "next/link";
import {
  Brain,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Top bar */}
      <header className="pt-safe mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Logo />
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/auth">Log in</Link>}
        />
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-5 pt-6 text-center md:pt-16">
        <Badge variant="secondary" className="mx-auto">
          <Sparkles className="size-3" /> AI-coached, not just quizzes
        </Badge>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight md:text-5xl">
          Pass your K53 learner&apos;s{" "}
          <span className="text-muted-foreground">the first time.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
          Take the free readiness test, see exactly where you stand, and let your
          AI coach explain every mistake until you&apos;re test-ready.
        </p>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <Button
            className="h-13 w-full rounded-xl text-base"
            render={<Link href="/readiness">Take the free readiness test</Link>}
          />
          <p className="text-xs text-muted-foreground">
            No download. No sign-up needed to try. Takes about 5 minutes.
          </p>
        </div>
      </section>

      {/* How it works (pamphlet → scan → test → parent unlock) */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-20">
        <h2 className="text-center text-lg font-semibold md:text-2xl">
          How it works
        </h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3 md:gap-5">
          {[
            {
              icon: ScanLine,
              title: "Scan & test free",
              body: "Scan the QR code or tap the button and take a quick readiness test — anonymously.",
            },
            {
              icon: TrendingUp,
              title: "See your readiness score",
              body: "Get a clear score per topic: road signs, rules, and vehicle controls.",
            },
            {
              icon: Brain,
              title: "Learn with your AI coach",
              body: "Unlock 90 days of full practice and AI explanations that target your weak areas.",
            },
          ].map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-3 py-5 md:gap-4 md:py-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">
                      {i + 1}. {title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-md px-5 pb-4">
        <h2 className="text-center text-lg font-semibold md:text-2xl">
          Simple, once-off pricing
        </h2>
        <Card className="mt-4 ring-2 ring-foreground">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Full access</p>
            <p className="mt-1 text-4xl font-bold">
              R179
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 90 days
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything unlocked for the full prep window. Then just{" "}
              <span className="font-medium text-foreground">R20/month</span> if
              you want to keep the AI Coach — cancel anytime.
            </p>
            <Button
              className="mt-5 h-12 w-full rounded-xl text-base"
              render={<Link href="/readiness">Start free, unlock later</Link>}
            />
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Schools: R99 per learner / 90 days.{" "}
          <Link href="/auth" className="underline">
            Talk to us
          </Link>
        </p>
      </section>

      {/* Trust */}
      <section className="mx-auto grid max-w-2xl grid-cols-1 gap-3 px-5 py-12 sm:grid-cols-2 md:py-16">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <Users className="size-5 text-foreground" />
            <p className="text-sm font-medium">Parent-friendly</p>
            <p className="text-xs text-muted-foreground">
              A readiness score parents actually understand.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <ShieldCheck className="size-5 text-foreground" />
            <p className="text-sm font-medium">Privacy-first</p>
            <p className="text-xs text-muted-foreground">
              Try anonymously. No biometrics, ever.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 K53 AI Coach</p>
        <p className="mt-1">
          <Link href="/legal/privacy" className="underline">
            Privacy &amp; POPIA
          </Link>
        </p>
      </footer>
    </main>
  );
}
