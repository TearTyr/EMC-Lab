#!/usr/bin/env node
/* Physics gate: recomputes every lecture value and checks the quiz bank, the
   constants and the force softening against them. Run: npm run check:physics */
import fs from 'node:fs';
import vm from 'node:vm';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let failed = 0;
const ok = (name, pass, detail = '') => { if (!pass) failed++; console.log(`${pass ? '✅' : '❌'} ${name}${detail ? '  ' + detail : ''}`); };

/* --- constants the site uses ------------------------------------------- */
const common = read('js/common.js');
const K = +common.match(/\bK:\s*([\d.e+-]+)/)[1];
const E = +common.match(/\bE:\s*([\d.e+-]+)/)[1];
const ME = +common.match(/M_ELECTRON:\s*([\d.e+-]+)/)[1];
ok('k = 8.99×10⁹ N·m²/C² (lecture value)', K === 8.99e9, `got ${K}`);
ok('e = 1.602×10⁻¹⁹ C', Math.abs(E - 1.602e-19) / 1.602e-19 < 1e-3, `got ${E}`);

/* --- lecture reference values (independent of the sims) ---------------- */
const rad = Math.PI / 180, F = (a, b, r) => K * Math.abs(a * b) / (r * r);
const ex1 = F(3e-6, 7e-6, .15) - F(3e-6, 4e-6, .20);
const fx2 = F(4e-6, 6e-6, .15) * Math.cos(73 * rad) + F(4e-6, 5e-6, .10);
const fy2 = F(4e-6, 6e-6, .15) * Math.sin(73 * rad);
const ex2 = Math.hypot(fx2, fy2), ang2 = Math.atan2(fy2, fx2) / rad;
const e1 = K * 4e-6 / .49, eP = 2 * e1 * Math.sin(31 * rad);
const bohr = Math.sqrt(K * E * E / (ME * 5.29e-11));
const ref = {
  '1 C of electrons': [1 / E, 6.24e18], '±1 C at 1 km': [F(1, 1, 1000), 8.99e3],
  'Example 1 net force': [ex1, 5.69], 'Example 2 net force': [ex2, 22.7], 'Example 2 angle (°)': [ang2, 24],
  'E at P': [eP, 75595], 'Bohr speed': [bohr, 2.19e6], 'F on +18e-8 C': [18e-8 * 2, 3.6e-7], 'F on −24e-8 C': [24e-8 * 2, 4.8e-7]
};
for (const [n, [got, want]] of Object.entries(ref)) ok(n, Math.abs(got - want) / want < 0.01, `${got.toPrecision(5)} vs ${want}`);

/* --- sandbox softening must not distort lecture-scale readouts --------- */
const sm = +read('js/sandbox-core.js').match(/SOFT_MAX\s*=\s*([\d.e+-]+)/)[1];
const worst = 1 - (0.10 ** 2) / (0.10 ** 2 + sm * sm);       // error at the smallest lecture distance
ok('force softening < 0.1% at r = 0.10 m', worst < 1e-3, `SOFT_MAX = ${sm} m → ${(worst * 100).toFixed(4)}%`);

/* --- quiz bank: the marked answer must equal the recomputed value ------ */
const win = {}; vm.runInNewContext(read('js/quiz-data.js'), { window: win });
const bank = win.EMC_QUIZ;
ok('quiz has 16 questions, 4 options each', bank.length === 16 && bank.every(q => q.options.length === 4));
const num = s => {
  const t = s.replace(/<sup>(.*?)<\/sup>/g, '^($1)').replace(/\u2212/g, '-').replace(/,/g, '');
  const m = t.match(/(-?\d+\.?\d*)\s*×\s*10\^\((-?\d+)\)/);
  return m ? +m[1] * 10 ** +m[2] : +t.match(/-?\d+\.?\d*/)[0];
};
const want = { 1: 12 / 4, 2: 2 + 3 + 5, 3: 1 / (1 / 6 + 1 / 3), 5: 2 * 2 * 10, 6: 12 - 12 / 6, 7: 12 * 4 / 12,
  8: 2 * 3 * .15, 9: 1 / E, 11: F(1, 1, 1000), 12: ex1, 13: ex2, 14: bohr, 15: eP, 16: 18e-8 * 2 };
for (const q of bank) {
  if (!(q.id in want)) continue;
  const got = num(q.options[q.answer]);
  ok(`quiz #${q.id} marked answer`, Math.abs(got - want[q.id]) / want[q.id] < 0.005, `${q.options[q.answer].replace(/<[^>]+>/g, '')} vs ${want[q.id].toPrecision(4)}`);
}
console.log('ℹ  #4 and #10 are conceptual (no number to recompute) — reviewed by hand.');

/* --- wording that must not come back ----------------------------------- */
const pages = ['index.html', 'quiz.html', 'topics/current.html', 'topics/fields.html'].map(f => [f, read(f)]);
for (const bad of [/7\.55\s*×\s*10/, /centrifugal/i, /charge ledger/i, /magnet/i, /Chapters? 3\b|Chapters 1 and 3/, /Chapter \d of 3\b|of 3 chapters/, /Twenty-four|\b24 questions|24-question/]) {
  const hit = pages.filter(([, t]) => bad.test(t)).map(([f]) => f);
  ok(`no ${bad} in pages`, !hit.length, hit.join(', '));
}

/* the same wrong values must not live in the scripts either (toasts, comments, readouts) */
for (const f of fs.readdirSync(new URL('../js/', import.meta.url)).filter(n => n.endsWith('.js'))) {
  ok(`no 7.55×10⁴ in js/${f}`, !/7\.55\s*(×|\\u00D7)\s*10|7\.55×10⁴/.test(read('js/' + f)));
}

console.log(failed ? `\nPHYSICS CHECK FAILED (${failed})` : '\nPHYSICS CHECK PASS');
process.exit(failed ? 1 : 0);
