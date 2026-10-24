#!/usr/bin/env node
/* ==========================================================================
   EMC Lab - social card generator (dev tool, needs playwright + chromium)
   File: tools/make-og-card.mjs     run:  node tools/make-og-card.mjs

   Renders tools/og-card.html (1200x630) with headless Chrome and writes
   img/og-card.png - the file every page advertises through og:image /
   twitter:image. Scrapers fetch that absolute URL, they never render HTML, so
   the PNG has to be committed; this script exists so it can be regenerated
   instead of hand-edited.

   Re-run it whenever the brand colours, the mascot or the fonts change, then
   commit the new PNG together with the code change. The footer counts
   (chapters / simulations / quiz questions) are derived automatically from
   js/registry.js and js/quiz-data.js at generation time.

   Serves the repo over http:// first: a file:// page cannot always fetch the
   woff2 fonts referenced by css/fonts.css, and the card must render in the
   real G8321 family rather than a system fallback.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'img', 'og-card.png');
const WIDTH = 1200, HEIGHT = 630;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png',
  '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  let f = path.join(ROOT, u);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
}).listen(8243);
await new Promise(r => setTimeout(r, 400));

const { chromium } = await import('playwright');
let browser;
for (let attempt = 1; attempt <= 3 && !browser; attempt++) {
  try {
    browser = await chromium.launch({
      args: ['--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars']
    });
  } catch (e) {
    console.log(`chromium launch attempt ${attempt} failed (${e.message})`);
    await new Promise(r => setTimeout(r, 2000));
  }
}
if (!browser) { console.log('could not launch chromium - img/og-card.png left untouched'); server.close(); process.exit(0); }

const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:8243/tools/og-card.html`, { waitUntil: 'networkidle', timeout: 60000 });
// make sure the webfont AND the KaTeX sticker sheet actually landed before
// shooting (the card sets window.__cardReady once every equation is typeset)
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => window.__cardReady === true, { timeout: 15000 }).catch(() => {});
await new Promise(r => setTimeout(r, 600));

/* Footer counts are DERIVED at generation time from the single sources of
   truth (js/registry.js chapters+sims, js/quiz-data.js bank length) so the
   committed card can never drift from the site again. Both files are plain
   `window.X = <literal>` scripts, evaluated in the card's own context. */
const counts = await page.evaluate(([r, q]) => {
  const win = {};
  new Function('window', r)(win);
  new Function('window', q)(win);
  return {
    chapters: win.EMC_REGISTRY.chapters.length,
    sims: win.EMC_REGISTRY.chapters.reduce((n, c) => n + (c.sims || []).length, 0),
    quiz: win.EMC_QUIZ.length
  };
}, [fs.readFileSync(path.join(ROOT, 'js/registry.js'), 'utf8'),
   fs.readFileSync(path.join(ROOT, 'js/quiz-data.js'), 'utf8')]);
await page.evaluate(c => {
  const b = document.querySelectorAll('.foot b');
  b[0].textContent = c.chapters; b[1].textContent = c.sims; b[2].textContent = c.quiz;
}, counts);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

const bytes = fs.statSync(OUT).size;
console.log(`make-og-card -> img/og-card.png (${WIDTH}x${HEIGHT}, ${(bytes / 1024).toFixed(0)} KB)`);
await browser.close();
server.close();
console.log('og card OK - remember to commit the PNG.');
