#!/usr/bin/env node
/* Capture the SITE's own intro (#introOverlay) as a real-time screenshot loop
   and assemble a variable-delay GIF. Fresh context per run (intro plays once
   per session via sessionStorage). CSS-keyframe-driven, so real-time capture
   is the honest method. Frames + timestamps land in /tmp/introcap/. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'archive', 'shots', 'evidence', 'docs', '.scratch', 'Video'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]); if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' });
  res.end(b);
});
await new Promise(r => server.listen(8271, '127.0.0.1', r));

const OUT = '/tmp/introcap';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 600 } });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
await pg.goto('http://127.0.0.1:8271/index.html', { waitUntil: 'load' });
await pg.waitForSelector('#introOverlay.play', { timeout: 8000 });
const t0 = Date.now();
let i = 0;
const stamps = [];
for (;;) {
  const gone = await pg.evaluate(() => !document.getElementById('introOverlay'));
  const buf = await pg.screenshot({ type: 'png' });
  const t = Date.now() - t0;
  fs.writeFileSync(`${OUT}/f${String(i).padStart(3, '0')}.png`, buf);
  stamps.push(t);
  i++;
  if (gone && t > 6400) break;
  if (t > 12000) break;
}
fs.writeFileSync(`${OUT}/stamps.json`, JSON.stringify(stamps));
console.log('frames:', i, 'span_ms:', stamps[stamps.length - 1], 'errors:', errs.length ? errs : 'none');
await browser.close();
server.close();
