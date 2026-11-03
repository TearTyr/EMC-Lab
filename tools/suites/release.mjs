/* release gates: stability, production build, per-engine core flow. Run with `node tools/verify.mjs <suite|group>`; each suite gets the shared harness `h` (tools/lib/harness.mjs). */
import { execFileSync } from 'node:child_process';

/* ==========================================================================
   EMC Lab — stability stress: chapter navigation (PART 3.2 sequence),
   Details switch (PART 4.3 matrix) and typography parity (PART 4.5).
   Exits 1 on any failure. Every step asserts mounted content + URL + nav
   indicator agreement, records console/page errors, and checks that no
   overlay or transparent layer intercepts clicks.
   ========================================================================== */
async function stress(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];

  async function newPage(opts = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    return { ctx, pg };
  }

  /* state probe: what is mounted, what does the URL say, is the nav in sync,
     is anything click-blocking, are previous stages gone */
  const probe = pg => pg.evaluate(() => {
    const topic = document.getElementById('shell-topic');
    const home = document.getElementById('shell-home');
    const h1 = topic && !topic.hidden ? (topic.querySelector('h1') || {}).textContent : null;
    const blocking = (() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (!el) return 'none-at-center';
      const cs = getComputedStyle(el);
      if (cs.pointerEvents === 'none' && el.id) return 'pointer-none#' + el.id;
      return null;
    })();
    const overlayUp = !!document.getElementById('bootOverlay') || !!document.getElementById('introOverlay');
    return {
      hash: location.hash, h1: h1 || '', homeVisible: home && !home.hidden,
      stages: window.EMC ? window.EMC.stats().stages : -1,
      listeners: window.EMC ? window.EMC.stats().listeners : -1,
      blocking, overlayUp,
      detail: document.documentElement.dataset.detail,
      pressed: (document.getElementById('detailToggle') || {}).getAttribute ? document.getElementById('detailToggle').getAttribute('aria-pressed') : null,
      dtLabel: (document.querySelector('.dt-state') || {}).textContent
    };
  });
  /* the two active chapters (js/registry.js); the retired third chapter is gone */
  const WANT = { '#/ch1': 'Circuits', '#/ch2': 'Electric Fields' };

  /* ============ A. PART 3.2 navigation sequence ============================ */
  {
    let { ctx, pg } = await newPage();
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(700);

    const goChapter = async (id, via) => {
      if (via === 'hash') await pg.evaluate(r => { location.hash = r; }, id);
      else if (via === 'dropdown') {
        await pg.click('#topicsBtn');
        await pg.waitForTimeout(120);
        const file = { '#/ch1': 'current', '#/ch2': 'fields' }[id];
        await pg.click(`#topicsMenu a[href$="${file}.html"]`);
      } else if (via === 'card') {
        await pg.evaluate(() => { location.hash = '#/'; });
        await pg.waitForTimeout(250);
        await pg.click(`[data-topic-link="${id.slice(2)}"]`);
      }
      await pg.waitForTimeout(950);
      const st = await probe(pg);
      const good = st.hash === id && st.h1.includes(WANT[id]) && !st.overlayUp && st.blocking === null;
      ok(`A nav ${via} -> ${id} mounts in sync`, good, JSON.stringify({ hash: st.hash, h1: st.h1.slice(0, 26), blocking: st.blocking, overlay: st.overlayUp }));
      return st;
    };

    /* 2-5: ch1 -> ch2 -> ch1 -> ch2 -> ch1 via dropdown */
    for (const id of ['#/ch1', '#/ch2', '#/ch1', '#/ch2', '#/ch1']) await goChapter(id, 'dropdown');
    /* 6: different order via home cards */
    for (const id of ['#/ch2', '#/ch1', '#/ch2', '#/ch1']) await goChapter(id, 'card');

    /* 7: Details toggled between navigations */
    await pg.click('#detailToggle'); await pg.waitForTimeout(250);
    const offState = await probe(pg);
    ok('A Details OFF persists while mounted in ch1', offState.detail === 'off' && offState.pressed === 'false' && offState.dtLabel === 'OFF', JSON.stringify(offState).slice(0, 90));
    await goChapter('#/ch2', 'hash');
    const offMounted = await pg.evaluate(() => ({
      techVisible: [...document.querySelectorAll('#shell-topic [data-detail="tech"]')].filter(e => getComputedStyle(e).display !== 'none').length,
      plainVisible: [...document.querySelectorAll('#shell-topic [data-detail="plain"]')].filter(e => getComputedStyle(e).display !== 'none').length
    }));
    ok('A chapter mounted while OFF shows plain variants immediately', offMounted.techVisible === 0 && offMounted.plainVisible > 0, JSON.stringify(offMounted));
    await pg.click('#detailToggle'); await pg.waitForTimeout(250);
    const onMounted = await pg.evaluate(() => ({
      techVisible: [...document.querySelectorAll('#shell-topic [data-detail="tech"]')].filter(e => getComputedStyle(e).display !== 'none').length
    }));
    ok('A toggling ON after mount reveals the tech variants', onMounted.techVisible > 0, JSON.stringify(onMounted));

    /* 8: interact with a sim before navigating away */
    await pg.evaluate(() => document.querySelector('#ar-panel').scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => !!window.__AR, null, { timeout: 6000 });
    await pg.click('[data-sb-preset="lecture-line"]');
    await pg.waitForTimeout(400);
    const simBefore = await pg.evaluate(() => document.getElementById('ar-count').textContent);
    await goChapter('#/ch1', 'hash');
    const CH2 = ['toy-balloon', 'sim-arena', 'toy-bohr', 'sim-fieldpaint'];
    const idsAfter = await pg.evaluate(() => window.EMC.debugStages().map(x => x.id));
    ok('A leaving ch2 after sim use tears its stages down (by identity)',
      idsAfter.every(id => !CH2.includes(id)) && simBefore === '3',
      `live stages now: ${idsAfter.join(',')}`);
    /* ch1 sim interaction, then leave for ch2 */
    await pg.evaluate(() => document.getElementById('sim-ohm').scrollIntoView({ block: 'center' }));
    await pg.waitForTimeout(700);
    await pg.click('[data-ohm-preset="12,4"]');
    await pg.waitForTimeout(400);
    await goChapter('#/ch2', 'hash');
    const CH1 = ['sim-ohm', 'sim-circuit'];
    const idsBack = await pg.evaluate(() => window.EMC.debugStages().map(x => x.id));
    ok('A leaving ch1 after sim use tears its stages down (by identity)',
      idsBack.every(id => !CH1.includes(id)), `live stages now: ${idsBack.join(',')}`);

    /* 9: rapid switching */
    for (const id of ['#/ch1', '#/ch2', '#/ch1', '#/ch2', '#/ch1']) {
      await pg.evaluate(r => { location.hash = r; }, id);
      await pg.waitForTimeout(90);
    }
    await pg.waitForTimeout(1600);
    const rapid = await probe(pg);
    ok('A rapid switching settles on the last destination, usable', rapid.hash === '#/ch1' && rapid.h1.includes('Circuits') && rapid.blocking === null && !rapid.overlayUp, JSON.stringify(rapid).slice(0, 120));

    /* 11: back / forward */
    await pg.goBack(); await pg.waitForTimeout(800);
    const back = await probe(pg);
    ok('A Back restores the previous chapter', back.hash === '#/ch2' && back.h1.includes('Electric Fields'), JSON.stringify({ hash: back.hash, h1: back.h1.slice(0, 24) }));
    await pg.goForward(); await pg.waitForTimeout(800);
    const fwd = await probe(pg);
    ok('A Forward returns', fwd.hash === '#/ch1' && fwd.h1.includes('Circuits'), fwd.hash);

    /* 12: direct URL + refresh */
    await pg.goto(B + '/index.html#/ch2', { waitUntil: 'load' });
    await pg.waitForTimeout(1100);
    const direct = await probe(pg);
    ok('A direct hash URL mounts ch2', direct.hash === '#/ch2' && direct.h1.includes('Electric Fields'), direct.hash);
    await pg.reload({ waitUntil: 'load' });
    await pg.waitForTimeout(1100);
    const refreshed = await probe(pg);
    ok('A refresh on a chapter route remounts correctly', refreshed.hash === '#/ch2' && refreshed.h1.includes('Electric Fields') && !refreshed.overlayUp, JSON.stringify(refreshed).slice(0, 100));

    /* 13: new tab (standalone pages remain the new-tab destination)
       RAM note (2026-10-24, phase 9d): the block-A context has done ~15
       navigations by here; on 1 GB CI its renderer process is worn out and
       any further newPage in the SAME context is OOM-killed ('Target
       crashed', four consecutive runs — closing the old page first did not
       help, same-site pages share the process). Run the new-tab and mobile
       scenarios in fresh contexts (fresh processes). Assertions unchanged. */
    const href = await pg.evaluate(() => document.querySelector('#topicsMenu a[href$="fields.html"]').getAttribute('href'));
    await ctx.close();
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg2 = await ctxB.newPage();
    await pg2.goto(B + '/index.html' .replace('index.html', '') + href, { waitUntil: 'load' });
    await pg2.waitForTimeout(900);
    const standalone = await pg2.evaluate(() => ({ h1: (document.querySelector('main h1') || {}).textContent, emc: typeof window.EMC !== 'undefined' }));
    ok('A new-tab link opens the standalone chapter, fully alive', /Electric Fields/.test(standalone.h1 || '') && standalone.emc, JSON.stringify(standalone).slice(0, 80));
    await ctxB.close();

    /* 10: mobile nav path (fresh context — see RAM note above) */
    const ctxC = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctxC.addInitScript(skipIntroOnLoad);
    pg = await ctxC.newPage();
    await pg.setViewportSize({ width: 360, height: 740 });
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    await pg.click('#navToggle'); await pg.waitForTimeout(250);
    if (await pg.isVisible('#topicsBtn')) { await pg.click('#topicsBtn'); await pg.waitForTimeout(250); }
    await pg.click('#navMenu a[href$="fields.html"]');
    await pg.waitForTimeout(1000);
    const mob = await probe(pg);
    ok('A mobile menu navigates to ch2', mob.hash === '#/ch2' && mob.h1.includes('Electric Fields'), JSON.stringify(mob).slice(0, 100));

    /* in-page chapter links (pager inside mounted content) */
    await pg.setViewportSize({ width: 1280, height: 900 });
    await pg.evaluate(() => { location.hash = '#/ch1'; });
    await pg.waitForTimeout(900);
    await pg.evaluate(() => document.querySelector('#shell-topic .pager a.next').scrollIntoView({ block: 'center' }));
    await pg.waitForTimeout(200);
    await pg.click('#shell-topic .pager a.next');
    await pg.waitForTimeout(1000);
    const pager = await probe(pg);
    ok('A in-page pager link moves to the next chapter', pager.hash === '#/ch2' && pager.h1.includes('Electric Fields'), pager.hash);
    await ctxC.close();
  }

  /* ============ B. PART 4.3 Details matrix ================================== */
  {
    const { ctx, pg } = await newPage();
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(600);
    /* 1: ten toggles */
    let consistent = true;
    for (let i = 0; i < 10; i++) {
      await pg.click('#detailToggle');
      await pg.waitForTimeout(140);
      const st = await probe(pg);
      const want = i % 2 === 0 ? 'off' : 'on';
      if (st.detail !== want || st.pressed !== String(want === 'on') || st.dtLabel !== want.toUpperCase()) consistent = false;
    }
    ok('B ten rapid toggles keep attr/aria/label in lockstep', consistent);
    /* keyboard */
    await pg.evaluate(() => document.getElementById('detailToggle').focus());
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
    const kb = await probe(pg);
    ok('B keyboard Enter toggles and agrees', kb.detail === 'off' && kb.pressed === 'false', JSON.stringify(kb).slice(0, 80));
    /* 4: reload in each state */
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(700);
    const r1 = await probe(pg);
    ok('B reload keeps OFF (persisted)', r1.detail === 'off' && r1.pressed === 'false', r1.detail);
    await pg.click('#detailToggle'); await pg.waitForTimeout(200);
    await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(700);
    const r2 = await probe(pg);
    ok('B reload keeps ON', r2.detail === 'on' && r2.pressed === 'true', r2.detail);
    /* 5: back/forward */
    await pg.goBack(); await pg.waitForTimeout(500); await pg.goForward(); await pg.waitForTimeout(500);
    const bf = await probe(pg);
    ok('B back/forward keep Details state and page usable', bf.detail === 'on' && bf.blocking === null, bf.detail);
    /* 8: blocked storage (RAM note: close block B's context first — two live
       contexts with full pages OOM the renderer on 1 GB CI) */
    await ctx.close();
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg3 = await ctx2.newPage();
    const errs2 = [];
    pg3.on('pageerror', e => errs2.push(String(e).slice(0, 100)));
    await pg3.addInitScript(() => {
      const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get: boom });
      Object.defineProperty(window, 'sessionStorage', { get: boom });
    });
    await pg3.goto(B + '/index.html', { waitUntil: 'load' });
    await pg3.waitForTimeout(700);
    for (let i = 0; i < 3; i++) { await pg3.click('#detailToggle'); await pg3.waitForTimeout(150); }
    const bs = await pg3.evaluate(() => ({ detail: document.documentElement.dataset.detail, emc: typeof window.EMC !== 'undefined' }));
    ok('B blocked storage: page boots, toggle still flips', bs.emc && bs.detail === 'off' && errs2.length === 0, JSON.stringify(bs) + errs2.join('|'));
    await ctx2.close();
  }

  /* ============ C. PART 4.5 typography parity =============================== */
  {
    const { ctx, pg } = await newPage();
    for (const url of ['/index.html', '/topics/fields.html', '/topics/current.html', '/quiz.html']) {
      await pg.goto(B + url, { waitUntil: 'load' });
      await pg.waitForTimeout(700);
      const pairs = await pg.evaluate(() => {
        /* for each parent that owns a plain/tech pair, compare the computed
           font-size + line-height of the two variants (primary reading roles) */
        const out = [];
        const parents = new Set();
        document.querySelectorAll('[data-detail]').forEach(el => parents.add(el.parentElement));
        parents.forEach(par => {
          if (!par) return;
          const plain = [...par.children].find(c => c.getAttribute && c.getAttribute('data-detail') === 'plain');
          const tech = [...par.children].find(c => c.getAttribute && c.getAttribute('data-detail') === 'tech');
          if (!plain || !tech) return;
          const a = getComputedStyle(plain), b = getComputedStyle(tech);
          out.push({
            cls: (plain.className || '').toString().slice(0, 24),
            sameSize: a.fontSize === b.fontSize, sameLH: a.lineHeight === b.lineHeight,
            a: a.fontSize + '/' + a.lineHeight, b: b.fontSize + '/' + b.lineHeight
          });
        });
        return out;
      });
      const bad = pairs.filter(p => !p.sameSize || !p.sameLH);
      ok(`C ${url}: every plain/tech pair shares font-size + line-height`, bad.length === 0,
        bad.length ? JSON.stringify(bad.slice(0, 3)) : `${pairs.length} pairs`);
    }
    await ctx.close();
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 8) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'STABILITY STRESS PASS' : h.failed() + ' STABILITY FAILURES');
}

/* ==========================================================================
   EMC Lab — PRODUCTION-LAYOUT verification (public/, hashed asset names).
   (public/ is auto-built when missing.)

   WHY THIS GATE EXISTS: every behavioural gate in this repo serves the
   SOURCE layout (js/common.js). The production build content-hashes assets
   (js/common.<hash>.js), and name-matching logic that works on source names
   can silently fail on hashed ones. That exact class of bug shipped once:
   shell.js's script skip-list substring-matched 'common.js', missed
   'common.58f7f516.js', and re-executed the engine on every chapter mount —
   double-binding the Detail toggle (dead after one flip), the topics
   dropdown and the mobile menu (dead after the first chapter visit).
   This gate runs the affected contracts against public/ so a source-only
   suite can never again pass while production is broken.

   Checks:
     1 the engine object survives shell chapter mounts unchanged (no re-exec)
     2 no #bootOverlay is ever re-created during a mount
     3 the Detail toggle flips on every click AFTER a chapter mount (x2 mounts)
     4 the topics dropdown opens/closes AFTER a chapter mount
     5 the mobile nav menu opens at 360 px AFTER a chapter mount
     6 sims still initialise inside the mounted chapter (stage-ready fired)
     7 zero page/console errors throughout
   Exits 1 on any failure.
   ========================================================================== */
async function prod(h) {
  const { ok, ROOT, fs, path, browser } = h;
  const PUB = path.join(ROOT, 'public');

  if (!fs.existsSync(path.join(PUB, 'index.html'))) {
    console.log('public/ missing — building…');
    execFileSync(process.execPath, [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
  }

  const prod = await h.serve(PUB, { skip: new Set() });
  const B = prod.B;

  const errors = [];

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await pg.goto(B + '/index.html', { waitUntil: 'load' });

  /* clear the intro (a fresh session plays it; this gate is about the shell) */
  await pg.waitForFunction(() => {
    const o = document.getElementById('introOverlay');
    return o && o.classList.contains('play');
  }, null, { timeout: 8000 });
  await pg.click('#introSkip');
  await pg.waitForTimeout(1000);   /* v8: node leaves after the .5 s .done fade */
  ok('0 intro skipped; homepage interactive', await pg.evaluate(() => !document.getElementById('introOverlay')));

  /* mark the engine + watch for loader overlays re-appearing during mounts */
  await pg.evaluate(() => {
    window.EMC.__prodVerifyMark = 'engine-v1';
    window.__overlays = 0;
    new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) if (n.id === 'bootOverlay') window.__overlays++;
    }).observe(document.body, { childList: true });
  });

  const lvl = () => pg.evaluate(() => document.documentElement.dataset.detail);
  async function flipExpect(want) {
    await pg.click('#detailToggle');
    await pg.waitForTimeout(420);                 // 80 ms fade + settle
    return (await lvl()) === want;
  }

  /* ---- mount #/ch1 through a real card click (the shell intercepts it) ---- */
  await pg.locator('a[href="topics/current.html"]:visible').first().click();
  await pg.waitForFunction(() => location.hash === '#/ch1', null, { timeout: 4000 });
  await pg.waitForFunction(() => !document.getElementById('shell-topic').hidden &&
    document.getElementById('shell-topic-body').innerHTML.length > 500, null, { timeout: 6000 });
  await pg.waitForTimeout(1500);

  ok('1 engine object unchanged after chapter mount (no common.js re-exec)',
    await pg.evaluate(() => window.EMC.__prodVerifyMark === 'engine-v1'));
  ok('2 no boot overlay re-created during mount',
    (await pg.evaluate(() => window.__overlays)) === 0);
  ok('3a Detail toggle flips ON→OFF after a chapter mount', await flipExpect('off'));
  ok('3b Detail toggle flips OFF→ON after a chapter mount', await flipExpect('on'));

  /* ---- dropdown must still work after the mount ---- */
  await pg.click('#topicsBtn');
  await pg.waitForTimeout(250);
  const ddOpen = await pg.evaluate(() => document.getElementById('topicsMenu').classList.contains('open'));
  await pg.click('#topicsBtn');
  await pg.waitForTimeout(250);
  const ddClosed = await pg.evaluate(() => !document.getElementById('topicsMenu').classList.contains('open'));
  ok('4 topics dropdown opens AND closes after a chapter mount', ddOpen && ddClosed, `open=${ddOpen} closed=${ddClosed}`);

  /* ---- sims initialise inside the mounted chapter (lazy: whenNear fires on
         approach, so walk every sim panel into view before asserting) ---- */
  const panels = await pg.evaluate(() =>
    [...document.querySelectorAll('#shell-topic [id$="-panel"]')].map(p => p.id));
  for (const id of panels) {
    await pg.evaluate(pid => {
      const p = document.getElementById(pid);
      if (p) p.scrollIntoView({ block: 'center' });
    }, id);
    await pg.waitForTimeout(1600);
  }
  const simState = await pg.evaluate(() => ({
    canvases: document.querySelectorAll('#shell-topic canvas').length,
    pending: document.querySelectorAll('#shell-topic .panel[data-sim-pending]').length,
    painted: [...document.querySelectorAll('#shell-topic canvas')].every(c => c.width > 1),
  }));
  ok('6 mounted chapter sims initialise on approach (canvases live, none stuck pending)',
    simState.canvases >= 2 && simState.pending === 0 && simState.painted, JSON.stringify(simState));

  /* ---- second mount: ch2, then back to ch1 — bindings must not accumulate ---- */
  await pg.evaluate(() => { location.hash = '#/ch2'; });
  await pg.waitForFunction(() => !document.getElementById('shell-topic').hidden &&
    document.getElementById('shell-topic-body').innerHTML.length > 500, null, { timeout: 8000 });
  await pg.waitForTimeout(1200);
  ok('1b engine still unchanged after a SECOND mount',
    await pg.evaluate(() => window.EMC.__prodVerifyMark === 'engine-v1'));
  ok('3c Detail toggle still flips after two mounts', await flipExpect('off'));
  await pg.evaluate(() => { location.hash = '#/'; });
  await pg.waitForTimeout(700);
  await pg.evaluate(() => { location.hash = '#/ch1'; });
  await pg.waitForTimeout(1500);
  ok('3d Detail toggle still flips after home→ch1 re-entry', await flipExpect('on'));
  ok('2b still zero boot overlays across all switches',
    (await pg.evaluate(() => window.__overlays)) === 0);

  /* ---- mobile menu after chapter visits ---- */
  await pg.setViewportSize({ width: 360, height: 740 });
  await pg.waitForTimeout(400);
  await pg.click('#navToggle');
  await pg.waitForTimeout(300);
  const menuOpen = await pg.evaluate(() => document.getElementById('navMenu').classList.contains('open'));
  ok('5 mobile nav menu opens at 360 px after chapter mounts', menuOpen);

  console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  ok('7 zero page/console errors', errors.length === 0);

  console.log(h.failed() === 0 ? 'PRODUCTION-LAYOUT VERIFICATION PASS' : h.failed() + ' PRODUCTION-LAYOUT FAILURES');
  await ctx.close();
  await prod.close();
}

/* ==========================================================================
   EMC Lab — cross-browser core-flow matrix (gate B, brief R9).
   Run it in each engine with --browser chromium | firefox | edge.
   Flows: home boots with derived counts -> both chapters mount ->
   circuit builder controls move real readouts -> quiz answers + submits +
   scores 100% -> Detail toggle agrees across attr/aria/label/content.
   A browser that cannot launch is reported UNTESTED, never assumed (R9).
   Exits 1 if any launched browser fails a flow or logs a page error.
   ========================================================================== */
async function core(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(skipIntroOnLoad);
  pg.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120)); });

  /* --- home --- */
  await pg.goto(B + '/index.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const home = await pg.evaluate(() => ({
    emc: typeof window.EMC !== 'undefined',
    stats: [document.getElementById('statChapters').textContent,
            document.getElementById('statSims').textContent,
            document.getElementById('statQuestions').textContent].join('|'),
    overlay: !!document.getElementById('bootOverlay')
  }));
  ok('home boots with derived counts 2|6|16', home.emc && home.stats === '2|6|16', home.stats);
  ok('no boot overlay lingering', home.overlay === false);

  /* --- both chapters mount via the shell --- */
  for (const [route, want] of [['#/ch1', 'Circuits'], ['#/ch2', 'Electric Fields']]) {
    await pg.evaluate(r => { location.hash = r; }, route);
    await pg.waitForTimeout(1300);
    const st = await pg.evaluate(() => ({
      mounted: !document.getElementById('shell-topic').hidden,
      h1: (document.querySelector('#shell-topic h1') || {}).textContent || ''
    }));
    ok(`chapter ${route} mounts`, st.mounted && st.h1.includes(want), st.h1.slice(0, 40));
  }

  /* --- removed routes must fall back to home, never show an old chapter --- */
  for (const route of ['#/ch3', '#/magind']) {
    await pg.goto(B + '/index.html' + route, { waitUntil: 'load' });
    await pg.waitForTimeout(1300);
    const st = await pg.evaluate(() => ({ topicHidden: document.getElementById('shell-topic').hidden, stale: /magnet|lorentz|faraday/i.test(document.body.innerText) }));
    ok(`old route ${route} falls back to home`, st.topicHidden === true && st.stale === false);
  }

  /* --- circuit builder: placing a part moves real readouts --- */
  await pg.evaluate(() => { location.hash = '#/ch1'; });
  await pg.waitForTimeout(1300);
  await pg.evaluate(() => document.getElementById('sim-circuit').scrollIntoView());
  await pg.waitForTimeout(400);
  const c0 = await pg.evaluate(() => document.getElementById('circ-R').textContent);
  await pg.evaluate(() => {
    document.querySelector('[data-circ-part="res"]').click();
    document.getElementById('circ-sk3').click();
  });
  await pg.waitForTimeout(300);
  const c1 = await pg.evaluate(() => ({
    R: document.getElementById('circ-R').textContent,
    I: document.getElementById('circ-I').textContent
  }));
  ok('circuit builder placement changes the computed loop R and I',
    c1.R !== c0 && /A/.test(c1.I), c0 + ' -> ' + JSON.stringify(c1));
  await pg.evaluate(() => document.getElementById('circ-sk0').click());
  await pg.waitForTimeout(300);
  const bat = await pg.evaluate(() => document.getElementById('circ-I').textContent);
  ok('removing the battery zeroes the current honestly', /0/.test(bat), bat);

  /* --- quiz: answer all, submit twice, 100% --- */
  await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  const n = await pg.evaluate(() => {
    let k = 0;
    document.querySelectorAll('.q-card').forEach(card => {
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      const opt = card.querySelector(`.opt[data-opt="${q.answer}"]`);
      if (opt) { opt.click(); k++; }
    });
    return k;
  });
  ok('quiz: all 16 answered by real clicks', n === 16, String(n));
  await pg.evaluate(() => document.getElementById('quiz-submit').scrollIntoView());
  await pg.evaluate(() => document.getElementById('quiz-submit').click());
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById('quiz-submit').click());
  await pg.waitForTimeout(1500);
  const score = await pg.evaluate(() => document.getElementById('quiz-score').textContent.slice(0, 40));
  ok('quiz submits and scores 100%', /100%/.test(score), score.replace(/\s+/g, ' '));
  const charts = await pg.evaluate(() => document.querySelectorAll('canvas').length);
  ok('Chart.js canvas renders after submitting', charts > 0, String(charts));

  /* --- Detail toggle --- */
  const dt = await pg.evaluate(() => {
    const b = document.getElementById('detailToggle');
    b.click();
    return new Promise(res => setTimeout(() => res({
      attr: document.documentElement.dataset.detail,
      pressed: b.getAttribute('aria-pressed'),
      label: b.querySelector('.dt-state').textContent,
      techHidden: [...document.querySelectorAll('[data-detail="tech"]')].every(e => getComputedStyle(e).display === 'none')
    }), 350));
  });
  ok('Detail toggle: attr + aria-pressed + label + content agree',
    dt.attr === 'off' && dt.pressed === 'false' && dt.label === 'OFF' && dt.techHidden, JSON.stringify(dt));

  ok('no page/console errors in the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ==========================================================================
   EMC Lab — the deployed site, read only (run: node tools/verify.mjs live --url https://emc-lab.vercel.app).
   Opens the home page, the quiz and both chapters at a desktop and a phone size and checks what a visitor
   would hit: HTTP 200 (a Vercel login page counts as a failure), no console or page errors, no request to
   another origin, no failed request, no sideways scroll, and the landing sections of the current design.
   Screenshots go to .scratch/live/ (git-ignored). It never writes to the site.
   ========================================================================== */
async function live(h) {
  const { ok, B, browser, skipIntroOnLoad, ROOT, fs, path } = h;
  const base = new URL(B), shots = path.join(ROOT, '.scratch', 'live');
  fs.mkdirSync(shots, { recursive: true });
  const pages = [['/', 'home'], ['/quiz.html', 'quiz'], ['/topics/current.html', 'chapter1'], ['/topics/fields.html', 'chapter2']];
  const sizes = [[1280, 800, false], [390, 844, true]];
  for (const [w, hh, mobile] of sizes) {
    for (const [route, name] of pages) {
      const ctx = await browser.newContext({ viewport: { width: w, height: hh }, isMobile: mobile, hasTouch: mobile });
      const pg = await ctx.newPage();
      const errs = [], other = new Set(), failed = [];
      pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
      pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
      pg.on('request', r => { try { const u = new URL(r.url()); if (u.protocol.startsWith('http') && u.host !== base.host) other.add(u.host); } catch (e) { /* data: urls */ } });
      pg.on('requestfailed', r => failed.push(r.url().slice(-60)));
      await pg.addInitScript(skipIntroOnLoad);
      const tag = `${name} ${w}x${hh}`;
      let res = null;
      try { res = await pg.goto(new URL(route, base).href, { waitUntil: 'load', timeout: 45000 }); } catch (e) { errs.push('goto: ' + String(e).slice(0, 100)); }
      await pg.waitForTimeout(1500);
      const url = pg.url(), sso = /vercel\.com\/(sso|login)/.test(url);
      ok(`${tag}: loads with HTTP 200${sso ? ' (redirected to a Vercel login: previews are protected)' : ''}`, !!res && res.status() === 200 && !sso, (res ? res.status() : 'no response') + ' ' + url.slice(0, 80));
      if (sso) { await ctx.close(); continue; }
      ok(`${tag}: no console errors, no other origin, no failed request`, errs.length === 0 && other.size === 0 && failed.length === 0, JSON.stringify({ errs: errs.slice(0, 3), other: [...other], failed: failed.slice(0, 3) }));
      const geo = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      ok(`${tag}: no sideways scroll`, geo.sw <= geo.iw, JSON.stringify(geo));
      if (name === 'home') {
        const ids = await pg.evaluate(() => ['about', 'preview', 'learn', 'sims', 'quiz-call'].filter(i => document.getElementById(i)));
        ok(`${tag}: the landing sections are there (statement, preview, lessons, simulations, quiz call)`, ids.length === 5, ids.join());
        const cards = await pg.evaluate(() => document.querySelectorAll('.sim-card').length);
        const want = await pg.evaluate(() => (window.EMC_REGISTRY ? window.EMC_REGISTRY.chapters.reduce((n, c) => n + c.sims.length, 0) : -1));
        ok(`${tag}: one card per registry simulation`, cards === want && cards > 0, cards + ' / ' + want);
      }
      await pg.screenshot({ path: path.join(shots, `${name}-${w}x${hh}.png`) });
      await ctx.close();
    }
  }
  console.log('screenshots:', shots);
  console.log(h.failed() === 0 ? 'LIVE PASS' : h.failed() + ' LIVE FAILURES');
}

export const suites = {
  stress: { about: 'long-running and rapid-switching stability', browser: true, slow: true, run: stress },
  prod: { about: 'the same shell contracts against the hashed production build in public/', browser: true, slow: true, run: prod },
  live: { about: 'the deployed site, read only: node tools/verify.mjs live --url <base>', browser: true, slow: true, remote: true, run: live },
  core: { about: 'core flow (home, chapters, builder, quiz, Detail toggle); run per engine with --browser', browser: true, run: core }
};
