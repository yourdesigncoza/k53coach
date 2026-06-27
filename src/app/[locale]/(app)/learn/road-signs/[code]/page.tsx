import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CarFront, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { getApprovedSignByCode } from "@/lib/supabase/queries";
import { SIGN_CATEGORY_LABEL, signContent, localize } from "@/lib/signs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sign = await getApprovedSignByCode(decodeURIComponent(code));
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
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const sign = await getApprovedSignByCode(decodeURIComponent(code));
  if (!sign) notFound();

  const t = await getTranslations("module");
  const content = signContent(sign);
  const plain = localize(content.plainEnglish, locale);
  const formal = localize(content.formalMeaning, locale);
  const fields = FIELDS.map((f) => ({
    ...f,
    value: localize(content[f.key], locale),
  })).filter((f) => f.value);
  const hasAnyContent = Boolean(plain || formal || fields.length);

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
              svgFile={sign.svg_file}
              name={sign.name}
              className="size-32 md:size-44"
            />
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">{sign.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {SIGN_CATEGORY_LABEL[sign.category]}
              </Badge>
              {sign.subcategory && (
                <Badge variant="outline">{sign.subcategory}</Badge>
              )}
              <Badge variant="outline">{sign.code}</Badge>
            </div>
          </div>

          {(plain || formal) && (
            <Card className="mt-5">
              <CardContent className="py-4">
                {plain && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("inPlainEnglish")}
                    </p>
                    <p className="mt-1">{plain}</p>
                  </>
                )}
                {formal && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium">{t("formalMeaning")} </span>
                    {formal}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: coaching detail (or "in preparation") */}
        <div className="mt-3 md:mt-0">
          {fields.length > 0 ? (
            <div className="grid gap-3">
              {fields.map(({ key, icon: Icon, labelKey, value }) => (
                <Card key={key}>
                  <CardContent className="flex items-start gap-3 py-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                      <Icon className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t(labelKey)}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !hasAnyContent && (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  {t("contentSoon")}
                </CardContent>
              </Card>
            )
          )}

          <p className="mt-6 text-[11px] text-muted-foreground">
            {t("artwork", {
              source: sign.source ?? "Wikimedia Commons",
              licence: sign.licence ?? "Public domain",
            })}
          </p>
        </div>
      </div>
    </main>
  );
}
