#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — theme verification in a REAL browser (dark default, light opt-in).
   Run: node tools/theme-verify.mjs
     1 dark is the default, even when the OS asks for a light scheme
     2 the nav toggle switches theme on every page, with the right aria-pressed,
       theme-color meta and native color-scheme; Enter and Space work; on a phone
       it lives in the opened menu
     3 the choice persists in the existing prefs record (emc.prefs.v1), survives a
       reload and is applied BEFORE first paint (no flash of the wrong theme)
     4 switching never reloads the page and never touches Details, quiz answers
       or saved progress
     5 Chart.js results redraw in the new theme's colours
     6 simulation canvases and figure plates stay on their dark plate in both themes
     7 the keyboard focus ring keeps >= 3:1 against the page in both themes
     8 every visible text element meets WCAG AA contrast (4.5:1, or 3:1 for large
       text) in both themes on home, both chapters and the quiz incl. its results;
       disabled controls are exempt (WCAG)
     9 zero console/page errors
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
await new Promise(r => server.listen(8266, '127.0.0.1', r));
const B = 'http://127.0.0.1:8266';

let fails = 0;
const errors = [];
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
async function open(url, { theme, ...ctxOpts } = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, ctxOpts));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
  await pg.addInitScript(skipIntroOnLoad);
  if (theme === 'light') await pg.addInitScript(() => { if (!localStorage.getItem('emc.prefs.v1')) localStorage.setItem('emc.prefs.v1', JSON.stringify({ theme: 'light' })); });
  await pg.goto(B + url, { waitUntil: 'load' });
  await pg.waitForTimeout(1200);
  return { ctx, pg };
}
const themeOf = pg => pg.evaluate(() => document.documentElement.dataset.theme || 'dark');
const prefs = pg => pg.evaluate(() => JSON.parse(localStorage.getItem('emc.prefs.v1') || '{}'));

/* 1: default is dark, even if the OS says light */
for (const scheme of ['light', 'dark']) {
  const { ctx, pg } = await open('/index.html', { colorScheme: scheme });
  ok(`1 default theme is dark with an OS "${scheme}" preference`, (await themeOf(pg)) === 'dark' && !(await pg.evaluate(() => document.documentElement.dataset.theme)));
  await ctx.close();
}

/* 2 + 3: toggle everywhere, persistence, no flash */
for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
  const { ctx, pg } = await open(url);
  const before = await pg.evaluate(() => ({ cs: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').content, pressed: document.getElementById('themeToggle').getAttribute('aria-pressed') }));
  await pg.click('#themeToggle');
  await pg.waitForTimeout(300);
  const after = await pg.evaluate(() => ({ cs: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').content, pressed: document.getElementById('themeToggle').getAttribute('aria-pressed') }));
  ok(`2 ${url}: toggle switches to light (background, color-scheme, theme-color meta, aria-pressed)`,
    (await themeOf(pg)) === 'light' && before.pressed === 'false' && after.pressed === 'true' &&
    before.cs === 'dark' && after.cs === 'light' && before.meta === '#17181c' && after.meta === '#faf7ec' && before.bg !== after.bg, JSON.stringify({ before, after }));
  ok(`3 ${url}: the choice is stored in the existing prefs record`, (await prefs(pg)).theme === 'light');
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(700);
  ok(`3 ${url}: light survives a reload`, (await themeOf(pg)) === 'light' && (await pg.getAttribute('#themeToggle', 'aria-pressed')) === 'true');
  await pg.click('#themeToggle');
  ok(`3 ${url}: toggling back restores dark and the stored pref`, (await themeOf(pg)) === 'dark' && (await prefs(pg)).theme === 'dark');
  await ctx.close();
}
{
  /* applied before first paint: record readyState when the attribute first appears */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(skipIntroOnLoad);
  await pg.addInitScript(() => {
    localStorage.setItem('emc.prefs.v1', JSON.stringify({ theme: 'light' }));
    new MutationObserver(() => {
      if (document.documentElement.dataset.theme && window.__themeSeenAt === undefined) window.__themeSeenAt = document.readyState;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });   // <html> may not exist yet
  });
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  ok('3 light is applied while the document is still loading (before first paint, no flash)', (await pg.evaluate(() => window.__themeSeenAt)) === 'loading', String(await pg.evaluate(() => window.__themeSeenAt)));
  await ctx.close();
}
{
  const { ctx, pg } = await open('/index.html');
  await pg.focus('#themeToggle');
  await pg.keyboard.press('Enter');
  const viaEnter = await themeOf(pg);
  await pg.keyboard.press('Space');
  ok('2 the toggle works from the keyboard (Enter then Space)', viaEnter === 'light' && (await themeOf(pg)) === 'dark');
  await ctx.close();
  const m = await open('/index.html', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await m.pg.click('#navToggle');
  await m.pg.click('#themeToggle');
  ok('2 on a phone the toggle sits in the opened menu and works', (await themeOf(m.pg)) === 'light');
  await m.ctx.close();
}

/* 4: switching keeps everything else */
{
  const { ctx, pg } = await open('/quiz.html');
  await pg.evaluate(() => { window.__marker = 'same-document'; document.querySelectorAll('.q-card')[0].querySelector('.opt').click(); document.querySelectorAll('.q-card')[1].querySelector('.opt').click(); });
  await pg.click('#detailToggle');
  await pg.waitForTimeout(400);
  const before = { pill: await pg.textContent('#pillText'), detail: await pg.evaluate(() => document.documentElement.dataset.detail), progress: await pg.evaluate(() => localStorage.getItem('emc.progress.v4')) };
  await pg.click('#themeToggle');
  await pg.waitForTimeout(400);
  const after = { pill: await pg.textContent('#pillText'), detail: await pg.evaluate(() => document.documentElement.dataset.detail), progress: await pg.evaluate(() => localStorage.getItem('emc.progress.v4')) };
  ok('4 switching theme keeps quiz answers, the Details level and saved progress, without reloading',
    JSON.stringify(before) === JSON.stringify(after) && after.pill === '2/16' && after.detail === 'off' && (await pg.evaluate(() => window.__marker)) === 'same-document', JSON.stringify({ before, after }));
  ok('4 the other preferences in the record are preserved', (await prefs(pg)).detail === 'off' && (await prefs(pg)).theme === 'light');
  await ctx.close();
}

/* 5: charts follow the theme */
{
  const { ctx, pg } = await open('/quiz.html');
  await pg.evaluate(() => document.querySelectorAll('.q-card').forEach((c, i) => c.querySelectorAll('.opt')[i % 4].click()));
  for (let i = 0; i < 4; i++) { await pg.locator('#quiz-submit').click().catch(() => {}); await pg.waitForTimeout(350); }
  await pg.waitForTimeout(1200);
  const colours = () => pg.evaluate(() => {
    const c = window.Chart && Object.values(window.Chart.instances).find(i => i.config.type === 'doughnut');
    return c ? { good: c.data.datasets[0].backgroundColor[0], ring: c.data.datasets[0].borderColor, n: Object.keys(window.Chart.instances).length } : null;
  });
  const dark = await colours();
  await pg.click('#themeToggle');
  await pg.waitForTimeout(900);
  const light = await colours();
  ok('5 results charts redraw in the light palette after switching (and stay at three charts)',
    dark && light && dark.good !== light.good && light.good === '#3e7f1b' && /^#(fff|ffffff)$/.test(light.ring) && light.n === 3   /* the minifier shortens #ffffff */ && dark.n === 3, JSON.stringify({ dark, light }));
  await ctx.close();
}

/* 6 + 7: plates stay dark; focus ring contrast */
for (const theme of ['dark', 'light']) {
  const { ctx, pg } = await open('/topics/fields.html', { theme });
  const plates = await pg.evaluate(() => [...document.querySelectorAll('.sim-canvas')].map(c => getComputedStyle(c).backgroundColor));
  ok(`6 [${theme}] every simulation canvas keeps its dark plate`, plates.length >= 4 && plates.every(p => p === 'rgb(16, 17, 20)'), JSON.stringify([...new Set(plates)]));
  await pg.focus('#detailToggle');
  await pg.keyboard.press('Tab');   // moves focus with the keyboard so :focus-visible applies
  const ring = await pg.evaluate(() => {
    const parse = c => c.match(/[\d.]+/g).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const cs = getComputedStyle(document.activeElement);
    const o = parse(cs.outlineColor), bg = parse(getComputedStyle(document.body).backgroundColor);
    const [a, b] = [lum(o), lum(bg)];
    return { outline: cs.outlineStyle, width: cs.outlineWidth, ratio: +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2) };
  });
  ok(`7 [${theme}] the focus ring is drawn and has >= 3:1 contrast with the page`, ring.outline === 'solid' && ring.ratio >= 3, JSON.stringify(ring));
  await ctx.close();
}

/* 8: WCAG text contrast, both themes, real composited colours */
async function contrastFailures(url, theme, results) {
  const { ctx, pg } = await open(url, { theme });
  if (results) {
    await pg.evaluate(() => document.querySelectorAll('.q-card').forEach((c, i) => c.querySelectorAll('.opt')[i % 4].click()));
    for (let i = 0; i < 4; i++) { await pg.locator('#quiz-submit').click().catch(() => {}); await pg.waitForTimeout(350); }
    await pg.waitForTimeout(1200);
  }
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } scrollTo(0, 0); });
  await pg.waitForTimeout(500);
  const bad = await pg.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
    const over = (f, bg) => ({ r: f.r * f.a + bg.r * (1 - f.a), g: f.g * f.a + bg.g * (1 - f.a), b: f.b * f.a + bg.b * (1 - f.a), a: 1 });
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
    const bgOf = el => {
      const chain = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e); const c = parse(cs.backgroundColor);
        if (c && c.a > 0) chain.push(c);
        if (c && c.a === 1) break;
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      }
      let base = parse(getComputedStyle(document.body).backgroundColor);
      let acc = chain.length && chain[chain.length - 1].a === 1 ? chain.pop() : base;
      while (chain.length) acc = over(chain.pop(), acc);
      return acc;
    };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set(); let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const e = n.parentElement; if (!e || seen.has(e)) continue; seen.add(e);
      if (e.closest('#introOverlay,script,style,canvas,svg,.katex-mathml,[hidden],[inert],.sr-only,.skip-link,.sim-canvas,.canvas-wrap,[data-mx]:not(.mx-in)')) continue;
      if (e.closest('button:disabled,[disabled],[aria-disabled="true"]')) continue;       // inactive controls are exempt
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      let op = 1; for (let x = e; x; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity);
      if (op < .05) continue;
      const bg = bgOf(e); const fg0 = parse(cs.color); if (!bg || !fg0) continue;
      const fg = over({ ...fg0, a: fg0.a * op }, bg);
      const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
      if (ratio < need) out.push(`${e.tagName}${e.id ? '#' + e.id : ''}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} ${ratio.toFixed(2)}<${need} "${n.textContent.trim().slice(0, 22)}"`);
    }
    return [...new Set(out)];
  });
  await ctx.close();
  return bad;
}
for (const theme of ['dark', 'light']) {
  for (const [url, results] of [['/index.html', false], ['/index.html#/ch1', false], ['/index.html#/ch2', false], ['/quiz.html', true]]) {
    const bad = await contrastFailures(url, theme, results);
    ok(`8 [${theme}] ${url}${results ? ' (with results)' : ''}: all visible text meets WCAG AA contrast`, bad.length === 0, bad.slice(0, 4).join(' | '));
  }
}

console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
if (errors.length) fails += errors.length;
console.log(fails === 0 ? 'THEME CONTRACT PASS' : fails + ' THEME FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
