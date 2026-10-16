#!/usr/bin/env node
/* DEV ONLY — (a) CPU profile of a mobile load to attribute boot cost;
   (b) load long tasks serving the PRODUCTION (minified) public/ build. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVE = process.env.PERF_SERVE === 'public' ? path.join(ROOT, 'public') : ROOT;
const PORT = 8427;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(SERVE,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = process.env.PERF_PAGES ? process.env.PERF_PAGES.split(',') : ['topics/vectors.html'];
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
if (process.env.PERF_PROFILE === '1') {
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await client.send('Profiler.enable'); await client.send('Profiler.setSamplingInterval', { interval: 200 });
  await client.send('Profiler.start');
  await page.goto(`http://127.0.0.1:${PORT}/topics/vectors.html`, { waitUntil: 'load' });
  await sleep(2500);
  const { profile } = await client.send('Profiler.stop');
  const self = new Map();
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const total = profile.samples.length;
  for (const s of profile.samples) {
    const n = nodes.get(s); if (!n) continue;
    const f = n.callFrame;
    const key = `${f.functionName || '(anon)'} @ ${(f.url || '').split('/').pop()}:${f.lineNumber}`;
    self.set(key, (self.get(key) || 0) + 1);
  }
  const dt = profile.endTime - profile.startTime;
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log('profile span ms:', Math.round(dt / 1000));
  for (const [k, v] of top) console.log(String(Math.round(v / total * 100)).padStart(3) + '%  ' + k);
  await page.close();
} else {
  for (const [pname, prof] of Object.entries({ desktop: { width: 1280, height: 900, dpr: 1, th: 1 }, mobile: { width: 390, height: 844, dpr: 3, th: 4 } })) {
    const line = [];
    for (const url of ['index.html','quiz.html','topics/vectors.html','topics/fluids.html','topics/heat.html','topics/waves.html','topics/current.html']) {
      const page = await browser.newPage();
      const client = await page.createCDPSession();
      await page.setViewport({ width: prof.width, height: prof.height, deviceScaleFactor: prof.dpr, hasTouch: prof.th > 1 });
      if (prof.th > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: prof.th });
      await page.evaluateOnNewDocument(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
      await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
      await sleep(2500);
      const lt = await page.evaluate(() => window.__lt);
      line.push(`${url.replace('topics/','').replace('.html','')}:${lt.filter(x => x > 100).length}(${lt.filter(x => x > 50).length})`);
      await page.close();
    }
    console.log(('PROD ' + pname).padEnd(13), line.join(' '));
  }
}
await browser.close(); server.close();
