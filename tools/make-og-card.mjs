/* Regenerate img/og-card.png (1200x630) from the site's own design tokens:
   dark charcoal surface (--bg), warm off-white headings (--text), pink brand
   accent (--pk), electric yellow (--ye), the pastel law chips (--pk/--sk/--ye/
   --li), outline pills (--edge/--text-dim) and the client's mascot art inside
   its canonical cream art frame (.ch-art-frame), with ghost mascots like the
   intro overlay. Renders once in a headless browser and commits the raster:
   edit by re-running this script, never by hand-painting pixels. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILES = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'public', 'shots', 'docs', '.scratch', 'Video', 'tools'].includes(e)) continue;
    const f = path.join(dir, e); const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else FILES.set('/' + path.relative(ROOT, f).split(path.sep).join('/'), fs.readFileSync(f));
  }
})(ROOT);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  const b = FILES.get(u);
  if (!b) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); res.end(b);
});
await new Promise(r => server.listen(8311, '127.0.0.1', r));

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/css/fonts.css">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1200px; height:630px; overflow:hidden; }
  body {
    background:#17181c; color:#edebe3;
    font-family:'G8321','Hiragino Maru Gothic ProN','Segoe UI',system-ui,sans-serif;
    position:relative;
  }
  .ghost { position:absolute; opacity:.14; pointer-events:none; }
  .g1 { left:26px;  top:18px;  width:200px; transform:rotate(-11deg); }
  .g2 { left:318px; top:462px; width:152px; transform:rotate(8deg); }
  .frame {
    position:absolute; left:64px; top:118px; width:402px; height:402px;
    background:#fdf3f6; border:3px solid #33202b; border-radius:18px;
    padding:22px; transform:rotate(-2deg);
    box-shadow:0 18px 40px -18px rgba(0,0,0,.7);
  }
  .frame img { width:100%; height:100%; object-fit:contain; }
  .stack { position:absolute; left:520px; top:76px; width:632px; }
  .eyebrow {
    color:#f8aebe; font-weight:700; font-size:17px; letter-spacing:.18em;
    text-transform:uppercase;
  }
  h1 { font-weight:700; font-size:96px; line-height:1.08; letter-spacing:.01em; margin-top:8px; }
  h1 em { font-style:normal; color:#f8aebe; }
  .sub1 { color:#e9ff47; font-weight:700; font-size:30px; margin-top:12px; }
  .sub2 { color:#b9b7ae; font-size:19px; line-height:1.5; margin-top:8px; max-width:620px; }
  .chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
  .chip {
    color:#17181c; font-weight:700; font-size:20px; line-height:1;
    padding:11px 20px; border-radius:999px;
  }
  .pk { background:#f8aebe; } .sk { background:#a8d3e0; }
  .ye { background:#e9ff47; } .li { background:#d5b8d8; }
  .row2 { display:flex; align-items:center; gap:8px; margin-top:14px; }
  .pill {
    color:#b9b7ae; font-weight:700; font-size:17px; line-height:1;
    border:2px solid #3a3d45; border-radius:999px; padding:8px 16px;
  }
  .cta {
    margin-left:auto; background:#f8aebe; color:#2b1418; font-weight:700;
    font-size:19px; line-height:1; border-radius:999px; padding:11px 20px;
    white-space:nowrap;
  }
  .dot { position:absolute; border-radius:50%; }
  .d1 { left:1128px; top:44px; width:16px; height:16px; background:#f8aebe; }
  .d2 { left:1158px; top:72px; width:12px; height:12px; background:#a8d3e0; }
  .d3 { left:1100px; top:36px; width:10px; height:10px; background:#e9ff47; }
  .hair { position:absolute; left:0; right:0; bottom:0; height:6px; background:#26282f; }
  .hair i { display:block; height:100%; width:238px; background:#a8d3e0; }
</style></head><body>
  <img class="ghost g1" src="/img/mascot-face-focus.png" alt="">
  <img class="ghost g2" src="/img/mascot-face-happy.png" alt="">
  <div class="frame"><img src="/img/mascot-face-sparkle.png" alt=""></div>
  <div class="stack">
    <div class="eyebrow">An interactive electromagnetics tutorial</div>
    <h1>EMC<em>Lab</em></h1>
    <div class="sub1">Real physics. Real fun.</div>
    <div class="sub2">Live simulations, sandboxes &amp; a scored quiz.<br>Every number computed from the real equations.</div>
    <div class="chips">
      <span class="chip pk">Ohm’s law</span>
      <span class="chip sk">Coulomb’s law</span>
      <span class="chip ye">Lorentz force</span>
      <span class="chip li">Faraday’s law</span>
    </div>
    <div class="row2">
      <span class="pill">Circuits</span>
      <span class="pill">Fields</span>
      <span class="pill">Magnetism</span>
      <span class="cta">Start the tutorial</span>
    </div>
  </div>
  <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span>
  <div class="hair"><i></i></div>
</body></html>`;

const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pg.goto('http://127.0.0.1:8311/', { waitUntil: 'load' });
await pg.setContent(HTML, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
const out = path.join(ROOT, 'img', 'og-card.png');
await pg.screenshot({ path: out });
await browser.close(); server.close();
const b = fs.readFileSync(out);
console.log('wrote img/og-card.png', b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), b.length, 'bytes');
