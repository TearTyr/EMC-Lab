/* EMC Lab — the opening composition (index.html only).
   v5 "CHORUS CUT" (user directive 2026-10-24: redo the intro from the ground
   up off the reference video's main-motion passage — "skip to 21 seconds due
   to the main motion is there", "show the Topics and formulas in action with
   blur and stuff"). The v4 1:6 whole-video cut was deleted; this composition
   starts where the footage's main motion starts: the ramped flash #3 at
   21.4 s (Video/シェリーライド.mp4 f1284) into chorus-collage A, and runs that
   section's grammar at its own beat grid with the site's topics + equations
   as the lyric layer (see the timeline table in css/input.css INTRO OVERLAY).
   Motion-blur whips (filter:blur smears, ~120 ms) carry every entrance and
   exit, per the user's "with blur and stuff" — the flat-art blur ban stays
   lifted for the intro overlay only.
   Contract (brief PART 6, unchanged by the rebuild):
     - 14.0 s composition + 0.45 s letterbox wipe auto-play, once per session
       (sessionStorage `emc.intro.v1`; NEVER touches the progress keys),
       in-memory fallback when storage is blocked;
     - never plays on chapter routes (index.html#/chX) or other pages;
     - skip is always visible + keyboard reachable; ANY pointerdown/keydown
       dismisses; the overlay itself is pointer-events:none so page controls
       are never locked while it plays;
     - waits for the loader's single completion event; a loader fatal card
       cancels it entirely;
     - CSS keyframes only (transform/opacity/filter), no rAF loop, no audio;
     - reduced motion gets a static poster that clears in ~1.2 s;
     - everything is removed from the DOM afterwards: no timers, listeners or
       nodes left behind (introspection on window.EMC_INTRO for the gates). */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  const KEY = 'emc.intro.v1';
  const TOTAL_MS = 14000;         // 13.45 s picture + 0.45 s wipe + slack
  const EXIT_MS = 620;            // exit animation + safety margin
  const RM_MS = 1200;             // reduced-motion static hold
  let timers = [];
  let listeners = [];
  let playing = false;
  let gone = false;

  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; };

  function sessionPlayed() {
    try { return sessionStorage.getItem(KEY) === '1'; }
    catch (e) { return window.__emcIntroSeen === true; }
  }
  function markPlayed() {
    window.__emcIntroSeen = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* blocked: in-memory only */ }
  }

  function remove() {
    if (gone) return;
    gone = true;
    playing = false;
    clearAll();
    listeners.forEach(([t, ev, fn, op]) => t.removeEventListener(ev, fn, op));
    listeners = [];
    if (overlay.isConnected) overlay.remove();
  }

  function dismiss() {
    if (gone) return;
    markPlayed();
    if (!playing) { remove(); return; }
    playing = false;
    overlay.classList.add('out');
    later(remove, 180);
  }

  /* Arc sweep letters: the curved outlined line is authored as plain text in
     the markup (data-arc) and fanned out here — one <b> per glyph with its
     angle (--a) and staggered onset (--d); the motion itself stays in CSS. */
  (function buildArc() {
    const arc = overlay.querySelector('.in-arc[data-arc]');
    if (!arc) return;
    const text = arc.getAttribute('data-arc') || '';
    const mid = (text.length - 1) / 2;
    let vis = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      const b = document.createElement('b');
      b.textContent = ch;
      b.style.setProperty('--a', ((i - mid) * 4.6).toFixed(2) + 'deg');
      b.style.setProperty('--d', (9.3 + vis * 0.035).toFixed(3) + 's');
      arc.appendChild(b);
      vis++;
    }
  })();

  /* Do not play on chapter deep links, replays, or when the loader failed. */
  const hash = location.hash || '';
  if ((hash && hash !== '#/') || sessionPlayed()) { remove(); return; }

  function begin() {
    if (gone || playing) return;
    if (document.getElementById('bootFatal')) { remove(); return; }  // a broken boot owns the screen
    const h = location.hash || '';
    if (h && h !== '#/') { remove(); return; }   // navigated to a chapter during boot: no intro
    const reduce = window.EMC && window.EMC.reducedMotion;
    playing = true;
    if (reduce) overlay.classList.add('rm');
    overlay.classList.add('play');
    /* any intent to interact ends the intro immediately */
    const skipOn = ev => { if (ev.type === 'keydown' && ev.key === 'Tab') return; dismiss(); };
    listeners.push([document, 'pointerdown', skipOn, { capture: true, passive: true }]);
    listeners.push([document, 'keydown', skipOn, { capture: true }]);
    listeners.forEach(([t, ev, fn, op]) => t.addEventListener(ev, fn, op));
    const skipBtn = document.getElementById('introSkip');
    if (skipBtn) {
      const onSkip = () => dismiss();
      skipBtn.addEventListener('click', onSkip);
      listeners.push([skipBtn, 'click', onSkip, undefined]);
    }
    later(dismiss, reduce ? RM_MS : TOTAL_MS);       // auto-end (dismiss -> out -> remove)
    later(() => { if (!gone) remove(); }, (reduce ? RM_MS : TOTAL_MS) + EXIT_MS + 400);  // hard safety net
  }

  /* start only once the loader says the page is usable */
  if (window.EMC && window.EMC.loader && window.EMC.loader.state().finished) begin();
  else document.addEventListener('emc:loader-done', begin, { once: true });

  window.EMC_INTRO = {
    state() { return { playing, gone, timers: timers.length, listeners: listeners.length }; },
    dismiss
  };
})();
