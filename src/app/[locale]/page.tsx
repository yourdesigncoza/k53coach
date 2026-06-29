import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Brain,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlobalHeader } from "@/components/global-header";

export default function LandingPage() {
  const t = useTranslations("landing");

  const steps = [
    { icon: ScanLine, title: t("step1Title"), body: t("step1Body") },
    { icon: TrendingUp, title: t("step2Title"), body: t("step2Body") },
    { icon: Brain, title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <main className="flex-1">
      <GlobalHeader />

      <section className="mx-auto max-w-2xl px-5 pt-6 text-center md:pt-16">
        <Badge variant="secondary" className="mx-auto">
          <Sparkles className="size-3" /> {t("badge")}
        </Badge>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight md:text-5xl">
          {t("titleLead")}{" "}
          <span className="text-muted-foreground">{t("titleEmph")}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
          {t("subtitle")}
        </p>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <Button
            className="h-13 w-full rounded-xl text-base"
            render={<Link href="/readiness">{t("cta")}</Link>}
          />
          <p className="text-xs text-muted-foreground">{t("ctaNote")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-20">
        <h2 className="text-center text-lg font-semibold md:text-2xl">
          {t("howTitle")}
        </h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3 md:gap-5">
          {steps.map(({ icon: Icon, title, body }, i) => (
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

      <section className="mx-auto max-w-md px-5 pb-4">
        <h2 className="text-center text-lg font-semibold md:text-2xl">
          {t("pricingTitle")}
        </h2>
        <Card className="mt-4 ring-2 ring-foreground">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">{t("pricingAccess")}</p>
            <p className="mt-1 text-4xl font-bold">
              R179
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                {t("per")}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("pricingBody")}
            </p>
            <Button
              className="mt-5 h-12 w-full rounded-xl text-base"
              render={<Link href="/readiness">{t("pricingCta")}</Link>}
            />
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("schools")}{" "}
          <Link href="/auth" className="underline">
            {t("talk")}
          </Link>
        </p>
      </section>

      <section className="mx-auto grid max-w-2xl grid-cols-1 gap-3 px-5 py-12 sm:grid-cols-2 md:py-16">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <Users className="size-5 text-foreground" />
            <p className="text-sm font-medium">{t("trustParentTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("trustParentBody")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <ShieldCheck className="size-5 text-foreground" />
            <p className="text-sm font-medium">{t("trustPrivacyTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("trustPrivacyBody")}
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>{t("footerRights")}</p>
        <p className="mt-1">
          <Link href="/legal/privacy" className="underline">
            {t("privacy")}
          </Link>
        </p>
      </footer>
    </main>
  );
}
