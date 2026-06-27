import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  VEHICLE_CONTROLS,
  CONTROL_CATEGORY_META,
} from "@/content/vehicle-controls";
import type { ControlCategory } from "@/lib/types";

export const metadata = { title: "Vehicle Controls" };

const ORDER = Object.keys(CONTROL_CATEGORY_META) as ControlCategory[];

export default function ControlsPage() {
  const t = useTranslations("module");
  const byCategory = ORDER.map((cat) => ({
    cat,
    controls: VEHICLE_CONTROLS.filter((c) => c.category === cat),
  })).filter((g) => g.controls.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {t("controlsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("controlsSubtitle")}
          </p>
        </div>
        <Button
          className="h-11 rounded-xl"
          render={
            <Link href="/learn/controls/practice">
              <Sparkles className="size-4" /> {t("practice")}
            </Link>
          }
        />
      </div>

      {byCategory.map(({ cat, controls }) => {
        const { label, icon: Icon } = CONTROL_CATEGORY_META[cat];
        return (
          <section key={cat} className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {controls.map((c) => (
                <Card key={c.code}>
                  <CardContent className="py-0">
                    <Link
                      href={`/learn/controls/${c.code}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.summary}
                        </span>
                      </span>
                      {c.reviewStatus !== "approved" && (
                        <Badge variant="outline" className="text-[10px]">
                          {t("draft")}
                        </Badge>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
