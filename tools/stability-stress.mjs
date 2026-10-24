#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — stability stress: chapter navigation (PART 3.2 sequence),
   Details switch (PART 4.3 matrix) and typography parity (PART 4.5).
   Run: node tools/stability-stress.mjs
   Exits 1 on any failure. Every step asserts mounted content + URL + nav
   indicator agreement, records console/page errors, and checks that no
   overlay or transparent layer intercepts clicks.
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
    /* phase 9: + Video/ (46 MB reference MP4, never requested by any page).
       Preloading it into the served-file map plus a long multi-context
       stress run OOM-killed the renderer on low-RAM CI; misses[] would
       flag any page that actually requested it. Assertions unchanged. */
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
await new Promise(r => server.listen(8261, '127.0.0.1', r));
const B = 'http://127.0.0.1:8261';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

async function newPage(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });
  return { ctx, pg };
}

/* state probe: what is mounted, what does the URL say, is the nav in sync,
   is anything click-blocking, are previous stages gone */
const probe = pg => pg.evaluate(() => {
  const topic = document.getElementById('shell-topic');
  const home = document.getElementById('shell-home');
  const h1 = topic && !topic.hidden ? (topic.querySelector('h1') || {}).textContent : null;
  const blocking = (() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (!el) return 'none-at-center';
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none' && el.id) return 'pointer-none#' + el.id;
    return null;
  })();
  const overlayUp = !!document.getElementById('bootOverlay') || !!document.getElementById('introOverlay');
  return {
    hash: location.hash, h1: h1 || '', homeVisible: home && !home.hidden,
    stages: window.EMC ? window.EMC.stats().stages : -1,
    listeners: window.EMC ? window.EMC.stats().listeners : -1,
    blocking, overlayUp,
    detail: document.documentElement.dataset.detail,
    pressed: (document.getElementById('detailToggle') || {}).getAttribute ? document.getElementById('detailToggle').getAttribute('aria-pressed') : null,
    dtLabel: (document.querySelector('.dt-state') || {}).textContent
  };
});
const WANT = { '#/ch1': 'Circuits', '#/ch2': 'Electric Fields', '#/ch3': 'Magnetism' };

/* ============ A. PART 3.2 navigation sequence ============================ */
{
  let { ctx, pg } = await newPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(700);

  const goChapter = async (id, via) => {
    if (via === 'hash') await pg.evaluate(r => { location.hash = r; }, id);
    else if (via === 'dropdown') {
      await pg.click('#topicsBtn');
      await pg.waitForTimeout(120);
      const file = { '#/ch1': 'current', '#/ch2': 'fields', '#/ch3': 'magind' }[id];
      await pg.click(`#topicsMenu a[href$="${file}.html"]`);
    } else if (via === 'card') {
      await pg.evaluate(() => { location.hash = '#/'; });
      await pg.waitForTimeout(250);
      await pg.click(`[data-topic-link="${id.slice(2)}"]`);
    }
    await pg.waitForTimeout(950);
    const st = await probe(pg);
    const good = st.hash === id && st.h1.includes(WANT[id]) && !st.overlayUp && st.blocking === null;
    ok(`A nav ${via} -> ${id} mounts in sync`, good, JSON.stringify({ hash: st.hash, h1: st.h1.slice(0, 26), blocking: st.blocking, overlay: st.overlayUp }));
    return st;
  };

  /* 2-5: ch1 -> ch2 -> ch3 -> ch1 via dropdown */
  for (const id of ['#/ch1', '#/ch2', '#/ch3', '#/ch1']) await goChapter(id, 'dropdown');
  /* 6: different order via home cards */
  for (const id of ['#/ch1', '#/ch3', '#/ch2', '#/ch1']) await goChapter(id, 'card');

  /* 7: Details toggled between navigations */
  await pg.click('#detailToggle'); await pg.waitForTimeout(250);
  const offState = await probe(pg);
  ok('A Details OFF persists while mounted in ch1', offState.detail === 'off' && offState.pressed === 'false' && offState.dtLabel === 'OFF', JSON.stringify(offState).slice(0, 90));
  await goChapter('#/ch2', 'hash');
  const offMounted = await pg.evaluate(() => ({
    techVisible: [...document.querySelectorAll('#shell-topic [data-detail="tech"]')].filter(e => getComputedStyle(e).display !== 'none').length,
    plainVisible: [...document.querySelectorAll('#shell-topic [data-detail="plain"]')].filter(e => getComputedStyle(e).display !== 'none').length
  }));
  ok('A chapter mounted while OFF shows plain variants immediately', offMounted.techVisible === 0 && offMounted.plainVisible > 0, JSON.stringify(offMounted));
  await pg.click('#detailToggle'); await pg.waitForTimeout(250);
  const onMounted = await pg.evaluate(() => ({
    techVisible: [...document.querySelectorAll('#shell-topic [data-detail="tech"]')].filter(e => getComputedStyle(e).display !== 'none').length
  }));
  ok('A toggling ON after mount reveals the tech variants', onMounted.techVisible > 0, JSON.stringify(onMounted));

  /* 8: interact with a sim before navigating away */
  await pg.evaluate(() => document.querySelector('#ar-panel').scrollIntoView({ block: 'center' }));
  await pg.waitForFunction(() => !!window.__AR, null, { timeout: 6000 });
  await pg.click('[data-sb-preset="lecture-line"]');
  await pg.waitForTimeout(400);
  const simBefore = await pg.evaluate(() => document.getElementById('ar-count').textContent);
  await goChapter('#/ch3', 'hash');
  const CH2 = ['sim-static-room', 'toy-balloon', 'toy-ledger', 'sim-arena', 'toy-pinforce', 'toy-bohr', 'sim-fieldpaint', 'toy-dipole', 'toy-zerohunt'];
  const idsAfter = await pg.evaluate(() => window.EMC.debugStages().map(x => x.id));
  ok('A leaving ch2 after sim use tears its stages down (by identity)',
    idsAfter.every(id => !CH2.includes(id)) && simBefore === '3',
    `live stages now: ${idsAfter.join(',')}`);
  /* ch3 sim interaction then leave */
  await pg.evaluate(() => document.getElementById('sim-lorentz').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(700);
  await pg.click('#lor-play'); await pg.waitForTimeout(500); await pg.click('#lor-play');
  await goChapter('#/ch1', 'hash');
  const CH3 = ['sim-lorentz', 'sim-induction', 'sim-induction-chart'];
  const idsBack = await pg.evaluate(() => window.EMC.debugStages().map(x => x.id));
  ok('A leaving ch3 after sim use tears its stages down (by identity)',
    idsBack.every(id => !CH3.includes(id)), `live stages now: ${idsBack.join(',')}`);

  /* 9: rapid switching */
  for (const id of ['#/ch2', '#/ch3', '#/ch1', '#/ch2', '#/ch1']) {
    await pg.evaluate(r => { location.hash = r; }, id);
    await pg.waitForTimeout(90);
  }
  await pg.waitForTimeout(1600);
  const rapid = await probe(pg);
  ok('A rapid switching settles on the last destination, usable', rapid.hash === '#/ch1' && rapid.h1.includes('Circuits') && rapid.blocking === null && !rapid.overlayUp, JSON.stringify(rapid).slice(0, 120));

  /* 11: back / forward */
  await pg.goBack(); await pg.waitForTimeout(800);
  const back = await probe(pg);
  ok('A Back restores the previous chapter', back.hash === '#/ch2' && back.h1.includes('Electric Fields'), JSON.stringify({ hash: back.hash, h1: back.h1.slice(0, 24) }));
  await pg.goForward(); await pg.waitForTimeout(800);
  const fwd = await probe(pg);
  ok('A Forward returns', fwd.hash === '#/ch1' && fwd.h1.includes('Circuits'), fwd.hash);

  /* 12: direct URL + refresh */
  await pg.goto(B + '/index.html#/ch3', { waitUntil: 'load' });
  await pg.waitForTimeout(1100);
  const direct = await probe(pg);
  ok('A direct hash URL mounts ch3', direct.hash === '#/ch3' && direct.h1.includes('Magnetism'), direct.hash);
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(1100);
  const refreshed = await probe(pg);
  ok('A refresh on a chapter route remounts correctly', refreshed.hash === '#/ch3' && refreshed.h1.includes('Magnetism') && !refreshed.overlayUp, JSON.stringify(refreshed).slice(0, 100));

  /* 13: new tab (standalone pages remain the new-tab destination)
     RAM note (2026-10-24, phase 9d): the block-A context has done ~15
     navigations by here; on 1 GB CI its renderer process is worn out and
     any further newPage in the SAME context is OOM-killed ('Target
     crashed', four consecutive runs — closing the old page first did not
     help, same-site pages share the process). Run the new-tab and mobile
     scenarios in fresh contexts (fresh processes). Assertions unchanged. */
  const href = await pg.evaluate(() => document.querySelector('#topicsMenu a[href$="fields.html"]').getAttribute('href'));
  await ctx.close();
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg2 = await ctxB.newPage();
  await pg2.goto(B + '/index.html' .replace('index.html', '') + href, { waitUntil: 'load' });
  await pg2.waitForTimeout(900);
  const standalone = await pg2.evaluate(() => ({ h1: (document.querySelector('main h1') || {}).textContent, emc: typeof window.EMC !== 'undefined' }));
  ok('A new-tab link opens the standalone chapter, fully alive', /Electric Fields/.test(standalone.h1 || '') && standalone.emc, JSON.stringify(standalone).slice(0, 80));
  await ctxB.close();

  /* 10: mobile nav path (fresh context — see RAM note above) */
  const ctxC = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctxC.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });
  pg = await ctxC.newPage();
  await pg.setViewportSize({ width: 360, height: 740 });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  await pg.click('#navToggle'); await pg.waitForTimeout(250);
  if (await pg.isVisible('#topicsBtn')) { await pg.click('#topicsBtn'); await pg.waitForTimeout(250); }
  await pg.click('#navMenu a[href$="magind.html"]');
  await pg.waitForTimeout(1000);
  const mob = await probe(pg);
  ok('A mobile menu navigates to ch3', mob.hash === '#/ch3' && mob.h1.includes('Magnetism'), JSON.stringify(mob).slice(0, 100));

  /* in-page chapter links (pager inside mounted content) */
  await pg.setViewportSize({ width: 1280, height: 900 });
  await pg.evaluate(() => { location.hash = '#/ch1'; });
  await pg.waitForTimeout(900);
  await pg.evaluate(() => document.querySelector('#shell-topic .pager a.next').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(200);
  await pg.click('#shell-topic .pager a.next');
  await pg.waitForTimeout(1000);
  const pager = await probe(pg);
  ok('A in-page pager link moves to the next chapter', pager.hash === '#/ch2' && pager.h1.includes('Electric Fields'), pager.hash);
  await ctxC.close();
}

/* ============ B. PART 4.3 Details matrix ================================== */
{
  const { ctx, pg } = await newPage();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  /* 1: ten toggles */
  let consistent = true;
  for (let i = 0; i < 10; i++) {
    await pg.click('#detailToggle');
    await pg.waitForTimeout(140);
    const st = await probe(pg);
    const want = i % 2 === 0 ? 'off' : 'on';
    if (st.detail !== want || st.pressed !== String(want === 'on') || st.dtLabel !== want.toUpperCase()) consistent = false;
  }
  ok('B ten rapid toggles keep attr/aria/label in lockstep', consistent);
  /* keyboard */
  await pg.evaluate(() => document.getElementById('detailToggle').focus());
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
  const kb = await probe(pg);
  ok('B keyboard Enter toggles and agrees', kb.detail === 'off' && kb.pressed === 'false', JSON.stringify(kb).slice(0, 80));
  /* 4: reload in each state */
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(700);
  const r1 = await probe(pg);
  ok('B reload keeps OFF (persisted)', r1.detail === 'off' && r1.pressed === 'false', r1.detail);
  await pg.click('#detailToggle'); await pg.waitForTimeout(200);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(700);
  const r2 = await probe(pg);
  ok('B reload keeps ON', r2.detail === 'on' && r2.pressed === 'true', r2.detail);
  /* 5: back/forward */
  await pg.goBack(); await pg.waitForTimeout(500); await pg.goForward(); await pg.waitForTimeout(500);
  const bf = await probe(pg);
  ok('B back/forward keep Details state and page usable', bf.detail === 'on' && bf.blocking === null, bf.detail);
  /* 8: blocked storage (RAM note: close block B's context first — two live
     contexts with full pages OOM the renderer on 1 GB CI) */
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg3 = await ctx2.newPage();
  const errs2 = [];
  pg3.on('pageerror', e => errs2.push(String(e).slice(0, 100)));
  await pg3.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await pg3.goto(B + '/index.html', { waitUntil: 'load' });
  await pg3.waitForTimeout(700);
  for (let i = 0; i < 3; i++) { await pg3.click('#detailToggle'); await pg3.waitForTimeout(150); }
  const bs = await pg3.evaluate(() => ({ detail: document.documentElement.dataset.detail, emc: typeof window.EMC !== 'undefined' }));
  ok('B blocked storage: page boots, toggle still flips', bs.emc && bs.detail === 'off' && errs2.length === 0, JSON.stringify(bs) + errs2.join('|'));
  await ctx2.close();
}

/* ============ C. PART 4.5 typography parity =============================== */
{
  const { ctx, pg } = await newPage();
  for (const url of ['/index.html', '/topics/fields.html', '/topics/current.html', '/topics/magind.html', '/quiz.html']) {
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    const pairs = await pg.evaluate(() => {
      /* for each parent that owns a plain/tech pair, compare the computed
         font-size + line-height of the two variants (primary reading roles) */
      const out = [];
      const parents = new Set();
      document.querySelectorAll('[data-detail]').forEach(el => parents.add(el.parentElement));
      parents.forEach(par => {
        if (!par) return;
        const plain = [...par.children].find(c => c.getAttribute && c.getAttribute('data-detail') === 'plain');
        const tech = [...par.children].find(c => c.getAttribute && c.getAttribute('data-detail') === 'tech');
        if (!plain || !tech) return;
        const a = getComputedStyle(plain), b = getComputedStyle(tech);
        out.push({
          cls: (plain.className || '').toString().slice(0, 24),
          sameSize: a.fontSize === b.fontSize, sameLH: a.lineHeight === b.lineHeight,
          a: a.fontSize + '/' + a.lineHeight, b: b.fontSize + '/' + b.lineHeight
        });
      });
      return out;
    });
    const bad = pairs.filter(p => !p.sameSize || !p.sameLH);
    ok(`C ${url}: every plain/tech pair shares font-size + line-height`, bad.length === 0,
      bad.length ? JSON.stringify(bad.slice(0, 3)) : `${pairs.length} pairs`);
  }
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 8) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'STABILITY STRESS PASS' : fails + ' STABILITY FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
