/* EMC Lab shared engine (window.EMC): physical constants, maths + SI-prefix formatting, HiDPI canvas Stage (rAF loop, resize, unified pointer input), drawing helpers, safe localStorage, progress tracking with JSON export/import, control binding, page UI (nav/reveal/toasts), KaTeX typesetting and licensed-font loading. */
'use strict';

window.EMC = (function () {

  /* ------------------------------------------------------------------------ 1. Physical constants (SI units, CODATA 2018 exact values where defined) ------------------------------------------------------------------------ */
  const CONST = {
    /* Elementary charge e [C] (exact) — used by the electricity sims to
       express a current as a charge-carrier rate. */
    E: 1.602176634e-19,
    /* Standard gravitational acceleration g [m/s^2] */
    G: 9.80665,
    /* Density of pure water at 4 degC [kg/m^3] */
    RHO_WATER: 1000,
    /* Density of dry air at sea level, 15 degC [kg/m^3] */
    RHO_AIR: 1.225,
    /* Specific heat capacity of liquid water [J/(kg K)] */
    C_WATER: 4186,
    /* Speed of sound in dry air at 20 degC [m/s] */
    V_SOUND: 343,
    /* Standard atmospheric pressure [Pa] */
    P_ATM: 101325,
    /* Absolute zero on the Celsius scale [degC] */
    T_ABS_ZERO: -273.15
  };

  /* ------------------------------------------------------------------------ 2. Math helpers ------------------------------------------------------------------------ */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const roundTo = (v, dp) => { const p = Math.pow(10, dp); return Math.round(v * p) / p; };
  /* Map a value from one range to another (used for canvas scaling). */
  const mapRange = (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1);
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

    // Rounding can push 999.6 up to 1000, so re-scale when that happens.
    let decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
    if (decimals > 4) return v.toExponential(Math.max(0, sig - 1));   // below femto
    if (Math.abs(Number(scaled.toFixed(decimals))) >= 1000) {
      scaled /= 1000; e += 3;
      const pre2 = PREFIX.find(p => p.e === e);
      if (!pre2) return v.toExponential(Math.max(0, sig - 1));
      decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
      return scaled.toFixed(decimals) + (pre2.s ? ' ' + pre2.s : '');
    }
    return scaled.toFixed(decimals) + (pre.s ? '\u00A0' + pre.s : '');
  }

  /* * eng() plus a unit, following the SI convention that there is no space * between a prefix and its unit: 399 mN, 54.0 mV, 3.00 A, 12.3 kΩ. */
  function unit(v, u, sig = 3) {
    const s = eng(v, sig);
    if (!u) return s;
    const parts = s.split(' ');
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
  class Stage {
    constructor(canvas, render, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.render = render;
      this.animate = !!opts.animate;
      /* prefers-reduced-motion: non-essential continuous motion starts as a
         static frame. Interactions still redraw on demand (invalidate), so
         every sim stays fully usable — only the autonomous motion stops. */
      this._prm = !!(typeof window !== 'undefined' && window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (this.animate && this._prm) this.animate = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.t = 0;                 // accumulated time in seconds (animation)
      this.pointer = { x: 0, y: 0, down: false, inside: false };
      this._raf = 0; this._last = 0; this._visible = true; this._running = false;
      this._drawRaf = 0; this._pmRaf = 0; this._pm = null;
      this._lastRender = 0;
      this._fpsCap = LOW_TIER_DEVICE ? 30 : 0;      // 0 = uncapped
      this._hidden = typeof document !== 'undefined' && document.hidden === true;
      this._idle = false;           // set by sims whose scene has visually settled

      this.resize();
      this._observeResize();
      this._observeDPR();
      this._observeVisibility();
      this._observePageVisibility();
      if (this.animate) this.start(); else this.draw();
    }

    /* Re-read the CSS size and scale the backing store for crisp rendering. */
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
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
      } else {                                    // graceful fallback
        window.addEventListener('resize', () => { this.resize(); this.draw(); });
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
      }, { threshold: 0.01 });
      this._io.observe(this.canvas);
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
        const onchange = () => { this.resize(); this.draw(); mq.removeEventListener('change', onchange); arm(); };
        this._dq = mq; this._dqHandler = onchange;
        mq.addEventListener('change', onchange);
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
      };
      document.addEventListener('visibilitychange', this._onVis);
    }

    /* Full teardown: stop the chain and release observers/listeners. Pages
       keep stages for their lifetime, but repeated objects (quiz charts,
       future dynamic sims) can release everything through one call. */
    destroy() {
      this.stop();
      if (this._drawRaf) cancelAnimationFrame(this._drawRaf);
      if (this._pmRaf) cancelAnimationFrame(this._pmRaf);
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      if (this._dq && this._dqHandler) this._dq.removeEventListener('change', this._dqHandler);
      if (this._onVis && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._onVis);
    }

    draw() { if (this.w && this.h) this.render(this.ctx, this.w, this.h, this); }

    /* Sims whose scene has visually settled (spring at rest, diffusion at
       steady state, tone stopped) call setIdle(true) to stop the chain; any
       interaction calls setIdle(false) or invalidate() to wake it. Physics
       outputs are unchanged — this only stops redrawing an unchanged scene. */
    setIdle(v) {
      v = !!v;
      if (this._idle === v) return;
      this._idle = v;
      if (!v && this._running && this._visible && !this._hidden) { this._last = 0; this._tick(); }
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
      if (this._running) return;
      this._running = true; this._last = 0;
      this._tick();
    }
    stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; }

    _tick() {
      if (!this._running || this._raf) return;   // a frame is already scheduled: never spawn a second chain
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
      this.canvas.addEventListener('pointerdown', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: true, inside: true };
        // Own the gesture only once a drag actually starts on this canvas, so
        // a touch that begins here can still scroll the page (pan-y) until
        // then. Released on pointerup/pointercancel.
        this.canvas.classList.add('dragging');
        // Keep receiving move events even if the pointer leaves the canvas.
        if (this.canvas.setPointerCapture) { try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {} }
        handler({ ...p, down: true, type: 'down', e });
        e.preventDefault();
      });
      this.canvas.addEventListener('pointermove', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: this.pointer.down, inside: true };
        // Coalesce: a 120 Hz mouse or a fast finger must not trigger more than
        // one handler run (and therefore one redraw) per animation frame.
        this._pm = { ...p, down: this.pointer.down, type: 'move', e };
        if (!this._pmRaf) {
          this._pmRaf = requestAnimationFrame(() => {
            this._pmRaf = 0;
            if (this._pm) { const q = this._pm; this._pm = null; handler(q); }
          });
        }
      });
      const flushMove = () => {
        if (this._pmRaf) { cancelAnimationFrame(this._pmRaf); this._pmRaf = 0; }
        if (this._pm) { const q = this._pm; this._pm = null; handler(q); }
      };
      const up = e => {
        flushMove();                       // never drop the last position
        const p = toLocal(e);
        this.pointer.down = false;
        this.canvas.classList.remove('dragging');
        handler({ ...p, down: false, type: 'up', e });
      };
      this.canvas.addEventListener('pointerup', up);
      this.canvas.addEventListener('pointercancel', up);
      this.canvas.addEventListener('pointerleave', () => {
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

  /* label() is called dozens of times per frame; parsing the font shorthand is
     wasted work when 99% of calls reuse a (weight,size) pair. */
  const FONT_CACHE = new Map();
  const fontFor = (weight, size) => {
    const k = weight + '|' + size;
    let f = FONT_CACHE.get(k);
    if (!f) FONT_CACHE.set(k, f = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`);
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

  /* ------------------------------------------------------------------------ 7. Progress tracking ------------------------------------------------------------------------ */
  const TOPICS = ['vectors', 'fluids', 'heat', 'waves', 'current'];
  const PROGRESS_KEY = 'emc.progress.v1';

  const Progress = {
    /* @returns {{topics:Object<string,boolean>,quizBest:number,quizAttempts:number,quizLast:number,updatedAt:string}} */
    read() {
      const blank = {
        topics: { vectors: false, fluids: false, heat: false, waves: false, current: false },
        quizBest: 0, quizAttempts: 0, quizLast: 0,
        quizHistory: [],          // [{ pct, at }] — newest last, capped at 20
        updatedAt: null
      };
      const raw = store.get(PROGRESS_KEY);
      if (!raw) return blank;
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
      // studied all five topics
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
      const src = (raw && raw.progress) ? raw.progress : raw;
      if (!src || typeof src !== 'object') return { ok: false, message: 'No progress data found in that file.' };
      if (raw && raw.app && raw.app !== 'emc-lab') {
        return { ok: false, message: 'That file was not exported by EMC Lab.' };
      }

      const num = (v, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0; };
      const p = {
        topics: { vectors: false, fluids: false, heat: false, waves: false, current: false },
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
        message: `Imported: ${done} of ${TOPICS.length} topics` +
                 (p.quizAttempts ? `, best score ${p.quizBest}%` : '')
      };
    },
    reset() { store.remove(PROGRESS_KEY); return this.read(); }
  };

  /* ------------------------------------------------------------------------ 8. Control binding helper (slider <-> readout <-> state) ------------------------------------------------------------------------ */
  /* * Wire an <input type="range"> to a display element and a callback. * @param {string|HTMLInputElement} el slider (or its id) * @param {string|HTMLElement} out element that shows the value (or id) * @param {(value:number)=>void} onChange * @param {(value:number)=>string} [format] formatter for the readout */
  function bindRange(el, out, onChange, format) {
    const input = typeof el === 'string' ? document.getElementById(el) : el;
    const target = typeof out === 'string' ? document.getElementById(out) : out;
    if (!input) return null;
    const fmt = format || (v => String(v));
    const apply = () => {
      const v = parseFloat(input.value);
      if (target) target.textContent = fmt(v);
      if (onChange) onChange(v);
    };
    input.addEventListener('input', apply);
    apply();
    return { input, set(v) { input.value = String(v); apply(); }, get: () => parseFloat(input.value) };
  }

  /* Radio-style segmented control: buttons inside a container with data-value. */
  function bindSegment(container, onChange) {
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) return null;
    const btns = Array.from(root.querySelectorAll('.seg-btn'));
    const select = (btn) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (onChange) onChange(btn.dataset.value, btn);
    };
    btns.forEach(b => {
      b.addEventListener('click', () => select(b));
      if (b.getAttribute('aria-pressed') === 'true') { /* keep initial */ }
    });
    return {
      get: () => (btns.find(b => b.getAttribute('aria-pressed') === 'true') || {}).dataset?.value,
      set: (v) => { const b = btns.find(x => x.dataset.value === v); if (b) select(b); },
      buttons: btns
    };
  }

  /* Toggle button group (aria-pressed) */
  function bindToggles(rootSel, onChange) {
    const root = typeof rootSel === 'string' ? document.getElementById(rootSel) : rootSel;
    if (!root) return;
    root.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
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
      // Topics dropdown: click to toggle, close on outside click / Escape / pick
      const dropBtn = document.getElementById('topicsBtn');
      const dropMenu = document.getElementById('topicsMenu');
      if (dropBtn && dropMenu) {
        const setOpen = open => {
          dropBtn.setAttribute('aria-expanded', String(open));
          dropMenu.classList.toggle('open', open);
        };
        dropBtn.addEventListener('click', e => { e.stopPropagation(); setOpen(!dropMenu.classList.contains('open')); });
        document.addEventListener('click', e => { if (!e.target.closest('.nav-drop')) setOpen(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
        dropMenu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      }
      // Highlight the link for the current page (incl. dropdown entries).
      const here = location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-link, .dd-link').forEach(a => {
        const target = (a.getAttribute('href') || '').split('/').pop();
        if (target === here) {
          a.classList.add('active'); a.setAttribute('aria-current', 'page');
          if (a.classList.contains('dd-link') && dropBtn) dropBtn.classList.add('active');
        }
      });
    },

    initReveal() {
      const items = document.querySelectorAll('.reveal');
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

    /* The mascot's bob is an infinite compositor animation on every page;
       pause it while the mascot is out of view so offscreen pages/sections
       keep zero animation work. */
    initMascotPause() {
      const mascots = document.querySelectorAll('.mascot, .mascot-sm');
      if (!mascots.length || typeof IntersectionObserver !== 'function') return;
      const io = new IntersectionObserver(entries => {
        for (const en of entries) en.target.classList.toggle('offscreen', !en.isIntersecting);
      }, { threshold: 0 });
      mascots.forEach(m => io.observe(m));
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
            ? '<svg class="mascot-cheer" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M20 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M34 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M27 37 q3 3 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/></svg> Topic completed!'
            : 'Mark topic as complete';
          btn.setAttribute('aria-pressed', String(done));
        };
        topicSyncs.push(sync);
        btn.addEventListener('click', () => {
          const nowDone = !Progress.isTopicDone(id);
          Progress.markTopic(id, nowDone);
          sync();
          document.dispatchEvent(new CustomEvent('emc:progress', { detail: Progress.read() }));
          UI.toast(nowDone ? 'Progress saved \u2014 topic marked complete' : 'Topic marked as not complete');
        });
        sync();
      });
    },

    /* Re-render every topic button from storage. Called after a Reset or an
       Import, so the buttons (cheering mascot included) always tell the truth
       without duplicating the markup rules from initTopicButtons(). */
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

    initYear() {
      document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
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
    if (typeof IntersectionObserver !== 'function') { init(); return; }
    let done = false;
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting && !done) { done = true; io.disconnect(); init(); }
      }
    }, { rootMargin: rootMargin || '800px' });
    io.observe(el);
  }

  /* * Typeset every [data-tex] element with KaTeX (the project's LaTeX formatter). * Each element keeps hand-readable plain text as its content, so if the KaTeX * CDN is unreachable the equation still renders legibly — just un-typeset. */
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
    UI.initMascotPause();
    UI.initReadingBar();
    UI.initTopicButtons();
    UI.initStorageNotice();
    UI.initYear();
    loadLicensedFont();
    // Typeset what the reader can see right now; the rest waits for idle time
    // so boot never pays for equations below the fold.
    katexify(document, true);
    const idle = cb => (typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(cb, { timeout: 1500 })
      : setTimeout(cb, 400));
    // KaTeX loads with `defer`, i.e. after this boot runs: typeset the
    // remainder once the whole page (including deferred scripts) has loaded.
    window.addEventListener('load', () => idle(() => katexify(document)));
    // Let individual pages react to progress changes (home dashboard).
    document.dispatchEvent(new CustomEvent('emc:ready', { detail: Progress.read() }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ------------------------------------------------------------------------ 10. Public API ------------------------------------------------------------------------ */
  return {
    CONST, TOPICS, PROGRESS_KEY,
    clamp, lerp, dist, roundTo, mapRange, damp,
    eng, unit, fixed, setText, throttle,
    Stage, roundRect, arrow, label, scrollToEl, katexify, loadLicensedFont, whenNear,
    get reducedMotion() { return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); },
    get lowTier() { return LOW_TIER_DEVICE; },
    store, Progress,
    bindRange, bindSegment, bindToggles,
    UI, toast: UI.toast
  };
})();
