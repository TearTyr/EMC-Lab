#!/usr/bin/env node
/* One-shot curation: 35-question lessons+Extra bank -> the brief's 24
   (8 per chapter). ch2 keeps exactly the questions derived from the lecture
   items (docs/spec/brief-digest.md); three of them are REWRITTEN to the
   lecture's own configurations (BUG_AUDIT DATA-02/DATA-03). The 11 unused
   lesson questions are archived, not deleted.
   Run: node tools/curate-quiz.mjs   (reads js/quiz-data.js, rewrites it) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

globalThis.window = {};
await import(join(ROOT, 'js/quiz-data.js'));
const OLD = window.EMC_QUIZ;
const byId = id => OLD.find(q => q.id === id);

/* --- ch2 rewrites to the lecture configurations (verified by
       docs/spec/verify-checks.mjs: 2.70/8.39/5.69 N, 22.7 N @24°,
       73,388 / 75,595 N/C) --- */
const RW_COLLINEAR = {
  q: 'Lecture line example: q₂ = −4.0 µC at x = 0, q₁ = +3.0 µC at x = 0.20 m, q₃ = −7.0 µC at x = 0.35 m. The net force on q₁ is:',
  options: ['2.70 N toward −x', '8.39 N toward +x',
            '5.69 N toward +x', '11.1 N toward +x'],
  answer: 2,
  explain: 'Both neighbours <b>attract</b> the positive q₁: F₁₂ = k|q₁q₂|/(0.20)² = <b>2.70 N</b> pulls toward −x, F₁₃ = k|q₁q₃|/(0.15)² = <b>8.39 N</b> pulls toward +x. Signs choose directions, so add <i>with signs</i>: 8.39 − 2.70 = <b>5.69 N toward +x</b> — the lecture’s own answer.',
  hint: 'Compute each pull separately, give each a SIGN from its direction, then add.'
};
const RW_2D = {
  q: 'Lecture 2-D example: q₁ = +4.0 µC at the origin; q₂ = −6.0 µC sits 0.15 m away, 73° above the +x axis; q₃ = −5.0 µC sits on the +x axis, 0.10 m away. The net force on q₁ is closest to:',
  options: ['18.0 N along +x', '9.6 N at 73° above +x',
            '22.7 N at ≈24° above +x', '27.6 N straight up'],
  answer: 2,
  explain: 'Two attractions: F₁₂ = k(4.0)(6.0)µ²/(0.15)² = <b>9.6 N</b> toward 73°; F₁₃ = k(4.0)(5.0)µ²/(0.10)² = <b>18.0 N</b> along +x. Components: Fₓ = 9.6·cos 73° + 18.0 = 20.8 N, F_y = 9.6·sin 73° = 9.2 N → |F| = √(20.8² + 9.2²) = <b>22.7 N</b> at tan⁻¹(9.2/20.8) ≈ <b>24° above +x</b>. Forces add as vectors, never as plain numbers.',
  hint: 'Split each pull into x and y, add the components, then rebuild the vector.'
};
const RW_FIELD = {
  q: 'Lecture example: q₊ = +4.00 µC and q₋ = −4.00 µC sit symmetrically about the y-axis, each 0.700 m from point P, the lines from P to the charges making 31.0° with the x-axis. The net electric field at P is closest to:',
  options: ['73,388 N/C along +x', '75,595 N/C along +y (Eₓ = 0)',
            '146,776 N/C along +y', '0 N/C — equal charges cancel'],
  answer: 1,
  explain: 'Each charge contributes E = kq/r² = (8.99×10⁹)(4.00×10⁻⁶)/(0.700)² = <b>73,388 N/C</b>. The x-components are equal and opposite → <b>Eₓ = 0</b>. The y-components add (away from the lower +, toward the upper −): E_y = 2 × 73,388 × sin 31.0° = <b>75,595 N/C along +y</b>.',
  hint: 'Equal distances mean equal magnitudes — symmetry kills one component entirely.'
};

/* ch2 selection, in teaching order: charge → Coulomb → field.
   Each traces to a lecture line in docs/spec/brief-digest.md. */
const CH2_PICK = [3, 5, 9, 11, 8, 10, 15, 16];
const REWRITES = { 11: RW_COLLINEAR, 8: RW_2D, 15: RW_FIELD };

const clean = q => {
  const c = Object.assign({}, q);
  c.label = String(c.label).replace(' (Extra)', '');
  return c;
};

const ch1 = OLD.filter(q => q.topic === 'current').map(clean);
const ch3 = OLD.filter(q => q.topic === 'magind').map(clean);
const ch2 = CH2_PICK.map(id => {
  const c = clean(byId(id));
  c.topic = 'ch2';
  if (REWRITES[id]) Object.assign(c, REWRITES[id]);
  return c;
});
if (ch1.length !== 8 || ch3.length !== 8) throw new Error('chapter counts changed: ' + ch1.length + '/' + ch3.length);

const bank = [];
let id = 1;
for (const q of [...ch1, ...ch2, ...ch3]) { q.id = id++; q.topic = q.topic === 'ch2' ? 'ch2' : (bank.length < 8 ? 'ch1' : (bank.length < 16 ? 'ch2' : 'ch3')); bank.push(q); }
/* topic fix: ch1/ch3 kept their old topic value through clean(); set properly */
bank.forEach((q, i) => { q.topic = i < 8 ? 'ch1' : i < 16 ? 'ch2' : 'ch3'; });

/* archive the 11 unselected lesson questions (original ids kept) */
const archived = OLD.filter(q => ['charge', 'coulomb', 'field'].includes(q.topic) && !CH2_PICK.includes(q.id));
writeFileSync(join(ROOT, 'archive/js/quiz-data-ch2-extras.js'),
`/* Archived during the 24-question curation (brief: exactly 8 per chapter).
   These 11 lesson questions are scientifically sound but exceed the ch2 quota;
   kept recoverable, original ids preserved. See BUG_AUDIT.md SCOPE-01. */
window.EMC_QUIZ_CH2_EXTRAS = ${JSON.stringify(archived, null, 2)};
`);

const fmt = q => {
  const j = s => JSON.stringify(s);
  return `  {
    id: ${q.id}, topic: '${q.topic}', label: ${j(q.label)}, level: '${q.level}',
    q: ${j(q.q)},
    options: [${q.options.map(j).join(',\n              ')}],
    answer: ${q.answer},
    explain: ${j(q.explain)},
    hint: ${j(q.hint)}
  }`;
};
writeFileSync(join(ROOT, 'js/quiz-data.js'),
`/* Quiz bank: 24 multiple-choice questions — exactly 8 per chapter — with
   worked explanations and hints.
   Schema: { id, topic, label, level ('easy'|'full'), q, options[4], answer
   (0-based), explain, hint }.
   Coverage: ch1 Circuits & Ohm's law 8 · ch2 Electric fields & Coulomb's law 8
   · ch3 Magnetism & induction 8. Every ch2 question derives from a lecture
   item (docs/spec/brief-digest.md §1.2); the three worked-example questions
   use the lecture's own configurations and were independently recomputed
   (docs/spec/verify-checks.mjs). Displayed totals are derived from
   BANK.length, never hand-maintained. k = 8.99×10⁹ N·m²/C² everywhere —
   the lecture's value, computed AND printed (BUG_AUDIT DATA-01).
   Questions beyond the ch2 quota live in archive/js/quiz-data-ch2-extras.js. */
window.EMC_QUIZ = [

  /* ================= Chapter 1 — Circuits & Ohm's law ================= */
${bank.slice(0, 8).map(fmt).join(',\n')},

  /* ============ Chapter 2 — Electric fields & Coulomb's law ============ */
${bank.slice(8, 16).map(fmt).join(',\n')},

  /* ============== Chapter 3 — Magnetism & induction ============== */
${bank.slice(16, 24).map(fmt).join(',\n')}
];
`);

/* verify the written bank */
globalThis.window = {};
const check = readFileSync(join(ROOT, 'js/quiz-data.js'), 'utf8');
eval(check);
const B = globalThis.window.EMC_QUIZ;
const per = {};
B.forEach(q => per[q.topic] = (per[q.topic] || 0) + 1);
console.log('bank:', B.length, JSON.stringify(per));
console.log('ids unique:', new Set(B.map(q => q.id)).size === B.length);
console.log('answers valid:', B.every(q => q.answer >= 0 && q.answer < q.options.length && q.options.length === 4));
console.log('archived:', archived.length, 'ids', archived.map(q => q.id).join(','));
console.log('no "Extra" labels:', B.every(q => !/extra/i.test(q.label)));
if (B.length !== 24 || per.ch1 !== 8 || per.ch2 !== 8 || per.ch3 !== 8) process.exit(1);
