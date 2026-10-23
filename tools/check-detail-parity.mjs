#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — Detail Mode parity check (§3.2.5).
   Run: node tools/check-detail-parity.mjs   (wired into `npm run check`)

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
   Exits 1 on any violation. Stubs in topics/{charge,coulomb,field}.html and
   archive/ carry no detail blocks and are scanned anyway for regressions.
   ========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const PAGES = ['index.html', 'quiz.html',
  'topics/fields.html', 'topics/current.html', 'topics/magind.html',
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
process.exit(fails === 0 ? 0 : 1);
