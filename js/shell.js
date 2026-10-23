/* EMC Lab shell — same-page topic switching for index.html.
   One source of truth: chapter content lives in topics/*.html (standalone
   pages keep working unchanged). The shell fetches a topic's <main>, mounts it
   into the #shell-topic section and loads that chapter's sim scripts ONCE over
   the network (re-executed per mount, so each sim IIFE re-binds through
   EMC.whenNear to the freshly mounted canvases). Routes: #/charge, #/coulomb, #/field,
   #/current, #/magind; unknown #/… falls back to home; every other hash stays a normal
   in-page anchor. Inactive sections are hidden AND inert; stages of a leaving
   topic are destroyed through the Stage's single cleanup path. */
(function () {
  const REG = window.EMC_REGISTRY;
  const EMC = window.EMC;
  if (!REG || !EMC) return;
  const home = document.getElementById('shell-home');
  const topicSec = document.getElementById('shell-topic');
  const body = document.getElementById('shell-topic-body');
  if (!home || !topicSec || !body) return;      // standalone topic pages: no shell
  if (location.protocol === 'file:') return;    // file:// cannot fetch: keep real links

  const CHAPTERS = REG.chapters.filter(c => c.path && c.path.indexOf('topics/') === 0);
  const byId = id => CHAPTERS.find(c => c.id === id) || null;
  const byPath = path => CHAPTERS.find(c => c.path === path) || null;
  const HOME_TITLE = document.title;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const mainCache = new Map();     // chapter id -> <main> innerHTML
  const srcCache = new Map();      // chapter id -> sim id -> script src (as shipped)
  const scriptCache = new Map();   // sim url -> source text (network: once)
  let active = 'home';             // 'home' | chapter id
  let pendingAnchor = null;        // e.g. sim-induction-panel from a deep link
  let loadToken = 0;               // ignores fetches that lose a race

  /* ---- routing ---------------------------------------------------------- */
  function routeFromHash() {
    const h = location.hash || '';
    if (h.indexOf('#/') !== 0) return null;     // plain anchor: leave it native
    return byId(h.slice(2)) ? h.slice(2) : 'home';
  }

  /* ---- mount / unmount --------------------------------------------------- */
  function teardownTopic() {
    EMC.destroyStagesIn(topicSec);              // the one cleanup path
    body.innerHTML = '';
  }

  function setSections(showTopic) {
    home.hidden = showTopic;
    home.inert = showTopic;
    topicSec.hidden = !showTopic;
    topicSec.inert = !showTopic;
  }

  function focusTitle() {
    const h1 = topicSec.querySelector('h1');
    if (h1 === null || h1 === undefined) return;
    h1.setAttribute('tabindex', '-1');
    try { h1.focus({ preventScroll: true }); } catch (err) { h1.focus(); }
  }

  function failCard(ch) {
    return '<div class="wrap section-tight"><div class="card">' +
      '<p class="font-bold">This chapter could not be loaded here.</p>' +
      '<p class="small muted" style="margin:.3rem 0 .8rem">The same-page reader fetches chapters from the site; ' +
      'the request did not complete. The standalone page always works.</p>' +
      '<div class="btn-group"><a class="btn btn-primary" href="' + ch.path + '">Open the standalone page</a>' +
      '<a class="btn" href="#/">Back to home</a></div></div></div>';
  }

  async function fetchMain(ch) {
    if (mainCache.has(ch.id)) return mainCache.get(ch.id);
    const res = await fetch(ch.path, { credentials: 'omit' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const main = doc ? doc.querySelector('main') : null;
    if (!main) throw new Error('no <main> in ' + ch.path);
    mainCache.set(ch.id, main.innerHTML);
    /* The production build ships hashed asset names (js/sim-ohm.<hash>.js), so
       never guess a script URL: read ALL of the topic's own <script> tags in
       document order — that keeps shared engines (js/sandbox-core.js) ahead of
       the sims that need them. Scripts index.html already runs, and vendored
       libraries, are skipped. */
    const HAVE = ['registry.js', 'common.js'];
    const srcs = [];
    doc.querySelectorAll('script[src]').forEach(tag => {
      let src = tag.getAttribute('src') || '';
      if (src.indexOf('/js/') === -1) return;            // vendor/katex etc.
      if (HAVE.some(h => src.indexOf(h) >= 0)) return;   // already on index
      src = src.replace(/^\.\.\//, '').replace(/^\.\//, '');
      if (src) srcs.push(src);
    });
    srcCache.set(ch.id, srcs);
    return main.innerHTML;
  }

  /* Sim scripts: fetched once, re-run per mount. Each sim is an IIFE that
     looks its canvas up at run time and defers init through EMC.whenNear, so
     a fresh execution binds exactly the currently mounted canvases. */
  async function runSimScripts(ch, token) {
    const srcs = srcCache.get(ch.id) || [];
    for (const url of srcs) {
      if (token !== loadToken) return false;    // a newer switch owns the body
      let txt = scriptCache.get(url);
      if (txt === undefined) {
        try {
          const r = await fetch(url, { credentials: 'omit' });
          txt = r.ok ? await r.text() : '';
        } catch (err) { txt = ''; }
        scriptCache.set(url, txt);
      }
      if (token !== loadToken) return false;
      if (txt) {
        const tag = document.createElement('script');
        tag.textContent = txt;
        body.appendChild(tag);
      }
    }
    return token === loadToken;
  }

  function showHome(opts) {
    const token = ++loadToken;
    if (active === 'home' && !(opts && opts.force)) return;
    teardownTopic();
    active = 'home';
    setSections(false);
    document.title = HOME_TITLE;
    if (!opts || opts.scroll !== false) window.scrollTo(0, 0);
    void token;
  }

  async function activate(id, opts) {
    const ch = byId(id);
    if (!ch) { showHome(opts); return; }
    const token = ++loadToken;
    if (active === id) return;
    teardownTopic();
    active = id;
    setSections(true);
    document.title = ch.num + ' · ' + ch.title + ' — EMC Lab';
    body.innerHTML = '<div class="wrap section-tight"><div class="card">' +
      '<p class="small muted" style="margin:0">Loading ' + ch.short + '…</p></div></div>';
    window.scrollTo(0, 0);
    try {
      const html = await fetchMain(ch);
      if (token !== loadToken) return;          // a newer switch won the race
      body.innerHTML = html;
      // mounted content keeps working like the standalone page: reveal-gated
      // blocks get observed now, and bare relative chapter links (field.html)
      // are re-based into topics/ so they resolve (and same-page switch) here
      if (EMC.UI && EMC.UI.initReveal) EMC.UI.initReveal();
      body.querySelectorAll('a[href]').forEach(a => {
        const h = a.getAttribute('href') || '';
        if (/^(https?:|#|\/|mailto:)/.test(h)) return;
        if (h.indexOf('../') === 0 || h.indexOf('topics/') === 0) return;
        a.setAttribute('href', 'topics/' + h);
      });
      if (EMC.katexify) { try { EMC.katexify(body); } catch (err) { /* typeset later */ } }
      const mine = await runSimScripts(ch, token);
      if (!mine) return;
      EMC.resizeStagesIn(topicSec);             // size canvases now that we're visible
      if (!EMC.reducedMotion) {
        topicSec.classList.remove('shell-enter');
        void topicSec.offsetWidth;
        topicSec.classList.add('shell-enter');
      }
      focusTitle();
      if (pendingAnchor) {
        const t = document.getElementById(pendingAnchor);
        if (t) EMC.scrollToEl(t);
        pendingAnchor = null;
      }
    } catch (err) {
      if (token !== loadToken) return;
      body.innerHTML = failCard(ch);
      focusTitle();
    }
  }

  function go(route, opts) {
    if (route === null) return;                 // native anchor behaviour
    if (route === 'home') showHome(opts); else activate(route, opts);
  }

  /* ---- events ------------------------------------------------------------ */
  window.addEventListener('hashchange', () => { go(routeFromHash(), {}); });

  /* Same-origin topic links become same-page switches; the href stays real so
     middle-click, copy-link and no-JS visits still reach the standalone page. */
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    let path = href; let anchor = null;
    const hashAt = href.indexOf('#');
    if (hashAt >= 0) { path = href.slice(0, hashAt); anchor = href.slice(hashAt + 1); }
    if (path === 'index.html' || path === './index.html' || path === '/') {
      e.preventDefault();
      if ((location.hash || '') !== '#/') location.hash = '#/'; else showHome({ force: true });
      return;
    }
    const ch = byPath(path);
    if (!ch) return;
    e.preventDefault();
    if (location.hash === '#/' + ch.id) {
      // already on this topic: honour the anchor (or do nothing)
      if (anchor) { const t = document.getElementById(anchor); if (t) EMC.scrollToEl(t); }
      return;
    }
    pendingAnchor = anchor;
    location.hash = '#/' + ch.id;               // hashchange drives the switch
  });

  /* ---- boot: honour a deep link ------------------------------------------ */
  const bootRoute = routeFromHash();
  if (bootRoute && bootRoute !== 'home') {
    activate(bootRoute, {});
  } else if (bootRoute === 'home' && (location.hash || '') !== '#/') {
    // unknown #/… on a fresh load: normalise, no history junk
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#/');
  }
})();
