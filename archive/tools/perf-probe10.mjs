#!/usr/bin/env node
/* DEV ONLY — layout-shift forensics: CLS total + shifting nodes with sources,
   cold (throttled 4G) and warm, plus shift caused by a Detail-Mode flip. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVE = process.env.PERF_SERVE === 'public' ? path.join(ROOT, 'public') : ROOT;
const PORT = 8448;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.json':'application/json' };
const server = http.createServer((req,res)=>{ let f=path.join(SERVE,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':/\.[0-9a-f]{8}\.(js|css)$/.test(req.url)?'public, max-age=31536000, immutable':(req.url.includes('/vendor/')?'public, max-age=86400':'no-cache')}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = process.env.PERF_PAGES ? process.env.PERF_PAGES.split(',') : ['index.html','topics/current.html','topics/fluids.html'];
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
for (const [pname, prof] of Object.entries({ desktop: { width: 1280, height: 900, dpr: 1 }, mobile: { width: 390, height: 844, dpr: 3 } })) {
  for (const net of ['cold4g', 'warm']) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const client = await page.createCDPSession();
    await page.setViewport({ width: prof.width, height: prof.height, deviceScaleFactor: prof.dpr, hasTouch: pname === 'mobile' });
    if (net === 'cold4g') await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000, uploadThroughput: 750000 });
    await page.evaluateOnNewDocument(() => {
      window.__ls = [];
      new PerformanceObserver(l => { for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;   // CLS spec: input-attributed shifts are expected, not instability
        const srcs = (e.sources || []).map(s => { const n = s.node; if (!n) return s.previousRects ? '(detached)' : '?';
          return (n.tagName || '?').toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0,2).join('.') : ''); });
        window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: srcs.join('+') });
      } }).observe({ type: 'layout-shift', buffered: true });
    });
    const rows = [];
    for (const url of PAGES) {
      await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
      await sleep(3000);
      // detail-mode flip shift measurement
      await page.evaluate(() => { window.__ls.length = 0; });
      await page.click('#detailToggle'); await sleep(500);
      await page.click('#detailToggle'); await sleep(500);
      const toggleShift = await page.evaluate(() => window.__ls.reduce((a, e) => a + e.v, 0));
      const m = await page.evaluate(() => ({ cls: +window.__ls.reduce((a, e) => a + e.v, 0).toFixed(4) }));
      await page.evaluate(() => { window.__ls.length = 0; });
      await page.reload({ waitUntil: 'load' }); await sleep(3000);
      const load = await page.evaluate(() => ({ cls: +window.__ls.reduce((a, e) => a + e.v, 0).toFixed(4), top: window.__ls.slice().sort((a,b)=>b.v-a.v).slice(0,4) }));
      rows.push(`${url.replace('topics/','').replace('.html','')}: loadCLS ${load.cls} toggleCLS ${(+toggleShift).toFixed(4)} top ${JSON.stringify(load.top)}`);
    }
    console.log(pname + ' ' + net + ':');
    for (const r of rows) console.log('  ' + r);
    await ctx.close();
  }
}
await browser.close(); server.close();
