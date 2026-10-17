#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — performance measurement harness (DEV ONLY, never shipped)
   File: tools/perf-measure.mjs

   Usage:
     node tools/perf-measure.mjs measure   # full baseline/after matrix -> docs/perf-data/<label>.json
     node tools/perf-measure.mjs shots before|after
     node tools/perf-measure.mjs session   # 10-minute memory-growth run
     node tools/perf-measure.mjs rss       # per-tab process-RSS delta (desktop)
   Env:
     PERF_LABEL=name    output file / shot folder suffix (default: baseline|after)

   Measures, per page and profile (desktop 1280x900 DPR1 / mobile 390x844 DPR3
   CPU 4x): JS heap, DOM nodes, listener counts, canvas backing-store bytes,
   active rAF chains (idle / offscreen / hidden-probe), long tasks, interaction
   frame times + INP proxy, network transfer, AudioContext constructions.

   Methodology notes and limitations are recorded in docs/PERF.md.
   This file is dev-only: tools/ is not part of the public build allow-list.
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv[2] || 'measure';
const LABEL = process.env.PERF_LABEL || (MODE === 'shots' ? (process.argv[3] || 'before') : 'baseline');
const PORT = 8420;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };

const PAGES = ['index.html', 'quiz.html', 'topics/current.html', 'topics/efield.html', 'topics/magind.html'];
const PROFILES = {
  desktop: { width: 1280, height: 900, dpr: 1, throttle: 1, touch: false },
  mobile: { width: 390, height: 844, dpr: 3, throttle: 4, touch: true },
};

/* ------------------------------------------------------------- static server */
function serve() {
  const server = http.createServer((req, res) => {
    let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (f.endsWith('/')) f += 'index.html';
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); res.end('nf'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  });
  return new Promise(r => server.listen(PORT, () => r(server)));
}

/* ------------------------------------------------- in-page instrumentation */
function instrument() {
  const P = window.__perf = { rafPending: () => pending.size, longtasks: [], events: [], frames: [], sampling: false, audioCtx: 0 };
  const pending = new Set();
  const oRAF = window.requestAnimationFrame.bind(window);
  const oCAF = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => {
    const id = oRAF(t => { pending.delete(id); if (P.sampling) { const last = P.frames.length ? P.frames[P.frames.length - 1] : t; P.frames.push(t); } cb(t); });
    pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { pending.delete(id); oCAF(id); };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const Wrapped = function (...a) { P.audioCtx++; return new AC(...a); };
    Wrapped.prototype = AC.prototype;
    window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
  }
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) P.longtasks.push({ at: Math.round(e.startTime), dur: Math.round(e.duration) }); })
      .observe({ type: 'longtask', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) P.events.push({ name: e.name, dur: Math.round(e.duration), delay: Math.round(e.processingStart - e.startTime) }); })
      .observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (e) {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const MB = b => +(b / 1048576).toFixed(2);

/* ------------------------------------------------------------------ helpers */
async function listenerCount(client, expr) {
  try {
    const { result } = await client.send('Runtime.evaluate', { expression: expr });
    if (!result.objectId) return 0;
    const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    return listeners.length;
  } catch (e) { return -1; }
}
async function sampleRaf(page, ms) {
  const samples = [];
  const n = Math.max(1, Math.round(ms / 120));
  for (let i = 0; i < n; i++) { samples.push(await page.evaluate(() => window.__perf.rafPending())); await sleep(120); }
  return Math.max(...samples);
}
function p95(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return +s[Math.floor(0.95 * (s.length - 1))].toFixed(1); }

async function measurePage(browser, url, profile, name) {
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Performance.enable');
  await client.send('Network.enable');
  await page.evaluateOnNewDocument(instrument);
  await page.setViewport({ width: profile.width, height: profile.height, deviceScaleFactor: profile.dpr, hasTouch: profile.touch });
  if (profile.throttle !== 1) await client.send('Emulation.setCPUThrottlingRate', { rate: profile.throttle });

  const transfer = { bytes: 0, requests: 0 };
  client.on('Network.loadingFinished', p => { transfer.bytes += p.encodedDataLength || 0; });
  client.on('Network.responseReceived', () => { transfer.requests++; });

  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;
  await sleep(3500);                                   // settle: fonts, katex, sim warm-up

  const heap = await page.evaluate(() => performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize } : null);
  const metrics = (await client.send('Performance.getMetrics')).metrics.reduce((m, x) => (m[x.name] = x.value, m), {});
  const domNodes = await page.evaluate(() => document.getElementsByTagName('*').length);
  const canvases = await page.evaluate(() => [...document.querySelectorAll('canvas')].map(c => {
    const r = c.getBoundingClientRect();
    return { id: c.id || '(anon)', cssW: Math.round(r.width), cssH: Math.round(r.height), devW: c.width, devH: c.height, bytes: c.width * c.height * 4 };
  }));
  const backing = canvases.reduce((s, c) => s + c.bytes, 0);
  const lis = {
    window: await listenerCount(client, 'window'),
    document: await listenerCount(client, 'document'),
    canvases: await listenerCount(client, '[...document.querySelectorAll("canvas")].length ? document.querySelectorAll("canvas")[0] : null'),
  };

  const rafIdle = await sampleRaf(page, 2400);

  // offscreen: scroll everything away
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(900);
  const rafOffscreen = await sampleRaf(page, 2400);

  // hidden probe: fake visibilitychange (tests OUR listeners; Chrome's own
  // rAF throttling for real hidden tabs is browser-level and noted in PERF.md)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await sleep(600);
  const rafHidden = await sampleRaf(page, 1800);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.scrollTo(0, 0);
  });
  await sleep(500);

  // ---------------- interactions with frame sampling ----------------
  await page.evaluate(() => { window.__perf.frames = []; window.__perf.sampling = true; });
  const interactions = [];
  const slider = await page.$('input[type="range"]');
  if (slider) {
    const bb = await slider.boundingBox();
    if (bb) {
      await page.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height / 2);
      await page.mouse.down();
      for (let i = 0; i <= 15; i++) { await page.mouse.move(bb.x + bb.width * (0.3 + 0.04 * i), bb.y + bb.height / 2); await sleep(30); }
      await page.mouse.up();
      interactions.push('slider-drag');
    }
  }
  const dragCanvas = await page.$('#sim-ohm, #sim-efield, #sim-lorentz');
  if (dragCanvas) {
    const bb = await dragCanvas.boundingBox();
    if (bb) {
      await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), await page.evaluateHandle(c => c, dragCanvas).then(h => h.asElement()?.evaluate(e => '#' + e.id).catch(() => null)) || '#sim-ohm');
      await sleep(400);
      const bb2 = await dragCanvas.boundingBox();
      await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
      await page.mouse.down();
      for (let i = 0; i <= 12; i++) { await page.mouse.move(bb2.x + bb2.width / 2 + i * 6, bb2.y + bb2.height / 2 - i * 3); await sleep(30); }
      await page.mouse.up();
      interactions.push('canvas-drag');
    }
  }
  if (url.includes('quiz')) {
    const opt = await page.$('.opt');
    if (opt) { await opt.click(); interactions.push('quiz-option'); }
    const filt = await page.$('[data-quiz-filter="efield"]');
    if (filt) { await filt.click(); interactions.push('quiz-filter'); }
  }
  const seg = await page.$('.seg-btn');
  if (seg) { await seg.click(); interactions.push('segment'); }
  await sleep(400);
  const frameData = await page.evaluate(() => { window.__perf.sampling = false; const f = window.__perf.frames; const d = []; for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]); return d; });
  const perfState = await page.evaluate(() => ({ longtasks: window.__perf.longtasks, events: window.__perf.events, audioCtx: window.__perf.audioCtx }));
  const inp = perfState.events.length ? Math.max(...perfState.events.map(e => e.dur)) : 0;

  await page.close();
  return {
    page: url, profile: name,
    loadMs,
    heapUsedMB: heap ? MB(heap.used) : null, heapTotalMB: heap ? MB(heap.total) : null,
    domNodes, metricsNodes: metrics.Nodes || null,
    listeners: lis,
    canvasCount: canvases.length, canvases,
    backingStoreMB: MB(backing),
    rafIdle, rafOffscreen, rafHiddenProbe: rafHidden,
    longTasksOver50: perfState.longtasks.filter(t => t.dur > 50).length,
    longTasksOver100: perfState.longtasks.filter(t => t.dur > 100).length,
    worstLongTaskMs: perfState.longtasks.length ? Math.max(...perfState.longtasks.map(t => t.dur)) : 0,
    frameP95Ms: p95(frameData), frameSamples: frameData.length,
    inpProxyMs: inp, interactions,
    audioContexts: perfState.audioCtx,
    requests: transfer.requests, transferKB: +(transfer.bytes / 1024).toFixed(1),
  };
}

/* ------------------------------------------------------------------- shots */
async function shots(browser) {
  const dir = path.join(ROOT, 'docs', 'perf-shots', LABEL);
  fs.mkdirSync(dir, { recursive: true });
  for (const [pname, profile] of Object.entries(PROFILES)) {
    for (const url of PAGES) {
      console.log('shot:', pname, url);
      const page = await browser.newPage();
      page.setDefaultTimeout(20000);
      await page.setViewport({ width: profile.width, height: profile.height, deviceScaleFactor: profile.dpr === 3 ? 1 : 1, hasTouch: profile.touch });
      if (profile.throttle !== 1) await (await page.createCDPSession()).send('Emulation.setCPUThrottlingRate', { rate: profile.throttle });
      await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
      await sleep(2500);
      // scroll through so lazy sims initialise before the full-page capture
      try {
        const h = await page.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < h; y += 700) { await page.evaluate(yy => window.scrollTo(0, yy), y); await sleep(140); }
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(1200);
      } catch (e) { console.log('scroll-through skipped:', String(e).slice(0, 80)); }
      const tag = url.replace(/\.html$/, '').replace('topics/', '').replace('index', 'home');
      await page.screenshot({ path: path.join(dir, `${tag}-${profile.width}.jpg`), type: 'jpeg', quality: 72, fullPage: true });
      await page.close();
    }
  }
  console.log('shots ->', dir);
}

/* ----------------------------------------------------------------- session */
async function session(browser) {
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('HeapProfiler.enable');
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(instrument);
  await page.goto(`http://127.0.0.1:${PORT}/topics/current.html`, { waitUntil: 'load' });
  await sleep(3000);
  const sample = async () => {
    await client.send('HeapProfiler.collectGarbage');
    const h = await page.evaluate(() => performance.memory.usedJSHeapSize);
    const raf = await sampleRaf(page, 600);
    return { t: Math.round((Date.now() - t0) / 1000), heapMB: MB(h), raf };
  };
  const t0 = Date.now();
  const series = [await sample()];
  const sliders = await page.$$('input[type="range"]');
  let step = 0;
  while (Date.now() - t0 < 600000) {
    // representative activity: scroll, keyboard-step a slider, toggle a segment
    await page.evaluate(s => window.scrollTo(0, s), (step % 6) * 700);
    if (sliders.length) {
      const s = sliders[step % sliders.length];
      await s.focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    }
    const segs = await page.$$('.seg-btn');
    if (segs.length) await segs[step % segs.length].click().catch(() => {});
    await sleep(4200);
    step++;
    if (step % 7 === 0) series.push(await sample());
  }
  series.push(await sample());
  fs.mkdirSync(path.join(ROOT, 'docs', 'perf-data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'perf-data', `session-${LABEL}.json`), JSON.stringify(series, null, 2));
  console.log(JSON.stringify(series));
  await page.close();
}

/* ------------------------------------------------------- per-tab RSS delta */
function chromeRSS() {
  let total = 0;
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const cmd = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8');
      if (!/chrome|headless_shell/.test(cmd)) continue;
      const statm = fs.readFileSync(`/proc/${d}/statm`, 'utf8').split(' ');
      total += parseInt(statm[1], 10) * 4096;          // resident set
    } catch (e) {}
  }
  return total;
}
async function rss(browser) {
  const out = [];
  const blank = chromeRSS();
  for (const url of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
    await sleep(3000);
    const now = chromeRSS();
    out.push({ page: url, deltaMB: MB(now - blank), totalMB: MB(now) });
    await page.close();
    await sleep(800);
  }
  console.log(JSON.stringify({ note: 'delta vs idle browser (all chrome processes RSS); includes renderer+GPU+shared services, not isolated per-tab', rows: out }, null, 2));
}

/* ------------------------------------------------- animation-loop guard */
/* Enforced, reliably-measurable lifecycle invariants (desktop profile):
   1. a boot-visible canvas runs exactly ONE rAF chain (no double scheduling)
   2. a synthetic hidden tab stops every chain (visibilitychange honoured)
   3. a live sim (lorentz orbit) keeps exactly one chain in view
   4. an essential-motion sim (circuit dots) keeps exactly one chain in view
   Memory is reported informationally here; only loop invariants fail CI. */
async function guard(browser) {
  const fails = [];
  const check = (name, actual, expected) => {
    const ok = actual === expected;
    console.log(`${ok ? '  \u2713' : '  \u2717'} ${name}: ${actual} (expected ${expected})`);
    if (!ok) fails.push(name);
  };
  const openPage = async url => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      const pend = new Set();
      window.__perf = { rafPending: () => pend.size };
      const o = window.requestAnimationFrame.bind(window);
      const c = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => { const id = o(t => { pend.delete(id); cb(t); }); pend.add(id); return id; };
      window.cancelAnimationFrame = id => { pend.delete(id); c(id); };
    });
    await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
    await sleep(2500);
    return page;
  };
  const hiddenProbe = async page => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await sleep(700);
    const n = await sampleRaf(page, 1200);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    return n;
  };
  console.log('\n[animation-loop guard]');
  {
    const page = await openPage('index.html');
    check('home boot-visible chains = 1', await sampleRaf(page, 1500), 1);
    check('home hidden chains = 0', await hiddenProbe(page), 0);
    const heap = await page.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(2) : null);
    console.log(`  \u2139 home heap (informational): ${heap} MB`);
    await page.close();
  }
  {
    const page = await openPage('topics/magind.html');
    await page.evaluate(() => document.querySelector('#sim-lorentz').scrollIntoView({ block: 'center' }));
    await sleep(4000);                                   // let the orbit run
    check('live lorentz sim keeps exactly 1 chain when visible', await sampleRaf(page, 1500), 1);
    check('magind hidden chains = 0', await hiddenProbe(page), 0);
    await page.close();
  }
  {
    const page = await openPage('topics/current.html');
    await page.evaluate(() => document.querySelector('#sim-circuit').scrollIntoView({ block: 'center' }));
    await sleep(1500);
    check('essential motion keeps 1 chain', await sampleRaf(page, 1500), 1);
    await page.close();
  }
  for (const url of ['index.html', 'topics/current.html']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'load' });
    await sleep(3000);
    const cls = await page.evaluate(() => +window.__cls.toFixed(4));
    const okCls = cls < 0.01;
    console.log(`${okCls ? '  \u2713' : '  \u2717'} unexpected CLS on ${url}: ${cls} (< 0.01)`);
    if (!okCls) fails.push('cls:' + url);
    // sticky header must never swallow an anchor target
    const clear = await page.evaluate(() => {
      const el = document.querySelector('[id][class*="h-sec"], #check, #ohm');
      if (!el) return true;
      el.scrollIntoView();
      const hb = document.querySelector('.site-header').getBoundingClientRect().bottom;
      return el.getBoundingClientRect().top >= hb - 2;
    });
    const okAnchor = clear === true;
    console.log(`${okAnchor ? '  \u2713' : '  \u2717'} anchor targets clear the sticky header on ${url}`);
    if (!okAnchor) fails.push('anchor:' + url);
    await page.close();
  }
  if (fails.length) { console.error(`guard FAILED: ${fails.join(', ')}`); process.exit(1); }
  console.log('guard OK');
}

/* -------------------------------------------------------------------- main */
const server = await serve();
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--enable-precise-memory-info', '--disable-background-timer-throttling'] });
const version = await browser.version();
console.log('browser:', version);

if (MODE === 'guard') await guard(browser);
else if (MODE === 'shots') await shots(browser);
else if (MODE === 'session') await session(browser);
else if (MODE === 'rss') await rss(browser);
else {
  const rows = [];
  for (const [pname, profile] of Object.entries(PROFILES)) {
    for (const url of PAGES) {
      const row = await measurePage(browser, url, profile, pname);
      rows.push(row);
      console.log(`${pname.padEnd(7)} ${url.padEnd(22)} heap ${String(row.heapUsedMB).padStart(7)} MB  nodes ${String(row.domNodes).padStart(5)}  backing ${String(row.backingStoreMB).padStart(6)} MB  raf idle/off/hidden ${row.rafIdle}/${row.rafOffscreen}/${row.rafHiddenProbe}  LT>100 ${row.longTasksOver100}  frameP95 ${String(row.frameP95Ms).padStart(5)} ms  INPpx ${String(row.inpProxyMs).padStart(4)}  xfer ${row.transferKB} KB`);
    }
  }
  fs.mkdirSync(path.join(ROOT, 'docs', 'perf-data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'perf-data', `${LABEL}.json`), JSON.stringify({ browser: version, profiles: PROFILES, rows }, null, 2));
  console.log('wrote docs/perf-data/' + LABEL + '.json');
}
await browser.close();
server.close();
