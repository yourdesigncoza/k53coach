"use client";

/**
 * Put a question through the live gates and see what each one did.
 *
 * The reason this exists: thresholds are fitted against a committed fixture, but
 * when a real question behaves oddly the fixture cannot tell you why. This shows
 * the retrieval score, the out-of-vocabulary ratio, the passages that would be
 * sent, and — when generation is enabled — which validator check rejected the
 * answer. Reading that off server logs is how threshold tuning becomes guesswork.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Probe {
  corpusRevision?: string;
  passageCount?: number;
  redacted?: string[];
  gate?: { decision: string; topScore: number; oovRatio: number };
  passages?: { code: string; kind: string; title: string; score: number }[];
  outcome?: string;
  via?: string;
  answer?: string;
  sources?: string[];
  rejectedBy?: string;
  detail?: string;
  raw?: string;
  note?: string;
  error?: string;
}

export function CoachTestConsole() {
  const [question, setQuestion] = useState("");
  const [locale, setLocale] = useState("en");
  const [generate, setGenerate] = useState(false);
  const [result, setResult] = useState<Probe | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/coach-probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, locale, generate }),
      });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Test console</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask something — on topic or not"
          className="min-w-[240px] flex-1"
          onKeyDown={(event) => {
            if (event.key === "Enter") void run();
          }}
        />
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
          className="rounded-[12px] border border-border px-3 py-2 text-sm"
        >
          <option value="en">en</option>
          <option value="af">af</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={generate}
            onChange={(event) => setGenerate(event.target.checked)}
          />
          call the model
        </label>
        <Button onClick={() => void run()} disabled={busy || !question.trim()}>
          {busy ? "Running…" : "Run"}
        </Button>
      </div>

      {result && (
        <div className="space-y-3 rounded-[14px] border border-border p-4">
          {result.error ? (
            <p className="text-sm text-destructive">{result.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 text-sm">
                <Stat label="gate" value={result.gate?.decision ?? "—"} />
                <Stat label="topScore" value={String(result.gate?.topScore ?? "—")} />
                <Stat label="oovRatio" value={String(result.gate?.oovRatio ?? "—")} />
                <Stat label="outcome" value={result.outcome ?? "—"} />
                {result.via && <Stat label="via" value={result.via} />}
                {result.rejectedBy && (
                  <Stat label="rejected by" value={`${result.rejectedBy} ${result.detail ?? ""}`} />
                )}
              </div>

              {result.redacted && result.redacted.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Redacted before anything left the box: {result.redacted.join(", ")}
                </p>
              )}
              {result.note && <p className="text-sm text-muted-foreground">{result.note}</p>}
              {result.answer && (
                <p className="rounded-[12px] bg-surface-2 p-3 text-sm">{result.answer}</p>
              )}

              {result.passages && result.passages.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-xs">
                    <tbody>
                      {result.passages.map((passage) => (
                        <tr key={passage.code} className="border-t border-border">
                          <td className="py-1.5 pr-3 font-mono">{passage.code}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground">{passage.kind}</td>
                          <td className="py-1.5 pr-3">{passage.title}</td>
                          <td className="py-1.5 tabular-nums">{passage.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.raw && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">raw model reply</summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{result.raw}</pre>
                </details>
              )}

              <p className="text-xs text-muted-foreground">
                corpus {result.corpusRevision} · {result.passageCount} passages
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
