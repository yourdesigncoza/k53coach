import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AssessmentDemo } from "@/components/readiness/assessment-demo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("assessmentDemo") };
}

export default function AssessmentDemoPage() {
  return (
    <>
      <SiteHeader />
      <AssessmentDemo />
      <SiteFooter />
    </>
  );
}
