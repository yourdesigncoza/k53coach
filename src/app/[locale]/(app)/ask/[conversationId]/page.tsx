import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireEntitledUser } from "@/lib/exam-guard";
import { getMessages, listConversations } from "@/lib/coach-actions";
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

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await params;
  await requireEntitledUser(locale);

  const [conversations, messages] = await Promise.all([
    listConversations(),
    getMessages(conversationId),
  ]);

  // RLS already scopes both reads to the caller, so an id belonging to someone
  // else simply returns nothing — 404 rather than 403 is the honest answer,
  // since from here the row does not exist.
  if (!conversations.some((c) => c.id === conversationId)) notFound();

  return (
    <AskShell
      locale={locale}
      conversations={conversations}
      activeId={conversationId}
      messages={messages}
      suggestions={suggestionsFor(locale)}
    />
  );
}
