import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { getSigns } from "@/lib/supabase/queries";
import { SIGN_CATEGORY_LABEL, SIGN_CATEGORY_ORDER } from "@/lib/signs";

export const metadata = { title: "Road Signs" };

export default async function RoadSignsPage() {
  const t = await getTranslations("module");
  const signs = await getSigns();

  const byCategory = SIGN_CATEGORY_ORDER.map((cat) => ({
    cat,
    signs: signs.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {t("signsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("signsSubtitle")}</p>
        </div>
        <Button
          className="h-11 rounded-xl"
          render={
            <Link href="/learn/road-signs/practice">
              <Sparkles className="size-4" /> {t("practice")}
            </Link>
          }
        />
      </div>

      {byCategory.map(({ cat, signs }) => (
        <section key={cat} className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {SIGN_CATEGORY_LABEL[cat]}{" "}
            <span className="text-muted-foreground/60">({signs.length})</span>
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((s) => (
              <Card key={s.code}>
                <CardContent className="py-0">
                  <Link
                    href={`/learn/road-signs/${encodeURIComponent(s.code)}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <SignImage
                      svgFile={s.svg_file}
                      name={s.name}
                      className="size-12 shrink-0"
                    />
                    <span className="flex-1">
                      <span className="block font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.code}
                        {s.subcategory ? ` · ${s.subcategory}` : ""}
                      </span>
                    </span>
                    {s.review_status !== "approved" && (
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
      ))}
    </main>
  );
}
