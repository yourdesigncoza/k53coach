import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LessonDemo } from "@/components/readiness/lesson-demo";

export const metadata = { title: "Sample lesson — Road Signs: Shapes & Colours" };

export default function LessonDemoPage() {
  return (
    <>
      <SiteHeader />
      <LessonDemo />
      <SiteFooter />
    </>
  );
}
