/* Repro: is #sim-arena's bounding box oscillating/growing after init? */
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
  if (!b) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8246, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pg.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));
await pg.goto('http://127.0.0.1:8246/topics/fields.html', { waitUntil: 'load' });
await pg.waitForTimeout(1000);
await pg.evaluate(() => window.scrollTo(0, document.getElementById('sim-arena').getBoundingClientRect().top + window.scrollY - 200));
await pg.waitForTimeout(2500); // let whenNear init + entrance run
for (let i = 0; i < 6; i++) {
  const s = await pg.evaluate(() => {
    const c = document.getElementById('sim-arena');
    const r = c.getBoundingClientRect();
    const st = window.EMC.debugStages();
    return { top: +r.top.toFixed(1), h: +r.height.toFixed(1), w: +r.width.toFixed(1), attrW: c.width, attrH: c.height, scrollY: +window.scrollY.toFixed(1), stages: st.map(x => [x.id, x.running, x.raf].join(':')) };
  });
  console.log(JSON.stringify(s));
  await pg.waitForTimeout(400);
}
await browser.close(); server.close(); process.exit(0);
