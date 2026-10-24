#!/usr/bin/env node
/* ==========================================================================
   EMC Lab - screenshot harness (dev tool, needs playwright installed anywhere:
   npm i playwright && npx playwright install chromium).
   Run: node tools/screenshots.mjs [outDir]

   Serves the project from an in-memory, gzip-on map (request-handler-free fs,
   allocation-free responses) and captures the key states of every surface with
   a REAL headless Chromium: desktop home, chapter cards, a live sim on the
   standalone page and inside the same-page shell, the quiz, and the 360px
   mobile composition. Fails (exit 1) on any console/page error or missing
   asset, so "0 faults" means zero browser-reported faults, not just pixels.
   Output is gitignored (shots/); pass a custom outDir as argv[2].
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const OUT = resolve(process.argv[2] || path.join(ROOT, 'shots'));

let chromium;
try { chromium = (await import('playwright')).chromium; }
catch { console.error('playwright not found - install it to run the screenshot harness (npm i playwright && npx playwright install chromium)'); process.exit(2); }

/* preload + pre-gzip: same pattern as tools/perf-audit.mjs */
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    /* phase 9: same exclusion set as the other verifiers + Video/.
       Rationale (written, per testing rules): the walk preloads every
       served file into RAM; evidence/ (analysis GIFs), docs/, .scratch/
       and Video/ (46 MB reference MP4) are never requested by any page
       (comments-only references), and preloading them pushed node RSS
       to ~110 MB which OOM-killed the chromium renderer on low-RAM CI
       ('Target crashed' at newPage). No assertion is weakened: a page
       that DID request these paths would now 404 and be reported by
       the misses[] check below. */
    if (['node_modules', '.git', 'public', 'archive', 'shots', 'evidence', 'docs', '.scratch', 'Video'].includes(e)) continue;
    const f = path.join(dir, e);
    const st = fs.statSync(f);
    if (st.isDirectory()) walk(f);
    else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' };
const GZ = new Map();
for (const [k, buf] of FILES) {
  const type = MIME[path.extname(k).toLowerCase()] || '';
  if (/text|javascript|json|svg/.test(type)) GZ.set(k, zlib.gzipSync(buf, { level: 6 }));
}
const misses = [];
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  let raw = FILES.get(u);
  if (!raw && !path.extname(u)) { raw = FILES.get(u + '.html'); if (raw) u += '.html'; }
  if (!raw) { misses.push(u); res.writeHead(404); res.end('not found'); return; }
  const type = MIME[path.extname(u).toLowerCase()] || 'application/octet-stream';
  const gz = GZ.get(u);
  if (gz && /gzip/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Content-Length': gz.length });
    return res.end(gz);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': raw.length });
  res.end(raw);
});
await new Promise(r => server.listen(8242, '127.0.0.1', r));
fs.mkdirSync(OUT, { recursive: true });

const B = 'http://127.0.0.1:8242';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const errs = [];
async function shot(url, file, { w = 1440, h = 900, sel = null, scroll = 0, wait = 2200, rm = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const pg = await ctx.newPage();
  /* The intro is now the ~11.7 s 1:6 reference cut (longer than any shot
     wait), so shots preset the once-per-session key to document page design,
     exactly like motion/a11y/nav/loader/asset/stability already do. The
     intro has its own gates (intro-verify, capture-intro-video). */
  await pg.addInitScript(() => { try { sessionStorage.setItem('emc.intro.v1', '1'); } catch (e) {} });
  pg.on('pageerror', e => errs.push(file + ': ' + String(e).slice(0, 140)));
  pg.on('console', m => { if (m.type() === 'error') errs.push(file + ' console: ' + m.text().slice(0, 140)); });
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(wait);
  if (sel) await pg.evaluate(s => { const t = document.querySelector(s); if (t) t.scrollIntoView({ block: 'center', behavior: 'instant' }); }, sel);
  else if (scroll) await pg.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scroll);
  await pg.waitForTimeout(900);
  await pg.screenshot({ path: path.join(OUT, file) });
  await ctx.close();
  console.log('shot', file);
}

await shot(B + '/index.html', 'home-hero.png');
await shot(B + '/index.html', 'home-cards.png', { scroll: 980 });
await shot(B + '/index.html', 'home-360.png', { w: 360, h: 780, scroll: 300 });
await shot(B + '/topics/current.html', 'topic-sim.png', { sel: '#sim-ohm', wait: 2600 });
await shot(B + '/topics/fields.html', 'topic-fields-charge.png', { sel: '#sim-static-room-panel' });
await shot(B + '/topics/fields.html', 'topic-fields-coulomb.png', { sel: '#sim-arena-panel' });
await shot(B + '/topics/fields.html', 'topic-fields-field.png', { sel: '#sim-fieldpaint-panel' });
await shot(B + '/index.html#/current', 'shell-sim.png', { sel: '#sim-ohm', wait: 2800 });
await shot(B + '/quiz.html', 'quiz.png', { wait: 1800 });
await shot(B + '/quiz.html', 'quiz-360.png', { w: 360, h: 780, wait: 1600 });
await shot(B + '/index.html', 'home-reduced.png', { scroll: 980, rm: true });

console.log('404 misses:', misses.length ? misses.slice(0, 6) : 'none');
console.log('console/page errors:', errs.length ? errs.slice(0, 8) : 'none');
setTimeout(() => process.exit(errs.length === 0 && misses.length === 0 ? 0 : 1), 300);
await browser.close();
server.close();
process.exit(errs.length === 0 && misses.length === 0 ? 0 : 1);
