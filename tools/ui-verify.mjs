#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — shared UI verification: chapter dropdown, active-chapter state,
   Details toggle and the mascot helper.
   Run: node tools/ui-verify.mjs
     1 nav highlight follows the home-page chapter route (not stuck on Home)
     2 dropdown: Esc returns focus, Tab-away closes, arrow keys move, repeated
       picks never double-toggle
     3 Details toggle flips text/aria/attr on every page without resizing text
     4 mascot is its own button (never inside the home link), named, keyboard
       operable; opens a non-modal panel; Esc / outside click / Tab-away close it
     5 panel tips are contextual and shortcuts point at the real tools
     6 mascot reactions: status bubble for quiz + chapter-done, varied, never
       blocks pointer input
     7 mascot works before AND after the intro, after repeated navigation, and
       narrow screens (no horizontal overflow, panel inside the viewport)
     8 zero console/page errors
   Exits 1 on any failure.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';
import { skipIntroOnLoad } from './intro-bypass.mjs';

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
await new Promise(r => server.listen(8263, '127.0.0.1', r));
const B = 'http://127.0.0.1:8263';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
async function open(url, { w = 1280, h = 900, intro = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  if (!intro) await pg.addInitScript(skipIntroOnLoad);
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  return { ctx, pg };
}
const focusId = pg => pg.evaluate(() => document.activeElement.id || document.activeElement.className.toString().slice(0, 20) || document.activeElement.tagName);
const panelOpen = pg => pg.evaluate(() => { const p = document.getElementById('mascotPanel'); return !!p && !p.hidden; });
const dropOpen = pg => pg.evaluate(() => document.getElementById('topicsMenu').classList.contains('open'));

/* 1 + 2: navigation */
{
  const { ctx, pg } = await open('/index.html');
  const current = () => pg.evaluate(() => ({
    links: [...document.querySelectorAll('.nav-link[aria-current], .dd-link[aria-current]')].map(a => a.textContent.trim().slice(0, 14)),
    btn: document.getElementById('topicsBtn').classList.contains('active')
  }));
  let c = await current();
  ok('1 home: Home is current, Chapters button is not', c.links.length === 1 && /Home/.test(c.links[0]) && !c.btn, JSON.stringify(c));
  await pg.click('#topicsBtn');
  await pg.click('#topicsMenu a[href$="fields.html"]');
  await pg.waitForFunction(() => location.hash === '#/ch2');
  await pg.waitForTimeout(500);
  c = await current();
  ok('1 chapter route #/ch2: only Chapter 2 is current and the Chapters button is lit',
    c.links.length === 1 && /2 · Electric/.test(c.links[0]) && c.btn, JSON.stringify(c));
  await pg.click('a.brand');
  await pg.waitForFunction(() => location.hash === '#/' || location.hash === '');
  await pg.waitForTimeout(400);
  c = await current();
  ok('1 back home: highlight returns to Home', c.links.length === 1 && /Home/.test(c.links[0]) && !c.btn, JSON.stringify(c));
  await ctx.close();

  const deep = await open('/index.html#/ch1');
  const dc = await deep.pg.evaluate(() => [...document.querySelectorAll('[aria-current]')].filter(a => a.closest('.nav-menu')).map(a => a.textContent.trim().slice(0, 14)));
  ok('1 deep link #/ch1 highlights Chapter 1 from the first paint', dc.length === 1 && /1 · Circuits/.test(dc[0]), JSON.stringify(dc));
  await deep.ctx.close();
}
{
  const { ctx, pg } = await open('/index.html');
  await pg.click('#topicsBtn');
  await pg.keyboard.press('ArrowDown');
  ok('2 ArrowDown inside the open dropdown focuses the first chapter', /^\s*$/.test('') && (await pg.evaluate(() => document.activeElement.matches('#topicsMenu a'))));
  await pg.keyboard.press('ArrowDown');
  ok('2 ArrowDown moves to the second chapter', await pg.evaluate(() => document.activeElement.getAttribute('href').endsWith('fields.html')));
  await pg.keyboard.press('ArrowUp');
  await pg.keyboard.press('Escape');
  ok('2 Escape from a menu item closes it and returns focus to the Chapters button',
    !(await dropOpen(pg)) && (await focusId(pg)) === 'topicsBtn', await focusId(pg));
  await pg.keyboard.press('ArrowDown');
  ok('2 ArrowDown on the closed Chapters button opens the menu', await dropOpen(pg));
  await pg.keyboard.press('Escape');
  await pg.click('#topicsBtn');
  for (let i = 0; i < 4; i++) await pg.keyboard.press('Tab');
  ok('2 tabbing away from the open dropdown closes it', !(await dropOpen(pg)));
  await pg.keyboard.press('Escape');
  for (let i = 0; i < 4; i++) {
    await pg.click('#topicsBtn');
    await pg.click(`#topicsMenu a[href$="${i % 2 ? 'fields' : 'current'}.html"]`);
    await pg.waitForTimeout(350);
  }
  await pg.click('#topicsBtn');
  const opened = await dropOpen(pg);
  await pg.click('#topicsBtn');
  ok('2 after repeated picks one click still toggles exactly once (no duplicate handlers)', opened && !(await dropOpen(pg)));
  ok('2 repeated navigation leaves a single mascot panel', await pg.evaluate(() => document.querySelectorAll('#mascotPanel').length) === 1);
  await ctx.close();
}

/* 3: Details toggle on every page */
for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
  const { ctx, pg } = await open(url);
  const read = () => pg.evaluate(() => ({
    attr: document.documentElement.dataset.detail,
    pressed: document.getElementById('detailToggle').getAttribute('aria-pressed'),
    label: document.querySelector('.dt-state').textContent,
    size: getComputedStyle(document.body).fontSize,
    lede: (() => { const l = document.querySelector('.lede'); return l ? getComputedStyle(l).fontSize : ''; })(),
    tech: [...document.querySelectorAll('[data-detail=tech]')].filter(e => e.offsetParent).length,
    plain: [...document.querySelectorAll('[data-detail=plain]')].filter(e => e.offsetParent).length
  }));
  const on = await read();
  await pg.click('#detailToggle');
  await pg.waitForTimeout(450);
  const off = await read();
  ok(`3 ${url}: Details flips attribute, aria-pressed, label and visible copy`,
    on.attr === 'on' && off.attr === 'off' && on.pressed === 'true' && off.pressed === 'false' &&
    on.label === 'ON' && off.label === 'OFF' && on.tech > 0 && off.tech === 0 && off.plain > 0 && on.plain === 0,
    JSON.stringify({ on, off }));
  ok(`3 ${url}: Details does not change text size`, on.size === off.size && on.lede === off.lede, `${on.size}/${on.lede} → ${off.size}/${off.lede}`);
  await ctx.close();
}

/* 4 + 5: mascot structure and panel behaviour */
{
  const { ctx, pg } = await open('/index.html');
  const s = await pg.evaluate(() => {
    const b = document.getElementById('mascotBtn');
    return {
      tag: b.tagName, insideLink: !!b.closest('a'), name: b.getAttribute('aria-label'),
      brandHref: document.querySelector('a.brand').getAttribute('href'), brandHasButton: !!document.querySelector('a.brand button'),
      w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height
    };
  });
  ok('4 mascot is a <button> outside the home link, with an accessible name and a 40px+ target',
    s.tag === 'BUTTON' && !s.insideLink && !s.brandHasButton && /Denki-chan/.test(s.name) && s.w >= 40 && s.h >= 40, JSON.stringify(s));
  await pg.click('#mascotBtn');
  ok('4 click opens the helper panel (aria-expanded + dialog visible)',
    (await panelOpen(pg)) && (await pg.getAttribute('#mascotBtn', 'aria-expanded')) === 'true' &&
    (await pg.getAttribute('#mascotPanel', 'role')) === 'dialog');
  ok('4 opening moves focus into the panel', await pg.evaluate(() => document.getElementById('mascotPanel').contains(document.activeElement)));
  await pg.keyboard.press('Escape');
  ok('4 Escape closes the panel and returns focus to the mascot', !(await panelOpen(pg)) && (await focusId(pg)) === 'mascotBtn');
  await pg.focus('#mascotBtn');
  await pg.keyboard.press('Enter');
  ok('4 Enter on the focused mascot opens it', await panelOpen(pg));
  await pg.mouse.click(900, 600);
  ok('4 clicking elsewhere closes it', !(await panelOpen(pg)));
  await pg.focus('#mascotBtn');
  await pg.keyboard.press('Space');
  ok('4 Space on the focused mascot opens it', await panelOpen(pg));
  for (let i = 0; i < 6; i++) await pg.keyboard.press('Tab');
  ok('4 tabbing out of the panel closes it (no focus trap)', !(await panelOpen(pg)));
  ok('4 clicking the mascot does not navigate away', !/quiz|topics/.test(pg.url()));
  await pg.click('a.brand');
  await pg.waitForTimeout(300);
  ok('4 the brand link still goes home', /index\.html(#\/)?$|\/$/.test(pg.url()));

  /* 5 contextual tips + real tool links, on the home page's chapter route */
  await pg.click('#topicsBtn'); await pg.click('#topicsMenu a[href$="current.html"]');
  await pg.waitForFunction(() => location.hash === '#/ch1');
  await pg.waitForTimeout(700);
  await pg.click('#mascotBtn');
  const p1 = await pg.evaluate(() => ({
    tip: document.querySelector('.mp-tip').textContent,
    links: [...document.querySelectorAll('.mp-links a')].map(a => a.textContent)
  }));
  ok('5 Chapter 1 panel gives circuit tips and links to the existing Ohm calculator + circuit builder',
    /Ohm|series|resistor/i.test(p1.tip) && p1.links.includes('Ohm’s law calculator') && p1.links.includes('Circuit builder'), JSON.stringify(p1));
  const tips = new Set();
  for (let i = 0; i < 6; i++) { await pg.click('.mp-more'); tips.add(await pg.textContent('.mp-tip')); }
  ok('5 "Another tip" varies the tip', tips.size >= 2, `${tips.size} distinct`);
  await pg.click('.mp-links a:has-text("Circuit builder")');
  await pg.waitForTimeout(900);
  const jumped = await pg.evaluate(() => {
    const t = document.getElementById('sim-circuit-panel'); if (!t) return null;
    const r = t.getBoundingClientRect(); return { top: Math.round(r.top), vis: r.top < innerHeight };
  });
  ok('5 following a shortcut closes the panel and scrolls to the real tool', !(await panelOpen(pg)) && jumped && jumped.vis, JSON.stringify(jumped));
  await ctx.close();

  const q = await open('/quiz.html');
  await q.pg.click('#mascotBtn');
  const qt = await q.pg.evaluate(() => ({ tip: document.querySelector('.mp-tip').textContent, links: [...document.querySelectorAll('.mp-links a')].map(a => a.textContent) }));
  ok('5 quiz panel gives quiz tips and does not offer a second quiz link', /option|Flag|explanation/i.test(qt.tip) && !qt.links.includes('Take the quiz'), JSON.stringify(qt));
  await q.ctx.close();
}

/* 6: reactions */
{
  const { ctx, pg } = await open('/topics/current.html');
  const say = detail => pg.evaluate(d => document.dispatchEvent(new CustomEvent('emc:mascot', { detail: d })), detail);
  const bubble = () => pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent, role: b.getAttribute('role'), pe: getComputedStyle(b).pointerEvents }; });
  await say({ kind: 'quiz', pct: 95 });
  let b = await bubble();
  ok('6 a high quiz score gets a short status-role bubble that never takes pointer input', !b.hidden && b.text.length > 5 && b.text.length < 90 && b.role === 'status' && b.pe === 'none', JSON.stringify(b));
  const seen = new Set();
  for (let i = 0; i < 8; i++) { await say({ kind: 'quiz', pct: 20 }); seen.add((await bubble()).text); }
  ok('6 reactions vary', seen.size >= 2, `${seen.size} distinct`);
  let back2back = false, prev = '';
  for (let i = 0; i < 12; i++) { await say({ kind: 'chapter-done' }); const t = (await bubble()).text; if (t === prev) back2back = true; prev = t; }
  ok('6 the same line never repeats back-to-back', !back2back);
  await pg.click('#mascotBtn');
  await say({ kind: 'quiz', pct: 10 });
  ok('6 the bubble never talks over the open panel', (await bubble()).hidden);
  await pg.keyboard.press('Escape');
  await ctx.close();

  /* the REAL triggers, not synthetic events: Mark-complete button and quiz submit */
  const ch = await open('/topics/current.html');
  await ch.pg.locator('[data-complete-topic]').first().scrollIntoViewIfNeeded();
  await ch.pg.locator('[data-complete-topic]').first().click();
  await ch.pg.waitForTimeout(300);
  const done = await ch.pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent }; });
  ok('6 marking a chapter complete makes the mascot acknowledge it', !done.hidden && done.text.length > 5, JSON.stringify(done));
  await ch.ctx.close();

  const qz = await open('/quiz.html');
  for (let i = 0; i < 4; i++) {
    const graded = await qz.pg.evaluate(() => !!document.querySelector('#quiz-score .score-num, #quiz-score [data-score], #quiz-score') && /Retake|retake/.test(document.body.textContent));
    if (graded) break;
    await qz.pg.locator('#quiz-submit').click();
    await qz.pg.waitForTimeout(350);
  }
  await qz.pg.waitForTimeout(300);
  const qs = await qz.pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent }; });
  ok('6 submitting the quiz makes the mascot react to the score (blank quiz = 0% = encouragement)',
    !qs.hidden && /starts|read the notes|practice|Keep going|explanations/i.test(qs.text), JSON.stringify(qs));
  await qz.ctx.close();
}

/* 7: before/after intro, narrow screens */
{
  const { ctx, pg } = await open('/index.html', { intro: true });
  await pg.waitForFunction(() => document.getElementById('introOverlay')?.classList.contains('play'), null, { timeout: 8000 });
  const box = await pg.locator('#mascotBtn').boundingBox();
  await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  ok('7 while the intro plays the mascot cannot be clicked through it', !(await panelOpen(pg)));
  await pg.click('#introSkip');
  await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 4000 });
  await pg.click('#mascotBtn');
  ok('7 after the intro the mascot works', await panelOpen(pg));
  await ctx.close();
}
for (const [w, h] of [[390, 844], [360, 740], [844, 390], [768, 1024]]) {
  for (const url of ['/index.html', '/topics/fields.html', '/quiz.html']) {
    const { ctx, pg } = await open(url, { w, h });
    /* page-level overflow is measured before AND after opening: the panel must
       not add any (fields.html already overflows by a few px from its own
       #charge-tryit block and KaTeX rows — a pre-existing layout issue) */
    const overflow = () => pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const before = await overflow();
    await pg.click('#mascotBtn');
    const m = await pg.evaluate(() => {
      const p = document.getElementById('mascotPanel').getBoundingClientRect();
      return { left: Math.round(p.left), right: Math.round(p.right), bottom: Math.round(p.bottom), vw: innerWidth, vh: innerHeight };
    });
    m.overflowBefore = before; m.overflowAfter = await overflow();
    ok(`7 ${w}x${h} ${url}: panel fits the viewport and adds no sideways scroll`,
      m.overflowAfter <= Math.max(before, 0) && m.left >= 0 && m.right <= m.vw && m.bottom <= m.vh, JSON.stringify(m));
    await ctx.close();
  }
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'UI CONTRACT PASS' : fails + ' UI FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
