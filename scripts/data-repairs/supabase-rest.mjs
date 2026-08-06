/**
 * Shared service-role REST access for the data-repair scripts.
 *
 * Extracted from apply-data-repairs.mjs when a second repair set needed the same
 * three things: read .env.local (plain node scripts do not get it for free), and
 * PATCH/GET against PostgREST with the service-role key.
 *
 * The service-role key bypasses RLS, so these helpers are for repair scripts run
 * by hand — never import them from anything under src/.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV = readFileSync(join(ROOT, ".env.local"), "utf8");

function env(pred) {
  const line = ENV.split("\n").find(pred);
  if (!line) throw new Error("required key missing from .env.local");
  return line.slice(line.indexOf("=") + 1).replace(/^"|"$/g, "").trim();
}

export const SUPABASE_URL = env((l) =>
  l.startsWith("NEXT_PUBLIC_SUPABASE_URL="),
);
export const SERVICE_KEY = env((l) => l.includes("SERVICE_ROLE"));

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

export async function patch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
}

export async function insert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${table} -> ${res.status} ${await res.text()}`);
}

/**
 * Conditional DELETE. The caller is expected to include the *audited* value in
 * the filter (`&value=eq.<old>`) so a row edited between audit and repair matches
 * nothing and aborts, rather than being silently clobbered. Returns the deleted
 * rows so the caller can assert on the count instead of trusting a 2xx.
 */
export async function remove(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=representation" },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

export async function select(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}
