#!/usr/bin/env node
/* Static checks, no browser and no server (about a second).
     node tools/check.mjs                 all of them
     node tools/check.mjs links physics   only these
   Exit code 1 if any check fails. Runtime tests are `node tools/verify.mjs`. */
import fs, { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/* ==========================================================================
   EMC Lab — static project validator

   What it checks
   --------------
   1. Every local href/src in every HTML file resolves to a file that exists.
   2. Every <script src> and <link href> points at a real file.
   3. No duplicate id attributes inside a single page.
   4. Every id referenced by a page's own scripts (getElementById, el('x'),
      bindRange('x', ...)) actually exists on that page.
   5. Every [data-*] hook queried by a page's scripts exists on that page.
   6. Every Tailwind-looking utility class used in the markup is covered by
      css/site.css, so the compiled layout cannot silently break.
   7. Every local anchor (#id) points at an id that exists on the same page.

   Exit code is 1 if any error is found (usable as a CI/pre-commit gate).
   ========================================================================== */
function links() {
  const errors = [];
  const warnings = [];
  const dataHookNotes = new Set();

  /* ---------- helpers ------------------------------------------------------ */
  function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else out.push(p);
    }
    return out;
  }
  const allFiles = walk(ROOT);
  const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
  const jsFiles = allFiles.filter(f => f.endsWith('.js'));
  const rel = p => relative(ROOT, p);

  /** ids injected into the DOM by scripts rather than written in the markup */
  const DYNAMIC_IDS = new Set([
    'toastHost', 'mascotPanel', 'mascotSay', 'quiz-retake', 'quiz-wrong',       // created by toasts / score-card buttons
    'quiz-charts', 'quiz-fallback-bars',            // injected with the score card markup
    'chart-score', 'chart-topics', 'chart-history', // Chart.js canvases inside the score card
    'bootFatal', 'bootFatalRetry',                  // loader failure card, built at runtime
    // phase 9 (written justification): the intro overlay's markup lives ONLY in
    // index.html by design (intro contract: plays on every bare landing-page
    // load). js/intro.js null-guards it (`if (!overlay) return;`) and js/motion.js
    // probes it only to yield the screen to a playing intro, so on every other
    // page the reference is intentionally absent-at-runtime, not broken.
    // Behaviour is covered by intro-verify and motion-verify (8/8).
    'introOverlay'
  ]);

  /* ---------- 1 & 2. local links and asset references ---------------------- */
  const ATTR_RE = /(?:href|src)\s*=\s*"([^"]+)"/g;
  for (const file of htmlFiles) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(ATTR_RE)) {
      const url = m[1].trim();
      if (/^(https?:|mailto:|data:|javascript:|#)/i.test(url)) continue;
      const path = url.split('#')[0].split('?')[0];
      if (!path) continue;
      const target = resolve(dirname(file), path);
      if (!existsSync(target)) errors.push(`${rel(file)}: broken reference -> ${url}`);
    }
  }

  /* ---------- 3. duplicate ids -------------------------------------------- */
  for (const file of htmlFiles) {
    const src = readFileSync(file, 'utf8');
    const seen = new Map();
    for (const m of src.matchAll(/\sid="([^"]+)"/g)) {
      seen.set(m[1], (seen.get(m[1]) || 0) + 1);
    }
    for (const [id, n] of seen) if (n > 1) errors.push(`${rel(file)}: duplicate id "${id}" (${n}x)`);
  }

  /* ---------- 4, 5 & 7. script <-> markup contract ------------------------ */
  /** ids referenced in a JS file */
  function referencedIds(js) {
    const ids = new Set();
    const patterns = [
      /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g,
      /\bel\(\s*['"]([^'"]+)['"]\s*\)/g,
      /bindRange\(\s*['"]([^'"]+)['"]/g
    ];
    for (const re of patterns) for (const m of js.matchAll(re)) ids.add(m[1]);
    return ids;
  }
  /** [data-x] and [data-x="y"] selectors queried in a JS file */
  function referencedDataHooks(js) {
    const hooks = new Set();
    for (const m of js.matchAll(/\[\s*(data-[a-z0-9-]+)\s*(?:=\s*"([^"]*)")?\s*\]/g)) {
      hooks.add({ attr: m[1], value: m[2] });
    }
    return [...hooks];
  }

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const pageIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

    // collect this page's own scripts
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
    let pageJs = '';
    for (const s of scripts) {
      const p = resolve(dirname(file), s);
      if (existsSync(p)) pageJs += readFileSync(p, 'utf8') + '\n';
    }

    for (const id of referencedIds(pageJs)) {
      // These ids are created by the scripts at runtime (toast host, score-card
      // buttons injected via innerHTML), so they are legitimately absent from
      // the static markup.
      if (DYNAMIC_IDS.has(id)) continue;
      if (!pageIds.has(id)) errors.push(`${rel(file)}: script references missing id "#${id}"`);
    }
    // Advisory only: querySelectorAll() happily returns an empty list, and
    // common.js is loaded by every page even though only some pages use a hook.
    for (const hook of referencedDataHooks(pageJs)) {
      const re = new RegExp(`${hook.attr}(?:="[^"]*")?`);
      if (!re.test(html)) dataHookNotes.add(`${rel(file)}: no [${hook.attr}] element (fine if the script guards for it)`);
    }

    // local anchors
    for (const m of html.matchAll(/href="#([^"]+)"/g)) {
      const id = m[1];
      if (!id) continue;
      if (!pageIds.has(id)) warnings.push(`${rel(file)}: anchor "#${id}" has no matching id on the page`);
    }
  }

  /* ---------- 6. Tailwind fallback coverage ------------------------------- */
  /* the committed Tailwind build is the offline/production source of utilities */
  const fallback = existsSync(join(ROOT, 'css/site.css'))
    ? readFileSync(join(ROOT, 'css/site.css'), 'utf8') : '';
  const coveredSelectors = new Set(
    [...fallback.matchAll(/\.(-?[a-zA-Z_][\w\-:.\\/[\]()%#,\s]*?)(?=[,{\s])/g)].map(m => m[1].replace(/\\/g, ''))
  );
  const usedUtilities = new Map();     // class -> [files]
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\sclass="([^"]+)"/g)) {
      for (const cls of m[1].split(/\s+/)) {
        if (!cls) continue;
        // Heuristic: a Tailwind utility contains a responsive/state prefix or a
        // known utility prefix. Semantic project classes live in css/input.css (@layer components).
        // A variant prefix (md:, hover:, ...) always means Tailwind.
        // Otherwise require a numeric/fractional value or a valueless utility,
        // so semantic project classes like "h-hero" or "ring-wrap" are skipped.
        const VALUELESS = new Set(['flex','grid','hidden','block','inline-block','inline-flex',
          'relative','absolute','sticky','fixed','italic','uppercase','lowercase','capitalize',
          'underline','no-underline','truncate','border','table','static']);
        const looksTailwind =
          /^(sm|md|lg|xl|2xl|hover|focus|focus-visible|group|dark|motion-safe|motion-reduce):/.test(cls) ||
          VALUELESS.has(cls) ||
          /^[a-z][a-z0-9-]*-(\d+|px|full|screen|auto|none|min|max|fit|xs|sm|md|lg|xl|\d+\/\d+)(\/\d+)?$/.test(cls) &&
          !/^(h|ring|row|table|defs|stat|topic|sim|ctl|q|opt|btn|card|panel|check|fig|legend|swatch|mascot|hero|brand|nav|site|scroll|wrap|footer|pager|score|grade|ic)-[a-z]/.test(cls);
        if (!looksTailwind) continue;
        if (!usedUtilities.has(cls)) usedUtilities.set(cls, []);
        usedUtilities.get(cls).push(rel(file));
      }
    }
  }
  let missing = 0;
  for (const [cls, files] of [...usedUtilities].sort()) {
    if (!coveredSelectors.has(cls)) {
      missing++;
      warnings.push(`utility "${cls}" used in ${[...new Set(files)].join(', ')} is missing from css/site.css (run npm run build:css)`);
    }
  }

  /* ---------- report ------------------------------------------------------- */
  const line = '\u2500'.repeat(64);
  console.log(line);
  console.log('EMC Lab — static project validation');
  console.log(line);
  console.log(`HTML pages ......... ${htmlFiles.length}`);
  console.log(`JS files ........... ${jsFiles.length}`);
  console.log(`Tailwind utilities . ${usedUtilities.size} used, ${usedUtilities.size - missing} present in css/site.css`);
  console.log('');

  if (errors.length) {
    console.log(`\u274C ${errors.length} ERROR(S):`);
    errors.forEach(e => console.log('   - ' + e));
  } else {
    console.log('\u2705 No errors: all links, scripts, ids and data hooks resolve.');
  }
  if (warnings.length) {
    console.log(`\n\u26A0  ${warnings.length} WARNING(S):`);
    warnings.forEach(w => console.log('   - ' + w));
  } else {
    console.log('\u2705 No warnings.');
  }
  if (dataHookNotes.size) {
    console.log(`\n\u2139  ${dataHookNotes.size} advisory note(s) on [data-*] hooks:`);
    [...dataHookNotes].forEach(n => console.log('   - ' + n));
  }
  console.log(line);
  return errors.length;
}

/* ==========================================================================
   EMC Lab — Detail Mode parity check (§3.2.5).

   Rules enforced on every active HTML page:
     1. BALANCE — within any parent element, the number of direct children
        carrying data-detail="tech" equals the number carrying "plain".
        (Pairs are siblings: the CSS shows exactly one level at a time, so an
        unpaired block means content that vanishes or duplicates on toggle.)
     2. READOUTS — a tech-gated element with an id may instead pair with a
        plain sibling whose id is `${id}-plain` (the JS-filled sim readouts).
        Both must exist; the pair counts toward balance.
     3. NOT IDENTICAL — a paired plain block must not be a copy of its tech
        block (normalized text equality fails), and must not be empty/thin
        (< 24 chars of text).
   Exits 1 on any violation. Stubs in topics/{charge,coulomb,field}.html
   carry no detail blocks and are scanned anyway for regressions.
   ========================================================================== */
function parity() {
  const PAGES = ['index.html', 'quiz.html',
    'topics/fields.html', 'topics/current.html',
    'topics/charge.html', 'topics/coulomb.html', 'topics/field.html'];

  /* Minimal structural scan: we need parent/child relationships, so build a
     tiny element tree from the tag stream (no external parser dependency). */
  function parse(html) {
    const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const root = { tag: '#root', children: [], attrs: {}, text: '' };
    const stack = [root];
    const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>|<([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      if (m[0].startsWith('<!--')) continue;
      if (m[1]) {                                  // closing tag
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === m[1].toLowerCase()) { stack.length = i; break; }
        }
        continue;
      }
      if (m[2]) {                                  // opening tag
        const tag = m[2].toLowerCase();
        const attrs = {};
        const are = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
        let a;
        while ((a = are.exec(m[3] || '')) !== null) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? '';
        const el = { tag, attrs, children: [], text: '', parent: stack[stack.length - 1], line: html.slice(0, m.index).split('\n').length };
        stack[stack.length - 1].children.push(el);
        if (!VOID.has(tag) && !/\/\s*$/.test(m[3] || '')) stack.push(el);
        continue;
      }
      if (m[4]) stack[stack.length - 1].text += m[4];   // text node
    }
    return root;
  }

  function* walk(el) {
    for (const c of el.children) { yield c; yield* walk(c); }
  }

  const norm = s => s.replace(/\s+/g, ' ').trim();
  function textOf(el) { return norm(el.text + ' ' + el.children.map(c => textOf(c)).join(' ')); }

  let fails = 0;
  const fail = (page, msg) => { fails++; console.log(`FAIL ${page}: ${msg}`); };

  for (const page of PAGES) {
    const html = readFileSync(join(ROOT, page), 'utf8');
    const tree = parse(html);
    const byParent = new Map();
    for (const el of walk(tree)) {
      const level = el.attrs['data-detail'];
      if (level !== 'tech' && level !== 'plain') continue;
      const key = el.parent;
      if (!byParent.has(key)) byParent.set(key, { tech: [], plain: [] });
      byParent.get(key)[level].push(el);
    }
    let blocks = 0;
    for (const [parent, groups] of byParent) {
      /* Rule 2 first: id-based readout pairing consumes matched elements. */
      const pairedTech = new Set(), pairedPlain = new Set();
      for (const t of groups.tech) {
        const id = t.attrs.id;
        if (!id) continue;
        const partner = groups.plain.find(pl => pl.attrs.id === id + '-plain' && !pairedPlain.has(pl));
        if (partner) { pairedTech.add(t); pairedPlain.add(partner); blocks++;
          const tt = textOf(t), pt = textOf(partner);
          /* JS-filled placeholders ('—') are equal by design pre-hydration; the
             fill code is asserted in the smoke test instead. */
          if (pt.length >= 24 && tt.length >= 24 && pt === tt) fail(page, `#${id}-plain is a copy of #${id}`);
        }
      }
      const tech = groups.tech.filter(t => !pairedTech.has(t));
      const plain = groups.plain.filter(p => !pairedPlain.has(p));
      /* Rule 1: the remaining blocks must balance inside this parent. */
      if (tech.length !== plain.length) {
        fail(page, `parent <${parent.tag}${parent.attrs.id ? '#' + parent.attrs.id : ''}${parent.attrs.class ? '.' + parent.attrs.class.split(' ')[0] : ''}> (line ~${(tech[0] || plain[0]).line}) has ${tech.length} tech vs ${plain.length} plain detail blocks`);
        continue;
      }
      /* Rule 3: pair in document order and compare. */
      for (let i = 0; i < tech.length; i++) {
        blocks++;
        const tt = textOf(tech[i]), pt = textOf(plain[i]);
        if (pt.length < 24) fail(page, `plain block at line ~${plain[i].line} is thin (${pt.length} chars)`);
        if (pt === tt) fail(page, `plain block at line ~${plain[i].line} is identical to its tech block`);
      }
    }
    console.log(`ok   ${page}: ${blocks} detail pairs balanced`);
  }
  console.log(fails === 0 ? 'DETAIL PARITY PASS' : `${fails} PARITY FAILURES`);
  return fails;
}

/* ==========================================================================
   EMC Lab — scope & network purity scan (§1.1 / §3.10).

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
function scope() {
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
    { file: 'js/registry.js', re: /charge|coulomb|field|current/ } // alias map (ids, not topics)
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
    const rel = relative(ROOT, f).split('\\').join('/');   // forward slashes so ALLOW matches on Windows too
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
  return fails;
}

/* ==========================================================================
   EMC Lab — palette gate. Every colour lives in one place: the :root tokens in
   css/input.css (CSS) and EMC.PALETTE in js/common.js (canvas and script).
     - css/input.css: no hex outside the token blocks (print rules and comments
       excepted), except pure #fff / #000. Use var(--token).
     - js/*.js: no hex outside the PALETTE table, except #fff / #000.
     - pages: hex is allowed (inline SVG art and the self-contained boot styles
       cannot read tokens) but only values that ARE in the palette.
   ========================================================================== */
function palette() {
  const read = f => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  const HEX = /#[0-9a-fA-F]{6}\b/g;
  const PURE = new Set(['#fff', '#000', '#ffffff', '#000000']);
  const stripBlock = (src, open) => {                   // remove "<open> { ... }" blocks (brace matched)
    let out = '', i = 0;
    for (;;) {
      const m = open.exec(src.slice(i));
      if (!m) return out + src.slice(i);
      const start = i + m.index, b = src.indexOf('{', start);
      let d = 0, j = b;
      for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; }
      out += src.slice(i, start); i = j + 1;
    }
  };
  const tokenBlocks = src => [...src.matchAll(/:root(?:\[data-theme="light"\])?\s*\{[^}]*\}/g)].map(m => m[0]).join('\n');

  const css = read('css/input.css');
  const approved = new Set([...tokenBlocks(css).matchAll(HEX)].map(m => m[0].toLowerCase()));
  const pal = /const PALETTE = Object\.freeze\(\{([\s\S]*?)\}\);/.exec(read('js/common.js'));
  if (!pal) { console.log('FAIL palette: PALETTE table not found in js/common.js'); return 1; }
  for (const m of pal[1].matchAll(HEX)) approved.add(m[0].toLowerCase());

  let fails = 0;
  const report = (rel, src, at, what, hint) => {
    const line = src.slice(0, at).split('\n').length;
    console.log('FAIL palette: ' + rel + ':' + line + ' - ' + what + ' ' + hint);
    fails++;
  };
  const scan = (rel, code, strict) => {
    for (const m of code.matchAll(HEX)) {
      const v = m[0].toLowerCase();
      if (PURE.has(v)) continue;
      if (strict) report(rel, code, m.index, v, 'literal: use the token or EMC.PALETTE');
      else if (!approved.has(v)) report(rel, code, m.index, v, 'is not in the palette');
    }
  };

  /* css: drop comments, token blocks and print rules, keep line numbers by blanking with newlines */
  let c = css.replace(/\/\*[\s\S]*?\*\//g, x => x.replace(/[^\n]/g, ' '));
  c = stripBlock(c, /@media\s+print/);
  c = c.replace(/:root(?:\[data-theme="light"\])?\s*\{[^}]*\}/g, x => x.replace(/[^\n]/g, ' '));
  scan('css/input.css', c, true);

  for (const f of readdirSync(join(ROOT, 'js')).filter(n => n.endsWith('.js'))) {
    let j = read('js/' + f);
    j = j.replace(/\/\*[\s\S]*?\*\//g, x => x.replace(/[^\n]/g, ' ')).replace(/(^|[^:\\'"\x60])\/\/.*$/gm, '$1');
    if (f === 'common.js') j = j.replace(/const PALETTE = Object\.freeze\(\{[\s\S]*?\}\);/, x => x.replace(/[^\n]/g, ' '));
    scan('js/' + f, j, true);
  }
  for (const p of ['index.html', 'quiz.html', ...readdirSync(join(ROOT, 'topics')).filter(n => n.endsWith('.html')).map(n => 'topics/' + n)]) {
    scan(p, read(p).replace(/<!--[\s\S]*?-->/g, x => x.replace(/[^\n]/g, ' ')), false);
  }
  console.log(fails === 0 ? 'PALETTE PASS' : fails + ' PALETTE FAILURES');
  return fails;
}

/* Physics gate: recomputes every lecture value and checks the quiz bank, the
   constants and the force softening against them.*/
function physics() {
  const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  let failed = 0;
  const ok = (name, pass, detail = '') => { if (!pass) failed++; console.log(`${pass ? '✅' : '❌'} ${name}${detail ? '  ' + detail : ''}`); };

  /* --- constants the site uses ------------------------------------------- */
  const common = read('js/common.js');
  const K = +common.match(/\bK:\s*([\d.e+-]+)/)[1];
  const E = +common.match(/\bE:\s*([\d.e+-]+)/)[1];
  const ME = +common.match(/M_ELECTRON:\s*([\d.e+-]+)/)[1];
  ok('k = 8.99×10⁹ N·m²/C² (lecture value)', K === 8.99e9, `got ${K}`);
  ok('e = 1.602×10⁻¹⁹ C', Math.abs(E - 1.602e-19) / 1.602e-19 < 1e-3, `got ${E}`);

  /* --- lecture reference values (independent of the sims) ---------------- */
  const rad = Math.PI / 180, F = (a, b, r) => K * Math.abs(a * b) / (r * r);
  const ex1 = F(3e-6, 7e-6, .15) - F(3e-6, 4e-6, .20);
  const fx2 = F(4e-6, 6e-6, .15) * Math.cos(73 * rad) + F(4e-6, 5e-6, .10);
  const fy2 = F(4e-6, 6e-6, .15) * Math.sin(73 * rad);
  const ex2 = Math.hypot(fx2, fy2), ang2 = Math.atan2(fy2, fx2) / rad;
  const e1 = K * 4e-6 / .49, eP = 2 * e1 * Math.sin(31 * rad);
  const bohr = Math.sqrt(K * E * E / (ME * 5.29e-11));
  const ref = {
    '1 C of electrons': [1 / E, 6.24e18], '±1 C at 1 km': [F(1, 1, 1000), 8.99e3],
    'Example 1 net force': [ex1, 5.69], 'Example 2 net force': [ex2, 22.7], 'Example 2 angle (°)': [ang2, 24],
    'E at P': [eP, 75595], 'Bohr speed': [bohr, 2.19e6], 'F on +18e-8 C': [18e-8 * 2, 3.6e-7], 'F on −24e-8 C': [24e-8 * 2, 4.8e-7]
  };
  for (const [n, [got, want]] of Object.entries(ref)) ok(n, Math.abs(got - want) / want < 0.01, `${got.toPrecision(5)} vs ${want}`);

  /* --- sandbox softening must not distort lecture-scale readouts --------- */
  const sm = +read('js/sandbox-core.js').match(/SOFT_MAX\s*=\s*([\d.e+-]+)/)[1];
  const worst = 1 - (0.10 ** 2) / (0.10 ** 2 + sm * sm);       // error at the smallest lecture distance
  ok('force softening < 0.1% at r = 0.10 m', worst < 1e-3, `SOFT_MAX = ${sm} m → ${(worst * 100).toFixed(4)}%`);

  /* --- quiz bank: the marked answer must equal the recomputed value ------ */
  const win = {}; vm.runInNewContext(read('js/quiz-data.js'), { window: win });
  const bank = win.EMC_QUIZ;
  ok('quiz has 16 questions, 4 options each', bank.length === 16 && bank.every(q => q.options.length === 4));
  const num = s => {
    const t = s.replace(/<sup>(.*?)<\/sup>/g, '^($1)').replace(/\u2212/g, '-').replace(/,/g, '');
    const m = t.match(/(-?\d+\.?\d*)\s*×\s*10\^\((-?\d+)\)/);
    return m ? +m[1] * 10 ** +m[2] : +t.match(/-?\d+\.?\d*/)[0];
  };
  const want = { 1: 12 / 4, 2: 2 + 3 + 5, 3: 1 / (1 / 6 + 1 / 3), 5: 2 * 2 * 10, 6: 12 - 12 / 6, 7: 12 * 4 / 12,
    8: 2 * 3 * .15, 9: 1 / E, 11: F(1, 1, 1000), 12: ex1, 13: ex2, 14: bohr, 15: eP, 16: 18e-8 * 2 };
  for (const q of bank) {
    if (!(q.id in want)) continue;
    const got = num(q.options[q.answer]);
    ok(`quiz #${q.id} marked answer`, Math.abs(got - want[q.id]) / want[q.id] < 0.005, `${q.options[q.answer].replace(/<[^>]+>/g, '')} vs ${want[q.id].toPrecision(4)}`);
  }
  console.log('ℹ  #4 and #10 are conceptual (no number to recompute) — reviewed by hand.');

  /* --- wording that must not come back ----------------------------------- */
  const pages = ['index.html', 'quiz.html', 'topics/current.html', 'topics/fields.html'].map(f => [f, read(f)]);
  for (const bad of [/7\.55\s*×\s*10/, /centrifugal/i, /charge ledger/i, /magnet/i, /Chapters? 3\b|Chapters 1 and 3/, /Chapter \d of 3\b|of 3 chapters/, /Twenty-four|\b24 questions|24-question/]) {
    const hit = pages.filter(([, t]) => bad.test(t)).map(([f]) => f);
    ok(`no ${bad} in pages`, !hit.length, hit.join(', '));
  }

  /* the same wrong values must not live in the scripts either (toasts, comments, readouts) */
  for (const f of fs.readdirSync(new URL('../js/', import.meta.url)).filter(n => n.endsWith('.js'))) {
    ok(`no 7.55×10⁴ in js/${f}`, !/7\.55\s*(×|\\u00D7)\s*10|7\.55×10⁴/.test(read('js/' + f)));
  }

  console.log(failed ? `\nPHYSICS CHECK FAILED (${failed})` : '\nPHYSICS CHECK PASS');
  return failed;
}

const checks = {
  links: ['every href/src/id/data hook/utility class in every page resolves', links],
  parity: ['Detail-on and Detail-off blocks stay in step on every chapter page', parity],
  scope: ['no third-party fetches, scope and network purity', scope],
  palette: ['colours come from the tokens and EMC.PALETTE, nothing off-palette', palette],
  physics: ['lecture values, constants and the quiz bank recomputed', physics]
};
const want = process.argv.slice(2);
const bad = want.filter(w => !checks[w]);
if (bad.length) { console.error('unknown check:', bad.join(', '), '- one of', Object.keys(checks).join(', ')); process.exit(2); }
const failed = [];
for (const [name, [about, fn]] of Object.entries(checks)) {
  if (want.length && !want.includes(name)) continue;
  console.log(`\n==== ${name} - ${about}`);
  if (fn()) failed.push(name);
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : '\nall checks passed');
process.exit(failed.length ? 1 : 0);
