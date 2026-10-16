#!/usr/bin/env node
/* ==========================================================================
   EMC Lab - social card generator (dev tool, needs puppeteer installed anywhere)
   File: tools/make-og-card.mjs     run:  node tools/make-og-card.mjs

   Renders tools/og-card.html (1200x630) with headless Chrome and writes
   img/og-card.png - the file every page advertises through og:image /
   twitter:image. Scrapers fetch that absolute URL, they never render HTML, so
   the PNG has to be committed; this script exists so it can be regenerated
   instead of hand-edited.

   Re-run it whenever the brand colours, the mascot, the fonts or the counts
   in the card footer (topics / simulations / quiz questions) change, then
   commit the new PNG together with the code change.

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

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { try { puppeteer = (await import('/tmp/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default; }
        catch { console.log('puppeteer not found - install it to regenerate img/og-card.png'); server.close(); process.exit(0); } }

let browser;
for (let attempt = 1; attempt <= 3 && !browser; attempt++) {
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      timeout: 90000,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
             '--force-color-profile=srgb', '--hide-scrollbars']
    });
  } catch (e) {
    console.log(`chrome launch attempt ${attempt} failed (${e.message})`);
    await new Promise(r => setTimeout(r, 2000));
  }
}
if (!browser) { console.log('could not launch chrome - img/og-card.png left untouched'); server.close(); process.exit(0); }

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:8243/tools/og-card.html`, { waitUntil: 'networkidle0', timeout: 60000 });
// make sure the webfont actually landed before shooting
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 600));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

const bytes = fs.statSync(OUT).size;
console.log(`make-og-card -> img/og-card.png (${WIDTH}x${HEIGHT}, ${(bytes / 1024).toFixed(0)} KB)`);
await browser.close();
server.close();
console.log('og card OK - remember to commit the PNG.');
