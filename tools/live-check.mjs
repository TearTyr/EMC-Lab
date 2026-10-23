import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
const msgs = [], reqs = [];
pg.on('pageerror', e => msgs.push('PAGEERROR: ' + String(e).slice(0, 140)));
pg.on('console', m => { if (m.type() === 'error') msgs.push('console: ' + m.text().slice(0, 140)); });
pg.on('request', r => reqs.push(new URL(r.url()).origin));
await pg.goto('https://emc-lab.vercel.app/', { waitUntil: 'load' });
await pg.waitForTimeout(3000);
const state = await pg.evaluate(() => ({
  hasEMC: typeof window.EMC !== 'undefined',
  overlay: !!document.getElementById('bootOverlay'),
  statQuestions: (document.getElementById('statQuestions') || {}).textContent
}));
console.log(JSON.stringify(state));
console.log('origins:', [...new Set(reqs)]);
console.log('errors:', msgs.slice(0, 6));
await pg.screenshot({ path: 'evidence/baseline/live-home.png' });
await browser.close(); process.exit(0);
