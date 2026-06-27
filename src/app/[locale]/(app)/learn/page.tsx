import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Signpost, Route, Gauge, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROAD_RULES } from "@/content/road-rules";
import { VEHICLE_CONTROLS } from "@/content/vehicle-controls";
import { getApprovedSignsCount } from "@/lib/supabase/queries";

export const metadata = { title: "Learn" };

export default async function LearnPage() {
  const t = await getTranslations("learn");
  const tt = await getTranslations("topics");
  const signCount = await getApprovedSignsCount();

  const modules = [
    {
      href: "/learn/road-signs",
      icon: Signpost,
      title: tt("signs"),
      sub: t("signsSub", { count: signCount }),
      ready: true,
    },
    {
      href: "/learn/rules",
      icon: Route,
      title: tt("rules"),
      sub: t("rulesSub", { count: ROAD_RULES.length }),
      ready: true,
    },
    {
      href: "/learn/controls",
      icon: Gauge,
      title: tt("controls"),
      sub: t("controlsSub", { count: VEHICLE_CONTROLS.length }),
      ready: true,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ href, icon: Icon, title, sub, ready }) => (
          <Card key={href}>
            <CardContent className="py-0">
              <Link href={href} className="flex items-center gap-3 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {title}
                    {!ready && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" /> {t("soon")}
                      </Badge>
                    )}
                  </span>
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
