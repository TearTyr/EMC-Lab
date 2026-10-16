#!/usr/bin/env node
/* DEV ONLY — counts layout reads (getBoundingClientRect) + CDP LayoutCount
   during a 2 s idle window with an animating sim in view. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8424;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const url of ['topics/fluids.html', 'index.html']) {
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Performance.enable');
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    window.__gbcr = 0;
    const o = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () { window.__gbcr++; return o.apply(this, arguments); };
  });
  await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' }); await sleep(2500);
  await page.evaluate(() => { const c = document.querySelector('.sim-canvas, #heroCanvas'); if (c) c.scrollIntoView({ block: 'center' }); });
  await sleep(1200);
  const m0 = (await client.send('Performance.getMetrics')).metrics.reduce((m,x)=>(m[x.name]=x.value,m),{});
  const g0 = await page.evaluate(() => { window.__gbcr = 0; return performance.now(); });
  await sleep(2000);
  const g1 = await page.evaluate(() => window.__gbcr);
  const m1 = (await client.send('Performance.getMetrics')).metrics.reduce((m,x)=>(m[x.name]=x.value,m),{});
  console.log(`${url}  gBCR/2s idle-in-view: ${g1}  LayoutCount delta: ${m1.LayoutCount - m0.LayoutCount}  RecalcStyle delta: ${m1.RecalcStyleCount - m0.RecalcStyleCount}`);
  await page.close();
}
await browser.close(); server.close();
