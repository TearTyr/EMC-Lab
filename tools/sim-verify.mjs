#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — simulation behaviour verification in a REAL browser.
   Run: node tools/sim-verify.mjs
     1 balloon: Rub button gives the same exact-opposite counters as a drag, via
       mouse AND keyboard; zero prints "0 C" (never "−0C"); Discharge resets
       every readout and the counters
     2 sandboxes (arena + field painter): Clear empties readouts and canvas and
       can be undone; the canvas is keyboard-operable ([ ] select, arrows move,
       + / − add, Delete removes, Esc deselects) with live announcements and the
       same Undo/readout path as the pointer
     3 touch: a tap with the + charge tool places a charge
     4 lifecycle: switching chapters repeatedly leaves identical stage/listener
       counts (no leaks), going home returns to zero, and off-screen sims park
       their animation loop
     5 zero console/page errors
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
await new Promise(r => server.listen(8264, '127.0.0.1', r));
const B = 'http://127.0.0.1:8264';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
async function open(url, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(skipIntroOnLoad);
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  return { ctx, pg };
}
const reveal = async (pg, sel) => { await pg.locator(sel).first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(800); };
const text = (pg, sel) => pg.evaluate(s => document.querySelector(s).textContent.trim(), sel);
const canvasHash = (pg, id) => pg.evaluate(id => {
  const c = document.getElementById(id); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let h = 0; for (let i = 0; i < d.length; i += 37) h = (h * 31 + d[i]) | 0; return h;
}, id);

/* 1: balloon */
{
  const { ctx, pg } = await open('/topics/fields.html');
  await reveal(pg, '#toy-balloon');
  const zero = [await text(pg, '#bl-q'), await text(pg, '#bl-h'), await text(pg, '#bl-total')];
  ok('balloon: zero charge prints "0 C" everywhere (never "−0C" / "+0C")', zero.every(t => /^0\sC$/.test(t.replace(/ /g, ' '))), JSON.stringify(zero));
  await pg.click('#bl-rub');
  await pg.waitForTimeout(300);
  const q1 = await text(pg, '#bl-q'), h1 = await text(pg, '#bl-h'), n1 = await text(pg, '#bl-n');
  ok('balloon: one Rub stroke moves electrons; balloon and hair are exact opposites',
    /^−/.test(q1) && /^\+/.test(h1) && q1.slice(1) === h1.slice(1) && !/^0 electrons/.test(n1), `${q1} / ${h1} / ${n1}`);
  const sub = (await text(pg, '#bl-sub')).replace(/\u00A0/g, ' ');
  ok('balloon: units follow the SI convention in every readout ("641 nC", never "641 n C")',
    /\d\s?[pnµm]?C\b/.test(sub) && !/\s[pnµmkMG]\sC\b/.test(sub) && !/\s[pnµmkMG]\sC\b/.test(q1.replace(/\u00A0/g, ' ')), `${sub} | ${q1}`);
  await pg.focus('#bl-rub');
  await pg.keyboard.press('Enter');
  await pg.keyboard.press('Space');
  await pg.waitForTimeout(300);
  ok('balloon: Rub works from the keyboard (Enter and Space add strokes)', (await text(pg, '#bl-n')) !== n1, await text(pg, '#bl-n'));
  await pg.click('#bl-reset');
  await pg.waitForTimeout(400);
  const after = [await text(pg, '#bl-q'), await text(pg, '#bl-h'), await text(pg, '#bl-total'), await text(pg, '#bl-n')];
  ok('balloon: Discharge restores every readout and the electron counter',
    after.slice(0, 3).every(t => /^0\sC$/.test(t.replace(/ /g, ' '))) && /^0 electrons/.test(after[3]), JSON.stringify(after));
  /* a real drag still rubs too */
  const box = await pg.locator('#toy-balloon').boundingBox();
  await pg.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.42);
  await pg.mouse.down();
  for (let i = 0; i < 20; i++) await pg.mouse.move(box.x + box.width * (0.18 + 0.1 * (i % 2)), box.y + box.height * 0.42, { steps: 2 });
  await pg.mouse.up();
  await pg.waitForTimeout(300);
  ok('balloon: dragging still rubs (unchanged)', !/^0 electrons/.test(await text(pg, '#bl-n')));
  await ctx.close();
}

/* 2: sandboxes — Clear + keyboard */
for (const [id, panel, preset] of [['sim-arena', '#sim-arena-panel', 'lecture-line'], ['sim-fieldpaint', '#sim-fieldpaint-panel', 'dipole']]) {
  const { ctx, pg } = await open('/topics/fields.html');
  await reveal(pg, '#' + id);
  const count = () => pg.evaluate(p => {
    const s = document.querySelector(p + ' .stat-value'); return Number(s.textContent.trim());
  }, panel);
  const live = () => pg.evaluate(id => document.getElementById(id).closest('.canvas-wrap').querySelector('[role=status]').textContent, id);

  await pg.click(`${panel} [data-sb-preset="${preset}"]`);
  await pg.waitForTimeout(500);
  const n0 = await count();
  const hPreset = await canvasHash(pg, id);
  await pg.click(`${panel} [data-sb-act="clear"]`);
  await pg.waitForTimeout(500);
  ok(`${id}: Clear empties the charge count and redraws the canvas`, (await count()) === 0 && (await canvasHash(pg, id)) !== hPreset, `${n0} -> ${await count()}`);
  await pg.click(`${panel} [data-sb-act="undo"]`);
  await pg.waitForTimeout(500);
  ok(`${id}: Undo brings the cleared scene back`, (await count()) === n0, String(await count()));

  /* keyboard */
  ok(`${id}: the canvas is focusable and described (aria-describedby -> keyboard help)`,
    await pg.evaluate(id => { const c = document.getElementById(id); const d = document.getElementById(c.getAttribute('aria-describedby')); return c.tabIndex === 0 && !!d && /Esc/.test(d.textContent); }, id));
  await pg.focus('#' + id);
  await pg.keyboard.press(']');
  await pg.waitForTimeout(200);
  const sel1 = await live();
  ok(`${id}: ] selects a charge and announces it`, /at x = [\d.]+ m, y = [\d.]+ m \(1 of \d+\)/.test(sel1), sel1);
  await pg.keyboard.press(']');
  await pg.waitForTimeout(150);
  ok(`${id}: ] again moves to the next charge`, /\(2 of \d+\)/.test(await live()), await live());
  await pg.keyboard.press('[');
  const xOf = s => Number((/x = ([\d.]+) m/.exec(s) || [])[1]);
  const before = xOf(await live());
  await pg.keyboard.press('ArrowRight');
  await pg.keyboard.press('ArrowRight');
  await pg.waitForTimeout(150);
  const afterSmall = xOf(await live());
  await pg.keyboard.press('Shift+ArrowRight');
  await pg.waitForTimeout(150);
  const afterBig = xOf(await live());
  ok(`${id}: arrows move the selected charge (0.05 m steps, Shift = 0.25 m)`,
    Math.abs(afterSmall - before - 0.10) < 0.011 && Math.abs(afterBig - afterSmall - 0.25) < 0.011, `${before} -> ${afterSmall} -> ${afterBig}`);
  const nBeforeAdd = await count();
  await pg.keyboard.press('+');
  await pg.waitForTimeout(250);
  ok(`${id}: + adds a positive charge and announces it`, (await count()) === nBeforeAdd + 1 && /Added \+/.test(await live()), `${nBeforeAdd} -> ${await count()} | ${await live()}`);
  await pg.keyboard.press('-');
  await pg.waitForTimeout(250);
  ok(`${id}: − adds a negative charge`, (await count()) === nBeforeAdd + 2 && /Added −/.test(await live()), await live());
  await pg.keyboard.press('Delete');
  await pg.waitForTimeout(250);
  ok(`${id}: Delete removes the selected charge`, (await count()) === nBeforeAdd + 1 && /Removed/.test(await live()), await live());
  await pg.keyboard.press('Control+z');
  await pg.waitForTimeout(250);
  ok(`${id}: Ctrl+Z undoes a keyboard deletion (same undo path as the pointer)`, (await count()) === nBeforeAdd + 2, String(await count()));
  await pg.keyboard.press(']');
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(150);
  ok(`${id}: Esc clears the selection`, /Selection cleared/.test(await live()), await live());
  /* the page's keys must not leak into the canvas handler when focus is elsewhere */
  await pg.focus(`${panel} [data-sb-act="undo"]`);
  const nIdle = await count();
  await pg.keyboard.press('+');
  ok(`${id}: + typed while a button has focus does nothing to the canvas`, (await count()) === nIdle);
  await ctx.close();
}

/* 3: touch */
{
  const { ctx, pg } = await open('/topics/fields.html', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await reveal(pg, '#sim-arena');
  await pg.click('#sim-arena-panel [data-sb-act="clear"]');
  await pg.tap('#sim-arena-panel [data-sb-tool="add+"]');
  await pg.locator('#sim-arena').scrollIntoViewIfNeeded();   // the toolbar tap leaves the canvas partly below the fold
  await pg.evaluate(() => document.getElementById('sim-arena').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(500);
  const box = await pg.locator('#sim-arena').boundingBox();
  await pg.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await pg.waitForTimeout(500);
  const n = await pg.evaluate(() => Number(document.querySelector('#sim-arena-panel .stat-value').textContent.trim()));
  ok('touch: tapping the canvas with the + charge tool places a charge', n === 1, String(n));
  const fit = await pg.evaluate(() => {
    const c = document.getElementById('sim-arena').getBoundingClientRect();
    return { right: Math.round(c.right), vw: innerWidth, pan: getComputedStyle(document.getElementById('sim-arena')).touchAction };
  });
  ok('touch: the canvas fits the phone width and still lets the page scroll vertically (touch-action pan-y)',
    fit.right <= fit.vw && /pan-y/.test(fit.pan), JSON.stringify(fit));
  await ctx.close();
}

/* 4: lifecycle */
{
  const { ctx, pg } = await open('/index.html');
  const stats = () => pg.evaluate(() => EMC.stats());
  const scrollAll = () => pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } });
  const seen = {};
  for (let i = 0; i < 4; i++) {
    for (const ch of ['ch1', 'ch2']) {
      await pg.evaluate(c => { location.hash = '#/' + c; }, ch);
      await pg.waitForTimeout(1300);
      await scrollAll();
      await pg.waitForTimeout(400);
      const s = await stats();
      (seen[ch] = seen[ch] || []).push(s.stages + '/' + s.listeners);
    }
  }
  ok('lifecycle: stage and listener counts are identical on every one of 4 visits to each chapter (no leaks)',
    seen.ch1.every(v => v === seen.ch1[0]) && seen.ch2.every(v => v === seen.ch2[0]), JSON.stringify(seen));
  await pg.evaluate(() => { location.hash = '#/'; });
  await pg.waitForTimeout(1300);
  const home = await stats();
  ok('lifecycle: back on the home view every stage, listener and animation loop is gone', home.stages === 0 && home.listeners === 0 && home.rafs === 0, JSON.stringify(home));
  await pg.evaluate(() => { location.hash = '#/ch2'; });
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => scrollTo(0, 0));
  await pg.waitForTimeout(1500);
  const away = await stats();
  ok('lifecycle: with every simulation scrolled off-screen no animation loop is running', away.rafs === 0, JSON.stringify(away));
  await ctx.close();
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'SIMULATION CONTRACT PASS' : fails + ' SIMULATION FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
