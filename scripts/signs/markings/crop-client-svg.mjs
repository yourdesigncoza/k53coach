#!/usr/bin/env node
/**
 * Crop the cleaned marking SVGs to their real content bounds.
 *
 * Removing the full-bleed background rect (clean-client-svg.mjs) leaves each
 * drawing floating inside whatever viewBox the author happened to use — nine
 * different frames across sixteen files, most with dead space on at least one
 * edge. This pass measures the actual painted bounds with a real layout engine
 * (headless Chrome getBBox) and rewrites the viewBox to fit, with one uniform
 * padding ratio so every marking sits in the grid the same way.
 *
 * Run clean-client-svg.mjs first.
 *
 *   node scripts/signs/markings/crop-client-svg.mjs [--pad 0.02]
 */
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIR = join(HERE, 'client-svg-cleaned')

const padArg = process.argv.indexOf('--pad')
/** Padding as a fraction of the longest content edge. */
const PAD = padArg > -1 ? Number(process.argv[padArg + 1]) : 0.02

const CHROME = ['google-chrome', 'chromium', 'chromium-browser']
  .find((c) => { try { execFileSync('which', [c], { stdio: 'pipe' }); return true } catch { return false } })
if (!CHROME) throw new Error('no headless Chrome found (tried google-chrome, chromium, chromium-browser)')

const files = readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort()

// One page holding every SVG, each measured in isolation via getBBox().
const page = `<!doctype html><meta charset="utf-8"><body>
${files.map((f, i) => `<div id="h${i}" style="width:1000px">${readFileSync(join(DIR, f), 'utf8').replace(/<\?xml[^>]*\?>/, '')}</div>`).join('\n')}
<pre id="out"></pre>
<script>
const r = {};
(${JSON.stringify(files)}).forEach((f, i) => {
  const svg = document.querySelector('#h' + i + ' svg')
  const b = svg.getBBox()
  r[f] = { x: b.x, y: b.y, w: b.width, h: b.height, vb: svg.getAttribute('viewBox') }
})
document.getElementById('out').textContent = JSON.stringify(r)
</script>`

const tmp = mkdtempSync(join(tmpdir(), 'svgcrop-'))
const html = join(tmp, 'measure.html')
writeFileSync(html, page)

const dom = execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=4000',
  '--dump-dom', `file://${html}`,
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)
if (!m) throw new Error('could not read measurements out of the rendered DOM')
const box = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
rmSync(tmp, { recursive: true, force: true })

const round = (n) => Math.round(n * 100) / 100

for (const f of files) {
  const b = box[f]
  if (!b || !b.w || !b.h) { console.log(`${f.padEnd(12)} SKIPPED — empty bbox`); continue }
  const pad = Math.max(b.w, b.h) * PAD
  const next = [round(b.x - pad), round(b.y - pad), round(b.w + pad * 2), round(b.h + pad * 2)].join(' ')

  const svg = readFileSync(join(DIR, f), 'utf8').replace(/viewBox="[^"]*"/, `viewBox="${next}"`)
  writeFileSync(join(DIR, f), svg)

  const [, , ow, oh] = b.vb.trim().split(/\s+/).map(Number)
  const saved = Math.round((1 - (b.w * b.h) / (ow * oh)) * 100)
  console.log(
    `${f.padEnd(12)} ${b.vb.padEnd(16)} -> ${next.padEnd(24)}` +
    `${saved > 0 ? `${saved}% dead space removed` : 'already tight'}`,
  )
}
console.log(`\ncropped ${files.length} files at ${PAD * 100}% padding`)
