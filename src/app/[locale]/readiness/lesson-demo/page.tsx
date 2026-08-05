import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LessonDemo } from "@/components/readiness/lesson-demo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("lessonDemo") };
}

export default function LessonDemoPage() {
  return (
    <>
      <SiteHeader />
      <LessonDemo />
      <SiteFooter />
    </>
  );
}
