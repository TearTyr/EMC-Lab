#!/usr/bin/env node
/* One runner for every runtime test.
     node tools/verify.mjs                    the everyday set (jsdom + browser suites)
     node tools/verify.mjs intro a11y         only these suites
     node tools/verify.mjs ui                 a whole group
     node tools/verify.mjs --all              everything, incl. the slow release suites
     node tools/verify.mjs --browser firefox  run the browser suites in firefox | edge | chromium
     node tools/verify.mjs --list             what exists
     node tools/verify.mjs live --url <base>  read-only checks of a deployed site (also: landing)
   Suites live in tools/suites/<group>.mjs (a suite is `{ about, browser, run(h) }`);
   tools/lib/harness.mjs gives them one server, one browser and a counting ok().
   Static checks are `node tools/check.mjs`, the production build is `node tools/build.mjs`. */
import { serve, launch, context } from './lib/harness.mjs';

const GROUPS = ['jsdom', 'page', 'ui', 'features', 'release'];
const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const browserKind = flag('--browser') || 'chromium';
const remoteUrl = flag('--url');         /* a deployed site instead of the local server: only suites marked remote may run */
const all = args.includes('--all'), list = args.includes('--list');
const wanted = args.filter(a => !a.startsWith('--'));

const registry = [];        /* { name, group, about, browser, slow, run } in group order */
for (const g of GROUPS) {
  const mod = await import(`./suites/${g}.mjs`);
  for (const [name, s] of Object.entries(mod.suites)) registry.push({ name, group: g, ...s });
}

if (list) {
  for (const s of registry) console.log(s.name.padEnd(12), s.group.padEnd(9), (s.slow ? '[slow] ' : '') + (s.remote ? '[remote] ' : '') + s.about);
  process.exit(0);
}

const picked = wanted.length
  ? registry.filter(s => wanted.includes(s.name) || wanted.includes(s.group))
  : registry.filter(s => all || !s.slow);
const unknown = wanted.filter(w => !registry.some(s => s.name === w || s.group === w));
if (unknown.length) { console.error('unknown suite/group:', unknown.join(', '), '(try --list)'); process.exit(2); }

if (remoteUrl) {
  const local = picked.filter(s => !s.remote).map(s => s.name);
  if (local.length) { console.error('--url runs remote suites only; these need the local files:', local.join(', ')); process.exit(2); }
  if (!picked.length) { console.error('--url needs at least one remote suite (try: live landing)'); process.exit(2); }
}
const shared = {};
if (picked.some(s => s.browser)) {
  if (remoteUrl) shared.B = remoteUrl.replace(/\/+$/, '');
  else { shared.srv = await serve(); shared.B = shared.srv.B; }
  shared.browser = await launch(browserKind);
}

const results = [];
for (const s of picked) {
  console.log('\n==== ' + s.name + ' - ' + s.about);
  const h = context(shared, s.name), t0 = Date.now();
  try { await s.run(h); }
  catch (e) { h.fail(1, 'suite crashed: ' + (e && e.stack || e)); }
  results.push({ name: s.name, pass: h.passed(), fail: h.failed(), sec: ((Date.now() - t0) / 1000).toFixed(1) });
}

if (shared.browser) await shared.browser.close();
if (shared.srv) await shared.srv.close();

console.log('\n==== summary');
for (const r of results) console.log((r.fail ? 'FAIL ' : 'ok   ') + r.name.padEnd(12), String(r.pass).padStart(4) + ' passed', String(r.fail).padStart(3) + ' failed', r.sec + ' s');
const bad = results.filter(r => r.fail);
console.log(bad.length ? `\n${bad.length} of ${results.length} suites FAILED: ${bad.map(r => r.name).join(', ')}` : `\nall ${results.length} suites passed`);
process.exit(bad.length ? 1 : 0);
