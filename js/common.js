/* EMC Lab shared engine (window.EMC): physical constants, maths + SI-prefix formatting, HiDPI canvas Stage (rAF loop, resize, unified pointer input), drawing helpers, safe localStorage, progress tracking with JSON export/import, control binding, page UI (nav/reveal/toasts), KaTeX typesetting and licensed-font loading. */
'use strict';

window.EMC = (function () {

  /* RE-EXECUTION GUARD — this module boots the whole page (loader lifecycle,
     nav, Detail toggle, page transitions, prefetch). It must run exactly ONCE
     per document: a second execution re-runs boot() and DOUBLE-BINDS every
     page-level handler, so one click flips state twice — the Detail toggle
     nets to zero (dead), the topics dropdown and mobile menu open-then-close
     (dead), and the loader re-arms. That is precisely what the shell's
     per-mount script replay did to the hashed production build before its
     skip-list became basename/hash-aware; this guard makes the failure
     structurally impossible no matter who injects the file again. A live
     engine is returned untouched — sims re-executed per mount must keep
     binding through the SAME EMC (stages, storage, loader, tracked counts). */
  if (window.EMC && window.EMC.loader && window.EMC.Progress) return window.EMC;

  /* ------------------------------------------------------------------------ 1. Physical constants (SI units) ------------------------------------------------------------------------ */
  const CONST = {
    /* Coulomb constant k = 1/(4*pi*eps0) [N m^2 C^-2]. The lecture (and the
       course brief) compute with k = 8.99e9; the more precise CODATA value is
       8.9875e9. Per the documents' precedence the site uses 8.99e9 EVERYWHERE
       — computed and printed — so every readout reproduces the lecture's
       worked answers exactly (e.g. +/-1 C at 1 km -> 8990 N). */
    K: 8.99e9,
    /* Permeability of free space mu0 [T m/A] */
    MU0: 1.25663706212e-6,
    /* Electron mass [kg] */ M_ELECTRON: 9.1093837015e-31,
    /* Proton mass [kg] */  M_PROTON: 1.67262192369e-27,
    /* Elementary charge e [C] (exact) — used by the electricity sims to
       express a current as a charge-carrier rate. */
    E: 1.602176634e-19
  };

  /* ------------------------------------------------------------------------ 2. Math helpers ------------------------------------------------------------------------ */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  /* Smooth exponential approach — frame-rate independent damping. */
  const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

  /* ------------------------------------------------------------------------ 3. Number formatting ------------------------------------------------------------------------ */
  /* SI prefixes used by the engineering formatter, from femto to tera. */
  const PREFIX = [
    { e: -15, s: 'f' }, { e: -12, s: 'p' }, { e: -9, s: 'n' }, { e: -6, s: '\u00B5' },
    { e: -3, s: 'm' }, { e: 0, s: '' }, { e: 3, s: 'k' }, { e: 6, s: 'M' },
    { e: 9, s: 'G' }, { e: 12, s: 'T' }
  ];

  /* * Format a number with an SI prefix, keeping `sig` significant figures. * Values outside the prefix table fall back to exponential notation, so a * prefix is never stacked on top of another one. * * eng(0.0034) -> "3.40 m" eng(399.45) -> "399" * eng(12345) -> "12.3 k" eng(1.6e-14) -> "16.0 f" * eng(1e-20) -> "1.00e-20" eng(0) -> "0" * * @param {number} v value in base SI units * @param {number} sig significant figures (default 3) * @returns {string} */
  function eng(v, sig = 3) {
    if (v === null || v === undefined || !isFinite(v)) return '\u2014';
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) / 3) * 3;
    e = clamp(e, -15, 12);
    let scaled = v / Math.pow(10, e);
    const pre = PREFIX.find(p => p.e === e);
    if (!pre) return v.toExponential(Math.max(0, sig - 1));

    // Rounding can push 999.6 up to 1000, so re-scale when that happens -
    // using the ROUNDED value, so the result keeps `sig` significant figures
    // ("1.00 k", not "1.000").
    let decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
    if (decimals > 4) return v.toExponential(Math.max(0, sig - 1));   // below femto
    if (Math.abs(Number(scaled.toFixed(decimals))) >= 1000) {
      scaled = Number(scaled.toFixed(decimals)) / 1000; e += 3;
      const pre2 = PREFIX.find(p => p.e === e);
      if (!pre2) return v.toExponential(Math.max(0, sig - 1));
      decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
      return scaled.toFixed(decimals) + (pre2.s ? '\u00A0' + pre2.s : '');
    }
    return scaled.toFixed(decimals) + (pre.s ? '\u00A0' + pre.s : '');
  }

  /* * eng() plus a unit, following the SI convention that there is no space * between a prefix and its unit: 399 mN, 54.0 mV, 3.00 A, 12.3 kΩ. */
  function unit(v, u, sig = 3) {
    const s = eng(v, sig);
    if (!u) return s;
    // eng() joins number and prefix with a NON-BREAKING space - split on that
    // (splitting on ' ' never matched, which printed "54.0 m V")
    const parts = s.split('\u00A0');
    // parts = [number, prefix] when a prefix was applied, else [number]
    return parts.length === 2 ? `${parts[0]}\u00A0${parts[1]}${u}` : `${s}\u00A0${u}`;
  }

  /* Write textContent only when the string actually changed. Re-writing an
     identical value still dirties the node and forces style+layout work, which
     is exactly what per-frame readout updates were doing at 60 Hz. */
  function setText(el, s) {
    if (!el) return;
    if (el.__emcTxt !== s) { el.__emcTxt = s; el.textContent = s; }
  }

  /* Rate-limit a non-critical callback (sim readouts) to ~hz calls/second.
     The trailing call is always delivered, so the last value never goes stale.
     Physics and user-critical feedback must NOT go through this. */
  function throttle(fn, hz) {
    const gap = 1000 / hz;
    let last = 0, timer = 0, args = null;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    return function (...a) {
      args = a;
      const t = now();
      if (t - last >= gap) { last = t; fn(...args); return; }
      if (!timer) timer = setTimeout(() => { timer = 0; last = now(); fn(...args); }, gap - (t - last));
    };
  }

  /* Fixed-decimal formatting that never returns "-0.0". */
  function fixed(v, dp = 2) {
    if (!isFinite(v)) return '\u2014';
    const r = Number(v.toFixed(dp));
    return (Object.is(r, -0) ? 0 : r).toFixed(dp);
  }

  /* Device tier: small high-DPR screens (phones, emulated mobile profiles)
     get a 30 fps animation cap and sims may trim particle counts. Signals are
     feature-detected with safe fallbacks; desktop is never tiered down. */
  function detectLowTier() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    const small = (window.innerWidth || 1200) < 500;
    const hidpi = (window.devicePixelRatio || 1) >= 3;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8;
    return (hidpi && small) || (coarse && cores <= 4);
  }
  const LOW_TIER_DEVICE = detectLowTier();

  /* ------------------------------------------------------------------------ 4. Stage — HiDPI canvas wrapper with an optional rAF loop ------------------------------------------------------------------------ */
  /* * @param {HTMLCanvasElement} canvas * @param {(ctx:CanvasRenderingContext2D, w:number, h:number, stage:Stage)=>void} render * @param {{animate?:boolean}} [opts] animate=true keeps a rAF loop running * (it auto-pauses when the canvas scrolls out of view to save CPU). */
  /* ---- Stage registry, budget and dev diagnostics -----------------------
     ONE cleanup path: every Stage owns an AbortController plus tracked timer
     and observer sets. Sims register listeners, timers and observers through
     the stage (stage.listen / timer / interval / observe / bind*) and write no
     teardown of their own; stage.destroy() releases everything. The budget
     keeps at most TWO animation chains running - a third pauses the chain
     farthest from the viewport centre (offscreen chains are already paused
     by each stage's own IntersectionObserver). */
  const STAGES = new Set();
  const DEBUGQS = typeof location !== 'undefined' && /[?&]debug/.test(location.search || '');
  let TRACKED = 0;                  // live listeners+timers+observers registered via stages
  let TRACK = null;                 // counter hook while control binders run under a stage
  function stageViewDist(s) {
    const r = s.canvas.getBoundingClientRect();
    const vh = (typeof window !== 'undefined' && window.innerHeight) || 0;
    return Math.abs(r.top + r.height / 2 - vh / 2);
  }
  function refreshBudget() {
    const wants = st => st.animate && st._running && !st._idle && st._visible && !st._hidden;
    let active = [...STAGES].filter(st => wants(st) && !st._budgetPaused);
    for (const st of STAGES) {
      if (st._budgetPaused && wants(st) && active.length < 2) {
        st._budgetPaused = false; st._budgetResume = true; active.push(st); st._last = 0; st._tick();
        if (DEBUGQS) console.info('[emc] stage budget: resumed #' + st.canvas.id);
      }
    }
    active = [...STAGES].filter(st => wants(st) && !st._budgetPaused);
    if (active.length <= 2) return;
    active.sort((a, b) => stageViewDist(a) - stageViewDist(b));
    for (let i = 2; i < active.length; i++) {
      const v = active[i];
      v._budgetPaused = true; v._budgetResume = false;
      if (v._raf) cancelAnimationFrame(v._raf);
      v._raf = 0;
      if (DEBUGQS) console.info('[emc] stage budget: paused farthest #' + v.canvas.id);
    }
  }
  function addL(t, ty, fn, opts) { if (TRACK) TRACK(); t.addEventListener(ty, fn, opts); }
  function withTrack(stage, fn) {
    const prev = TRACK; let n = 0; TRACK = () => { n++; };
    const r = fn(); TRACK = prev;
    stage._n += n; TRACKED += n; return r;
  }

  class Stage {
    constructor(canvas, render, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) {
        /* Canvas 2D unsupported: leave the friendly flat message standing in
           the skeleton plate and stay inert — never a blank screen, never a
           throw. The loader never waits on sims, so the loading contract
           holds even on this path. */
        this._dead = true;
        this._timers = new Set(); this._observers = new Set(); this._n = 0;
        this._raf = 0; this._drawRaf = 0; this._pmRaf = 0; this._running = false;
        this.w = 0; this.h = 0; this.dpr = 1; this.t = 0;
        this.pointer = { x: 0, y: 0, down: false, inside: false };
        const wrap = canvas.closest ? canvas.closest('.canvas-wrap') : null;
        const plate = wrap ? wrap.querySelector('.sim-plate') : null;
        if (plate) {
          plate.classList.add('keep');
          const msg = plate.querySelector('.sim-plate-msg');
          if (msg) msg.textContent = 'This browser can\u2019t draw the lab bench \u2014 the written lesson is unaffected';
        }
        return;
      }
      this.render = render;
      this.animate = !!opts.animate;
      this._optsAnimate = this.animate;
      /* prefers-reduced-motion: non-essential continuous motion starts as a
         static frame. Interactions still redraw on demand (invalidate), so
         every sim stays fully usable — only the autonomous motion stops. */
      this._prm = !!(typeof window !== 'undefined' && window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (this.animate && this._prm) this.animate = false;
      /* one cleanup path: everything this stage (or a sim through it)
         registers hangs off this controller or the tracked sets below */
      this._ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
      this._n = 0;                    // tracked registrations owned by this stage
      this._timers = new Set();
      this._observers = new Set();
      this._budgetPaused = false;     // set by the two-chain budget
      STAGES.add(this);
      this.w = 0; this.h = 0; this.dpr = 1;
      this.t = 0;                 // accumulated time in seconds (animation)
      this.pointer = { x: 0, y: 0, down: false, inside: false };
      this._raf = 0; this._last = 0; this._visible = true; this._running = false;
      this._drawRaf = 0; this._pmRaf = 0; this._pm = null;
      this._lastRender = 0;
      this._fpsCap = LOW_TIER_DEVICE ? 30 : 0;      // 0 = uncapped
      /* Entrance: objects assemble into place on first paint. draw() applies
         a generic decelerating fade+rise; sims that choreograph their own
         objects (charges converging, a magnet sliding in) read intro().
         Reduced motion skips straight to the settled state. */
      this._introMs = opts.intro || 0;
      this._introStart = 0;
      this._hidden = typeof document !== 'undefined' && document.hidden === true;
      this._idle = false;           // set by sims whose scene has visually settled

      this.resize();
      this._observeResize();
      this._observeDPR();
      this._observeVisibility();
      this._observePageVisibility();
      this._observePRM();
      if (this.animate) this.start(); else this.draw();
    }

    /* Live reduced-motion: decorative loops stop the moment the OS flips the
       preference; interaction keeps working (invalidate still redraws). */
    _observePRM() {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mq || typeof mq.addEventListener !== 'function') return;
      this._prmHandler = () => {
        this._prm = mq.matches;
        if (this._prm) { this.animate = false; this.stop(); this.draw(); }
        else { this.animate = this._optsAnimate; if (this.animate) this.start(); else this.draw(); }
        refreshBudget();
      };
      this._trackListener(mq, 'change', this._prmHandler);
    }

    /* -- tracked registration (the only way sims may subscribe) ------------ */
    _trackListener(t, ty, fn, opts) {
      t.addEventListener(ty, fn, Object.assign({ signal: this._ac ? this._ac.signal : undefined }, opts));
      this._n++; TRACKED++;
    }
    _trackObserver(o) { this._observers.add(o); this._n++; TRACKED++; }
    _trackTimer(id) { this._timers.add(id); this._n++; TRACKED++; return id; }
    _untrack() { this._n--; TRACKED--; }
    listen(target, type, fn, opts) { this._trackListener(target, type, fn, opts); return fn; }
    timer(fn, ms) {
      const id = setTimeout(() => { this._timers.delete(id); this._untrack(); fn(); }, ms);
      return this._trackTimer(id);
    }
    interval(fn, ms) { return this._trackTimer(setInterval(fn, ms)); }
    clearTimer(id) { if (this._timers.delete(id)) { clearTimeout(id); clearInterval(id); this._untrack(); } }
    observe(target, cb, opts, kind) {
      const Ctor = kind === 'resize' ? (typeof ResizeObserver === 'function' ? ResizeObserver : null)
        : kind === 'mutation' ? (typeof MutationObserver === 'function' ? MutationObserver : null)
        : (typeof IntersectionObserver === 'function' ? IntersectionObserver : null);
      if (Ctor === null) return null;
      const o = new Ctor(cb); o.observe(target, opts); this._trackObserver(o); return o;
    }
    bindRange(a, b, c, d) { return withTrack(this, () => bindRange(a, b, c, d, this._ac ? this._ac.signal : undefined)); }
    bindSegment(a, b) { return withTrack(this, () => bindSegment(a, b, this._ac ? this._ac.signal : undefined)); }
    bindToggles(a, b) { return withTrack(this, () => bindToggles(a, b, this._ac ? this._ac.signal : undefined)); }

    /* Re-read the CSS size and scale the backing store for crisp rendering. */
    resize() {
      if (this._dead) return false;
      const rect = this.canvas.getBoundingClientRect();
      const cs = window.getComputedStyle ? window.getComputedStyle(this.canvas) : null;
      const px = v => (parseFloat(v) || 0);
      /* Measure the CONTENT box, never the border box: the canvas bitmap
         attributes are content-box sizes and .sim-canvas carries a 1.5px
         border-bottom. Feeding border-box rects back into the attributes made
         every ResizeObserver pass add the border to the layout height — the
         canvas grew ~3px per frame, forever (unbounded layout + bitmap growth
         on every grid-layout sim page; also broke Playwright stability). */
      const bx = cs ? px(cs.borderLeftWidth) + px(cs.borderRightWidth) : 0;
      const by = cs ? px(cs.borderTopWidth) + px(cs.borderBottomWidth) : 0;
      const w = Math.max(1, Math.round(rect.width - bx));
      const h = Math.max(1, Math.round(rect.height - by));
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      if (w === this.w && h === this.h && dpr === this.dpr) return false;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      // All drawing code below works in CSS pixels.
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    _observeResize() {
      if (typeof ResizeObserver === 'function') {
        this._ro = new ResizeObserver(() => { this.resize(); this.draw(); });
        this._ro.observe(this.canvas);
        this._trackObserver(this._ro);
      } else {                                    // graceful fallback
        this._trackListener(window, 'resize', () => { this.resize(); this.draw(); });
      }
    }

    /* Pause the animation loop when the canvas is off-screen (battery/CPU). */
    _observeVisibility() {
      if (typeof IntersectionObserver !== 'function') return;
      this._io = new IntersectionObserver(entries => {
        for (const en of entries) {
          this._visible = en.isIntersecting;
          if (this._visible && this._running) { this._last = 0; this._tick(); }
        }
        refreshBudget();
      }, { threshold: 0.01 });
      this._io.observe(this.canvas);
      this._trackObserver(this._io);
    }

    /* Re-resize when the device-pixel-ratio changes (browser zoom, moving the
       window between monitors): window `resize` does not always fire for that.
       The matchMedia query is re-armed after every change because the query
       itself contains the current DPR. */
    _observeDPR() {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const arm = () => {
        const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        if (!mq || typeof mq.addEventListener !== 'function') return;
        const onchange = () => { this.resize(); this.draw(); mq.removeEventListener('change', onchange); this._n--; TRACKED--; arm(); };
        this._dq = mq; this._dqHandler = onchange;
        mq.addEventListener('change', onchange); this._n++; TRACKED++;
      };
      arm();
    }

    /* Pause when the TAB is hidden. Off-screen detection alone is not enough:
       a visible-but-hidden tab keeps every IntersectionObserver reporting
       "intersecting", so without this the chains would rely on the browser's
       own rAF throttling instead of stopping cleanly (and would burst-resume). */
    _observePageVisibility() {
      if (typeof document === 'undefined' || !document.addEventListener) return;
      this._onVis = () => {
        this._hidden = document.hidden === true;
        if (!this._hidden && this._running && this._visible) { this._last = 0; this._tick(); }
        refreshBudget();
      };
      this._trackListener(document, 'visibilitychange', this._onVis);
    }

    /* Full teardown: stop the chain and release observers/listeners. Pages
       keep stages for their lifetime, but repeated objects (quiz charts,
       future dynamic sims) can release everything through one call. */
    destroy() {
      this.stop();
      if (this._drawRaf) cancelAnimationFrame(this._drawRaf);
      if (this._pmRaf) cancelAnimationFrame(this._pmRaf);
      this._drawRaf = 0; this._pmRaf = 0;
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      this._observers.forEach(o => o.disconnect());
      this._observers.clear();
      this._timers.forEach(id => { clearTimeout(id); clearInterval(id); });
      this._timers.clear();
      TRACKED -= this._n; this._n = 0;
      STAGES.delete(this);
      if (this._dq && this._dqHandler) this._dq.removeEventListener('change', this._dqHandler);
      if (this._ac) this._ac.abort();          // every tracked listener dies here
      refreshBudget();
    }

    draw() {
      if (this._dead) return;
      if (!this.w || !this.h) return;
      const ip = this.intro();
      if (ip < 1) {
        const c = this.ctx;
        c.save();
        c.globalAlpha *= ip;
        c.translate(0, (1 - ip) * 8);
        this.render(c, this.w, this.h, this);
        c.restore();
      } else {
        this.render(this.ctx, this.w, this.h, this);
      }
      /* First real paint: announce the Stage (plate handover). */
      if (!this._readySent) {
        this._readySent = true;
        try { this.canvas.dispatchEvent(new CustomEvent('emc:stage-ready', { bubbles: true })); } catch (e) { /* older envs */ }
      }
    }

    /* 0..1 decelerated entrance progress; keeps a non-animating stage
       repainting until settled, and answers 1 under reduced motion. */
    intro() {
      if (!this._introMs || this._prm) return 1;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (!this._introStart) this._introStart = now;
      const p = clamp((now - this._introStart) / this._introMs, 0, 1);
      if (p < 1 && !this._running) this.invalidate();
      return 1 - Math.pow(1 - p, 3);
    }

    /* Sims whose scene has visually settled (spring at rest, diffusion at
       steady state, tone stopped) call setIdle(true) to stop the chain; any
       interaction calls setIdle(false) or invalidate() to wake it. Physics
       outputs are unchanged — this only stops redrawing an unchanged scene. */
    setIdle(v) {
      v = !!v;
      if (this._idle === v) return;
      this._idle = v;
      if (!v && this._running && this._visible && !this._hidden) { this._last = 0; this._tick(); }
      refreshBudget();
    }
    /* Ask for a redraw without doing it synchronously: multiple invalidations
       inside one input burst collapse into a single draw on the next frame.
       A live animation chain already implies the next draw, so this is a no-op
       there. */
    invalidate() {
      if (this._running && !this._idle) return;
      if (this._drawRaf) return;
      this._drawRaf = requestAnimationFrame(() => { this._drawRaf = 0; this.draw(); });
    }

    start() {
      if (this._dead || this._running) return;
      this._running = true; this._last = 0;
      this._tick();
      refreshBudget();
    }
    stop() {
      this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0;
      refreshBudget();
    }

    _tick() {
      if (!this._running || this._raf) return;   // a frame is already scheduled: never spawn a second chain
      // the budget owns the wheel: a paused chain stays paused until a slot
      // frees (stop/destroy/idle/visibility), never until a same-tick resume
      if (this._budgetPaused && !this._budgetResume) return;
      this._budgetResume = false;
      this._raf = requestAnimationFrame(now => {
        this._raf = 0;
        if (!this._running) return;
        // device tier: skip renders between capped frames while keeping the
        // chain and the real-time dt bookkeeping intact
        if (this._fpsCap && this._lastRender && (now - this._lastRender) < (1000 / this._fpsCap) - 2) {
          this._tick();
          return;
        }
        this._lastRender = now;
        if (!this._last) this._last = now;
        // Clamp dt so a backgrounded tab does not produce a huge time jump.
        const dt = clamp((now - this._last) / 1000, 0, 0.05);
        this._last = now;
        this.t += dt;
        this.render(this.ctx, this.w, this.h, this, dt);
        if (!this._readySent) {
          this._readySent = true;
          try { this.canvas.dispatchEvent(new CustomEvent('emc:stage-ready', { bubbles: true })); } catch (e) { /* older envs */ }
        }
        if (this._idle) { this._raf = 0; return; }        // settled: stop the chain until invalidated
        if (this._visible && !this._hidden) this._tick(); else this._raf = 0;
      });
    }

    /* * Attach unified mouse + touch input. Coordinates are delivered in the * same CSS-pixel space the render function uses. * @param {(p:{x:number,y:number,down:boolean,type:string,e:PointerEvent})=>void} handler */
    onPointer(handler) {
      const toLocal = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      this._trackListener(this.canvas, 'pointerdown', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: true, inside: true };
        // Own the gesture only once a drag actually starts on this canvas, so
        // a touch that begins here can still scroll the page (pan-y) until
        // then. Released on pointerup/pointercancel.
        this.canvas.classList.add('dragging');
        // Keep receiving move events even if the pointer leaves the canvas.
        if (this.canvas.setPointerCapture) { try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {} }
        handler({ ...p, down: true, type: 'down', e });
        if (!this._running) this.draw();      // #6.2/#7.5: no loop => redraw by hand
        e.preventDefault();
      });
      this._trackListener(this.canvas, 'pointermove', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: this.pointer.down, inside: true };
        // Coalesce: a 120 Hz mouse or a fast finger must not trigger more than
        // one handler run (and therefore one redraw) per animation frame.
        this._pm = { ...p, down: this.pointer.down, type: 'move', e };
        if (!this._pmRaf) {
          this._pmRaf = requestAnimationFrame(() => {
            this._pmRaf = 0;
            if (this._pm) { const q = this._pm; this._pm = null; handler(q); if (!this._running) this.draw(); }
          });
        }
      });
      const flushMove = () => {
        if (this._pmRaf) { cancelAnimationFrame(this._pmRaf); this._pmRaf = 0; }
        if (this._pm) { const q = this._pm; this._pm = null; handler(q); if (!this._running) this.draw(); }
      };
      const up = e => {
        flushMove();                       // never drop the last position
        const p = toLocal(e);
        this.pointer.down = false;
        this.canvas.classList.remove('dragging');
        handler({ ...p, down: false, type: 'up', e });
        if (!this._running) this.draw();
      };
      this._trackListener(this.canvas, 'pointerup', up);
      this._trackListener(this.canvas, 'pointercancel', up);
      this._trackListener(this.canvas, 'pointerleave', () => {
        this.pointer.inside = false; this.pointer.down = false;
        handler({ ...this.pointer, type: 'leave', e: null });
      });
      return this;
    }
  }

  /* ------------------------------------------------------------------------ 5. Drawing helpers (shared by several simulations) ------------------------------------------------------------------------ */
  /* Rounded rectangle that works even where ctx.roundRect is unavailable. */
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* Arrow from (x1,y1) to (x2,y2) with a filled head. */
  function arrow(ctx, x1, y1, x2, y2, { color = '#a8d3e0', width = 2.5, head = 9, dash = null } = {}) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.5) return;
    const shaft = Math.max(0, len - head * 0.85);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(ang) * shaft, y1 + Math.sin(ang) * shaft);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head);
    ctx.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Canvas type follows the page type. Sizes are design pixels at the 16 px
     root, scaled by the LIVE root font-size so canvas annotations shrink and
     grow together with the DOM across the 15.5/16/17 px breakpoints; weights
     snap to the three committed G8321 faces (400 / 700) because intermediate
     values would synthesize a fake bold, and the family is the site stack —
     a monospace fallback here read as a different, smaller voice. */
  let canvasTypeScale = 1;
  const FONT_CACHE = new Map();
  function syncCanvasType() {
    let rp = 16;
    if (typeof document !== 'undefined' && document.documentElement && typeof getComputedStyle === 'function') {
      const v = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (isFinite(v) && v > 0) rp = v;
    }
    canvasTypeScale = rp / 16;
    FONT_CACHE.clear();
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    syncCanvasType();
    window.addEventListener('resize', syncCanvasType);
  }
  /* label() is called dozens of times per frame; parsing the font shorthand is
     wasted work when 99% of calls reuse a (weight,size) pair. */
  const fontFor = (weight, size) => {
    const w = Number(weight) >= 600 ? 700 : 400;
    const s = Math.round(size * canvasTypeScale * 10) / 10;
    const k = w + '|' + s;
    let f = FONT_CACHE.get(k);
    if (!f) FONT_CACHE.set(k, f = `${w} ${s}px G8321, 'Hiragino Maru Gothic ProN', 'Segoe UI', system-ui, sans-serif`);
    return f;
  };

  /* Small label with a dark halo so it stays legible over any drawing. */
  function label(ctx, text, x, y, { color = '#e8eefb', size = 12, align = 'center', baseline = 'middle', halo = true, weight = '600' } = {}) {
    ctx.save();
    ctx.font = fontFor(weight, size);
    ctx.textAlign = align; ctx.textBaseline = baseline;
    if (halo) {
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(4,8,16,.85)';
      ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* Draw a point charge as a flat sticker: pastel disc, cream ring, dark sign. No gradients and no glow, per the flat-art policy. */
  function chargeGlyph(ctx, x, y, r, q, { pulse = 0 } = {}) {
    const pos = q >= 0;
    ctx.save();
    ctx.fillStyle = pos ? '#f8aebe' : '#a8d3e0';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(246,241,229,.85)'; ctx.stroke();

    // sign
    ctx.strokeStyle = '#2b2d33'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.lineCap = 'round';
    const s = r * 0.46;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.stroke();
    if (pos) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke(); }
    ctx.restore();
  }

  /* ------------------------------------------------------------------------ 6. Storage wrapper — localStorage can throw (private mode, sandboxed iframe, file:// in some browsers), so we fall back to memory. ------------------------------------------------------------------------ */
  const store = (function () {
    let mem = {};
    let ok = true;
    try {
      const k = '__emc_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
    } catch (err) { ok = false; }
    return {
      available: ok,
      get(key) {
        try { return ok ? window.localStorage.getItem(key) : (key in mem ? mem[key] : null); }
        catch (e) { return key in mem ? mem[key] : null; }
      },
      set(key, value) {
        try { if (ok) window.localStorage.setItem(key, value); else mem[key] = value; }
        catch (e) { mem[key] = value; }
      },
      remove(key) {
        try { if (ok) window.localStorage.removeItem(key); delete mem[key]; } catch (e) {}
      }
    };
  })();

  /* ------------------------------------------------------------------------ 6b. Preferences (small, validated, storage-safe) ------------------------------------------------------------------------ */
  const PREFS_KEY = 'emc.prefs.v1';
  const Prefs = {
    read() {
      try { const p = JSON.parse(store.get(PREFS_KEY) || '{}'); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {}; }
      catch (e) { return {}; }
    },
    get(k, d) { const v = this.read()[k]; return v === undefined ? d : v; },
    set(k, v) { const p = this.read(); p[k] = v; store.set(PREFS_KEY, JSON.stringify(p)); }
  };

  /* ------------------------------------------------------------------------ 6c. Boot loader — ONE lifecycle, ONE owner, ONE watchdog ------------------------------------------------------------------------ */
  /* Contract (§3.1):
     - Page content renders immediately: there is NO static overlay in the
       HTML. This module builds one only if boot has not finished ~150 ms
       after navigation start, so a fast load never paints it at all.
     - Stages are real signals only (fonts ready, above-the-fold equations
       typeset, critical UI booted). A page that does not use a stage never
       waits for it: `start()` is told which stages exist.
     - Ready -> the overlay exits in 200-300 ms (EXIT_MS below).
     - The watchdog is a hard 1500 ms ceiling. At expiry the page is usable:
       the overlay goes away and non-essential work (below-the-fold equations,
       lazy sims, optional fonts) keeps running in the background. A failed
       CRITICAL dependency (no registry, no KaTeX on a page that needs it)
       gets a visible card with Retry and Home. Never a permanent spinner.
     - Nothing here touches storage, so blocked localStorage/sessionStorage
       cannot wedge it. Reduced motion drops the transitions but keeps every
       state change.
     - Every timer is tracked and cleared on dismissal.
     The inline head script on each page carries a dead-man switch for the one
     case this module cannot cover — common.js itself never executing. */
  const LOADER = (function () {
    const SHOW_AFTER_MS = 150;    // before this, boot finishing means no overlay at all
    const EXIT_MS = 240;          // spec window: 200-300 ms
    const WATCHDOG_MS = 1500;     // hard ceiling
    const STAGE_LABEL = { fonts: 'fonts', equations: 'equations', ui: 'interface' };

    let stages = [];
    let segs = [];
    let overlay = null, srStatus = null;
    let showTimer = 0, watchdogTimer = 0, exitTimer = 0;
    let started = false, painted = false, finished = false;
    const done = {};

    function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0; }

    function build() {
      if (overlay || !document.body) return;
      const el = document.createElement('div');
      el.id = 'bootOverlay';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-label', 'Loading EMC Lab');
      const bar = document.createElement('span');
      bar.className = 'bo-bar';
      bar.setAttribute('aria-hidden', 'true');
      segs = stages.map(() => { const i = document.createElement('i'); i.className = 'bo-seg'; bar.appendChild(i); return i; });
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.id = 'boStatus';
      sr.textContent = 'Loading EMC Lab: ' + stages.map(s => STAGE_LABEL[s] || s).join(', ');
      el.appendChild(bar); el.appendChild(sr);
      document.body.appendChild(el);
      overlay = el; srStatus = sr; painted = true; showAtMs = now();
      document.documentElement.setAttribute('aria-busy', 'true');
      paint();
    }

    function paint() {
      stages.forEach((s, i) => { if (segs[i]) segs[i].classList.toggle('done', !!done[s]); });
    }

    function clearTimers() {
      if (showTimer) { clearTimeout(showTimer); showTimer = 0; }
      if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = 0; }
      if (exitTimer) { clearTimeout(exitTimer); exitTimer = 0; }
    }

    /* Critical-failure card: Retry + Home, content stays usable behind it. */
    function failCard(reason) {
      if (document.getElementById('bootFatal')) return;
      const home = (location.pathname.indexOf('/topics/') >= 0 ? '../index.html' : 'index.html');
      const d = document.createElement('div');
      d.id = 'bootFatal';
      d.setAttribute('role', 'alert');
      d.innerHTML = '<p><strong>EMC Lab did not finish starting.</strong> ' + reason + '</p>' +
        '<p><button type="button" id="bootFatalRetry">Retry</button> <a href="' + home + '">Home</a></p>';
      document.body.appendChild(d);
      const r = d.querySelector('#bootFatalRetry');
      if (r) r.addEventListener('click', () => location.reload());
    }

    /* A dependency is CRITICAL when the page is meaningfully broken without
       it: no registry (nav/dashboard/shell dead) or no KaTeX on a page that
       carries equations (the fallback text stays readable, so the card is a
       report, not a wall — content remains usable behind it). */
    function criticalMissing() {
      const missing = [];
      if (!window.EMC_REGISTRY) missing.push('the chapter registry did not load');
      if (document.querySelector('[data-tex]') && !window.katex) missing.push('the equation typesetter did not load');
      return missing;
    }

    let showAtMs = 0, finishAtMs = 0;
    function finish(reason) {
      if (finished) return;
      finished = true;
      finishAtMs = now();
      /* If the 150 ms gate already expired but the show timer never got CPU
         (timer starvation on saturated machines — CI with software rendering),
         the boot WAS slow by contract, so run the paint now and let the
         normal exit path dismiss it. Fast boots (finish < gate) never paint.
         (2026-10-26, loader-verify test 2 determinism.) */
      if (!painted && showTimer && now() > SHOW_AFTER_MS) build();
      clearTimers();
      /* single owner, single completion signal: the intro (and anything else
         that must wait for a usable page) listens for this one event. */
      try { document.dispatchEvent(new CustomEvent('emc:loader-done', { detail: reason })); } catch (e) {}
      const missing = criticalMissing();
      if (missing.length && document.body) failCard(missing.join(', and ') + '.');
      document.documentElement.removeAttribute('aria-busy');
      if (srStatus) srStatus.textContent = 'Ready';
      const drop = () => { if (exitTimer) { clearTimeout(exitTimer); exitTimer = 0; } if (overlay) { overlay.remove(); overlay = null; } segs = []; srStatus = null; };
      if (!painted || EMC.reducedMotion) { drop(); return; }
      overlay.classList.add('hide');
      exitTimer = setTimeout(() => { exitTimer = 0; drop(); }, EXIT_MS);
      void reason;
    }

    function start(stageList) {
      if (started) return;
      started = true;
      stages = (stageList || []).filter(s => STAGE_LABEL[s]);
      const wait = Math.max(0, SHOW_AFTER_MS - now());
      showTimer = setTimeout(build, wait);
      watchdogTimer = setTimeout(expire, Math.max(0, WATCHDOG_MS - now()));
    }

    function signal(name) {
      if (!started || finished || done[name] || stages.indexOf(name) === -1) return;
      done[name] = true;
      paint();
      if (stages.every(s => done[s])) finish('complete');
    }

    /* Watchdog expiry: the page must be usable from here on — finish() runs
       the critical-dependency check and gets the overlay out of the way. */
    function expire() {
      if (finished) return;
      finish('watchdog');
    }

    return {
      start, signal, finish, expire,
      /* introspection for the gates and tests */
      state() {
        return {
          started, painted, finished, stages: stages.slice(), done: Object.keys(done),
          timers: [showTimer, watchdogTimer, exitTimer].filter(Boolean).length,
          /* ms since this script evaluated (≈ navigation start for a defer
             script) — lets the gate harness assert the §3.1 contract exactly:
             the overlay may paint only if boot had not finished by ~150 ms */
          showAtMs, finishAtMs
        };
      }
    };
  })();

  /* ------------------------------------------------------------------------ 7. Progress tracking ------------------------------------------------------------------------ */
  /* Progress tracks exactly the two chapters from the registry —
     no more, no less. The ids are derived, never hand-typed here. */
  const TOPICS = (window.EMC_REGISTRY && Array.isArray(window.EMC_REGISTRY.chapters) && window.EMC_REGISTRY.chapters.length
    ? window.EMC_REGISTRY.chapters.map(c => c.id)
    : ['ch1', 'ch2']);
  const PROGRESS_KEY = 'emc.progress.v4';
  const LEGACY_KEYS = ['emc.progress.v3', 'emc.progress.v2', 'emc.progress.v1'];

  /* Every topic id this site has ever shipped, mapped onto the chapter that
     owns that material now:
       v1  current, charges, magnetism, induction
       v2  current, efield, magind
       v3  charge, coulomb, field  (circuits and magnetism were untracked then)
       v4  ch1, ch2, ch3   (ch3 = the magnetism chapter, since removed)
     Migration ORs the old flags into the new chapters, so marking any one of
     charge/coulomb/field credits ch2 — a reader who studied a section has not
     lost it. The v1 magnetism/induction pair still needs BOTH halves, exactly
     as the v1→v2 rule required, so a half-finished old pair cannot fake a
     finished chapter. Nothing is deleted: the raw record is copied to
     `<key>.legacy` before the migrated one is written. Idempotent. */
  const TOPIC_TO_CHAPTER = {
    current: 'ch1', circuits: 'ch1',
    charges: 'ch2', efield: 'ch2', charge: 'ch2', coulomb: 'ch2', field: 'ch2',
  };
  function migrateLegacy(p) {
    const t = (p && p.topics) || {};
    const topics = TOPICS.reduce((o, id) => (o[id] = false, o), {});
    const credit = id => { if (TOPICS.indexOf(id) !== -1) topics[id] = true; };
    for (const old of Object.keys(t)) {
      if (!t[old]) continue;
      const ch = TOPIC_TO_CHAPTER[old];
      if (ch) credit(ch); else credit(old);        // already a current chapter id
    }
    /* each legacy key credits the chapter that owns it now (#7.8: the old
       "both halves of a split pair" rule died with the v1 topic list) */
    return {
      topics,
      quizBest: Number(p.quizBest) || 0,
      quizAttempts: Number(p.quizAttempts) || 0,
      quizLast: Number(p.quizLast) || 0,
      quizHistory: Array.isArray(p.quizHistory) ? p.quizHistory.slice(-20) : [],
      updatedAt: p.updatedAt || null
    };
  }

  const Progress = {
    /* @returns {{topics:Object<string,boolean>,quizBest:number,quizAttempts:number,quizLast:number,updatedAt:string}} */
    read() {
      const blank = {
        topics: TOPICS.reduce((o, id) => (o[id] = false, o), {}),
        quizBest: 0, quizAttempts: 0, quizLast: 0,
        quizHistory: [],          // [{ pct, at }] — newest last, capped at 20
        updatedAt: null
      };
      const raw = store.get(PROGRESS_KEY);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          return {
            topics: Object.assign(blank.topics, p.topics || {}),
            quizBest: Number(p.quizBest) || 0,
            quizAttempts: Number(p.quizAttempts) || 0,
            quizLast: Number(p.quizLast) || 0,
            quizHistory: Array.isArray(p.quizHistory) ? p.quizHistory.slice(-20) : [],
            updatedAt: p.updatedAt || null
          };
        } catch (e) { return blank; }
      }
      // No v4 yet: migrate an older record (v3, then v2, then v1) if present,
      // keeping a recoverable copy and leaving the original untouched.
      let legacy = null;
      for (const k of LEGACY_KEYS) { legacy = store.get(k); if (legacy) break; }
      if (!legacy) return blank;
      let parsed;
      try { parsed = JSON.parse(legacy); } catch (e) { return blank; }
      const moved = migrateLegacy(parsed);
      if (!store.get(PROGRESS_KEY + '.legacy')) store.set(PROGRESS_KEY + '.legacy', legacy);
      this.write(moved);
      return moved;
    },
    write(p) { p.updatedAt = new Date().toISOString(); store.set(PROGRESS_KEY, JSON.stringify(p)); },
    markTopic(id, done = true) {
      const p = this.read();
      if (id in p.topics) { p.topics[id] = !!done; this.write(p); }
      return p;
    },
    isTopicDone(id) { return !!this.read().topics[id]; },
    /* Record a quiz attempt. @param {number} pct percentage 0-100 */
    recordQuiz(pct) {
      const p = this.read();
      p.quizAttempts += 1;
      p.quizLast = pct;
      p.quizBest = Math.max(p.quizBest, pct);
      p.quizHistory = (p.quizHistory || []).concat([{ pct, at: new Date().toISOString() }]).slice(-20);
      // as promised on the home dashboard: a passing score counts as having
      // studied every chapter
      if (pct >= 70) TOPICS.forEach(t => { p.topics[t] = true; });
      this.write(p);
      return p;
    },
    /* 0-100 completion: 80% weight on topics read, 20% on best quiz score. */
    percent() {
      const p = this.read();
      const done = TOPICS.filter(t => p.topics[t]).length;
      return Math.round((done / TOPICS.length) * 80 + (p.quizBest / 100) * 20);
    },

    /* -- export / import ---------------------------------------------------
       Progress lives in this browser's localStorage, so a student who moves to
       another machine would otherwise start from zero. Export writes a small
       JSON file; Import reads one back. Import validates and sanitises every
       field before it touches storage, so a hand-edited or corrupt file can
       never poison the dashboard.                                          */
    exportJSON() {
      return JSON.stringify({
        app: 'emc-lab', version: 1,
        exportedAt: new Date().toISOString(),
        progress: this.read()
      }, null, 2);
    },
    /* @param {string} text contents of an exported file
       @returns {{ok:boolean, message:string}} */
    importJSON(text) {
      let raw;
      try { raw = JSON.parse(text); }
      catch (e) { return { ok: false, message: 'That file is not valid JSON.' }; }
      // `let`, not `const`: a legacy v1 file is replaced by its migration below
      let src = (raw && raw.progress) ? raw.progress : raw;
      if (!src || typeof src !== 'object') return { ok: false, message: 'No progress data found in that file.' };
      if (raw && raw.app && raw.app !== 'emc-lab') {
        return { ok: false, message: 'That file was not exported by EMC Lab.' };
      }

      const num = (v, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0; };
      if (src.topics && ('charges' in src.topics || 'vectors' in src.topics || 'magnetism' in src.topics ||
                         'efield' in src.topics || 'charge' in src.topics || 'coulomb' in src.topics ||
                         'field' in src.topics || 'magind' in src.topics)) {
        src = migrateLegacy(src);          // importing an older (v1/v2/v3) export file
      }
      // An object with NO recognised field is not a progress file - importing
      // it used to silently wipe the stored scores ("Imported: 0 of 3").
      const KNOWN = ['topics', 'quizBest', 'quizAttempts', 'quizLast', 'quizHistory'];
      if (!KNOWN.some(key => key in src)) {
        return { ok: false, message: 'That file contains no EMC Lab progress fields.' };
      }
      const p = {
        topics: TOPICS.reduce((o, id) => (o[id] = false, o), {}),
        quizBest: num(src.quizBest, 100),
        quizAttempts: Math.round(num(src.quizAttempts, 1e6)),
        quizLast: num(src.quizLast, 100),
        quizHistory: [],
        updatedAt: null
      };
      TOPICS.forEach(t => { p.topics[t] = !!(src.topics && src.topics[t]); });
      if (Array.isArray(src.quizHistory)) {
        p.quizHistory = src.quizHistory.slice(-20)
          .filter(h => h && Number.isFinite(Number(h.pct)))
          .map(h => ({ pct: num(h.pct, 100), at: typeof h.at === 'string' ? h.at : new Date().toISOString() }));
      }
      this.write(p);
      const done = TOPICS.filter(t => p.topics[t]).length;
      return {
        ok: true,
        message: `Imported: ${done} of ${TOPICS.length} chapters` +
                 (p.quizAttempts ? `, best score ${p.quizBest}%` : '')
      };
    },
    reset() {
      store.remove(PROGRESS_KEY);
      // also drop the legacy records, or the next read() would migrate one
      // straight back and resurrect the old progress (the recoverable copy in
      // PROGRESS_KEY.legacy survives)
      LEGACY_KEYS.forEach(k => store.remove(k));
      return this.read();
    }
  };

  /* ------------------------------------------------------------------------ 8. Control binding helper (slider <-> readout <-> state) ------------------------------------------------------------------------ */
  /* * Wire an <input type="range"> to a display element and a callback. * @param {string|HTMLInputElement} el slider (or its id) * @param {string|HTMLElement} out element that shows the value (or id) * @param {(value:number)=>void} onChange * @param {(value:number)=>string} [format] formatter for the readout */
  function bindRange(el, out, onChange, format, signal) {
    const input = typeof el === 'string' ? document.getElementById(el) : el;
    const target = typeof out === 'string' ? document.getElementById(out) : out;
    if (!input) return null;
    const fmt = format || (v => String(v));
    const apply = () => {
      const v = parseFloat(input.value);
      if (target) target.textContent = fmt(v);
      if (onChange) onChange(v);
    };
    addL(input, 'input', () => {
      apply();
      // brief accent pulse on the readout: feedback that the value moved
      if (target && target.classList) {
        target.classList.remove('val-tick');
        void target.offsetWidth;
        target.classList.add('val-tick');
      }
    }, signal ? { signal } : undefined);
    apply();
    return { input, set(v) { input.value = String(v); apply(); }, get: () => parseFloat(input.value) };
  }

  /* Radio-style segmented control: buttons inside a container with data-value. */
  function bindSegment(container, onChange, signal) {
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) return null;
    const btns = Array.from(root.querySelectorAll('.seg-btn'));
    const select = (btn) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (onChange) onChange(btn.dataset.value, btn);
    };
    btns.forEach(b => {
      addL(b, 'click', () => select(b), signal ? { signal } : undefined);
      if (b.getAttribute('aria-pressed') === 'true') { /* keep initial */ }
    });
    return {
      get: () => (btns.find(b => b.getAttribute('aria-pressed') === 'true') || {}).dataset?.value,
      set: (v) => { const b = btns.find(x => x.dataset.value === v); if (b) select(b); },
      buttons: btns
    };
  }

  /* Toggle button group (aria-pressed) */
  function bindToggles(rootSel, onChange, signal) {
    const root = typeof rootSel === 'string' ? document.getElementById(rootSel) : rootSel;
    if (!root) return;
    root.querySelectorAll('[data-toggle]').forEach(btn => {
      addL(btn, 'click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        if (onChange) onChange(btn.dataset.toggle, on, btn);
      });
    });
  }

  /* ------------------------------------------------------------------------ 9. Page UI: nav, reveal, reading progress, toasts, topic completion ------------------------------------------------------------------------ */
  const topicSyncs = [];   // one renderer per [data-complete-topic] button
  const UI = {
    initNav() {
      const toggle = document.getElementById('navToggle');
      const menu = document.getElementById('navMenu');
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          const open = menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', String(open));
        });
        // Close the mobile menu after choosing a destination.
        menu.addEventListener('click', e => {
          if (e.target.closest('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
        });
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && menu.classList.contains('open')) {
            menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
          }
        });
      }
      // Topics dropdown: click to toggle, close on outside click / Escape / pick /
      // focus leaving it; arrow keys move between the entries.
      const dropBtn = document.getElementById('topicsBtn');
      const dropMenu = document.getElementById('topicsMenu');
      if (dropBtn && dropMenu) {
        const drop = dropBtn.closest('.nav-drop') || dropMenu;
        const items = () => Array.from(dropMenu.querySelectorAll('a'));
        const setOpen = open => {
          dropBtn.setAttribute('aria-expanded', String(open));
          dropMenu.classList.toggle('open', open);
        };
        const isOpen = () => dropMenu.classList.contains('open');
        dropBtn.addEventListener('click', e => { e.stopPropagation(); setOpen(!isOpen()); });
        document.addEventListener('click', e => { if (!e.target.closest('.nav-drop')) setOpen(false); });
        document.addEventListener('keydown', e => {
          if (e.key !== 'Escape' || !isOpen()) return;
          // focus inside the closing menu would be lost, so hand it back to the button
          const hadFocus = drop.contains(document.activeElement);
          setOpen(false);
          if (hadFocus) dropBtn.focus();
        });
        dropMenu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
        // Tabbing out of the open dropdown closes it (it used to stay open behind the page)
        drop.addEventListener('focusout', e => {
          if (isOpen() && e.relatedTarget && !drop.contains(e.relatedTarget)) setOpen(false);
        });
        drop.addEventListener('keydown', e => {
          const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
          if (keys.indexOf(e.key) === -1) return;
          const list = items();
          if (!list.length) return;
          if (!isOpen()) { if (e.key !== 'ArrowDown') return; setOpen(true); }
          e.preventDefault();
          const at = list.indexOf(document.activeElement);
          let next = 0;
          if (e.key === 'ArrowDown') next = at < 0 ? 0 : (at + 1) % list.length;
          else if (e.key === 'ArrowUp') next = at <= 0 ? list.length - 1 : at - 1;
          else if (e.key === 'End') next = list.length - 1;
          list[next].focus();
        });
      }
      // Highlight the current page, incl. its dropdown entry. On the home page the
      // shell swaps chapters in place (#/ch1, #/ch2), so the highlight follows the
      // route instead of staying on "Home".
      const fileOf = a => (a.getAttribute('href') || '').split('#')[0].split('/').pop();
      const markCurrent = targetFile => {
        document.querySelectorAll('.nav-link, .dd-link').forEach(a => {
          const on = fileOf(a) !== '' && fileOf(a) === targetFile;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (dropBtn) dropBtn.classList.toggle('active', !!document.querySelector('.dd-link.active'));
      };
      const pageFile = location.pathname.split('/').pop() || 'index.html';
      const REG = window.EMC_REGISTRY;
      const homeViewFile = view => {
        const ch = view && view !== 'home' && REG && REG.chapter ? REG.chapter(view) : null;
        return ch ? ch.path.split('/').pop() : 'index.html';
      };
      if (pageFile === 'index.html') {
        const m = /^#\/([\w-]+)/.exec(location.hash || '');
        const ch = m && REG && REG.resolve ? REG.resolve(m[1]) : null;
        markCurrent(homeViewFile(ch ? ch.id : 'home'));
        document.addEventListener('emc:view-shown', e => markCurrent(homeViewFile(e.detail && e.detail.view)));
      } else {
        markCurrent(pageFile);
      }
    },

    initReveal() {
      // :not(.in) so the shell can re-run this after mounting a topic whose
      // reveal-gated blocks were never observed by the boot pass
      const items = document.querySelectorAll('.reveal:not(.in)');
      if (!items.length) return;
      if (typeof IntersectionObserver !== 'function' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      items.forEach(el => io.observe(el));
    },

    initReadingBar() {
      const bar = document.getElementById('readingProgress');
      if (!bar) return;
      const onScroll = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? clamp((window.scrollY / max) * 100, 0, 100) : 0;
        bar.style.width = pct.toFixed(2) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
    },

    /* Transient status message (used when progress is saved). */
    toast(message, kind = 'ok') {
      let host = document.getElementById('toastHost');
      if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.setAttribute('aria-live', 'polite');
        host.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:200;display:grid;gap:.4rem;justify-items:center;pointer-events:none';
        document.body.appendChild(host);
      }
      const el = document.createElement('div');
      const color = kind === 'ok' ? '#b5d777' : kind === 'warn' ? '#f6d36b' : '#a8d3e0';
      el.style.cssText = `background:#141414;border:1px solid ${color};color:#fff;
        padding:.55rem .95rem;border-radius:999px;font-size:.86rem;font-weight:600;
        box-shadow:0 16px 34px -18px #000;opacity:0;transform:translateY(8px);
        transition:opacity .25s ease,transform .25s ease;max-width:90vw;text-align:center`;
      el.textContent = message;
      host.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      setTimeout(() => {
        el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 320);
      }, 2600);
    },

    /* "Mark this topic complete" buttons -> Progress.markTopic */
    initTopicButtons() {
      topicSyncs.length = 0;
      document.querySelectorAll('[data-complete-topic]').forEach(btn => {
        const id = btn.dataset.completeTopic;
        const sync = () => {
          const done = Progress.isTopicDone(id);
          btn.classList.toggle('btn-primary', !done);
          btn.innerHTML = done
            ? '<img class="mascot-cheer" src="' + (location.pathname.indexOf('/topics/') >= 0 ? '../' : '') + 'img/mascot-sparkle.png" width="34" height="34" alt=""> Chapter completed \u2713'
            : 'Mark chapter as complete';
          btn.setAttribute('aria-pressed', String(done));
        };
        topicSyncs.push(sync);
        btn.addEventListener('click', () => {
          const nowDone = !Progress.isTopicDone(id);
          Progress.markTopic(id, nowDone);
          sync();
          document.dispatchEvent(new CustomEvent('emc:progress', { detail: Progress.read() }));
          UI.toast(nowDone ? 'Progress saved \u2014 topic marked complete' : 'Topic marked as not complete');
          if (nowDone) document.dispatchEvent(new CustomEvent('emc:mascot', { detail: { kind: 'chapter-done' } }));
        });
        sync();
      });
    },

    /* Re-render every topic button from storage. Called after a Reset or an
       Import, so the buttons always tell the truth without duplicating the
       markup rules from initTopicButtons(). */
    syncTopicButtons() { topicSyncs.forEach(fn => fn()); },

    /* Show a warning banner when localStorage is unavailable. */
    initStorageNotice() {
      if (store.available) return;
      const host = document.getElementById('storageNotice');
      if (host) {
        host.hidden = false;
        host.innerHTML = '<strong>Note:</strong> this browser is blocking local storage, so progress will reset when you close the tab. Everything else works normally.';
      }
    },

    /* Theme: dark is the default and the identity; light is opt-in. Like Details it
       only flips one attribute on <html> plus the persisted pref, so switching never
       reloads, resets a quiz, or touches Details/progress. (The same attribute is
       applied by an inline script in <head> before first paint.) */
    initThemeToggle() {
      const root = document.documentElement;
      const btn = document.getElementById('themeToggle');
      const meta = document.querySelector('meta[name="theme-color"]');
      const apply = theme => {
        if (theme === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
        if (btn) btn.setAttribute('aria-pressed', String(theme === 'light'));
        if (meta) meta.setAttribute('content', theme === 'light' ? '#faf7ec' : '#17181c');
      };
      apply(Prefs.get('theme', 'dark') === 'light' ? 'light' : 'dark');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const next = root.dataset.theme === 'light' ? 'dark' : 'light';
        apply(next);
        Prefs.set('theme', next);
        UI.toast(next === 'light' ? 'Light theme' : 'Dark theme');
        document.dispatchEvent(new CustomEvent('emc:theme', { detail: next }));
      });
    },

    initYear() {
      document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
    },

    /* Global Detail Mode: ON = full technical explanations, OFF = simplified.
       Content levels live in the markup as [data-detail="tech"|"plain"]; the
       toggle only flips one attribute on <html> plus the persisted pref, so
       switching never reloads, rerenders sims/charts, or touches form state. */
    initDetailToggle() {
      const root = document.documentElement;
      if (root.dataset.detail !== 'on' && root.dataset.detail !== 'off') {
        root.dataset.detail = Prefs.get('detail', 'on') === 'off' ? 'off' : 'on';
      }
      const btn = document.getElementById('detailToggle');
      const apply = () => {
        const on = root.dataset.detail !== 'off';
        if (btn) {
          /* §3.2.2: the label, aria-pressed, the data-detail attribute and the
             visible content must always agree — one source (dataset.detail),
             rendered into all three. */
          btn.setAttribute('aria-pressed', String(on));
          const s = btn.querySelector('.dt-state');
          if (s) s.textContent = on ? 'ON' : 'OFF';
        }
      };
      apply();
      if (btn) btn.addEventListener('click', () => {
        /* Swap explanation levels WITHOUT moving the reader: capture the
           element under the reading position, flip, then compensate the
           reflow inside the same frame so no layout shift is observable. */
        const headerBottom = (document.querySelector('.site-header') || {}).getBoundingClientRect
          ? document.querySelector('.site-header').getBoundingClientRect().bottom : 60;
        const anchorEl = (typeof document.elementFromPoint === 'function')
          ? document.elementFromPoint(Math.round(window.innerWidth / 2), Math.round(headerBottom) + 28)
          : null;
        const topBefore = anchorEl ? anchorEl.getBoundingClientRect().top : 0;
        const sy = window.scrollY;
        const flip = () => {
          root.dataset.detail = root.dataset.detail === 'off' ? 'on' : 'off';
          Prefs.set('detail', root.dataset.detail);
          apply();
          /* Announce the state change (§3.2.2): the toast host is aria-live
             polite, so screen readers get the new level, and the visible
             chip confirms it for everyone else. */
          UI.toast(root.dataset.detail === 'off'
            ? 'Details OFF — simplified explanations'
            : 'Details ON — full technical explanations');
          if (anchorEl && anchorEl.isConnected) {
            const d = anchorEl.getBoundingClientRect().top - topBefore;
            if (Math.abs(d) > 1) window.scrollTo(0, Math.max(0, sy + d));
          }
          document.dispatchEvent(new CustomEvent('emc:detail', { detail: root.dataset.detail }));
        };
        const settle = () => {
          requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('detail-fade')));
          /* Gentle rise on the blocks that just appeared, so the level swap
             reads as content arriving rather than a hard cut. Transform and
             opacity only, capped count, skipped entirely under reduced
             motion (that path never reaches settle()). */
          const level = root.dataset.detail === 'off' ? 'plain' : 'tech';
          const shown = [...document.querySelectorAll(`[data-detail="${level}"]`)].slice(0, 24);
          shown.forEach((n, i) => {
            if (!n.animate) return;
            n.animate(
              [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
              { duration: 220, delay: Math.min(i * 22, 150), easing: 'ease', fill: 'backwards' });
          });
        };
        if (EMC.reducedMotion) { flip(); return; }     // no fade for reduced motion
        root.classList.add('detail-fade');              // 80 ms out
        setTimeout(() => {
          flip();
          settle();
        }, 80);
      });
    },

    /* Stage 5 background preparation: prefetch the pager's next page once idle,
       and any topic link on hover/focus intent. Deduped, same-origin only, and
       link rel=prefetch keeps it at browser-idle priority so it never competes
       with the critical path. */
    /* ---- Vercel analytics — PR #1 (Speed Insights) + PR #2 (Web Analytics)
       reintegrated 2026-10-26 in the only form this repo's contracts allow.
       The auto-PRs installed third-party CDN tags (cdn.vercel-insights.com,
       cdn.jsdelivr.net), which the NET-01 network-purity gate forbids, and an
       npm package that a fully static site never executes. Vercel also serves
       both collectors SAME-ORIGIN under /_vercel/, so we inject those paths —
       and only on the Vercel production origin, so gate runs, previews and
       localhost never emit a beacon. ------------------------------------ */
    initAnalytics() {
      const prod = /(^|\.)vercel\.app$/.test(location.hostname);
      if (!prod) return;
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      for (const src of ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js']) {
        const s = document.createElement('script');
        s.defer = true; s.src = src;
        s.addEventListener('error', () => {});   // analytics must never break the page
        document.head.appendChild(s);
      }
    },
    initPrefetch() {
      const seen = new Set();
      const add = href => {
        if (!href || seen.has(href)) return;
        try {
          const u = new URL(href, location.href);
          if (u.origin !== location.origin) return;
          seen.add(href);
          const l = document.createElement('link');
          l.rel = 'prefetch';
          l.href = u.pathname + u.search;
          document.head.appendChild(l);
        } catch (e) { /* ignore bad urls */ }
      };
      const idle = cb => (typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 600));
      document.addEventListener('emc:ready', () => idle(() => {
        const next = document.querySelector('.pager a.next');
        if (next) add(next.getAttribute('href'));
      }));
      document.addEventListener('mouseover', e => {
        const a = e.target.closest && e.target.closest('a[data-topic-link], .pager a, .dd-link, a[href^="topics/"]');
        if (a) add(a.getAttribute('href'));
      }, { passive: true });
      document.addEventListener('focusin', e => {
        const a = e.target.closest && e.target.closest('a[data-topic-link], .pager a, .dd-link, a[href^="topics/"]');
        if (a) add(a.getAttribute('href'));
      }, { passive: true });
    },

    /* Page transitions: ONE small class swap gives a 200 ms cross-fade on
       every engine (the cross-document @view-transition opt-in was removed —
       see the note in input.css: traversal-abort console noise + one motion
       implementation for all browsers). The fade never intercepts modified
       clicks, new tabs, downloads, bare in-page anchors or foreign origins,
       and a bfcache restore clears it immediately, so back/forward keeps
       working untouched. */
    initPageTransitions() {
      const clear = () => document.documentElement.classList.remove('vt-leaving');
      window.addEventListener('pageshow', e => { if (e.persisted) clear(); });
      document.addEventListener('click', e => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.target || a.hasAttribute('download')) return;
        const raw = a.getAttribute('href') || '';
        if (!raw || raw.charAt(0) === '#') return;                    // anchors stay native
        let url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return;               // same page: let the browser handle it
        if (EMC.reducedMotion) return;                                // instant navigation
        e.preventDefault();
        document.documentElement.classList.add('vt-leaving');
        setTimeout(() => { location.assign(url.href); }, 200);
      });
    },

    /* Skeleton plates: every canvas wrapper ships a flat placeholder sized by
       the same height class as its canvas (zero layout shift). The plate fades
       out on the canvas's real Stage-ready event; a load-time failsafe means a
       plate can never outlive a slow or blocked script. */
    initPlates() {
      const retire = plate => {
        if (!plate || plate.classList.contains('gone')) return;
        plate.classList.add('gone');
        setTimeout(() => { plate.hidden = true; }, 400);
      };
      document.addEventListener('emc:stage-ready', e => {
        const wrap = e.target.closest && e.target.closest('.canvas-wrap');
        if (wrap) retire(wrap.querySelector('.sim-plate'));
      });
      /* Defer scripts execute before DOMContentLoaded, so above-the-fold
         Stages may already have painted before the listener above exists —
         sweep once for canvases whose Stage is registered. */
      const built = new Set((EMC.debugStages ? EMC.debugStages() : []).map(s => s.id));
      document.querySelectorAll('.canvas-wrap').forEach(wrap => {
        const c = wrap.querySelector('canvas');
        if (c && built.has(c.id)) retire(wrap.querySelector('.sim-plate'));
      });
      window.addEventListener('load', () => setTimeout(() => {
        document.querySelectorAll('.sim-plate:not(.keep)').forEach(retire);
      }, 1200));
    }
  };

  /* * scrollIntoView that cannot throw: it is missing in some embedded webviews * and in test environments, and smooth scrolling is never worth crashing for. */
  function scrollToEl(el, opts = { behavior: 'smooth', block: 'center' }) {
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView(opts); } catch (err) { /* ignore */ }
    }
  }

  /* Initialise a sim (or any heavy component) the first time its canvas comes
     near the viewport. Below-fold sims then cost nothing at boot: no Stage, no
     listeners, no backing-store work until the reader approaches. Falls back
     to immediate init wherever IntersectionObserver is missing (jsdom, old
     browsers), so behaviour degrades to today's eager model. */
  function whenNear(el, init, rootMargin) {
    if (!el) return;
    const panel = el.closest ? el.closest('.panel') : null;
    const run = () => { if (panel) panel.removeAttribute('data-sim-pending'); init(); };
    if (panel) panel.setAttribute('data-sim-pending', '');
    if (typeof IntersectionObserver !== 'function') { run(); return; }
    let done = false;
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting && !done) { done = true; io.disconnect(); run(); }
      }
    }, { rootMargin: rootMargin || '800px' });
    io.observe(el);
  }

  /* * Typeset every [data-tex] element with KaTeX (the project's LaTeX formatter). * Each element keeps hand-readable plain text as its content, so if the KaTeX * CDN is unreachable the equation still renders legibly — just un-typeset. */
  /* Below-fold typesetting runs in <=6 ms slices scheduled when the main
     thread is idle, so it can never block a running canvas animation (a single
     monolithic pass measured ~80 ms of jitter right after load). */
  let texQueue = null, texPumping = false;
  function katexifyRest() {
    if (!window.katex) return;
    texQueue = [...document.querySelectorAll('[data-tex]:not([data-tex-done])')];
    if (!texQueue.length) return;
    if (texPumping) return;
    texPumping = true;
    const slice = () => {
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      while (texQueue.length && ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) < 4) {
        const elm = texQueue.shift();
        if (elm.dataset.texDone) continue;
        try {
          window.katex.render(elm.dataset.tex, elm, { displayMode: elm.hasAttribute('data-display'), throwOnError: false });
          elm.dataset.texDone = '1';
        } catch (err) { elm.dataset.texDone = '1'; }
      }
      if (texQueue.length) {
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(slice, { timeout: 900 });
        else setTimeout(slice, 24);
      } else { texPumping = false; }
    };
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(slice, { timeout: 900 });
    else setTimeout(slice, 24);
  }

  function katexify(root, aboveFoldOnly) {
    if (!window.katex) return 0;
    let n = 0;
    (root || document).querySelectorAll('[data-tex]').forEach(elm => {
      if (elm.dataset.texDone) return;
      if (aboveFoldOnly && window.innerHeight) {
        // below-the-fold maths waits for idle time (see boot())
        if (elm.getBoundingClientRect().top > window.innerHeight * 1.25) return;
      }
      try {
        window.katex.render(elm.dataset.tex, elm, {
          displayMode: elm.hasAttribute('data-display'),
          throwOnError: false
        });
        elm.dataset.texDone = '1';
        n++;
      } catch (err) { /* keep the plain-text fallback */ }
    });
    return n;
  }

  /* * Optional: activate PRIVATELY licensed faces listed in vendor/fonts/manifest.json. * The site's own font (G8321 in 100/400/700, SIL OFL) is a committed * woff2 set declared in css/fonts.css - it renders on any host with no * runtime work. This hook exists for faces you may NOT redistribute: drop the * file into vendor/fonts/ (gitignored), list it in the manifest, and it gets * registered locally via the FontFace API - a missing file degrades with ZERO * console noise (a plain @font-face would log a 404 on every page load). */
  function loadLicensedFont() {
    // vendor/fonts/manifest.json (always committed, always 200) lists the
    // licensed faces present locally, so we never probe for files that
    // might not exist: no 404 noise on hosts without them.
    // Derive the site base from OUR OWN script tag (js/common*.js): unlike a
    // stylesheet href it survives any css naming/hashing scheme, and a missed
    // match can never send the manifest fetch to a wrong directory (404).
    const selfScript = document.querySelector('script[src*="js/common"]');
    const cssLink = document.querySelector('link[href*="css/site."][href$=".css"]') ||
                  document.querySelector('link[href*="css/fonts."][href$=".css"]');
    const base = selfScript ? selfScript.getAttribute('src').replace(/js\/[^/]+$/, '')
               : cssLink ? cssLink.getAttribute('href').replace(/css\/[^/]+$/, '') : '';
    const note = msg => console.info('[EMC] ' + msg);
    const mark = state => { document.documentElement.dataset.licensedFont = state; };
    if (typeof window.fetch !== 'function') {          // e.g. jsdom test harness
      mark('bundled');
      return;
    }
    fetch(base + 'vendor/fonts/manifest.json', { cache: 'default' })
      .then(r => (r.ok ? r.json() : { licensed: [] }))
      .then(man => {
        const cuts = (man && Array.isArray(man.licensed) ? man.licensed : [])
          .filter(c => c && typeof c.file === 'string');
        if (!cuts.length) {
          // normal state: the committed OFL faces ARE the site fonts
          mark('bundled');
          return;
        }
        if (typeof window.FontFace !== 'function') { mark('fallback'); return; }
        // the manifest may list alternates for one family+weight (subset woff2
        // first, full ttf second): register only the first entry that loads
        const claimed = new Set();
        cuts.forEach(c => {
          const url = base + 'vendor/fonts/' + c.file;
          const family = c.family || 'Licensed Face';
          const fmt = /\.woff2$/i.test(c.file) ? 'woff2'
                    : /\.woff$/i.test(c.file) ? 'woff'
                    : /\.otf$/i.test(c.file) ? 'opentype' : 'truetype';
          const face = new window.FontFace(family, `url(${url}) format('${fmt}')`,
            { weight: String(c.weight || 400), style: 'normal', display: 'swap' });
          face.load()
            .then(loaded => {
              const w = c.weight || 400;
              if (claimed.has(family + w)) return;      // an alternate won
              claimed.add(family + w);
              document.fonts.add(loaded);
              mark('active');
              note(`licensed font active: ${family} ${w} (${c.file})`);
            })
            .catch(() => note(`licensed cut not loadable (${c.file}) - keeping the bundled faces`));
        });
      })
      .catch(() => {
        mark('fallback');
        note('font manifest unreadable - keeping the bundled faces');
      });
  }

  /* Boot everything that is page-independent. */
  function boot() {
    UI.initNav();
    UI.initReveal();
    UI.initReadingBar();
    UI.initTopicButtons();
    UI.initStorageNotice();
    UI.initYear();
    UI.initDetailToggle();
    UI.initThemeToggle();
    UI.initAnalytics();
    UI.initPrefetch();
    UI.initPageTransitions();
    UI.initPlates();
    /* ---- loader (single lifecycle; see LOADER in §6c) ---------------------
       Applicable stages only: 'equations' exists solely on pages that carry
       [data-tex] markup; 'fonts' and 'ui' apply everywhere. Sims are NOT a
       boot stage — below-the-fold sims lazy-init through whenNear and must
       never gate the loader (§3.1.5). */
    const hasTex = !!document.querySelector('[data-tex]');
    LOADER.start(hasTex ? ['fonts', 'equations', 'ui'] : ['fonts', 'ui']);
    /* Real signal: the webfonts. Optional by contract — if the promise never
       settles, the watchdog still releases the page. */
    /* FLASH FIX: fonts are optional by contract, but this stage used to be
       the only one still pending at the 150 ms gate on a slow connection, so
       the overlay popped up OVER an already-painted page, then faded out
       (the flash on load). Give the webfonts 100 ms to settle; after that
       the page is usable (font-display: swap handles the rest) and the
       overlay is never built. signal() is idempotent. */
    const fontsDone = () => LOADER.signal('fonts');
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(fontsDone, fontsDone);
      setTimeout(fontsDone, 100);
    } else fontsDone();
    loadLicensedFont();
    /* Real signal: the above-the-fold equations. KaTeX missing is survivable
       (every [data-tex] carries hand-readable fallback text), so this signal
       fires after the pass regardless; the watchdog names KaTeX in its error
       card when a page needs it and it never arrived. */
    katexify(document, true);
    if (hasTex) LOADER.signal('equations');
    const idle = cb => (typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(cb, { timeout: 1500 })
      : setTimeout(cb, 400));
    window.addEventListener('load', () => idle(() => {
      katexifyRest();                 // below-the-fold maths: background work, never gates the loader
    }));
    // Let individual pages react to progress changes (home dashboard).
    document.dispatchEvent(new CustomEvent('emc:ready', { detail: Progress.read() }));
    /* Real signal: critical UI is bound (nav, Detail toggle, dashboard,
       plates). Fires last so the overlay can only close on a usable page. */
    LOADER.signal('ui');
  }

  /* ------------------------------------------------------------------------ 10. Public API ------------------------------------------------------------------------ */
  const api = {
    CONST, TOPICS, PROGRESS_KEY,
    clamp, lerp, dist, damp,
    eng, unit, fixed, setText, throttle,
    Stage, roundRect, arrow, label, chargeGlyph, scrollToEl, katexify, katexifyRest, loadLicensedFont, whenNear,
    typeScale: () => canvasTypeScale,
    stats() {
      let rafs = 0;
      STAGES.forEach(st => { rafs += (st._raf ? 1 : 0) + (st._drawRaf ? 1 : 0) + (st._pmRaf ? 1 : 0); });
      return { stages: STAGES.size, listeners: TRACKED, rafs };
    },
    /* Dev introspection (?debug & tests): per-stage lifecycle snapshot. */
    debugStages() {
      return [...STAGES].map(st => ({
        id: st.canvas ? st.canvas.id : '?',
        animate: st.animate, running: st._running, visible: st._visible,
        hidden: st._hidden, idle: st._idle, budgetPaused: st._budgetPaused,
        raf: !!st._raf, drawRaf: !!st._drawRaf, pmRaf: !!st._pmRaf, tracked: st._n
      }));
    },
    /* Shell helpers: one cleanup path stays with the Stage - the shell never
       reaches into a sim, it only asks stages inside a root to leave (or to
       re-measure once their section becomes visible again). */
    destroyStagesIn(root) {
      if (!root) return 0;
      let n = 0;
      [...STAGES].forEach(st => { if (root.contains(st.canvas)) { st.destroy(); n++; } });
      return n;
    },
    resizeStagesIn(root) {
      if (!root) return 0;
      let n = 0;
      STAGES.forEach(st => {
        if (root.contains(st.canvas) && st.resize()) { st.draw(); n++; }
      });
      refreshBudget();
      return n;
    },
    get reducedMotion() { return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); },
    get lowTier() { return LOW_TIER_DEVICE; },
    store, Progress, Prefs, PREFS_KEY,
    bindRange, bindSegment, bindToggles,
    loader: LOADER,
    UI, toast: UI.toast
  };

  /* Publish the API on window BEFORE boot() runs. `defer` scripts execute at
     readyState 'interactive', so the `else boot()` branch below fires
     synchronously inside this IIFE — before the outer `window.EMC = (…)`
     assignment has completed. Anything boot() reaches through the bare global
     `EMC` (initPlates reads EMC.debugStages) therefore saw `undefined` and
     threw a ReferenceError, which aborted boot() and left window.EMC unset for
     every later script on every page. Assigning here removes the ordering
     hazard at its source rather than guarding each individual read site. */
  window.EMC = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return api;
})();
