"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startTestCheckout } from "@/lib/entitlement-actions";
import { ENTITLEMENT_DAYS, ENTITLEMENT_PRICE_LABEL } from "@/lib/pricing";

// Real PayFast checkout. Closed by default and enforced server-side too — the
// Stage 1 content gate (K53-32) keeps it shut in production for now.
const PAYFAST_LIVE = process.env.NEXT_PUBLIC_PAYFAST_CHECKOUT_ENABLED === "true";

// Prototype fallback: grants access directly, no payment. Only when real checkout
// is closed. Removed from Vercel production.
const TEST_CHECKOUT = process.env.NEXT_PUBLIC_ENABLE_TEST_CHECKOUT === "true";

/**
 * Hand the buyer to PayFast. The gateway needs a real form POST from the browser,
 * so the signed fields the server built are replayed as hidden inputs. Field order
 * is preserved — the signature was computed over it.
 */
function submitToGateway(url: string, fields: [string, string][]) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}

export default function PaywallPage() {
  const t = useTranslations("paywall");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const included = [
    t("incl1"),
    t("incl2"),
    t("incl3"),
    t("incl4"),
    t("incl5"),
  ];

  async function checkout(gateway: "PayFast" | "Yoco") {
    // Real PayFast: the server signs the request, the browser POSTs it.
    if (gateway === "PayFast" && PAYFAST_LIVE) {
      setBusy(true);
      const res = await fetch("/api/pay/payfast/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Stays busy: the browser is about to leave for the gateway.
        submitToGateway(data.url, data.fields);
        return;
      }
      setBusy(false);
      if (res.status === 401) {
        toast.info(t("testNeedsAuth"));
        router.push("/auth");
        return;
      }
      toast.error(
        data.error === "already_active" ? t("alreadyActive") : t("checkoutFailed"),
      );
      return;
    }

    if (!TEST_CHECKOUT) {
      // Yoco is still a stub, as is PayFast while checkout is closed.
      toast.info(t("stub", { gateway }));
      return;
    }
    // Test mode: grant access to the signed-in user and enter the app.
    setBusy(true);
    const res = await startTestCheckout();
    setBusy(false);
    if ("needsAuth" in res && res.needsAuth) {
      toast.info(t("testNeedsAuth"));
      router.push("/auth");
      return;
    }
    if (res.ok) {
      toast.success(t("testUnlocked"));
      router.push("/mock");
    } else {
      toast.error(res.error ?? "Checkout failed");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-5">
        <section className="flex-1">
        <Badge variant="secondary">{t("badge")}</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle", { price: ENTITLEMENT_PRICE_LABEL })}</p>

        <Card className="mt-6 ring-2 ring-foreground">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-4xl font-bold">
                {ENTITLEMENT_PRICE_LABEL}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {ENTITLEMENT_DAYS} days
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
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : t("payfast")}
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl text-base"
          onClick={() => checkout("Yoco")}
          disabled={busy}
        >
          {t("yoco")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {TEST_CHECKOUT ? t("testNote") : t("note")}
        </p>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
