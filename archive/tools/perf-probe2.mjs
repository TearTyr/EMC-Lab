#!/usr/bin/env node
/* DEV ONLY — mobile long-task attribution + per-tab RSS delta. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8422;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function instrument() {
  window.__perf = { longtasks: [], marks: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) {
    const src = e.attribution && e.attribution.length ? e.attribution.map(a => a.name + ':' + (a.containerType||'')).join(',') : '';
    window.__perf.longtasks.push({ at: Math.round(e.startTime), dur: Math.round(e.duration), src });
  } }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  window.__mark = t => window.__perf.marks.push({ t, at: Math.round(performance.now()) });
}
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--enable-precise-memory-info'] });
{ /* mobile long-task attribution on the worst page */
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluateOnNewDocument(instrument);
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8422/topics/current.html', { waitUntil: 'load' });
  await page.evaluate(() => window.__mark('load-event'));
  await sleep(3000);
  await page.evaluate(() => { document.querySelector('#sim-ohm').scrollIntoView({ block: 'center' }); window.__mark('sim-in-view'); });
  await sleep(2000);
  const slider = await page.$('#ohm-V'); const bb = await slider.boundingBox();
  await page.evaluate(() => window.__mark('slider-start'));
  await page.mouse.move(bb.x + bb.width*0.3, bb.y + bb.height/2); await page.mouse.down();
  for (let i=0;i<=12;i++){ await page.mouse.move(bb.x + bb.width*(0.3+0.05*i), bb.y + bb.height/2); await sleep(30); }
  await page.mouse.up();
  await page.evaluate(() => window.__mark('slider-end'));
  await sleep(1500);
  await page.evaluate(() => window.__mark('topology-start'));
  const seg = await page.$('#circ-topology .seg-btn:nth-child(2)'); if (seg) await seg.click();
  await page.evaluate(() => window.__mark('topology-end'));
  await sleep(1500);
  const out = await page.evaluate(() => window.__perf);
  console.log('MOBILE current.html longtasks:', JSON.stringify(out.longtasks));
  console.log('marks:', JSON.stringify(out.marks));
  await page.close();
}
{ /* per-tab RSS delta, desktop */
  const rows = [];
  const readRSS = () => { let total = 0;
    for (const d of fs.readdirSync('/proc')) { if (!/^\d+$/.test(d)) continue;
      try { const cmd = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8'); if (!/chrome|headless_shell/.test(cmd)) continue;
        const statm = fs.readFileSync(`/proc/${d}/statm`, 'utf8').split(' '); total += parseInt(statm[1],10)*4096; } catch (e) {} }
    return total; };
  await sleep(1000);
  const blank = readRSS();
  for (const url of ['index.html','quiz.html','topics/current.html','topics/fluids.html']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: heightFix(), deviceScaleFactor: 1 });
    function heightFix(){ return 900; }
    await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
    await sleep(3000);
    const now = readRSS();
    rows.push({ page: url, deltaMB: +((now-blank)/1048576).toFixed(1), allChromeMB: +(now/1048576).toFixed(1) });
    await page.close(); await sleep(1000);
  }
  console.log('RSS (all chrome processes; delta vs idle browser):', JSON.stringify(rows));
  fs.writeFileSync(path.join(ROOT,'docs','perf-data','probe2-baseline.json'), JSON.stringify({ mobileLongtasks: rows }, null, 2));
}
await browser.close(); server.close();
