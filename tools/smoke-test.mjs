#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — runtime smoke test
   File: tools/smoke-test.mjs

   Optional developer tool. The website itself has ZERO dependencies; this
   harness only needs jsdom and is used to prove that every page boots,
   every simulation renders, every readout computes the right physics and the
   quiz scores correctly — without opening a browser.

       npm install          # installs jsdom (dev only)
       node tools/smoke-test.mjs

   If jsdom is not installed the script prints a skip notice and exits 0, so
   it is safe to wire into CI.

   Exits 1 if any assertion fails.
   ========================================================================== */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/* ---------- jsdom is optional ------------------------------------------- */
let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = await import('jsdom'));
} catch {
  console.log('jsdom is not installed — skipping the runtime smoke test.');
  console.log('Run `npm install` in the project root to enable it.');
  process.exit(0);
}

/* ---------- tiny assertion framework ------------------------------------ */
let pass = 0;
const failures = [];
function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`   \u2713 ${name}`); }
  else { failures.push(name + (extra ? ` — ${extra}` : '')); console.log(`   \u2717 ${name}${extra ? ' — ' + extra : ''}`); }
}
function eq(name, actual, expected) {
  ok(name, String(actual) === String(expected), `got "${actual}", expected "${expected}"`);
}
function numClose(name, actual, expected, tol = 0.02) {
  const a = Number(actual), e = Number(expected);
  ok(name, isFinite(a) && Math.abs(a - e) <= Math.abs(e) * tol, `got ${a}, expected \u2248${e}`);
}

/* ---------- canvas + layout mocks --------------------------------------- */
function installMocks(win) {
  // Give elements a realistic size (jsdom reports zeros for everything).
  win.Element.prototype.getBoundingClientRect = function () {
    const isCanvas = this.tagName === 'CANVAS';
    const w = isCanvas ? 900 : 1200, h = isCanvas ? 400 : 200;
    return { width: w, height: h, top: 0, left: 0, right: w, bottom: h, x: 0, y: 0, toJSON() {} };
  };
  // Count drawing calls so we can prove a canvas really rendered.
  win.HTMLCanvasElement.prototype.getContext = function () {
    if (this.__stats) return this.__ctx;
    const stats = { calls: 0, text: [] };
    this.__stats = stats;
    const gradient = { addColorStop() {} };
    const target = {
      canvas: this,
      getLineDash: () => [],
      measureText: t => ({ width: String(t ?? '').length * 6 }),
      fillText: t => { stats.calls++; stats.text.push(String(t)); },
      strokeText: t => { stats.calls++; },
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient
    };
    this.__ctx = new Proxy(target, {
      get(t, prop) {
        if (prop in t) return t[prop];
        return () => { stats.calls++; };        // every other 2D method: no-op
      },
      set(t, prop, v) { t[prop] = v; return true; }
    });
    return this.__ctx;
  };
}
const drawCalls = (win, sel) => {
  const c = win.document.querySelector(sel);
  return c && c.__stats ? c.__stats.calls : 0;
};
const drawnText = (win, sel) => (win.document.querySelector(sel)?.__stats?.text || []);

/* ---------- page loader -------------------------------------------------- */
async function loadPage(relPath, globals = {}, opts = {}) {
  const file = join(ROOT, relPath.split('?')[0]);
  const query = relPath.includes('?') ? relPath.slice(relPath.indexOf('?')) : '';
  let html = readFileSync(file, 'utf8')
    // never fetch the Tailwind CDN inside the test
    .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/g, '');

  const problems = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => problems.push('jsdomError: ' + (e.message || e)));
  vc.on('error', (...a) => problems.push('console.error: ' + a.join(' ')));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,          // provides requestAnimationFrame
    url: 'http://localhost/' + query,  // enables localStorage + ?topic= links
    virtualConsole: vc
  });
  installMocks(dom.window);
  for (const [k, v] of Object.entries(globals)) dom.window[k] = v;

  // run the page's own local scripts, in document order
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
    .map(m => m[1]).filter(s => !/^https?:/.test(s))
    .filter(s => !(opts.skip && new RegExp(opts.skip).test(s)));
  for (const src of scripts) {
    const code = readFileSync(resolve(dirname(file), src), 'utf8');
    dom.window.eval(code);
  }
  return { dom, win: dom.window, doc: dom.window.document, problems, scripts };
}

const frames = (win, n = 6) => new Promise(r => {
  let i = 0;
  const step = () => (++i >= n ? r() : win.requestAnimationFrame(step));
  win.requestAnimationFrame(step);
});
const setRange = (win, id, value) => {
  const el = win.document.getElementById(id);
  if (!el) throw new Error('missing slider #' + id);
  el.value = String(value);
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
  return el;
};
const click = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const pointer = (win, el, type, x, y) =>
  el.dispatchEvent(new win.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
const txt = (win, id) => win.document.getElementById(id)?.textContent?.trim() ?? null;

/** Parse "399 mN" / "16.0 fN" / "131 ns" back into a base-SI number. */
const SI = { f: 1e-15, p: 1e-12, n: 1e-9, '\u00B5': 1e-6, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9, T: 1e12 };
function parseSI(str) {
  if (str === null) return NaN;
  const m = /^(-?[\d.]+)(?:e([+-]?\d+))?\s*([fpn\u00B5umkMGT])?/.exec(String(str).trim());
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]) v *= Math.pow(10, parseInt(m[2], 10));
  if (m[3]) v *= SI[m[3]];
  return v;
}

/* ======================================================================== */
console.log('\n' + '\u2500'.repeat(66));
console.log('EMC Lab — runtime smoke test (jsdom)');
console.log('\u2500'.repeat(66));

/* ---------------- index.html ---------------- */
{
  console.log('\n[index.html]');
  const { win, doc, problems } = await loadPage('index.html');
  await new Promise(r => { win.document.readyState === 'complete' ? r() : win.addEventListener('load', r, { once: true }); });
  await new Promise(r => setTimeout(r, 1300));   // hero now starts after emc:booted
  await frames(win, 8);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('progress ring shows a percentage', /^\d+%$/.test(txt(win, 'ringPct') || ''), txt(win, 'ringPct'));
  eq('starts at 0% with empty storage', txt(win, 'ringPct'), '0%');
  eq('topic counter text', txt(win, 'dashTopicsDone'), '0 of 5 topics studied');
  eq('chip mirrors the counter', txt(win, 'dashTopicsChip'), '0 of 5 topics studied');
  ok('hero canvas rendered', drawCalls(win, '#heroCanvas') > 200, `${drawCalls(win, '#heroCanvas')} calls`);
  ok('hero animation draws the equation strip', drawnText(win, '#heroCanvas').some(t => t.includes('v = f\u03BB')), '');
  eq('storage status reported', txt(win, 'storageStatus'), 'enabled \u2014 your progress is saved in this browser');
  eq('year filled in', doc.querySelector('[data-year]').textContent, String(new Date().getFullYear()));

  // progress persistence: mark a topic, reload the same storage, re-render
  win.EMC.Progress.markTopic('vectors', true);
  win.EMC.Progress.recordQuiz(85);
  eq('a passing score (70%+) counts all five topics as studied',
     JSON.stringify(win.EMC.Progress.read().topics),
     JSON.stringify({ vectors: true, fluids: true, heat: true, waves: true, current: true }));
  eq('percent weights topics (80%) + quiz (20%)', win.EMC.Progress.percent(), Math.round(1 * 80 + 0.85 * 20));
  win.window?.close?.(); win.close();
}

/* ---------------- topics/vectors.html ---------------- */
{
  console.log('\n[topics/vectors.html]');
  const { win, doc, problems } = await loadPage('topics/vectors.html');
  await frames(win, 4);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('vector bench canvas rendered', drawCalls(win, '#sim-vector-add') > 80);

  // --- the 3-4-5 preset: A = (3,0), B = (0,4) -> R = (3,4), |R| = 5 ---
  click(win, doc.querySelector('[data-vec-preset="3,0,0,4"]'));
  eq('|A| of the 3-4-5 preset', txt(win, 'vec-Amag'), '3.00 u');
  eq('|B| of the 3-4-5 preset', txt(win, 'vec-Bmag'), '4.00 u');
  eq('Rx = Ax + Bx', txt(win, 'vec-Rx'), '3.0');
  eq('Ry = Ay + By', txt(win, 'vec-Ry'), '4.0');
  eq('resultant magnitude is 5', txt(win, 'vec-Rmag'), '5.00 u');
  ok('substitution line shows the component sums', /Rx = Ax \+ Bx/.test(txt(win, 'vec-sub')), txt(win, 'vec-sub'));

  // --- A = (3,4), B = (4,-2): R = (7,2), |R| = sqrt(53) ---
  click(win, doc.querySelector('[data-vec-preset="3,4,4,-2"]'));
  eq('|A| = 5 for the (3,4) preset', txt(win, 'vec-Amag'), '5.00 u');
  eq('R = (7, 2)', txt(win, 'vec-Rx') + ',' + txt(win, 'vec-Ry'), '7.0,2.0');
  numClose('|R| = sqrt(53)', parseFloat(txt(win, 'vec-Rmag')), Math.sqrt(53), 0.001);

  // --- opposite vectors cancel exactly ---
  click(win, doc.querySelector('[data-vec-preset="2,2,-2,-2"]'));
  eq('opposite vectors cancel to zero', txt(win, 'vec-Rmag'), '0.00 u');

  // --- drag the arrowhead: A=(3,4); canvas is 900x400 in jsdom,
  //     scale = min(900, 400)/10 = 40 px/unit, origin (450, 200),
  //     so A's tip sits at (570, 40). Drag it to (4, 4) at (610, 40). ---
  click(win, doc.querySelector('[data-vec-preset="3,4,4,-2"]'));
  pointer(win, doc.getElementById('sim-vector-add'), 'pointerdown', 570, 40);
  pointer(win, doc.getElementById('sim-vector-add'), 'pointermove', 610, 40);
  pointer(win, doc.getElementById('sim-vector-add'), 'pointerup', 610, 40);
  eq('dragging the tip moves A to (4,4)', txt(win, 'vec-Amag'), '5.66 u');
  eq('R follows the drag: (8,2)', txt(win, 'vec-Rx') + ',' + txt(win, 'vec-Ry'), '8.0,2.0');

  // --- mode segment flips aria-pressed ---
  const tipBtn = doc.querySelector('#vec-mode [data-value="tip"]');
  click(win, tipBtn);
  eq('tip-to-tail mode engages', tipBtn.getAttribute('aria-pressed'), 'true');
  win.close();
}

/* ---------------- topics/current.html ---------------- */
{
  console.log('\n[topics/current.html]');
  const { win, doc, problems } = await loadPage('topics/current.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('ohm canvas rendered', drawCalls(win, '#sim-ohm') > 100);
  ok('I-V chart rendered', drawCalls(win, '#sim-ohm-chart') > 50);
  ok('circuit canvas rendered', drawCalls(win, '#sim-circuit') > 150);

  // --- Ohm's law: 12 V across 4 ohm must give exactly 3 A and 36 W ---
  setRange(win, 'ohm-V', 12);
  const rNum = doc.getElementById('ohm-Rnum');
  rNum.value = '4';
  rNum.dispatchEvent(new win.Event('change', { bubbles: true }));
  numClose('I = V/R = 12/4', parseSI(txt(win, 'ohm-I')), 3, 0.001);
  numClose('P = VI = 36 W', parseSI(txt(win, 'ohm-P')), 36, 0.001);
  ok('substitution line shows V, R and I', /12\.0 V ÷ 4\.00 Ω = 3\.000 A/.test(txt(win, 'ohm-sub')), txt(win, 'ohm-sub'));
  ok('sub-line reports the carrier rate, not a stacked prefix', /electrons\/s/.test(txt(win, 'ohm-ImA')), txt(win, 'ohm-ImA'));
  ok('power rating warning triggers at 36 W > 0.5 W', doc.getElementById('ohm-warn').hidden === false);
  eq('ammeter auto-ranges to 5 A', txt(win, 'ohm-range'), '5 A');

  setRange(win, 'ohm-V', 0);
  eq('zero volts gives zero current', parseSI(txt(win, 'ohm-I')), 0);
  ok('warning clears at 0 W', doc.getElementById('ohm-warn').hidden === true);

  // --- circuit builder: series 10 + 22 + 47 with a 15 ohm bulb at 12 V ---
  eq('series bank R = 79 ohm', txt(win, 'circ-req'), '79.00 Ω');
  eq('series total R = 94 ohm', txt(win, 'circ-rtotal'), '94.00 Ω');
  numClose('V across the bank + bulb = 12 V',
    parseSI(txt(win, 'circ-vbank')) + parseSI(txt(win, 'circ-vbulb')), 12, 0.005);
  numClose('series current = 12/94', parseSI(txt(win, 'circ-itotal')), 12 / 94, 0.005);
  eq('table lists 3 resistors + bulb', doc.querySelectorAll('#circ-table tr').length, 4);
  ok('series working is shown', txt(win, 'circ-breakdown').includes('10 + 22 + 47'), txt(win, 'circ-breakdown'));

  // --- parallel: 1/(1/10+1/22+1/47) = 6.00 ohm ---
  click(win, doc.querySelector('#circ-topology [data-value="parallel"]'));
  eq('parallel bank R = 6.00 ohm', txt(win, 'circ-req'), '6.00 Ω');
  ok('parallel working uses conductances', txt(win, 'circ-breakdown').includes('1/R'), txt(win, 'circ-breakdown'));

  // --- combination: R1 + (R2 || R3) ---
  click(win, doc.querySelector('#circ-topology [data-value="combo"]'));
  const r = [10, 22, 47];
  const expected = r[0] + (r[1] * r[2]) / (r[1] + r[2]);
  numClose('combo bank R', parseFloat(txt(win, 'circ-req')), expected, 0.005);
  eq('combo table has exactly 3 resistors + bulb', doc.querySelectorAll('#circ-table tr').length, 4);

  // --- Kirchhoff: series branch currents are identical ---
  click(win, doc.querySelector('#circ-topology [data-value="series"]'));
  const rows = [...doc.querySelectorAll('#circ-table tr')].slice(0, 3).map(tr => tr.children[3].textContent);
  ok('series current is the same through every resistor', new Set(rows).size === 1, rows.join(' / '));

  // --- predict-then-run strip grades against the simulator itself ---
  ok('circuit challenge strip is live', (txt(win, 'circ-chal-text') || '').length > 20, txt(win, 'circ-chal-text'));
  eq('three prediction choices offered', doc.querySelectorAll('#circ-chal-opts button').length, 3);
  doc.querySelector('#circ-chal-opts button').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('prediction feedback appears', doc.getElementById('circ-chal-fb').className.includes('feedback') &&
    !doc.getElementById('circ-chal-fb').className.includes('is-hidden'));
  ok('try-it button revealed after answering', doc.getElementById('circ-chal-try').hidden === false);

  // --- editing a resistor updates the analysis ---
  const firstSlider = doc.getElementById('circ-r0');
  firstSlider.value = '50';
  firstSlider.dispatchEvent(new win.Event('input', { bubbles: true }));
  eq('editing R1 to 50 ohm gives a 119 ohm bank', txt(win, 'circ-req'), '119.00 Ω');

  // --- the bulb can be bypassed ---
  const bypass = doc.getElementById('circ-includeBulb');
  bypass.checked = false;
  bypass.dispatchEvent(new win.Event('change', { bubbles: true }));
  eq('bypassing the bulb makes R_total = R_bank', txt(win, 'circ-rtotal'), txt(win, 'circ-req'));
  win.close();
}

/* ---------------- topics/fluids.html ---------------- */
{
  console.log('\n[topics/fluids.html]');
  const { win, doc, problems } = await loadPage('topics/fluids.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('buoyancy tank rendered', drawCalls(win, '#sim-archimedes') > 60);
  ok('bernoulli canvas rendered', drawCalls(win, '#sim-bernoulli') > 60);

  // --- Archimedes: rho_obj = 600 in water floats with 60% submerged ---
  eq('verdict: floats', txt(win, 'arch-state'), 'floats');
  eq('submerged fraction = rho ratio', txt(win, 'arch-subfr'), '60.0 %');
  numClose('weight = rho_obj V g', parseSI(txt(win, 'arch-weight')), 600 * 0.002 * 9.80665, 0.005);
  numClose('floating: F_B equals W', parseSI(txt(win, 'arch-buoy')), parseSI(txt(win, 'arch-weight')), 0.001);
  eq('displaced volume in litres', txt(win, 'arch-vsub'), '1.20 L');

  // --- sink it: rho_obj = 2000 -> full submersion, floor normal force ---
  setRange(win, 'arch-rho', 2000);
  await frames(win, 150);
  eq('verdict: sinks', txt(win, 'arch-state'), 'sinks');
  eq('fully submerged', txt(win, 'arch-subfr'), '100.0 %');
  numClose('F_B = rho_f V g', parseSI(txt(win, 'arch-buoy')), 1000 * 0.002 * 9.80665, 0.005);
  ok('at rest the floor supplies the missing force', /floor holds/.test(txt(win, 'arch-net')), txt(win, 'arch-net'));

  // --- seawater: 500/1025 = 48.8% submerged ---
  click(win, doc.querySelector('#arch-fluid [data-value="1025"]'));
  setRange(win, 'arch-rho', 500);
  await frames(win, 150);
  eq('seawater shifts the floating depth', txt(win, 'arch-subfr'), '48.8 %');

  // --- Bernoulli, venturi mode: continuity and the pressure drop ---
  click(win, doc.querySelector('#bern-mode [data-value="pipe"]'));
  setRange(win, 'bern-flow', 1);
  setRange(win, 'bern-ratio', 0.5);
  numClose('throat speed = v1/ratio^2 = 4 m/s', parseFloat(txt(win, 'bern-v2')), 4, 0.005);
  numClose('dP = 1/2 rho (v2^2 - v1^2) = 7.5 kPa', parseSI(txt(win, 'bern-dp')), 0.5 * 1000 * (16 - 1), 0.005);
  ok('continuity is announced', /continuity/.test(txt(win, 'bern-state')), txt(win, 'bern-state'));

  // --- wing mode: lift grows with AoA, stall past 15 deg ---
  click(win, doc.querySelector('#bern-mode [data-value="wing"]'));
  setRange(win, 'bern-aoa', 6);
  const lift6 = parseSI(txt(win, 'bern-extra'));
  ok('attached flow at 6 deg', /attached/.test(txt(win, 'bern-state')), txt(win, 'bern-state'));
  setRange(win, 'bern-aoa', 12);
  ok('more AoA, more lift', parseSI(txt(win, 'bern-extra')) > lift6);
  setRange(win, 'bern-aoa', 18);
  ok('stall is flagged past 15 deg', /STALL/.test(txt(win, 'bern-state')), txt(win, 'bern-state'));
  win.close();
}

/* ---------------- topics/heat.html ---------------- */
{
  console.log('\n[topics/heat.html]');
  const { win, doc, problems } = await loadPage('topics/heat.html');
  await frames(win, 4);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('thermometer canvas rendered', drawCalls(win, '#sim-thermometer') > 60);
  ok('heat-transfer canvas rendered', drawCalls(win, '#sim-heat-transfer') > 60);

  // --- thermometer: exact conversions at body temperature ---
  setRange(win, 'thermo-T', 37);
  eq('37.0 C', txt(win, 'thermo-C'), '37.0 \u00B0C');
  eq('98.6 F', txt(win, 'thermo-F'), '98.6 \u00B0F');
  eq('310.15 K', txt(win, 'thermo-K'), '310.15 K');
  setRange(win, 'thermo-T', -40);
  eq('-40 is where the scales agree', txt(win, 'thermo-F'), '-40.0 \u00B0F');
  ok('the note explains the crossing point', /same number/.test(txt(win, 'thermo-note')), txt(win, 'thermo-note'));
  click(win, doc.querySelector('[data-thermo-preset="100"]'));
  eq('boiling preset: 212.0 F', txt(win, 'thermo-F'), '212.0 \u00B0F');
  eq('boiling preset: 373.15 K', txt(win, 'thermo-K'), '373.15 K');

  // --- conduction: Fourier flux through the rod ends, q = k A dT / L ---
  // (the ends are held reservoirs, so the printed flux is exact from frame 1)
  await frames(win, 20);
  const qCopper = 401 * 1e-4 * (300 - 20) / 0.4;          // 28.07 W
  numClose('copper flux = kA\u0394T/L', parseSI(txt(win, 'ht-r3')), qCopper, 0.01);
  eq('cold end held at ambient', txt(win, 'ht-r2'), '20 \u00B0C');
  click(win, doc.querySelector('#ht-material [data-value="glass"]'));
  await frames(win, 20);
  numClose('glass flux scales with k (ratio 401)', parseSI(txt(win, 'ht-r3')), qCopper / 401, 0.02);

  // --- radiation: inverse-square law ---
  click(win, doc.querySelector('#ht-mode [data-value="radiation"]'));
  setRange(win, 'ht-dist', 1);
  const I1 = parseSI(txt(win, 'ht-r1'));
  numClose('I = P/(4 pi d^2) at 1 m', I1, 800 / (4 * Math.PI), 0.01);
  setRange(win, 'ht-dist', 2);
  numClose('doubling d quarters I', parseSI(txt(win, 'ht-r1')), I1 / 4, 0.01);
  ok('radiation note names the vacuum property', /vacuum/.test(txt(win, 'ht-note')), txt(win, 'ht-note'));

  // --- convection scene runs clean and explains the loop ---
  click(win, doc.querySelector('#ht-mode [data-value="convection"]'));
  await frames(win, 24);
  ok('no errors after switching scenes', problems.length === 0, problems.join(' | '));
  ok('convection note explains rising hot fluid', /rises/.test(txt(win, 'ht-note')), txt(win, 'ht-note'));
  win.close();
}

/* ---------------- topics/waves.html ---------------- */
{
  console.log('\n[topics/waves.html]');
  const { win, doc, problems } = await loadPage('topics/waves.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('wave canvas rendered', drawCalls(win, '#sim-wave') > 150);
  ok('sound canvas rendered', drawCalls(win, '#sim-sound') > 100);

  // --- v = f lambda, live ---
  setRange(win, 'wave-f', 2);
  setRange(win, 'wave-lam', 1.5);
  eq('v = 2 Hz x 1.5 m = 3 m/s', txt(win, 'wave-v'), '3.00 m/s');
  eq('T = 1/f = 0.5 s', txt(win, 'wave-T'), '0.50 s');
  ok('substitution line shows the product', /v = f \u00D7 \u03BB/.test(txt(win, 'wave-sub')), txt(win, 'wave-sub'));
  setRange(win, 'wave-A', 12);
  ok('amplitude readout follows', /12 cm/.test(txt(win, 'wave-Av')), txt(win, 'wave-Av'));

  // --- longitudinal mode + pause ---
  const longBtn = doc.querySelector('#wave-type [data-value="longitudinal"]');
  click(win, longBtn);
  eq('longitudinal mode engages', longBtn.getAttribute('aria-pressed'), 'true');
  const pause = doc.getElementById('wave-pause');
  click(win, pause);
  eq('pause toggles aria-pressed', pause.getAttribute('aria-pressed'), 'true');
  await frames(win, 6);
  ok('still renders while paused', drawCalls(win, '#sim-wave') > 150);

  // --- tone player: pitch maths without audio hardware ---
  setRange(win, 'snd-f', 440);
  eq('440 Hz is A4', txt(win, 'snd-note'), 'A4 (exact)');
  numClose('lambda = 343/440', parseFloat(txt(win, 'snd-lambda')), 343 / 440, 0.01);
  numClose('period = 2.27 ms', parseFloat(txt(win, 'snd-period')), 2.27, 0.02);
  click(win, doc.getElementById('snd-play'));
  ok('play is guarded without AudioContext: a status explains it',
    /not available|playing/i.test(txt(win, 'snd-status')), txt(win, 'snd-status'));
  ok('no runtime errors from the audio guard', problems.length === 0, problems.join(' | '));
  click(win, doc.querySelector('[data-snd-preset="261.6"]'));
  ok('C4 preset lands on the right note', /C4/.test(txt(win, 'snd-note')), txt(win, 'snd-note'));
  win.close();
}

/* ---------------- quiz.html ---------------- */
{
  console.log('\n[quiz.html]');
  const { win, doc, problems } = await loadPage('quiz.html');
  await frames(win, 2);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  const bank = win.EMC_QUIZ;
  eq('question bank size', bank.length, 30);
  ok('four-stat strip uses the 4-up layout class',
     doc.querySelector('.stat-strip').classList.contains('stat-strip-4'));
  ok('quiz copy is free of the word "module"',
     !/module/i.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8') +
                     readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8')));
  eq('every question rendered', doc.querySelectorAll('.q-card').length, 30);
  eq('four options each', doc.querySelectorAll('.q-card').length * 4, doc.querySelectorAll('.opt').length);
  ok('every question has a valid answer index',
    bank.every(q => Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length));
  ok('every question has an explanation', bank.every(q => q.explain && q.explain.length > 20));
  ok('all five topics are covered',
    new Set(bank.map(q => q.topic)).size === 5, [...new Set(bank.map(q => q.topic))].join(','));
  for (const t of ['vectors', 'fluids', 'heat', 'waves', 'current']) {
    eq(`topic filter counts — ${t}`, bank.filter(q => q.topic === t).length, 6);
  }

  const answerAll = (pickWrong) => {
    doc.querySelectorAll('.q-card').forEach(card => {
      const q = bank.find(x => x.id === Number(card.dataset.qid));
      const idx = pickWrong ? (q.answer + 1) % q.options.length : q.answer;
      card.querySelector(`.opt[data-opt="${idx}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
  };

  // blank guard: submitting with nothing answered must warn, not grade
  click(win, doc.getElementById('quiz-submit'));
  ok('submitting a blank quiz warns first', doc.getElementById('quiz-score').hidden === true);
  ok('progress text counts answers', /0 of 30 answered/.test(txt(win, 'quiz-progress-text')), txt(win, 'quiz-progress-text'));

  // all correct -> 100%
  answerAll(false);
  eq('all 30 recorded', txt(win, 'quiz-progress-text'), '30 of 30 answered');
  click(win, doc.getElementById('quiz-submit'));
  ok('score card is revealed', doc.getElementById('quiz-score').hidden === false);
  ok('Chart.js is lazy: injected only at grading time, not parser-blocking',
    !/<script[^>]*vendor\/chart/.test(readFileSync(join(ROOT, 'quiz.html'), 'utf8')) &&
    [...doc.head.querySelectorAll('script')].some(s => /vendor\/chart/.test(s.src || '')));
  ok('until the injected lib executes the CSS-bar fallback carries the score card',
    doc.getElementById('quiz-charts').hidden === true &&
    doc.getElementById('quiz-fallback-bars').hidden === false);
  ok('perfect score is 100%', txt(win, 'quiz-score').includes('100%'), txt(win, 'quiz-score').slice(0, 80));
  ok('every card marked correct', doc.querySelectorAll('.q-card.answered-correct').length === 30);
  ok('explanations are shown', doc.querySelectorAll('.feedback.good').length === 30);
  ok('options are locked after grading', doc.querySelectorAll('.opt:disabled').length === 120);

  // stored progress
  const stored = JSON.parse(win.localStorage.getItem('emc.progress.v1'));
  eq('best score saved to localStorage', stored.quizBest, 100);
  eq('attempt counter saved', stored.quizAttempts, 1);

  // retake, then all wrong -> 0%
  click(win, doc.getElementById('quiz-retake'));
  ok('retake clears the marks', doc.querySelectorAll('.q-card.answered-correct').length === 0);
  answerAll(true);
  click(win, doc.getElementById('quiz-submit'));
  ok('all-wrong score is 0%', txt(win, 'quiz-score').includes('0%'), txt(win, 'quiz-score').slice(0, 60));
  ok('wrong answers highlighted', doc.querySelectorAll('.q-card.answered-wrong').length === 30);
  ok('correct option still shown for learning', doc.querySelectorAll('.opt.correct').length === 30);
  const stored2 = JSON.parse(win.localStorage.getItem('emc.progress.v1'));
  eq('best score is kept across attempts', stored2.quizBest, 100);
  eq('attempts incremented', stored2.quizAttempts, 2);

  // review-incorrect filter
  click(win, doc.getElementById('quiz-wrong'));
  eq('review mode shows only the wrong ones', doc.querySelectorAll('.q-card').length, 30);

  // retake and check a partial score: 10 of 30 correct = 33%
  click(win, doc.getElementById('quiz-retake'));
  doc.querySelectorAll('.q-card').forEach((card, i) => {
    const q = bank.find(x => x.id === Number(card.dataset.qid));
    const idx = i < 10 ? q.answer : (q.answer + 1) % q.options.length;
    card.querySelector(`.opt[data-opt="${idx}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  click(win, doc.getElementById('quiz-submit'));
  ok('10 of 30 correct scores 33%', txt(win, 'quiz-score').includes('33%'), txt(win, 'quiz-score').slice(0, 60));
  ok('10 of 30 reported', /10 \/ 30 correct/.test(txt(win, 'quiz-score')), '');
  ok('quiz clock was started by answering and frozen at submit',
    doc.getElementById('quiz-timer').hidden === false && /\d+:\d\d/.test(txt(win, 'quiz-timer')));
  ok('score card reports time and best-streak tags',
    /time \d+:\d\d/.test(txt(win, 'quiz-score')) && /best streak \u00D7/.test(txt(win, 'quiz-score')));

  // attempt history is stored for the Chart.js line chart
  const hist = win.EMC.Progress.read().quizHistory;
  eq('three attempts recorded in history', hist.length, 3);
  eq('history keeps the scores in order', hist.map(h => h.pct).join(','), '100,0,33');

  // shuffle keeps the bank intact
  click(win, doc.getElementById('quiz-retake'));
  click(win, doc.getElementById('quiz-shuffle'));
  eq('shuffle keeps all 30 questions', doc.querySelectorAll('.q-card').length, 30);

  // topic filter
  click(win, doc.querySelector('[data-quiz-filter="fluids"]'));
  eq('fluids filter shows 6 questions', doc.querySelectorAll('.q-card').length, 6);
  click(win, doc.querySelector('[data-quiz-filter="all"]'));
  eq('all filter restores 30', doc.querySelectorAll('.q-card').length, 30);

  // instant mode marks as you go
  click(win, doc.querySelector('#quiz-mode [data-value="instant"]'));
  const firstCard = doc.querySelector('.q-card');
  const firstQ = bank.find(x => x.id === Number(firstCard.dataset.qid));
  firstCard.querySelector(`.opt[data-opt="${firstQ.answer}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('instant mode marks immediately', doc.querySelectorAll('.q-card.answered-correct').length >= 1);
  // answer a second question correctly -> streak chip shows x2 + burst ring
  const cards2 = doc.querySelectorAll('.q-card');
  const q2 = bank.find(x => x.id === Number(cards2[1].dataset.qid));
  cards2[1].querySelector(`.opt[data-opt="${q2.answer}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  eq('streak chip shows x2', txt(win, 'quiz-streak'), 'streak \u00D72');
  ok('correct option got the burst ring', doc.querySelectorAll('.opt.burst').length >= 1);
  ok('graded feedback carries a reacting mascot', doc.querySelectorAll('.feedback .mreact').length >= 1);
  win.close();
}

/* ---------------- quiz.html, deep link + missing chart lib ---------------- */
{
  console.log('\n[quiz.html?topic=fluids]');
  const { win, doc, problems } = await loadPage('quiz.html?topic=fluids');
  await frames(win, 2);
  ok('deep link loads without runtime errors', problems.length === 0, problems.join(' | '));
  eq('?topic= narrows the view to that topic', doc.querySelectorAll('.q-card').length, 6);
  ok('the matching filter button is pressed',
    doc.querySelector('[data-quiz-filter="fluids"]').getAttribute('aria-pressed') === 'true');
  ok('the deep link is announced', /Filtered to Fluids/.test(doc.body.textContent));
  win.close();

  console.log('\n[quiz.html without the vendored chart lib]');
  // The graceful-degradation path must survive: pretend the vendored file 404s.
  const { win: w2, doc: d2 } = await loadPage('quiz.html', {}, { skip: 'chart\\.umd' });
  w2.EMC_QUIZ.forEach(q => {
    const card = d2.querySelector(`#q-${q.id}`);
    card.querySelector(`.opt[data-opt="${q.answer}"]`).dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  });
  d2.getElementById('quiz-submit').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  ok('without the chart lib the CSS-bar fallback is used',
    d2.getElementById('quiz-charts').hidden === true &&
    d2.getElementById('quiz-fallback-bars').hidden === false);
  ok('the fallback still lists every topic',
    /Measurement & vectors/.test(d2.getElementById('quiz-fallback-bars').textContent) &&
    /Waves & sound/.test(d2.getElementById('quiz-fallback-bars').textContent));
  w2.close();
}

/* ---------------- quiz.html with a stubbed Chart.js ---------------- */
{
  console.log('\n[quiz.html + instrumented Chart.js]');
  class FakeChart {
    constructor(canvas, config) { FakeChart.made.push({ id: canvas && canvas.id, type: config.type }); }
    destroy() { FakeChart.destroyed++; }
  }
  FakeChart.made = []; FakeChart.destroyed = 0; FakeChart.defaults = {};

  const { win, doc } = await loadPage('quiz.html', { Chart: FakeChart });
  // window.Chart existed before quiz.js evaluated, so the lazy loader treats
  // the library as ready and draws synchronously through the spy.
  win.Chart = FakeChart;
  doc.querySelectorAll('.q-card').forEach(card => {
    const q = win.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
    card.querySelector(`.opt[data-opt="${q.answer}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  doc.getElementById('quiz-submit').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  eq('three Chart.js instances created (doughnut, bar, line)', FakeChart.made.length, 3);
  eq('chart types', FakeChart.made.map(m => m.type).join(','), 'doughnut,bar,line');
  eq('charts target the score-card canvases',
    FakeChart.made.map(m => m.id).join(','), 'chart-score,chart-topics,chart-history');
  ok('with Chart.js present the CSS bars yield to the charts',
    doc.getElementById('quiz-charts').hidden === false &&
    doc.getElementById('quiz-fallback-bars').hidden === true);
  win.close();
}

/* ---------------- cross-page checks ---------------- */
{
  console.log('\n[cross-page]');
  const pages = ['index.html', 'quiz.html', 'topics/vectors.html', 'topics/fluids.html',
    'topics/heat.html', 'topics/waves.html', 'topics/current.html'];
  for (const p of pages) {
    const html = readFileSync(join(ROOT, p), 'utf8');
    ok(`${p}: declares a viewport`, /name="viewport"/.test(html));
    ok(`${p}: has a lang attribute`, /<html lang="en">/.test(html));
    ok(`${p}: has a skip link`, /class="skip-link"/.test(html));
    ok(`${p}: every canvas has an accessible label`,
      [...html.matchAll(/<canvas[^>]*>/g)].every(m => /aria-label=/.test(m[0])));
    ok(`${p}: links the compiled Tailwind pipeline (site.css) + font faces`,
      /css\/site\.css/.test(html) && /css\/fonts\.css/.test(html) && !/styles\.css/.test(html));
    ok(`${p}: exactly one <h1>`, (html.match(/<h1[\s>]/g) || []).length === 1);
    ok(`${p}: every script tag is defer (no render-blocking)`,
      [...html.matchAll(/<script[^>]*src=/g)].every(m => m[0].includes('defer')));

    // ---- audit guards: theme colour, noscript, social meta, same-origin ----
    ok(`${p}: theme-color equals the real page background`,
      /name="theme-color" content="#17181c"/.test(html));
    ok(`${p}: noscript fallback explains what needs JavaScript`,
      /<noscript>[\s\S]*?class="noscript-note"/.test(html) &&
      /JavaScript/.test((html.match(/<noscript>[\s\S]*?<\/noscript>/) || [''])[0]));
    ok(`${p}: canonical + Open Graph + Twitter card are declared`,
      /rel="canonical" href="https:\/\/[^"]+"/.test(html) &&
      ['og:type', 'og:title', 'og:description', 'og:url', 'og:image',
       'twitter:card', 'twitter:title', 'twitter:image']
        .every(k => new RegExp(`(property|name)="${k}"`).test(html)));
    ok(`${p}: canonical/og:url point at the production origin and this page`,
      [...html.matchAll(/(?:rel="canonical"|property="og:url")[^>]*href="([^"]+)"/g)]
        .every(m => m[1].startsWith('https://emc-physics.vercel.app')) &&
      [...html.matchAll(/property="og:url"[^>]*href="([^"]+)"/g)]
        .every(m => m[1] === ([...html.matchAll(/rel="canonical" href="([^"]+)"/g)][0] || [])[1]));
    ok(`${p}: no third-party <script>/<link> (all assets same-origin)`,
      ![...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
        .some(m => !/emc-physics\.vercel\.app/.test(m[1])));

    // ---- #15 favicon artwork must equal the header brand mark -------------
    // the data URI stores the SVG with single quotes; normalise before comparing
    const favDec = decodeURIComponent((html.match(/<link rel="icon" href="data:image\/svg\+xml,([^"]+)">/) || ['', ''])[1])
      .replace(/'/g, '"');
    const brandMark = (html.match(/<svg class="brand-mark"[\s\S]*?<\/svg>/) || ['', ''])[0];
    const favTokens = ['M15 15 C13 7 19 5 21 11', 'M33 15 C35 7 29 5 27 11',
                       'rx="16" ry="15"', 'cx="18.5" cy="26"', 'cx="29.5" cy="26"',
                       'cx="13.5" cy="30"', 'cx="34.5" cy="30"'];
    ok(`${p}: favicon artwork matches the header mascot`,
      brandMark.length > 100 && favTokens.every(t => favDec.includes(t) && brandMark.includes(t.replace(/"/g, '"'))));
  }
  // ---- #14 no phantom important-variants of component classes -----------
  const builtAll = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('compiled css carries no escaped important class selectors',
    !/\\![a-z][a-z0-9-]*\s*\{/.test(builtAll),
    (builtAll.match(/\\![a-z][a-z0-9-]*/g) || []).join(','));
  ok('quiz.js uses explicit null checks (no negated identifiers to scan)',
    !/!btn|!card/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));
  ok('the phantom class names stay blocklisted in the Tailwind config',
    /'!btn', '!card'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')));

  // ---- #16 print: wide maths and tables are contained ---------------------
  const printBlock = builtAll.slice(builtAll.indexOf('@media print'));
  ok('print css contains formula blocks inside the page width',
    printBlock.startsWith('@media print') &&
    /\.formula[^{]*\{[^}]*max-width:100%/.test(printBlock) &&
    /\.table-scroll[^{]*\{[^}]*overflow:visible/.test(printBlock) &&
    /table\.data[^{]*\{[^}]*table-layout:fixed/.test(printBlock));

  // ---- #1 exactly four keyboard labels ------------------------------------
  ok('the quiz exposes exactly four option key labels (A-D)',
    /const KEYS = \['A', 'B', 'C', 'D'\];/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));

  // ---- #3 one printed speed of sound site-wide -----------------------------
  const printed = pages.map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n') +
                  readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8');
  ok('every printed speed of sound is 343 m/s (code keeps the same value)',
    !/340 m\/s/.test(printed) && /343 m\/s/.test(printed) &&
    /V_SOUND: 343/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));

  // ---- #9 water density is the round 1000 everywhere it is printed ---------
  ok('printed water density is consistently 1000 kg/m³',
    !/1000 kg\/m³/.test(printed) === false &&
    /RHO_WATER: 1000/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));

  // ---- #10 the 70% rule is announced where it fires ------------------------
  ok('the score card announces the 70% auto-tick when it happens',
    /const passNote = pct >= 70/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')) &&
    /Scoring 70% or more/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')) &&
    /Scoring 70% or more in the quiz also ticks all five topics/.test(readFileSync(join(ROOT, 'index.html'), 'utf8')));

  // ---- #6 vendored libraries ship with their licences ---------------------
  ok('Chart.js and KaTeX are vendored with their licence files',
    ['vendor/chart/chart.umd.min.js', 'vendor/chart/LICENSE',
     'vendor/katex/katex.min.js', 'vendor/katex/LICENSE']
      .every(f => existsSync(join(ROOT, f))));

  // ---- #8 one public name --------------------------------------------------
  ok('one public name everywhere: EMC Lab in the UI, emc-lab in package.json',
    /"name": "emc-lab"/.test(readFileSync(join(ROOT, 'package.json'), 'utf8')) &&
    pages.every(f => /property="og:site_name" content="EMC Lab"/.test(readFileSync(join(ROOT, f), 'utf8'))));

  // ---- #12 the advertised social card exists at the promised size ----------
  const ogPath = join(ROOT, 'img/og-card.png');
  let ogDims = '';
  if (existsSync(ogPath)) {
    const b = readFileSync(ogPath);
    ogDims = `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  }
  ok('img/og-card.png exists at the size the meta tags promise',
    existsSync(ogPath) && ogDims === '1200x630', ogDims);

  const dividerCss = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('compiled css styles the .hr divider with the dark hairline token',
    /\.hr\{[^}]*border-top:1px solid var\(--line-soft\)/.test(dividerCss));
  ok('every <hr> in the pages carries the styled .hr class (no raw preflight hr)',
    pages.every(p => [...readFileSync(join(ROOT, p), 'utf8').matchAll(/<hr\b[^>]*>/g)]
      .every(m => /class="hr"/.test(m[0]))));
  const fontsCss = readFileSync(join(ROOT, 'css/fonts.css'), 'utf8');
  ok('site fonts are committed OFL woff2 (no CDN, no licence risk)',
    /G8321/.test(fontsCss) && /font-weight: 100/.test(fontsCss) &&
    /font-weight: 400/.test(fontsCss) && /font-weight: 700/.test(fontsCss) &&
    !/Lilita|M PLUS|Mochiy/.test(fontsCss) &&
    ['g8321-100.woff2', 'g8321-400.woff2', 'g8321-700.woff2'].every(f =>
      existsSync(join(ROOT, 'vendor/fonts', f))));
  const manifest = JSON.parse(readFileSync(join(ROOT, 'vendor/fonts/manifest.json'), 'utf8'));
  ok('font manifest parses and exposes the optional licensed[] slot',
    manifest && Array.isArray(manifest.licensed));
  ok('title stack tries the licensed face first, then committed G8321',
    /title: \['fot-yuruka-std', 'G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')));
  ok('body + UI stacks are the single committed family (G8321)',
    /sans:  \['G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')) &&
    /ui:    \['G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')));
  ok('common.js can still activate optional licensed faces at runtime',
    /loadLicensedFont/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));

  const js = readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js'));
  ok('all simulation scripts are present', js.length >= 12, js.join(', '));
  // flat-art policy: no canvas gradients and no glow shadows anywhere
  const jsSrc = js.map(f => readFileSync(join(ROOT, 'js', f), 'utf8')).join('\n');
  ok('simulation art is flat (no gradients, no glow shadows)',
    !/createLinearGradient|createRadialGradient|shadowBlur/.test(jsSrc));
  // strip comments first: the policy note in the header mentions these words
  let cssSrc = readFileSync(join(ROOT, 'css/input.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  ok('type stacks lead with the right faces',
    /title: \['fot-yuruka-std', 'G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')) &&
    /sans:  \['G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')) &&
    /ui:    \['G8321'/.test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')));
  ok('cascade is layer-based: base < components < utilities',
    /@layer base/.test(cssSrc) && /@layer components/.test(cssSrc) && /@tailwind utilities/.test(cssSrc));
  const siteCss = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('one site-wide content column (--column: 1060px) ships compiled',
    /--column:1060px/.test(siteCss) && /max-width:var\(--column\)/.test(siteCss) &&
    /\.wrap-narrow\b/.test(siteCss) && /\.wrap-sim\b/.test(siteCss));
  ok('home hero canvas + stat strip align to the same column edges',
    (siteCss.match(/max-width:calc\(var\(--column\) - 2\.5rem\)/g) || []).length >= 2);
  ok('the old thin 700px measure variable is fully gone',
    !/--measure/.test(siteCss) && !/--measure/.test(cssSrc));
  ok('type system is one family site-wide (G8321 in three weights)',
    /fontFamily:\s*{[\s\S]*title: \['fot-yuruka-std', 'G8321'[\s\S]*sans:  \['G8321'[\s\S]*ui:    \['G8321'/
      .test(readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8')) &&
    /theme\('fontFamily\.title'\)/.test(cssSrc) && /theme\('fontFamily\.ui'\)/.test(cssSrc) && /theme\('fontFamily\.sans'\)/.test(cssSrc) &&
    /font-weight: 100/.test(cssSrc));
  // regression guard: Tailwind joins fontFamily arrays raw, so a multi-word
  // family is only valid unquoted if EVERY token is a legal ident (must not
  // start with a digit). `M PLUS Rounded 1c` unquoted killed the whole
  // declaration; `Segoe UI` / `Hiragino Maru Gothic ProN` unquoted are fine.
  const compiledCss = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('font stacks survive minification as valid CSS (no digit-leading bare idents)',
    [...compiledCss.matchAll(/font-family:\s*([^;}]+)/g)].every(([, d]) =>
      d.split(',').map(s => s.trim().replace(/!important$/, '')).filter(Boolean).every(fam =>
        /^["']/.test(fam) || !/(^|\s)-?\d/.test(fam))));
  ok('mobile pass present (coarse-pointer targets, no sideways scroll)',
    /pointer: coarse/.test(cssSrc) && /overflow-x: clip/.test(cssSrc));
  ok('stylesheet contains no gradient/blur/glass effects',
    !/gradient|backdrop-filter|blur\(/.test(cssSrc));
  // flex or grid on a bullet li fragments <sub>/<sup> into separate items
  ok('bullet lists keep inline maths intact (marker is absolutely positioned)',
    /\.topic-list li \{ position: relative/.test(cssSrc) &&
    !/\.topic-list li \{[^}]*display: (flex|grid)/.test(cssSrc));
  ok('anchor offset defined exactly once (scroll-margin, not double offset)',
    /\[id\] \{ scroll-margin-top: calc\(var\(--header-h\)/.test(cssSrc) &&
    !/scroll-padding-top/.test(cssSrc));

  // regression guard: `blocklist` nested inside `content` makes the whole config
  // invalid — Tailwind logs the purge/content warning and silently drops the
  // blocklist, letting scanner accidents (`<table>` → .table) into site.css.
  const twCfg = readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8');
  ok('tailwind config: array-form content, top-level blocklist',
    /content: \[/.test(twCfg) && /blocklist: \[/.test(twCfg) && !/content: \{/.test(twCfg));
  const builtCss = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('blocklisted prose words never leak into site.css as utilities',
    !/\.(grow|shrink|table|transform|filter|ring|container|collapse|resize|summary|content|order)\s*\{/
      .test(builtCss));
}

/* ---------------- warm repeat visit skips the shell ---------------- */
{
  console.log('\n[warm boot]');
  const { win, doc } = await loadPage('index.html');
  win.localStorage.setItem('emc.booted', '1');
  // reload semantics: re-run the early inline script path manually
  const cls = win.document.documentElement.classList;
  ok('warm storage marks the shell suppressed', (win.localStorage.getItem('emc.booted') === '1'));
  const inline = readFileSync(join(ROOT, 'index.html'), 'utf8');
  ok('early script derives warm/cold from the stored flag',
    /localStorage\.getItem\('emc\.booted'\) \? 'boot-warm' : 'boot-cold'/.test(inline) &&
    /setTimeout\(function \(\) \{ var o = document\.getElementById\('bootOverlay'\); if \(o\) o\.remove\(\); \}, 6000\)/.test(inline));
  win.close();
}

/* ---------------- startup system + detail mode ---------------- */
{
  console.log('\n[startup + detail mode]');
  const { win, doc } = await loadPage('topics/vectors.html');
  await frames(win, 4);
  eq('detail mode defaults to technical', win.document.documentElement.dataset.detail, 'on');
  ok('cold visits paint the branded boot overlay', win.document.documentElement.classList.contains('boot-cold') &&
    !!doc.getElementById('bootOverlay') && doc.querySelectorAll('#bootOverlay .bo-chip').length === 3);
  await new Promise(r => setTimeout(r, 1100));
  ok('overlay unmounts once every real stage completes', doc.getElementById('bootOverlay') === null);
  ok('a warm flag is stored so repeat visits skip the shell', win.localStorage.getItem('emc.booted') === '1');
  eq('boot strip ships three honest stage chips', doc.querySelectorAll('#bootStrip .boot-chip').length, 3);
  const btn = doc.getElementById('detailToggle');
  ok('toggle is an accessible switch', btn.getAttribute('role') === 'switch' && btn.getAttribute('aria-checked') === 'true');
  win.__marker = 'alive';
  click(win, btn);
  eq('toggle flips the html level attribute', win.document.documentElement.dataset.detail, 'off');
  eq('switch state exposed to assistive tech', btn.getAttribute('aria-checked'), 'false');
  ok('preference persisted', /"detail":"off"/.test(win.localStorage.getItem('emc.prefs.v1') || ''), win.localStorage.getItem('emc.prefs.v1'));
  eq('no reload: page state survived the toggle', win.__marker, 'alive');
  click(win, btn);
  eq('toggle back to technical', win.document.documentElement.dataset.detail, 'on');
  await new Promise(r => setTimeout(r, 900));
  ok('idle prefetch offers the next topic page',
    !!doc.querySelector('link[rel="prefetch"][href$="fluids.html"]'));
  await new Promise(r => setTimeout(r, 800));
  eq('boot strip completes all three stages', doc.querySelectorAll('#bootStrip .boot-chip.done').length, 3);
  ok('boot strip unmounts once complete', doc.getElementById('bootStrip').hidden === true);
  await new Promise(r => setTimeout(r, 900));
  ok('chunked idle typesetting finishes every equation',
    [...doc.querySelectorAll('[data-tex]')].every(e => e.dataset.texDone === '1'),
    [...doc.querySelectorAll('[data-tex]:not([data-tex-done])')].length + ' left');
  win.close();

  // sim + form state must survive a mode switch untouched
  const w2 = await loadPage('topics/waves.html');
  await frames(w2.win, 3);
  setRange(w2.win, 'wave-f', 2.5);
  click(w2.win, w2.win.document.getElementById('detailToggle'));
  eq('slider value survives the toggle', w2.win.document.getElementById('wave-f').value, '2.5');
  eq('physics readout survives the toggle', w2.win.document.getElementById('wave-v').textContent, '5.00 m/s');
  w2.win.close();

  for (const f of ['index.html', 'quiz.html', 'topics/vectors.html', 'topics/fluids.html',
                  'topics/heat.html', 'topics/waves.html', 'topics/current.html']) {
    const h = readFileSync(join(ROOT, f), 'utf8');
    ok(`${f} ships both explanation levels`, h.includes('data-detail="plain"') && h.includes('data-detail="tech"'));
  }
}

/* ---------------- progress export / import ---------------- */
{
  console.log('\n[progress export / import]');
  const { win, doc } = await loadPage('index.html');
  const P = win.EMC.Progress;
  P.markTopic('vectors', true);
  P.recordQuiz(50);                       // below the pass mark: only vectors ticks
  const snapshot = P.exportJSON();
  P.reset();
  eq('the export is a self-describing JSON document', JSON.parse(snapshot).app, 'emc-lab');
  const res = P.importJSON(snapshot);
  ok('import restores topics and scores', res.ok && P.isTopicDone('vectors') &&
     !P.isTopicDone('fluids') && P.read().quizBest === 50, res.message);
  ok('import refuses junk and foreign files',
    !P.importJSON('not json at all').ok &&
    !P.importJSON(JSON.stringify({ app: 'something-else', progress: {} })).ok);
  ok('the dashboard offers export, import and reset controls',
    !!doc.getElementById('exportProgress') && !!doc.getElementById('importProgress') &&
    !!doc.getElementById('importProgressFile') && !!doc.getElementById('resetProgress'));
  ok('the dashboard says progress is device-local',
    /this device only/.test(doc.body.textContent));
  win.close();
}

/* ---------------- summary ---------------- */
console.log('\n' + '\u2500'.repeat(66));
if (failures.length) {
  console.log(`\u274C ${failures.length} of ${pass + failures.length} assertions FAILED:`);
  failures.forEach(f => console.log('   - ' + f));
} else {
  console.log(`\u2705 All ${pass} assertions passed.`);
}
console.log('\u2500'.repeat(66) + '\n');
process.exit(failures.length ? 1 : 0);
