import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { getSigns } from "@/lib/supabase/queries";
import { SIGN_CATEGORY_LABEL, SIGN_CATEGORY_ORDER } from "@/lib/signs";

export const metadata = { title: "Admin · Signs" };

function statusBadge(value: string, kind: "asset" | "review") {
  const approved = value === "approved";
  return (
    <Badge
      variant="secondary"
      className={
        approved
          ? "[&]:text-emerald-700 dark:[&]:text-emerald-300 bg-success/10"
          : "bg-warning/15 [&]:text-amber-700 dark:[&]:text-amber-300"
      }
    >
      {kind === "asset" ? "asset" : "content"}: {value}
    </Badge>
  );
}

export default async function AdminSignsPage() {
  const signs = await getSigns();
  const approved = signs.filter(
    (s) => s.asset_status === "approved" && s.review_status === "approved",
  ).length;
  const withContent = signs.filter(
    (s) => Object.keys((s.content as object) ?? {}).length > 0,
  ).length;

  const byCategory = SIGN_CATEGORY_ORDER.map((cat) => ({
    cat,
    signs: signs.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Road sign review</h1>
      <p className="text-sm text-muted-foreground">
        {signs.length} signs · {withContent} with content drafted · {approved}{" "}
        fully approved (shippable).
      </p>

      {byCategory.map(({ cat, signs }) => (
        <section key={cat} className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {SIGN_CATEGORY_LABEL[cat]} ({signs.length})
          </h2>
          <div className="grid gap-2">
            {signs.map((s) => (
              <Card key={s.code}>
                <CardContent className="py-0">
                  <Link
                    href={`/admin/signs/${encodeURIComponent(s.code)}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <SignImage
                      svgFile={s.svg_file}
                      name={s.name}
                      className="size-9 shrink-0"
                    />
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      {s.code}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {s.name}
                    </span>
                    <span className="hidden gap-1.5 sm:flex">
                      {statusBadge(s.asset_status, "asset")}
                      {statusBadge(s.review_status, "review")}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
