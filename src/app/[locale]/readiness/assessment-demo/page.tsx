import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AssessmentDemo } from "@/components/readiness/assessment-demo";

export const metadata = { title: "AI Assessment — sample" };

export default function AssessmentDemoPage() {
  return (
    <>
      <SiteHeader />
      <AssessmentDemo />
      <SiteFooter />
    </>
  );
}
