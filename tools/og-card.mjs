/* Regenerates img/og-card.png (the 1200x630 link-preview card) with Chromium.
   Run: node tools/og-card.mjs   then bump the ?v= on the og:image / twitter:image URLs.
   Chapter and simulation counts come from js/registry.js, so the card cannot drift from the site. */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(root, 'js', 'registry.js'), 'utf8');
let depth = 0, end = -1;   // the registry is pure JSON: cut the object out by matching braces (as tools/build.mjs does)
const start = raw.indexOf('{');
for (let i = start; i < raw.length; i++) {
  if (raw[i] === '{') depth++;
  else if (raw[i] === '}' && !--depth) { end = i; break; }
}
const reg = JSON.parse(raw.slice(start, end + 1));
const sims = reg.chapters.reduce((n, c) => n + c.sims.length, 0);
const law = c => c.title.split(' & ')[1].replace('’', "'").replace(' Law', ' law');   // "Ohm's law", "Coulomb's law"
const u = p => pathToFileURL(join(root, p)).href;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: G; font-weight: 700; src: url(${u('vendor/fonts/g8321-700.woff2')}); }
@font-face { font-family: G; font-weight: 400; src: url(${u('vendor/fonts/g8321-400.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; position: relative; overflow: hidden; background: #17181c; font-family: G, sans-serif; color: #edebe3; }
.ghost { position: absolute; width: 210px; opacity: .1; }
.tile { position: absolute; left: 70px; top: 115px; width: 400px; height: 400px; display: grid; place-items: center;
  background: #fcefaa; border: 5px solid #3a3d45; border-radius: 34px; transform: rotate(-4deg); }
.tile img { width: 330px; }
.txt { position: absolute; left: 540px; top: 170px; }
.brand { font-weight: 700; font-size: 128px; line-height: 1; letter-spacing: .01em; }
.brand b { color: #f8aebe; }
.tag { margin-top: 22px; font-size: 28px; color: #b9b7ae; }
.chips { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 14px; width: 620px; }
.chips i { font-style: normal; font-weight: 700; font-size: 28px; color: #17181c; padding: 10px 26px; border-radius: 999px; }
.url { margin-top: 34px; font-size: 26px; color: #9a988e; }
.dot { position: absolute; border-radius: 50%; }
</style>
<img class="ghost" style="left:-30px;top:-40px" src="${u('img/mascot-face-focus.png')}">
<img class="ghost" style="left:330px;top:440px" src="${u('img/mascot-face-happy.png')}">
<div class="tile"><img src="${u('img/mascot-face-sparkle.png')}"></div>
<div class="txt">
  <div class="brand">EMC<b>Lab</b></div>
  <div class="tag">Circuits &amp; electric fields, hands-on.</div>
  <div class="chips">
    <i style="background:#f8aebe">${law(reg.chapters[0])}</i><i style="background:#a8d3e0">${law(reg.chapters[1])}</i>
    <i style="background:#e9ff47">${sims} simulations</i><i style="background:#d5b8d8">Quiz</i>
  </div>
  <div class="url">${reg.origin.replace('https://', '')}</div>
</div>
<i class="dot" style="left:1100px;top:36px;width:11px;height:11px;background:#e9ff47"></i>
<i class="dot" style="left:1128px;top:44px;width:16px;height:16px;background:#f8aebe"></i>
<i class="dot" style="left:1158px;top:72px;width:12px;height:12px;background:#a8d3e0"></i>`;

const dir = mkdtempSync(join(tmpdir(), 'og-'));
const page = join(dir, 'og.html');
writeFileSync(page, html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(pathToFileURL(page).href);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: join(root, 'img', 'og-card.png') });
await b.close();
console.log('wrote img/og-card.png, ' + reg.chapters.length + ' chapters, ' + sims + ' simulations');
