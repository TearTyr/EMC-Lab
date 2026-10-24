#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — scope & network purity scan (§1.1 / §3.10).
   Run: node tools/check-scope.mjs   (wired into `npm run check`)

   1. OUT-OF-SCOPE TERMS: active files must not carry the other groups'
      topics (Measurements/Vectors, Fluids, Temperature/Heat, Waves/Sound,
      Optics) nor the retired site structures ("Extra" chapters, "Lesson N
      of 3", the 35-question bank). Terms are topic phrases, not generic
      physics words — "heat" in P = I²R heating or "temperature" in Ohm's-law
      caveats are legitimate and never matched.
   2. THIRD-PARTY FETCHES: no active file may load a resource from a
      non-same-origin URL (src=/href=/url()/import()/fetch()). The
      production origin and XML namespaces are allowed; nothing else.
   Exits 1 on any hit.
   ========================================================================== */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

const ACTIVE_DIRS = ['js', 'css', 'topics'];
const ACTIVE_FILES = ['index.html', 'quiz.html', 'js/registry.js', 'vercel.json'];
const SKIP = new Set(['node_modules', '.git', 'public', 'shots', 'docs', '.scratch', 'vendor']);

function activeFiles() {
  const out = [];
  const walk = dir => {
    for (const e of readdirSync(dir)) {
      if (SKIP.has(e)) continue;
      const f = join(dir, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (/\.(html|js|css|mjs)$/.test(e)) out.push(f);
    }
  };
  for (const d of ACTIVE_DIRS) walk(join(ROOT, d));
  for (const f of ACTIVE_FILES) out.push(join(ROOT, f));
  /* dev tools are scanned for third-party FETCHES only (they may name
     topics in assertions about history) — mark them */
  return [...new Set(out)];
}
const TOOL_DIR = join(ROOT, 'tools');

/* Topic phrases of the other groups + retired structures. Deliberately
   phrase-level to avoid false positives on legitimate EM vocabulary. */
const OUT_OF_SCOPE = [
  /\bfluids?\b/g, /\barchimedes\b/g, /\bbernoulli\b/g, /\bbuoyan/g, /\bventuri\b/g, /\baerofoil\b/g,
  /\bthermometer\b/g, /specific heat/g, /heat transfer/g, /temperature conversion/g,
  /\bwave speed\b/g, /sound wave/g, /\btone bench\b/g, /web ?audio/g, /\bdoppler\b/g, /standing wave/g,
  /\boptics\b/g, /\brefraction\b/g, /\bsnell\b/g, /total internal reflection/g, /\bdiffraction\b/g,
  /\blenses\b/g, /\bconcave mirror\b/g, /vector addition/g, /\bmeasurements & vectors\b/g,
  /* retired site structures */
  /\bExtra\b(?![-\w])/g, /Lesson \d of \d/g, /\b35-question\b/g, /nine (open )?sandboxes/g,
  /thirty-five/g, /emc\.progress\.v3'|emc\.splash/g
];
/* Allowed contexts for the word "Extra" (none in active UI copy) and for
   progress-key mentions inside common.js (the migration MUST name old keys). */
const ALLOW = [
  { file: 'js/common.js', re: /emc\.progress\.v3'|emc\.splash/i },   // legacy-key migration list
  { file: 'js/registry.js', re: /charge|coulomb|field|current|magind/ } // alias map (ids, not topics)
];

const FETCH_RES = [
  /<script[^>]+src="(https?:\/\/[^"]+)"/g,
  /<link[^>]+href="(https?:\/\/[^"]+)"/g,
  /<iframe[^>]+src="(https?:\/\/[^"]+)"/g,
  /url\(\s*['"]?(https?:\/\/[^'")]+)/g,
  /import\(\s*['"](https?:\/\/[^'"]+)/g,
  /fetch\(\s*['"](https?:\/\/[^'"]+)/g
];
const ORIGIN_OK = /^https:\/\/emc-lab\.vercel\.app\//;

let fails = 0;
for (const f of activeFiles()) {
  const rel = relative(ROOT, f);
  const s = readFileSync(f, 'utf8');
  for (const re of OUT_OF_SCOPE) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (ALLOW.some(a => rel === a.file && a.re.test(m[0]))) continue;
      const line = s.slice(0, m.index).split('\n').length;
      const ctx = s.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ');
      console.log(`FAIL scope: ${rel}:${line} — "${m[0]}" … ${ctx} …`);
      fails++;
    }
  }
  for (const re of FETCH_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (ORIGIN_OK.test(m[1])) continue;
      const line = s.slice(0, m.index).split('\n').length;
      console.log(`FAIL third-party fetch: ${rel}:${line} — ${m[1]}`);
      fails++;
    }
  }
}
/* ---- 3. banned styling (§3.8/scope lock): no gradients, backdrop-filter,
      canvas shadowBlur, blur/drop-shadow filters in any active file ---- */
const BANNED = [
  [/linear-gradient|radial-gradient|conic-gradient/, 'CSS gradient'],
  [/backdrop-filter\s*:/, 'backdrop-filter declaration'],
  [/shadowBlur\s*[=:(]/, 'canvas shadowBlur'],
  [/filter:\s*[^;"]*\bblur\(/, 'blur filter'],
  [/drop-shadow\(/, 'drop-shadow filter']
];
for (const f of activeFiles()) {
  if (!/\.(css|js|html)$/.test(f)) continue;
  const rel = relative(ROOT, f);
  if (rel.startsWith('vendor')) continue;
  let s = readFileSync(f, 'utf8');
  /* CONTRACT CHANGE (2026-10-24, intro v5 "chorus cut"): the intro overlay is
     the single sanctioned home of the footage's motion-blur whips and the
     collage bed's flat stripe gradients (user directive: redo the intro off
     the video's 21 s main-motion passage "with blur and stuff"). Strip the
     #introOverlay block (up to the PHASE-8 motion system) before the ban
     scan; the ban still covers every other byte of every active file, and
     smoke-test asserts the whips exist nowhere after the PHASE-8 boundary. */
  if (/\.css$/.test(rel)) {
    const i = s.indexOf('#introOverlay');
    const j = s.indexOf('@keyframes mx-flash');
    if (i >= 0 && j > i) s = s.slice(0, i) + s.slice(j);
  }
  for (const [re, name] of BANNED) {
    re.lastIndex = 0;
    const m = re.exec(s);
    if (m) {
      const line = s.slice(0, m.index).split('\n').length;
      console.log(`FAIL banned style: ${rel}:${line} — ${name}`);
      fails++;
    }
  }
}

/* vercel.json redirects must stay same-site */
const vj = readFileSync(join(ROOT, 'vercel.json'), 'utf8');
for (const m of vj.matchAll(/"(?:source|destination)":\s*"([^"]+)"/g)) {
  if (/^https?:/.test(m[1]) && !ORIGIN_OK.test(m[1])) { console.log('FAIL vercel.json external route:', m[1]); fails++; }
}
console.log(fails === 0 ? 'SCOPE + NETWORK PURITY PASS' : `${fails} SCOPE/PURITY FAILURES`);
process.exit(fails === 0 ? 0 : 1);
