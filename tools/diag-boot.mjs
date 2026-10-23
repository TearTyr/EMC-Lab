import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'archive', 'shots', 'evidence', 'docs', '.scratch'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const b = FILES.get(u);
  if (!b) { console.log('404:', u); res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8244, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
for (const url of ['http://127.0.0.1:8244/index.html', 'http://127.0.0.1:8244/topics/fields.html']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const msgs = [];
  pg.on('pageerror', e => msgs.push('PAGEERROR: ' + String(e).slice(0,120) + ' || STACK: ' + String(e.stack||'').split('\n').slice(0,4).join(' <- ').slice(0,400)));
  pg.on('console', m => { if (['error', 'warning'].includes(m.type())) msgs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 300)); });
  pg.on('requestfailed', r => msgs.push('REQFAIL: ' + r.url() + ' ' + (r.failure() || {}).errorText));
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(2500);
  const state = await pg.evaluate(() => ({
    hasEMC: typeof window.EMC !== 'undefined',
    hasREG: typeof window.EMC_REGISTRY !== 'undefined',
    hasQuiz: typeof window.EMC_QUIZ !== 'undefined',
    hasKatex: typeof window.katex !== 'undefined',
    stages: window.EMC ? window.EMC.debugStages() : null,
    overlay: !!document.getElementById('bootOverlay'),
    detail: document.documentElement.dataset.detail,
    arSel: (document.getElementById('ar-sel') || {}).textContent
  })).catch(e => ({ evalError: String(e).slice(0, 200) }));
  console.log('=====', url);
  console.log(JSON.stringify(state, null, 1));
  console.log('messages:', msgs.length ? msgs : 'none');
  await ctx.close();
}
await browser.close(); server.close(); process.exit(0);
