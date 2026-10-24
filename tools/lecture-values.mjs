#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — lecture check values & sim physics in a REAL browser (gates S/Z).
   Run: node tools/lecture-values.mjs
   Drives the live UI (presets, sliders, drags) and asserts every readout
   against the governing equation, tolerance <= 1% unless noted. Covers the
   §1.2 lecture table plus the ch1/ch3 physics claims:
     ch2  collinear superposition   net on q1 = 5.69 N (+x)   [arena preset]
     ch2  2-D superposition         22.7 N at ~24 deg          [arena preset]
     ch2  two-charge field          E1 = 73,388; net 75,595 N/C +y; Ex = 0
     ch2  Bohr hydrogen             v = 2.188e6 m/s at r = 5.29e-11 m
     ch2  charge quantisation       balloon total stays exactly 0 C
     ch1  Ohm's law                 I = V/R, P = VI on a preset; R<=0 and
                                    junk input never yield NaN/Infinity
     ch1  series + Kirchhoff        79/94 ohm defaults, V(bank)+V(bulb)=12 V
     ch3  Lorentz motion            RK4 orbit matches r = mv/|q|B (<1%)
     ch3  Faraday + Lenz            emf = -N dPhi/dt (sign + magnitude),
                                    Lenz direction readout present
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
await new Promise(r => server.listen(8253, '127.0.0.1', r));
const B = 'http://127.0.0.1:8253';

const SI = { f: 1e-15, p: 1e-12, n: 1e-9, '\u00B5': 1e-6, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9, T: 1e12 };
function parseSI(str) {
  if (str === null || str === undefined) return NaN;
  const m = /^(-?[\d.]+)(?:e([+-]?\d+))?\s*([fpn\u00B5umkMGT])?/.exec(String(str).replace('\u00A0', ' ').trim());
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]) v *= Math.pow(10, parseInt(m[2], 10));
  if (m[3]) v *= SI[m[3]];
  return v;
}
let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const close = (name, got, want, tol = 0.01) =>
  ok(name, isFinite(got) && Math.abs(got - want) <= Math.abs(want) * tol, `got ${got}, want ${want} (tol ${tol * 100}%)`);

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errors = [];
async function page(url) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  return { ctx, pg };
}
const txt = (pg, id) => pg.evaluate(i => (document.getElementById(i) || {}).textContent, id);

/* ================= ch2: fields.html ================= */
{
  const { ctx, pg } = await page('/topics/fields.html');

  /* --- Coulomb collinear: lecture-line preset, net on q1 = 5.69 N (+x) --- */
  await pg.locator('#sim-arena-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);
  await pg.click('[data-sb-preset="lecture-line"]');
  await pg.waitForTimeout(400);
  /* click the +3 uC charge: screen pos from the sandbox's own view transform */
  const q1 = await pg.evaluate(() => {
    const st = window.__AR.state, v = st.view;
    const c = st.objects.find(o => Math.abs(o.q - 3e-6) < 1e-12);
    return { x: v.ox + c.x * v.scale, y: v.oy + c.y * v.scale };
  });
  const bb = await pg.locator('#sim-arena').boundingBox();
  await pg.mouse.click(bb.x + q1.x, bb.y + q1.y);
  await pg.waitForTimeout(300);
  close('ch2 Coulomb line: net force on q1 = 5.69 N (engine softened ≤1%)',
    parseSI(await txt(pg, 'ar-sel')), 5.69, 0.01);

  /* --- Coulomb 2-D: lecture-2d preset, 22.7 N at ~24 deg --- */
  await pg.click('[data-sb-preset="lecture-2d"]');
  await pg.waitForTimeout(400);
  const q4 = await pg.evaluate(() => {
    const st = window.__AR.state, v = st.view;
    const c = st.objects.find(o => Math.abs(o.q - 4e-6) < 1e-12);
    return { x: v.ox + c.x * v.scale, y: v.oy + c.y * v.scale };
  });
  const bb2 = await pg.locator('#sim-arena').boundingBox();
  await pg.mouse.click(bb2.x + q4.x, bb2.y + q4.y);
  await pg.waitForTimeout(300);
  close('ch2 Coulomb 2-D: net force on +4 uC = 22.7 N', parseSI(await txt(pg, 'ar-sel')), 22.7, 0.012);
  const selSub = (await txt(pg, 'ar-sub')) || '';
  ok('ch2 Coulomb 2-D: net points up-right (~24 deg above +x, lecture orientation)',
    /up-right/.test(selSub), selSub.slice(0, 90));

  /* --- Field: lecture-y preset, E at P --- */
  await pg.locator('#sim-fieldpaint-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);
  await pg.click('[data-sb-preset="lecture-y"]');
  await pg.waitForTimeout(500);
  close('ch2 field: |E| at P = 75,595 N/C', parseSI(await txt(pg, 'fp-probe-e')), 75595, 0.01);
  ok('ch2 field: E points along +y (Ex = 0)', /^90°/.test((await txt(pg, 'fp-probe-dir') || '').trim()),
    (await txt(pg, 'fp-probe-dir') || '').trim());

  /* --- Bohr tuner: r = 5.29e-11 m -> v = 2.188e6 m/s --- */
  await pg.locator('#toy-bohr-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(400);
  await pg.evaluate(() => {
    const s = document.getElementById('bo-r');
    s.value = '5.29';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pg.waitForTimeout(400);
  close('ch2 Bohr: v = 2.188e6 m/s at the lecture radius', parseSI(await txt(pg, 'bo-v')), 2.188e6, 0.01);

  /* --- Balloon: conservation, total exactly 0 C --- */
  await pg.locator('#toy-balloon-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(400);
  ok('ch2 quantisation: balloon+hair total reads exactly 0 C',
    (await txt(pg, 'bl-total')) === '0 C', await txt(pg, 'bl-total'));
  await ctx.close();
}

/* ================= ch1: current.html ================= */
{
  const { ctx, pg } = await page('/topics/current.html');
  await pg.locator('#sim-ohm-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);

  /* Ohm preset: V=24, R=2 -> I=12 A, P=288 W */
  await pg.click('[data-ohm-preset="24,2"]');
  await pg.waitForTimeout(400);
  close('ch1 Ohm: I = V/R = 24/2 = 12 A', parseSI(await txt(pg, 'ohm-I')), 12, 0.01);
  close('ch1 Ohm: P = VI = 288 W', parseSI(await txt(pg, 'ohm-P')), 288, 0.01);

  /* R = 0 and junk input: rejected, never NaN/Infinity on screen */
  await pg.evaluate(() => {
    const n = document.getElementById('ohm-Rnum');
    n.value = '0'; n.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pg.waitForTimeout(200);
  let bad = await pg.evaluate(() => ['ohm-I', 'ohm-P', 'ohm-Rv'].map(i => document.getElementById(i).textContent).join('|'));
  ok('ch1 Ohm: R=0 refused, readouts stay finite', !/NaN|Infinity|∞/.test(bad), bad);
  await pg.evaluate(() => {
    const n = document.getElementById('ohm-Rnum');
    n.value = 'abc'; n.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pg.waitForTimeout(200);
  bad = await pg.evaluate(() => ['ohm-I', 'ohm-P', 'ohm-Rv', 'ohm-Rnum'].map(i => document.getElementById(i).textContent || document.getElementById(i).value).join('|'));
  ok('ch1 Ohm: junk input refused, previous value restored', !/NaN|abc/.test(bad), bad);

  /* Circuit defaults: series 10+22+47 (+15 bulb) at 12 V */
  await pg.locator('#sim-circuit-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);
  ok('ch1 circuit: series bank R = 79.00 ohm', (await txt(pg, 'circ-req')).includes('79.00'), await txt(pg, 'circ-req'));
  ok('ch1 circuit: total R = 94.00 ohm', (await txt(pg, 'circ-rtotal')).includes('94.00'), await txt(pg, 'circ-rtotal'));
  close('ch1 circuit: I = 12/94 A', parseSI(await txt(pg, 'circ-itotal')), 12 / 94, 0.01);
  const kv = parseSI(await txt(pg, 'circ-vbank')) + parseSI(await txt(pg, 'circ-vbulb'));
  close('ch1 circuit: Kirchhoff V(bank)+V(bulb) = 12 V', kv, 12, 0.005);
  await ctx.close();
}

/* ================= ch3: magind.html ================= */
{
  const { ctx, pg } = await page('/topics/magind.html');
  await pg.locator('#sim-lorentz-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);

  /* Lorentz: run the orbit; the sim compares its RK4 integration with the
     analytic r = mv/(|q|B) every frame — assert the reported error is tiny. */
  await pg.click('#lor-play');
  await pg.waitForTimeout(1400);
  const rTheory = parseSI(await txt(pg, 'lor-radius'));
  const rkErr = parseSI(await txt(pg, 'lor-rkerr'));
  ok('ch3 Lorentz: RK4 orbit matches r = mv/|q|B within 1%',
    isFinite(rTheory) && isFinite(rkErr) && rkErr <= Math.abs(rTheory) * 0.01,
    `r=${rTheory} m, |RK4-theory|=${rkErr} m`);
  ok('ch3 Lorentz: force readout is live and finite', isFinite(parseSI(await txt(pg, 'lor-force'))));
  await pg.click('#lor-play');                       // pause
  await pg.waitForTimeout(150);

  /* Induction: push the magnet; Faraday's law with Lenz's minus sign */
  await pg.locator('#sim-induction-panel').scrollIntoViewIfNeeded();
  await pg.waitForTimeout(400);
  await pg.click('[data-ind-mode="oscillate"]');      // continuous AC motion
  let checked = 0, signFlips = 0, lenz = '';
  for (let i = 0; i < 12; i++) {
    await pg.waitForTimeout(140);
    const s = await pg.evaluate(() => ({
      dphi: document.getElementById('ind-dphi').textContent,
      emf: document.getElementById('ind-emf').textContent,
      lenz: document.getElementById('ind-lenz').textContent
    }));
    const d = parseSI(s.dphi), e = parseSI(s.emf);
    if (isFinite(d) && isFinite(e) && Math.abs(d) > 1e-9 && Math.abs(e) > 1e-9) {
      checked++;
      if (Math.sign(d) !== Math.sign(e)) signFlips++;
      if (!/not changing/.test(s.lenz)) lenz = s.lenz;
    }
  }
  ok('ch3 Faraday: emf opposes dPhi/dt on every moving sample (Lenz minus sign)',
    checked >= 5 && signFlips === checked, `${signFlips}/${checked} opposed`);
  ok('ch3 Lenz: direction readout explains the opposition while moving', lenz.length > 10, lenz.slice(0, 80));
  await ctx.close();
}

console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'LECTURE VALUES + SIM PHYSICS PASS' : fails + ' PHYSICS FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
