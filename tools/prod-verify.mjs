#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — PRODUCTION-LAYOUT verification (public/, hashed asset names).
   Run: npm run build:public && node tools/prod-verify.mjs
   (public/ is auto-built when missing.)

   WHY THIS GATE EXISTS: every behavioural gate in this repo serves the
   SOURCE layout (js/common.js). The production build content-hashes assets
   (js/common.<hash>.js), and name-matching logic that works on source names
   can silently fail on hashed ones. That exact class of bug shipped once:
   shell.js's script skip-list substring-matched 'common.js', missed
   'common.58f7f516.js', and re-executed the engine on every chapter mount —
   double-binding the Detail toggle (dead after one flip), the topics
   dropdown and the mobile menu (dead after the first chapter visit).
   This gate runs the affected contracts against public/ so a source-only
   suite can never again pass while production is broken.

   Checks:
     1 the engine object survives shell chapter mounts unchanged (no re-exec)
     2 no #bootOverlay is ever re-created during a mount
     3 the Detail toggle flips on every click AFTER a chapter mount (x2 mounts)
     4 the topics dropdown opens/closes AFTER a chapter mount
     5 the mobile nav menu opens at 360 px AFTER a chapter mount
     6 sims still initialise inside the mounted chapter (stage-ready fired)
     7 zero page/console errors throughout
   Exits 1 on any failure.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const PUB = path.join(ROOT, 'public');

if (!fs.existsSync(path.join(PUB, 'index.html'))) {
  console.log('public/ missing — building…');
  execFileSync(process.execPath, [path.join(ROOT, 'tools/build-public.mjs')], { stdio: 'inherit' });
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(PUB, u);
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(8299, '127.0.0.1', r));
const B = 'http://127.0.0.1:8299';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
pg.on('pageerror', e => errors.push(String(e).slice(0, 160)));
pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

await pg.goto(B + '/index.html', { waitUntil: 'load' });

/* clear the intro (a fresh session plays it; this gate is about the shell) */
await pg.waitForFunction(() => {
  const o = document.getElementById('introOverlay');
  return o && o.classList.contains('play');
}, null, { timeout: 8000 });
await pg.click('#introSkip');
await pg.waitForTimeout(1000);   /* v8: node leaves after the .5 s .done fade */
ok('0 intro skipped; homepage interactive', await pg.evaluate(() => !document.getElementById('introOverlay')));

/* mark the engine + watch for loader overlays re-appearing during mounts */
await pg.evaluate(() => {
  window.EMC.__prodVerifyMark = 'engine-v1';
  window.__overlays = 0;
  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) if (n.id === 'bootOverlay') window.__overlays++;
  }).observe(document.body, { childList: true });
});

const lvl = () => pg.evaluate(() => document.documentElement.dataset.detail);
async function flipExpect(want) {
  await pg.click('#detailToggle');
  await pg.waitForTimeout(420);                 // 80 ms fade + settle
  return (await lvl()) === want;
}

/* ---- mount #/ch1 through a real card click (the shell intercepts it) ---- */
await pg.locator('a[href="topics/current.html"]:visible').first().click();
await pg.waitForFunction(() => location.hash === '#/ch1', null, { timeout: 4000 });
await pg.waitForFunction(() => !document.getElementById('shell-topic').hidden &&
  document.getElementById('shell-topic-body').innerHTML.length > 500, null, { timeout: 6000 });
await pg.waitForTimeout(1500);

ok('1 engine object unchanged after chapter mount (no common.js re-exec)',
  await pg.evaluate(() => window.EMC.__prodVerifyMark === 'engine-v1'));
ok('2 no boot overlay re-created during mount',
  (await pg.evaluate(() => window.__overlays)) === 0);
ok('3a Detail toggle flips ON→OFF after a chapter mount', await flipExpect('off'));
ok('3b Detail toggle flips OFF→ON after a chapter mount', await flipExpect('on'));

/* ---- dropdown must still work after the mount ---- */
await pg.click('#topicsBtn');
await pg.waitForTimeout(250);
const ddOpen = await pg.evaluate(() => document.getElementById('topicsMenu').classList.contains('open'));
await pg.click('#topicsBtn');
await pg.waitForTimeout(250);
const ddClosed = await pg.evaluate(() => !document.getElementById('topicsMenu').classList.contains('open'));
ok('4 topics dropdown opens AND closes after a chapter mount', ddOpen && ddClosed, `open=${ddOpen} closed=${ddClosed}`);

/* ---- sims initialise inside the mounted chapter (lazy: whenNear fires on
       approach, so walk every sim panel into view before asserting) ---- */
const panels = await pg.evaluate(() =>
  [...document.querySelectorAll('#shell-topic [id$="-panel"]')].map(p => p.id));
for (const id of panels) {
  await pg.evaluate(pid => {
    const p = document.getElementById(pid);
    if (p) p.scrollIntoView({ block: 'center' });
  }, id);
  await pg.waitForTimeout(1600);
}
const simState = await pg.evaluate(() => ({
  canvases: document.querySelectorAll('#shell-topic canvas').length,
  pending: document.querySelectorAll('#shell-topic .panel[data-sim-pending]').length,
  painted: [...document.querySelectorAll('#shell-topic canvas')].every(c => c.width > 1),
}));
ok('6 mounted chapter sims initialise on approach (canvases live, none stuck pending)',
  simState.canvases >= 2 && simState.pending === 0 && simState.painted, JSON.stringify(simState));

/* ---- second mount: ch2, then back to ch1 — bindings must not accumulate ---- */
await pg.evaluate(() => { location.hash = '#/ch2'; });
await pg.waitForFunction(() => !document.getElementById('shell-topic').hidden &&
  document.getElementById('shell-topic-body').innerHTML.length > 500, null, { timeout: 8000 });
await pg.waitForTimeout(1200);
ok('1b engine still unchanged after a SECOND mount',
  await pg.evaluate(() => window.EMC.__prodVerifyMark === 'engine-v1'));
ok('3c Detail toggle still flips after two mounts', await flipExpect('off'));
await pg.evaluate(() => { location.hash = '#/'; });
await pg.waitForTimeout(700);
await pg.evaluate(() => { location.hash = '#/ch1'; });
await pg.waitForTimeout(1500);
ok('3d Detail toggle still flips after home→ch1 re-entry', await flipExpect('on'));
ok('2b still zero boot overlays across all switches',
  (await pg.evaluate(() => window.__overlays)) === 0);

/* ---- mobile menu after chapter visits ---- */
await pg.setViewportSize({ width: 360, height: 740 });
await pg.waitForTimeout(400);
await pg.click('#navToggle');
await pg.waitForTimeout(300);
const menuOpen = await pg.evaluate(() => document.getElementById('navMenu').classList.contains('open'));
ok('5 mobile nav menu opens at 360 px after chapter mounts', menuOpen);

console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
ok('7 zero page/console errors', errors.length === 0);

console.log(fails === 0 ? 'PRODUCTION-LAYOUT VERIFICATION PASS' : fails + ' PRODUCTION-LAYOUT FAILURES');
await browser.close(); server.close();
process.exit(fails === 0 ? 0 : 1);
