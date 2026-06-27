import Link from "next/link";
import { BookOpen, ClipboardCheck, Signpost, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReadinessRing } from "@/components/readiness-ring";

export const metadata = { title: "Home" };

/**
 * Learner home. Uses sample readiness data in the scaffold; once auth + history
 * are wired this reads the learner's real DB9 score.
 */
export default function DashboardPage() {
  const sampleOverall = 62;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Welcome back 👋</h1>
      <p className="text-sm text-muted-foreground">
        Keep going — small daily sessions beat cramming.
      </p>

      <Card className="mt-5 md:max-w-2xl">
        <CardContent className="flex items-center gap-4 py-5">
          <ReadinessRing percent={sampleOverall} size={120} stroke={12} />
          <div className="flex-1">
            <p className="text-sm font-medium">Your readiness</p>
            <p className="text-sm text-muted-foreground">
              You&apos;re almost ready. Your weakest topic is{" "}
              <span className="font-medium text-foreground">Rules</span>.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1 -ml-2 rounded-lg"
              render={
                <Link href="/progress">
                  See breakdown <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </div>
        </CardContent>
      </Card>

      <h2 className="mt-7 text-sm font-medium text-muted-foreground">
        Continue learning
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/learn/road-signs",
            icon: Signpost,
            title: "Road Signs",
            sub: "Practice the signs you'll be tested on",
          },
          {
            href: "/mock",
            icon: ClipboardCheck,
            title: "Take a mock exam",
            sub: "Simulate the real test",
          },
          {
            href: "/learn",
            icon: BookOpen,
            title: "All modules",
            sub: "Signs, rules & vehicle controls",
          },
        ].map(({ href, icon: Icon, title, sub }) => (
          <Card key={href}>
            <CardContent className="py-0">
              <Link
                href={href}
                className="flex items-center gap-3 py-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {sub}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
