import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import {
  ROAD_SIGNS,
  SIGN_CATEGORY_LABEL,
  getSign,
} from "@/content/road-signs";

export function generateStaticParams() {
  return ROAD_SIGNS.map((s) => ({ code: s.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sign = getSign(code);
  return { title: sign ? sign.name : "Road sign" };
}

const FIELDS = [
  { key: "behaviour", icon: CarFront, labelKey: "whatYouMustDo" },
  { key: "commonMistake", icon: AlertTriangle, labelKey: "commonMistake" },
  { key: "testHint", icon: Lightbulb, labelKey: "testHint" },
] as const;

export default async function SignDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sign = getSign(code);
  if (!sign) notFound();

  const t = await getTranslations("module");
  const related = sign.relatedSigns
    .map((c) => getSign(c))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-4 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-2 rounded-lg"
        render={
          <Link href="/learn/road-signs">
            <ArrowLeft className="size-4" /> {t("backSigns")}
          </Link>
        }
      />

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-10">
        {/* Left: identity */}
        <div className="md:sticky md:top-8">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <SignImage
              glyph={sign.glyph}
              svgFile={sign.provenance.svgFile}
              name={sign.name}
              className="size-32 md:size-44"
            />
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">{sign.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                {SIGN_CATEGORY_LABEL[sign.category]}
              </Badge>
              <Badge variant="outline">{sign.subcategory}</Badge>
            </div>
          </div>

          <Card className="mt-5">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-muted-foreground">
                {t("inPlainEnglish")}
              </p>
              <p className="mt-1">{sign.plainEnglish}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">{t("formalMeaning")} </span>
                {sign.formalMeaning}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: coaching detail */}
        <div className="mt-3 md:mt-0">
          <div className="grid gap-3">
            {FIELDS.map(({ key, icon: Icon, labelKey }) => (
              <Card key={key}>
                <CardContent className="flex items-start gap-3 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t(labelKey)}</p>
                    <p className="text-sm text-muted-foreground">{sign[key]}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {related.length > 0 && (
            <section className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <ListChecks className="size-4" /> {t("dontConfuse")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {related.map((r) => (
                  <Card key={r.code}>
                    <CardContent className="py-0">
                      <Link
                        href={`/learn/road-signs/${r.code}`}
                        className="flex items-center gap-2 py-3"
                      >
                        <SignImage
                          glyph={r.glyph}
                          svgFile={r.provenance.svgFile}
                          name={r.name}
                          className="size-9 shrink-0"
                        />
                        <span className="text-sm font-medium">{r.name}</span>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <p className="mt-6 text-[11px] text-muted-foreground">
            {t("artwork", {
              source: sign.provenance.source,
              licence: sign.provenance.licence,
            })}
          </p>
        </div>
      </div>
    </main>
  );
}
