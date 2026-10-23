#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — navigation & routing verification (gate N, §3.3).
   Run: node tools/nav-verify.mjs
   Real Chromium against the local build:
     1  home -> each chapter via nav links and the dropdown
     2  home -> quiz
     3  direct URLs for every active page
     4  old URLs: lesson stubs (with anchors), legacy hash routes
     5  anchors to equations and sims from the home cards
     6  back/forward across home <-> chapter (hash routing + history)
     7  reload on a chapter route
     8  new-tab links keep real hrefs (middle-click untouched)
     9  chapter switching: mount, teardown (no leaked stages/listeners),
        focus, meaningful URL, no duplicate script network loads
    10 fetch failure -> error card with Retry + Home; Retry recovers
    11 keyboard: tab-reach nav, open dropdown, activate a chapter link;
        mobile menu toggle at 360 px
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
await new Promise(r => server.listen(8249, '127.0.0.1', r));
const B = 'http://127.0.0.1:8249';

let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errors = [];
async function page(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  return { ctx, pg };
}

/* ---- 1+2. home navigation (nav links + dropdown) -------------------------- */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(500);
  for (const [label, hrefPart] of [['ch1', 'current.html'], ['ch2', 'fields.html'], ['ch3', 'magind.html']]) {
    await pg.evaluate(() => { location.hash = '#/'; });
    await pg.waitForTimeout(200);
    await pg.click('#topicsBtn');                        // open the dropdown first
    await pg.waitForTimeout(200);
    await pg.click(`.nav-drop-menu a[href$="${hrefPart}"]`);
    await pg.waitForTimeout(900);
    const st = await pg.evaluate(() => ({
      mounted: !document.getElementById('shell-topic').hidden,
      h1: (document.querySelector('#shell-topic h1') || {}).textContent || '',
      hash: location.hash
    }));
    ok(`1 nav -> ${label} mounts in the shell`, st.mounted && st.hash === '#/' + label, JSON.stringify(st));
  }
  await pg.click('a.nav-cta[href="quiz.html"]');
  await pg.waitForURL(/quiz\.html/);
  ok('2 home -> quiz link navigates', pg.url().endsWith('/quiz.html'));
  await ctx.close();
}

/* ---- 3. direct URLs ------------------------------------------------------- */
{
  for (const u of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html', '/topics/magind.html']) {
    const { ctx, pg } = await page();
    const res = await pg.goto(B + u, { waitUntil: 'load' });
    await pg.waitForTimeout(400);
    const alive = await pg.evaluate(() => typeof window.EMC !== 'undefined' && !!document.querySelector('h1'));
    ok(`3 direct URL ${u}`, res.status() === 200 && alive);
    await ctx.close();
  }
}

/* ---- 4. old URLs ------------------------------------------------------------ */
{
  const { ctx, pg } = await page();
  for (const [old, want] of [
    ['/topics/charge.html', '#charge'],
    ['/topics/coulomb.html', '#coulomb'],
    ['/topics/field.html', '#field'],
    ['/topics/charge.html#sim-static-room-panel', '#sim-static-room-panel'],
    ['/topics/field.html#sim-fieldpaint-panel', '#sim-fieldpaint-panel']
  ]) {
    await pg.goto(B + old, { waitUntil: 'load' });
    await pg.waitForURL(/fields\.html/, { timeout: 5000 });
    ok(`4 old URL ${old} redirects into fields.html${want}`, pg.url().includes('fields.html') && pg.url().includes(want), pg.url());
  }
  await pg.goto(B + '/index.html#/magind', { waitUntil: 'load' });
  await pg.waitForTimeout(1000);
  const legacy = await pg.evaluate(() => ({ hash: location.hash, mounted: !document.getElementById('shell-topic').hidden }));
  ok('4 legacy hash #/magind resolves to #/ch3', legacy.hash === '#/ch3' && legacy.mounted, JSON.stringify(legacy));
  await ctx.close();
}

/* ---- 5. anchors to equations/sims ------------------------------------------ */
{
  /* In the shell, a home-card link becomes a same-page switch that scrolls to
     the anchored panel (the href stays real for new tabs — check 8). */
  const { ctx, pg } = await page();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.click('a[href="topics/fields.html#sim-arena-panel"]');
  await pg.waitForTimeout(1600);
  const near = await pg.evaluate(() => {
    const t = document.getElementById('sim-arena-panel');
    if (!t) return 'missing';
    const r = t.getBoundingClientRect();
    return { pos: r.top < window.innerHeight && r.bottom > 0 ? 'in view' : 'off view: ' + Math.round(r.top), hash: location.hash };
  });
  ok('5 home sim card -> shell switch lands on the panel', near.pos === 'in view' && near.hash === '#/ch2', JSON.stringify(near));
  await ctx.close();

  /* Standalone page + anchor: the deep URL scrolls to the panel directly. */
  const { ctx: c2, pg: p2 } = await page();
  await p2.goto(B + '/topics/fields.html#charge-summary', { waitUntil: 'load' });
  await p2.waitForTimeout(1200);
  const st = await p2.evaluate(() => {
    const t = document.getElementById('charge-summary');
    const r = t.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  ok('5 standalone anchor URL scrolls to the section', st === true);
  await c2.close();
}

/* ---- 6+7. back/forward + reload on a chapter route ------------------------ */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.evaluate(() => { location.hash = '#/ch1'; });
  await pg.waitForTimeout(900);
  await pg.evaluate(() => { location.hash = '#/ch3'; });
  await pg.waitForTimeout(900);
  await pg.goBack(); await pg.waitForTimeout(700);
  const back = await pg.evaluate(() => ({ hash: location.hash, h1: (document.querySelector('#shell-topic h1') || {}).textContent }));
  ok('6 back returns to ch1 mounted', back.hash === '#/ch1' && /Circuits/.test(back.h1 || ''), JSON.stringify(back));
  await pg.goForward(); await pg.waitForTimeout(700);
  const fwd = await pg.evaluate(() => ({ hash: location.hash, h1: (document.querySelector('#shell-topic h1') || {}).textContent }));
  ok('6 forward returns to ch3 mounted', fwd.hash === '#/ch3' && /Magnetism/.test(fwd.h1 || ''), JSON.stringify(fwd));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(1000);
  const rel = await pg.evaluate(() => ({ hash: location.hash, mounted: !document.getElementById('shell-topic').hidden, h1: (document.querySelector('#shell-topic h1') || {}).textContent }));
  ok('7 reload on #/ch3 remounts the chapter', rel.mounted && rel.hash === '#/ch3' && /Magnetism/.test(rel.h1 || ''), JSON.stringify(rel));
  await ctx.close();
}

/* ---- 8. real hrefs for new tabs ------------------------------------------- */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  const hrefs = await pg.evaluate(() => [...document.querySelectorAll('a[data-topic-link], .nav-drop-menu a')]
    .map(a => a.getAttribute('href')));
  ok('8 every chapter link keeps a real standalone href',
    hrefs.length >= 6 && hrefs.every(h => /^topics\/(current|fields|magind)\.html/.test(h)), hrefs.join(' '));
  await ctx.close();
}

/* ---- 9. switching: teardown, no duplicate network loads, focus ------------ */
{
  const { ctx, pg } = await page();
  const jsLoads = {};
  pg.on('request', r => { if (/\/js\/.*\.js$/.test(r.url())) jsLoads[r.url()] = (jsLoads[r.url()] || 0) + 1; });
  await pg.goto(B + '/index.html#/ch2', { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => document.querySelector('#sim-arena-panel').scrollIntoView());
  await pg.waitForTimeout(900);                      // let the arena stage spin up
  const before = await pg.evaluate(() => ({ stats: window.EMC.stats(), ids: window.EMC.debugStages().map(s => s.id) }));
  await pg.evaluate(() => { location.hash = '#/ch3'; });
  await pg.waitForTimeout(1200);
  const after = await pg.evaluate(() => ({
    stats: window.EMC.stats(),
    ids: window.EMC.debugStages().map(s => s.id),
    focus: document.activeElement ? (document.activeElement.tagName + ':' + (document.activeElement.textContent || '').slice(0, 30)) : 'none'
  }));
  const CH2 = ['sim-static-room', 'toy-balloon', 'toy-ledger', 'sim-arena', 'toy-pinforce', 'toy-bohr', 'sim-fieldpaint', 'toy-dipole', 'toy-zerohunt'];
  ok('9 ch2 -> ch3 tears down every ch2 stage (identity, not count)',
    before.ids.some(id => CH2.includes(id)) && after.ids.every(id => !CH2.includes(id)),
    `${before.ids.join(',')} -> ${after.ids.join(',')}`);
  ok('9 focus moves into the mounted chapter', /H1/.test(after.focus), after.focus);
  await pg.evaluate(() => { location.hash = '#/ch2'; });
  await pg.waitForTimeout(1200);
  const dupes = Object.entries(jsLoads).filter(([, n]) => n > 1);
  ok('9 chapter scripts hit the network at most once each', dupes.length === 0, JSON.stringify(dupes));
  await ctx.close();
}

/* ---- 10. fetch failure -> Retry + Home, and recovery ---------------------- */
{
  const { ctx, pg } = await page();
  await pg.route('**/topics/fields.html', route => route.abort());
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.evaluate(() => { location.hash = '#/ch2'; });
  await pg.waitForTimeout(1200);
  const card = await pg.evaluate(() => {
    const body = document.getElementById('shell-topic-body');
    return {
      failed: /could not be loaded/.test(body.textContent),
      retry: !!body.querySelector('[data-shell-retry]'),
      home: !!body.querySelector('a[href="#/"]'),
      stuck: /Loading/.test(body.textContent)
    };
  });
  ok('10 fetch failure shows an error card (never a stuck Loading)', card.failed && !card.stuck, JSON.stringify(card));
  ok('10 error card offers Retry and Home', card.retry && card.home);
  await pg.unroute('**/topics/fields.html');
  await pg.click('[data-shell-retry]');
  await pg.waitForTimeout(1400);
  const recovered = await pg.evaluate(() => !document.getElementById('shell-topic').hidden &&
    !!document.querySelector('#shell-topic h1') && !/could not be loaded/.test(document.getElementById('shell-topic-body').textContent));
  ok('10 Retry recovers the chapter', recovered);
  await ctx.close();
}

/* ---- 11. keyboard + mobile menu ------------------------------------------- */
{
  const { ctx, pg } = await page({ viewport: { width: 360, height: 740 } });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  const toggleVisible = await pg.evaluate(() => {
    const t = document.getElementById('navToggle');
    const r = t.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  ok('11 mobile menu toggle is visible at 360 px', toggleVisible);
  await pg.focus('#navToggle');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  const opened = await pg.evaluate(() => document.getElementById('navToggle').getAttribute('aria-expanded'));
  ok('11 keyboard opens the mobile menu', opened === 'true', String(opened));
  await ctx.close();

  const { ctx: c2, pg: p2 } = await page();
  await p2.goto(B + '/index.html', { waitUntil: 'load' });
  await p2.waitForTimeout(400);
  await p2.keyboard.press('Tab');  // skip link first
  const first = await p2.evaluate(() => document.activeElement.className || document.activeElement.textContent);
  await p2.evaluate(() => document.getElementById('topicsBtn').focus());
  await p2.keyboard.press('Enter');
  await p2.waitForTimeout(300);
  const dropOpen = await p2.evaluate(() => document.getElementById('topicsBtn').getAttribute('aria-expanded'));
  await p2.keyboard.press('Tab');
  const inMenu = await p2.evaluate(() => !!document.activeElement.closest('#topicsMenu'));
  await p2.keyboard.press('Enter');
  await p2.waitForTimeout(1000);
  const mounted = await p2.evaluate(() => !document.getElementById('shell-topic').hidden && location.hash);
  ok('11 dropdown opens by keyboard and Enter activates a chapter', dropOpen === 'true' && inMenu && mounted !== false && String(mounted).length > 0, `${dropOpen}/${inMenu}/${mounted}`);
  ok('11 skip link is the first tab stop', /skip-link/.test(String(first)), String(first).slice(0, 40));
  await c2.close();
}

console.log('page/console errors:', errors.length ? errors.slice(0, 8) : 'none');
/* the fetch-failure scenario aborts a request on purpose; that console noise
   is expected. Anything else counts against the run. */
const unexpected = errors.filter(e => !/Failed to load resource|net::ERR_FAILED/.test(e));
if (unexpected.length) { fails += unexpected.length; console.log('UNEXPECTED:', unexpected); }
console.log(fails === 0 ? 'NAVIGATION MATRIX PASS' : fails + ' NAV FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
