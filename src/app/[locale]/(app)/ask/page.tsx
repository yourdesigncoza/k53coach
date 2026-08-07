import { getTranslations } from "next-intl/server";
import { requireEntitledUser } from "@/lib/exam-guard";
import { listConversations } from "@/lib/coach-actions";
import { AskShell } from "@/components/coach/ask-shell";
import { suggestionsFor } from "@/components/coach/suggestions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "meta" });
  return { title: t("ask") };
}

/**
 * Ask Coach — a new conversation.
 *
 * Entitlement-gated on the same guard as `/mock` (decision a). This is the one
 * surface besides the mock exam that R179 buys; practice, explanations and the
 * whole library stay free and open, which is settled and not revisited here.
 */
export default async function AskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireEntitledUser(locale);

  const conversations = await listConversations();

  return (
    <AskShell
      locale={locale}
      conversations={conversations}
      activeId={null}
      messages={[]}
      suggestions={suggestionsFor(locale)}
    />
  );
}
