/* EMC Lab — site-wide motion system (phase 8).
   One small reusable pattern set transcribed from the reference footage
   applied consistently across the
   site by js/motion.js + [data-mx] markup:
     rise   staggered entrance reveal (scroll or route arrival)
     slam   rotated type slam for section titles / hero words
     slide  staggered slide+rotate panels (notes, insets)
     pop    chip/menu pop from anchor
     flash  2-frame-style white dip at route/section boundaries (260 ms)
     whip   squash-and-stretch accent over a state that just changed
     spin   continuous rotateY loop for framed inset art
   Rules honoured here: transform/opacity only; no animation without JS opt-in
   (html.mx-js gate); reduced motion = instant final states; hidden tab pauses;
   one init per page (window.__emcMotion); every node/listener cleaned up. */
(function () {
  if (window.__emcMotion) return;
  window.__emcMotion = 1;

  const html = document.documentElement;
  html.classList.add('mx-js');

  const ok = () => !(window.EMC && window.EMC.reducedMotion);
  const STAGGER = 60, STAGGER_CAP = 240;

  /* ---- reveals ---------------------------------------------------------- */
  let io = null;
  function observer() {
    if (io || !('IntersectionObserver' in window)) return io;
    io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        reveal(en.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    return io;
  }

  function reveal(el) { el.classList.add('mx-in'); }

  /* data-mx="words": the heading's words become inline-block spans (once) so the
     reveal can stagger them. The text stays in the DOM, so it reads the same. */
  function splitWords(el) {
    if (el.getAttribute('data-mx') !== 'words' || el.__mxSplit) return;
    el.__mxSplit = true;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'mx-w'; s.textContent = w; s.style.setProperty('--w', i);
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* scan a root for [data-mx]; above-the-fold elements stagger in now,
     below-the-fold ones wait for the observer (once each). */
  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = Array.from(scope.querySelectorAll('[data-mx]'))
      .filter(el => !el.classList.contains('mx-in') && !el.__mxQueued);
    if (!nodes.length) return;
    nodes.forEach(splitWords);
    if (!ok()) { nodes.forEach(reveal); return; }          // reduced: show now
    const fold = window.innerHeight * 0.92;
    const byParent = new Map();
    nodes.forEach(el => {
      el.__mxQueued = true;
      const r = el.getBoundingClientRect();
      if (r.top < fold && r.bottom > 0) {
        const p = el.parentElement || document.body;
        const i = byParent.get(p) || 0;
        byParent.set(p, i + 1);
        el.style.setProperty('--d', Math.min(i * STAGGER, STAGGER_CAP) + 'ms');
        reveal(el);
      } else if (observer()) {
        io.observe(el);
      } else {
        reveal(el);
      }
    });
  }

  /* ---- flash dip at boundaries ------------------------------------------ */
  let flashing = false;
  const bootGuard = performance.now() + 1000;   // never dip on initial arrival
  function flash() {
    if (!ok() || flashing) return;
    if (performance.now() < bootGuard) return;             // boot mount, not a boundary
    if (document.getElementById('introOverlay')) return;   // the intro owns the screen
    if (document.hidden) return;
    flashing = true;
    const d = document.createElement('i');
    d.className = 'mx-flash';
    d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
    const kill = () => { d.remove(); flashing = false; };
    d.addEventListener('animationend', kill, { once: true });
    setTimeout(() => { if (d.isConnected) kill(); }, 700);   // interrupted-anim failsafe
  }

  /* ---- squash-whip (decorative only) --------------------------------------
     State changes must NEVER wait for motion: callers commit state first,
     then whip() plays the reference's squash-and-stretch over the element
     (footage f440-447). Transform-only; failsafe cleanup if the animation
     is interrupted (nav away, tab hide, reduced motion flip). */
  function whip(el) {
    if (!el || !ok()) return;
    el.classList.remove('mx-whip');
    void el.offsetWidth;                                   // restart if re-triggered
    el.classList.add('mx-whip');
    const off = () => el.classList.remove('mx-whip');
    el.addEventListener('animationend', function h(e) {
      if (e.target !== el) return;
      el.removeEventListener('animationend', h);
      off();
    });
    setTimeout(off, 400);                                  // failsafe cleanup
  }

  /* ---- page transitions: change the channel ----------------------------------
     Every boundary (a chapter switch, the quiz, back home) plays the same fixed timeline, however
     fast or slow the page behind it loads:
       COVER   the old page squeezes to a bright line like a TV switching off, static fills the
               screen and comic panels slam in with the destination's name and Denki-chan
       HOLD    at least HOLD_MS fully covered; a slow load only makes this longer, a cached one
               never makes it shorter
       REVEAL  the panels slide out, the static drops and the line opens up to the new page
     The page underneath is swapped only once COVER has finished (callers wait for the promise
     cover() returns), and the card is lifted only when the new view is ready AND HOLD has run.
     Transform and opacity only; the real text lives in the page, the card is aria-hidden;
     reduced motion never creates it (callers fall back to an instant swap).
     Cross-page: cover() runs on the leaving page, a one-shot sessionStorage marker lets the arriving
     page start covered (html.tc-arrive from the head gate paints the first frame) and reveal itself. */
  const TC_KEY = 'emc.tc';
  const COVER_MS = 460, HOLD_MS = 380, OUT_MS = 520, TC_FAILSAFE = 7000;
  let card = null, tcOutTimer = 0, tcSafety = 0, tcHoldTimer = 0, coverP = null, coveredAt = 0, noise = null;
  let FACES = 'img/';                                      /* the card's mascot faces, found next to this script so every folder depth works */
  try { if (document.currentScript && document.currentScript.src) FACES = new URL('../img/', document.currentScript.src).href; } catch (e) { /* keep the relative path */ }

  /* what the card says about where we are going: an on-screen display tag and the mascot's face */
  function describe(label, o) {
    const s = String(label || '');
    const d = /quiz/i.test(s) ? { osd: 'QUIZ', face: 'sparkle' }
      : /circuit|current|ohm/i.test(s) ? { osd: 'CH 01', face: 'focus' }
      : /field|coulomb|charge/i.test(s) ? { osd: 'CH 02', face: 'focus' }
      : /home/i.test(s) ? { osd: 'HOME', face: 'happy' } : { osd: 'EMC LAB', face: 'happy' };
    return Object.assign(d, o || {});
  }

  /* three small frames of TV static, drawn once and reused: the css cycles which one shows */
  function noiseFrames() {
    if (noise) return noise;
    const P = (window.EMC && window.EMC.PALETTE) || {};
    const cols = [P.edge, P.line, P.panel, P.wire, P.edge, P.grey, P.line];
    noise = [0, 1, 2].map(() => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 36; c.className = 'tc-ns';
      const x = c.getContext('2d');
      if (x) for (let j = 0; j < 36; j++) for (let i = 0; i < 64; i++) { x.fillStyle = cols[(Math.random() * cols.length) | 0] || P.ink; x.fillRect(i, j, 1, 1); }
      return c;
    });
    return noise;
  }

  function tcBuild(label, d) {
    const el = document.createElement('div');
    el.className = 'tc';
    el.setAttribute('aria-hidden', 'true');
    const mk = (tag, cls) => { const n = document.createElement(tag); n.className = cls; return n; };
    const top = mk('i', 'tc-sh tc-top'), bot = mk('i', 'tc-sh tc-bot'), line = mk('i', 'tc-line');
    const stage = mk('div', 'tc-stage');
    const main = mk('div', 'tc-main');
    const face = mk('img', 'tc-face');
    face.alt = ''; face.width = 120; face.height = 120; face.decoding = 'async';
    face.src = FACES + 'mascot-face-' + d.face + '.png';
    const word = mk('b', 'tc-word');
    [...label].forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c;
      s.style.setProperty('--i', i);
      word.appendChild(s);
    });
    main.append(face, word);
    stage.append(mk('i', 'tc-pan tc-p1'), mk('i', 'tc-pan tc-p2'), mk('i', 'tc-pan tc-p3'), main);
    const osd = mk('span', 'tc-osd');
    osd.textContent = d.osd + ' · ' + label;
    el.append(top, bot, ...noiseFrames(), line, stage, osd);
    return el;
  }
  function tcClear() {
    clearTimeout(tcOutTimer); clearTimeout(tcSafety); clearTimeout(tcHoldTimer);
    if (card) { card.remove(); card = null; }
    coverP = null;
    html.classList.remove('tc-arrive');
  }
  /* returns a promise that resolves when the page is fully covered (a card already up is shared) */
  function cover(label, o) {
    if (!ok()) return Promise.resolve(false);
    if (card && !card.classList.contains('out')) return coverP || Promise.resolve(true);
    tcClear();
    const held = !!(o && o.held), text = String(label || 'EMC Lab').toUpperCase().slice(0, 14);
    card = tcBuild(text, describe(label, o));
    card.classList.add(held ? 'hold' : 'on');
    document.body.appendChild(card);
    html.classList.remove('tc-arrive');                    /* the card now covers the first frame itself */
    coveredAt = performance.now() + (held ? 0 : COVER_MS);
    tcSafety = setTimeout(tcClear, (held ? 0 : COVER_MS) + TC_FAILSAFE);   // a stuck card can never outlive a failed load
    coverP = new Promise(res => setTimeout(() => res(true), held ? 0 : COVER_MS));
    return coverP;
  }
  /* lift the card: not before HOLD_MS after it fully covered the page */
  function uncover() {
    if (!card || card.classList.contains('out')) return;
    const c = card;
    clearTimeout(tcSafety); clearTimeout(tcHoldTimer);
    tcHoldTimer = setTimeout(() => {
      if (card !== c) return;
      c.classList.remove('on', 'hold');
      c.classList.add('out');
      tcOutTimer = setTimeout(() => { if (card === c) tcClear(); }, OUT_MS + 60);
    }, Math.max(0, coveredAt + HOLD_MS - performance.now()));
  }
  /* leaving to another document: remember where we are going */
  function coverThenGo(label, go) {
    if (!ok()) { go(); return; }
    const d = describe(label);
    try { sessionStorage.setItem(TC_KEY, JSON.stringify({ label: String(label), osd: d.osd, face: d.face })); } catch (e) { /* blocked storage: no arrival cover */ }
    cover(label, d).then(go);
  }
  /* arriving from a title card: start covered, reveal once the page has painted */
  function arrive() {
    let raw = null;
    try { raw = sessionStorage.getItem(TC_KEY); sessionStorage.removeItem(TC_KEY); } catch (e) { /* ignore */ }
    if (!raw || !ok()) { html.classList.remove('tc-arrive'); return; }
    let d = null;
    try { d = JSON.parse(raw); } catch (e) { d = { label: raw }; }
    if (!d || !d.label) { html.classList.remove('tc-arrive'); return; }
    cover(d.label, { held: true, osd: d.osd, face: d.face });
    const out = () => requestAnimationFrame(() => requestAnimationFrame(uncover));
    if (document.readyState === 'complete') out(); else window.addEventListener('load', out, { once: true });
  }
  window.addEventListener('pageshow', e => { if (e.persisted) tcClear(); });   // bfcache restore

  /* ---- route/view changes ------------------------------------------------ */
  /* the shell puts a `wait` array in the event detail and holds the swap until it settles */
  document.addEventListener('emc:view-leaving', e => {
    if (document.getElementById('introOverlay') || (e.detail && e.detail.boot)) return;   // the intro owns the screen; a deep link opens straight on its chapter
    const p = cover(e.detail && e.detail.label);
    if (e.detail && Array.isArray(e.detail.wait)) e.detail.wait.push(p);
  });
  document.addEventListener('emc:view-shown', e => {
    if (card) uncover(); else flash();
    const view = (e.detail && e.detail.root) || document;
    scan(view);
  });

  /* ---- hidden tab: pause decorative animation (§8) ----------------------- */
  const vis = () => html.classList.toggle('mx-paused', document.hidden);
  document.addEventListener('visibilitychange', vis);
  vis();

  window.EMC_MOTION = {
    scan, flash, whip, ok, cover, uncover, coverThenGo,
    state() { return { flashing, io: !!io, paused: html.classList.contains('mx-paused'), card: !!card, out: !!(card && card.classList.contains('out')) }; },
    timing: { COVER_MS, HOLD_MS, OUT_MS }
  };
  arrive();

  /* first paint: reveal what is already on screen */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(document), { once: true });
  } else {
    scan(document);
  }
})();
