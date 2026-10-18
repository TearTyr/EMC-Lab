#!/usr/bin/env node
/* DEV ONLY — focused Phase-0 probes: in-view loop counts, hidden-tab response,
   rAF callback sources, per-interaction frame breakdown. No app changes. */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8421;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); res.end(d); }); }).listen(PORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function instrument() {
  const P = window.__perf = { pending: () => [...pend.entries()].map(([id, src]) => src), longtasks: [] };
  const pend = new Map();
  const oRAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { const src = String(cb).slice(0, 60).replace(/\s+/g, ' ');
    const id = oRAF(t => { pend.delete(id); cb(t); }); pend.set(id, src); return id; };
  const oCAF = window.cancelAnimationFrame.bind(window);
  window.cancelAnimationFrame = id => { pend.delete(id); oCAF(id); };
}
async function sample(page, ms) { const out = []; for (let i = 0; i < Math.round(ms/150); i++) { out.push(await page.evaluate(() => window.__perf.pending())); await sleep(150); }
  const max = out.reduce((m, s) => Math.max(m, s.length), 0); const srcs = [...new Set(out.flat())]; return { max, srcs }; }
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--enable-precise-memory-info'] });
const results = {};
for (const url of ['index.html','topics/vectors.html','topics/fluids.html','topics/heat.html','topics/waves.html','topics/current.html']) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(instrument);
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' }); await sleep(3000);
  const top = await sample(page, 1500);
  await page.evaluate(() => { const c = document.querySelector('.sim-canvas'); if (c) c.scrollIntoView({ block: 'center' }); });
  await sleep(1200);
  const inview = await sample(page, 2400);
  await page.evaluate(() => { Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'}); Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(700);
  const hidden = await sample(page, 2400);
  await page.evaluate(() => { Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'}); Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}); document.dispatchEvent(new Event('visibilitychange')); });
  results[url] = { atTop: top.max, simInview: inview.max, hiddenWhileInview: hidden.max, loopSources: inview.srcs };
  console.log(url.padEnd(22), 'top:', top.max, ' in-view:', inview.max, ' hidden(in-view):', hidden.max, ' sources:', JSON.stringify(inview.srcs.slice(0,3)));
  await page.close();
}
/* per-interaction frame breakdown, mobile profile, worst page */
{
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`http://127.0.0.1:${PORT}/topics/current.html`, { waitUntil: 'load' }); await sleep(3500);
  const framesAround = async (fn, tag) => {
    await page.evaluate(() => { window.__f = []; window.__on = true; const o = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => o(t => { if (window.__on && window.__f.length) window.__f.push(t - window.__f[window.__f.length-1] > 0 ? t - window.__last : t); window.__last = t; cb(t); }); });
    await page.evaluate(() => { window.__f = []; window.__last = performance.now(); });
    await fn();
    await sleep(600);
    const d = await page.evaluate(() => { window.__on = false; return window.__f.filter(x => x > 0 && x < 5000); });
    d.sort((a,b)=>a-b);
    console.log(tag.padEnd(18), 'frames:', d.length, 'p50:', d[Math.floor(d.length/2)]?.toFixed(1), 'p95:', d[Math.floor(0.95*(d.length-1))]?.toFixed(1), 'max:', d[d.length-1]?.toFixed(1));
  };
  await page.evaluate(() => document.querySelector('#sim-ohm').scrollIntoView({ block: 'center' })); await sleep(1000);
  await framesAround(async () => { await sleep(1500); }, 'idle-in-view');
  const slider = await page.$('#ohm-V'); const bb = await slider.boundingBox();
  await framesAround(async () => { await page.mouse.move(bb.x+bb.width*0.3, bb.y+bb.height/2); await page.mouse.down();
    for (let i=0;i<=12;i++){ await page.mouse.move(bb.x+bb.width*(0.3+0.05*i), bb.y+bb.height/2); await sleep(30);} await page.mouse.up(); }, 'slider-drag');
  const cb = await (await page.$('#sim-ohm')).boundingBox();
  await framesAround(async () => { await page.mouse.move(cb.x+cb.width/2, cb.y+cb.height/2); await page.mouse.down();
    for (let i=0;i<=10;i++){ await page.mouse.move(cb.x+cb.width/2+i*5, cb.y+cb.height/2-i*4); await sleep(30);} await page.mouse.up(); }, 'canvas-area-drag');
  await framesAround(async () => { const s = await page.$('#circ-topology .seg-btn:nth-child(2)'); if (s) await s.click(); }, 'topology-switch');
  await page.close();
}
fs.writeFileSync(path.join(ROOT,'docs','perf-data','probe-baseline.json'), JSON.stringify(results, null, 2));
await browser.close(); server.close();
