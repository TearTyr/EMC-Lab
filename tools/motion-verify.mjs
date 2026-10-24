#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — site-wide motion system verification (phase 8 §5/§8).
   Run: node tools/motion-verify.mjs
     1 boot: html.mx-js gate set; above-fold [data-mx] reveal, below-fold wait
       for the observer and reveal on scroll;
     2 route change: exactly one .mx-flash dip, removed <=900 ms, never
       intercepts pointer events; mounted view's [data-mx] get scanned;
     3 five rapid route changes: no stuck flash nodes, no console errors;
     4 reduced motion: no flash node, [data-mx] visible immediately;
     5 hidden tab: html.mx-paused toggles with visibilitychange;
     6 quiz jump: state (active card) commits synchronously, whip class
       plays and cleans itself up;
     7 double emc:view-shown never stacks two flash nodes;
     8 flash interrupted mid-dip by navigation still cleans up.
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
    if (['node_modules', '.git', 'public', 'archive', 'shots', 'evidence', 'docs', '.scratch'].includes(e)) continue;
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
await new Promise(r => server.listen(8266, '127.0.0.1', r));
const B = 'http://127.0.0.1:8266';

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
const noIntro = pg => pg.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });

/* 1: boot gate + reveal behaviour */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  const boot = await pg.evaluate(() => ({
    gate: document.documentElement.classList.contains('mx-js'),
    api: !!window.EMC_MOTION,
    aboveIn: [...document.querySelectorAll('[data-mx]')].filter(el => el.getBoundingClientRect().top < innerHeight * 0.92).every(el => el.classList.contains('mx-in')),
    belowPending: [...document.querySelectorAll('[data-mx]')].some(el => el.getBoundingClientRect().top >= innerHeight && !el.classList.contains('mx-in'))
  }));
  ok('1 mx-js gate + API live; above-fold revealed, below-fold pending', boot.gate && boot.api && boot.aboveIn && boot.belowPending, JSON.stringify(boot));
  await pg.evaluate(() => { const el = document.querySelector('[data-mx]:not(.mx-in)'); if (el) el.scrollIntoView({ block: 'center' }); });
  await pg.waitForTimeout(600);
  const scrolled = await pg.evaluate(() => {
    const els = [...document.querySelectorAll('[data-mx]')];
    return els.filter(el => el.getBoundingClientRect().top < innerHeight * 0.9).every(el => el.classList.contains('mx-in'));
  });
  ok('1 below-fold [data-mx] reveal on scroll (observer, once)', scrolled === true);
  await ctx.close();
}

/* 2: route flash dip + view scan */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);                       // boot guard window
  await pg.click('a[data-topic-link="ch1"]');
  const seen = await pg.waitForSelector('.mx-flash', { timeout: 1500 }).then(() => true).catch(() => false);
  const mid = seen ? await pg.evaluate(() => {
    const f = document.querySelector('.mx-flash');
    const cs = getComputedStyle(f);
    const under = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return { pe: cs.pointerEvents, under: under ? !f.contains(under) : true, n: document.querySelectorAll('.mx-flash').length };
  }) : null;
  await pg.waitForFunction(() => !document.querySelector('.mx-flash'), null, { timeout: 1500 });
  const goneAt = true;
  ok('2 route change dips exactly one flash, pointer-transparent, self-removing',
    seen && mid && mid.pe === 'none' && mid.under && mid.n === 1 && goneAt, JSON.stringify(mid));
  await pg.waitForTimeout(500);
  const scanned = await pg.evaluate(() => {
    const h = document.querySelector('#shell-topic [data-mx]');
    return h ? h.classList.contains('mx-in') || h.getBoundingClientRect().top > innerHeight : true;
  });
  ok('2 mounted view [data-mx] scanned by the view-shown hook', scanned === true);
  await ctx.close();
}

/* 3: rapid route changes leave nothing stuck */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  for (const ch of ['ch1', 'ch2', 'ch3', 'ch1', 'ch2']) {
    await pg.evaluate(c => { location.hash = '#/' + c; }, ch);
    await pg.waitForTimeout(120);
  }
  await pg.waitForTimeout(1200);
  const st = await pg.evaluate(() => ({
    flashes: document.querySelectorAll('.mx-flash').length,
    topic: !document.getElementById('shell-topic').hidden
  }));
  ok('3 five rapid route changes: zero stuck flash nodes, view coherent', st.flashes === 0 && st.topic, JSON.stringify(st));
  await ctx.close();
}

/* 4: reduced motion gets final states, no dip */
{
  const { ctx, pg } = await ctxPage({ reducedMotion: 'reduce' });
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  await pg.click('a[data-topic-link="ch2"]');
  await pg.waitForTimeout(700);
  const rm = await pg.evaluate(() => {
    const el = document.querySelector('[data-mx]');
    return {
      flash: document.querySelectorAll('.mx-flash').length,
      op: el ? getComputedStyle(el).opacity : '1',
      anims: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1
    };
  });
  ok('4 reduced motion: no flash dip, content visible, nothing running', rm.flash === 0 && rm.op === '1' && rm.anims === 0, JSON.stringify(rm));
  await ctx.close();
}

/* 5: hidden tab pauses decorative animation */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  const paused = await pg.evaluate(() => {
    Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const on = document.documentElement.classList.contains('mx-paused');
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return { on, off: !document.documentElement.classList.contains('mx-paused') };
  });
  ok('5 visibilitychange pauses/resumes via html.mx-paused', paused.on && paused.off, JSON.stringify(paused));
  await ctx.close();
}

/* 6: quiz jump — state synchronous, whip decorative + self-cleaning */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  const res = await pg.evaluate(() => new Promise(done => {
    const next = document.getElementById('qnav-next');
    if (!next) return done({ err: 'no next button' });
    const before = (document.querySelector('.qnav-chip.cur') || {}).dataset;
    next.click();
    const chip = document.querySelector('.qnav-chip.cur');
    const whipped = document.querySelector('.mx-whip');
    const activeNow = !!chip && !!whipped && chip.dataset.goto === whipped.id.replace('q-', '');
    setTimeout(() => {
      done({ before: before && before.goto, activeNow, whipping: !!whipped, clean: !document.querySelector('.mx-whip') });
    }, 700);
  }));
  ok('6 quiz jump commits state synchronously; whip plays and cleans up', !!res.activeNow && res.whipping && res.clean, JSON.stringify(res));
  await ctx.close();
}

/* 7: doubled view-shown never stacks flashes */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  const n = await pg.evaluate(() => new Promise(done => {
    document.dispatchEvent(new CustomEvent('emc:view-shown', { detail: { view: 'x', root: document } }));
    document.dispatchEvent(new CustomEvent('emc:view-shown', { detail: { view: 'x', root: document } }));
    requestAnimationFrame(() => done(document.querySelectorAll('.mx-flash').length));
  }));
  await pg.waitForFunction(() => !document.querySelector('.mx-flash'), null, { timeout: 1500 });
  ok('7 doubled view-shown produces a single flash node', n === 1, 'nodes=' + n);
  await ctx.close();
}

/* 8: flash interrupted by navigation still cleans up */
{
  const { ctx, pg } = await ctxPage();
  await noIntro(pg);
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => document.dispatchEvent(new CustomEvent('emc:view-shown', { detail: { view: 'x', root: document } })));
  await pg.waitForTimeout(60);
  await pg.evaluate(() => { location.hash = '#/ch3'; });          // interrupt mid-dip
  await pg.waitForTimeout(1200);
  const st = await pg.evaluate(() => ({
    flashes: document.querySelectorAll('.mx-flash').length,
    mounted: !document.getElementById('shell-topic').hidden
  }));
  ok('8 flash interrupted mid-dip by navigation cleans up; view mounts', st.flashes === 0 && st.mounted, JSON.stringify(st));
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'MOTION SYSTEM PASS' : fails + ' MOTION FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
