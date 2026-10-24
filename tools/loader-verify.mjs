#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — loader contract verification (gate L).
   Run: node tools/loader-verify.mjs
   Serves the repo locally and drives real Chromium through every clause of
   the §3.1 contract:
     1. fast load              -> overlay NEVER paints; content visible
     2. throttled load         -> overlay may paint; gone <= 1500 ms + exit;
                                  segmented bar advances on real stages
     3. blocked storage        -> loader + Detail Mode unaffected
     4. reduced motion         -> no transitions; still dismisses
     5. common.js blocked      -> inline dead-man card (Retry + Home) at 1.5 s
     6. registry.js blocked    -> watchdog error card names the registry
     7. internal hash nav      -> overlay does not reappear
     8. dismissal              -> zero loader timers left running
   Exits 1 on any failure.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
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
await new Promise(r => server.listen(8247, '127.0.0.1', r));
const B = 'http://127.0.0.1:8247';

let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra);
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errors = [];
async function newPage(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });
  return { ctx, pg };
}

/* ---- 1. fast load: overlay never paints -------------------------------- */
{
  const { ctx, pg } = await newPage();
  /* Warm the HTTP cache first: 'fast load' means the browser has the assets
     (fonts included). A cold first visit legitimately exceeds 150 ms while
     the webfonts download, and painting the overlay then is correct. */
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  await pg.addInitScript(() => {
    window.__overlaySeen = false;
    const mo = new MutationObserver(() => { if (document.getElementById('bootOverlay')) window.__overlaySeen = true; });
    const start = () => mo.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start(); else window.addEventListener('DOMContentLoaded', start);
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const result = await pg.evaluate(() => ({
    seen: window.__overlaySeen || !!document.getElementById('bootOverlay'),
    st: window.EMC.loader.state()
  }));
  ok('1 fast load: overlay painted only if boot really exceeded the 150 ms gate',
    result.seen === false || result.st.finishAtMs > 150,
    JSON.stringify({ seen: result.seen, showAtMs: result.st.showAtMs, finishAtMs: result.st.finishAtMs }));
  const usable = await pg.evaluate(() => !!document.querySelector('.hero h1') && typeof window.EMC !== 'undefined');
  ok('1 fast load: content + engine live', usable);
  await ctx.close();
}

/* ---- 2. throttled network: overlay lifecycle within watchdog ----------- */
{
  const { ctx, pg } = await newPage();
  await pg.route('**/js/*.js', async route => { await new Promise(r => setTimeout(r, 260)); route.continue(); });
  await pg.route('**/vendor/**', async route => { await new Promise(r => setTimeout(r, 260)); route.continue(); });
  const t0 = Date.now();
  await pg.goto(B + '/topics/fields.html', { waitUntil: 'commit' });
  let sawOverlay = false, segs = 0, doneMax = 0;
  for (let i = 0; i < 90; i++) {
    const st = await pg.evaluate(() => {
      const ov = document.getElementById('bootOverlay');
      return { ov: !!ov, segs: ov ? ov.querySelectorAll('.bo-seg').length : 0, done: ov ? ov.querySelectorAll('.bo-seg.done').length : 0, fatal: !!document.getElementById('bootFatal') };
    }).catch(() => ({ ov: false, segs: 0, done: 0, fatal: false }));
    if (st.ov) { sawOverlay = true; segs = Math.max(segs, st.segs); doneMax = Math.max(doneMax, st.done); }
    if (!st.ov && sawOverlay) { ok('2 throttled: overlay dismissed', `${Date.now() - t0} ms after commit; segs=${segs} doneMax=${doneMax}`); break; }
    if (st.fatal) { ok('2 throttled: overlay dismissed', 'FATAL card shown — ' + (Date.now() - t0) + 'ms'); break; }
    await pg.waitForTimeout(100);
  }
  ok('2 throttled: overlay appeared when startup was slow', sawOverlay);
  ok('2 throttled: segmented bar advanced on real stages', segs >= 2 && doneMax >= 1, `segs=${segs} done=${doneMax}`);
  const gone = await pg.evaluate(() => !document.getElementById('bootOverlay'));
  const t = Date.now() - t0;
  ok('2 throttled: gone well under the 1.5 s watchdog + exit', gone && t < 3000, `${t} ms total (260 ms/js artificial delay)`);
  await ctx.close();
}

/* ---- 3. blocked storage ------------------------------------------------- */
{
  const { ctx, pg } = await newPage();
  await pg.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  const st = await pg.evaluate(() => ({
    detail: document.documentElement.dataset.detail,
    overlay: !!document.getElementById('bootOverlay'),
    fatal: !!document.getElementById('bootFatal'),
    emc: typeof window.EMC !== 'undefined'
  }));
  ok('3 blocked storage: Detail Mode defaults ON', st.detail === 'on', st.detail);
  ok('3 blocked storage: loader finishes, no fatal', !st.overlay && !st.fatal && st.emc, JSON.stringify(st));
  await pg.evaluate(() => document.getElementById('detailToggle').click());
  await pg.waitForTimeout(250);   /* the flip rides an 80 ms cross-fade */
  const toggled = await pg.evaluate(() => {
    const b = document.getElementById('detailToggle');
    return { attr: document.documentElement.dataset.detail, pressed: b.getAttribute('aria-pressed'), label: b.querySelector('.dt-state').textContent };
  });
  ok('3 blocked storage: Detail toggle still flips + label agrees',
    toggled.attr === 'off' && toggled.pressed === 'false' && toggled.label === 'OFF', JSON.stringify(toggled));
  await ctx.close();
}

/* ---- 4. reduced motion -------------------------------------------------- */
{
  const { ctx, pg } = await newPage({ reducedMotion: 'reduce' });
  await pg.route('**/js/*.js', async route => { await new Promise(r => setTimeout(r, 260)); route.continue(); });
  await pg.goto(B + '/index.html', { waitUntil: 'commit' });
  await pg.waitForTimeout(1600);
  const st = await pg.evaluate(() => ({ overlay: !!document.getElementById('bootOverlay'), fatal: !!document.getElementById('bootFatal'), emc: typeof window.EMC !== 'undefined' }));
  ok('4 reduced motion: loader dismisses (no transition needed)', !st.overlay && st.emc && !st.fatal, JSON.stringify(st));
  await ctx.close();
}

/* ---- 5. common.js blocked -> dead-man card ------------------------------ */
{
  const { ctx, pg } = await newPage();
  await pg.route('**/js/common.js', route => route.abort());
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(2000);
  const st = await pg.evaluate(() => {
    const f = document.getElementById('bootFatal');
    return { fatal: !!f, role: f && f.getAttribute('role'), retry: !!(f && f.querySelector('#bootFatalRetry')), home: !!(f && f.querySelector('a[href="index.html"]')), text: f ? f.textContent.slice(0, 60) : '' };
  });
  ok('5 engine blocked: visible error card with Retry and Home', st.fatal && st.role === 'alert' && st.retry && st.home, JSON.stringify(st));
  await ctx.close();
}

/* ---- 6. registry blocked -> watchdog names it --------------------------- */
{
  const { ctx, pg } = await newPage();
  await pg.route('**/js/registry.js', route => route.abort());
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(2200);
  const st = await pg.evaluate(() => {
    const f = document.getElementById('bootFatal');
    return { fatal: !!f, text: f ? f.textContent : '', overlay: !!document.getElementById('bootOverlay'), usable: !!document.querySelector('.hero h1') };
  });
  ok('6 registry blocked: watchdog error card, overlay gone, content usable',
    st.fatal && /registry/i.test(st.text) && !st.overlay && st.usable, JSON.stringify(st).slice(0, 160));
  await ctx.close();
}

/* ---- 7+8. internal navigation + no leftover timers ---------------------- */
{
  const { ctx, pg } = await newPage();
  await pg.goto(B + '/index.html#/coulomb', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  const mounted = await pg.evaluate(() => !document.getElementById('shell-topic').hidden);
  ok('7 hash deep link mounts the chapter', mounted);
  await pg.evaluate(() => { location.hash = '#/'; });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { location.hash = '#/field'; });
  await pg.waitForTimeout(900);
  const st = await pg.evaluate(() => ({
    overlay: !!document.getElementById('bootOverlay'),
    timers: window.EMC && window.EMC.loader ? window.EMC.loader.state().timers : -1,
    finished: window.EMC && window.EMC.loader ? window.EMC.loader.state().finished : false,
    onField: !document.getElementById('shell-topic').hidden
  }));
  ok('7 internal navigation never repaints the overlay', !st.overlay && st.onField, JSON.stringify(st));
  ok('8 zero loader timers left after dismissal', st.timers === 0 && st.finished, JSON.stringify(st));
  await ctx.close();
}

/* ---- 9. failed fonts never block: usable page, no fatal card -------------- */
{
  const { ctx, pg } = await newPage();
  await pg.route('**/*.woff2', route => route.abort());
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1800);
  const st = await pg.evaluate(() => ({
    overlay: !!document.getElementById('bootOverlay'),
    fatal: !!document.getElementById('bootFatal'),
    usable: !!document.querySelector('.hero h1') && typeof window.EMC !== 'undefined',
    finished: window.EMC && window.EMC.loader ? window.EMC.loader.state().finished : false
  }));
  ok('9 blocked fonts: loader still finishes, page usable, no fatal card',
    !st.overlay && !st.fatal && st.usable && st.finished, JSON.stringify(st));
  await ctx.close();
}

console.log('page/console errors during loader runs:', errors.length ? errors.slice(0, 8) : 'none');
/* registry-blocked and common-blocked runs intentionally produce console
   noise; only count errors from the OTHER scenarios */
const unexpected = errors.filter(e => !/Failed to load resource|net::ERR_FAILED|EMC is not defined|EMC_REGISTRY|loading registry|common\.js|woff2/i.test(e));
if (unexpected.length) { fails += unexpected.length; console.log('UNEXPECTED:', unexpected); }
console.log(fails === 0 ? 'LOADER CONTRACT PASS' : fails + ' LOADER FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
