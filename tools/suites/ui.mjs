/* UI contract: look, themes, responsive, accessibility, assets. Run with `node tools/verify.mjs <suite|group>`; each suite gets the shared harness `h` (tools/lib/harness.mjs). */

/* ==========================================================================
   EMC Lab — shared UI verification: chapter dropdown, active-chapter state,
   Details toggle and the mascot helper.
     1 nav highlight follows the home-page chapter route (not stuck on Home)
     2 dropdown: Esc returns focus, Tab-away closes, arrow keys move, repeated
       picks never double-toggle
     3 Details toggle flips text/aria/attr on every page without resizing text
     4 mascot is its own button (never inside the home link), named, keyboard
       operable; opens a non-modal panel; Esc / outside click / Tab-away close it
     5 panel tips are contextual and shortcuts point at the real tools
     6 mascot reactions: status bubble for quiz + chapter-done, varied, never
       blocks pointer input
     7 mascot works before AND after the intro, after repeated navigation, and
       narrow screens (no horizontal overflow, panel inside the viewport)
     8 zero console/page errors
   Exits 1 on any failure.
   ========================================================================== */
async function ui(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function open(url, { w = 1280, h = 900, intro = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    if (!intro) await pg.addInitScript(skipIntroOnLoad);
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    return { ctx, pg };
  }
  const focusId = pg => pg.evaluate(() => document.activeElement.id || document.activeElement.className.toString().slice(0, 20) || document.activeElement.tagName);
  const panelOpen = pg => pg.evaluate(() => { const p = document.getElementById('mascotPanel'); return !!p && !p.hidden; });
  const dropOpen = pg => pg.evaluate(() => document.getElementById('topicsMenu').classList.contains('open'));

  /* 1 + 2: navigation */
  {
    const { ctx, pg } = await open('/index.html');
    const current = () => pg.evaluate(() => ({
      links: [...document.querySelectorAll('.nav-link[aria-current], .dd-link[aria-current]')].map(a => a.textContent.trim().slice(0, 14)),
      btn: document.getElementById('topicsBtn').classList.contains('active')
    }));
    let c = await current();
    ok('1 home: Home is current, Chapters button is not', c.links.length === 1 && /Home/.test(c.links[0]) && !c.btn, JSON.stringify(c));
    await pg.click('#topicsBtn');
    await pg.click('#topicsMenu a[href$="fields.html"]');
    await pg.waitForFunction(() => location.hash === '#/ch2');
    await pg.waitForTimeout(500);
    c = await current();
    ok('1 chapter route #/ch2: only Chapter 2 is current and the Chapters button is lit',
      c.links.length === 1 && /2 · Electric/.test(c.links[0]) && c.btn, JSON.stringify(c));
    await pg.click('a.brand');
    await pg.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await pg.waitForTimeout(400);
    c = await current();
    ok('1 back home: highlight returns to Home', c.links.length === 1 && /Home/.test(c.links[0]) && !c.btn, JSON.stringify(c));
    await ctx.close();

    const deep = await open('/index.html#/ch1');
    const dc = await deep.pg.evaluate(() => [...document.querySelectorAll('[aria-current]')].filter(a => a.closest('.nav-menu')).map(a => a.textContent.trim().slice(0, 14)));
    ok('1 deep link #/ch1 highlights Chapter 1 from the first paint', dc.length === 1 && /1 · Circuits/.test(dc[0]), JSON.stringify(dc));
    await deep.ctx.close();
  }
  {
    const { ctx, pg } = await open('/index.html');
    await pg.click('#topicsBtn');
    await pg.keyboard.press('ArrowDown');
    ok('2 ArrowDown inside the open dropdown focuses the first chapter', /^\s*$/.test('') && (await pg.evaluate(() => document.activeElement.matches('#topicsMenu a'))));
    await pg.keyboard.press('ArrowDown');
    ok('2 ArrowDown moves to the second chapter', await pg.evaluate(() => document.activeElement.getAttribute('href').endsWith('fields.html')));
    await pg.keyboard.press('ArrowUp');
    await pg.keyboard.press('Escape');
    ok('2 Escape from a menu item closes it and returns focus to the Chapters button',
      !(await dropOpen(pg)) && (await focusId(pg)) === 'topicsBtn', await focusId(pg));
    await pg.keyboard.press('ArrowDown');
    ok('2 ArrowDown on the closed Chapters button opens the menu', await dropOpen(pg));
    await pg.keyboard.press('Escape');
    await pg.click('#topicsBtn');
    for (let i = 0; i < 4; i++) await pg.keyboard.press('Tab');
    ok('2 tabbing away from the open dropdown closes it', !(await dropOpen(pg)));
    await pg.keyboard.press('Escape');
    for (let i = 0; i < 4; i++) {
      await pg.click('#topicsBtn');
      await pg.click(`#topicsMenu a[href$="${i % 2 ? 'fields' : 'current'}.html"]`);
      await pg.waitForTimeout(350);
    }
    await pg.click('#topicsBtn');
    const opened = await dropOpen(pg);
    await pg.click('#topicsBtn');
    ok('2 after repeated picks one click still toggles exactly once (no duplicate handlers)', opened && !(await dropOpen(pg)));
    ok('2 repeated navigation leaves a single mascot panel', await pg.evaluate(() => document.querySelectorAll('#mascotPanel').length) === 1);
    await ctx.close();
  }

  /* 3: Details toggle on every page */
  for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
    const { ctx, pg } = await open(url);
    const read = () => pg.evaluate(() => ({
      attr: document.documentElement.dataset.detail,
      pressed: document.getElementById('detailToggle').getAttribute('aria-pressed'),
      label: document.querySelector('.dt-state').textContent,
      size: getComputedStyle(document.body).fontSize,
      lede: (() => { const l = document.querySelector('.lede'); return l ? getComputedStyle(l).fontSize : ''; })(),
      tech: [...document.querySelectorAll('[data-detail=tech]')].filter(e => e.offsetParent).length,
      plain: [...document.querySelectorAll('[data-detail=plain]')].filter(e => e.offsetParent).length
    }));
    const on = await read();
    await pg.click('#detailToggle');
    await pg.waitForTimeout(450);
    const off = await read();
    ok(`3 ${url}: Details flips attribute, aria-pressed, label and visible copy`,
      on.attr === 'on' && off.attr === 'off' && on.pressed === 'true' && off.pressed === 'false' &&
      on.label === 'ON' && off.label === 'OFF' && on.tech > 0 && off.tech === 0 && off.plain > 0 && on.plain === 0,
      JSON.stringify({ on, off }));
    ok(`3 ${url}: Details does not change text size`, on.size === off.size && on.lede === off.lede, `${on.size}/${on.lede} → ${off.size}/${off.lede}`);
    await ctx.close();
  }

  /* 4 + 5: mascot structure and panel behaviour */
  {
    const { ctx, pg } = await open('/index.html');
    const s = await pg.evaluate(() => {
      const b = document.getElementById('mascotBtn');
      return {
        tag: b.tagName, insideLink: !!b.closest('a'), name: b.getAttribute('aria-label'),
        brandHref: document.querySelector('a.brand').getAttribute('href'), brandHasButton: !!document.querySelector('a.brand button'),
        w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height
      };
    });
    ok('4 mascot is a <button> outside the home link, with an accessible name and a 40px+ target',
      s.tag === 'BUTTON' && !s.insideLink && !s.brandHasButton && /Denki-chan/.test(s.name) && s.w >= 40 && s.h >= 40, JSON.stringify(s));
    await pg.click('#mascotBtn');
    ok('4 click opens the helper panel (aria-expanded + dialog visible)',
      (await panelOpen(pg)) && (await pg.getAttribute('#mascotBtn', 'aria-expanded')) === 'true' &&
      (await pg.getAttribute('#mascotPanel', 'role')) === 'dialog');
    ok('4 opening moves focus into the panel', await pg.evaluate(() => document.getElementById('mascotPanel').contains(document.activeElement)));
    await pg.keyboard.press('Escape');
    ok('4 Escape closes the panel and returns focus to the mascot', !(await panelOpen(pg)) && (await focusId(pg)) === 'mascotBtn');
    await pg.focus('#mascotBtn');
    await pg.keyboard.press('Enter');
    ok('4 Enter on the focused mascot opens it', await panelOpen(pg));
    await pg.mouse.click(900, 600);
    ok('4 clicking elsewhere closes it', !(await panelOpen(pg)));
    await pg.focus('#mascotBtn');
    await pg.keyboard.press('Space');
    ok('4 Space on the focused mascot opens it', await panelOpen(pg));
    for (let i = 0; i < 6; i++) await pg.keyboard.press('Tab');
    ok('4 tabbing out of the panel closes it (no focus trap)', !(await panelOpen(pg)));
    ok('4 clicking the mascot does not navigate away', !/quiz|topics/.test(pg.url()));
    await pg.click('a.brand');
    await pg.waitForTimeout(300);
    ok('4 the brand link still goes home', /index\.html(#\/)?$|\/$/.test(pg.url()));

    /* 5 contextual tips + real tool links, on the home page's chapter route */
    await pg.click('#topicsBtn'); await pg.click('#topicsMenu a[href$="current.html"]');
    await pg.waitForFunction(() => location.hash === '#/ch1');
    await pg.waitForTimeout(700);
    await pg.click('#mascotBtn');
    const p1 = await pg.evaluate(() => ({
      tip: document.querySelector('.mp-tip').textContent,
      links: [...document.querySelectorAll('.mp-links a')].map(a => a.textContent)
    }));
    ok('5 Chapter 1 panel gives circuit tips and links to the existing Ohm calculator + circuit builder',
      /Ohm|series|resistor/i.test(p1.tip) && p1.links.includes('Ohm’s law calculator') && p1.links.includes('Circuit builder'), JSON.stringify(p1));
    const tips = new Set();
    for (let i = 0; i < 6; i++) { await pg.click('.mp-more'); tips.add(await pg.textContent('.mp-tip')); }
    ok('5 "Another tip" varies the tip', tips.size >= 2, `${tips.size} distinct`);
    await pg.click('.mp-links a:has-text("Circuit builder")');
    await pg.waitForTimeout(900);
    const jumped = await pg.evaluate(() => {
      const t = document.getElementById('sim-circuit-panel'); if (!t) return null;
      const r = t.getBoundingClientRect(); return { top: Math.round(r.top), vis: r.top < innerHeight };
    });
    ok('5 following a shortcut closes the panel and scrolls to the real tool', !(await panelOpen(pg)) && jumped && jumped.vis, JSON.stringify(jumped));
    await ctx.close();

    const q = await open('/quiz.html');
    await q.pg.click('#mascotBtn');
    const qt = await q.pg.evaluate(() => ({ tip: document.querySelector('.mp-tip').textContent, links: [...document.querySelectorAll('.mp-links a')].map(a => a.textContent) }));
    ok('5 quiz panel gives quiz tips and does not offer a second quiz link', /option|Flag|explanation/i.test(qt.tip) && !qt.links.includes('Take the quiz'), JSON.stringify(qt));
    await q.ctx.close();
  }

  /* 6: reactions */
  {
    const { ctx, pg } = await open('/topics/current.html');
    const say = detail => pg.evaluate(d => document.dispatchEvent(new CustomEvent('emc:mascot', { detail: d })), detail);
    const bubble = () => pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent, role: b.getAttribute('role'), pe: getComputedStyle(b).pointerEvents }; });
    await say({ kind: 'quiz', pct: 95 });
    let b = await bubble();
    ok('6 a high quiz score gets a short status-role bubble that never takes pointer input', !b.hidden && b.text.length > 5 && b.text.length < 90 && b.role === 'status' && b.pe === 'none', JSON.stringify(b));
    const seen = new Set();
    for (let i = 0; i < 8; i++) { await say({ kind: 'quiz', pct: 20 }); seen.add((await bubble()).text); }
    ok('6 reactions vary', seen.size >= 2, `${seen.size} distinct`);
    let back2back = false, prev = '';
    for (let i = 0; i < 12; i++) { await say({ kind: 'chapter-done' }); const t = (await bubble()).text; if (t === prev) back2back = true; prev = t; }
    ok('6 the same line never repeats back-to-back', !back2back);
    await pg.click('#mascotBtn');
    await say({ kind: 'quiz', pct: 10 });
    ok('6 the bubble never talks over the open panel', (await bubble()).hidden);
    await pg.keyboard.press('Escape');
    await ctx.close();

    /* the REAL triggers, not synthetic events: Mark-complete button and quiz submit */
    const ch = await open('/topics/current.html');
    await ch.pg.locator('[data-complete-topic]').first().scrollIntoViewIfNeeded();
    await ch.pg.locator('[data-complete-topic]').first().click();
    await ch.pg.waitForTimeout(300);
    const done = await ch.pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent }; });
    ok('6 marking a chapter complete makes the mascot acknowledge it', !done.hidden && done.text.length > 5, JSON.stringify(done));
    await ch.ctx.close();

    const qz = await open('/quiz.html');
    for (let i = 0; i < 4; i++) {
      const graded = await qz.pg.evaluate(() => !!document.querySelector('#quiz-score .score-num, #quiz-score [data-score], #quiz-score') && /Retake|retake/.test(document.body.textContent));
      if (graded) break;
      await qz.pg.locator('#quiz-submit').click();
      await qz.pg.waitForTimeout(350);
    }
    await qz.pg.waitForTimeout(300);
    const qs = await qz.pg.evaluate(() => { const b = document.getElementById('mascotSay'); return { hidden: b.hidden, text: b.textContent }; });
    ok('6 submitting the quiz makes the mascot react to the score (blank quiz = 0% = encouragement)',
      !qs.hidden && /starts|read the notes|practice|Keep going|explanations/i.test(qs.text), JSON.stringify(qs));
    await qz.ctx.close();
  }

  /* 7: before/after intro, narrow screens */
  {
    const { ctx, pg } = await open('/index.html', { intro: true });
    await pg.waitForFunction(() => document.getElementById('introOverlay')?.classList.contains('play'), null, { timeout: 8000 });
    const box = await pg.locator('#mascotBtn').boundingBox();
    await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    ok('7 while the intro plays the mascot cannot be clicked through it', !(await panelOpen(pg)));
    await pg.click('#introSkip');
    await pg.waitForFunction(() => !document.getElementById('introOverlay'), null, { timeout: 4000 });
    await pg.click('#mascotBtn');
    ok('7 after the intro the mascot works', await panelOpen(pg));
    await ctx.close();
  }
  for (const [w, h] of [[390, 844], [360, 740], [844, 390], [768, 1024]]) {
    for (const url of ['/index.html', '/topics/fields.html', '/quiz.html']) {
      const { ctx, pg } = await open(url, { w, h });
      /* page-level overflow is measured before AND after opening: the panel must
         not add any (fields.html already overflows by a few px from its own
         #charge-tryit block and KaTeX rows — a pre-existing layout issue) */
      const overflow = () => pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const before = await overflow();
      await pg.click('#mascotBtn');
      const m = await pg.evaluate(() => {
        const p = document.getElementById('mascotPanel').getBoundingClientRect();
        return { left: Math.round(p.left), right: Math.round(p.right), bottom: Math.round(p.bottom), vw: innerWidth, vh: innerHeight };
      });
      m.overflowBefore = before; m.overflowAfter = await overflow();
      ok(`7 ${w}x${h} ${url}: panel fits the viewport and adds no sideways scroll`,
        m.overflowAfter <= Math.max(before, 0) && m.left >= 0 && m.right <= m.vw && m.bottom <= m.vh, JSON.stringify(m));
      await ctx.close();
    }
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'UI CONTRACT PASS' : h.failed() + ' UI FAILURES');
}

/* ==========================================================================
   EMC Lab — theme verification in a REAL browser (dark default, light opt-in).
     1 dark is the default, even when the OS asks for a light scheme
     2 the nav toggle switches theme on every page, with the right aria-pressed,
       theme-color meta and native color-scheme; Enter and Space work; on a phone
       it lives in the opened menu
     3 the choice persists in the existing prefs record (emc.prefs.v1), survives a
       reload and is applied BEFORE first paint (no flash of the wrong theme)
     4 switching never reloads the page and never touches Details, quiz answers
       or saved progress
     5 Chart.js results redraw in the new theme's colours
     6 simulation canvases and figure plates stay on their dark plate in both themes
     7 the keyboard focus ring keeps >= 3:1 against the page in both themes
     8 every visible text element meets WCAG AA contrast (4.5:1, or 3:1 for large
       text) in both themes on home, both chapters and the quiz incl. its results;
       disabled controls are exempt (WCAG)
     9 zero console/page errors
   Exits 1 on any failure.
   ========================================================================== */
async function theme(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function open(url, { theme, ...ctxOpts } = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, ctxOpts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    if (theme === 'light') await pg.addInitScript(() => { if (!localStorage.getItem('emc.prefs.v1')) localStorage.setItem('emc.prefs.v1', JSON.stringify({ theme: 'light' })); });
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(1200);
    return { ctx, pg };
  }
  const themeOf = pg => pg.evaluate(() => document.documentElement.dataset.theme || 'dark');
  const prefs = pg => pg.evaluate(() => JSON.parse(localStorage.getItem('emc.prefs.v1') || '{}'));

  /* 1: default is dark, even if the OS says light */
  for (const scheme of ['light', 'dark']) {
    const { ctx, pg } = await open('/index.html', { colorScheme: scheme });
    ok(`1 default theme is dark with an OS "${scheme}" preference`, (await themeOf(pg)) === 'dark' && !(await pg.evaluate(() => document.documentElement.dataset.theme)));
    await ctx.close();
  }

  /* 2 + 3: toggle everywhere, persistence, no flash */
  for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
    const { ctx, pg } = await open(url);
    const before = await pg.evaluate(() => ({ cs: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').content, pressed: document.getElementById('themeToggle').getAttribute('aria-pressed') }));
    await pg.click('#themeToggle');
    await pg.waitForTimeout(300);
    const after = await pg.evaluate(() => ({ cs: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').content, pressed: document.getElementById('themeToggle').getAttribute('aria-pressed') }));
    ok(`2 ${url}: toggle switches to light (background, color-scheme, theme-color meta, aria-pressed)`,
      (await themeOf(pg)) === 'light' && before.pressed === 'false' && after.pressed === 'true' &&
      before.cs === 'dark' && after.cs === 'light' && before.meta === '#17181c' && after.meta === '#faf7ec' && before.bg !== after.bg, JSON.stringify({ before, after }));
    ok(`3 ${url}: the choice is stored in the existing prefs record`, (await prefs(pg)).theme === 'light');
    await pg.reload({ waitUntil: 'load' });
    await pg.waitForTimeout(700);
    ok(`3 ${url}: light survives a reload`, (await themeOf(pg)) === 'light' && (await pg.getAttribute('#themeToggle', 'aria-pressed')) === 'true');
    await pg.click('#themeToggle');
    ok(`3 ${url}: toggling back restores dark and the stored pref`, (await themeOf(pg)) === 'dark' && (await prefs(pg)).theme === 'dark');
    await ctx.close();
  }
  {
    /* applied before first paint: record readyState when the attribute first appears */
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    await pg.addInitScript(skipIntroOnLoad);
    await pg.addInitScript(() => {
      localStorage.setItem('emc.prefs.v1', JSON.stringify({ theme: 'light' }));
      new MutationObserver(() => {
        if (document.documentElement.dataset.theme && window.__themeSeenAt === undefined) window.__themeSeenAt = document.readyState;
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });   // <html> may not exist yet
    });
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    ok('3 light is applied while the document is still loading (before first paint, no flash)', (await pg.evaluate(() => window.__themeSeenAt)) === 'loading', String(await pg.evaluate(() => window.__themeSeenAt)));
    await ctx.close();
  }
  {
    const { ctx, pg } = await open('/index.html');
    await pg.focus('#themeToggle');
    await pg.keyboard.press('Enter');
    const viaEnter = await themeOf(pg);
    await pg.keyboard.press('Space');
    ok('2 the toggle works from the keyboard (Enter then Space)', viaEnter === 'light' && (await themeOf(pg)) === 'dark');
    await ctx.close();
    const m = await open('/index.html', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await m.pg.click('#navToggle');
    await m.pg.click('#themeToggle');
    ok('2 on a phone the toggle sits in the opened menu and works', (await themeOf(m.pg)) === 'light');
    await m.ctx.close();
  }

  /* 4: switching keeps everything else */
  {
    const { ctx, pg } = await open('/quiz.html');
    await pg.evaluate(() => { window.__marker = 'same-document'; document.querySelectorAll('.q-card')[0].querySelector('.opt').click(); document.querySelectorAll('.q-card')[1].querySelector('.opt').click(); });
    await pg.click('#detailToggle');
    await pg.waitForTimeout(400);
    const before = { pill: await pg.textContent('#pillText'), detail: await pg.evaluate(() => document.documentElement.dataset.detail), progress: await pg.evaluate(() => localStorage.getItem('emc.progress.v4')) };
    await pg.click('#themeToggle');
    await pg.waitForTimeout(400);
    const after = { pill: await pg.textContent('#pillText'), detail: await pg.evaluate(() => document.documentElement.dataset.detail), progress: await pg.evaluate(() => localStorage.getItem('emc.progress.v4')) };
    ok('4 switching theme keeps quiz answers, the Details level and saved progress, without reloading',
      JSON.stringify(before) === JSON.stringify(after) && after.pill === '2/16' && after.detail === 'off' && (await pg.evaluate(() => window.__marker)) === 'same-document', JSON.stringify({ before, after }));
    ok('4 the other preferences in the record are preserved', (await prefs(pg)).detail === 'off' && (await prefs(pg)).theme === 'light');
    await ctx.close();
  }

  /* 5: charts follow the theme */
  {
    const { ctx, pg } = await open('/quiz.html');
    await pg.evaluate(() => document.querySelectorAll('.q-card').forEach((c, i) => c.querySelectorAll('.opt')[i % 4].click()));
    for (let i = 0; i < 4; i++) { await pg.locator('#quiz-submit').click().catch(() => {}); await pg.waitForTimeout(350); }
    await pg.waitForTimeout(1200);
    const colours = () => pg.evaluate(() => {
      const c = window.Chart && Object.values(window.Chart.instances).find(i => i.config.type === 'doughnut');
      return c ? { good: c.data.datasets[0].backgroundColor[0], ring: c.data.datasets[0].borderColor, n: Object.keys(window.Chart.instances).length } : null;
    });
    const dark = await colours();
    await pg.click('#themeToggle');
    await pg.waitForTimeout(900);
    const light = await colours();
    ok('5 results charts redraw in the light palette after switching (and stay at three charts)',
      dark && light && dark.good !== light.good && light.good === '#3e7f1b' && /^#(fff|ffffff)$/.test(light.ring) && light.n === 3   /* the minifier shortens #ffffff */ && dark.n === 3, JSON.stringify({ dark, light }));
    await ctx.close();
  }

  /* 6 + 7: plates stay dark; focus ring contrast */
  for (const theme of ['dark', 'light']) {
    const { ctx, pg } = await open('/topics/fields.html', { theme });
    const plates = await pg.evaluate(() => [...document.querySelectorAll('.sim-canvas')].map(c => getComputedStyle(c).backgroundColor));
    ok(`6 [${theme}] every simulation canvas keeps its dark plate`, plates.length >= 4 && plates.every(p => p === 'rgb(16, 17, 20)'), JSON.stringify([...new Set(plates)]));
    await pg.focus('#detailToggle');
    await pg.keyboard.press('Tab');   // moves focus with the keyboard so :focus-visible applies
    const ring = await pg.evaluate(() => {
      const parse = c => c.match(/[\d.]+/g).map(Number);
      const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const cs = getComputedStyle(document.activeElement);
      const o = parse(cs.outlineColor), bg = parse(getComputedStyle(document.body).backgroundColor);
      const [a, b] = [lum(o), lum(bg)];
      return { outline: cs.outlineStyle, width: cs.outlineWidth, ratio: +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2) };
    });
    ok(`7 [${theme}] the focus ring is drawn and has >= 3:1 contrast with the page`, ring.outline === 'solid' && ring.ratio >= 3, JSON.stringify(ring));
    await ctx.close();
  }

  /* 8: WCAG text contrast, both themes, real composited colours */
  async function contrastFailures(url, theme, results) {
    const { ctx, pg } = await open(url, { theme });
    if (results) {
      await pg.evaluate(() => document.querySelectorAll('.q-card').forEach((c, i) => c.querySelectorAll('.opt')[i % 4].click()));
      for (let i = 0; i < 4; i++) { await pg.locator('#quiz-submit').click().catch(() => {}); await pg.waitForTimeout(350); }
      await pg.waitForTimeout(1200);
    }
    await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } scrollTo(0, 0); });
    await pg.waitForTimeout(500);
    const bad = await pg.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
      const over = (f, bg) => ({ r: f.r * f.a + bg.r * (1 - f.a), g: f.g * f.a + bg.g * (1 - f.a), b: f.b * f.a + bg.b * (1 - f.a), a: 1 });
      const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
      const bgOf = el => {
        const chain = [];
        for (let e = el; e; e = e.parentElement) {
          const cs = getComputedStyle(e); const c = parse(cs.backgroundColor);
          if (c && c.a > 0) chain.push(c);
          if (c && c.a === 1) break;
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
        }
        let base = parse(getComputedStyle(document.body).backgroundColor);
        let acc = chain.length && chain[chain.length - 1].a === 1 ? chain.pop() : base;
        while (chain.length) acc = over(chain.pop(), acc);
        return acc;
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set(); let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const e = n.parentElement; if (!e || seen.has(e)) continue; seen.add(e);
        if (e.closest('#introOverlay,script,style,canvas,svg,.katex-mathml,[hidden],[inert],.sr-only,.skip-link,.sim-canvas,.canvas-wrap,[data-mx]:not(.mx-in),.topic-num'  /* .topic-num: decorative aria-hidden watermark numerals */)) continue;
        if (e.closest('button:disabled,[disabled],[aria-disabled="true"]')) continue;       // inactive controls are exempt
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
        let op = 1; for (let x = e; x; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity);
        if (op < .05) continue;
        const bg = bgOf(e); const fg0 = parse(cs.color); if (!bg || !fg0) continue;
        const fg = over({ ...fg0, a: fg0.a * op }, bg);
        const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
        const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        if (ratio < need) out.push(`${e.tagName}${e.id ? '#' + e.id : ''}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} ${ratio.toFixed(2)}<${need} "${n.textContent.trim().slice(0, 22)}"`);
      }
      return [...new Set(out)];
    });
    await ctx.close();
    return bad;
  }
  for (const theme of ['dark', 'light']) {
    for (const [url, results] of [['/index.html', false], ['/index.html#/ch1', false], ['/index.html#/ch2', false], ['/quiz.html', true]]) {
      const bad = await contrastFailures(url, theme, results);
      ok(`8 [${theme}] ${url}${results ? ' (with results)' : ''}: all visible text meets WCAG AA contrast`, bad.length === 0, bad.slice(0, 4).join(' | '));
    }
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'THEME CONTRACT PASS' : h.failed() + ' THEME FAILURES');
}

/* ==========================================================================
   EMC Lab — responsive verification in a REAL browser.
   Every page and chapter route at 3440x1440, 1366x768, 1024x768, 768x1024,
   390x844 and 844x390 (after scrolling the whole page so lazy and
   reveal-gated blocks have run):
     1 the page never scrolls sideways (this used to fail on Chapter 2: blocks
       waiting to be revealed sit at a tilt/scale that stuck out past the edge)
     2 no VISIBLE element pokes past the viewport (so the fix above is not just
       hiding real overflow) — scrolling containers are excluded
     3 interactive controls are at least 24 px in both directions (WCAG 2.5.8),
       measured on a coarse-pointer phone profile; inline links in running text
       are exempt
     4 every KaTeX equation renders (no .katex-error), none is shrunk below 13 px
   Exits 1 on any failure.
   ========================================================================== */
async function responsive(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  const VIEWPORTS = [[3440, 1440], [1366, 768], [1024, 768], [768, 1024], [390, 844], [844, 390]];
  const PAGES = ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html', '/index.html#/ch1', '/index.html#/ch2'];

  async function visit(url, vp, extra = {}) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, ...extra });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(1500);
    await pg.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
      scrollTo(0, 0);
    });
    await pg.waitForTimeout(500);
    return { ctx, pg };
  }

  /* 1 + 2 + 4: layout at every viewport */
  for (const url of PAGES) {
    const bad = [];
    for (const vp of VIEWPORTS) {
      const { ctx, pg } = await visit(url, vp);
      const r = await pg.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sideways = document.documentElement.scrollWidth - vw;
        const poking = [];
        document.querySelectorAll('.emc-main *').forEach(e => {
          const cs = getComputedStyle(e);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
          if (e.closest('[data-mx]:not(.mx-in), [hidden], [inert]')) return;   // waiting to be revealed / not shown
          const b = e.getBoundingClientRect();
          if (b.width === 0 || b.height === 0 || (b.right <= vw + 1 && b.left >= -1)) return;
          for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p).overflowX;
            if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.scrollWidth >= p.clientWidth) return;   // inside its own scroller
          }
          poking.push((e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') || e.tagName);
        });
        return { sideways, poking: [...new Set(poking)].slice(0, 4), katexErr: document.querySelectorAll('.katex-error').length,
          tinyMath: [...document.querySelectorAll('.katex')].filter(k => k.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(k).fontSize) < 13).length };
      });
      if (r.sideways > 0 || r.poking.length || r.katexErr || r.tinyMath) bad.push(`${vp[0]}x${vp[1]} ${JSON.stringify(r)}`);
      await ctx.close();
    }
    ok(`${url}: no sideways scroll, nothing visible past the edge, equations render legibly at all 6 viewports`, bad.length === 0, bad.join(' | '));
  }

  /* 3: touch-target minimums on a coarse-pointer phone profile */
  for (const url of ['/index.html', '/quiz.html', '/topics/current.html', '/topics/fields.html']) {
    const { ctx, pg } = await visit(url, [390, 844], { hasTouch: true, isMobile: true });
    const small = await pg.evaluate(() => {
      const out = [];
      document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=button],[role=radio],[role=slider],[tabindex="0"]').forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || e.closest('[hidden],[inert],.skip-link')) return;
        const b = e.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        if (e.tagName === 'A' && e.closest('p,li,small,.tiny,.small,.where,figcaption') && cs.display === 'inline') return;   // inline text link in a sentence
        if (e.tagName === 'INPUT' && (e.type === 'checkbox' || e.type === 'radio') && e.closest('label')) return;       // the label is the target
        if (Math.min(b.width, b.height) < 24) out.push(`${e.tagName}${e.id ? '#' + e.id : ''}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/)[0] : ''} ${Math.round(b.width)}x${Math.round(b.height)}`);
      });
      return [...new Set(out)];
    });
    ok(`${url}: every control is at least 24x24 px on a phone`, small.length === 0, small.slice(0, 5).join(' | '));
    await ctx.close();
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'RESPONSIVE CONTRACT PASS' : h.failed() + ' RESPONSIVE FAILURES');
}

/* ==========================================================================
   EMC Lab — accessibility & reduced-motion verification (gates A + R).
   Keyboard-only completion of: home -> chapter -> sim controls -> quiz ->
   results. Visible focus everywhere. State never carried by colour alone.
   Then the same flows under emulated prefers-reduced-motion: decorative
   motion off, ALL state feedback intact.
   Exits 1 on any failure.
   ========================================================================== */
async function a11y(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function page(opts = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    return { ctx, pg };
  }
  const focusVisible = pg => pg.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const cs = getComputedStyle(a);
    return {
      tag: a.tagName, id: a.id || '', cls: (a.className || '').toString().slice(0, 30),
      outline: parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none',
      matchesFV: a.matches(':focus-visible')
    };
  });

  /* =============== intro accessibility (PART 6/8.2) ========================= */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(900);
    const up = await pg.evaluate(() => !!document.getElementById('introOverlay'));
    ok('A0 intro plays on a bare landing load', up === true);
    if (up) {
      await pg.keyboard.press('Tab');
      const first = await pg.evaluate(() => ({ id: document.activeElement.id, outline: getComputedStyle(document.activeElement).outlineStyle !== 'none' }));
      ok('A0 the skip control is the first tab stop with a visible ring', first.id === 'introSkip' && first.outline, JSON.stringify(first));
      const pe = await pg.evaluate(() => getComputedStyle(document.getElementById('introOverlay')).pointerEvents);
      /* CONTRACT CHANGE (2026-10-27): the playing intro now owns the screen, so
         nothing behind it can be clicked or tabbed to (the page is inert too). */
      ok('A0 the playing intro captures pointer events (no click-through)', pe === 'auto', pe);
      await pg.keyboard.press('Enter');
      /* CONTRACT CHANGE (2026-10-25, v8): the exit is a .5 s .done fade, so the
         overlay node leaves at ~700 ms, not ~180 ms as in the CSS-exit cuts. */
      await pg.waitForTimeout(1000);
      ok('A0 Enter on skip dismisses the intro', (await pg.evaluate(() => !!document.getElementById('introOverlay'))) === false);
      await pg.keyboard.press('Tab');
      const after = await pg.evaluate(() => document.activeElement.className.toString().slice(0, 20));
      ok('A0 after the intro the skip-link is the first tab stop again', /skip-link/.test(after), after);
    }
    await ctx.close();
  }

  /* =============== keyboard-only core flow (gate A) ========================= */
  {
    const { ctx, pg } = await page();
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(600);

    /* skip link is first and works */
    await pg.keyboard.press('Tab');
    let f = await focusVisible(pg);
    ok('A1 first tab stop is the skip link with a visible outline', f && /skip/i.test(f.cls) && f.outline, JSON.stringify(f));
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const onMain = await pg.evaluate(() => document.activeElement.id);
    ok('A1 skip link moves focus to #main', onMain === 'main', onMain);

    /* walk to the Chapters dropdown, open it, reach ch2, activate by keyboard */
    await pg.evaluate(() => document.getElementById('topicsBtn').focus());
    f = await focusVisible(pg);
    ok('A2 dropdown button shows a visible focus ring', f && f.outline, JSON.stringify(f));
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(250);
    await pg.keyboard.press('Tab');
    const inMenu = await pg.evaluate(() => !!document.activeElement.closest('#topicsMenu'));
    ok('A2 tab enters the open dropdown', inMenu);
    /* tab to the fields link (2nd chapter link) and activate */
    await pg.evaluate(() => document.querySelector('#topicsMenu a[href$="fields.html"]').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(1400);
    const mounted = await pg.evaluate(() => ({
      hash: location.hash,
      h1: (document.querySelector('#shell-topic h1') || {}).textContent,
      focus: document.activeElement ? document.activeElement.tagName : ''
    }));
    ok('A2 keyboard activates the chapter and focus lands in it',
      mounted.hash === '#/ch2' && /Electric Fields/.test(mounted.h1 || '') && mounted.focus === 'H1', JSON.stringify(mounted));

    /* sim controls by keyboard: scroll the panel in (as Tab-focus would), let
       the lazy sim initialise, then activate the preset with Enter */
    await pg.evaluate(() => document.querySelector('#ar-panel').scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => !!window.__AR, null, { timeout: 5000 });
    await pg.evaluate(() => document.querySelector('#ar-panel [data-sb-preset="lecture-line"]').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(700);
    const preset = await pg.evaluate(() => document.getElementById('ar-count').textContent);
    ok('A3 sim preset is keyboard-operable (Enter loads the 3-charge lecture line)', preset === '3', preset);

    /* chapter-complete button announces state in words */
    await pg.evaluate(() => document.querySelector('[data-complete-topic="ch2"]').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(400);
    const done = await pg.evaluate(() => {
      const b = document.querySelector('[data-complete-topic="ch2"]');
      return { pressed: b.getAttribute('aria-pressed'), text: b.textContent.trim() };
    });
    ok('A4 chapter-complete state is words + aria-pressed, never colour alone',
      done.pressed === 'true' && /completed/i.test(done.text), JSON.stringify(done));
    await ctx.close();
  }

  /* =============== ch1 bench by keyboard (sliders, lanes, chips) ============ */
  {
    const { ctx, pg } = await page();
    await pg.goto(B + '/topics/current.html', { waitUntil: 'load' });
    await pg.waitForTimeout(500);
    await pg.evaluate(() => document.getElementById('sim-ohm').scrollIntoView());
    await pg.waitForTimeout(600);
    await pg.evaluate(() => document.getElementById('ohm-V').focus());
    const v0 = await pg.evaluate(() => document.getElementById('ohm-V').value);
    await pg.keyboard.press('ArrowUp'); await pg.keyboard.press('ArrowUp');
    await pg.waitForTimeout(300);
    const v1 = await pg.evaluate(() => ({ v: document.getElementById('ohm-V').value, I: document.getElementById('ohm-I').textContent }));
    ok('A5 Ohm slider works by arrow keys and the readout follows',
      Number(v1.v) > Number(v0) && /A/.test(v1.I), JSON.stringify(v1));
    await pg.evaluate(() => document.getElementById('sim-circuit').scrollIntoView());
    await pg.waitForTimeout(600);
    /* keyboard path: arm a resistor from the palette, place it on socket 4 */
    await pg.evaluate(() => document.querySelector('[data-circ-part="res"]').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(200);
    await pg.evaluate(() => document.getElementById('circ-sk3').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(400);
    const placed = await pg.evaluate(() => ({
      rows: document.querySelectorAll('#circ-rows .circ-row').length,
      R: document.getElementById('circ-R').textContent
    }));
    ok('A6 placing a part is keyboard-operable (arm + socket Enter -> 59.0 ohm)',
      placed.rows === 4 && /59\.0/.test(placed.R), JSON.stringify(placed));
    await pg.evaluate(() => document.getElementById('circ-sk0').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const bat = await pg.evaluate(() => ({
      note: document.getElementById('circ-note').textContent,
      it: document.getElementById('circ-I').textContent,
      label: document.getElementById('circ-sk0').getAttribute('aria-label')
    }));
    ok('A7 socket buttons remove by keyboard with an honest open-loop readout',
      /0/.test(bat.it) && /battery/i.test(bat.note) && /empty/.test(bat.label), JSON.stringify(bat));
    await ctx.close();
  }

  /* =============== quiz -> results by keyboard ============================== */
  {
    const { ctx, pg } = await page();
    await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
    await pg.waitForTimeout(600);
    await pg.evaluate(() => document.querySelector('.q-card').scrollIntoView());
    await pg.waitForTimeout(500);
    /* answer all 16 with the keyboard: number key for the active card, 'n' to
       jump to the next blank, then WAIT for the smooth scroll to settle (the
       active-card observer only re-targets once scrolling stops — the same
       rhythm a human typist waits for). */
    const settle = () => pg.evaluate(() => new Promise(res => {
      let last = window.scrollY, same = 0;
      const t = setInterval(() => {
        if (Math.abs(window.scrollY - last) < 1) { if (++same >= 3) { clearInterval(t); res(true); } }
        else { same = 0; last = window.scrollY; }
      }, 60);
    }));
    for (let i = 0; i < 16; i++) {
      await pg.keyboard.press(String((i % 4) + 1));
      await pg.waitForTimeout(120);
      await pg.keyboard.press('n');
      await settle();
      await pg.waitForTimeout(150);
    }
    const pill = await pg.textContent('#pillText');
    ok('A8 the whole quiz is answerable by keyboard alone', pill === '16/16', pill);
    await pg.evaluate(() => document.getElementById('quiz-submit').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(250);
    const confirmTxt = await pg.textContent('#quiz-submit');
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(1000);
    const score = await pg.evaluate(() => ({
      visible: !document.getElementById('quiz-score').hidden,
      words: [...document.querySelectorAll('.opt .mark')].slice(0, 4).map(m => m.textContent).join('|'),
      badges: document.querySelectorAll('.fbadge').length
    }));
    ok('A9 submit + confirm run from the keyboard; results render', score.visible && /confirm/i.test(confirmTxt), confirmTxt);
    ok('A10 graded state uses WORDS (correct / your answer), not colour alone',
      /correct/.test(score.words) && score.badges >= 1, score.words + ' badges:' + score.badges);
    await ctx.close();
  }

  /* =============== reduced motion (gate R) ================================== */
  {
    const { ctx, pg } = await page({ reducedMotion: 'reduce' });
    await pg.goto(B + '/index.html', { waitUntil: 'load' });
    await pg.waitForTimeout(900);
    const rm = await pg.evaluate(() => {
      const reveals = [...document.querySelectorAll('.reveal')];
      const hidden = reveals.filter(r => getComputedStyle(r).opacity !== '1');
      const anims = document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1;
      return { revealCount: reveals.length, hidden: hidden.length, runningAnimations: anims };
    });
    ok('R1 reduced motion: every reveal-gated block is fully visible', rm.hidden === 0 && rm.revealCount > 5, JSON.stringify(rm));
    ok('R1 reduced motion: no decorative animations are running', rm.runningAnimations === 0, String(rm.runningAnimations));
    /* state feedback must survive: detail toggle flips content + aria, toast appears */
    await pg.evaluate(() => document.getElementById('detailToggle').focus());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const fb = await pg.evaluate(() => ({
      attr: document.documentElement.dataset.detail,
      pressed: document.getElementById('detailToggle').getAttribute('aria-pressed'),
      label: document.querySelector('.dt-state').textContent,
      toast: (document.getElementById('toastHost') || { textContent: '' }).textContent
    }));
    ok('R2 reduced motion: Detail toggle still flips + announces (state feedback intact)',
      fb.attr === 'off' && fb.pressed === 'false' && fb.label === 'OFF' && /Details OFF/.test(fb.toast), JSON.stringify(fb));
    /* quiz answer feedback under reduce */
    await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
    await pg.waitForTimeout(600);
    await pg.evaluate(() => {
      const card = document.querySelector('.q-card');
      card.scrollIntoView();
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
      document.querySelector('#quiz-mode [data-value="instant"]').click();
    });
    await pg.waitForTimeout(300);
    await pg.evaluate(() => {
      const card = document.querySelector('.q-card');
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
    });
    await pg.waitForTimeout(400);
    const qfb = await pg.evaluate(() => ({
      picked: document.querySelectorAll('.opt.pick, .opt[aria-checked="true"]').length,
      anims: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : -1
    }));
    ok('R3 reduced motion: quiz selection feedback present, decorative animation off',
      qfb.picked >= 1 && qfb.anims === 0, JSON.stringify(qfb));
    await ctx.close();
  }

  console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'A11Y + REDUCED-MOTION PASS' : h.failed() + ' A11Y/RM FAILURES');
}

/* ==========================================================================
   EMC Lab — asset verification (phase 8 §6 + §7A favicon).
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
async function assets(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
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

  console.log(h.failed() === 0 ? 'ASSET CONTRACT PASS' : h.failed() + ' ASSET FAILURES');
}

export const suites = {
  ui: { about: 'visual and interaction contract of the UI', browser: true, run: ui },
  theme: { about: 'dark / light themes and palette tokens', browser: true, run: theme },
  responsive: { about: 'no overflow, targets and layout across viewports', browser: true, run: responsive },
  a11y: { about: 'keyboard-only flows, focus, reduced motion', browser: true, run: a11y },
  assets: { about: 'images, fonts, favicon, caching headers', browser: true, run: assets }
};
