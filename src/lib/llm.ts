/**
 * The app's single LLM entry point. ALL AI calls go through here so the model
 * and provider are configured in one place. Provider: OpenAI, model gpt-4o-mini.
 * Set OPENAI_API_KEY to enable; callers check `hasLlmKey()` for graceful
 * degradation when it is absent (no SDK dependency — direct fetch).
 */
export const LLM_MODEL = "gpt-4o-mini";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Whether an OpenAI key is configured (so callers can degrade gracefully). */
export function hasLlmKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

type ChatOpts = {
  system: string;
  user: string;
  /** Max completion tokens (default 700). */
  maxTokens?: number;
  /** Force a JSON-object response (gpt-4o-mini json mode). */
  json?: boolean;
  /** Sampling temperature (default 0.3). */
  temperature?: number;
};

/**
 * Single chat call to OpenAI gpt-4o-mini. Returns the assistant message text.
 * Throws on a missing key or a non-2xx response — callers that want graceful
 * fallback should guard with `hasLlmKey()` and/or try/catch.
 */
export async function llmChat({
  system,
  user,
  maxTokens = 700,
  json = false,
  temperature = 0.3,
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
      max_tokens: maxTokens,
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
  return (data?.choices?.[0]?.message?.content as string) ?? "";
}
