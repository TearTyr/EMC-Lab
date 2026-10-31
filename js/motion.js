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

  /* ---- title-card transitions (kinetic text) ------------------------------
     Every boundary is a text-motion moment: the destination's name slams in
     letter by letter over a pink slash bar (the intro's vocabulary), the page
     swaps underneath, then the letters whip out. Transform/opacity only,
     the real text lives in aria-label while the letters are aria-hidden, and
     reduced motion skips it entirely (callers fall back to an instant swap).
     Cross-page: cover() runs on the leaving page, a one-shot sessionStorage
     marker lets the arriving page start covered and reveal itself. */
  const TC_KEY = 'emc.tc';
  const COVER_MS = 380, OUT_MS = 420, TC_FAILSAFE = 2500;
  let card = null, tcOutTimer = 0, tcSafety = 0;

  function tcBuild(label) {
    const el = document.createElement('div');
    el.className = 'tc';
    el.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('i'); bar.className = 'tc-bar';
    const bar2 = document.createElement('i'); bar2.className = 'tc-bar tc-bar2';
    const word = document.createElement('b'); word.className = 'tc-word';
    [...label].forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c === ' ' ? ' ' : c;
      s.style.setProperty('--i', i);
      word.appendChild(s);
    });
    el.append(bar, bar2, word);
    return el;
  }
  function tcClear() {
    clearTimeout(tcOutTimer); clearTimeout(tcSafety);
    if (card) { card.remove(); card = null; }
  }
  /* returns a promise that resolves when the page is fully covered */
  function cover(label, held) {
    if (!ok()) return Promise.resolve(false);
    tcClear();
    card = tcBuild(String(label || 'EMC Lab').toUpperCase().slice(0, 14));
    card.classList.add(held ? 'hold' : 'on');
    document.body.appendChild(card);
    tcSafety = setTimeout(tcClear, TC_FAILSAFE);   // a stuck card can never outlive a failed load
    return new Promise(res => setTimeout(() => res(true), held ? 0 : COVER_MS));
  }
  function uncover() {
    if (!card) return;
    const c = card;
    clearTimeout(tcSafety);
    c.classList.remove('on', 'hold');
    c.classList.add('out');
    tcOutTimer = setTimeout(() => { if (card === c) tcClear(); }, OUT_MS + 60);
  }
  /* leaving to another document: remember where we are going */
  function coverThenGo(label, go) {
    if (!ok()) { go(); return; }
    try { sessionStorage.setItem(TC_KEY, String(label)); } catch (e) { /* blocked storage: no arrival cover */ }
    cover(label).then(go);
  }
  /* arriving from a title card: start covered, reveal once the page has painted */
  function arrive() {
    let label = null;
    try { label = sessionStorage.getItem(TC_KEY); sessionStorage.removeItem(TC_KEY); } catch (e) { /* ignore */ }
    if (!label || !ok()) return;
    cover(label, true);
    const out = () => requestAnimationFrame(() => requestAnimationFrame(uncover));
    if (document.readyState === 'complete') out(); else window.addEventListener('load', out, { once: true });
  }
  window.addEventListener('pageshow', e => { if (e.persisted) tcClear(); });   // bfcache restore

  /* ---- route/view changes ------------------------------------------------ */
  document.addEventListener('emc:view-leaving', e => {
    if (document.getElementById('introOverlay') || performance.now() < bootGuard) return;
    cover(e.detail && e.detail.label);
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
    state() { return { flashing, io: !!io, paused: html.classList.contains('mx-paused'), card: !!card }; }
  };
  arrive();

  /* first paint: reveal what is already on screen */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(document), { once: true });
  } else {
    scan(document);
  }
})();
