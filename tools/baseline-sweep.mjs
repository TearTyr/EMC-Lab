/* Phase-1 baseline sweep: every page × key health signals. Writes JSON + shots. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'evidence', process.argv[2] || 'baseline');
fs.mkdirSync(OUT, { recursive: true });
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'archive', 'shots', 'evidence', 'docs', '.scratch'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8245, '127.0.0.1', r));
const B = 'http://127.0.0.1:8245';
const PAGES = ['/', '/quiz.html', '/topics/fields.html', '/topics/current.html', '/topics/magind.html'];
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const results = [];

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const r = { page: p, errors: [], failed: [], thirdParty: [], dupScripts: {} };
  pg.on('pageerror', e => r.errors.push(String(e).slice(0, 160)));
  pg.on('console', m => { if (m.type() === 'error') r.errors.push('console: ' + m.text().slice(0, 160)); });
  const seen = new Set();
  pg.on('request', req => {
    const u = new URL(req.url());
    if (/^https?:/.test(req.url()) && !req.url().startsWith(B)) r.thirdParty.push(req.url());
    if (req.url().startsWith(B) && /\.js(\?|$)/.test(u.pathname)) {
      if (seen.has(u.pathname)) r.dupScripts[u.pathname] = (r.dupScripts[u.pathname] || 1) + 1;
      seen.add(u.pathname);
    }
  });
  pg.on('requestfailed', req => r.failed.push(req.url().slice(0, 120)));
  pg.on('response', res => { if (res.status() >= 400) r.failed.push(res.status() + ' ' + res.url().slice(0, 120)); });
  // CLS instrumentation before load
  await pg.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const t0 = Date.now();
  await pg.goto(B + p, { waitUntil: 'load' });
  // loader timing: poll for overlay removal up to 6s
  let overlayGoneMs = null;
  for (let i = 0; i < 120; i++) {
    const there = await pg.evaluate(() => !!document.getElementById('bootOverlay')).catch(() => null);
    if (there === false) { overlayGoneMs = Date.now() - t0; break; }
    await pg.waitForTimeout(50);
  }
  r.overlayGoneMs = overlayGoneMs;
  r.hasEMC = await pg.evaluate(() => typeof window.EMC !== 'undefined').catch(() => false);
  // detail toggle functional?
  r.detailToggle = await pg.evaluate(() => {
    const btn = document.getElementById('detailToggle');
    if (!btn) return 'absent';
    const before = document.documentElement.dataset.detail;
    btn.click();
    const after = document.documentElement.dataset.detail;
    return before === after ? 'DEAD (no state change)' : `works ${before}->${after}`;
  }).catch(e => 'err: ' + String(e).slice(0, 80));
  r.cls = await pg.evaluate(() => window.__cls).catch(() => null);
  // overflow at 3 widths
  r.overflow = {};
  for (const w of [360, 390, 640, 900, 1200, 1440]) {
    await pg.setViewportSize({ width: w, height: 900 });
    await pg.waitForTimeout(150);
    r.overflow[w] = await pg.evaluate(() => {
      const de = document.documentElement;
      const bad = [];
      if (de.scrollWidth > de.clientWidth + 1) bad.push('html scrollWidth ' + de.scrollWidth + '>' + de.clientWidth);
      const clipped = el => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const ox = getComputedStyle(a).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
        }
        return false;
      };
      document.querySelectorAll('body *').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        const rr = el.getBoundingClientRect();
        /* offscreen skip links (left:-9999px) are the standard a11y pattern;
           elements inside intentional scroll/clip containers (formula tables,
           the question navigator rail) are spec'd to scroll, not overflow */
        if (rr.width > 0 && (rr.right > de.clientWidth + 2 || (rr.left < -2 && cs.position !== 'fixed' && rr.right > 0)) && cs.position !== 'fixed' && !clipped(el)) {
          if (bad.length < 5) bad.push((el.id || el.className || el.tagName).toString().slice(0, 40) + ' L' + Math.round(rr.left) + ' R' + Math.round(rr.right));
        }
      });
      return bad;
    }).catch(() => ['eval err']);
  }
  await pg.setViewportSize({ width: 1280, height: 900 });
  await pg.screenshot({ path: path.join(OUT, 'page' + p.replace(/\//g, '_') + '.png'), fullPage: false });
  results.push(r);
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'sweep.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify(results.map(r => ({
  page: r.page, hasEMC: r.hasEMC, overlayGoneMs: r.overlayGoneMs, errors: r.errors.length,
  thirdParty: r.thirdParty.length, failed: r.failed.length, detail: r.detailToggle, cls: +(r.cls ?? -1).toFixed(4),
  overflow: [360, 390, 640, 900, 1200, 1440].map(w => (r.overflow[w] || []).length).join('/')
})), null, 1));
await browser.close(); server.close(); process.exit(0);
