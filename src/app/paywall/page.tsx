"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const INCLUDED = [
  "Full 750-question bank + mock exams",
  "Complete road-sign, rules & controls library",
  "AI explanations for every wrong answer",
  "Adaptive weak-area study plan",
  "Parent readiness report",
];

export default function PaywallPage() {
  function checkout(gateway: "payfast" | "yoco") {
    // Stub: real checkout posts to /api/pay/<gateway> and redirects to the
    // gateway. SA gateways via direct checkout — never app-store IAP.
    toast.info(
      `${gateway === "payfast" ? "PayFast" : "Yoco"} checkout is stubbed in the MVP scaffold.`,
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="pt-safe py-5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <section className="flex-1">
        <Badge variant="secondary">Parent unlock</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Unlock 90 days of full access
        </h1>
        <p className="mt-2 text-muted-foreground">
          One payment. No subscription trap. Optional R20/month afterwards only
          if you want to keep the AI Coach.
        </p>

        <Card className="mt-6 ring-2 ring-primary">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-4xl font-bold">
                R179
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / 90 days
                </span>
              </p>
            </div>
            <ul className="mt-5 flex flex-col gap-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <div className="pb-safe sticky bottom-0 flex flex-col gap-2 bg-background/95 pt-3 backdrop-blur">
        <Button
          className="h-13 w-full rounded-xl text-base"
          onClick={() => checkout("payfast")}
        >
          Pay with PayFast
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl text-base"
          onClick={() => checkout("yoco")}
        >
          Pay with Yoco
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Secure South African payment gateways. This is a parent-facing screen.
        </p>
      </div>
    </main>
  );
}
