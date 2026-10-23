/* EMC Lab — the YTPMV-inspired opening (index.html only).
   An original, asset-local presentation: rhythmic cuts, snappy type slams,
   montage beats and a mascot reaction, resolving into the real homepage.
   Contract (brief PART 6):
     - ~4.6 s auto-play, once per session (sessionStorage `emc.intro.v1`;
       NEVER touches the progress keys), in-memory fallback when storage is
       blocked;
     - never plays on chapter routes (index.html#/chX) or other pages;
     - skip is always visible + keyboard reachable; ANY pointerdown/keydown
       dismisses; the overlay itself is pointer-events:none so page controls
       are never locked while it plays;
     - waits for the loader's single completion event; a loader fatal card
       cancels it entirely;
     - CSS keyframes only (transform/opacity), no rAF loop, no audio;
     - reduced motion gets a static composition that clears in ~1.2 s;
     - everything is removed from the DOM afterwards: no timers, listeners or
       nodes left behind (introspection on window.EMC_INTRO for the gates). */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  const KEY = 'emc.intro.v1';
  const TOTAL_MS = 4600;          // composition length
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
