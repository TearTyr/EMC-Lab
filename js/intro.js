/* EMC Lab intro controller + v8 "drop-in cut" engine.
   The lifecycle half keeps every repo contract: once per session
   (sessionStorage `emc.intro.v1`), never on chapter routes, cancelled by a
   fatal boot, waits for the loader's single completion event, ANY
   pointerdown/keydown dismisses, skip + Start stay clickable through it, and
   the overlay is fully removed afterwards with zero timers/listeners left.
   The engine half is the friend's frame-accurate recreation of the reference
   edit (integrated 2026-10-25): one rAF timeline, BEAT0 3.5 s flash cut into
   the title card, BEAT 0.88 s (~68 BPM) pulse, mascot face swaps, ghost
   mascots, orbiting electrons, drifting charges, burst ring, flash out at
   11.2 s, Start at 10.3 s, finish at 12 s. Reduced motion draws the static end
   frame; faces are fetched only when playback actually starts; ?t=<s> freezes
   a frame for tuning (dev). */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  const SESSION_KEY = 'emc.intro.v1';
  /* #7.11: sessionStorage is per-tab, so every new tab replayed the whole
     intro. A 7-day localStorage mirror keeps it once-per-browser; the
     session key stays as the fast path and the memory fallback survives
     blocked storage. */
  const LS_KEY = 'emc.intro.v1.ls';
  const LS_TTL_MS = 7 * 24 * 3600 * 1000;
  const INTRO_MS = 12000;          // engine timeline length
  const REDUCED_MOTION_MS = 1200;
  const EXIT_BUFFER_MS = 700;      // .done fade (.5 s) + slack

  let timers = [];
  let listeners = [];
  let playing = false;
  let removed = false;
  let raf = 0;

  function addListener(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    listeners.push({ target, eventName, handler, options });
  }

  function removeListeners() {
    for (const item of listeners) {
      item.target.removeEventListener(item.eventName, item.handler, item.options);
    }
    listeners = [];
  }

  function schedule(callback, delay) { timers.push(setTimeout(callback, delay)); }
  function clearTimers() { for (const timer of timers) clearTimeout(timer); timers = []; }

  function hasPlayedThisSession() {
    try { if (sessionStorage.getItem(SESSION_KEY) === '1') return true; } catch { /* below */ }
    try {
      const v = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (v && typeof v.t === 'number' && Date.now() - v.t < LS_TTL_MS) return true;
    } catch { /* blocked or corrupt: fall through */ }
    return window.__emcIntroSeen === true;
  }
  function markAsPlayed() {
    window.__emcIntroSeen = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* memory fallback */ }
    try { localStorage.setItem(LS_KEY, JSON.stringify({ t: Date.now() })); } catch { /* memory fallback */ }
  }

  /* ---------------------------------------------------------------- engine */
  const BEAT0 = 3.5, BEAT = 0.88;   /* ~68 BPM estimated from the reference audio */
  const IMG = {
    sp: 'img/mascot-face-sparkle.png',
    fo: 'img/mascot-face-focus.png',
    hp: 'img/mascot-face-happy.png'
  };
  const q = sel => overlay.querySelector(sel);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, d) => clamp((t - a) / d);
  const back = x => { const c = 1.8, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
  const pop = (t, a, d = .35) => t < a ? 0 : back(seg(t, a, d));
  function put(el, s = 1, x = 0, y = 0, r = 0, o) {
    el.style.transform = `translate(-50%,-50%) translate(${x}cqw,${y}cqw) rotate(${r}deg) scale(${s})`;
    el.style.opacity = o == null ? (s > 0.01 ? 1 : 0) : o;
  }

  const A = q('#A'), B = q('#B'), fl = q('#fl'), go = q('#go'), mk = q('#mk'), ttl = q('#ttl');
  const faces = { sp: q('#sp'), fo: q('#fo'), hp: q('#hp') };
  const ghosts = [[7, 20, -12], [17, 68, 9], [93, 22, 12], [84, 72, -8], [50, 6, 0], [4, 88, 6]].map(([l, t, r], i) => {
    const s = document.createElement('img');
    s.className = 'a gh'; s.alt = ''; s.width = 409; s.height = 415;
    s.style.left = l + '%'; s.style.top = t + '%';
    q('#ghosts').appendChild(s);
    return { s, r, i };
  });
  const letters = [..."EMC Lab"].map(c => {
    const e = document.createElement('span');
    e.textContent = c === ' ' ? '\u00a0' : c;
    ttl.appendChild(e);
    return e;
  });
  const chips = [...overlay.querySelectorAll('.chip')];
  const els = [...overlay.querySelectorAll('.el')];
  const pts = Array.from({ length: 16 }, (_, i) => {
    const e = document.createElement('b');
    e.className = 'a pt';
    e.textContent = i % 2 ? '+' : '−';
    e.style.cssText = `left:${(i * 37 + 11) % 97 + 1}%;top:0;color:${['#f8aebe', '#a8d3e0', '#b5d777'][i % 3]};font-size:${2.4 + (i % 4) * .7}vmin`;
    q('#px').appendChild(e);
    return { e, p: (i * .173) % 1, v: .045 + (i % 5) * .012, w: i * 1.7 };
  });

  /* faces cost zero bytes until playback is certain (replayed sessions and
     chapter routes never fetch them). The ghost column shares the focus face,
     so it rides the same single fetch (BUG: the first integration never set
     the ghosts' src at all — six empty <img> tags; fixed 2026-10-25). */
  function loadFaces() {
    for (const id of ['sp', 'fo', 'hp']) faces[id].src = IMG[id];
    for (const g of ghosts) g.s.src = IMG.fo;
  }

  function frame(t) {
    /* scene A: shape-face countdown */
    A.style.display = t < BEAT0 + .02 ? '' : 'none';
    B.style.display = t >= BEAT0 ? '' : 'none';
    put(q('#t1'), pop(t, .3)); put(q('#t2'), pop(t, .5));
    put(q('#d1'), pop(t, .7)); put(q('#d2'), pop(t, .9));
    const ep = pop(t, 1.1, .45);
    const ew = t > 1.55 ? Math.sin((t - 1.55) * 15) * 11 * Math.exp(-(t - 1.55) * 2.6) : 0;
    const eo = t >= 1.1 ? 1 : 0;
    put(q('#e1'), 1, 0, (1 - ep) * -18, -14 + ew, eo);
    put(q('#e2'), 1, 0, (1 - ep) * -18, 14 - ew, eo);
    const k = clamp(Math.floor((t - 2.05) / .36), 0, 2), dg = q('#dg'), off = t < 2.05 || t >= 3.13;
    dg.textContent = off ? '' : String(3 - k);
    put(dg, off ? 0 : pop(t, 2.05 + k * .36, .25));
    const g = t >= 3.13;
    q('#d1').className = 'a dot' + (g ? ' go' : '');
    q('#d2').className = 'a dot' + (g ? ' go' : '');
    q('#d1').textContent = g ? 'G' : '';
    q('#d2').textContent = g ? 'O' : '';

    /* scene B: title card */
    const bt = Math.max(0, t - BEAT0), bp = t >= BEAT0 ? Math.exp(-7 * ((bt % BEAT) / BEAT)) : 0;
    const face = t < 4.5 ? 'sp' : t < 8.8 ? 'fo' : 'hp';
    for (const id of ['sp', 'fo', 'hp']) faces[id].style.display = id === face ? '' : 'none';
    const wave = t >= 8.8 ? Math.sin((t - 8.8) * 14) * 7 * Math.exp(-(t - 8.8) * 1.2) : 0;
    put(mk, pop(t, BEAT0, .5) * (1 + .035 * bp), 0, Math.sin(t * 2.2) * .8, wave);
    ghosts.forEach(({ s, r, i }) => put(s, 1, Math.sin(t * .6 + i) * 1.2, Math.cos(t * .5 + i * 2) * 1.5, r, .16 * seg(t, BEAT0, .8)));
    letters.forEach((e, i) => {
      const p = pop(t, 3.7 + i * .07, .4), w = Math.sin(t * 3 + i * .7) * .7 * seg(t, 5.1, .6);
      e.style.transform = `translateY(${(1 - p) * -6 + w}cqw) scale(${p})`;
      e.style.opacity = p > .01 ? 1 : 0;
    });
    put(ttl, 1, 0, 0, 0, t >= 3.7 ? 1 : 0);
    put(q('#sub'), pop(t, 4.5, .4));
    chips.forEach((c, i) => {
      const cp = pop(t, BEAT0 + BEAT * (3 + i), .35), on = cp > .9 ? 1 : 0;
      c.style.transform = `translateY(${Math.sin(t * 2 + i * 1.3) * .4 * on}cqw) rotate(${[-3, 2, -2][i] + Math.sin(t * 1.6 + i) * on}deg) scale(${cp})`;
      c.style.opacity = cp > .01 ? 1 : 0;
    });

    /* extra motion: drifting charges, orbiting electrons, burst rings */
    const H = innerHeight, dt = Math.max(0, t - 4.3);
    pts.forEach(({ e, p, v, w }) => {
      const yy = 1.06 - ((p + v * dt) % 1.12);
      e.style.transform = `translate(-50%,-50%) translate(${Math.sin(t * .8 + w) * 2}vw,${yy * H}px) rotate(${t * 20 + w * 30}deg)`;
      e.style.opacity = t < 4.3 ? 0 : .5 * seg(t, 4.3, .8) * clamp(Math.min(yy * 8, (1.06 - yy) * 8));
    });
    /* orbit radii scale with the mascot size token (friend's revision 2) */
    els.forEach((e, i) => {
      const a = t * 1.7 + i * 2.094, z = Math.sin(a), pp = pop(t, 5.1 + i * .15, .4);
      e.style.zIndex = z > 0 ? 3 : 1;
      put(e, pp * (.85 + .3 * z), Math.cos(a) * mkw * .66, z * mkw * .19, 0, pp > .01 ? .55 + .45 * (z * .5 + .5) : 0);
    });
    const rs = t >= 8.8 ? 8.8 : t >= BEAT0 ? BEAT0 : 99, rq = seg(t, rs, .7);
    put(q('#rg'), .4 + rq * 1.8, 0, 0, 0, t >= rs && rq < 1 ? (1 - rq) * .8 : 0);

    /* flashes + buttons */
    const f1 = clamp(1 - Math.abs(t - (BEAT0 + .02)) / .18), f2 = seg(t, 11.2, .8);
    fl.style.opacity = Math.max(f1, f2);
    const gp = pop(t, 10.3, .4);
    go.style.opacity = gp > .01 ? 1 : 0;
    go.style.transform = `translateX(-50%) scale(${gp})`;
    /* visibility (not just pointer-events) so the CTA is unfocusable until it
       pops — keeps introSkip the first tab stop (a11y gate A0) */
    go.style.visibility = t >= 10.3 ? 'visible' : 'hidden';
    go.classList.toggle('on', t >= 10.3);
  }

  function finish() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!overlay.classList.contains('done')) {
      overlay.classList.add('done');
      document.dispatchEvent(new CustomEvent('emc:intro-done'));
    }
  }

  let t0 = 0, tShift = 0, pauseStart = 0;
  /* --mk in cqw units, read once per run/resize (not per frame) */
  let mkw = 34;
  const readMkw = () => {
    const v = parseFloat(getComputedStyle(q('#st')).getPropertyValue('--mk'));
    if (v) mkw = v;
  };
  function step(now) {
    const t = (now - t0 - tShift) / 1000;
    if (t >= 12) { frame(12); finish(); return; }
    frame(t);
    raf = requestAnimationFrame(step);
  }
  function run() {
    if (raf) cancelAnimationFrame(raf);
    overlay.classList.remove('done');
    loadFaces();
    if (window.EMC && window.EMC.reducedMotion) { frame(11); return; }  /* static end frame */
    t0 = performance.now(); tShift = 0; pauseStart = 0;
    readMkw();
    raf = requestAnimationFrame(step);
  }
  /* Hidden tab: drop the rAF chain and bank the elapsed time, so a backgrounded
     intro neither burns battery nor jump-cuts on return (and a settled home
     page truly has zero chains). */
  function onVis() {
    if (!playing || removed) return;
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      pauseStart = performance.now();
    } else if (pauseStart) {
      tShift += performance.now() - pauseStart;
      pauseStart = 0;
      if (!raf && !overlay.classList.contains('done')) raf = requestAnimationFrame(step);
    }
  }
  /* ------------------------------------------------------------ engine end */

  function removeIntro() {
    if (removed) return;
    removed = true;
    playing = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    clearTimers();
    removeListeners();
    overlay.remove();
  }

  function dismissIntro() {
    if (removed) return;
    markAsPlayed();
    if (!playing) { removeIntro(); return; }
    playing = false;
    finish();                       /* .done fade, then removal below */
    schedule(removeIntro, EXIT_BUFFER_MS);
  }

  function isHomeRoute() {
    const hash = location.hash || '';
    return !hash || hash === '#/';
  }

  function beginIntro() {
    if (removed || playing) return;

    /* A fatal boot error takes priority over the decorative intro. */
    if (document.getElementById('bootFatal') || !isHomeRoute()) {
      removeIntro();
      return;
    }

    playing = true;
    const reducedMotion = Boolean(window.EMC && window.EMC.reducedMotion);
    if (reducedMotion) overlay.classList.add('rm');   /* static poster contract */
    overlay.classList.add('play');

    function dismissForInteraction(event) {
      if (event.type === 'keydown' && event.key === 'Tab') return;
      const target = event.target;
      /* Let skip and Start receive their own click before the overlay goes. */
      if (target && target.closest && target.closest('.intro-skip, .in-start')) return;
      dismissIntro();
    }

    addListener(document, 'pointerdown', dismissForInteraction, { capture: true, passive: true });
    addListener(document, 'keydown', dismissForInteraction, { capture: true });
    addListener(q('#introSkip'), 'click', dismissIntro);
    addListener(go, 'click', dismissIntro);       /* navigation proceeds; overlay fades */
    addListener(document, 'visibilitychange', onVis);
    addListener(window, 'resize', readMkw);
    addListener(document, 'emc:intro-done', () => {
      markAsPlayed();
      schedule(removeIntro, EXIT_BUFFER_MS);
    });

    /* dev tuning freeze: ?t=5.5 draws one frame, no clock, no auto-dismiss */
    const freeze = new URLSearchParams(location.search).get('t');
    if (freeze !== null) { loadFaces(); frame(+freeze); return; }

    run();
    /* reduced motion: the static end frame is the whole show — clear fast */
    if (reducedMotion) { schedule(dismissIntro, REDUCED_MOTION_MS); return; }
    /* safety net in case the rAF clock or the done event ever gets interrupted */
    schedule(() => { if (playing) dismissIntro(); }, INTRO_MS + 400);
    schedule(() => { if (!removed) removeIntro(); }, INTRO_MS + EXIT_BUFFER_MS + 600);
  }

  /* Only show the intro on the home page, once per browser session. */
  if (!isHomeRoute() || hasPlayedThisSession()) {
    removeIntro();
    return;
  }

  /* Wait for the page loader unless it has already finished. */
  if (window.EMC && window.EMC.loader && window.EMC.loader.state().finished) {
    beginIntro();
  } else {
    addListener(document, 'emc:loader-done', beginIntro, { once: true });
  }

  /* Used by the intro verification script. */
  window.EMC_INTRO = {
    state() {
      return {
        playing,
        gone: removed,
        timers: timers.length,
        listeners: listeners.length,
        rafs: raf ? 1 : 0
      };
    },
    dismiss: dismissIntro
  };
})();
