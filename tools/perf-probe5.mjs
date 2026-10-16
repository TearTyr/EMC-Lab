#!/usr/bin/env node
/* DEV ONLY — counts canvas clearRect calls (== full redraws) on the vector
   bench during a 20-move fast drag. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8425;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument(() => {
  window.__draws = 0;
  const o = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) {
    if (this.canvas && this.canvas.id === 'sim-vector-add') window.__draws++;
    return o.apply(this, a);
  };
});
await page.goto('http://127.0.0.1:8425/topics/vectors.html', { waitUntil: 'load' });
await sleep(2000);
await page.evaluate(() => document.querySelector('#sim-vector-add').scrollIntoView({ block: 'center' }));
await sleep(800);
const bb = await (await page.$('#sim-vector-add')).boundingBox();
// grab arrowhead A at (3,1): origin center, scale=min(w,h)/10
const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, s = Math.min(bb.width, bb.height) / 10;
await page.evaluate(() => { window.__draws = 0; });
await page.mouse.move(cx + 3 * s, cy - 1 * s);
await page.mouse.down();
for (let i = 0; i < 20; i++) await page.mouse.move(cx + 3 * s + i * 4, cy - 1 * s - i * 2);   // no sleeps: burst
await page.mouse.up();
await sleep(300);
const draws = await page.evaluate(() => window.__draws);
console.log('redraws during 20-move burst drag:', draws);
await page.close(); await browser.close(); server.close();
