import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("dashboard");
  const sampleOverall = 62;

  const cards = [
    {
      href: "/learn/road-signs",
      icon: Signpost,
      title: t("roadSignsTitle"),
      sub: t("roadSignsSub"),
    },
    {
      href: "/mock",
      icon: ClipboardCheck,
      title: t("mockTitle"),
      sub: t("mockSub"),
    },
    {
      href: "/learn",
      icon: BookOpen,
      title: t("allModulesTitle"),
      sub: t("allModulesSub"),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">{t("welcome")}</h1>
      <p className="text-sm text-muted-foreground">{t("welcomeSub")}</p>

      <Card className="mt-5 md:max-w-2xl">
        <CardContent className="flex items-center gap-4 py-5">
          <ReadinessRing percent={sampleOverall} size={120} stroke={12} />
          <div className="flex-1">
            <p className="text-sm font-medium">{t("readinessTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("readinessBody")}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1 -ml-2 rounded-lg"
              render={
                <Link href="/progress">
                  {t("seeBreakdown")} <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </div>
        </CardContent>
      </Card>

      <h2 className="mt-7 text-sm font-medium text-muted-foreground">
        {t("continueLearning")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, sub }) => (
          <Card key={href}>
            <CardContent className="py-0">
              <Link href={href} className="flex items-center gap-3 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
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
