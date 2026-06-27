import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Mock Test" };

export default function MockPage() {
  const t = useTranslations("comingSoon");
  return <ComingSoon title={t("mockTitle")} blurb={t("mockBlurb")} />;
}
