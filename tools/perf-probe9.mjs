#!/usr/bin/env node
/* DEV ONLY — post-load main-thread blockers: long tasks in the 0-4 s window
   with markers for load, fonts.ready and idle-typeset, desktop unthrottled. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVE = process.env.PERF_SERVE === 'public' ? path.join(ROOT, 'public') : ROOT;
const PORT = 8443;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.json':'application/json' };
const server = http.createServer((req,res)=>{ let f=path.join(SERVE,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const url of ['index.html', 'topics/current.html']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.__m = { lt: [], marks: {} };
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.startTime < 5000) window.__m.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true });
    addEventListener('load', () => { window.__m.marks.load = Math.round(performance.now()); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { window.__m.marks.fonts = Math.round(performance.now()); });
  });
  await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
  await sleep(4000);
  const m = await page.evaluate(() => window.__m);
  console.log(url.padEnd(22), 'marks', JSON.stringify(m.marks), 'longtasks[start,dur]:', JSON.stringify(m.lt.filter(([, d]) => d > 40)));
  await page.close();
}
await browser.close(); server.close();
