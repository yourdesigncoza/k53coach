import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getReadinessQuestions } from "@/lib/questions";

export const metadata = { title: "Free readiness test" };

export default async function ReadinessIntroPage() {
  const t = await getTranslations("readiness");
  const count = (await getReadinessQuestions()).length;

  const benefits = [
    { icon: Clock, text: t("benefitTime") },
    { icon: Lock, text: t("benefitAnon") },
    { icon: CheckCircle2, text: t("benefitTopics") },
  ];

  return (
    <>
      <GlobalHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-5">
        <section className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("intro", { count })}
          </p>

          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 py-5">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-foreground" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <div className="pb-safe sticky bottom-0 bg-background/95 pt-3 backdrop-blur">
          <Button
            className="h-13 w-full rounded-xl text-base"
            render={<Link href="/readiness/test">{t("start")}</Link>}
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("agree")}{" "}
            <Link href="/legal/privacy" className="underline">
              {t("privacyNotice")}
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
