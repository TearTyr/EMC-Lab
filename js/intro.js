/* EMC Lab intro controller.
   The animation itself lives in css/input.css. This file only handles when
   the intro starts, how it is skipped, and when its elements are removed. */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  const SESSION_KEY = 'emc.intro.v1';
  const INTRO_MS = 14000;
  const REDUCED_MOTION_MS = 1200;
  const EXIT_BUFFER_MS = 620;

  let timers = [];
  let listeners = [];
  let playing = false;
  let removed = false;

  function addListener(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    listeners.push({ target, eventName, handler, options });
  }

  function removeListeners() {
    for (const item of listeners) {
      item.target.removeEventListener(
        item.eventName,
        item.handler,
        item.options
      );
    }
    listeners = [];
  }

  function schedule(callback, delay) {
    timers.push(setTimeout(callback, delay));
  }

  function clearTimers() {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  }

  function hasPlayedThisSession() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return window.__emcIntroSeen === true;
    }
  }

  function markAsPlayed() {
    window.__emcIntroSeen = true;

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Keep the in-memory fallback when browser storage is blocked.
    }
  }

  function removeIntro() {
    if (removed) return;

    removed = true;
    playing = false;
    clearTimers();
    removeListeners();
    overlay.remove();
  }

  function dismissIntro() {
    if (removed) return;

    markAsPlayed();

    if (!playing) {
      removeIntro();
      return;
    }

    playing = false;
    overlay.classList.add('out');
    schedule(removeIntro, 180);
  }

  /* Turn the curved title into individual letters for its CSS animation. */
  function buildArcLetters() {
    const arc = overlay.querySelector('.in-arc[data-arc]');
    if (!arc) return;

    const text = arc.getAttribute('data-arc') || '';
    const middle = (text.length - 1) / 2;
    let visibleLetter = 0;

    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      if (character === ' ') continue;

      const letter = document.createElement('b');
      letter.textContent = character;
      letter.style.setProperty(
        '--a',
        ((i - middle) * 4.6).toFixed(2) + 'deg'
      );
      letter.style.setProperty(
        '--d',
        (9.3 + visibleLetter * 0.035).toFixed(3) + 's'
      );

      arc.appendChild(letter);
      visibleLetter++;
    }
  }

  function isHomeRoute() {
    const hash = location.hash || '';
    return !hash || hash === '#/';
  }

  function beginIntro() {
    if (removed || playing) return;

    // A fatal boot error takes priority over the decorative intro.
    if (document.getElementById('bootFatal') || !isHomeRoute()) {
      removeIntro();
      return;
    }

    const reducedMotion = Boolean(window.EMC && window.EMC.reducedMotion);
    /* Low-tier devices (the same signal that caps Stage at 30 fps) get the
       .lite cut of the whips: an animated Gaussian blur re-rasterises every
       moving layer per frame and is the composition's only reliable
       frame-dropper on weak GPUs. The lite keyframes keep the beat grid and
       timings identical and smear with transforms alone. */
    if (window.EMC && window.EMC.lowTier) overlay.classList.add('lite');
    playing = true;

    if (reducedMotion) overlay.classList.add('rm');
    overlay.classList.add('play');

    function dismissForInteraction(event) {
      if (event.type === 'keydown' && event.key === 'Tab') return;

      // Let these controls receive their own click before removing the overlay.
      // Otherwise the Start link can be detached before the browser follows it.
      const target = event.target;
      if (target && target.closest && target.closest('#introSkip, .in-start')) {
        return;
      }

      dismissIntro();
    }

    addListener(document, 'pointerdown', dismissForInteraction, {
      capture: true,
      passive: true
    });
    addListener(document, 'keydown', dismissForInteraction, { capture: true });

    const skipButton = document.getElementById('introSkip');
    if (skipButton) {
      addListener(skipButton, 'click', dismissIntro);
    }

    const duration = reducedMotion ? REDUCED_MOTION_MS : INTRO_MS;
    schedule(dismissIntro, duration);

    // Safety net in case a CSS exit animation or browser event gets interrupted.
    schedule(removeIntro, duration + EXIT_BUFFER_MS + 400);
  }

  buildArcLetters();

  // Only show the intro on the home page, once per browser session.
  if (!isHomeRoute() || hasPlayedThisSession()) {
    removeIntro();
    return;
  }

  // Wait for the page loader unless it has already finished.
  if (window.EMC && window.EMC.loader && window.EMC.loader.state().finished) {
    beginIntro();
  } else {
    addListener(document, 'emc:loader-done', beginIntro, { once: true });
  }

  // Used by the intro verification script.
  window.EMC_INTRO = {
    state() {
      return {
        playing,
        gone: removed,
        timers: timers.length,
        listeners: listeners.length
      };
    },
    dismiss: dismissIntro
  };
})();
