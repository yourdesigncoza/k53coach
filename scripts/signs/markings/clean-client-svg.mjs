#!/usr/bin/env node
/**
 * Clean the client-supplied marking SVGs (Linear K53-37) into glyph-shaped assets.
 *
 * The client batch is genuine vector but ships as illustrated scenes: an opaque
 * page background, baked-in caption text, nine different aspect ratios, and — on
 * RM12/RM13 — a fabricated second panel showing a "broken" line variant that does
 * not exist in SARTSM.
 *
 * This pass is mechanical and reversible; it does NOT fix the drawings that are
 * wrong (see client-svg/README.md). It:
 *
 *   1. drops the full-bleed background rect
 *   2. drops caption text, keeping road-surface lettering (STOP / YIELD / BUS / bay letters)
 *   3. drops the fabricated rm12-broken-panel / rm13-broken-panel groups
 *   4. normalises the ns0: prefix back to the default SVG namespace
 *   5. strips width/height from the root so viewBox alone drives sizing
 *
 * Cropping is a separate pass (crop-client-svg.mjs) because it needs a real
 * layout engine to measure.
 *
 *   node scripts/signs/markings/clean-client-svg.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, 'client-svg')
const OUT = join(HERE, 'client-svg-cleaned')

/** Text that is paint on the road, not a caption. Kept verbatim. */
const ROAD_LETTERING = /^(STOP|YIELD|BUS|TAXI|[A-Z]{1,3})$/

/** Groups that draw a marking variant with no basis in SARTSM. */
const FABRICATED_GROUPS = new Set(['rm12-broken-panel', 'rm13-broken-panel'])

/** Wrapper groups that exist only to hold captions. */
const CAPTION_GROUPS = new Set(['notes'])

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

function cleanOne(svg) {
  const notes = []

  // 1. ns0: -> default namespace
  if (svg.includes('ns0:')) {
    svg = svg
      .replace(/xmlns:ns0="([^"]+)"/, 'xmlns="$1"')
      .replace(/<ns0:/g, '<')
      .replace(/<\/ns0:/g, '</')
    notes.push('normalised ns0: prefix')
  }

  // 2. fabricated variant panels (whole <g id="...">...</g> subtree)
  for (const id of FABRICATED_GROUPS) {
    const re = new RegExp(`<g id="${id}"[\\s\\S]*?</g>\\s*(?=<g|</svg>)`, 'g')
    if (re.test(svg)) {
      svg = svg.replace(re, '')
      notes.push(`removed fabricated <g id="${id}">`)
    }
  }

  // 3. caption-only groups
  for (const id of CAPTION_GROUPS) {
    const re = new RegExp(`<g id="${id}"[\\s\\S]*?</g>\\s*(?=<g|</svg>)`, 'g')
    if (re.test(svg)) {
      svg = svg.replace(re, '')
      notes.push(`removed caption group <g id="${id}">`)
    }
  }

  // 4. remaining <text>: keep road lettering, drop captions
  svg = svg.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, (m) => {
    const t = strip(m)
    if (ROAD_LETTERING.test(t)) return m
    notes.push(`dropped caption text ${JSON.stringify(t.slice(0, 48))}`)
    return ''
  })

  // 5. full-bleed background rect. Some carry id="background", some are anonymous,
  //    so match on geometry: a rect at the origin exactly filling the viewBox.
  //    Pattern tiles are never viewBox-sized, so they are safe from this.
  const vb = svg.match(/viewBox="([\d.\-\s]+)"/)
  if (vb) {
    const [, , vw, vh] = vb[1].trim().split(/\s+/).map(Number)
    svg = svg.replace(/<rect\b[^>]*\/>\s*/g, (m) => {
      const num = (a) => Number((m.match(new RegExp(`\\s${a}="([\\d.\\-]+)"`)) || [])[1] ?? 0)
      const atOrigin = num('x') === 0 && num('y') === 0
      if (atOrigin && num('width') === vw && num('height') === vh) {
        notes.push('removed opaque background rect')
        return ''
      }
      return m
    })
  }

  // 6. root width/height -> viewBox only
  svg = svg.replace(/<svg\b[^>]*>/, (m) => {
    if (!/\swidth=|\sheight=/.test(m)) return m
    notes.push('stripped root width/height (viewBox now drives sizing)')
    return m.replace(/\s(width|height)="[^"]*"/g, '')
  })

  // tidy the blank lines the deletions leave behind
  svg = svg.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')
  return { svg, notes }
}

mkdirSync(OUT, { recursive: true })
const files = readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort()
const report = []

for (const f of files) {
  const { svg, notes } = cleanOne(readFileSync(join(SRC, f), 'utf8'))
  writeFileSync(join(OUT, f), svg)
  report.push({ file: f, bytes: svg.length, notes })
  console.log(`${f.padEnd(12)} ${String(svg.length).padStart(6)}b  ${notes.join('; ') || 'no change'}`)
}

writeFileSync(join(OUT, 'clean-report.json'), JSON.stringify(report, null, 2))
console.log(`\n${files.length} files -> ${OUT}`)
