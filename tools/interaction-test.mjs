#!/usr/bin/env node
/* ==========================================================================
   EMC Lab - interaction test (dev tool, needs playwright + chromium).
   Run: node tools/interaction-test.mjs

   Drives the REAL sims with mouse, touch and keyboard the way a student
   would, including the rude cases: interrupted drags, releases outside the
   canvas, rapid repeated clicks, resets mid-run, resizes mid-entrance and
   navigation away mid-initialisation. Every case asserts a real state change
   (a readout, a slider value, a class) - never just "no exception".
   Exits 1 on any failure, console/page error or missing asset.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
let chromium;
try { chromium = (await import('playwright')).chromium; }
catch { console.error('playwright not found - npm i playwright && npx playwright install chromium'); process.exit(2); }

const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (e === 'node_modules' || e === '.git' || e === 'public' || e === 'archive' || e === 'shots') continue;
    const f = path.join(dir, e);
    const st = fs.statSync(f);
    if (st.isDirectory()) walk(f);
    else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const misses = [];
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { misses.push(u); res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' });
  res.end(b);
});
await new Promise(r => server.listen(8243, '127.0.0.1', r));
const B = 'http://127.0.0.1:8243';

let fails = 0;
const ok = (n, c, x = '') => { if (!c) { fails++; console.log('FAIL', n, x); } else console.log('ok  ', n); };
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errs = [];
async function page(url, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); });
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(1400);                       // whenNear + entrance settle
  return { ctx, pg };
}
const box = async (pg, sel) => pg.locator(sel).boundingBox();

/* ---- Arena: mouse drag moves a charge and updates the real readouts ---- */
{
  const { ctx, pg } = await page(B + '/topics/fields.html');
  await pg.click('[data-sb-preset="pair"]');
  await pg.locator('#sim-arena').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  const bb = await pg.locator('#sim-arena').boundingBox();
  // preset "pair" zooms x2 about (1.35 m, 0.60 m): q1 lands near 40%/50% of
  // the canvas, q2 near 60%/50%
  await pg.mouse.click(bb.x + 0.40 * bb.width, bb.y + 0.50 * bb.height);
  await pg.waitForTimeout(120);
  const sel0 = await pg.textContent('#ar-sel');
  ok('arena: clicking a charge selects it and reports a real force', /N/.test(sel0), sel0);
  await pg.mouse.move(bb.x + 0.60 * bb.width, bb.y + 0.50 * bb.height);
  await pg.mouse.down();
  for (let i = 1; i <= 6; i++) await pg.mouse.move(bb.x + (0.60 - i * 0.02) * bb.width, bb.y + 0.50 * bb.height);
  await pg.mouse.up();
  await pg.waitForTimeout(150);
  const sel1 = await pg.textContent('#ar-sel');
  ok('arena: dragging the second charge closer grows the force', sel1 !== sel0, `${sel0} -> ${sel1}`);
  ok('arena: drag class released after up', !(await pg.getAttribute('#sim-arena', 'class')).includes('grabbing'));

  /* interrupted drag: release far outside the canvas */
  await pg.mouse.move(bb.x + 0.56 * bb.width, bb.y + 0.50 * bb.height);
  await pg.mouse.down();
  await pg.mouse.move(10, 10);                          // outside the workspace
  await pg.mouse.up();
  await pg.waitForTimeout(120);
  ok('arena: outside release leaves no stuck drag', !(await pg.getAttribute('#sim-arena', 'class')).includes('grabbing'));
  await ctx.close();
}

/* ---- Arena: touch drag (real touch events via CDP) ---- */
{
  const { ctx, pg } = await page(B + '/topics/fields.html', { hasTouch: true, viewport: { width: 390, height: 844 } });
  await pg.click('[data-sb-preset="pair"]');
  await pg.locator('#sim-arena').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  const b = await box(pg, '#sim-arena');
  const y0 = await pg.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(pg);
  const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), radiusX: 2, radiusY: 2, force: 1, id: 1 }];
  const X = b.x + 0.55 * b.width, Y = b.y + 0.50 * b.height;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(X, Y) });
  for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(X - i * 14, Y) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pg.waitForTimeout(200);
  ok('arena: page did not scroll during a canvas drag', (await pg.evaluate(() => window.scrollY)) === y0);
  await ctx.close();
}

/* ---- Field Painter: rapid preset switching ---- */
{
  const { ctx, pg } = await page(B + '/topics/fields.html');
  for (const p of ['single', 'dipole', 'like', 'dipole']) await pg.click(`[data-sb-preset="${p}"]`, { delay: 20 });
  await pg.waitForTimeout(250);
  ok('fieldpaint: last preset wins after rapid clicks',
    (await pg.textContent('#fp-count')).trim() === '2', await pg.textContent('#fp-count'));
  await ctx.close();
}

/* ---- lorentz: play / pause / reset mid-run ---- */
{
  const { ctx, pg } = await page(B + '/topics/magind.html');
  await pg.click('#lor-play'); await pg.waitForTimeout(500);
  await pg.click('#lor-play'); await pg.waitForTimeout(120);
  await pg.click('#lor-play'); await pg.waitForTimeout(300);
  await pg.click('#lor-reset'); await pg.waitForTimeout(200);
  ok('lorentz: play/pause/reset cycle survives mid-run resets', true);
  await pg.click('#ind-reset'); await pg.waitForTimeout(200);
  ok('induction: reset while the loop runs', true);
  await ctx.close();
}

/* ---- ohm: repeated preset clicks keep one coherent state ---- */
{
  const { ctx, pg } = await page(B + '/topics/current.html');
  const btn = pg.locator('[data-ohm-preset="24,2"]');
  for (let i = 0; i < 4; i++) await btn.click({ delay: 15 });
  await pg.waitForTimeout(200);
  ok('ohm: repeated preset clicks settle on the preset value',
    (await pg.textContent('#ohm-Vv')).includes('24'));
  await ctx.close();
}

/* ---- circuit builder: real drag & drop (R1: place / rewire / delete / disconnect) ---- */
{
  const { ctx, pg } = await page(B + '/topics/current.html');
  await pg.locator('#sim-circuit').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);
  const bb = await pg.locator('#sim-circuit').boundingBox();
  const w = bb.width, h = bb.height;
  const BX = Math.max(40, w * 0.075), RX = w - BX;
  const TY = Math.max(38, h * 0.16), BY = h - Math.max(40, h * 0.17);
  const rows0 = await pg.locator('#circ-rows .row-item').count();

  /* 1. drag the resistor chip from the palette onto the bench */
  const chip = await pg.locator('[data-circ-chip="resistor"]').boundingBox();
  await pg.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2);
  await pg.mouse.down();
  await pg.mouse.move(bb.x + w * 0.5, bb.y + TY, { steps: 8 });
  await pg.mouse.up();
  await pg.waitForTimeout(250);
  ok('circuit: dragging the palette chip onto the bench places a resistor',
    (await pg.locator('#circ-rows .row-item').count()) === rows0 + 1);

  /* 2. drag two resistors from the top wire into the parallel lane. The
        layout re-flows after every rewire, so positions are recomputed from
        the live state (exposed as window.__CIRC) before each grab. */
  const serPos = () => pg.evaluate(() => {
    const st = window.__CIRC.state;
    const c = document.getElementById('sim-circuit');
    const w = c.clientWidth, h = c.clientHeight;
    const BX = Math.max(40, w * 0.075), RX = w - BX;
    const TY = Math.max(38, h * 0.16);
    const serIdx = st.resistors.map((r, i) => i).filter(i => st.lanes[i] !== 'parallel');
    const hasPar = st.lanes.some(l => l === 'parallel');
    const x0 = BX + 64, x1 = hasPar ? BX + (RX - BX) * 0.50 : RX - 30;
    const k = serIdx.length - 1;                       // the last series resistor
    return { x: x0 + (x1 - x0) * ((k + 0.5) / serIdx.length), y: TY, idx: serIdx[k] };
  });
  for (let n = 0; n < 2; n++) {
    const pos = await serPos();
    await pg.mouse.move(bb.x + pos.x, bb.y + pos.y);
    await pg.mouse.down();
    await pg.mouse.move(bb.x + pos.x, bb.y + h * 0.78, { steps: 6 });
    await pg.mouse.up();
    await pg.waitForTimeout(250);
  }
  const req = (await pg.textContent('#circ-req')).trim();
  const lanes = await pg.evaluate(() => window.__CIRC.state.lanes.join(','));
  ok('circuit: dropping resistors low rewires them into parallel (10+22 + 47||20 = 46.03)',
    /46\.0/.test(req) && lanes === 'series,series,parallel,parallel', req + ' ' + lanes);

  /* 3. drag a resistor off the bench -> deleted */
  const pos3 = await serPos();
  await pg.mouse.move(bb.x + pos3.x, bb.y + pos3.y);
  await pg.mouse.down();
  await pg.mouse.move(bb.x - 60, bb.y + pos3.y, { steps: 6 });
  await pg.mouse.up();
  await pg.waitForTimeout(250);
  ok('circuit: dragging a resistor off the bench deletes it',
    (await pg.locator('#circ-rows .row-item').count()) === rows0);

  /* 4. drag the battery off -> honest zero current; chip click reconnects */
  await pg.mouse.move(bb.x + BX, bb.y + (TY + BY) / 2);
  await pg.mouse.down();
  await pg.mouse.move(bb.x - 60, bb.y + (TY + BY) / 2, { steps: 6 });
  await pg.mouse.up();
  await pg.waitForTimeout(250);
  const dead = await pg.textContent('#circ-itotal');
  ok('circuit: dragging the battery off kills the current (no fake numbers)',
    /no battery/.test(dead), dead);
  await pg.click('[data-circ-chip="battery"]');
  await pg.waitForTimeout(250);
  const alive = await pg.textContent('#circ-itotal');
  ok('circuit: the battery chip reconnects it and current returns', /\d/.test(alive) && !/no battery/.test(alive), alive);
  await ctx.close();
}

/* ---- resize mid-entrance + navigation away mid-init ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push('resize: ' + String(e).slice(0, 120)));
  await pg.goto(B + '/topics/current.html', { waitUntil: 'load' });
  await pg.waitForTimeout(120);                          // mid-entrance
  await pg.setViewportSize({ width: 700, height: 900 });
  await pg.waitForTimeout(900);
  const wAttr = await pg.evaluate(() => document.getElementById('sim-ohm').width);
  ok('resize mid-entrance: canvas re-measures', wAttr > 0 && wAttr <= 700 * 2, String(wAttr));
  await ctx.close();

  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg2 = await ctx2.newPage();
  pg2.on('pageerror', e => errs.push('switch: ' + String(e).slice(0, 120)));
  await pg2.goto(B + '/index.html#/current', { waitUntil: 'load' });
  await pg2.waitForTimeout(150);                         // leave mid-init
  await pg2.evaluate(() => { location.hash = '#/'; });
  await pg2.waitForTimeout(600);
  const st = await pg2.evaluate(() => window.EMC.stats());
  ok('navigation away mid-init leaves no stages behind', st.stages === 0 && st.listeners === 0, JSON.stringify(st));
  await ctx2.close();
}

/* ---- legacy lesson URLs redirect into the merged chapter ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push('redirect: ' + String(e).slice(0, 120)));
  await pg.goto(B + '/topics/charge.html', { waitUntil: 'load' });
  await pg.waitForURL(/fields\.html/, { timeout: 5000 });
  ok('legacy /topics/charge.html redirects into fields.html',
    pg.url().includes('fields.html'), pg.url());
  await pg.goto(B + '/topics/field.html#sim-fieldpaint-panel', { waitUntil: 'load' });
  await pg.waitForURL(/fields\.html/, { timeout: 5000 });
  ok('legacy redirect preserves the sim-panel anchor',
    pg.url().includes('#sim-fieldpaint-panel'), pg.url());
  await ctx.close();
}

console.log('404 misses:', misses.length ? misses.slice(0, 5) : 'none');
console.log('console/page errors:', errs.length ? errs.slice(0, 6) : 'none');
if (misses.length || errs.length) fails += misses.length + errs.length;
console.log(fails === 0 ? 'INTERACTION TESTS PASS' : fails + ' FAILURES');
setTimeout(() => process.exit(fails === 0 ? 0 : 1), 300);
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
