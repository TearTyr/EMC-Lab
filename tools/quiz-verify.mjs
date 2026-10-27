#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — quiz engine verification in a REAL browser (gate Q, §3.5).
   Run: node tools/quiz-verify.mjs
   Covers what jsdom cannot: real keyboard flow (and its input guard), the
   floating timer while scrolling at 360 px (no overlap with answers or nav),
   Chart.js actually painting pixels, autosave -> reload -> resume, retake,
   deep links and URL sync, dual submit buttons.
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
await new Promise(r => server.listen(8254, '127.0.0.1', r));
const B = 'http://127.0.0.1:8254';

let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errors = [];
async function page(opts = {}, url = '/quiz.html') {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  return { ctx, pg };
}

/* ---- keyboard flow + input guard ---------------------------------------- */
{
  const { ctx, pg } = await page();
  await pg.locator('.q-card').first().scrollIntoViewIfNeeded();
  await pg.waitForTimeout(400);
  const before = await pg.textContent('#pillText');
  await pg.keyboard.press('2');                     // answer option B of the active card
  await pg.waitForTimeout(300);
  const after = await pg.textContent('#pillText');
  ok('keyboard: "2" answers the active card', before === '0/16' && after === '1/16', `${before} -> ${after}`);
  await pg.keyboard.press('f');                     // flag it
  await pg.waitForTimeout(250);
  const flagged = await pg.evaluate(() => document.querySelectorAll('.q-card.flagged').length);
  ok('keyboard: "f" flags the active card for review', flagged === 1, String(flagged));
  await pg.keyboard.press('n');                     // jump to next blank
  await pg.waitForTimeout(400);
  await pg.keyboard.press('3');
  await pg.waitForTimeout(250);
  ok('keyboard: "n" + number answers the next blank', (await pg.textContent('#pillText')) === '2/16', await pg.textContent('#pillText'));
  /* the guard: with focus on a link (A) or input, shortcuts must NOT fire */
  const guard = await pg.evaluate(() => {
    document.querySelector('a.nav-link').focus();
    const ev = new KeyboardEvent('keydown', { key: '4', bubbles: true });
    document.activeElement.dispatchEvent(ev);
    return document.getElementById('pillText').textContent;
  });
  await pg.waitForTimeout(200);
  ok('keyboard: shortcuts are ignored while focus is in nav/inputs', guard === '2/16', guard);
  await ctx.close();
}

/* ---- grading, dual submit, Chart.js really paints ------------------------ */
{
  const { ctx, pg } = await page();
  /* answer every question correctly through the real option buttons */
  await pg.evaluate(() => {
    document.querySelectorAll('.q-card').forEach(card => {
      const right = card.querySelector('.opt.correct-hint');
      void right;
    });
  });
  const n = await pg.evaluate(() => {
    // the bank is on window; click each card's correct option like a user would
    let count = 0;
    document.querySelectorAll('.q-card').forEach(card => {
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      const opt = card.querySelector(`.opt[data-opt="${q.answer}"]`);
      if (opt) { opt.click(); count++; }
    });
    return count;
  });
  ok('all 16 answered through real clicks', n === 16, String(n));
  const submits = await pg.evaluate(() => [...document.querySelectorAll('button')]
    .filter(b => /submit/i.test(b.textContent) || b.id.includes('submit')).map(b => b.id || b.textContent.trim()));
  ok('submit exists near top and bottom (dual submit)', submits.length >= 2, submits.join(' | '));
  await pg.evaluate(() => document.getElementById('quiz-submit').scrollIntoView());
  await pg.click('#quiz-submit');                   // confirm phase
  await pg.waitForTimeout(200);
  const confirmTxt = await pg.textContent('#quiz-submit');
  await pg.click('#quiz-submit');                   // graded
  await pg.waitForTimeout(1200);
  ok('first submit asks for confirmation, second grades', /confirm/i.test(confirmTxt));
  const score = await pg.textContent('#quiz-score');
  ok('perfect score shows 100%', /100%/.test(score), score.slice(0, 60).replace(/\s+/g, ' '));
  const painted = await pg.evaluate(() => new Promise(res => setTimeout(() => {
    const c = document.getElementById('chart-score');
    if (!c || !c.width) return res(false);
    const ctx2 = c.getContext('2d');
    const d = ctx2.getImageData(0, 0, c.width, c.height).data;
    let nonBlank = 0;
    for (let i = 3; i < d.length; i += 40) if (d[i] !== 0) nonBlank++;
    res(nonBlank > 50);
  }, 600)));
  ok('Chart.js (R8) really paints pixels into the score canvas', painted === true);
  const chartsVisible = await pg.evaluate(() => !document.getElementById('quiz-charts').hidden &&
    document.getElementById('quiz-fallback-bars').hidden);
  ok('charts replace the CSS-bar fallback once the lib is live', chartsVisible);
  /* retake clears the marks */
  await pg.click('#quiz-retake');
  await pg.waitForTimeout(400);
  const cleared = await pg.evaluate(() => ({
    marks: document.querySelectorAll('.q-card.answered-correct').length,
    pill: document.getElementById('pillText').textContent
  }));
  ok('retake clears every mark and the pill', cleared.marks === 0 && cleared.pill === '0/16', JSON.stringify(cleared));
  await ctx.close();
}

/* ---- floating timer: visible while scrolling, no overlap at 360 px ------- */
{
  const { ctx, pg } = await page({ viewport: { width: 360, height: 740 } }, '/quiz.html');
  await pg.click('#quiz-timer-mode [data-value="up"]');
  await pg.evaluate(() => {
    const card = document.querySelector('.q-card');
    const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
    card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
  });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pg.waitForTimeout(500);
  /* Contract: the docked bar owns an opaque bottom strip and the list
     reserves matching padding, so at any settled scroll position (worst
     case: the very bottom) no answer option intersects the timer, and the
     timer never intersects the header. Transient pass-under while scrolling
     is the same accepted behaviour as the site's sticky header. */
  const boxes = await pg.evaluate(() => {
    const ft = document.getElementById('floatTimer');
    const r = ft.getBoundingClientRect();
    let overlaps = 0;
    document.querySelectorAll('.opt').forEach(o => {
      const b = o.getBoundingClientRect();
      if (b.width && !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom)) overlaps++;
    });
    const nb = document.querySelector('.site-header').getBoundingClientRect();
    const navOverlap = !(r.right < nb.left || r.left > nb.right || r.bottom < nb.top || r.top > nb.bottom);
    return {
      docked: ft.classList.contains('docked'),
      reserved: document.body.classList.contains('timer-docked'),
      visible: ft.hidden === false && r.width > 0 && r.height > 0,
      inViewport: r.top >= 0 && r.bottom <= window.innerHeight + 1,
      overlaps, navOverlap
    };
  });
  ok('timer stays visible while scrolled and docks on phone widths',
    boxes.visible && boxes.inViewport && boxes.docked && boxes.reserved, JSON.stringify(boxes));
  ok('timer never overlaps answer options or the header at 360 px (settled)',
    boxes.overlaps === 0 && boxes.navOverlap === false, JSON.stringify(boxes));
  /* mid-scroll visibility too */
  await pg.evaluate(() => window.scrollTo(0, 2500));
  await pg.waitForTimeout(300);
  const mid = await pg.evaluate(() => {
    const r = document.getElementById('floatTimer').getBoundingClientRect();
    return r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 1;
  });
  ok('timer still visible mid-scroll', mid === true);
  await ctx.close();
}

/* ---- autosave -> reload -> resume ---------------------------------------- */
{
  const { ctx, pg } = await page();
  await pg.evaluate(() => {
    const cards = document.querySelectorAll('.q-card');
    for (let i = 0; i < 2; i++) {
      const q = window.EMC_QUIZ.find(x => x.id === Number(cards[i].dataset.qid));
      cards[i].querySelector(`.opt[data-opt="${q.answer}"]`).click();
    }
  });
  await pg.waitForTimeout(800);                     // let the 400 ms autosave throttle flush
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(800);
  const banner = await pg.evaluate(() => !document.getElementById('resume-wrap').hidden);
  ok('reload after answering offers an explicit resume', banner === true);
  await pg.click('#resume-yes');
  await pg.waitForTimeout(500);
  ok('resume restores both answers', (await pg.textContent('#pillText')) === '2/16', await pg.textContent('#pillText'));
  await ctx.close();
}

/* ---- deep links + URL sync ------------------------------------------------ */
{
  const { ctx, pg } = await page({}, '/quiz.html?topic=ch1');
  const cards = await pg.evaluate(() => document.querySelectorAll('.q-card').length);
  ok('?topic=ch1 deep link filters to the 8 circuits questions', cards === 8, String(cards));
  await pg.click('[data-quiz-filter="ch2"]');
  await pg.waitForTimeout(300);
  const url = await pg.evaluate(() => new URL(location.href).searchParams.get('topic'));
  ok('changing the filter keeps ?topic= truthful', url === 'ch2', String(url));
  await ctx.close();
}

/* ---- difficulty modes, submit/retake, timer (PR: quiz modes) ------------------ */
const answerCards = (pg, n) => pg.evaluate(count => {
  for (let i = 0; i < count; i++) {          // re-query each time: instant marking re-renders the list
    const card = document.querySelectorAll('.q-card')[i];
    const opt = card && card.querySelector('.opt:not([disabled])');
    if (opt) opt.click();
  }
}, n);
const submitUntilGraded = async pg => {
  for (let i = 0; i < 5; i++) {
    if (await pg.evaluate(() => { const b = document.getElementById('quiz-score'); return !!b && !b.hidden && b.textContent.trim().length > 0; })) return true;
    await pg.locator('#quiz-submit').click({ timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(350);
  }
  return false;
};
const attempts = pg => pg.evaluate(() => EMC.Progress.read().quizAttempts);
const snap = pg => pg.evaluate(() => ({
  cards: document.querySelectorAll('.q-card').length,
  ids: [...document.querySelectorAll('.q-card')].map(c => Number(c.dataset.qid)),
  hints: document.querySelectorAll('.q-hint-btn').length,
  pill: document.getElementById('pillText').textContent,
  submit: document.getElementById('quiz-submit').textContent,
  diff: document.querySelector('#quiz-difficulty [aria-pressed="true"]').dataset.value,
  marking: document.querySelector('#quiz-mode [aria-pressed="true"]').dataset.value,
  timer: document.querySelector('#quiz-timer-mode [aria-pressed="true"]').dataset.value,
  instantDisabled: document.querySelector('#quiz-mode [data-value="instant"]').disabled,
  timerDisabled: [...document.querySelectorAll('#quiz-timer-mode .seg-btn')].every(b => b.disabled),
  hint: document.getElementById('quiz-difficulty-hint').textContent
}));

{
  const { ctx, pg } = await page();
  const mid = await snap(pg);
  ok('modes: Intermediate is the default and behaves as before (16 questions, hints, free marking/timer)',
    mid.diff === 'intermediate' && mid.cards === 16 && mid.hints === 16 && mid.pill === '0/16' && mid.submit === 'Submit quiz (16)' &&
    mid.marking === 'exam' && !mid.instantDisabled && !mid.timerDisabled, JSON.stringify(mid));

  await pg.click('#quiz-difficulty [data-value="easy"]');
  await pg.waitForTimeout(300);
  const easy = await snap(pg);
  /* count per chapter through the chapter filters (ch2 cards carry sub-labels) */
  const easyTopics = {};
  for (const t of ['ch1', 'ch2']) {
    await pg.click(`[data-quiz-filter="${t}"]`);
    easyTopics[t] = await pg.evaluate(() => document.querySelectorAll('.q-card').length);
  }
  await pg.click('[data-quiz-filter="all"]');
  ok('modes: Easy plays 8 questions, 4 per chapter, totals follow (0/8, Submit quiz (8))',
    easy.cards === 8 && easy.pill === '0/8' && easy.submit === 'Submit quiz (8)' &&
    easyTopics.ch1 === 4 && easyTopics.ch2 === 4, JSON.stringify({ easy: easy.cards, easyTopics }));
  ok('modes: Easy keeps hints, marks as you go and has no clock',
    easy.hints === 8 && easy.marking === 'instant' && easy.timer === 'off' && !easy.timerDisabled && /8 starter/.test(easy.hint), JSON.stringify(easy));
  ok('modes: Easy questions are in lecture order and all carry the Easy tag',
    easy.ids.every((v, i, a) => i === 0 || a[i - 1] < v) &&
    (await pg.evaluate(() => [...document.querySelectorAll('.q-card .q-level')].every(t => t.textContent === 'Easy'))));

  await pg.click('#quiz-difficulty [data-value="hard"]');
  await pg.waitForTimeout(300);
  const hard = await snap(pg);
  ok('modes: Hard plays all 16, shuffled, with NO hints',
    hard.cards === 16 && hard.hints === 0 && hard.ids.some((v, i, a) => i > 0 && a[i - 1] > v), JSON.stringify({ n: hard.cards, hints: hard.hints, ids: hard.ids }));
  ok('modes: Hard locks exam marking and a 15-minute countdown (controls disabled, not hidden)',
    hard.marking === 'exam' && hard.instantDisabled && hard.timer === 'down' && hard.timerDisabled &&
    (await pg.evaluate(() => document.querySelector('#timer-mins .active').dataset.mins)) === '15' && /15-minute/.test(hard.hint), JSON.stringify(hard));

  await pg.click('#quiz-difficulty [data-value="intermediate"]');
  await pg.waitForTimeout(300);
  const back = await snap(pg);
  ok('modes: leaving Hard returns hints, free controls and the student\'s own timer (Off)',
    back.cards === 16 && back.hints === 16 && !back.instantDisabled && !back.timerDisabled && back.timer === 'off' && back.marking === 'exam', JSON.stringify(back));

  /* switching mid-attempt is refused and keeps the answers */
  await pg.evaluate(() => document.querySelector('.q-card .opt').click());
  await pg.waitForTimeout(200);
  /* answering auto-collapses the options panel; a student opens it again first */
  if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
  await pg.click('#quiz-difficulty [data-value="easy"]');
  await pg.waitForTimeout(300);
  const refused = await snap(pg);
  ok('modes: changing difficulty mid-attempt is refused and keeps the answer',
    refused.diff === 'intermediate' && refused.cards === 16 && refused.pill === '1/16', JSON.stringify(refused));
  await ctx.close();
}

/* submit: one grading pass from either button; retake resets only the attempt */
{
  const { ctx, pg } = await page();
  await pg.click('#quiz-difficulty [data-value="easy"]');
  await pg.waitForTimeout(250);
  await answerCards(pg, 8);
  await pg.waitForTimeout(250);
  const a0 = await attempts(pg);
  await pg.locator('#quiz-submit').click();                       // top button: asks to confirm
  await pg.waitForTimeout(300);
  const labels = await pg.evaluate(() => [...document.querySelectorAll('[data-quiz-submit]')].map(b => b.textContent));
  ok('submit: top and bottom buttons share one state (both flip to the confirm label)',
    labels.length >= 2 && labels.every(t => /Confirm submission/.test(t)), JSON.stringify(labels));
  await pg.locator('[data-quiz-submit]').last().click();           // bottom button confirms
  await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelectorAll('[data-quiz-submit]').forEach(b => { b.disabled = false; b.click(); b.click(); }));
  await pg.waitForTimeout(400);
  const a1 = await attempts(pg);
  const scoreTxt = await pg.textContent('#quiz-score');
  ok('submit: grading happens exactly once even if both buttons are hammered', a1 === a0 + 1, `attempts ${a0} -> ${a1}`);
  ok('submit: results show the score out of 8 and name the mode', /\/ 8 correct/.test(scoreTxt) && /Easy mode/.test(scoreTxt), scoreTxt.replace(/\s+/g, ' ').slice(0, 90));
  const bestBefore = await pg.evaluate(() => EMC.Progress.read().quizBest);
  ok('submit: Chart.js drew exactly three canvases', (await pg.evaluate(() => document.querySelectorAll('#quiz-score canvas').length)) === 3);

  await pg.click('#quiz-retake');
  await pg.waitForTimeout(600);
  const re = await pg.evaluate(() => ({
    scoreHidden: document.getElementById('quiz-score').hidden,
    pill: document.getElementById('pillText').textContent,
    checked: document.querySelectorAll('.opt[aria-checked="true"]').length,
    flagged: document.querySelectorAll('.q-card.flagged').length,
    timerHidden: document.getElementById('quiz-timer').hidden,
    canvases: document.querySelectorAll('#quiz-score canvas').length,
    submitOn: !document.getElementById('quiz-submit').disabled
  }));
  ok('retake: score, answers, flags, timer and charts are cleared; submit re-enabled',
    re.scoreHidden && re.pill === '0/8' && re.checked === 0 && re.flagged === 0 && re.timerHidden && re.canvases === 0 && re.submitOn, JSON.stringify(re));
  ok('retake: saved attempts/best are untouched', (await attempts(pg)) === a1 && (await pg.evaluate(() => EMC.Progress.read().quizBest)) === bestBefore);
  await answerCards(pg, 8);
  await pg.waitForTimeout(250);
  const graded = await submitUntilGraded(pg);
  await pg.waitForTimeout(500);
  ok('retake: a second attempt grades once with no duplicate charts',
    graded && (await attempts(pg)) === a1 + 1 && (await pg.evaluate(() => document.querySelectorAll('#quiz-score canvas').length)) === 3);
  /* changing difficulty from the results screen starts a clean new attempt */
  if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
  await pg.click('#quiz-difficulty [data-value="hard"]');
  await pg.waitForTimeout(500);
  const fromResults = await snap(pg);
  ok('modes: changing difficulty from the results screen starts a fresh Hard attempt',
    fromResults.diff === 'hard' && fromResults.cards === 16 && fromResults.pill === '0/16' && (await pg.evaluate(() => document.getElementById('quiz-score').hidden)));
  await ctx.close();
}

/* timer: pauses with the tab, and Hard grades itself at 0:00 exactly once */
{
  const { ctx, pg } = await page();
  await pg.click('#quiz-timer-mode [data-value="up"]');
  await pg.evaluate(() => document.querySelector('.q-card .opt').click());
  await pg.waitForTimeout(1300);
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(4000);
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(1500);
  const shown = await pg.textContent('#quiz-timer');
  const secs = shown.split(':').reduce((m, v) => m * 60 + Number(v), 0);
  ok('timer: time spent in a hidden tab is not counted (4 s away, <= 4 s shown)', secs >= 1 && secs <= 4, shown);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.clock.install();
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.clock.runFor(900);
  await pg.click('#quiz-difficulty [data-value="hard"]');
  const a0 = await attempts(pg);
  await pg.evaluate(() => document.querySelector('.q-card .opt').click());
  await pg.clock.runFor(1500);
  const start = await pg.textContent('#quiz-timer');
  ok('timer: Hard starts a 15:00 countdown on the first answer', /^1[45]:\d\d$/.test(start), start);
  await pg.clock.runFor('15:05');
  const done = await pg.evaluate(() => ({ score: !document.getElementById('quiz-score').hidden, submit: document.getElementById('quiz-submit').textContent, timer: document.getElementById('quiz-timer').textContent }));
  ok('timer: at 0:00 the quiz grades itself once; blanks count as incorrect',
    done.score && /submitted/i.test(done.submit) && done.timer === '0:00' && (await attempts(pg)) === a0 + 1, JSON.stringify(done));
  await pg.clock.runFor('01:00');
  ok('timer: no second grading or stray ticks after time-up', (await attempts(pg)) === a0 + 1);
  await ctx.close();
}

/* a saved Hard session resumes as Hard (same order, no hints) */
{
  const { ctx, pg } = await page();
  await pg.click('#quiz-difficulty [data-value="hard"]');
  await pg.waitForTimeout(250);
  const orderBefore = (await snap(pg)).ids;
  await pg.evaluate(() => document.querySelector('.q-card .opt').click());
  await pg.waitForTimeout(700);
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(700);
  await pg.click('#resume-yes');
  await pg.waitForTimeout(500);
  const res = await snap(pg);
  ok('resume: a Hard session comes back as Hard with its shuffle, no hints, locked clock',
    res.diff === 'hard' && res.pill === '1/16' && JSON.stringify(res.ids) === JSON.stringify(orderBefore) && res.hints === 0 && res.timerDisabled, JSON.stringify({ diff: res.diff, pill: res.pill, hints: res.hints }));
  await ctx.close();
}

/* the progress pill and unanswered tools never cover the answers (phone width) */
{
  const { ctx, pg } = await page({ viewport: { width: 390, height: 844 } });
  await pg.evaluate(() => document.querySelector('.q-card .opt').click());
  await pg.locator('.q-card').nth(2).scrollIntoViewIfNeeded();
  await pg.waitForTimeout(500);
  const overlap = await pg.evaluate(() => {
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const pill = document.getElementById('quizPill');
    const pr = pill && !pill.hidden ? pill.getBoundingClientRect() : null;
    if (pr === null) return { pill: false, covered: 0 };
    const covered = [...document.querySelectorAll('.q-card .opt')].filter(o => { const r = o.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && hit(pr, r); }).length;
    return { pill: true, covered };
  });
  ok('unanswered/progress pill does not cover any visible answer option (390 px)', overlap.covered === 0, JSON.stringify(overlap));
  if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
  await pg.click('[data-quiz-filter="unanswered"]');
  await pg.waitForTimeout(300);
  ok('unanswered filter lists exactly the remaining questions', (await pg.evaluate(() => document.querySelectorAll('.q-card').length)) === 15);
  await ctx.close();
}

console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'QUIZ VERIFICATION PASS' : fails + ' QUIZ FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
