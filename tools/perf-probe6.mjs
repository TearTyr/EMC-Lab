#!/usr/bin/env node
/* DEV ONLY — load-phase long tasks (>100 ms) per page/profile. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8426;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = ['index.html','quiz.html','topics/vectors.html','topics/fluids.html','topics/heat.html','topics/waves.html','topics/current.html'];
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const [pname, prof] of Object.entries({ desktop: { width: 1280, height: 900, dpr: 1, th: 1 }, mobile: { width: 390, height: 844, dpr: 3, th: 4 } })) {
  const line = [];
  for (const url of PAGES) {
    const page = await browser.newPage();
    const client = await page.createCDPSession();
    await page.setViewport({ width: prof.width, height: prof.height, deviceScaleFactor: prof.dpr, hasTouch: prof.th > 1 });
    if (prof.th > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: prof.th });
    await page.evaluateOnNewDocument(() => {
      window.__lt = [];
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    });
    await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
    await sleep(2500);
    const lt = await page.evaluate(() => window.__lt);
    line.push(`${url.replace('topics/','').replace('.html','')}:${lt.filter(x => x > 100).length}(${lt.filter(x => x > 50).length})`);
    await page.close();
  }
  console.log(pname.padEnd(8), line.join(' '));
}
await browser.close(); server.close();
