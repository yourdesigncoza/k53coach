import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignGlyph } from "@/components/signs";
import {
  ROAD_SIGNS,
  SIGN_CATEGORY_LABEL,
} from "@/content/road-signs";
import type { SignCategory } from "@/lib/types";

export const metadata = { title: "Road Signs" };

const ORDER: SignCategory[] = ["regulatory", "warning", "guidance", "marking"];

export default function RoadSignsPage() {
  const byCategory = ORDER.map((cat) => ({
    cat,
    signs: ROAD_SIGNS.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Road Signs</h1>
      <p className="text-sm text-muted-foreground">
        Tap a sign to learn what it means, what to do, and the common mistake.
      </p>

      {byCategory.map(({ cat, signs }) => (
        <section key={cat} className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {SIGN_CATEGORY_LABEL[cat]}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((s) => (
              <Card key={s.code}>
                <CardContent className="py-0">
                  <Link
                    href={`/learn/road-signs/${s.code}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <SignGlyph
                      glyph={s.glyph}
                      className="size-12 shrink-0"
                    />
                    <span className="flex-1">
                      <span className="block font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.subcategory}
                      </span>
                    </span>
                    {s.reviewStatus !== "approved" && (
                      <Badge variant="outline" className="text-[10px]">
                        draft
                      </Badge>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" />
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
