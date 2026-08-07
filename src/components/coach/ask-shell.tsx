"use client";

/**
 * Page frame for Ask Coach: the conversation list beside the chat.
 *
 * Left rail from `md` up, a collapsible strip below it — the app's standard
 * mobile-first split, and the same minimum-padding rule as everywhere else
 * (`p-4 md:p-6`, never one desktop-sized value).
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChatPanel } from "@/components/coach/chat-panel";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { deleteConversation, type ConversationSummary, type CoachMessage } from "@/lib/coach-actions";

export function AskShell({
  locale,
  conversations,
  activeId,
  messages,
  suggestions,
}: {
  locale: string;
  conversations: ConversationSummary[];
  activeId: string | null;
  messages: CoachMessage[];
  suggestions: string[];
}) {
  const t = useTranslations("ask");
  const [list, setList] = useState(conversations);
  const [open, setOpen] = useState(false);

  async function remove(id: string) {
    setList((prior) => prior.filter((c) => c.id !== id));
    await deleteConversation(id);
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <header className="mb-4 flex items-center justify-between gap-3 md:mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold md:text-2xl">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-[12px] border border-border px-3 py-2 text-sm md:hidden"
        >
          {t("history")}
        </button>
      </header>

      <div className="grid gap-5 md:grid-cols-[220px_1fr] md:gap-6">
        <aside className={cn("space-y-1", !open && "hidden md:block")}>
          <Link
            href="/ask"
            className="flex items-center gap-1.5 rounded-[12px] border border-border px-3 py-2.5 text-sm font-medium md:px-4 md:py-3"
          >
            <Icon name="i-spark" size="sm" />
            {t("newChat")}
          </Link>
          {list.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-[12px] px-3 py-2.5 text-sm md:px-4 md:py-3",
                conversation.id === activeId && "bg-surface-2",
              )}
            >
              <Link href={`/ask/${conversation.id}`} className="line-clamp-1 flex-1">
                {conversation.title ?? t("untitled")}
              </Link>
              <button
                type="button"
                aria-label={t("delete")}
                onClick={() => void remove(conversation.id)}
                className="opacity-0 transition-opacity group-hover:opacity-60 focus:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </aside>

        <ChatPanel
          key={activeId ?? "new"}
          locale={locale}
          conversationId={activeId}
          initialMessages={messages}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
