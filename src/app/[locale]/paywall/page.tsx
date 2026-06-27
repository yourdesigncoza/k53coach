"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaywallPage() {
  const t = useTranslations("paywall");
  const included = [
    t("incl1"),
    t("incl2"),
    t("incl3"),
    t("incl4"),
    t("incl5"),
  ];

  function checkout(gateway: "PayFast" | "Yoco") {
    // Stub: real checkout posts to /api/pay/<gateway> and redirects to the
    // gateway. SA gateways via direct checkout — never app-store IAP.
    toast.info(t("stub", { gateway }));
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="pt-safe py-5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <section className="flex-1">
        <Badge variant="secondary">{t("badge")}</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

        <Card className="mt-6 ring-2 ring-foreground">
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
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
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
          onClick={() => checkout("PayFast")}
        >
          {t("payfast")}
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl text-base"
          onClick={() => checkout("Yoco")}
        >
          {t("yoco")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("note")}</p>
      </div>
    </main>
  );
}
