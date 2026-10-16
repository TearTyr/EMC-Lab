#!/usr/bin/env node
/* DEV ONLY — mobile long-task attribution on fluids (per-frame DOM write suspect). */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8423;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function instrument() {
  window.__perf = { longtasks: [], marks: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perf.longtasks.push({ at: Math.round(e.startTime), dur: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  window.__mark = t => window.__perf.marks.push({ t, at: Math.round(performance.now()) });
}
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--enable-precise-memory-info'] });
const page = await browser.newPage();
const client = await page.createCDPSession();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true });
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluateOnNewDocument(instrument);
await page.goto('http://127.0.0.1:8423/topics/fluids.html', { waitUntil: 'load' });
await page.evaluate(() => window.__mark('load-event'));
await sleep(3000);
await page.evaluate(() => { document.querySelector('#sim-archimedes').scrollIntoView({ block: 'center' }); window.__mark('arch-in-view'); });
await sleep(2500);
await page.evaluate(() => window.__mark('idle-window'));
await sleep(2500);
const slider = await page.$('#arch-rho'); const bb = await slider.boundingBox();
await page.evaluate(() => window.__mark('slider-start'));
await page.mouse.move(bb.x + bb.width*0.3, bb.y + bb.height/2); await page.mouse.down();
for (let i=0;i<=12;i++){ await page.mouse.move(bb.x + bb.width*(0.3+0.05*i), bb.y + bb.height/2); await sleep(30); }
await page.mouse.up();
await page.evaluate(() => window.__mark('slider-end'));
await sleep(1500);
await page.evaluate(() => { document.querySelector('#sim-bernoulli').scrollIntoView({ block: 'center' }); window.__mark('bern-in-view'); });
await sleep(3000);
const out = await page.evaluate(() => window.__perf);
console.log('MOBILE fluids longtasks:', JSON.stringify(out.longtasks));
console.log('marks:', JSON.stringify(out.marks));
fs.writeFileSync(path.join(ROOT,'docs','perf-data','probe3-baseline.json'), JSON.stringify(out, null, 2));
await page.close(); await browser.close(); server.close();
