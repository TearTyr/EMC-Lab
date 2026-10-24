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
  ok('keyboard: "2" answers the active card', before === '0/24' && after === '1/24', `${before} -> ${after}`);
  await pg.keyboard.press('f');                     // flag it
  await pg.waitForTimeout(250);
  const flagged = await pg.evaluate(() => document.querySelectorAll('.q-card.flagged').length);
  ok('keyboard: "f" flags the active card for review', flagged === 1, String(flagged));
  await pg.keyboard.press('n');                     // jump to next blank
  await pg.waitForTimeout(400);
  await pg.keyboard.press('3');
  await pg.waitForTimeout(250);
  ok('keyboard: "n" + number answers the next blank', (await pg.textContent('#pillText')) === '2/24', await pg.textContent('#pillText'));
  /* the guard: with focus on a link (A) or input, shortcuts must NOT fire */
  const guard = await pg.evaluate(() => {
    document.querySelector('a.nav-link').focus();
    const ev = new KeyboardEvent('keydown', { key: '4', bubbles: true });
    document.activeElement.dispatchEvent(ev);
    return document.getElementById('pillText').textContent;
  });
  await pg.waitForTimeout(200);
  ok('keyboard: shortcuts are ignored while focus is in nav/inputs', guard === '2/24', guard);
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
  ok('all 24 answered through real clicks', n === 24, String(n));
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
  ok('retake clears every mark and the pill', cleared.marks === 0 && cleared.pill === '0/24', JSON.stringify(cleared));
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
  ok('resume restores both answers', (await pg.textContent('#pillText')) === '2/24', await pg.textContent('#pillText'));
  await ctx.close();
}

/* ---- deep links + URL sync ------------------------------------------------ */
{
  const { ctx, pg } = await page({}, '/quiz.html?topic=ch1');
  const cards = await pg.evaluate(() => document.querySelectorAll('.q-card').length);
  ok('?topic=ch1 deep link filters to the 8 circuits questions', cards === 8, String(cards));
  await pg.click('[data-quiz-filter="ch3"]');
  await pg.waitForTimeout(300);
  const url = await pg.evaluate(() => new URL(location.href).searchParams.get('topic'));
  ok('changing the filter keeps ?topic= truthful', url === 'ch3', String(url));
  await ctx.close();
}

console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'QUIZ VERIFICATION PASS' : fails + ' QUIZ FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
