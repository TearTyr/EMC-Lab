#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — cross-browser core-flow matrix (gate B, brief R9).
   Run: node tools/browser-matrix.mjs
   Runs the SAME core flows on every available engine:
     chromium (Chrome), firefox, and chromium with channel 'msedge' (Edge).
   Flows: home boots with derived counts -> both chapters mount ->
   circuit builder controls move real readouts -> quiz answers + submits +
   scores 100% -> Detail toggle agrees across attr/aria/label/content.
   A browser that cannot launch is reported UNTESTED, never assumed (R9).
   Exits 1 if any launched browser fails a flow or logs a page error.
   ========================================================================== */
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium, firefox } from 'playwright';
import { skipIntroOnLoad } from './intro-bypass.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
await new Promise(r => server.listen(8259, '127.0.0.1', r));
const B = 'http://127.0.0.1:8259';

const ENGINES = [
  { name: 'Chrome (chromium 156)', launch: () => chromium.launch({ args: ['--disable-dev-shm-usage'] }) },
  { name: 'Firefox (playwright)', launch: () => firefox.launch({ args: [] }) },
  { name: 'Edge (msedge channel)', launch: () => chromium.launch({ channel: 'msedge', args: ['--disable-dev-shm-usage'] }) }
];

let anyRun = false, allPass = true;
const summary = [];

for (const eng of ENGINES) {
  let browser;
  try { browser = await eng.launch(); }
  catch (e) {
    console.log(`UNTESTED  ${eng.name}: could not launch (${String(e).split('\n')[0].slice(0, 90)})`);
    summary.push([eng.name, 'UNTESTED', '']);
    continue;
  }
  anyRun = true;
  let fails = 0;
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(skipIntroOnLoad);
  pg.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120)); });
  const ok = (name, cond, extra = '') => {
    if (!cond) { fails++; console.log(`FAIL [${eng.name}] ${name}`, extra); }
    else console.log(`ok   [${eng.name}] ${name}`, extra ? '— ' + extra : '');
  };

  /* --- home --- */
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const home = await pg.evaluate(() => ({
    emc: typeof window.EMC !== 'undefined',
    stats: [document.getElementById('statChapters').textContent,
            document.getElementById('statSims').textContent,
            document.getElementById('statQuestions').textContent].join('|'),
    overlay: !!document.getElementById('bootOverlay')
  }));
  ok('home boots with derived counts 2|6|16', home.emc && home.stats === '2|6|16', home.stats);
  ok('no boot overlay lingering', home.overlay === false);

  /* --- both chapters mount via the shell --- */
  for (const [route, want] of [['#/ch1', 'Circuits'], ['#/ch2', 'Electric Fields']]) {
    await pg.evaluate(r => { location.hash = r; }, route);
    await pg.waitForTimeout(1300);
    const st = await pg.evaluate(() => ({
      mounted: !document.getElementById('shell-topic').hidden,
      h1: (document.querySelector('#shell-topic h1') || {}).textContent || ''
    }));
    ok(`chapter ${route} mounts`, st.mounted && st.h1.includes(want), st.h1.slice(0, 40));
  }

  /* --- removed routes must fall back to home, never show an old chapter --- */
  for (const route of ['#/ch3', '#/magind']) {
    await pg.goto(B + '/index.html' + route, { waitUntil: 'load' });
    await pg.waitForTimeout(1300);
    const st = await pg.evaluate(() => ({ topicHidden: document.getElementById('shell-topic').hidden, stale: /magnet|lorentz|faraday/i.test(document.body.innerText) }));
    ok(`old route ${route} falls back to home`, st.topicHidden === true && st.stale === false);
  }

  /* --- circuit builder: placing a part moves real readouts --- */
  await pg.evaluate(() => { location.hash = '#/ch1'; });
  await pg.waitForTimeout(1300);
  await pg.evaluate(() => document.getElementById('sim-circuit').scrollIntoView());
  await pg.waitForTimeout(400);
  const c0 = await pg.evaluate(() => document.getElementById('circ-R').textContent);
  await pg.evaluate(() => {
    document.querySelector('[data-circ-part="res"]').click();
    document.getElementById('circ-sk3').click();
  });
  await pg.waitForTimeout(300);
  const c1 = await pg.evaluate(() => ({
    R: document.getElementById('circ-R').textContent,
    I: document.getElementById('circ-I').textContent
  }));
  ok('circuit builder placement changes the computed loop R and I',
    c1.R !== c0 && /A/.test(c1.I), c0 + ' -> ' + JSON.stringify(c1));
  await pg.evaluate(() => document.getElementById('circ-sk0').click());
  await pg.waitForTimeout(300);
  const bat = await pg.evaluate(() => document.getElementById('circ-I').textContent);
  ok('removing the battery zeroes the current honestly', /0/.test(bat), bat);

  /* --- quiz: answer all, submit twice, 100% --- */
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const n = await pg.evaluate(() => {
    let k = 0;
    document.querySelectorAll('.q-card').forEach(card => {
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      const opt = card.querySelector(`.opt[data-opt="${q.answer}"]`);
      if (opt) { opt.click(); k++; }
    });
    return k;
  });
  ok('quiz: all 16 answered by real clicks', n === 16, String(n));
  await pg.evaluate(() => document.getElementById('quiz-submit').scrollIntoView());
  await pg.evaluate(() => document.getElementById('quiz-submit').click());
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById('quiz-submit').click());
  await pg.waitForTimeout(1500);
  const score = await pg.evaluate(() => document.getElementById('quiz-score').textContent.slice(0, 40));
  ok('quiz submits and scores 100%', /100%/.test(score), score.replace(/\s+/g, ' '));
  const charts = await pg.evaluate(() => document.querySelectorAll('canvas').length);
  ok('Chart.js canvas renders after submitting', charts > 0, String(charts));

  /* --- Detail toggle --- */
  const dt = await pg.evaluate(() => {
    const b = document.getElementById('detailToggle');
    b.click();
    return new Promise(res => setTimeout(() => res({
      attr: document.documentElement.dataset.detail,
      pressed: b.getAttribute('aria-pressed'),
      label: b.querySelector('.dt-state').textContent,
      techHidden: [...document.querySelectorAll('[data-detail="tech"]')].every(e => getComputedStyle(e).display === 'none')
    }), 350));
  });
  ok('Detail toggle: attr + aria-pressed + label + content agree',
    dt.attr === 'off' && dt.pressed === 'false' && dt.label === 'OFF' && dt.techHidden, JSON.stringify(dt));

  ok('no page/console errors in the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
  const version = browser.version();
  await browser.close();
  summary.push([`${eng.name} ${version}`, fails === 0 ? 'PASS' : `${fails} FAIL`, '']);
  if (fails !== 0) allPass = false;
}

console.log('\n--- gate B matrix ---');
for (const [name, result] of summary) console.log(`  ${result.padEnd(8)} ${name}`);
if (!anyRun) { console.log('NO BROWSER COULD RUN — gate B is UNTESTED, not passed'); process.exit(1); }
console.log(allPass ? 'BROWSER MATRIX PASS' : 'BROWSER MATRIX FAILURES');
await server.close();
process.exit(allPass ? 0 : 1);
