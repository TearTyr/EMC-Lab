#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — responsive verification in a REAL browser.
   Run: node tools/responsive-verify.mjs
   Every page and chapter route at 3440x1440, 1366x768, 1024x768, 768x1024,
   390x844 and 844x390 (after scrolling the whole page so lazy and
   reveal-gated blocks have run):
     1 the page never scrolls sideways (this used to fail on Chapter 2: blocks
       waiting to be revealed sit at a tilt/scale that stuck out past the edge)
     2 no VISIBLE element pokes past the viewport (so the fix above is not just
       hiding real overflow) — scrolling containers are excluded
     3 interactive controls are at least 24 px in both directions (WCAG 2.5.8),
       measured on a coarse-pointer phone profile; inline links in running text
       are exempt
     4 every KaTeX equation renders (no .katex-error), none is shrunk below 13 px
   Exits 1 on any failure.
   ========================================================================== */
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';
import { skipIntroOnLoad } from './intro-bypass.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'shots', 'docs', '.scratch', 'Video'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8265, '127.0.0.1', r));
const B = 'http://127.0.0.1:8265';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const VIEWPORTS = [[3440, 1440], [1366, 768], [1024, 768], [768, 1024], [390, 844], [844, 390]];
const PAGES = ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html', '/index.html#/ch1', '/index.html#/ch2'];

async function visit(url, vp, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, ...extra });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(skipIntroOnLoad);
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  await pg.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    scrollTo(0, 0);
  });
  await pg.waitForTimeout(500);
  return { ctx, pg };
}

/* 1 + 2 + 4: layout at every viewport */
for (const url of PAGES) {
  const bad = [];
  for (const vp of VIEWPORTS) {
    const { ctx, pg } = await visit(url, vp);
    const r = await pg.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sideways = document.documentElement.scrollWidth - vw;
      const poking = [];
      document.querySelectorAll('.emc-main *').forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
        if (e.closest('[data-mx]:not(.mx-in), [hidden], [inert]')) return;   // waiting to be revealed / not shown
        const b = e.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || (b.right <= vw + 1 && b.left >= -1)) return;
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.scrollWidth >= p.clientWidth) return;   // inside its own scroller
        }
        poking.push((e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') || e.tagName);
      });
      return { sideways, poking: [...new Set(poking)].slice(0, 4), katexErr: document.querySelectorAll('.katex-error').length,
        tinyMath: [...document.querySelectorAll('.katex')].filter(k => k.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(k).fontSize) < 13).length };
    });
    if (r.sideways > 0 || r.poking.length || r.katexErr || r.tinyMath) bad.push(`${vp[0]}x${vp[1]} ${JSON.stringify(r)}`);
    await ctx.close();
  }
  ok(`${url}: no sideways scroll, nothing visible past the edge, equations render legibly at all 6 viewports`, bad.length === 0, bad.join(' | '));
}

/* 3: touch-target minimums on a coarse-pointer phone profile */
for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
  const { ctx, pg } = await visit(url, [390, 844], { hasTouch: true, isMobile: true });
  const small = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=button],[role=radio],[role=slider],[tabindex="0"]').forEach(e => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || e.closest('[hidden],[inert],.skip-link')) return;
      const b = e.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      if (e.tagName === 'A' && e.closest('p,li,small,.tiny,.small,.where,figcaption') && cs.display === 'inline') return;   // inline text link in a sentence
      if (e.tagName === 'INPUT' && (e.type === 'checkbox' || e.type === 'radio') && e.closest('label')) return;       // the label is the target
      if (Math.min(b.width, b.height) < 24) out.push(`${e.tagName}${e.id ? '#' + e.id : ''}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/)[0] : ''} ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    return [...new Set(out)];
  });
  ok(`${url}: every control is at least 24x24 px on a phone`, small.length === 0, small.slice(0, 5).join(' | '));
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'RESPONSIVE CONTRACT PASS' : fails + ' RESPONSIVE FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
