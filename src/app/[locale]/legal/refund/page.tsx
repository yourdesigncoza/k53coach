import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LegalDocument } from "@/components/legal/legal-document";
import { REFUND_SECTION_IDS, TERMS } from "@/content/legal/terms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("refund") };
}

/**
 * The cancellation & refund policy at its own URL, because payment providers
 * look for one — but rendered out of the Terms themselves, so it can never say
 * something the Terms do not. Clause numbers stay as printed there (8, 9, 10 …),
 * which is also what tells the reader this is an extract.
 */
export default function RefundPage() {
  const t = useTranslations("legal");

  return (
    <LegalDocument
      doc={TERMS}
      only={REFUND_SECTION_IDS}
      title={t("refundTitle")}
      note={
        <p className="text-xs text-muted-foreground">
          {t("refundExtract")}{" "}
          <Link href="/legal/terms" className="underline">
            {t("backToTerms")}
          </Link>
        </p>
      }
    />
  );
}
