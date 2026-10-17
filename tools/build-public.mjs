#!/usr/bin/env node
/**
 * tools/build-public.mjs — assemble the Vercel output directory (public/).
 *
 * Why this exists
 * ---------------
 * The Vercel project has Output Directory = "public" stored in the dashboard.
 * vercel.json now pins "outputDirectory": "public" too (per Vercel's docs the
 * vercel.json value overrides the dashboard setting), and this script makes
 * that promise true: after `bun run build` a fresh public/ folder contains the
 * complete static site, so the build can never fail with
 * "No Output Directory named 'public' found after the Build completed".
 *
 * What it does
 * ------------
 *  1. deletes any previous public/ (always a clean rebuild),
 *  2. copies the runtime allow-list into it:
 *       index.html, quiz.html, topics/, css/, js/, vendor/, img/
 *       (dev docs such as README/TESTING stay in the repo, not on the site),
 *  3. prunes dev-only files that ride inside copied dirs (css/input.css, .gitkeep),
 *  4. verifies every required asset exists AND every local href/src in every
 *     copied .html resolves inside public/ — a broken deploy fails the build
 *     here instead of shipping a broken site,
 *  5. prints a size/file-count summary. Exit 0 = deployable, 1 = broken.
 *
 * public/ is gitignored: it is a build artifact, never committed.
 * Run it via `bun run build:public` (or `bun run build` = build:css + this).
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash as _createHash } from 'node:crypto';
const nodeCrypto = { createHash: _createHash };
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'public');

/* ------------------------------------------------------------------ config */

// Active pages come from the single registry (js/registry.js) - never a
// hand-maintained list. Archived material is deliberately excluded.
{
  const raw = readFileSync(join(repoRoot, 'js', 'registry.js'), 'utf8');
  const start = raw.indexOf('{');
  let depth = 0, end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') { depth--; if (!depth) { end = i; break; } }
  }
  globalThis.__REG = JSON.parse(raw.slice(start, end + 1));
}
const REGISTRY = globalThis.__REG;
const CHAPTER_PAGES = REGISTRY.subjects.flatMap(s => s.chapters).map(c => c.path);
const ORIGIN = REGISTRY.origin;

// Single files copied from the repo root (the pages themselves).
const COPY_FILES = [
  'index.html',
  'quiz.html',
];

// Whole directories copied recursively.
const COPY_DIRS = ['topics', 'css', 'js', 'vendor', 'img'];

// Dev-only files that live inside copied dirs but must not ship.
// NB: the vendored libraries' LICENSE files are deliberately NOT pruned -
// MIT / LGPL-2.1 require the licence to travel with the distributed code, so
// the deployed bundle carries vendor/{katex,chart}/LICENSE too (~26 KB).
const PRUNE = ['css/input.css', 'vendor/fonts/.gitkeep'];

// Assets that MUST exist in public/ afterwards (fail the build otherwise).
const MUST_EXIST = [
  'index.html',
  'quiz.html',
  /* css/site.css, css/fonts.css, js/*.js exist under content-hashed names;
     checked separately below */
  ...CHAPTER_PAGES,
  'vendor/katex/katex.min.js',
  'vendor/katex/katex.min.css',
  'vendor/chart/chart.umd.min.js',
  'img/og-card.png',
  'sitemap.xml',
  'vendor/fonts/g8321-100.woff2',
  'vendor/fonts/g8321-400.woff2',
  'vendor/fonts/g8321-700.woff2',
  'vendor/fonts/manifest.json',
];

/* ------------------------------------------------------------------- steps */

const errors = [];

const summary = { minifiedJs: 0, readableJs: 0, hashedAssets: 0 };

// 1. clean slate -------------------------------------------------------------
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 2. copy ---------------------------------------------------------------------
for (const rel of COPY_FILES) {
  const src = join(repoRoot, rel);
  if (!existsSync(src)) {
    errors.push(`missing source file: ${rel}`);
    continue;
  }
  cpSync(src, join(outDir, rel));
}
for (const rel of COPY_DIRS) {
  const src = join(repoRoot, rel);
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    errors.push(`missing source directory: ${rel}/`);
    continue;
  }
  cpSync(src, join(outDir, rel), { recursive: true });
}

// 3. prune dev-only riders ------------------------------------------------------
for (const rel of PRUNE) {
  rmSync(join(outDir, rel), { force: true });
}

// 3b+3c are wrapped: ANY unexpected environment problem (missing Bun, odd FS
// semantics, etc.) degrades to readable unhashed assets instead of failing the
// deploy. A broken site is worse than an unoptimised one.
let assetPipeline = 'hashed+minified';
try {
if (process.env.PUBLIC_FORCE_FALLBACK) throw new Error('forced fallback (fallback-path test)');
// 3b. minify the shipped JavaScript (production output ONLY) -------------------
// Sources in js/ stay readable and keep working from file://; only the deploy
// bundle is minified, with Bun's built-in minifier (no new dependency). When
// the build runs under Node without Bun on PATH the files are copied readable
// and the summary says so - never a hard failure.
{
  const jsOut = join(outDir, 'js');
  let minified = 0, kept = 0;
  for (const f of readdirSync(jsOut).filter(f => f.endsWith('.js'))) {
    const file = join(jsOut, f);
    const res = spawnSync('bun', ['build', '--no-bundle', '--minify', '--target=browser', file, '--outfile', file + '.tmp']);
    if (res.status === 0 && existsSync(file + '.tmp')) { renameSync(file + '.tmp', file); minified++; }
    else { rmSync(file + '.tmp', { force: true }); kept++; }
  }
  summary.minifiedJs = minified;
  summary.readableJs = kept;
}

// 3c. content-hashed filenames for our own js/css (immutable caching) --------
// Only the deploy bundle is rewritten; sources keep stable names so file://
// and the dev workflow are untouched. Vendor libs keep their 1-day cache.
const hashed = {};
{
  const targets = [
    ...readdirSync(join(outDir, 'js')).filter(f => f.endsWith('.js')).map(f => ['js', f]),
    ...readdirSync(join(outDir, 'css')).filter(f => f.endsWith('.css')).map(f => ['css', f]),
  ];
  for (const [dir, f] of targets) {
    const full = join(outDir, dir, f);
    const h = nodeCrypto.createHash('sha256').update(readFileSync(full)).digest('hex').slice(0, 8);
    const nf = f.replace(/\.(js|css)$/, '.' + h + '.$1');
    renameSync(full, join(outDir, dir, nf));
    hashed[`${dir}/${f}`] = `${dir}/${nf}`;
  }
  // rewrite references in the copied pages
  const pages = [
    ...readdirSync(outDir).filter(f => f.endsWith('.html')).map(f => join(outDir, f)),
    ...readdirSync(join(outDir, 'topics')).filter(f => f.endsWith('.html')).map(f => join(outDir, 'topics', f)),
  ];
  for (const p of pages) {
    let html = readFileSync(p, 'utf8');
    for (const [from, to] of Object.entries(hashed)) {
      const base = from.split('/')[1];
      html = html.split(base).join(to.split('/')[1]);
    }
    writeFileSync(p, html);
  }
  summary.hashedAssets = Object.keys(hashed).length;
}

} catch (err) {
  assetPipeline = 'readable+unhashed (fallback: ' + (err && err.message ? err.message : err) + ')';
  for (const dir of ['js', 'css']) rmSync(join(outDir, dir), { recursive: true, force: true });
  cpSync(join(repoRoot, 'js'), join(outDir, 'js'), { recursive: true });
  cpSync(join(repoRoot, 'css'), join(outDir, 'css'), { recursive: true });
  rmSync(join(outDir, 'css/input.css'), { force: true });
  console.error('asset pipeline fell back to readable unhashed assets: ' + (err && err.message ? err.message : err));
}

// 3d. sitemap.xml generated from the registry (active pages only) -------------
{
  const urls = ['index.html', 'quiz.html', ...CHAPTER_PAGES]
    .map(p => `  <url><loc>${ORIGIN}/${p === 'index.html' ? '' : p}</loc><changefreq>weekly</changefreq></url>`)
    .join('\n');
  writeFileSync(join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

// 4a. required assets -----------------------------------------------------------
for (const rel of MUST_EXIST) {
  if (!existsSync(join(outDir, rel))) errors.push(`required asset missing in public/: ${rel}`);
}
for (const [dir, prefix] of [['css', 'site.'], ['css', 'fonts.'], ['js', 'common.'], ['js', 'quiz.']]) {
  const hit = existsSync(join(outDir, dir)) && readdirSync(join(outDir, dir)).some(f => f.startsWith(prefix));
  if (!hit) errors.push(`required hashed asset missing in public/${dir}/: ${prefix}*`);
}

// 4b. every local link inside every copied page must resolve in public/ ---------
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const REF_RE = /(?:href|src)\s*=\s*"([^"]+)"/gi;
let pages = 0;
let refs = 0;
for (const file of walk(outDir)) {
  if (!file.toLowerCase().endsWith('.html')) continue;
  pages++;
  const html = readFileSync(file, 'utf8');
  const pageDir = dirname(file);
  for (const m of html.matchAll(REF_RE)) {
    let ref = m[1].trim();
    if (/^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(ref)) continue; // external / inline / fragment
    refs++;
    ref = ref.split('#')[0].split('?')[0];
    if (!ref) continue; // pure fragment after stripping
    const target = ref.startsWith('/')
      ? join(outDir, normalize(ref))                       // root-absolute
      : resolve(pageDir, normalize(ref));                  // relative to the page
    if (!existsSync(target)) {
      errors.push(`broken reference in public/${file.slice(outDir.length + 1).split(sep).join('/')}: "${m[1]}"`);
    }
  }
}

// 5. report ----------------------------------------------------------------------
let files = 0;
let bytes = 0;
for (const f of walk(outDir)) {
  files++;
  bytes += statSync(f).size;
}

const kb = (n) => `${(n / 1024).toFixed(n < 1024 * 1024 ? 1 : 0)} KB`;
console.log(`build:public -> public/  (${files} files, ${kb(bytes)}, ${pages} pages checked, ${refs} local refs verified)`);

if (errors.length) {
  console.error(`\nbuild:public FAILED with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('build:public OK — output directory is deployable.' +
  (summary.minifiedJs ? ` (js minified: ${summary.minifiedJs}, readable fallback: ${summary.readableJs})` : ' (js shipped readable - bun not found)') +
  ` [assets: ${assetPipeline}]`);
