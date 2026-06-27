#!/usr/bin/env node
/**
 * Runs the full road-sign ingest: PDF extract → Wikimedia fetch.
 * Pass-through flags go to the fetch step, e.g.:
 *   node scripts/signs/ingest.mjs --filter warning --limit 20
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const pass = process.argv.slice(2);
const run = (script, args = []) =>
  execFileSync("node", [resolve("scripts/signs", script), ...args], {
    stdio: "inherit",
  });

console.log("→ Step 1: extract sign inventory from RTSigns_charts.pdf");
run("extract-pdf.mjs");
console.log("\n→ Step 2: fetch + licence-audit SVGs from Wikimedia Commons");
run("fetch-wikimedia.mjs", pass);
