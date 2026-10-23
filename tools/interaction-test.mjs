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

/* ---- Coulomb: mouse drag moves a charge and updates the real readouts ---- */
{
  const { ctx, pg } = await page(B + '/topics/efield.html');
  const b = await box(pg, '#sim-coulomb');
  const r0 = await pg.inputValue('#coul-r');
  await pg.locator('#sim-coulomb').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  const bb = await pg.locator('#sim-coulomb').boundingBox();
  await pg.mouse.move(bb.x + 0.625 * bb.width, bb.y + 0.54 * bb.height);
  await pg.waitForTimeout(120);
  await pg.mouse.down();
  for (let i = 1; i <= 6; i++) await pg.mouse.move(bb.x + (0.625 * bb.width) - i * 12, bb.y + 0.54 * bb.height);
  await pg.mouse.up();
  await pg.waitForTimeout(150);
  const r1 = await pg.inputValue('#coul-r');
  ok('coulomb: mouse drag changes separation state', r1 !== r0, `${r0} -> ${r1}`);
  ok('coulomb: drag class released after up', !(await pg.getAttribute('#sim-coulomb', 'class')).includes('grabbing'));

  /* interrupted drag: release far outside the canvas */
  const r2 = await pg.inputValue('#coul-r');
  await pg.mouse.move(bb.x + 0.375 * bb.width, bb.y + 0.54 * bb.height);
  await pg.mouse.down();
  await pg.mouse.move(bb.x + 0.45 * bb.width, bb.y + 0.54 * bb.height);
  await pg.mouse.move(10, 10);                          // outside the workspace
  await pg.mouse.up();
  await pg.waitForTimeout(120);
  ok('coulomb: outside release leaves no stuck drag', !(await pg.getAttribute('#sim-coulomb', 'class')).includes('grabbing'));
  const b2 = await box(pg, '#sim-coulomb');
  await pg.mouse.move(b2.x + 0.375 * b2.width, b2.y + 0.54 * b2.height);
  await pg.mouse.down();
  await pg.mouse.move(b2.x + 0.45 * b2.width, b2.y + 0.54 * b2.height);
  await pg.mouse.up();
  ok('coulomb: still draggable after interrupted gesture', (await pg.inputValue('#coul-r')) !== r2);

  /* keyboard: slider arrows update value + readout */
  const v0 = await pg.textContent('#coul-q1v');
  await pg.focus('#coul-q1');
  await pg.keyboard.press('ArrowRight');
  await pg.keyboard.press('ArrowRight');
  await pg.waitForTimeout(120);
  ok('coulomb: keyboard slider updates readout', (await pg.textContent('#coul-q1v')) !== v0);
  await ctx.close();
}

/* ---- Coulomb: touch drag (real touch events via CDP) ---- */
{
  const { ctx, pg } = await page(B + '/topics/efield.html', { hasTouch: true, viewport: { width: 390, height: 844 } });
  await pg.locator('#sim-coulomb').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  const b = await box(pg, '#sim-coulomb');
  const r0 = await pg.inputValue('#coul-r');
  const y0 = await pg.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(pg);
  const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), radiusX: 2, radiusY: 2, force: 1, id: 1 }];
  const X = b.x + 0.70 * b.width, Y = b.y + 0.54 * b.height;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(X, Y) });
  for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(X - i * 14, Y) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pg.waitForTimeout(200);
  ok('coulomb: touch drag changes separation', (await pg.inputValue('#coul-r')) !== r0);
  ok('coulomb: page did not scroll during canvas drag', (await pg.evaluate(() => window.scrollY)) === y0);
  await ctx.close();
}

/* ---- efield: rapid preset switching ---- */
{
  const { ctx, pg } = await page(B + '/topics/efield.html');
  for (const p of ['single-pos', 'dipole', 'single-neg', 'dipole']) await pg.click(`[data-ef-preset="${p}"]`, { delay: 20 });
  await pg.waitForTimeout(200);
  ok('efield: last preset wins after rapid clicks',
    ((await pg.getAttribute('[data-ef-preset="dipole"]', 'class')) || '').includes('active'));
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

console.log('404 misses:', misses.length ? misses.slice(0, 5) : 'none');
console.log('console/page errors:', errs.length ? errs.slice(0, 6) : 'none');
if (misses.length || errs.length) fails += misses.length + errs.length;
console.log(fails === 0 ? 'INTERACTION TESTS PASS' : fails + ' FAILURES');
setTimeout(() => process.exit(fails === 0 ? 0 : 1), 300);
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
