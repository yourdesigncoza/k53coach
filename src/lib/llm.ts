/**
 * The app's single LLM entry point. ALL AI calls go through here so the model
 * and provider are configured in one place. Provider: OpenAI, model in
 * `LLM_MODEL` below. Set OPENAI_API_KEY to enable; callers check `hasLlmKey()`
 * for graceful degradation when it is absent (no SDK dependency — direct fetch).
 */
export const LLM_MODEL = "gpt-5.4-mini-2026-03-17";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Whether an OpenAI key is configured (so callers can degrade gracefully). */
export function hasLlmKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

type ChatOpts = {
  system: string;
  user: string;
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
 * Single chat call to OpenAI (`LLM_MODEL`). Returns the assistant message text.
 * Throws on a missing key or a non-2xx response — callers that want graceful
 * fallback should guard with `hasLlmKey()` and/or try/catch.
 */
export async function llmChat({
  system,
  user,
  maxTokens = 1500,
  json = false,
  temperature = 0.3,
  onUsage,
}: ChatOpts): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      // GPT-5-era models require max_completion_tokens (and count reasoning
      // tokens against it); gpt-4o-mini accepts it too.
      max_completion_tokens: maxTokens,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API ${res.status}`);
  }
  const data = await res.json();
  if (onUsage && data?.usage) {
    onUsage({
      promptTokens: Number(data.usage.prompt_tokens ?? 0),
      completionTokens: Number(data.usage.completion_tokens ?? 0),
      totalTokens: Number(data.usage.total_tokens ?? 0),
    });
  }
  return (data?.choices?.[0]?.message?.content as string) ?? "";
}
