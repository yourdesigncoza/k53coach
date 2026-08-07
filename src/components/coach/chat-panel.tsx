"use client";

/**
 * The Ask Coach chat surface.
 *
 * Renders inside the shared `QuizPanel` and reuses `CoachCard` for the coach's
 * turn, so this reads as the same coach the learner already meets after a mock
 * exam rather than a second, differently-styled AI. Reuse over re-implementation
 * is a project rule; the assessment demo already learned this the hard way by
 * duplicating the coach card with roomier padding.
 *
 * Non-streaming by design (decision c): `llmChat` returns a whole string, and
 * answers are capped at 700 characters, so a typing indicator covers the wait
 * without a second transport to maintain.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CoachCard, QuizButton } from "@/components/quiz/quiz-chrome";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { CoachMessage } from "@/lib/coach-actions";

const MAX_CHARS = 500;

interface Pending extends CoachMessage {
  pending?: boolean;
}

export function ChatPanel({
  locale,
  conversationId,
  initialMessages,
  suggestions,
}: {
  locale: string;
  conversationId: string | null;
  initialMessages: CoachMessage[];
  suggestions: string[];
}) {
  const t = useTranslations("ask");
  const router = useRouter();
  const [messages, setMessages] = useState<Pending[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversation, setConversation] = useState(conversationId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;

    setDraft("");
    setBusy(true);
    setMessages((prior) => [
      ...prior,
      {
        id: `local-${prior.length}`,
        role: "user",
        body: text,
        status: null,
        sources: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, conversationId: conversation, locale }),
      });
      const data = await res.json().catch(() => null);

      if (!data?.answer) {
        setMessages((prior) => [
          ...prior,
          { id: `err-${prior.length}`, role: "assistant", body: t("error"), status: "error", sources: [], createdAt: new Date().toISOString() },
        ]);
        return;
      }

      // The server owns the source list: it is built from the passages actually
      // supplied to the model, snapshotted, never assembled here.
      setMessages((prior) => [
        ...prior,
        {
          id: `a-${prior.length}`,
          role: "assistant",
          body: data.answer,
          status: data.status,
          sources: data.sources ?? [],
          createdAt: new Date().toISOString(),
        },
      ]);

      if (!conversation && data.conversationId) {
        setConversation(data.conversationId);
        router.replace(`/ask/${data.conversationId}`);
      }
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <QuizPanel className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-4">
        {empty && (
          <div className="py-6 text-center">
            <p className="font-display text-lg font-semibold">{t("emptyTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--surface-ink-2)]">
              {t("emptyBody")}
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="ml-auto max-w-[85%] rounded-[14px] bg-surface-2 px-4 py-2.5 text-sm text-[var(--surface-ink)]"
            >
              {message.body}
            </p>
          ) : (
            <div key={message.id} className="max-w-[95%]">
              <CoachCard>{message.body}</CoachCard>
              {message.sources.length > 0 && <SourceChips sources={message.sources} />}
            </div>
          ),
        )}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-[var(--surface-ink-2)]">
            <Icon name="i-spark" size="sm" />
            {t("thinking")}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {empty && suggestions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="rounded-full border border-[var(--surface-border-2)] px-3 py-1.5 text-xs text-[var(--surface-ink-2)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHARS))}
          placeholder={t("placeholder")}
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(draft);
            }
          }}
        />
        <QuizButton type="submit" disabled={busy || !draft.trim()}>
          {t("send")}
        </QuizButton>
      </form>
      <p className={cn("mt-2 text-right text-xs text-[var(--surface-ink-2)]", draft.length < MAX_CHARS * 0.8 && "invisible")}>
        {draft.length}/{MAX_CHARS}
      </p>
    </QuizPanel>
  );
}

/**
 * The trust surface. Every claim the coach makes is anchored to a lesson the
 * learner can open and read — which is the whole difference between this and a
 * chatbot, so it is not decoration and should not be hidden behind a disclosure.
 */
function SourceChips({ sources }: { sources: { code: string; href: string }[] }) {
  const t = useTranslations("ask");
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1">
      <span className="text-xs text-[var(--surface-ink-2)]">{t("sources")}</span>
      {sources.map((source) =>
        source.href ? (
          <Link
            key={source.code}
            href={source.href}
            className="rounded-full border border-[var(--surface-border-2)] px-2 py-0.5 text-xs text-[var(--surface-ink)]"
          >
            {source.code}
          </Link>
        ) : (
          <span
            key={source.code}
            className="rounded-full border border-[var(--surface-border-2)] px-2 py-0.5 text-xs text-[var(--surface-ink-2)]"
          >
            {source.code}
          </span>
        ),
      )}
    </div>
  );
}
