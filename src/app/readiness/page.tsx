import Link from "next/link";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { READINESS_QUESTIONS } from "@/content/readiness-questions";

export const metadata = { title: "Free readiness test" };

export default function ReadinessIntroPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="pt-safe py-5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <section className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Your free K53 readiness check
        </h1>
        <p className="mt-2 text-muted-foreground">
          A quick {READINESS_QUESTIONS.length}-question test across road signs,
          rules of the road, and vehicle controls. You&apos;ll get a clear
          readiness score you can show a parent.
        </p>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 py-5">
            {[
              { icon: Clock, text: "Takes about 5 minutes" },
              { icon: Lock, text: "Anonymous — nothing is saved or shared" },
              {
                icon: CheckCircle2,
                text: "See exactly which topics need work",
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="size-5 shrink-0 text-primary" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="pb-safe sticky bottom-0 bg-background/95 pt-3 backdrop-blur">
        <Button
          className="h-13 w-full rounded-xl text-base"
          render={<Link href="/readiness/test">Start the test</Link>}
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          By starting you agree to our{" "}
          <Link href="/legal/privacy" className="underline">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
