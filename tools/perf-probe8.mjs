#!/usr/bin/env node
/* DEV ONLY — startup experience probe: FCP / LCP / CLS / long tasks / requests,
   cold vs warm cache, per page and profile. Baseline & after comparisons. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVE = process.env.PERF_SERVE === 'public' ? path.join(ROOT, 'public') : ROOT;
const PORT = 8435;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(SERVE,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control': req.url.includes('/vendor/') ? 'public, max-age=86400' : (/\.[0-9a-f]{8}\.(js|css)$/.test(req.url) ? 'public, max-age=31536000, immutable' : 'no-cache')}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = process.env.PERF_PAGES ? process.env.PERF_PAGES.split(',') : ['index.html','topics/current.html'];
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const [pname, prof] of Object.entries({ desktop: { width: 1280, height: 900, dpr: 1, th: 1 }, mobile: { width: 390, height: 844, dpr: 3, th: 4 } })) {
  const ctx = await browser.createBrowserContext();
  for (const pass of ['cold', 'warm']) {
    const page = await ctx.newPage();
    const client = await page.createCDPSession();
    await page.setViewport({ width: prof.width, height: prof.height, deviceScaleFactor: prof.dpr, hasTouch: prof.th > 1 });
    if (prof.th > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: prof.th });
    await client.send('Network.enable');
    let reqs = 0, bytes = 0;
    client.on('Network.responseReceived', () => reqs++);
    client.on('Network.loadingFinished', p => bytes += p.encodedDataLength || 0);
    await page.evaluateOnNewDocument(() => {
      window.__m = { lt: [], cls: 0, lcp: 0 };
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.startTime < 8000) window.__m.lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
      try { new PerformanceObserver(l => { const es = l.getEntries(); if (es.length) window.__m.lcp = Math.round(es[es.length - 1].startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    });
    const line = [];
    for (const url of PAGES) {
      await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
      await sleep(2200);
      const m = await page.evaluate(() => {
        const p = performance.getEntriesByType('paint').reduce((a, e) => (a[e.name] = Math.round(e.startTime), a), {});
        return { fcp: p['first-contentful-paint'] || 0, lcp: window.__m.lcp, cls: +window.__m.cls.toFixed(3), lt50: window.__m.lt.filter(x => x > 50).length, lt100: window.__m.lt.filter(x => x > 100).length };
      });
      line.push(`${url.replace('topics/','').replace('.html','')}: FCP ${m.fcp} LCP ${m.lcp} CLS ${m.cls} LT ${m.lt50}/${m.lt100}`);
    }
    console.log(`${pname} ${pass}: reqs ${reqs} ${(bytes / 1024).toFixed(0)} KB | ` + line.join(' | '));
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
