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

  /* scan a root for [data-mx]; above-the-fold elements stagger in now,
     below-the-fold ones wait for the observer (once each). */
  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = Array.from(scope.querySelectorAll('[data-mx]'))
      .filter(el => !el.classList.contains('mx-in') && !el.__mxQueued);
    if (!nodes.length) return;
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

  /* ---- route/view changes ------------------------------------------------ */
  document.addEventListener('emc:view-shown', e => {
    flash();
    const view = (e.detail && e.detail.root) || document;
    scan(view);
  });

  /* ---- hidden tab: pause decorative animation (§8) ----------------------- */
  const vis = () => html.classList.toggle('mx-paused', document.hidden);
  document.addEventListener('visibilitychange', vis);
  vis();

  window.EMC_MOTION = {
    scan, flash, whip, ok,
    state() { return { flashing, io: !!io, paused: html.classList.contains('mx-paused') }; }
  };

  /* first paint: reveal what is already on screen */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(document), { once: true });
  } else {
    scan(document);
  }
})();
