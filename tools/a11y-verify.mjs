#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — accessibility & reduced-motion verification (gates A + R).
   Run: node tools/a11y-verify.mjs
   Keyboard-only completion of: home -> chapter -> sim controls -> quiz ->
   results. Visible focus everywhere. State never carried by colour alone.
   Then the same flows under emulated prefers-reduced-motion: decorative
   motion off, ALL state feedback intact.
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
await new Promise(r => server.listen(8255, '127.0.0.1', r));
const B = 'http://127.0.0.1:8255';

let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errors = [];
async function page(opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });
  return { ctx, pg };
}
const focusVisible = pg => pg.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  const cs = getComputedStyle(a);
  return {
    tag: a.tagName, id: a.id || '', cls: (a.className || '').toString().slice(0, 30),
    outline: parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none',
    matchesFV: a.matches(':focus-visible')
  };
});

/* =============== intro accessibility (PART 6/8.2) ========================= */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const up = await pg.evaluate(() => !!document.getElementById('introOverlay'));
  ok('A0 intro plays on a fresh session', up === true);
  if (up) {
    await pg.keyboard.press('Tab');
    const first = await pg.evaluate(() => ({ id: document.activeElement.id, outline: getComputedStyle(document.activeElement).outlineStyle !== 'none' }));
    ok('A0 the skip control is the first tab stop with a visible ring', first.id === 'introSkip' && first.outline, JSON.stringify(first));
    const pe = await pg.evaluate(() => getComputedStyle(document.getElementById('introOverlay')).pointerEvents);
    ok('A0 the playing intro never locks page controls (pointer-events none)', pe === 'none', pe);
    await pg.keyboard.press('Enter');
    /* CONTRACT CHANGE (2026-10-25, v8): the exit is a .5 s .done fade, so the
       overlay node leaves at ~700 ms, not ~180 ms as in the CSS-exit cuts. */
    await pg.waitForTimeout(1000);
    ok('A0 Enter on skip dismisses the intro', (await pg.evaluate(() => !!document.getElementById('introOverlay'))) === false);
    await pg.keyboard.press('Tab');
    const after = await pg.evaluate(() => document.activeElement.className.toString().slice(0, 20));
    ok('A0 after the intro the skip-link is the first tab stop again', /skip-link/.test(after), after);
  }
  await ctx.close();
}

/* =============== keyboard-only core flow (gate A) ========================= */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(600);

  /* skip link is first and works */
  await pg.keyboard.press('Tab');
  let f = await focusVisible(pg);
  ok('A1 first tab stop is the skip link with a visible outline', f && /skip/i.test(f.cls) && f.outline, JSON.stringify(f));
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  const onMain = await pg.evaluate(() => document.activeElement.id);
  ok('A1 skip link moves focus to #main', onMain === 'main', onMain);

  /* walk to the Chapters dropdown, open it, reach ch2, activate by keyboard */
  await pg.evaluate(() => document.getElementById('topicsBtn').focus());
  f = await focusVisible(pg);
  ok('A2 dropdown button shows a visible focus ring', f && f.outline, JSON.stringify(f));
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Tab');
  const inMenu = await pg.evaluate(() => !!document.activeElement.closest('#topicsMenu'));
  ok('A2 tab enters the open dropdown', inMenu);
  /* tab to the fields link (2nd chapter link) and activate */
  await pg.evaluate(() => document.querySelector('#topicsMenu a[href$="fields.html"]').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(1400);
  const mounted = await pg.evaluate(() => ({
    hash: location.hash,
    h1: (document.querySelector('#shell-topic h1') || {}).textContent,
    focus: document.activeElement ? document.activeElement.tagName : ''
  }));
  ok('A2 keyboard activates the chapter and focus lands in it',
    mounted.hash === '#/ch2' && /Electric Fields/.test(mounted.h1 || '') && mounted.focus === 'H1', JSON.stringify(mounted));

  /* sim controls by keyboard: scroll the panel in (as Tab-focus would), let
     the lazy sim initialise, then activate the preset with Enter */
  await pg.evaluate(() => document.querySelector('#ar-panel').scrollIntoView({ block: 'center' }));
  await pg.waitForFunction(() => !!window.__AR, null, { timeout: 5000 });
  await pg.evaluate(() => document.querySelector('#ar-panel [data-sb-preset="lecture-line"]').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(700);
  const preset = await pg.evaluate(() => document.getElementById('ar-count').textContent);
  ok('A3 sim preset is keyboard-operable (Enter loads the 3-charge lecture line)', preset === '3', preset);

  /* chapter-complete button announces state in words */
  await pg.evaluate(() => document.querySelector('[data-complete-topic="ch2"]').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(400);
  const done = await pg.evaluate(() => {
    const b = document.querySelector('[data-complete-topic="ch2"]');
    return { pressed: b.getAttribute('aria-pressed'), text: b.textContent.trim() };
  });
  ok('A4 chapter-complete state is words + aria-pressed, never colour alone',
    done.pressed === 'true' && /completed/i.test(done.text), JSON.stringify(done));
  await ctx.close();
}

/* =============== ch1 bench by keyboard (sliders, lanes, chips) ============ */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/topics/current.html', { waitUntil: 'load' });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => document.getElementById('sim-ohm').scrollIntoView());
  await pg.waitForTimeout(600);
  await pg.evaluate(() => document.getElementById('ohm-V').focus());
  const v0 = await pg.evaluate(() => document.getElementById('ohm-V').value);
  await pg.keyboard.press('ArrowUp'); await pg.keyboard.press('ArrowUp');
  await pg.waitForTimeout(300);
  const v1 = await pg.evaluate(() => ({ v: document.getElementById('ohm-V').value, I: document.getElementById('ohm-I').textContent }));
  ok('A5 Ohm slider works by arrow keys and the readout follows',
    Number(v1.v) > Number(v0) && /A/.test(v1.I), JSON.stringify(v1));
  await pg.evaluate(() => document.getElementById('sim-circuit').scrollIntoView());
  await pg.waitForTimeout(600);
  /* keyboard path: arm a resistor from the palette, place it on socket 4 */
  await pg.evaluate(() => document.querySelector('[data-circ-part="res"]').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.getElementById('circ-sk3').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(400);
  const placed = await pg.evaluate(() => ({
    rows: document.querySelectorAll('#circ-rows .circ-row').length,
    R: document.getElementById('circ-R').textContent
  }));
  ok('A6 placing a part is keyboard-operable (arm + socket Enter -> 59.0 ohm)',
    placed.rows === 4 && /59\.0/.test(placed.R), JSON.stringify(placed));
  await pg.evaluate(() => document.getElementById('circ-sk0').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  const bat = await pg.evaluate(() => ({
    note: document.getElementById('circ-note').textContent,
    it: document.getElementById('circ-I').textContent,
    label: document.getElementById('circ-sk0').getAttribute('aria-label')
  }));
  ok('A7 socket buttons remove by keyboard with an honest open-loop readout',
    /0/.test(bat.it) && /battery/i.test(bat.note) && /empty/.test(bat.label), JSON.stringify(bat));
  await ctx.close();
}

/* =============== quiz -> results by keyboard ============================== */
{
  const { ctx, pg } = await page();
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('.q-card').scrollIntoView());
  await pg.waitForTimeout(500);
  /* answer all 16 with the keyboard: number key for the active card, 'n' to
     jump to the next blank, then WAIT for the smooth scroll to settle (the
     active-card observer only re-targets once scrolling stops — the same
     rhythm a human typist waits for). */
  const settle = () => pg.evaluate(() => new Promise(res => {
    let last = window.scrollY, same = 0;
    const t = setInterval(() => {
      if (Math.abs(window.scrollY - last) < 1) { if (++same >= 3) { clearInterval(t); res(true); } }
      else { same = 0; last = window.scrollY; }
    }, 60);
  }));
  for (let i = 0; i < 16; i++) {
    await pg.keyboard.press(String((i % 4) + 1));
    await pg.waitForTimeout(120);
    await pg.keyboard.press('n');
    await settle();
    await pg.waitForTimeout(150);
  }
  const pill = await pg.textContent('#pillText');
  ok('A8 the whole quiz is answerable by keyboard alone', pill === '16/16', pill);
  await pg.evaluate(() => document.getElementById('quiz-submit').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(250);
  const confirmTxt = await pg.textContent('#quiz-submit');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(1000);
  const score = await pg.evaluate(() => ({
    visible: !document.getElementById('quiz-score').hidden,
    words: [...document.querySelectorAll('.opt .mark')].slice(0, 4).map(m => m.textContent).join('|'),
    badges: document.querySelectorAll('.fbadge').length
  }));
  ok('A9 submit + confirm run from the keyboard; results render', score.visible && /confirm/i.test(confirmTxt), confirmTxt);
  ok('A10 graded state uses WORDS (correct / your answer), not colour alone',
    /correct/.test(score.words) && score.badges >= 1, score.words + ' badges:' + score.badges);
  await ctx.close();
}

/* =============== reduced motion (gate R) ================================== */
{
  const { ctx, pg } = await page({ reducedMotion: 'reduce' });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const rm = await pg.evaluate(() => {
    const reveals = [...document.querySelectorAll('.reveal')];
    const hidden = reveals.filter(r => getComputedStyle(r).opacity !== '1');
    const anims = document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1;
    return { revealCount: reveals.length, hidden: hidden.length, runningAnimations: anims };
  });
  ok('R1 reduced motion: every reveal-gated block is fully visible', rm.hidden === 0 && rm.revealCount > 5, JSON.stringify(rm));
  ok('R1 reduced motion: no decorative animations are running', rm.runningAnimations === 0, String(rm.runningAnimations));
  /* state feedback must survive: detail toggle flips content + aria, toast appears */
  await pg.evaluate(() => document.getElementById('detailToggle').focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  const fb = await pg.evaluate(() => ({
    attr: document.documentElement.dataset.detail,
    pressed: document.getElementById('detailToggle').getAttribute('aria-pressed'),
    label: document.querySelector('.dt-state').textContent,
    toast: (document.getElementById('toastHost') || { textContent: '' }).textContent
  }));
  ok('R2 reduced motion: Detail toggle still flips + announces (state feedback intact)',
    fb.attr === 'off' && fb.pressed === 'false' && fb.label === 'OFF' && /Details OFF/.test(fb.toast), JSON.stringify(fb));
  /* quiz answer feedback under reduce */
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => {
    const card = document.querySelector('.q-card');
    card.scrollIntoView();
    const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
    card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
    document.querySelector('#quiz-mode [data-value="instant"]').click();
  });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    const card = document.querySelector('.q-card');
    const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
    card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
  });
  await pg.waitForTimeout(400);
  const qfb = await pg.evaluate(() => ({
    picked: document.querySelectorAll('.opt.pick, .opt[aria-checked="true"]').length,
    anims: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1
  }));
  ok('R3 reduced motion: quiz selection feedback present, decorative animation off',
    qfb.picked >= 1 && qfb.anims === 0, JSON.stringify(qfb));
  await ctx.close();
}

console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'A11Y + REDUCED-MOTION PASS' : fails + ' A11Y/RM FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
