/**
 * The app's single LLM entry point. ALL AI calls go through here so the model
 * and provider are configured in one place. Provider: **OpenRouter**, model in
 * `LLM_MODEL` below. Set OPENROUTER_API_KEY to enable; callers check
 * `hasLlmKey()` for graceful degradation when it is absent (no SDK dependency —
 * direct fetch; OpenRouter speaks the OpenAI chat-completions wire format, so
 * the request and response shapes below are unchanged from the direct-OpenAI
 * version).
 *
 * ⚠ **The dated snapshot pin is gone, and that is a real loss.** We ran
 * `gpt-5.4-mini-2026-03-17` precisely so a re-run was reproducible
 * (`docs/llm-model-selection.md`). OpenRouter publishes the floating alias
 * `openai/gpt-5.4-mini` only, so the model underneath can move without a commit
 * here. If an assessment's wording changes for no reason we can see, suspect
 * this before suspecting the prompt.
 */
export const LLM_MODEL = "openai/gpt-5.4-mini";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Attribution headers. Optional to OpenRouter, but they are what make the spend
 * legible per-app on the dashboard — and the free readiness assessment is meant
 * to carry a rand-denominated daily budget, which needs the spend attributable
 * to something narrower than "the account".
 */
const SITE_URL = "https://k53coach.co.za";
const SITE_NAME = "K53 AI Coach";

/**
 * Strip a markdown code fence wrapping the whole reply.
 *
 * `response_format: {type: "json_object"}` is a hard constraint for OpenAI and a
 * suggestion for others. Measured 2026-08-07: `anthropic/claude-sonnet-5`
 * returns ```` ```json\n{…}\n``` ```` through OpenRouter on the app's exact
 * request, so `JSON.parse` throws and the caller serves its fallback. It parsed
 * one run in five, which reads as an intermittent model outage rather than a
 * shape mismatch.
 *
 * Only a fence around the ENTIRE reply is removed — a fence inside prose is
 * content, not packaging, and this must not silently rewrite a learner-facing
 * string.
 */
export function stripCodeFence(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```") || !t.endsWith("```")) return text;
  const nl = t.indexOf("\n");
  if (nl === -1) return text; // one-line ```…``` — nothing to unwrap safely
  // The opening line is ``` plus an optional language tag and nothing else.
  if (!/^```[a-zA-Z0-9_-]*$/.test(t.slice(0, nl).trim())) return text;
  return t.slice(nl + 1, t.length - 3).trim();
}

/** Whether an OpenRouter key is configured (so callers can degrade gracefully). */
export function hasLlmKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

type ChatOpts = {
  system: string;
  user: string;
  /**
   * Prior turns, oldest first, replayed between the system prompt and `user`.
   *
   * Added for Ask Coach, the first multi-turn surface in the app. Everything else
   * here is one-shot and stays that way — an assessment that quietly grew a
   * conversation history would be a different feature.
   *
   * ⚠ Assistant turns are MODEL OUTPUT being fed back in. The Ask Coach prompt
   * marks the transcript as reference material rather than instruction for
   * exactly that reason; anything else sending history must do the same.
   */
  messages?: LlmMessage[];
  /** Max completion tokens — includes any reasoning tokens (default 1500). */
  maxTokens?: number;
  /** Force a JSON-object response (json mode). */
  json?: boolean;
  /** Sampling temperature (default 0.3). */
  temperature?: number;
  /**
   * Called with the provider's token counts when it reports them. The free
   * readiness assessment has a rand-denominated daily budget, and a budget needs
   * a measured cost per call — not one guessed from a price list.
   */
  onUsage?: (usage: LlmUsage) => void;
};

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Single chat call to OpenRouter (`LLM_MODEL`). Returns the assistant message
 * text. Throws on a missing key or a non-2xx response — callers that want
 * graceful fallback should guard with `hasLlmKey()` and/or try/catch.
 */
export async function llmChat({
  system,
  user,
  messages = [],
  maxTokens = 1500,
  json = false,
  temperature = 0.3,
  onUsage,
}: ChatOpts): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      // `max_tokens` is OpenRouter's normalised field — it translates to
      // OpenAI's `max_completion_tokens` for the GPT-5-era models that require
      // it. Sending `max_completion_tokens` here instead is the mistake to
      // avoid: OpenRouter does not normalise it, so it reaches the provider
      // unvalidated on some routes and is ignored on others.
      max_tokens: maxTokens,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        ...messages,
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    // Carry a slice of the body: OpenRouter answers "no credits", "model not
    // found" and "upstream provider is down" all as a status code, and the
    // three want different fixes. Truncated because a provider error body can
    // echo the whole request back.
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`OpenRouter API ${res.status}${detail ? ` — ${detail}` : ""}`);
  }
  const data = await res.json();
  if (onUsage && data?.usage) {
    onUsage({
      promptTokens: Number(data.usage.prompt_tokens ?? 0),
      completionTokens: Number(data.usage.completion_tokens ?? 0),
      totalTokens: Number(data.usage.total_tokens ?? 0),
    });
  }
  const content = (data?.choices?.[0]?.message?.content as string) ?? "";
  // Unwrapped here, at the single entry point, so no caller has to know which
  // provider honours json mode and which merely tries.
  return stripCodeFence(content);
}
