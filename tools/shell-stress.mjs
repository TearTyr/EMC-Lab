/* Shell stress harness (jsdom, dev-only): same-page topic switching under fire.
   Run: node tools/shell-stress.mjs
   Boots index.html twice (normal + forced prefers-reduced-motion), performs a
   calm baseline switch to #/current, then 50 rapid hash switches with no
   settling time, and asserts EMC.stats() returns to the baseline (stages and
   listeners), animation chains stay capped at 2, the mounted section stays
   coherent and no page errors fire. Network is stubbed from the local files;
   canvas 2d is stubbed because jsdom ships no rasteriser. */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const names = ['current', 'efield', 'magind'];
const sims = ['ohm', 'circuit', 'coulomb', 'efield', 'lorentz', 'induction'];
const files = {};
for (const n of names) files['topics/' + n + '.html'] = read('topics/' + n + '.html');
for (const s of sims) files['js/sim-' + s + '.js'] = read('js/sim-' + s + '.js');
const tick = ms => new Promise(r => setTimeout(r, ms));
const chains = w => w.EMC.debugStages().filter(s => s.raf && s.running && s.animate).length;

async function boot(reduce) {
  const dom = new JSDOM(read('index.html'), { url: 'https://x/index.html', pretendToBeVisual: true, runScripts: 'dangerously' });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({}, { get: (t, k) => (k === 'canvas' ? null : () => {}), set: () => true });
  };
  if (reduce) {
    w.matchMedia = q => ({ matches: /reduced-motion/.test(q), media: q, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
  }
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.message)));
  w.addEventListener('unhandledrejection', e => errs.push('rejection: ' + String((e.reason && e.reason.message) || e.reason)));
  w.fetch = url => {
    const u = String(url).replace('https://x/', '');
    const t = files[u];
    return Promise.resolve(t === undefined ? { ok: false, status: 404 } : { ok: true, status: 200, text: () => Promise.resolve(t) });
  };
  for (const f of ['js/registry.js', 'js/quiz-data.js', 'js/common.js', 'js/home.js', 'js/shell.js']) w.eval(read(f));
  await tick(350);
  return { w, errs };
}

let fails = 0;
const ok = (n, c, x = '') => { if (!c) { fails++; console.log('FAIL', n, x); } else console.log('ok  ', n); };

for (const reduce of [false, true]) {
  const { w, errs } = await boot(reduce);
  w.location.hash = '#/current'; await tick(400);          // calm baseline
  const base = w.EMC.stats();
  const baseChains = chains(w);
  const seq = ['efield', 'magind', 'current', 'home'];
  for (let i = 0; i < 50; i++) w.location.hash = seq[i % 4] === 'home' ? '#/' : '#/' + seq[i % 4];
  await tick(1200);
  w.location.hash = '#/current'; await tick(600);
  const st = w.EMC.stats();
  const tag = reduce ? '[reduce] ' : '[motion] ';
  ok(tag + '50 switches: stages back to baseline', st.stages === base.stages, JSON.stringify(st) + ' vs ' + JSON.stringify(base));
  ok(tag + '50 switches: listeners back to baseline', st.listeners === base.listeners, JSON.stringify(st) + ' vs ' + JSON.stringify(base));
  ok(tag + '50 switches: chains capped at 2', chains(w) === Math.min(baseChains, 2), 'chains=' + chains(w));
  ok(tag + '50 switches: no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  ok(tag + 'topic section coherent', w.document.getElementById('shell-topic').hidden === false &&
    /Ohm/.test(w.document.getElementById('shell-topic-body').textContent));
  if (reduce) ok('[reduce] no stage animates', w.EMC.debugStages().every(s => s.animate === false));
  w.close();
}
console.log(fails === 0 ? 'SHELL STRESS PASS' : fails + ' FAILURES');
process.exit(fails === 0 ? 0 : 1);
