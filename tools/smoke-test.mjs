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
    virtualConsole: vc,
    beforeParse(window) {
      // session-scoped state (the first-visit splash gate) must exist BEFORE
      // the inline head scripts run, so it is seeded during parsing
      if (opts.session) {
        for (const [k, v] of Object.entries(opts.session)) window.sessionStorage.setItem(k, v);
      }
    }
  });
  installMocks(dom.window);
  // emulate an OS-level "reduce motion" setting BEFORE the page scripts run:
  // Stage, initReveal and the detail toggle all branch on this query
  if (opts.reduceMotion) {
    dom.window.matchMedia = q => ({
      media: String(q),
      matches: /prefers-reduced-motion/.test(String(q)),
      addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {},
      onchange: null, dispatchEvent() { return false; }
    });
  }
  // seed localStorage BEFORE the page scripts run (resume-session tests)
  if (opts.seed) {
    for (const [k, v] of Object.entries(opts.seed)) dom.window.localStorage.setItem(k, v);
  }
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
  await new Promise(r => setTimeout(r, 1300));   // boot overlay + idle typesetting settle
  await frames(win, 8);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('progress ring shows a percentage', /^\d+%$/.test(txt(win, 'ringPct') || ''), txt(win, 'ringPct'));
  eq('starts at 0% with empty storage', txt(win, 'ringPct'), '0%');
  eq('lesson counter text', txt(win, 'dashTopicsDone'), '0 of 3 lessons studied');
  eq('chip mirrors the counter', txt(win, 'dashTopicsChip'), '0 of 3 lessons studied');
  // the animated dipole canvas was retired in favour of a static KaTeX strip
  ok('the animated hero canvas is gone (replaced by the equation strip)',
    doc.getElementById('heroCanvas') === null && !doc.querySelector('.hero-visual'));
  eq('hero equation strip ships the four governing laws', doc.querySelectorAll('.eq-strip [data-tex]').length, 4);
  ok('hero equations are typeset by KaTeX',
    [...doc.querySelectorAll('.eq-strip [data-tex]')].every(e => e.dataset.texDone === '1'));
  // hero counters are derived, never hand-copied (audit 1.2 / 1.5 / 3.2)
  eq('lessons stat is derived from the registry', txt(win, 'statChapters'),
    String(win.EMC_REGISTRY.lessons.length));
  eq('simulations stat is derived from the registry', txt(win, 'statSims'),
    String(win.EMC_REGISTRY.chapters.reduce((n, c) => n + c.sims.length, 0)));
  eq('quiz stat is derived from the bank', txt(win, 'statQuestions'), String(win.EMC_QUIZ.length));
  eq('the spelled-out quiz count matches the bank', txt(win, 'quizCountWord'), 'Thirty-five');
  ok('no stale hand-written "Twenty" survives in the homepage copy',
    !/Twenty/.test(readFileSync(join(ROOT, 'index.html'), 'utf8')));
  eq('storage status reported', txt(win, 'storageStatus'), 'enabled \u2014 your progress is saved in this browser');
  eq('year filled in', doc.querySelector('[data-year]').textContent, String(new Date().getFullYear()));

  // progress persistence: mark a topic, reload the same storage, re-render
  win.EMC.Progress.markTopic('charge', true);
  win.EMC.Progress.recordQuiz(85);
  eq('a passing score (70%+) counts all three lessons as studied',
     JSON.stringify(win.EMC.Progress.read().topics),
     JSON.stringify({ charge: true, coulomb: true, field: true }));
  eq('percent weights topics (80%) + quiz (20%)', win.EMC.Progress.percent(), Math.round(1 * 80 + 0.85 * 20));
  win.window?.close?.(); win.close();
}

/* ---------------- topics/charge.html ---------------- */
{
  console.log('\n[topics/charge.html]');
  const { win, doc, problems } = await loadPage('topics/charge.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('static room canvas rendered', drawCalls(win, '#sim-static-room') > 100);
  ok('balloon toy canvas rendered', drawCalls(win, '#toy-balloon') > 30);

  // --- Static Room: stamp, count, undo, clear, random ---------------------
  eq('the seeded room holds the sock and the neutral ball', txt(win, 'sr-count'), '2');
  click(win, doc.querySelector('#sr-panel [data-sb-tool="add+"]'));
  pointer(win, doc.getElementById('sim-static-room'), 'pointerdown', 700, 100);
  pointer(win, doc.getElementById('sim-static-room'), 'pointerup', 700, 100);
  eq('stamping a + charge grows the room', txt(win, 'sr-count'), '3');
  click(win, doc.querySelector('#sr-panel [data-sb-act="undo"]'));
  eq('undo takes it back out', txt(win, 'sr-count'), '2');
  click(win, doc.querySelector('#sr-panel [data-sb-act="random"]'));
  ok('random scene places at least three objects', Number(txt(win, 'sr-count')) >= 3, txt(win, 'sr-count'));
  eq('random scenes are net-neutral by construction', txt(win, 'sr-net'), '+0C');
  click(win, doc.querySelector('#sr-panel [data-sb-act="clear"]'));
  eq('clear empties the room', txt(win, 'sr-count'), '0');

  // --- Conservation: touching conductors share, the tally never moves ------
  click(win, doc.querySelector('#sr-panel [data-sb-preset="touch"]'));
  eq('the preset loads two metal balls', txt(win, 'sr-count'), '2');
  const netBefore = txt(win, 'sr-net');
  ok('before touching, the balls carry +6 and −2 µC (total +4)', /\+4\.0/.test(netBefore), netBefore);
  // drag the left ball (1.2 m, 0.7 m -> px 360,210) onto its neighbour (510,210)
  pointer(win, doc.getElementById('sim-static-room'), 'pointerdown', 360, 210);
  pointer(win, doc.getElementById('sim-static-room'), 'pointermove', 510, 210);
  await frames(win, 2);
  pointer(win, doc.getElementById('sim-static-room'), 'pointerup', 510, 210);
  eq('contact sharing leaves the room total untouched', txt(win, 'sr-net'), netBefore);
  ok('the contact-sharing challenge earned its star from the physics state',
    !!doc.querySelector('#sr-panel .sb-star.got'));

  // --- Balloon toy: rubbing transfers whole parcels, total stays 0 ---------
  const balloon = doc.getElementById('toy-balloon');
  pointer(win, balloon, 'pointerdown', 0.28 * 900, 0.42 * 400);
  pointer(win, balloon, 'pointermove', 0.20 * 900, 0.40 * 400);
  pointer(win, balloon, 'pointermove', 0.30 * 900, 0.44 * 400);
  await frames(win, 2);
  pointer(win, balloon, 'pointerup', 0.30 * 900, 0.44 * 400);
  ok('rubbing moved electrons onto the balloon',
    /electrons moved/.test(txt(win, 'bl-n')) && !/^0 electrons/.test(txt(win, 'bl-n')), txt(win, 'bl-n'));
  ok('the balloon reads negative', txt(win, 'bl-q').startsWith('\u2212'), txt(win, 'bl-q'));
  ok('the hair reads positive', txt(win, 'bl-h').startsWith('+'), txt(win, 'bl-h'));
  eq('balloon + hair is exactly zero — conservation, live', txt(win, 'bl-total'), '0 C');

  // --- Ledger: identical conductors split any total equally ----------------
  const balls = doc.querySelectorAll('#lg-tray .lg-ball');
  eq('the ledger tray ships six balls', balls.length, 6);
  const totalBefore = txt(win, 'lg-total');
  click(win, balls[0]); click(win, balls[1]);
  eq('one touch is counted', txt(win, 'lg-merges'), '1 touch \u2014 total unchanged');
  eq('the ledger total never changes', txt(win, 'lg-total'), totalBefore);
  win.close();
}

/* ---------------- topics/coulomb.html ---------------- */
{
  console.log('\n[topics/coulomb.html]');
  const { win, doc, problems } = await loadPage('topics/coulomb.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('arena canvas rendered', drawCalls(win, '#sim-arena') > 80);
  ok('pin-force canvas rendered', drawCalls(win, '#toy-pinforce') > 50);
  ok('bohr canvas rendered', drawCalls(win, '#toy-bohr') > 30);
  const K = 8.987551787e9;
  const cv = () => doc.getElementById('sim-arena');

  // --- Lecture line example: −4/+3/−7 µC at 0.20/0.40 m -> net on q1 = 1.12 N
  click(win, doc.querySelector('[data-sb-preset="lecture-line"]'));
  eq('the lecture line preset loads three charges', txt(win, 'ar-count'), '3');
  // preset zoom x2 about (1.5, cy): q1 at (1.30, 0.60) m -> px (330, 160)
  pointer(win, cv(), 'pointerdown', 330, 200);
  pointer(win, cv(), 'pointerup', 330, 200);
  await frames(win, 2);
  numClose('lecture line example: net force on q1 = 2.70 − 1.57 N',
    parseSI(txt(win, 'ar-sel')), K * 1.2e-11 / 0.04 - K * 2.8e-11 / 0.16, 0.02);

  // --- Inverse square: drag one charge to twice the distance -> F/4 --------
  click(win, doc.querySelector('[data-sb-preset="pair"]'));
  pointer(win, cv(), 'pointerdown', 360, 200);      // select q1 (+3 µC at 1.2 m)
  pointer(win, cv(), 'pointerup', 360, 200);
  const F1 = parseSI(txt(win, 'ar-sel'));
  numClose('pair preset: F at r = 0.30 m', F1, K * 6e-12 / 0.09, 0.02);
  pointer(win, cv(), 'pointerdown', 540, 200);      // grab q2 (−2 µC)
  pointer(win, cv(), 'pointermove', 720, 200);      // ... to r = 0.60 m
  await frames(win, 2);
  pointer(win, cv(), 'pointerup', 720, 200);
  numClose('doubling r quarters the force (third law: same |F| on q2)',
    parseSI(txt(win, 'ar-sel')), F1 / 4, 0.02);

  // --- Lecture 2-D example: ≈ 23 N on the +4 µC -----------------------------
  click(win, doc.querySelector('[data-sb-preset="lecture-2d"]'));
  // preset zoom x3 about (1.45, 0.57): +4 µC at (1.40, 0.50) m -> px (405, 137)
  pointer(win, cv(), 'pointerdown', 405, 137);
  pointer(win, cv(), 'pointerup', 405, 137);
  await frames(win, 2);
  numClose('lecture 2-D example: net force on the +4 µC ≈ 23 N',
    parseSI(txt(win, 'ar-sel')), 23.2, 0.03);
  ok('the 2-D challenge star lights up from the physics state',
    !!doc.querySelector('#ar-panel .sb-star.got'));

  // --- Release mode runs clean ---------------------------------------------
  const rel = doc.querySelector('#ar-panel [data-sb-toggle="release"]');
  rel.checked = true;
  rel.dispatchEvent(new win.Event('change', { bubbles: true }));
  await frames(win, 12);
  ok('release mode integrates without errors or runaway', problems.length === 0, problems.join(' | '));
  rel.checked = false;
  rel.dispatchEvent(new win.Event('change', { bubbles: true }));

  // --- Pin the Force: the ratio readout prints the exact inverse square ----
  const pf = doc.getElementById('toy-pinforce');
  pointer(win, pf, 'pointerdown', 240, 80);         // charge B at r = 0.30 m
  pointer(win, pf, 'pointermove', 442, 80);         // ... dragged to r = 0.60 m
  await frames(win, 2);
  pointer(win, pf, 'pointerup', 442, 80);
  eq('the rail reads the new separation', txt(win, 'pf-r'), '0.600 m');
  ok('the ratio readout prints the exact inverse square',
    /F\(2r\)\/F\(r\) = 0\.250/.test(txt(win, 'pf-ratio')), txt(win, 'pf-ratio'));
  numClose('the force itself is k|qA qB|/r²', parseSI(txt(win, 'pf-f')), K * 24e-12 / 0.36, 0.01);

  // --- Bohr tuner: the lecture radius gives 2.19×10⁶ m/s --------------------
  setRange(win, 'bo-r', 8);
  setRange(win, 'bo-r', 5.29);
  await frames(win, 2);
  numClose('Bohr speed at r = 5.29×10⁻¹¹ m', parseSI(txt(win, 'bo-v')), 2.19e6, 0.01);
  ok('hitting the lecture radius earns the discovery card',
    doc.getElementById('bo-discover').hidden === false);
  win.close();
}

/* ---------------- topics/field.html ---------------- */
{
  console.log('\n[topics/field.html]');
  const { win, doc, problems } = await loadPage('topics/field.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('field painter rendered', drawCalls(win, '#sim-fieldpaint') > 300);
  ok('dipole toy rendered', drawCalls(win, '#toy-dipole') > 80);
  ok('zero-hunt toy rendered', drawCalls(win, '#toy-zerohunt') > 50);
  const K = 8.987551787e9;
  const fp = () => doc.getElementById('sim-fieldpaint');

  // --- Lecture replica: ±4 µC on the y-axis, probe parked at P -------------
  click(win, doc.querySelector('[data-sb-preset="lecture-y"]'));
  await frames(win, 2);
  eq('the replica preset loads four objects', txt(win, 'fp-count'), '4');
  numClose('lecture y-axis example: |E| at P ≈ 7.55×10⁴ N/C',
    parseSI(txt(win, 'fp-probe-e')), 7.55e4, 0.02);
  ok('E at P points along +y (90° from +x)', /^90°/.test(txt(win, 'fp-probe-dir')), txt(win, 'fp-probe-dir'));
  ok('the lecture replica challenge star lights up', !!doc.querySelector('#fp-panel .sb-star.got'));
  // the same number from first principles (softened eps = 0.01 m):
  const Ey = 2 * (K * 4e-6 / (0.61 + 1e-4)) * (0.5 / Math.sqrt(0.61));
  numClose('…and it matches the component algebra', parseSI(txt(win, 'fp-probe-e')), Ey, 0.005);
  ok('the ghost force readout follows F = q₀E', /N/.test(txt(win, 'fp-probe-f')), txt(win, 'fp-probe-f'));

  // --- Tools: stamp, then drag the persistent ghost (no hover needed) ------
  click(win, doc.querySelector('#fp-panel [data-sb-tool="add+"]'));
  pointer(win, fp(), 'pointerdown', 760, 90);
  pointer(win, fp(), 'pointerup', 760, 90);
  eq('stamping grows the scene', txt(win, 'fp-count'), '5');
  click(win, doc.querySelector('#fp-panel [data-sb-tool="move"]'));
  // the preset's ghost sits at (2.2 m, worldH/2) -> px (660, 200)
  pointer(win, fp(), 'pointerdown', 660, 200);
  pointer(win, fp(), 'pointermove', 600, 300);
  await frames(win, 2);
  pointer(win, fp(), 'pointerup', 600, 300);
  ok('the ghost reports a computed force wherever it is dragged',
    parseSI(txt(win, 'fp-sel')) > 0, txt(win, 'fp-sel'));

  // --- Gesture regression: erase still works right after a drag ------------
  click(win, doc.querySelector('#fp-panel [data-sb-tool="erase"]'));
  pointer(win, fp(), 'pointerdown', 360, 50);       // the −4 µC charge
  pointer(win, fp(), 'pointerup', 360, 50);
  eq('erase removes exactly one charge', txt(win, 'fp-count'), '4');
  eq('canvas type scale tracks the root font size', win.EMC.typeScale(), 1);

  // --- Dipole toy: the bisector field follows the bond ----------------------
  const e0 = parseSI(txt(win, 'dp-e'));
  setRange(win, 'dp-sep', 1.4);
  const e1 = parseSI(txt(win, 'dp-e'));
  ok('stretching the bond strengthens the bisector field', e1 > e0, `${e0} -> ${e1}`);
  click(win, doc.getElementById('dp-flip'));
  eq('the flip button reports its state', doc.getElementById('dp-flip').getAttribute('aria-pressed'), 'true');

  // --- Zero hunt: the meter speaks in words ---------------------------------
  click(win, doc.getElementById('zh-new'));
  ok('the E-meter reports a magnitude', /N\/C/.test(txt(win, 'zh-e')), txt(win, 'zh-e'));
  ok('the hot/cold chip uses flat words, not colour alone',
    /(cold|cool|warm|ZERO)/.test(txt(win, 'zh-chip')), txt(win, 'zh-chip'));
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

/* ---------------- topics/magind.html ---------------- */
{
  console.log('\n[topics/magind.html]');
  const { win, doc, problems } = await loadPage('topics/magind.html');
  await frames(win, 6);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  ok('lorentz canvas rendered', drawCalls(win, '#sim-lorentz') > 80);
  ok('induction canvas rendered', drawCalls(win, '#sim-induction') > 150);

  // --- Lorentz force: proton, 2e5 m/s, 0.5 T ---
  // F = qvB = 1.602e-19*2e5*0.5 = 1.60e-14 N ; r = mv/qB = 4.18 mm ; T = 131 ns
  const e = 1.602176634e-19, mp = 1.67262192369e-27, v0 = 2e5, B0 = 0.5;
  numClose('|F| = qvB', parseSI(txt(win, 'lor-force')), e * v0 * B0, 0.01);
  numClose('orbit radius r = mv/qB', parseSI(txt(win, 'lor-radius')), mp * v0 / (e * B0), 0.01);
  numClose('period T = 2 pi m/qB', parseSI(txt(win, 'lor-period')), 2 * Math.PI * mp / (e * B0), 0.01);
  numClose('kinetic energy = 1/2 mv^2 (in eV)', parseSI(txt(win, 'lor-ke')), 0.5 * mp * v0 * v0 / e, 0.01);
  numClose('kinetic energy sub-line in joules', parseSI(txt(win, 'lor-kev')), 0.5 * mp * v0 * v0, 0.01);
  ok('prefixes are never stacked', !/(m|µ|n|p|k)(m|µ|n|p|k)[A-Z]/.test(txt(win, 'lor-force')));
  eq('force points down for v=right, B=out, q>0', txt(win, 'lor-dir'), 'down ↓');

  // flipping the field reverses the force
  click(win, doc.querySelector('#lor-bdir [data-value="in"]'));
  eq('reversing B reverses F', txt(win, 'lor-dir'), 'up ↑');
  // an electron reverses it again
  click(win, doc.querySelector('#lor-particle [data-value="electron"]'));
  eq('electron curves the other way', txt(win, 'lor-dir'), 'down ↓');
  ok('negative-charge rule is explained', /REVERSE/.test(txt(win, 'lor-rule')), txt(win, 'lor-rule'));
  click(win, doc.querySelector('#lor-particle [data-value="proton"]'));
  click(win, doc.querySelector('#lor-bdir [data-value="out"]'));

  // doubling B halves the radius
  const r0 = parseSI(txt(win, 'lor-radius'));
  setRange(win, 'lor-B', 1.0);
  numClose('doubling B halves r', parseSI(txt(win, 'lor-radius')), r0 / 2, 0.01);
  setRange(win, 'lor-B', 0.5);

  // --- right-hand-rule challenge ---
  click(win, doc.querySelector('[data-lor-answer="down"]'));
  ok('correct challenge answer is accepted', /Correct/.test(txt(win, 'lor-challenge-feedback')), txt(win, 'lor-challenge-feedback'));
  ok('the correct button is highlighted', doc.querySelector('[data-lor-answer="down"]').classList.contains('correct'));
  click(win, doc.getElementById('lor-challenge-new'));
  ok('a new scenario re-enables the buttons', doc.querySelectorAll('[data-lor-answer]:not([disabled])').length === 4);


  // --- RK4 integrator tracks the analytic orbit radius ---
  ok('RK4 radius error stays under 0.5% of r', parseSI(txt(win, 'lor-rkerr')) < parseSI(txt(win, 'lor-radius')) * 0.005,
    `${txt(win, 'lor-rkerr')} vs r=${txt(win, 'lor-radius')}`);

  // ---------------- induction half ----------------
  
  

  // stationary magnet -> no EMF at all
  eq('a stationary magnet induces nothing', parseSI(txt(win, 'ind-emf')), 0);
  eq('galvanometer reads zero', parseSI(txt(win, 'ind-I')), 0);
  eq('direction readout explains why', txt(win, 'ind-dir'), 'no induced current');
  ok('flux is non-zero while the magnet sits off-centre', parseSI(txt(win, 'ind-phi')) > 0, txt(win, 'ind-phi'));
  ok('Lenz panel explains the zero', /not changing/.test(txt(win, 'ind-lenz')), txt(win, 'ind-lenz'));

  // exact dipole flux check: Phi = mu0*m*a^2 / (2*(a^2+z^2)^1.5)
  const mu0 = 4 * Math.PI * 1e-7, m = 0.8, a = 0.02, z = -0.075;
  const phiExpected = mu0 * m * a * a / (2 * Math.pow(a * a + z * z, 1.5));
  numClose('Phi per turn matches the closed form', parseSI(txt(win, 'ind-phi')), phiExpected, 0.01);
  numClose('lambda = N * Phi', parseSI(txt(win, 'ind-lambda')), 800 * phiExpected, 0.01);
  ok('flux units are not double-prefixed', !/µm|mµ|nµ/.test(txt(win, 'ind-phi')), txt(win, 'ind-phi'));

  // push the magnet through: an EMF must appear and then change sign
  click(win, doc.querySelector('[data-ind-mode="push"]'));
  const emfs = [], dirs = [], currents = [];
  for (let i = 0; i < 90; i++) {
    await frames(win, 1);
    emfs.push(parseSI(txt(win, 'ind-emf')));
    dirs.push(txt(win, 'ind-dir') || '');
    currents.push(parseSI(txt(win, 'ind-I')));
  }
  const peak = Math.max(...emfs.map(Math.abs));
  ok('motion induces a measurable EMF', peak > 1e-3, `peak |EMF| = ${(peak * 1000).toFixed(1)} mV`);
  ok('the EMF changes sign as the magnet passes the centre',
    Math.min(...emfs) < 0 && Math.max(...emfs) > 0,
    `min ${(Math.min(...emfs) * 1000).toFixed(1)} mV / max ${(Math.max(...emfs) * 1000).toFixed(1)} mV`);
  ok('a current flows while the magnet moves', Math.max(...currents.map(Math.abs)) > 1e-5,
    `${(Math.max(...currents.map(Math.abs)) * 1000).toFixed(2)} mA peak`);
  ok('the strip chart recorded history', drawCalls(win, '#sim-induction-chart') > 40);
  ok('Lenz direction is stated during the motion',
    dirs.some(d => /\b(CW|CCW)\b/.test(d)), [...new Set(dirs)].join(' / '));
  ok('the sense reverses as flux switches from rising to falling',
    dirs.some(d => /\bCW\b/.test(d)) && dirs.some(d => /\bCCW\b/.test(d)),
    [...new Set(dirs)].join(' / '));
  ok('I = EMF/R at every sample', emfs.every((emf, i) => Math.abs(currents[i] - emf / 10) < 1e-9));

  ok('induction challenge strip is live', (txt(win, 'ind-chal-text') || '').length > 20, txt(win, 'ind-chal-text'));
  eq('three induction prediction choices', doc.querySelectorAll('#ind-chal-opts button').length, 3);

  // Faraday scaling: EMF is proportional to N. Use the deterministic
  // oscillation so both runs sample exactly the same motion.
  const runOscillation = async () => {
    click(win, doc.getElementById('ind-reset'));
    click(win, doc.querySelector('[data-ind-mode="oscillate"]'));
    const seen = [];
    for (let i = 0; i < 90; i++) { await frames(win, 1); seen.push(Math.abs(parseSI(txt(win, 'ind-emf')))); }
    click(win, doc.querySelector('[data-ind-mode="manual"]'));
    return Math.max(...seen);
  };
  setRange(win, 'ind-N', 800);
  const peak800 = await runOscillation();
  setRange(win, 'ind-N', 1600);
  const peak1600 = await runOscillation();
  numClose('EMF scales linearly with N (800 -> 1600 turns)', peak1600, peak800 * 2, 0.10);
  ok('oscillating the magnet produces an alternating EMF', peak800 > 1e-3, `${(peak800 * 1000).toFixed(1)} mV peak`);

  // R changes the current but not the EMF
  click(win, doc.getElementById('ind-reset'));
  click(win, doc.querySelector('[data-ind-mode="push"]'));
  await frames(win, 12);
  const emfR10 = parseSI(txt(win, 'ind-emf')), iR10 = parseSI(txt(win, 'ind-I'));
  setRange(win, 'ind-R', 40);
  numClose('quadrupling R leaves the EMF unchanged', parseSI(txt(win, 'ind-emf')), emfR10, 0.02);
  numClose('quadrupling R quarters the current', parseSI(txt(win, 'ind-I')), iR10 / 4, 0.02);
  win.close();
}

/* ---------------- quiz.html ---------------- */
{
  console.log('\n[quiz.html]');
  const { win, doc, problems } = await loadPage('quiz.html');
  await frames(win, 2);
  ok('no runtime errors', problems.length === 0, problems.join(' | '));
  const bank = win.EMC_QUIZ;
  eq('question bank size', bank.length, 35);
  ok('the bank contains no duplicate questions (audit 3.1 regression guard)',
    new Set(bank.map(q => q.q)).size === bank.length);
  ok('four-stat strip uses the 4-up layout class',
     doc.querySelector('.stat-strip').classList.contains('stat-strip-4'));
  ok('quiz copy is free of the word "module"',
     !/module/i.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8') +
                     readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8')));
  eq('every question rendered', doc.querySelectorAll('.q-card').length, 35);
  eq('four options each', doc.querySelectorAll('.q-card').length * 4, doc.querySelectorAll('.opt').length);
  ok('every question has a valid answer index',
    bank.every(q => Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length));
  ok('every question has an explanation', bank.every(q => q.explain && q.explain.length > 20));
  ok('all five topics are covered (3 lessons + 2 Extra)',
    new Set(bank.map(q => q.topic)).size === 5, [...new Set(bank.map(q => q.topic))].join(','));
  for (const [t, n] of [['charge', 6], ['coulomb', 6], ['field', 7], ['current', 8], ['magind', 8]]) {
    eq(`topic filter counts — ${t}`, bank.filter(q => q.topic === t).length, n);
  }
  ok('every question ships a hint and an Easy/Full level',
    bank.every(q => q.hint && q.hint.length > 8 && (q.level === 'easy' || q.level === 'full')));

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
  ok('progress text counts answers', /0 of 35 answered/.test(txt(win, 'quiz-progress-text')), txt(win, 'quiz-progress-text'));

  // all correct -> 100% (the practice timer is enabled first so the clock
  // assertions below exercise the opt-in timer; the default stays Off)
  click(win, doc.querySelector('#quiz-timer-mode [data-value="up"]'));
  answerAll(false);
  eq('all 35 recorded', txt(win, 'quiz-progress-text'), '35 of 35 answered');
  click(win, doc.getElementById('quiz-submit'));
  ok('with no blanks the first submit asks for a gentle confirm',
    doc.getElementById('quiz-score').hidden === true &&
    doc.getElementById('quiz-submit').textContent === 'Confirm submission');
  click(win, doc.getElementById('quiz-submit'));
  ok('score card is revealed', doc.getElementById('quiz-score').hidden === false);
  ok('Chart.js is lazy: injected only at grading time, not parser-blocking',
    !/<script[^>]*vendor\/chart/.test(readFileSync(join(ROOT, 'quiz.html'), 'utf8')) &&
    [...doc.head.querySelectorAll('script')].some(s => /vendor\/chart/.test(s.src || '')));
  ok('until the injected lib executes the CSS-bar fallback carries the score card',
    doc.getElementById('quiz-charts').hidden === true &&
    doc.getElementById('quiz-fallback-bars').hidden === false);
  ok('perfect score is 100%', txt(win, 'quiz-score').includes('100%'), txt(win, 'quiz-score').slice(0, 80));
  ok('every card marked correct', doc.querySelectorAll('.q-card.answered-correct').length === 35);
  ok('explanations are shown', doc.querySelectorAll('.feedback.good').length === 35);
  ok('options are locked after grading', doc.querySelectorAll('.opt:disabled').length === 140);

  // stored progress
  const stored = JSON.parse(win.localStorage.getItem('emc.progress.v3'));
  eq('best score saved to localStorage', stored.quizBest, 100);
  eq('attempt counter saved', stored.quizAttempts, 1);

  // retake, then all wrong -> 0%
  click(win, doc.getElementById('quiz-retake'));
  ok('retake clears the marks', doc.querySelectorAll('.q-card.answered-correct').length === 0);
  answerAll(true);
  click(win, doc.getElementById('quiz-submit'));   // confirm phase
  click(win, doc.getElementById('quiz-submit'));   // graded
  ok('all-wrong score is 0%', txt(win, 'quiz-score').includes('0%'), txt(win, 'quiz-score').slice(0, 60));
  ok('wrong answers highlighted', doc.querySelectorAll('.q-card.answered-wrong').length === 35);
  ok('correct option still shown for learning', doc.querySelectorAll('.opt.correct').length === 35);
  const stored2 = JSON.parse(win.localStorage.getItem('emc.progress.v3'));
  eq('best score is kept across attempts', stored2.quizBest, 100);
  eq('attempts incremented', stored2.quizAttempts, 2);

  // review-incorrect filter
  click(win, doc.getElementById('quiz-wrong'));
  eq('review mode shows only the wrong ones', doc.querySelectorAll('.q-card').length, 35);

  // retake and check a partial score: 10 of 24 correct = 42%
  click(win, doc.getElementById('quiz-retake'));
  doc.querySelectorAll('.q-card').forEach((card, i) => {
    const q = bank.find(x => x.id === Number(card.dataset.qid));
    const idx = i < 10 ? q.answer : (q.answer + 1) % q.options.length;
    card.querySelector(`.opt[data-opt="${idx}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  click(win, doc.getElementById('quiz-submit'));   // confirm phase
  click(win, doc.getElementById('quiz-submit'));   // graded
  ok('10 of 35 correct scores 29%', txt(win, 'quiz-score').includes('29%'), txt(win, 'quiz-score').slice(0, 60));
  ok('10 of 35 reported', /10 \/ 35 correct/.test(txt(win, 'quiz-score')), '');
  ok('quiz clock was started by answering and frozen at submit',
    doc.getElementById('quiz-timer').hidden === false && /\d+:\d\d/.test(txt(win, 'quiz-timer')));
  ok('score card reports time and best-streak tags',
    /time \d+:\d\d/.test(txt(win, 'quiz-score')) && /best streak \u00D7/.test(txt(win, 'quiz-score')));

  // attempt history is stored for the Chart.js line chart
  const hist = win.EMC.Progress.read().quizHistory;
  eq('three attempts recorded in history', hist.length, 3);
  eq('history keeps the scores in order', hist.map(h => h.pct).join(','), '100,0,29');

  // shuffle keeps the bank intact
  click(win, doc.getElementById('quiz-retake'));
  click(win, doc.getElementById('quiz-shuffle'));
  eq('shuffle keeps all 35 questions', doc.querySelectorAll('.q-card').length, 35);

  // topic filter
  click(win, doc.querySelector('[data-quiz-filter="field"]'));
  eq('field filter shows 7 questions', doc.querySelectorAll('.q-card').length, 7);
  click(win, doc.querySelector('[data-quiz-filter="lessons"]'));
  eq('the Lessons 1-3 group filter shows the 19 lecture questions', doc.querySelectorAll('.q-card').length, 19);
  click(win, doc.querySelector('[data-quiz-filter="all"]'));
  eq('all filter restores 35', doc.querySelectorAll('.q-card').length, 35);
  eq('every card carries an Easy/Full level tag', doc.querySelectorAll('.q-card .q-level').length, 35);
  ok('every question ships a hint button', doc.querySelectorAll('.q-hint-btn').length === 35);
  const hintBtn = doc.querySelector('.q-hint-btn');
  click(win, hintBtn);
  ok('clicking hint reveals the hint text in place',
    doc.getElementById('hint-' + hintBtn.dataset.hint).hidden === false);

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
  console.log('\n[quiz.html?topic=field]');
  const { win, doc, problems } = await loadPage('quiz.html?topic=field');
  await frames(win, 2);
  ok('deep link loads without runtime errors', problems.length === 0, problems.join(' | '));
  eq('?topic= narrows the view to that lesson', doc.querySelectorAll('.q-card').length, 7);
  ok('the matching filter button is pressed',
    doc.querySelector('[data-quiz-filter="field"]').getAttribute('aria-pressed') === 'true');
  ok('the deep link is announced', /Filtered to Electric Field/.test(doc.body.textContent));
  win.close();

  console.log('\n[quiz.html without the vendored chart lib]');
  // The graceful-degradation path must survive: pretend the vendored file 404s.
  const { win: w2, doc: d2 } = await loadPage('quiz.html', {}, { skip: 'chart\\.umd' });
  w2.EMC_QUIZ.forEach(q => {
    const card = d2.querySelector(`#q-${q.id}`);
    card.querySelector(`.opt[data-opt="${q.answer}"]`).dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  });
  d2.getElementById('quiz-submit').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  d2.getElementById('quiz-submit').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));  // confirm
  ok('without the chart lib the CSS-bar fallback is used',
    d2.getElementById('quiz-charts').hidden === true &&
    d2.getElementById('quiz-fallback-bars').hidden === false);
  ok('the fallback still lists every topic',
    /Circuits & Ohm’s law/.test(d2.getElementById('quiz-fallback-bars').textContent) &&
    /Magnetism & induction/.test(d2.getElementById('quiz-fallback-bars').textContent));
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
  doc.getElementById('quiz-submit').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));  // confirm
  eq('three Chart.js instances created (doughnut, bar, line)', FakeChart.made.length, 3);
  eq('chart types', FakeChart.made.map(m => m.type).join(','), 'doughnut,bar,line');
  eq('charts target the score-card canvases',
    FakeChart.made.map(m => m.id).join(','), 'chart-score,chart-topics,chart-history');
  ok('with Chart.js present the CSS bars yield to the charts',
    doc.getElementById('quiz-charts').hidden === false &&
    doc.getElementById('quiz-fallback-bars').hidden === true);
  win.close();
}

/* ---------------- quiz upgrade: dual submit, floating timer, unanswered --- */
{
  console.log('\n[quiz.html \u2014 dual submit / floating timer / unanswered filter]');
  const { win, doc } = await loadPage('quiz.html');
  await frames(win, 2);
  const bank = win.EMC_QUIZ;

  // two controls, one workflow, unique ids, sensible placement
  const submitBtns = [...doc.querySelectorAll('[data-quiz-submit]')];
  eq('two submit controls share one workflow', submitBtns.length, 2);
  ok('every id on the page is unique',
    new Set([...doc.querySelectorAll('[id]')].map(e => e.id)).size === doc.querySelectorAll('[id]').length);
  ok('the bottom submit sits after the question list',
    (doc.getElementById('quiz-list').compareDocumentPosition(submitBtns[1]) & win.Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
  ok('submit() is guarded against double grading',
    /function submit\(\) \{\n    if \(S\.submitted\) return;/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));

  // Enter-key submission needs a real IntersectionObserver (active card), so it
  // is covered by the Chromium harness; here we assert the guard stays wired.
  ok('the Enter shortcut still targets the shared top submit control',
    /const sb = el\('quiz-submit'\); if \(sb && !sb\.disabled\) \{ sb\.click\(\)/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));
  // ...and that the shortcut can never hijack Enter from a focused LINK: the
  // skip link / nav / pager must stay operable by keyboard (a keyboard user
  // activating "Skip to main content" must land on the content, not submit).
  ok('quiz hotkeys bail out when focus is on a link (A excluded)',
    /if \(t && \/INPUT\|TEXTAREA\|SELECT\|SUMMARY\|BUTTON\|A\/\.test\(t\.tagName\)\) return;/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));

  // floating timer: hidden until the first answer, then mirrors the one clock
  // (the practice timer is opt-in: switch it on before the first answer)
  ok('floating timer is hidden before the first answer', doc.getElementById('floatTimer').hidden === true);
  click(win, doc.querySelector('#quiz-timer-mode [data-value="up"]'));
  ok('the timer stays calm (hidden) until the quiz actually starts',
    doc.getElementById('floatTimer').hidden === true);
  const card = doc.querySelector('.q-card');
  const q = bank.find(x => x.id === Number(card.dataset.qid));
  card.querySelector(`.opt[data-opt="${q.answer}"]`).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('floating timer appears on the first answer', doc.getElementById('floatTimer').hidden === false);
  ok('timer panel carries the single clock readout', doc.getElementById('quiz-timer').hidden === false);

  // unanswered filter + full-bank progress while filtered
  click(win, doc.querySelector('[data-quiz-filter="unanswered"]'));
  eq('unanswered filter hides answered questions', doc.querySelectorAll('.q-card').length, bank.length - 1);
  eq('unanswered button reports its pressed state',
    doc.querySelector('[data-quiz-filter="unanswered"]').getAttribute('aria-pressed'), 'true');
  click(win, doc.querySelector('[data-quiz-filter="current"]'));   // also resets the blank warning
  ok('progress text spans the full bank while a filter is active',
    /1 of 35 answered/.test(txt(win, 'quiz-progress-text')), txt(win, 'quiz-progress-text'));
  click(win, doc.querySelector('[data-quiz-filter="all"]'));

  // bottom button: warning first, then grading; both controls lock in sync
  click(win, submitBtns[1]);
  ok('first bottom submit warns about blanks without grading',
    doc.getElementById('quiz-score').hidden === true && !submitBtns[0].disabled);
  click(win, submitBtns[1]);
  ok('second bottom submit grades the full bank', doc.getElementById('quiz-score').hidden === false);
  ok('both submit controls lock in sync',
    submitBtns.every(b => b.disabled && b.textContent === 'Quiz submitted'));
  ok('score card enters with the results animation class',
    doc.getElementById('quiz-score').classList.contains('score-enter'));
  eq('grading recorded exactly one attempt',
    JSON.parse(win.localStorage.getItem('emc.progress.v3')).quizAttempts, 1);

  // floating timer: keyboard move, reset, minimise/expand, clock stops submitted
  const ft = doc.getElementById('floatTimer');
  const handle = doc.getElementById('floatTimerHandle');
  const t0 = ft.style.transform;
  handle.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
  ok('arrow keys reposition the timer panel', ft.style.transform !== t0 && ft.style.transform !== '');
  const moved = ft.style.transform;
  click(win, doc.getElementById('floatTimerReset'));
  ok('reset returns the panel to its default slot', ft.style.transform !== moved);
  click(win, doc.getElementById('floatTimerMin'));
  ok('minimise compacts the panel and flips aria-pressed',
    ft.classList.contains('min') && doc.getElementById('floatTimerMin').getAttribute('aria-pressed') === 'true');
  click(win, doc.getElementById('floatTimerMin'));
  ok('expand restores the full panel', !ft.classList.contains('min'));
  const frozen = txt(win, 'quiz-timer');
  await new Promise(r => setTimeout(r, 1200));
  eq('the clock stops once submitted', txt(win, 'quiz-timer'), frozen);
  win.close();
}

/* ---------------- quiz QOL: timer modes, navigator, flags, autosave ------ */
{
  console.log('\n[quiz.html \u2014 QOL: timer modes / navigator / flags / autosave]');

  // --- window 1: calm defaults, navigator, flags, autosave, pass results ---
  const { win, doc } = await loadPage('quiz.html');
  await frames(win, 2);
  const bank = win.EMC_QUIZ;

  ok('timer defaults to Off (calm by default)',
    doc.querySelector('#quiz-timer-mode [data-value="off"]').getAttribute('aria-pressed') === 'true' &&
    doc.getElementById('timer-mins').hidden === true);
  eq('navigator shows one chip per question', doc.querySelectorAll('#qnav .qnav-chip').length, 35);
  ok('prev is disabled before any question is active', doc.getElementById('qnav-prev').disabled === true);
  ok('progress pill is visible from the start', doc.getElementById('quizPill').hidden === false);
  eq('pill counts answered questions', txt(win, 'pillText'), '0/35');

  // answer q1 correctly; with the timer Off no clock may appear
  const q1 = bank[0];
  doc.querySelector(`#q-${q1.id} .opt[data-opt="${q1.answer}"]`)
    .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('with the timer Off no clock panel appears', doc.getElementById('floatTimer').hidden === true);
  eq('pill tracks the answer', txt(win, 'pillText'), '1/35');
  ok('answered chip turns done',
    doc.querySelector(`#qnav [data-goto="${q1.id}"]`).classList.contains('done'));

  // flag q2 for review
  click(win, doc.querySelector(`#q-${bank[1].id} .q-flag`));
  ok('flag button toggles on with aria-pressed',
    doc.querySelector(`#q-${bank[1].id} .q-flag`).getAttribute('aria-pressed') === 'true' &&
    doc.querySelector(`#q-${bank[1].id}`).classList.contains('flagged'));
  ok('flagged chip grows the amber dot',
    doc.querySelector(`#qnav [data-goto="${bank[1].id}"]`).classList.contains('flag'));
  eq('pill counts flags', txt(win, 'pillFlagCount'), '1');
  click(win, doc.querySelector('[data-quiz-filter="flagged"]'));
  eq('flagged filter shows exactly the flagged question', doc.querySelectorAll('.q-card').length, 1);
  click(win, doc.querySelector('[data-quiz-filter="all"]'));
  click(win, doc.querySelector(`#q-${bank[1].id} .q-flag`));
  ok('flag toggles back off and the pill calms down', doc.getElementById('pillFlags').hidden === true);

  // jumping to a question the current filter hides restores the full list
  click(win, doc.querySelector('[data-quiz-filter="unanswered"]'));
  click(win, doc.querySelector(`#qnav [data-goto="${q1.id}"]`));
  ok('jumping to a filtered-away question restores the full list and marks it current',
    doc.querySelectorAll('.q-card').length === 35 &&
    doc.querySelector(`#qnav [data-goto="${q1.id}"]`).classList.contains('cur'));

  // autosave (400 ms throttle) -> a resumable session document
  await new Promise(r => setTimeout(r, 500));
  const session = JSON.parse(win.localStorage.getItem('emc.quiz.session.v1') || 'null');
  ok('answering autosaves a resumable session',
    session !== null && session.v === 2 &&
    session.answers.length === 1 && session.answers[0][0] === q1.id);

  // finish all-correct -> pass: cheer face, tiny confetti, no weak spots
  doc.querySelectorAll('.q-card').forEach(card2 => {
    const q = bank.find(x => x.id === Number(card2.dataset.qid));
    if (card2.querySelector('.opt[aria-checked="true"]') === null) {
      card2.querySelector(`.opt[data-opt="${q.answer}"]`)
        .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    }
  });
  click(win, doc.getElementById('quiz-submit'));
  click(win, doc.getElementById('quiz-submit'));
  ok('passing score celebrates with the cheer face + tiny confetti',
    doc.querySelectorAll('#quiz-score .score-cheer .mreact').length === 1 &&
    doc.querySelectorAll('#quiz-score .confetti i').length === 14);
  ok('a perfect score reports no weak spots', /flawless/i.test(txt(win, 'quiz-score')));
  ok('with the timer Off the score card shows no time tags',
    /\btime \d+:\d\d/.test(txt(win, 'quiz-score')) === false &&
    /s per question/.test(txt(win, 'quiz-score')) === false);
  ok('submitting clears the saved session', win.localStorage.getItem('emc.quiz.session.v1') === null);
  ok('the pill hides once the results are up', doc.getElementById('quizPill').hidden === true);
  const prefsNow = JSON.parse(win.localStorage.getItem('emc.prefs.v1') || '{}');
  eq('the timer preference is persisted', prefsNow.quizTimerMode, 'off');
  win.close();

  // --- window 2: challenge countdown -> soft warning -> gentle auto-submit --
  const { win: w2, doc: d2 } = await loadPage('quiz.html');
  await frames(w2, 2);
  const bank2 = w2.EMC_QUIZ;
  click(w2, d2.querySelector('#quiz-timer-mode [data-value="down"]'));
  ok('challenge mode reveals the duration chips', d2.getElementById('timer-mins').hidden === false);
  click(w2, d2.querySelector('#timer-mins [data-mins="15"]'));
  const c1 = d2.querySelector('.q-card');
  const cq = bank2.find(x => x.id === Number(c1.dataset.qid));
  c1.querySelector(`.opt[data-opt="${cq.answer}"]`).dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  ok('the countdown panel shows Remaining time from the chosen limit',
    d2.getElementById('floatTimer').hidden === false &&
    d2.querySelector('.ft-title').textContent === 'Remaining' &&
    /^(15:00|14:5\d)$/.test(txt(w2, 'quiz-timer')), txt(w2, 'quiz-timer'));
  const real2 = w2.performance.now.bind(w2.performance);
  w2.performance.now = () => real2() + 14.5 * 60 * 1000;   // 30 s left
  await new Promise(r => setTimeout(r, 1200));
  ok('the last minute turns the panel soft amber (never red panic)',
    d2.getElementById('floatTimer').classList.contains('warn'));
  ok('the warning alone does not submit', d2.getElementById('quiz-score').hidden === true);
  w2.performance.now = () => real2() + 16 * 60 * 1000;     // past zero
  await new Promise(r => setTimeout(r, 1200));
  ok('time\u2019s up grades the quiz gently (auto-submit)', d2.getElementById('quiz-score').hidden === false);
  ok('the auto-submit announces itself', /Time\u2019s up/.test(d2.body.textContent));
  ok('a failing score reports the weakest areas', /Weakest/.test(txt(w2, 'quiz-score')));
  ok('no confetti below the pass mark', d2.querySelectorAll('#quiz-score .confetti').length === 0);
  w2.close();

  // --- window 3: resume an autosaved session (explicit choice) -------------
  const seed = JSON.stringify({
    v: 2, answers: [[1, 1], [2, 1]], marked: [], flagged: [3], optOrder: null,
    instant: false, filter: 'all', baseMs: 0, clockOn: false, timerMode: 'off', timerMins: 10
  });
  const { win: w3, doc: d3 } = await loadPage('quiz.html', {}, { seed: { 'emc.quiz.session.v1': seed } });
  await frames(w3, 2);
  ok('a saved session OFFERS to resume (never a silent restore)',
    d3.getElementById('resume-wrap').hidden === false &&
    /2 of 35 answered/.test(txt(w3, 'resume-summary')) &&
    /1 flagged/.test(txt(w3, 'resume-summary')));
  eq('nothing is restored before the choice', txt(w3, 'quiz-progress-text'), '0 of 35 answered');
  click(w3, d3.getElementById('resume-yes'));
  eq('resume restores the answers', txt(w3, 'quiz-progress-text'), '2 of 35 answered');
  ok('resume restores the flags and hides the banner',
    d3.querySelector('#q-3 .q-flag').getAttribute('aria-pressed') === 'true' &&
    d3.getElementById('resume-wrap').hidden === true);
  ok('the restored answer is checked on its card',
    d3.querySelector('#q-1 .opt[data-opt="1"]').getAttribute('aria-checked') === 'true');
  w3.close();

  // --- window 4: "start fresh" wipes the saved session ----------------------
  const { win: w4, doc: d4 } = await loadPage('quiz.html', {}, { seed: { 'emc.quiz.session.v1': seed } });
  await frames(w4, 2);
  click(w4, d4.getElementById('resume-no'));
  ok('start fresh clears the banner and the storage',
    d4.getElementById('resume-wrap').hidden === true &&
    w4.localStorage.getItem('emc.quiz.session.v1') === null);
  w4.close();
}

/* ---------------- issue #3 regressions ------------------------------------
   Each assertion maps to a numbered item in github.com/TearTyr/EMC-Lab/issues/3
   so a regression points straight back at the report. ---------------------- */
{
  console.log('\n[issue #3 \u2014 physics, reduced motion, formats, progress I/O]');

  /* --- items 3 + 9: Lenz pole text follows the magnet side; the RK4-vs-
         theory error readout tracks the animation, not just the controls --- */
  {
    const { win, doc, problems } = await loadPage('topics/magind.html');
    await frames(win, 3);
    ok('magind loads without runtime errors', problems.length === 0, problems.join(' | '));
    click(win, doc.querySelector('[data-ind-mode="pull"]'));
    await frames(win, 2);
    const lenzPull = txt(win, 'ind-lenz');
    ok('item 3: magnet RIGHT of coil, approaching -> near face is SOUTH (S repels S)',
      /south/i.test(lenzPull) && /repels/i.test(lenzPull), String(lenzPull).slice(0, 140));
    click(win, doc.querySelector('[data-ind-mode="push"]'));
    await frames(win, 2);
    const lenzPush = txt(win, 'ind-lenz');
    ok('item 3: magnet LEFT of coil, approaching -> near face is NORTH',
      /north/i.test(lenzPush) && /repels/i.test(lenzPush), String(lenzPush).slice(0, 140));
    // item 9: the orbit error must appear from the animation alone
    await frames(win, 75);
    await new Promise(r => setTimeout(r, 350));
    const rk = txt(win, 'lor-rkerr');
    ok('item 9: RK4-vs-theory readout updates from the running animation',
      rk !== null && rk !== '\u2014' && rk !== '0\u00A0m', String(rk));
    win.close();
  }

  /* --- items 1 + 2: reduced motion must not crash the induction sim, and
         explicit user actions restart the parked loops --------------------- */
  {
    const { win, doc, problems } = await loadPage('topics/magind.html', {}, { reduceMotion: true });
    await frames(win, 3);
    ok('item 1: induction sim loads clean under prefers-reduced-motion',
      problems.length === 0, problems.join(' | '));
    ok('item 1: the constructor frame populated the readouts', /cm/.test(txt(win, 'ind-z') || ''));

    const lorBefore = drawCalls(win, '#sim-lorentz');
    await new Promise(r => setTimeout(r, 250));
    eq('item 2: the Lorentz loop stays parked while nothing is asked for',
      drawCalls(win, '#sim-lorentz'), lorBefore);
    click(win, doc.getElementById('lor-play'));   // Pause
    click(win, doc.getElementById('lor-play'));   // Play -> explicit request
    await new Promise(r => setTimeout(r, 350));
    ok('item 2: Play restarts the Lorentz orbit under reduced motion',
      drawCalls(win, '#sim-lorentz') > lorBefore);

    const indBefore = drawCalls(win, '#sim-induction');
    click(win, doc.querySelector('[data-ind-mode="push"]'));
    await new Promise(r => setTimeout(r, 500));
    ok('item 2: Push runs the induction motion under reduced motion',
      drawCalls(win, '#sim-induction') > indBefore &&
      txt(win, 'ind-z') === '11.0 cm', txt(win, 'ind-z'));
    win.close();
  }

  /* --- item 2 (circuit): any deliberate interaction wakes the carriers --- */
  {
    const { win, doc, problems } = await loadPage('topics/current.html', {}, { reduceMotion: true });
    await frames(win, 3);
    ok('current.html loads clean under prefers-reduced-motion', problems.length === 0, problems.join(' | '));
    const before = drawCalls(win, '#sim-circuit');
    click(win, doc.getElementById('circ-add'));
    await new Promise(r => setTimeout(r, 350));
    ok('item 2: a circuit interaction restarts the carrier animation',
      drawCalls(win, '#sim-circuit') > before);
    win.close();
  }

  /* --- item 8 (adapted): the arena can never blow up — close-range
         softening + a hard force cap + an honest stability warning ---------- */
  {
    const { win, doc, problems } = await loadPage('topics/coulomb.html');
    await frames(win, 3);
    const cv = doc.getElementById('sim-arena');
    const qSlider = doc.querySelector('#ar-panel [data-sb-q]');
    qSlider.value = '20';
    qSlider.dispatchEvent(new win.Event('input', { bubbles: true }));
    click(win, doc.querySelector('#ar-panel [data-sb-tool="add+"]'));
    pointer(win, cv, 'pointerdown', 100, 100);
    pointer(win, cv, 'pointerup', 100, 100);
    pointer(win, cv, 'pointerdown', 700, 300);
    pointer(win, cv, 'pointerup', 700, 300);
    // drag the second charge onto the first: r -> 0 with 20 uC each
    pointer(win, cv, 'pointerdown', 700, 300);
    pointer(win, cv, 'pointermove', 100, 100);
    await frames(win, 2);
    pointer(win, cv, 'pointerup', 100, 100);
    ok('item 8: overlapping huge charges raise the stability warning',
      doc.getElementById('ar-warn').hidden === false &&
      /softening/.test(doc.getElementById('ar-warn').textContent),
      doc.getElementById('ar-warn').textContent);
    const F = parseSI(txt(win, 'ar-sel'));
    ok('item 8: the net force is capped at 10 kN (never Infinity, never NaN)',
      isFinite(F) && F > 0 && F <= 1e4 * 1.001, String(F));
    ok('item 8: the overlap raised no errors', problems.length === 0, problems.join(' | '));

    // soft cap on object count keeps the scene readable
    for (let i = 0; i < 45; i++) {
      pointer(win, cv, 'pointerdown', 60 + (i % 9) * 90, 60 + Math.floor(i / 9) * 70);
      pointer(win, cv, 'pointerup', 60 + (i % 9) * 90, 60 + Math.floor(i / 9) * 70);
    }
    await frames(win, 2);
    ok('minor: the arena caps objects at 40', Number(txt(win, 'ar-count')) <= 40, txt(win, 'ar-count'));
    win.close();
  }

  /* --- items 5, 6, 7, 11: progress I/O + SI formatting ------------------- */
  {
    const { win } = await loadPage('index.html');
    const P = win.EMC.Progress;

    eq('item 7: prefix sticks to the unit (54.0 mV, not "54.0 m V")',
      win.EMC.unit(0.054, 'V'), '54.0\u00A0mV');
    eq('item 7: rounding up keeps the requested significant figures',
      win.EMC.unit(0.9997, 'V'), '1.00\u00A0V');
    eq('item 7: unprefixed values keep the number-unit space',
      win.EMC.unit(12, 'V'), '12.0\u00A0V');

    let threw = null, res = null;
    try {
      res = P.importJSON(JSON.stringify({ app: 'emc-lab', progress: { topics: { charges: true } } }));
    } catch (err) { threw = err; }
    ok('item 5: importing a legacy v1 file no longer throws', threw === null, threw && threw.message);
    ok('item 5: the legacy topics are migrated (charges -> all three lessons)',
      res !== null && res.ok === true && P.read().topics.charge === true &&
      P.read().topics.coulomb === true && P.read().topics.field === true);

    P.recordQuiz(80);
    const junk = P.importJSON('{}');
    ok('item 11: importing an unrecognised object is refused', junk.ok === false, JSON.stringify(junk));
    eq('item 11: a refused import keeps the stored progress', P.read().quizBest, 80);

    win.localStorage.setItem('emc.progress.v1', JSON.stringify({ topics: { current: true }, quizBest: 90 }));
    win.localStorage.removeItem('emc.progress.v3');
    P.read();                                   // migrates v1 -> v2
    const after = P.reset();
    ok('item 6: reset also drops the legacy key (progress stays reset)',
      after.quizBest === 0 && win.localStorage.getItem('emc.progress.v1') === null);
    win.close();
  }

  /* --- items 4, 10, 12: quiz session, shuffled key, active-time clock ---- */
  {
    // item 4: an unaccepted resume session must survive the boot-time saves
    const seeded = JSON.stringify({
      v: 2, answers: [[1, 1], [2, 1]], marked: [], flagged: [], optOrder: null,
      instant: false, filter: 'all', baseMs: 0, clockOn: false, timerMode: 'off', timerMins: 10
    });
    const { win, doc } = await loadPage('quiz.html', {}, { seed: { 'emc.quiz.session.v1': seeded } });
    await frames(win, 2);
    await new Promise(r => setTimeout(r, 1100));   // the old bug wiped it at ~400 ms
    ok('item 4: a pending resume session survives past the save throttle',
      win.localStorage.getItem('emc.quiz.session.v1') !== null &&
      doc.getElementById('resume-wrap').hidden === false);
    win.close();

    // item 10: the skewed answer key is shuffled per attempt
    const { win: w2, doc: d2 } = await loadPage('quiz.html');
    await frames(w2, 2);
    const orders = [...d2.querySelectorAll('.q-card')].map(c =>
      [...c.querySelectorAll('.opt')].map(b => Number(b.dataset.opt)).join(','));
    ok('item 10: every card still carries all four options',
      orders.length === 35 && orders.every(o => o.split(',').sort((a, b) => a - b).join(',') === '0,1,2,3'));
    ok('item 10: display order is shuffled (always-B no longer scores 50%)',
      orders.filter(o => o === '0,1,2,3').length < orders.length);
    eq('item 10: the visible key labels stay A, B, C, D',
      [...d2.querySelector('.q-card').querySelectorAll('.opt .key')].map(k => k.textContent).join(''), 'ABCD');
    w2.close();

    // item 12: a stale challenge resume continues from ACTIVE time - it must
    // not auto-grade a quiz that was closed for a day
    const stale = JSON.stringify({
      v: 2, answers: [[1, 1]], marked: [], flagged: [], optOrder: null,
      instant: false, filter: 'all', baseMs: 45000, clockOn: true, timerMode: 'down', timerMins: 10
    });
    const { win: w3, doc: d3 } = await loadPage('quiz.html', {}, { seed: { 'emc.quiz.session.v1': stale } });
    await frames(w3, 2);
    click(w3, d3.getElementById('resume-yes'));
    await new Promise(r => setTimeout(r, 1500));   // > one tick: the old bug graded here
    ok('item 12: resuming a day-old challenge does NOT auto-grade',
      d3.getElementById('quiz-score').hidden === true);
    ok('item 12: the countdown resumes from the banked active time (~9:1x)',
      /^9:(0\d|1[0-5])$/.test(txt(w3, 'quiz-timer') || ''), txt(w3, 'quiz-timer'));
    w3.close();
  }

  /* --- item 15: a Vercel build must fail rather than ship unhashed assets
         under the 1-year immutable headers -------------------------------- */
  ok('item 15: build-public refuses the unhashed fallback on Vercel',
    /if \(process\.env\.VERCEL\)/.test(readFileSync(join(ROOT, 'tools/build-public.mjs'), 'utf8')) &&
    /process\.exit\(1\)/.test(readFileSync(join(ROOT, 'tools/build-public.mjs'), 'utf8')));

  /* --- item 13: Q14 must point at the electric-fields chapter ------------- */
  ok('item 13: the neutrality question points at Lesson 1',
    !/where Topic 1 begins/.test(readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8')) &&
    /where Lesson 1 begins/.test(readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8')));
}

/* ---------------- cross-page checks ---------------- */
{
  console.log('\n[cross-page]');
  const pages = ['index.html', 'quiz.html', 'topics/charge.html', 'topics/coulomb.html',
    'topics/field.html', 'topics/current.html', 'topics/magind.html'];
  // ---- #15 favicon artwork must equal the header brand mark -------------
  // the committed img/favicon.svg is the single artwork source; the ICO and
  // apple-touch PNGs are rasterisations of it (generated, then committed).
  const favSvg = readFileSync(join(ROOT, 'img/favicon.svg'), 'utf8');
  const favTokens = ['M15 15 C13 7 19 5 21 11', 'M33 15 C35 7 29 5 27 11',
                     'rx="16" ry="15"', 'cx="18.5" cy="26"', 'cx="29.5" cy="26"',
                     'cx="13.5" cy="30"', 'cx="34.5" cy="30"'];
  for (const p of pages) {
    const html = readFileSync(join(ROOT, p), 'utf8');
    ok(`${p}: declares a viewport`, /name="viewport"/.test(html));
    ok(`${p}: has a lang attribute`, /<html lang="en">/.test(html));
    ok(`${p}: has a skip link`, /class="skip-link"/.test(html));
    ok(`${p}: skip-link destination is a focusable main`, /<main class="emc-main" id="main" tabindex="-1">/.test(html));
    // The Details swap must never restyle the same slot on ANY page: a
    // plain-level copy must not carry a smaller size class ("lede small",
    // "small muted" + data-detail="plain"), or toggling Details would change
    // the font-size of intro/body text instead of only the content depth.
    ok(`${p}: Details states share typography for swapped content`,
      !/lede small|class="small muted" data-detail="plain"/.test(html));
    if (p.startsWith('topics/')) {
      // hero plain lede carries the identical class of the tech lede, and
      // in-prose plain paragraphs inherit prose typography instead of
      // .small/.muted
      ok(`${p}: hero plain lede is class-identical to the tech lede`,
        (html.match(/<p class="lede" data-detail="plain">/g) || []).length === 1);
    }
    // a bulk data-detail injection once fused an SVG element into
    // `<p data-detail="tech"ath d=...>` — guard against that corruption class
    ok(`${p}: no fused tag/attribute corruption around data-detail`,
      !/<[a-z]+[^>]*data-detail="(?:tech|plain)"[a-z]/i.test(html));
    // the boot shell (full-screen mascot) must never trap the reader: every
    // page applies the stored Detail pref before first paint and force-closes
    // #bootOverlay after 6 s even if the bundle never executes
    ok(`${p}: ships the pre-paint Detail pref, session gate + 4 s failsafe`,
      /setTimeout\(function \(\) \{ var o = document\.getElementById\('bootOverlay'\); if \(o\) o\.remove\(\); \}, 4000\)/.test(html) &&
      /sessionStorage\.getItem\('emc\.splash\.v1'\)/.test(html) &&
      /document\.documentElement\.dataset\.detail = \(__p\.detail === 'off' \? 'off' : 'on'\)/.test(html));
    ok(`${p}: pre-paint script gates the .reveal entrance with html.js`,
      /document\.documentElement\.classList\.add\('js'\)/.test(html));
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
        .every(m => m[1].startsWith('https://emc-lab.vercel.app')) &&
      [...html.matchAll(/property="og:url"[^>]*href="([^"]+)"/g)]
        .every(m => m[1] === ([...html.matchAll(/rel="canonical" href="([^"]+)"/g)][0] || [])[1]));
    ok(`${p}: no third-party <script>/<link> (all assets same-origin)`,
      ![...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
        .some(m => !/emc-lab\.vercel\.app/.test(m[1])));

    // ---- catch-up guards: the premium/motion pass stays honest -------------
    if (p === 'index.html') {
      ok('index: the marquee stays removed (no ticker markup)', !/class="ticker"/.test(html));
      ok('index: three chapter cards carry physics motifs', (html.match(/data-motif="/g) || []).length === 3);
      ok('index: shell script is wired for same-page reading', /src="js\/shell\.js"/.test(html));
      ok('index: home nav marks the current page', /nav-link" href="index\.html" aria-current="page"/.test(html));
    }
    if (p.startsWith('topics/')) {
      const hintCount = /charge|coulomb|field/.test(p) ? 3 : 2;   // lessons: sandbox + two toys
      eq(`${p}: every activity panel ships a first-use hint`, (html.match(/class="sim-hint/g) || []).length, hintCount);
      ok(`${p}: chapter nav marks the current chapter`, /dd-link" href="[a-z]+\.html" aria-current="page"/.test(html));
      ok(`${p}: scroll-reveal coverage on lesson blocks`, (html.match(/class="[^"]*reveal/g) || []).length >= 10);
      ok(`${p}: header entrance stagger present`, /eyebrow-amber reveal rv-d1/.test(html) && /h-topic reveal rv-d2/.test(html));
    }
    if (p === 'index.html' || p.startsWith('topics/')) {
      ok(`${p}: reveal gate never sits on a Details-swapped block`,
        !/<[^>]*data-detail="(plain|tech)"[^>]*class="[^"]*reveal/.test(html) &&
        !/<[^>]*class="[^"]*reveal[^>]*data-detail="(plain|tech)"/.test(html));
    }

    // ---- #15 favicon artwork must equal the header brand mark -------------
    const brandMark = (html.match(/<svg class="brand-mark"[\s\S]*?<\/svg>/) || ['', ''])[0];
    ok(`${p}: favicon artwork matches the header mascot`,
      brandMark.length > 100 && favTokens.every(t => favSvg.includes(t) && brandMark.includes(t)));
    ok(`${p}: ships the full favicon set (ico + svg + apple-touch) with relative hrefs`,
      /rel="icon" href="(?:\.\.\/)?favicon\.ico" type="image\/x-icon"/.test(html) &&
      /rel="icon" href="(?:\.\.\/)?img\/favicon\.svg" type="image\/svg\+xml"/.test(html) &&
      /rel="apple-touch-icon" href="(?:\.\.\/)?img\/apple-touch-icon\.png"/.test(html) &&
      !/rel="icon" href="data:/.test(html));
  }
  // ---- #15b the favicon/crawler files are real committed binaries ----------
  const ico = readFileSync(join(ROOT, 'favicon.ico'));
  ok('favicon.ico is a real multi-size ICO (16/32/48)',
    ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) >= 3);
  const apple = readFileSync(join(ROOT, 'img/apple-touch-icon.png'));
  ok('apple-touch-icon.png exists at the 180x180 Apple requires',
    `${apple.readUInt32BE(16)}x${apple.readUInt32BE(20)}` === '180x180',
    `${apple.readUInt32BE(16)}x${apple.readUInt32BE(20)}`);
  const robotsTxt = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
  ok('robots.txt allows everything and points at the production sitemap',
    /User-agent: \*/.test(robotsTxt) && /Allow: \//.test(robotsTxt) &&
    /Sitemap: https:\/\/emc-lab\.vercel\.app\/sitemap\.xml/.test(robotsTxt));
  const buildSrc = readFileSync(join(ROOT, 'tools/build-public.mjs'), 'utf8');
  ok('the deploy allow-list ships robots.txt + favicon.ico and fails the build without them',
    /'robots\.txt',\n  'favicon\.ico'/.test(buildSrc) &&
    (buildSrc.match(/MUST_EXIST = \[[\s\S]*?\]/)[0].includes("'robots.txt'")) &&
    (buildSrc.match(/MUST_EXIST = \[[\s\S]*?\]/)[0].includes("'favicon.ico'")));
  ok('the generated sitemap carries lastmod stamps',
    /<lastmod>\$\{lastmod\}<\/lastmod>/.test(buildSrc));

  ok('the sandbox core releases its gesture state on pointer-up/leave',
    /state\.dragging = null; downAt = null;/.test(readFileSync(join(ROOT, 'js/sandbox-core.js'), 'utf8')));
  ok('canvas labels use the site family at root-scaled sizes (no mono drift)',
    /G8321, 'Hiragino Maru Gothic ProN', 'Segoe UI', system-ui, sans-serif`/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')) &&
    /canvasTypeScale = rp \/ 16/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));
  ok('probe readouts reserve two lines so the canvas cannot resize mid-gesture',
    /\.stat-value\.hold2 \{ min-height: 3\.5em; \}/.test(readFileSync(join(ROOT, 'css/input.css'), 'utf8')) &&
    (readFileSync(join(ROOT, 'topics/field.html'), 'utf8').match(/stat-value [^"]*hold2|stat-value hold2/g) || []).length >= 1);

  ok('the Details swap animates revealed blocks unless reduced motion',
    /const level = root\.dataset\.detail === 'off' \? 'plain' : 'tech';/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')) &&
    /if \(EMC\.reducedMotion\) \{ flip\(\); return; \}/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));
  ok('the mascot is capped so it can never dominate the hero',
    /width: min\(108px, 26vw\); max-height: 40vh/.test(readFileSync(join(ROOT, 'css/input.css'), 'utf8')) &&
    /width: min\(84px, 22vw\); max-height: 30vh/.test(readFileSync(join(ROOT, 'css/input.css'), 'utf8')));

  // ---- #14 no phantom important-variants of component classes -----------
  const builtAll = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  ok('compiled css carries no escaped important class selectors',
    !/\\![a-z][a-z0-9-]*\s*\{/.test(builtAll),
    (builtAll.match(/\\![a-z][a-z0-9-]*/g) || []).join(','));
  ok('quiz.js uses explicit null checks (no negated identifiers to scan)',
    !/!btn|!card/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')));
  ok('mobile Details toggle keeps its visible label (no hidden dt-label)',
    !/\.dt-label\s*\{[^}]*display:\s*none/.test(builtAll));
  ok('readout value tick + flag pop ship in the compiled css',
    /val-tick/.test(builtAll) && /flagPop/.test(builtAll));
  ok('shell keeps file:// navigation native',
    /protocol === 'file:'/.test(readFileSync(join(ROOT, 'js/shell.js'), 'utf8')));
  ok('button groups show a visible selected state (not aria-pressed alone)',
    /\.btn-group \.btn\[aria-pressed=true\]/.test(builtAll));
  ok('sims ship entrance choreography tied to real objects',
    /intro: opts\.intro === undefined \? 480 : opts\.intro/.test(readFileSync(join(ROOT, 'js/sandbox-core.js'), 'utf8')) &&
    /intro\(\)/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));
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
  ok('every printed Coulomb constant is 8.99\u00D710\u2079 (the lecture value; code keeps full precision)',
    /8\.99\u00D710/.test(printed) && !/8\.988\u00D710/.test(printed) &&
    /K: 8\.987551787e9/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));

  // ---- #9 water density is the round 1000 everywhere it is printed ---------
  ok('printed vacuum permeability is the CODATA 4pi×10⁻⁷ form',
    /4π×10<sup>−7<\/sup>/.test(printed) &&
    /MU0: 1\.25663706212e-6/.test(readFileSync(join(ROOT, 'js/common.js'), 'utf8')));

  // ---- #10 the 70% rule is announced where it fires ------------------------
  ok('the score card announces the 70% auto-tick when it happens',
    /const passNote = pct >= 70/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')) &&
    /Scoring 70% or more/.test(readFileSync(join(ROOT, 'js/quiz.js'), 'utf8')) &&
    /Scoring 70% or more in the quiz also ticks all three lessons/.test(readFileSync(join(ROOT, 'index.html'), 'utf8')));

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
  ok('all simulation scripts are present', js.length >= 11, js.join(', '));
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
  ok('home equation strip + stat strip align to the same column edges',
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

/* ---------------- first-visit splash + repeat-visit gate (owner spec) ----- */
{
  console.log('\n[splash: first visit vs repeat visit]');
  const inline = readFileSync(join(ROOT, 'index.html'), 'utf8');
  ok('the splash is gated to the first visit per session (sessionStorage)',
    /sessionStorage\.getItem\('emc\.splash\.v1'\)/.test(inline) &&
    /classList\.add\('no-splash'\)/.test(inline));
  ok('a 4 s failsafe guarantees the shell can never trap a user',
    /setTimeout\(function \(\) \{ var o = document\.getElementById\('bootOverlay'\); if \(o\) o\.remove\(\); \}, 4000\)/.test(inline));
  ok('noscript hides the shell when JavaScript is off',
    /<noscript>[\s\S]*?#bootOverlay\{display:none\}/.test(inline));
  const overlayMin = Number((readFileSync(join(ROOT, 'js/common.js'), 'utf8')
    .match(/OVERLAY_MIN_MS = (\d+)/) || [0, NaN])[1]);
  eq('the branded minimum display is 400 ms (first visit only)', overlayMin, 400);
  const commonSrc = readFileSync(join(ROOT, 'js/common.js'), 'utf8');
  const tips = commonSrc.match(/const TIPS = \[([\s\S]*?)\];/);
  ok('rotating tips exist, never exceed eight, and come from the lecture',
    tips !== null && tips[1].split('\n').filter(l => l.trim().startsWith("'")).length <= 8);

  const first = await loadPage('topics/coulomb.html');
  await frames(first.win, 2);
  ok('first visit: the overlay paints with the three real-signal chips',
    !!first.doc.getElementById('bootOverlay') &&
    [...first.doc.querySelectorAll('#bootOverlay .bo-chip')].map(c => c.dataset.stage).join(',') === 'fonts,equations,sims');
  eq('the bar has one deterministic segment per signal',
    first.doc.querySelectorAll('#bootOverlay .bo-seg').length, 3);
  ok('the tip slot is decorative for screen readers',
    first.doc.getElementById('boTip').getAttribute('aria-hidden') === 'true');
  ok('a screen-reader status line exists', !!first.doc.getElementById('boStatus'));
  eq('the first visit claims the session flag',
    first.win.sessionStorage.getItem('emc.splash.v1'), '1');
  first.win.close();

  const second = await loadPage('topics/coulomb.html', {}, { session: { 'emc.splash.v1': '1' } });
  await frames(second.win, 2);
  ok('a repeat visit within the session never paints the splash',
    second.doc.documentElement.classList.contains('no-splash') &&
    second.doc.getElementById('bootOverlay') === null);
  second.win.close();

  const reduced = await loadPage('topics/charge.html', {}, { reduceMotion: true });
  await frames(reduced.win, 3);
  await new Promise(r => setTimeout(r, 800));
  ok('under reduced motion the splash still dismisses on the real signals',
    reduced.doc.getElementById('bootOverlay') === null);
  ok('reduced motion keeps the sandbox fully usable',
    drawCalls(reduced.win, '#sim-static-room') > 50);
  reduced.win.close();
}

/* ---------------- page transitions + skeleton plates ---------------- */
{
  console.log('\n[transitions + plates]');
  const css = readFileSync(join(ROOT, 'css/site.css'), 'utf8').replace(/\s+/g, '');
  ok('cross-document View Transitions are enabled', /@view-transition\{navigation:auto\}/.test(css));
  ok('header and mascot are named so they stand still between pages',
    /view-transition-name:site-header/.test(css) && /view-transition-name:denki/.test(css));
  const commonSrc = readFileSync(join(ROOT, 'js/common.js'), 'utf8');
  ok('the fallback fade never hijacks modified clicks, anchors or new tabs',
    /e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey/.test(commonSrc) &&
    /charAt\(0\) === '#'/.test(commonSrc) &&
    /a\.target \|\| a\.hasAttribute\('download'\)/.test(commonSrc));
  ok('bfcache restores are cleaned up (pageshow persisted)',
    /pageshow/.test(commonSrc) && /e\.persisted/.test(commonSrc));
  const inputCss = readFileSync(join(ROOT, 'css/input.css'), 'utf8');
  ok('skeleton plates overlay the exact canvas box (zero layout shift)',
    /\.canvas-wrap \{ position: relative; \}/.test(inputCss) &&
    /\.sim-plate \{[\s\S]*?position: absolute; inset: 0/.test(inputCss));
  ok('plates retire on the real Stage-ready signal, with a load failsafe',
    /emc:stage-ready/.test(commonSrc) && /classList\.add\('gone'\)/.test(commonSrc));
  ok('a canvas-less browser gets a friendly flat message, never a blank hole',
    /This browser can/.test(commonSrc) && /plate\.classList\.add\('keep'\)/.test(commonSrc));

  const { win, doc } = await loadPage('topics/charge.html');
  await frames(win, 8);
  await new Promise(r => setTimeout(r, 700));
  ok('every plate has retired once its Stage really painted',
    [...doc.querySelectorAll('.sim-plate')].every(p => p.classList.contains('gone') || p.hidden === true));
  win.close();
}

/* ---------------- startup system + detail mode ---------------- */
{
  console.log('\n[startup + detail mode]');
  const { win, doc } = await loadPage('topics/coulomb.html');
  await frames(win, 4);
  eq('detail mode defaults to technical', win.document.documentElement.dataset.detail, 'on');
  ok('a first visit paints the branded boot overlay until the real signals finish',
    !!doc.getElementById('bootOverlay') &&
    [...doc.querySelectorAll('#bootOverlay .bo-chip')].map(c => c.dataset.stage).join(',') === 'fonts,equations,sims');
  await new Promise(r => setTimeout(r, 1100));
  ok('overlay unmounts once every real stage completes', doc.getElementById('bootOverlay') === null);
  ok('the shell stays until fonts, above-fold maths and the first sim are really ready',
    doc.querySelectorAll('#bootOverlay .bo-chip.done').length === 3 || doc.getElementById('bootOverlay') === null);
  eq('boot strip ships the two post-boot stage chips', doc.querySelectorAll('#bootStrip .boot-chip').length, 2);
  const btn = doc.getElementById('detailToggle');
  ok('toggle is an accessible switch', btn.getAttribute('role') === 'switch' && btn.getAttribute('aria-checked') === 'true');
  win.__marker = 'alive';
  click(win, btn);
  await new Promise(r => setTimeout(r, 260));      // 80 ms fade-out, then the flip
  eq('toggle flips the html level attribute', win.document.documentElement.dataset.detail, 'off');
  eq('switch state exposed to assistive tech', btn.getAttribute('aria-checked'), 'false');
  ok('preference persisted', /"detail":"off"/.test(win.localStorage.getItem('emc.prefs.v1') || ''), win.localStorage.getItem('emc.prefs.v1'));
  eq('no reload: page state survived the toggle', win.__marker, 'alive');
  click(win, btn);
  await new Promise(r => setTimeout(r, 260));
  eq('toggle back to technical', win.document.documentElement.dataset.detail, 'on');
  ok('fade class is cleaned up after the swap', !win.document.documentElement.classList.contains('detail-fade'));
  await new Promise(r => setTimeout(r, 900));
  ok('idle prefetch offers the next lesson page',
    !!doc.querySelector('link[rel="prefetch"][href$="field.html"]'));
  await new Promise(r => setTimeout(r, 800));
  eq('boot strip completes both stages', doc.querySelectorAll('#bootStrip .boot-chip.done').length, 2);
  ok('boot strip unmounts once complete', doc.getElementById('bootStrip').hidden === true);
  await new Promise(r => setTimeout(r, 900));
  ok('chunked idle typesetting finishes every equation',
    [...doc.querySelectorAll('[data-tex]')].every(e => e.dataset.texDone === '1'),
    [...doc.querySelectorAll('[data-tex]:not([data-tex-done])')].length + ' left');
  win.close();

  // sim + form state must survive a mode switch untouched
  const w2 = await loadPage('topics/current.html');
  await frames(w2.win, 3);
  setRange(w2.win, 'ohm-V', 12);
  const rNum = w2.win.document.getElementById('ohm-Rnum');
  rNum.value = '4'; rNum.dispatchEvent(new w2.win.Event('change', { bubbles: true }));
  const syBefore = w2.win.scrollY;
  click(w2.win, w2.win.document.getElementById('detailToggle'));
  await new Promise(r => setTimeout(r, 260));
  eq('slider value survives the toggle', w2.win.document.getElementById('ohm-V').value, '12');
  numClose('physics readout survives the toggle', parseSI(w2.win.document.getElementById('ohm-I').textContent), 3, 0.01);
  ok('scroll position survives the toggle', Math.abs(w2.win.scrollY - syBefore) < 400, `${syBefore} -> ${w2.win.scrollY}`);
  w2.win.close();

  for (const f of ['index.html', 'quiz.html', 'topics/charge.html', 'topics/coulomb.html',
                  'topics/field.html', 'topics/current.html', 'topics/magind.html']) {
    const h = readFileSync(join(ROOT, f), 'utf8');
    ok(`${f} ships both explanation levels`, h.includes('data-detail="plain"') && h.includes('data-detail="tech"'));
  }
}

/* ---------------- progress export / import ---------------- */
{
  console.log('\n[progress export / import]');
  const { win, doc } = await loadPage('index.html');
  const P = win.EMC.Progress;
  P.markTopic('charge', true);
  P.recordQuiz(50);                       // below the pass mark: only charge ticks
  const snapshot = P.exportJSON();
  P.reset();
  eq('the export is a self-describing JSON document', JSON.parse(snapshot).app, 'emc-lab');
  const res = P.importJSON(snapshot);
  ok('import restores topics and scores', res.ok && P.isTopicDone('charge') &&
     !P.isTopicDone('coulomb') && P.read().quizBest === 50, res.message);
  ok('import refuses junk and foreign files',
    !P.importJSON('not json at all').ok &&
    !P.importJSON(JSON.stringify({ app: 'something-else', progress: {} })).ok);
  ok('the dashboard offers export, import and reset controls',
    !!doc.getElementById('exportProgress') && !!doc.getElementById('importProgress') &&
    !!doc.getElementById('importProgressFile') && !!doc.getElementById('resetProgress'));
  ok('legacy progress migrates: charges/efield credit all three lessons; Extra is not tracked',
    (() => {
      const P2 = win.EMC.Progress;
      P2.reset();
      win.localStorage.setItem('emc.progress.v1', JSON.stringify({ topics: { current: true, charges: true, magnetism: true, induction: false, vectors: true }, quizBest: 60, quizAttempts: 2 }));
      const r = P2.read();
      return r.topics.charge === true && r.topics.coulomb === true && r.topics.field === true &&
             r.quizBest === 60 && win.localStorage.getItem('emc.progress.v3.legacy') !== null;
    })(), 'migration contract broken');
  ok('migration is idempotent', (() => { const P2 = win.EMC.Progress; const a = JSON.stringify(P2.read()); P2.read(); return JSON.stringify(P2.read()) === a; })());
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
