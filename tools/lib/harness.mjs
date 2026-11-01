/* Shared test harness for tools/verify.mjs and the suites in tools/suites/.
   One static server over the repo (or over public/), one browser per run, one
   ok() that counts per suite. Nothing here is specific to a single suite. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const SKIP_DIRS = new Set(['node_modules', '.git', 'public', 'shots', 'docs', '.scratch', 'Video', 'test']);
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain'
};

/* Serve a directory from memory on an ephemeral port. `rewrite` maps a url path to a file key. */
export async function serve(root = ROOT, { skip = SKIP_DIRS, rewrite = u => u } = {}) {
  const files = new Map(), misses = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir)) {
      if (skip.has(e)) continue;
      const f = path.join(dir, e), st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else files.set('/' + path.relative(root, f).split(path.sep).join('/'), fs.readFileSync(f));
    }
  })(root);
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (u === '/') u = '/index.html';
    const b = files.get(rewrite(u));
    if (!b) { misses.push(u); res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' });
    res.end(b);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { B: 'http://127.0.0.1:' + server.address().port, files, misses, close: () => new Promise(r => server.close(r)) };
}

/* playwright is only needed by the browser suites */
export async function launch(kind = 'chromium') {
  let pw;
  try { pw = await import('playwright'); }
  catch { console.error('playwright not found - run `npm i` and `npx playwright install chromium`'); process.exit(2); }
  if (kind === 'firefox') return pw.firefox.launch();
  if (kind === 'edge') return pw.chromium.launch({ channel: 'msedge', args: ['--disable-dev-shm-usage'] });
  return pw.chromium.launch({ args: ['--disable-dev-shm-usage'] });
}

/* The intro plays on every bare landing load, so suites that are not about it
   dismiss it the way the Skip button does, as soon as intro.js has registered.
   The intro suite deliberately does NOT use this: it tests the real flow. */
export function skipIntroOnLoad() {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.EMC_INTRO) window.EMC_INTRO.dismiss();
  });
}

/* A per-suite context: counters plus everything a suite may need. */
export function context(shared, name) {
  let fails = 0, passes = 0;
  const m0 = shared.srv ? shared.srv.misses.length : 0;
  const h = {
    name, ROOT, fs, path, skipIntroOnLoad,
    B: shared.B, browser: shared.browser, launch,
    ok(n, cond, extra = '') {
      if (cond) { passes++; console.log('ok  ', n, extra ? '- ' + extra : ''); }
      else { fails++; console.log('FAIL', n, extra); }
      return !!cond;
    },
    fail(n = 1, msg) { fails += n; if (msg) console.log('FAIL', msg); },
    failed: () => fails,
    passed: () => passes,
    misses: () => (shared.srv ? shared.srv.misses.slice(m0) : []),
    section: t => console.log('\n-- ' + t),
    serve
  };
  return h;
}
