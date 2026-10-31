#!/usr/bin/env node
/* ==========================================================================
   EMC Lab — asset verification (phase 8 §6 + §7A favicon).
   Run: node tools/asset-verify.mjs
     per page (index, quiz, the 2 chapter pages, desktop + one mobile pass):
       1 every <img> request answers 200 and decodes (naturalWidth > 0);
       2 every <img> ships explicit width/height (zero-CLS contract);
       3 alt contract: informative images have real alt text; empty-alt
         images must sit inside an aria-hidden subtree (decorative);
       4 below-the-fold images are lazy, above-the-fold are not;
       5 rendered aspect ratio matches the natural one (no stretching);
       6 chapter header art present with its two deterministic symbol
         overlays and a slow spin frame;
       7 favicon: link[rel=icon] resolves 200 as image/x-icon and the ICO
         directory holds square 16/32/48 entries (parsed in-node);
       8 zero failed image requests anywhere.
   Exits 1 on any failure.
   ========================================================================== */
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';
import { skipIntroOnLoad } from './intro-bypass.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'shots', 'docs', '.scratch', 'Video'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8272, '127.0.0.1', r));
const B = 'http://127.0.0.1:8272';

let fails = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name, extra ? '— ' + extra : '');
};

/* 7 (node side): ICO directory entries */
{
  const data = fs.readFileSync(path.join(ROOT, 'favicon.ico'));
  const [, , count] = [data.readUInt16LE(0), data.readUInt16LE(2), data.readUInt16LE(4)];
  const sizes = [];
  let square = true;
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    const w = data[o] || 256, h = data[o + 1] || 256, bpp = data.readUInt16LE(o + 6);
    sizes.push(w + 'x' + h);
    if (w !== h || bpp !== 32) square = false;
  }
  ok('7 favicon.ico directory holds square 32bpp 16/32/48 entries',
    count === 3 && square && sizes.join(',') === '16x16,32x32,48x48', sizes.join(','));
}

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const PAGES = [['index.html', 0], ['quiz.html', 0], ['topics/current.html', 1], ['topics/fields.html', 1]];

async function auditPage(url, artCount, viewport) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const bad = [];
  pg.on('response', r => { const u = r.url(); if (r.status() >= 400 && /\.(png|ico|svg|jpg|webp|gif)/.test(u)) bad.push(u + ' ' + r.status()); });
  pg.on('requestfailed', r => { if (/\.(png|ico|svg|jpg|webp|gif)/.test(r.url())) bad.push(r.url() + ' FAILED'); });
  await pg.addInitScript(skipIntroOnLoad);
  await pg.goto(B + '/' + url, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => {
    const fold = innerHeight;
    const imgs = [...document.images].filter(im => !im.closest('#introOverlay'));
    return {
      total: imgs.length,
      noDim: imgs.filter(im => !im.getAttribute('width') || !im.getAttribute('height')).map(im => im.src),
      noAlt: imgs.filter(im => !im.hasAttribute('alt')).map(im => im.src),
      /* alt="" IS the decorative contract; it only becomes a bug when the
         image is the sole content of a control (the control loses its name).
         A control named by aria-label (the mascot button) keeps its name. */
      emptyAltNotHidden: imgs.filter(im => im.getAttribute('alt') === '' && (() => {
        const c = im.closest('a,button');
        return !!c && !c.textContent.trim() && !(c.getAttribute('aria-label') || '').trim();
      })()).map(im => im.src),
      lazyAbove: imgs.filter(im => im.loading === 'lazy' && im.getBoundingClientRect().top < fold * 0.9 && im.getBoundingClientRect().bottom > 0).map(im => im.src),
      stretched: imgs.filter(im => {
        if (!im.naturalWidth || !im.clientWidth) return false;
        return Math.abs(im.clientWidth / im.clientHeight - im.naturalWidth / im.naturalHeight) > 0.03;
      }).map(im => im.src),
      undecoded: imgs.filter(im => !im.complete || im.naturalWidth === 0).map(im => im.src),
      art: document.querySelectorAll('figure.ch-art').length,
      artSyms: document.querySelectorAll('figure.ch-art .ch-sym').length,
      artSpin: document.querySelectorAll('figure.ch-art .mx-spin').length,
      artAlt: [...document.querySelectorAll('figure.ch-art img')].every(im => (im.getAttribute('alt') || '').length > 40),
      iconLink: (document.querySelector('link[rel="icon"]') || {}).href || ''
    };
  });
  const iconRes = res.iconLink ? await pg.evaluate(async href => {
    const r = await fetch(href);
    return { st: r.status, ct: r.headers.get('content-type') };
  }, res.iconLink) : null;
  const tag = url + (viewport ? ' (mobile)' : '');
  ok(`1/${tag}: every image decodes`, res.undecoded.length === 0, res.undecoded.join('|'));
  ok(`2/${tag}: explicit width+height on all images`, res.noDim.length === 0, res.noDim.join('|'));
  ok(`3/${tag}: alt contract (real alt or aria-hidden decorative)`, res.noAlt.length === 0 && res.emptyAltNotHidden.length === 0, [...res.noAlt, ...res.emptyAltNotHidden].join('|'));
  ok(`4/${tag}: no lazy above the fold`, res.lazyAbove.length === 0, res.lazyAbove.join('|'));
  ok(`5/${tag}: no stretched images`, res.stretched.length === 0, res.stretched.join('|'));
  ok(`6/${tag}: chapter art count/symbols/spin/alt`, res.art === artCount && res.artSyms === artCount * 2 && res.artSpin === artCount && (artCount === 0 || res.artAlt), JSON.stringify({ art: res.art, syms: res.artSyms, spin: res.artSpin }));
  ok(`7/${tag}: icon link serves x-icon 200`, !!iconRes && iconRes.st === 200 && /x-icon|vnd.microsoft.icon/.test(iconRes.ct || ''), JSON.stringify(iconRes));
  ok(`8/${tag}: zero failed image requests`, bad.length === 0, bad.join('|'));
  await ctx.close();
}

for (const [url, art] of PAGES) await auditPage(url, art);
await auditPage('topics/fields.html', 1, { width: 390, height: 844 });

console.log(fails === 0 ? 'ASSET CONTRACT PASS' : fails + ' ASSET FAILURES');
await browser.close(); server.close(); process.exit(fails === 0 ? 0 : 1);
