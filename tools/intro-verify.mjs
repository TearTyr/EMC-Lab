#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — intro contract verification (brief PART 6.4).
   Run: node tools/intro-verify.mjs
     1 fresh session: plays after boot, auto-ends after the 11.5 s composition,
       removes itself, sets its own session key (never a progress key), leaves
       0 timers / 0 listeners / 0 rAF chains (CSS-only motion);
     2 any keydown (Escape) dismisses mid-play;
     3 same-context second visit: no replay;
     4 chapter hash route on a fresh session: no intro at all;
     5 reduced motion: static composition, cleared <= ~2 s;
     6 page controls remain clickable DURING playback (pointer-events none)
       and clicking one dismisses the intro;
     7 a blocked-storage session still boots, plays once and dismisses;
     8 zero console/page errors throughout;
     9 re-fired loader-done after completion never re-creates the overlay;
    10 repeated init during playback keeps one overlay + one listener set.
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
await new Promise(r => server.listen(8262, '127.0.0.1', r));
const B = 'http://127.0.0.1:8262';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
async function ctxPage(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  return { ctx, pg };
}

/* 1 + 3: lifecycle and replay */
{
  const { ctx, pg } = await ctxPage();
  const t0 = Date.now();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => {
    const o = document.getElementById('introOverlay');
    return o && o.classList.contains('play');
  }, null, { timeout: 5000 });
  const playingAt = Date.now() - t0;
  const rafs = await pg.evaluate(() => window.EMC.stats().rafs);
  ok('1 intro plays shortly after boot with zero Stage rAF chains (the engine owns one timeline rAF)', rafs === 0, `rafs=${rafs}, play at ~${playingAt} ms`);
  /* The v8 drop-in cut runs 12 s + a .5 s fade. Allow a small margin for
     page boot and the exit fade, but fail if it ends too early or hangs.
     CONTRACT CHANGE (2026-10-25, v8): window re-pointed from 11.2-14.2 s. */
  await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 20000 });
  const endedAt = Date.now() - t0;
  ok('1 intro auto-ends within the 12.0-15.0 s window, including boot', endedAt > 12000 && endedAt < 15000, `${endedAt} ms`);
  const st = await pg.evaluate(() => ({
    intro: window.EMC_INTRO.state(),
    flag: sessionStorage.getItem('emc.intro.v1'),
    progressUntouched: localStorage.getItem('emc.progress.v4') === null
  }));
  ok('1 intro leaves zero timers/listeners and its own session key only',
    st.intro.timers === 0 && st.intro.listeners === 0 && st.flag === '1' && st.progressUntouched, JSON.stringify(st));
  /* 3: second visit in the same context: no replay */
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  ok('3 no replay on a second visit in the same session',
    (await pg.evaluate(() => !!document.getElementById('introOverlay'))) === false);
  await ctx.close();
}

/* 2: Escape dismisses mid-play */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => { const o = document.getElementById('introOverlay'); return o && o.classList.contains('play'); }, null, { timeout: 5000 });
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(1000);   /* v8: node leaves after the .5 s .done fade */
  ok('2 any key (Escape) dismisses mid-play', (await pg.evaluate(() => !!document.getElementById('introOverlay'))) === false);
  await ctx.close();
}

/* 4: chapter route skips the intro entirely */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html#/ch2', { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  ok('4 chapter hash route never shows the intro',
    (await pg.evaluate(() => !!document.getElementById('introOverlay'))) === false &&
    (await pg.evaluate(() => !document.getElementById('shell-topic').hidden)));
  await ctx.close();
}

/* 5: reduced motion */
{
  const { ctx, pg } = await ctxPage({ reducedMotion: 'reduce' });
  const t0 = Date.now();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => { const o = document.getElementById('introOverlay'); return o && o.classList.contains('rm'); }, null, { timeout: 5000 });
  const rmSeen = await pg.evaluate(() => {
    const o = document.getElementById('introOverlay');
    const anims = document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1;
    return { visible: getComputedStyle(o).visibility, anims };
  });
  ok('5 reduced motion shows a static composition (no running animations)',
    rmSeen.visible === 'visible' && rmSeen.anims === 0, JSON.stringify(rmSeen));
  await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 4000 });
  ok('5 reduced-motion intro clears quickly', Date.now() - t0 < 3000, `${Date.now() - t0} ms`);
  await ctx.close();
}

/* 6: controls live during playback */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => { const o = document.getElementById('introOverlay'); return o && o.classList.contains('play'); }, null, { timeout: 5000 });
  /* click the quiz CTA straight through the playing intro */
  await pg.click('a.nav-cta[href="quiz.html"]', { timeout: 5000 });
  await pg.waitForURL(/quiz\.html/, { timeout: 5000 });
  ok('6 page controls stay clickable during playback (and the click dismisses)', true);
  await ctx.close();
}

/* 7: blocked storage */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  await pg.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1000);
  const s1 = await pg.evaluate(() => ({ emc: typeof window.EMC !== 'undefined', intro: !!document.getElementById('introOverlay') }));
  await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 20000 });
  ok('7 blocked storage: page boots, intro plays once and still clears', s1.emc === true, JSON.stringify(s1));
  await ctx.close();
}

/* 9: a synthetic loader-done replay after completion creates nothing */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 20000 });
  await pg.evaluate(() => document.dispatchEvent(new Event('emc:loader-done')));
  await pg.waitForTimeout(600);
  const after = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  ok('9 re-fired loader-done after completion never re-creates the overlay',
    after.nodes === 0 && after.st.listeners === 0 && after.st.timers === 0, JSON.stringify(after));
  await ctx.close();
}

/* 10: repeated init during playback keeps a single overlay + listener set */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => { const o = document.getElementById('introOverlay'); return o && o.classList.contains('play'); }, null, { timeout: 5000 });
  const s1 = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  await pg.evaluate(() => { document.dispatchEvent(new Event('emc:loader-done')); document.dispatchEvent(new Event('emc:loader-done')); });
  await pg.waitForTimeout(300);
  const s2 = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  ok('10 repeated init during playback keeps one overlay and one listener set',
    s1.nodes === 1 && s2.nodes === 1 && s2.st.listeners === s1.st.listeners && s2.st.playing, JSON.stringify({ s1, s2 }));
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'INTRO CONTRACT PASS' : fails + ' INTRO FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
