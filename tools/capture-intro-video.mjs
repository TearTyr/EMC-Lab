#!/usr/bin/env node
/* Record the site's opening as a smooth WebM via Playwright video capture:
   loader -> #introOverlay composition (~11.7 s, the 1:6 reference cut) ->
   homepage reveal (slam /
   corner / rise staggers from js/motion.js), then finalize the video.

   Why video instead of the screenshot loop in capture-site-intro.mjs:
   screencast recording runs ~25 fps, so the assembled GIF is smooth enough
   to share. Fresh context per run => sessionStorage is empty => intro plays.

   Usage: node tools/capture-intro-video.mjs [outDir]
   Prints the saved .webm path on stdout (last line). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const OUTDIR = resolve(process.argv[2] || '/tmp/introvideo');

/* Serve the repo from memory, excluding heavy / non-shipped dirs so the
   verifier-style preload can't blow the 1 GB budget (see TESTING.md). */
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
await new Promise(r => server.listen(8272, '127.0.0.1', r));

fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({
  viewport: { width: 960, height: 600 },
  recordVideo: { dir: OUTDIR, size: { width: 960, height: 600 } },
});
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });

const t0 = Date.now();
await pg.goto('http://127.0.0.1:8272/index.html', { waitUntil: 'load' });
await pg.waitForSelector('#introOverlay.play', { timeout: 8000 });
const introSeen = Date.now() - t0;

/* Wait for the overlay to be removed from the DOM (intro.js cleans up),
   then hold ~3.4 s so the homepage reveal staggers are on tape. */
await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 22000 });
const introDone = Date.now() - t0;
await pg.waitForTimeout(3400);

const video = pg.video();
await pg.close();
await ctx.close();            // finalizes the recording
const src = await video.path();
const dest = path.join(OUTDIR, 'intro-recording.webm');
fs.copyFileSync(src, dest);

await browser.close();
server.close();

console.log(JSON.stringify({
  intro_seen_ms: introSeen,
  intro_done_ms: introDone,
  total_recorded_ms: Date.now() - t0,
  page_errors: errs.length ? errs : 'none',
  webm_bytes: fs.statSync(dest).size,
}));
console.log(dest);
