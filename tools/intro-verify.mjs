#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — intro contract verification.
   Run: node tools/intro-verify.mjs
   CONTRACT (changed 2026-10-27): the intro plays on EVERY full load/refresh of
   the bare landing page. There is no seen-flag (no sessionStorage, no
   localStorage, no memory flag). Only Skip / Start / Escape end it; arbitrary
   clicks and keys do nothing; the page underneath is inert while it plays.
     1 a bare load plays; unrelated clicks/keys are ignored; Tab stays inside
       the overlay; page controls cannot be clicked; Start is hidden and
       unfocusable until ~10.3 s; auto-end lands in 12-15 s; zero timers /
       listeners / rAF / inert nodes afterwards; no intro key in any storage
     2 a refresh and a brand-new tab play it again
     3 stale legacy flags (emc.intro.v1 + .ls, __emcIntroSeen-style) are ignored
       and progress storage is never touched
     4 chapter hash route and non-home pages never run it
     5 Skip button ends it, and so does Escape; the page is usable afterwards
     6 the Start CTA works when it appears (opens Chapter 1, clears the overlay)
     7 reduced motion: static composition, quick hand-off, no animation loop
     8 blocked storage still boots, plays and clears
     9 a re-fired loader-done after completion never re-creates the overlay
    10 repeated loader-done during playback keeps one overlay + one listener set
    11 ?t=<s> dev freeze draws one still frame and Skip still works
    12 at 3440x1440, 1366x768, 1024x768, 768x1024, 390x844 and 844x390 the Start
       CTA overlaps no chip/title/Skip/mascot and nothing leaves the viewport
    13 once settled, title letters and chips do not drift (same boxes at 8 s / 9.5 s)
    14 zero console/page errors throughout
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
  watch(pg);
  return { ctx, pg };
}
function watch(pg) {
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
}
const waitPlaying = pg => pg.waitForFunction(() => {
  const o = document.getElementById('introOverlay');
  return o && o.classList.contains('play');
}, null, { timeout: 8000 });
const waitGone = (pg, timeout = 20000) => pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout });
const overlayUp = pg => pg.evaluate(() => !!document.getElementById('introOverlay'));
const leftovers = pg => pg.evaluate(() => ({
  intro: window.EMC_INTRO.state(),
  /* #shell-topic is hidden+inert by the page itself (js/shell.js), not by the intro */
  inertNodes: document.querySelectorAll('[inert]:not(#shell-topic)').length,
  rafs: window.EMC.stats().rafs
}));
const clean = l => l.intro.timers === 0 && l.intro.listeners === 0 && l.intro.rafs === 0 &&
  l.intro.inert === 0 && l.inertNodes === 0 && l.rafs === 0;
const introKeys = pg => pg.evaluate(() => {
  const keys = [];
  for (const store of [localStorage, sessionStorage]) {
    for (let i = 0; i < store.length; i++) keys.push(store.key(i));
  }
  return keys.filter(k => /intro/i.test(k));
});

/* 1: first load — full lifecycle, hit-testing and focus containment */
{
  const { ctx, pg } = await ctxPage();
  const t0 = Date.now();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  const playStart = Date.now();
  ok('1 a bare landing-page load starts the intro', true, `play at ~${playStart - t0} ms`);

  /* unrelated clicks and keys must not dismiss it */
  await pg.mouse.click(640, 450);
  await pg.mouse.click(30, 30);
  for (const key of ['Enter', ' ', 'a', 'ArrowDown']) await pg.keyboard.press(key);
  await pg.waitForTimeout(400);
  ok('1 unrelated clicks and keys do NOT dismiss the intro', (await overlayUp(pg)) &&
    await pg.evaluate(() => window.EMC_INTRO.state().playing));

  /* no click-through: the nav quiz CTA sits under the overlay */
  const box = await pg.locator('a.nav-cta[href="quiz.html"]').boundingBox();
  await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await pg.waitForTimeout(400);
  const hit = await pg.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return !!(el && el.closest('#introOverlay'));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  ok('1 page controls cannot be clicked through the playing intro',
    /index\.html/.test(pg.url()) && !/quiz/.test(pg.url()) && hit, pg.url());

  /* focus never escapes behind the overlay; Start is unfocusable until it pops */
  const focusTrail = [];
  for (let i = 0; i < 6; i++) {
    await pg.keyboard.press('Tab');
    focusTrail.push(await pg.evaluate(() => {
      const a = document.activeElement;
      return { id: a.id || a.tagName, inside: !!a.closest('#introOverlay') };
    }));
  }
  /* Skip is the only focusable control before Start pops, so Tab alternates
     between it and BODY (focus leaving the document) — never a page control. */
  ok('1 Tab never reaches a page control behind the overlay and skip is the first stop',
    focusTrail.every(f => f.inside || f.id === 'BODY') && focusTrail[0].id === 'introSkip',
    JSON.stringify(focusTrail.map(f => f.id)));
  const startEarly = await pg.evaluate(() => {
    const go = document.querySelector('#introOverlay .in-start');
    return { vis: getComputedStyle(go).visibility, on: go.classList.contains('on') };
  });
  ok('1 Start CTA is hidden and unfocusable before its moment', startEarly.vis === 'hidden' && !startEarly.on, JSON.stringify(startEarly));

  /* CTA appears at ~10.3 s of playback */
  await pg.waitForFunction(() => document.querySelector('#introOverlay .in-start.on'), null, { timeout: 14000 });
  const ctaAt = (Date.now() - playStart) / 1000;
  ok('1 Start CTA appears at the intended time (~10.3 s)', ctaAt > 9.6 && ctaAt < 11.6, ctaAt.toFixed(2) + ' s');

  await waitGone(pg);
  const endedAt = Date.now() - playStart;
  ok('1 intro auto-ends within the 12.0-15.0 s window', endedAt > 12000 && endedAt < 15000, `${endedAt} ms`);
  const l = await leftovers(pg);
  ok('1 completion leaves zero timers/listeners/rAF/inert nodes', clean(l), JSON.stringify(l));
  const keys = await introKeys(pg);
  ok('1 no intro seen-flag is written to any storage', keys.length === 0, JSON.stringify(keys));
  ok('1 progress storage untouched', await pg.evaluate(() => localStorage.getItem('emc.progress.v4') === null));

  /* 2: refresh and a brand-new tab both replay */
  await pg.reload({ waitUntil: 'load' });
  await waitPlaying(pg);
  ok('2 a same-tab refresh plays the intro again', true);
  const tab2 = await ctx.newPage();
  watch(tab2);
  await tab2.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(tab2);
  ok('2 a new tab in the same browser plays the intro again', true);
  await ctx.close();
}

/* 3: stale legacy flags must not suppress it */
{
  const { ctx, pg } = await ctxPage();
  await pg.addInitScript(() => {
    try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {}
    try { localStorage.setItem('emc.intro.v1.ls', JSON.stringify({ t: Date.now() })); } catch (e) {}
    try { localStorage.setItem('emc.progress.v4', '{"sentinel":true}'); } catch (e) {}
    window.__emcIntroSeen = true;
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  ok('3 legacy seen-flags (session, localStorage, memory) are ignored', true);
  await pg.keyboard.press('Escape');
  await waitGone(pg, 4000);
  const kept = await pg.evaluate(() => localStorage.getItem('emc.progress.v4'));
  ok('3 existing progress storage is not cleared or overwritten', kept === '{"sentinel":true}', String(kept));
  await ctx.close();
}

/* 4: chapter route and non-home pages never run it */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html#/ch2', { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  ok('4 chapter hash route never shows the intro',
    !(await overlayUp(pg)) && (await pg.evaluate(() => !document.getElementById('shell-topic').hidden)));
  for (const url of ['/quiz.html', '/topics/fields.html', '/topics/current.html']) {
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    ok(`4 ${url} has no intro`, !(await overlayUp(pg)));
  }
  await ctx.close();
}

/* 5: Skip button and Escape are the early exits; page usable afterwards */
for (const via of ['skip button', 'Escape']) {
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  if (via === 'Escape') await pg.keyboard.press('Escape');
  else await pg.click('#introSkip');
  await waitGone(pg, 4000);
  ok(`5 ${via} ends the intro mid-play`, true);
  const l = await leftovers(pg);
  ok(`5 after ${via}: zero timers/listeners/rAF/inert nodes`, clean(l), JSON.stringify(l));
  await pg.click('a.nav-cta[href="quiz.html"]', { timeout: 5000 });
  await pg.waitForURL(/quiz\.html/, { timeout: 5000 });
  ok(`5 after ${via}: the page underneath is usable`, true);
  await ctx.close();
}

/* 6: Start CTA works when it appears */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  await pg.waitForFunction(() => document.querySelector('#introOverlay .in-start.on'), null, { timeout: 14000 });
  await pg.click('#introOverlay .in-start', { timeout: 3000 });
  /* the shell turns the CTA into the in-page #/ch1 route */
  await pg.waitForURL(/#\/ch1|topics\/current\.html/, { timeout: 5000 });
  await waitGone(pg, 4000);
  ok('6 Start CTA is clickable once it appears, opens Chapter 1 and clears the overlay',
    await pg.evaluate(() => !document.getElementById('shell-topic').hidden || /current\.html/.test(location.pathname)));
  await ctx.close();
}

/* 7: reduced motion */
{
  const { ctx, pg } = await ctxPage({ reducedMotion: 'reduce' });
  const t0 = Date.now();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => { const o = document.getElementById('introOverlay'); return o && o.classList.contains('rm'); }, null, { timeout: 8000 });
  const rm = await pg.evaluate(() => {
    const o = document.getElementById('introOverlay');
    return {
      visible: getComputedStyle(o).visibility,
      anims: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1,
      rafs: window.EMC_INTRO.state().rafs
    };
  });
  ok('7 reduced motion shows a static composition with no animation loop',
    rm.visible === 'visible' && rm.anims === 0 && rm.rafs === 0, JSON.stringify(rm));
  await waitGone(pg, 4000);
  ok('7 reduced-motion intro hands control back quickly', Date.now() - t0 < 3500, `${Date.now() - t0} ms`);
  const l = await leftovers(pg);
  ok('7 reduced motion leaves nothing behind', clean(l), JSON.stringify(l));
  await ctx.close();
}

/* 8: blocked storage */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  watch(pg);
  await pg.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  await pg.keyboard.press('Escape');
  await waitGone(pg, 4000);
  ok('8 blocked storage: page boots, intro plays and clears', await pg.evaluate(() => typeof window.EMC !== 'undefined'));
  await ctx.close();
}

/* 9: loader-done replay after completion creates nothing */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  await pg.keyboard.press('Escape');
  await waitGone(pg, 4000);
  await pg.evaluate(() => document.dispatchEvent(new Event('emc:loader-done')));
  await pg.waitForTimeout(600);
  const after = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  ok('9 re-fired loader-done after completion never re-creates the overlay',
    after.nodes === 0 && after.st.listeners === 0 && after.st.timers === 0 && !after.st.playing, JSON.stringify(after));
  await ctx.close();
}

/* 10: repeated init during playback */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await waitPlaying(pg);
  const s1 = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  await pg.evaluate(() => { document.dispatchEvent(new Event('emc:loader-done')); document.dispatchEvent(new Event('emc:loader-done')); });
  await pg.waitForTimeout(300);
  const s2 = await pg.evaluate(() => ({ st: window.EMC_INTRO.state(), nodes: document.querySelectorAll('#introOverlay').length }));
  ok('10 repeated init during playback keeps one overlay and one listener set',
    s1.nodes === 1 && s2.nodes === 1 && s2.st.listeners === s1.st.listeners && s2.st.inert === s1.st.inert && s2.st.playing,
    JSON.stringify({ s1, s2 }));
  await ctx.close();
}

/* 11: dev freeze is a harmless still frame */
{
  const { ctx, pg } = await ctxPage();
  await pg.goto(B + '/index.html?t=5', { waitUntil: 'load' });
  await waitPlaying(pg);
  await pg.waitForTimeout(600);
  const st = await pg.evaluate(() => window.EMC_INTRO.state());
  ok('11 ?t= freezes one frame with no clock running', st.rafs === 0 && st.playing, JSON.stringify(st));
  await pg.click('#introSkip');
  await waitGone(pg, 4000);
  ok('11 Skip still clears a frozen frame', true);
  await ctx.close();
}

/* 12: final composition is clean at every required viewport */
{
  const browser2 = browser;
  for (const [w, h] of [[3440, 1440], [1366, 768], [1024, 768], [768, 1024], [390, 844], [844, 390]]) {
    const ctx = await browser2.newContext({ viewport: { width: w, height: h } });
    const pg = await ctx.newPage();
    watch(pg);
    await pg.goto(B + '/index.html?t=11', { waitUntil: 'load' });
    await waitPlaying(pg);
    const r = await pg.evaluate(() => {
      const box = e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
      const items = {
        skip: box(document.getElementById('introSkip')), sub: box(document.getElementById('sub')),
        ttl: box(document.getElementById('ttl')), mk: box(document.getElementById('mk'))
      };
      document.querySelectorAll('#introOverlay .chip').forEach((c, i) => { items['chip' + i] = box(c); });
      const cta = box(document.querySelector('#introOverlay .in-start'));
      const hit = (a, c) => a.l < c.r && a.r > c.l && a.t < c.b && a.b > c.t;
      const overlaps = Object.keys(items).filter(k => hit(cta, items[k]));
      const chips = Object.keys(items).filter(k => k.startsWith('chip'));
      for (const k of chips) if (hit(items.skip, items[k])) overlaps.push('skip×' + k);
      const outside = Object.entries({ ...items, cta })
        .filter(([, v]) => v.l < -1 || v.t < -1 || v.r > innerWidth + 1 || v.b > innerHeight + 1).map(([k]) => k);
      return { overlaps, outside };
    });
    ok(`12 ${w}x${h}: Start CTA overlaps nothing and all intro text stays on screen`,
      r.overlaps.length === 0 && r.outside.length === 0, JSON.stringify(r));
    await ctx.close();
  }
}

/* 13: settled elements hold still (no idle wobble) */
{
  const { ctx, pg } = await ctxPage();
  const settledBoxes = async t => {
    await pg.goto(B + `/index.html?t=${t}`, { waitUntil: 'load' });
    await waitPlaying(pg);
    return pg.evaluate(() => [...document.querySelectorAll('#ttl span, #sub, #introOverlay .chip')]
      .map(e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(n => Math.round(n * 10) / 10); }));
  };
  /* chips enter on beats at ~6.1 s and ~7.0 s, so sample after the last settles */
  const early = await settledBoxes(8), late = await settledBoxes(9.5);
  ok('13 title letters, subtitle and chips are identical at 8 s and 9.5 s (no drift)',
    JSON.stringify(early) === JSON.stringify(late) && early.length >= 8, `${early.length} boxes`);
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'INTRO CONTRACT PASS' : fails + ' INTRO FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
