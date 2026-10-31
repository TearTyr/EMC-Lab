/* EMC Lab intro controller + engine (MAD / "Override"-style kinetic lettering).
   Lifecycle contract: the intro plays on EVERY full load or refresh of the
   bare landing page (no seen-flag of any kind: no sessionStorage, no
   localStorage, no in-memory flag). It never runs on chapter hash routes or
   other pages, is cancelled by a fatal boot, and waits for the loader's single
   completion event. Only the Skip button, the Start button or Escape end it
   early; clicks and keys elsewhere do nothing. While it plays the rest of the
   page is `inert` (no click-through, no focus behind the overlay); the page is
   handed back the moment playback ends or is skipped, and the overlay is then
   removed with zero timers/listeners left.
   The engine half (a port of the hand-tuned test/emc-intro-final.html): one rAF
   timeline that only SCHEDULES. Scene A is the shape-face countdown (ears, eyes,
   3-2-1-GO on the 99 BPM grid, BEAT 0.604 s measured from the reference track).
   Scene B is the title card: the mascot changes expression on every beat while
   six phrases (charge, Coulomb, field, Circuit Builder, Ohm's Law) fly in word by
   word with eleven entrance moves, smear trails and landing sparks, under a slow
   camera dolly; then the title, chips and Start, a crouch and jump, and the
   overlay lifts away.
   Reduced motion draws the static end frame; faces are fetched only when playback
   actually starts; ?t=<s> freezes a frame for tuning (dev).
   PERFORMANCE: only the phrase on screen is in the render tree (the others are
   display:none), words are laid out once and then only transformed on their own
   layers, trails exist only while a word is travelling, the rings are one small
   canvas at 30 fps, the charges loop on the compositor, the overlay lifts by
   transform, every style write goes through a per-element cache, nothing queries
   or measures the DOM in the frame loop, and the engine closure is dropped with
   the overlay. Low-tier devices and sustained slow frames switch to a lite mode
   (no trails or sparks, text on twos, rings at 15 fps). */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;
  const q = sel => overlay.querySelector(sel);

  const REDUCED_MOTION_MS = 1200;
  const EXIT_BUFFER_MS = 700;      // .done fade (.5 s) + slack
  const SAFETY_MS = 24000;         // far past the longest timeline: only fires if the clock dies

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

  /* The intro owns the screen: `inert` makes everything else unclickable AND
     unfocusable (Tab can't wander behind the overlay). We only un-inert what we
     inerted, so a page that marks its own nodes inert is left alone. */
  let inertedNodes = [];
  function lockPage() {
    for (const node of document.body.children) {
      if (node === overlay || node.inert) continue;
      node.inert = true;
      inertedNodes.push(node);
    }
  }
  function unlockPage() {
    for (const node of inertedNodes) node.inert = false;
    inertedNodes = [];
  }

  /* ---------------------------------------------------------------- engine */
  const BEAT0 = 2.608, BEAT = .604;     /* ~99.4 BPM, measured from the reference audio */
  const IMG = { sp: 'img/mascot-face-sparkle.png', fo: 'img/mascot-face-focus.png', hp: 'img/mascot-face-happy.png' };
  const go = q('#go');
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, d) => clamp((t - a) / d);
  const back = x => { const c = 1.8, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
  const pop = (t, a, d = .35) => t < a ? 0 : back(seg(t, a, d));

  /* per-element style cache: write only when the value actually changed */
  function S(el, k, v) {
    const c = el._c || (el._c = {});
    if (c[k] !== v) { c[k] = v; el.style[k] = v; }
  }
  function put(el, s = 1, x = 0, y = 0, r = 0, o) {
    S(el, 'transform', `translate(-50%,-50%) translate(${x.toFixed(2)}cqw,${y.toFixed(2)}cqw) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`);
    S(el, 'opacity', String(o == null ? (s > 0.01 ? 1 : 0) : +(+o).toFixed(3)));
  }
  function flag(el, name, on) {
    const k = '_' + name;
    if (el[k] !== on) { el[k] = on; el.classList.toggle(name, on); }
  }
  const bz = (a, b, c, d) => {
    const f = (t, p, q_) => 3 * (1 - t) * (1 - t) * t * p + 3 * (1 - t) * t * t * q_ + t * t * t;
    return x => {
      x = clamp(x); let t = x;
      for (let i = 0; i < 8; i++) {
        const dx = f(t, a, c) - x, ds = 3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (c - a) + 3 * t * t * (1 - c);
        if (Math.abs(ds) < 1e-5) break;
        t -= dx / ds;
      }
      return f(clamp(t), b, d);
    };
  };
  const ez = bz(.3, .6, .15, 1), wh = bz(.2, .9, .2, 1.12), drift = bz(.4, 0, .2, 1), wipeE = bz(.5, 0, .2, 1);
  const bq = (a, c, e, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * c + k * k * e;
  const bo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 2.5) * Math.cos(x * Math.PI * 1.5); };   /* one soft settle instead of a hard bounce */

  /* The engine lives in one closure so that everything it holds (nodes, phrase
     tables, images) is released as soon as the overlay is removed. */
  function makeEngine() {
    const A = q('#A'), B = q('#B'), mk = q('#mk'), ttl = q('#ttl');
    const stg = q('#st'), sw = q('#sw'), kwHost = q('#kw'), subEl = q('#sub'), rg = q('#rg');
    const bgC = q('#bg'), bgX = bgC.getContext ? bgC.getContext('2d') : null;
    const AP = { t1: [29, 47], t2: [71, 47], d1: [40, 47], d2: [60, 47], e1: [36, 32], e2: [64, 32], dg: [50, 56] };
    const sh = {};
    for (const id in AP) sh[id] = q('#' + id);
    const faces = ['sp', 'fo', 'hp'].map(id => q('#' + id));
    const letters = [..."EMC Lab"].map(c => {
      const e = document.createElement('span');
      e.textContent = c === ' ' ? ' ' : c;
      ttl.appendChild(e);
      return e;
    });
    const chips = [...overlay.querySelectorAll('.chip')];
    const els = [...overlay.querySelectorAll('.el')];

    /* ---- the phrases (content from the PHYSICS 2 LEC01 slides + the two tools) ----
       Each group is a phrase window; each line [xf, gf = where it sits on screen, r = tilt,
       s = size in cqw] holds tokens [html, start (s), entrance move, strength]. Tokens are
       laid out once by fit() and only toggled/moved afterwards. */
    const FB = '<i class="fb"></i>', AR = '<svg class="ar" viewBox="0 0 52 26" aria-hidden="true"><path class="s3" d="M5 13H45M34 3l11 10-11 10"/><path class="s2" d="M5 13H45M34 3l11 10-11 10"/><path class="s1" d="M5 13H45M34 3l11 10-11 10"/></svg>';
    const G = [
      { cam: [-2, -1, -1.2, 1.04], dr: [-1, 2, -1], L: [
        { xf: .3, gf: .3, r: -6, s: 34, toks: [['e', 0, 'slam', 0], ['=', .151, 'whip', .5]] },
        { xf: .55, gf: .72, r: 4, s: 24, toks: [['-1.602x10<sup>-19</sup>', .453, 'rise', .5], ['C', .604, 'drop', .5]] }] },
      { cam: [2.5, 1, 1, 1.02], dr: [-1, -1, -1], L: [
        { xf: .3, gf: .3, r: -5, s: 26, toks: [['LIKE', 0, 'spin', .55], ['REPEL', .302, 'flip', .5]] },
        { xf: .7, gf: .72, r: 5, s: 26, toks: [['UNLIKE', .604, 'wipe', .5], ['ATTRACT', .906, 'slice', .55]] }] },
      { cam: [-1.5, -1.5, -1.2, 1.05], dr: [0, 2, 1], L: [
        { xf: .22, gf: .5, r: -4, s: 20, toks: [['F', 0, 'pop', .5], ['=', .151, 'arc', .5], ['k', .302, 'elastic', .5]] },
        { xf: .7, gf: .5, r: 2, s: 18, v: 1, gp: .02, toks: [['|q<sub>1</sub>||q<sub>2</sub>|', .453, 'drop', .5], [FB, .604, 'wipe', .4], ['r<sup>2</sup>', .755, 'rise', .5]] }] },
      { cam: [-2.5, -.8, -1, 1.045], dr: [0, 2, 0], L: [
        { xf: .2, gf: .5, r: -4, s: 26, toks: [['E', 0, 'slam', 0], ['=', .151, 'arc', .5]] },
        { xf: .55, gf: .5, r: 2, s: 22, v: 1, gp: .02, toks: [['F', .302, 'elastic', .5], [FB, .453, 'wipe', .4], ['|q<sub>0</sub>|', .604, 'spin', .55]] },
        { xf: .88, gf: .5, r: -3, s: 16, toks: [['N/C', .906, 'rise', .5]] }] },
      { cam: [0, -1, .8, 1.05], dr: [0, 1, 1], L: [
        { xf: .5, gf: .3, r: -4, s: 22, toks: [['CIRCUIT', 0, 'wipe', .5], ['BUILDER', .151, 'elastic', .5]] },
        { xf: .5, gf: .64, r: 3, s: 15, toks: [['DRAG', .453, 'rise', .5], ['&', .604, 'spin', .5], ['DROP', .755, 'whip', .5]] }] },
      { cam: [-1.5, .8, -.8, 1.05], dr: [0, 1, -1], L: [
        { xf: .5, gf: .2, r: -3, s: 26, toks: [["OHM'S", 0, 'drop', .5], ['LAW', .151, 'flip', .5]] },
        { xf: .5, gf: .46, r: 3, s: 26, toks: [['CALCULATOR', .453, 'slice', .55]] },
        { xf: .5, gf: .78, r: -3, s: 15, toks: [['CHANGE R, V', .906, 'arc', .5], [AR, 1.057, 'elastic', .5], ['SEE I', 1.208, 'pop', .45]] }] }
    ];

    const HOLD = .35, EXIT = .28, LAND = .42, Q16 = BEAT / 4, G0 = .5 + 2.712;   /* G0: beat grid measured from the reference audio */
    const sn = a => G0 + Math.round((a - G0) / Q16) * Q16;                       /* word landings snap to the beat grid */
    let cur = BEAT0;
    const kws = [], LN = [];
    for (const g of G) {
      g.t0 = cur; g.k = []; g.on = false; let last = 0;
      g.c = document.createElement('div'); g.c.className = 'kg';
      kwHost.appendChild(g.c);
      for (const L of g.L) {
        L.g = g; L.k = []; LN.push(L);
        for (const [html, tm, m, d] of L.toks) {
          const t0 = sn(g.t0 + tm);
          last = Math.max(last, t0 + LAND);
          /* e = the word, a/b = its two smear trails; a sliced word uses a as its second half */
          const mkEl = () => { const e = document.createElement('div'); e.className = 'a kw'; e.style.left = '50%'; e.style.top = '50%'; e.innerHTML = html; g.c.appendChild(e); return e; };
          const e = mkEl(), a = mkEl(), b = m === 'slice' ? null : mkEl();
          e.classList.add('m'); a.setAttribute('aria-hidden', 'true'); if (b) b.setAttribute('aria-hidden', 'true');
          const o = { e, a, b, g, L, t0, x: 0, y: 0, r: L.r, k: kws.length, m, d, S: [0, 0], C: [0, 0], sz: L.s, w: 0, h: 0, u: 0 };
          L.k.push(o); g.k.push(o); kws.push(o);
        }
      }
      g.ex = last + HOLD;
      g.t1 = g.ex + EXIT + .18;
      cur = sn(g.t1 - .34);
    }
    const TT = cur;                 /* the title slams in once the last phrase has eased out */
    const TE = TT + 2.4;            /* crouch + jump (Start stays readable and still for over a second) */
    const LIFT = TE + .2, END = TE + 1.05;
    /* camera keyframes: a slow dolly/pan/roll that never stops */
    const CAMK = [{ t: BEAT0, c: [0, 0, 0, 1] }, ...G.map(g => ({ t: (g.t0 + g.ex) / 2, c: g.cam })), { t: TT + .9, c: [0, 0, 0, 1] }];

    /* little sparks burst off every landing (36 shared squares) */
    const pt = Array.from({ length: 36 }, (_, i) => {
      const e = document.createElement('i');
      e.className = 'a spk'; e.style.cssText = 'left:50%;top:50%;background:' + (i % 2 ? '#fff' : '#e8507a');
      stg.appendChild(e);
      return e;
    });
    /* drifting + and - charges loop on the compositor (css), nothing per frame */
    for (let i = 0; i < 10; i++) {
      const e = document.createElement('b');
      e.className = 'pt';
      e.textContent = i % 2 ? '+' : '-';
      e.style.cssText = `left:${(i * 37 + 11) % 97 + 1}%;color:${['#f8aebe', '#a8d3e0', '#b5d777'][i % 3]};font-size:${2.4 + (i % 4) * .7}vmin;--dur:${9 + (i % 5) * 2}s;--dl:-${(i * 1.9).toFixed(1)}s`;
      q('#px').appendChild(e);
    }

    /* entrances: eleven distinct moves, tuned soft (small overshoot, no rattling bounce) */
    function raw(o, t) {
      const u = t - o.t0;
      if (u < 0) return null;
      const m = o.m, pd = m === 'pop' ? .12 : 0, tt = clamp((u - pd) / (o.d * 1.25 || 1)), k = ez(tt), sg = o.x < 0 ? -1 : 1;
      let x = o.x, y = o.y, sc = 1, rot = o.r, sx = 1, cl = '';
      if (m === 'slam') { const z = 1 - Math.pow(1 - clamp(u / .28), 3); sc = 1 + 1.8 * (1 - z); rot = o.r + sg * 12 * (1 - z); }
      else if (m === 'drop') { y = o.S[1] + (o.y - o.S[1]) * bo(tt); rot = o.r + sg * 8 * (1 - k); }
      else if (m === 'whip') { x = o.S[0] + (o.x - o.S[0]) * wh(tt); rot = o.r + sg * 6 * (1 - k); }
      else if (m === 'wipe') { x = o.S[0] + (o.x - o.S[0]) * k; y = o.y + 2 * (1 - k); cl = `inset(-30% ${((1 - k) * 125 - 15).toFixed(1)}% -30% -15%)`; }
      else if (m === 'elastic') { sc = 1 - Math.exp(-7 * tt) * Math.cos(tt * 10); rot = o.r + sg * 18 * (1 - k); }
      else if (m === 'spin') { x = bq(o.S[0], o.C[0], o.x, k); y = bq(o.S[1], o.C[1], o.y, k); sc = .15 + .85 * k; rot = o.r + sg * 360 * (1 - k); }
      else if (m === 'flip') { x = bq(o.S[0], o.C[0], o.x, k); sx = Math.abs(Math.cos((1 - k) * Math.PI)); rot = o.r + sg * 8 * (1 - k); }
      else { x = bq(o.S[0], o.C[0], o.x, k); y = bq(o.S[1], o.C[1], o.y, k); sc = m === 'pop' ? (u < pd ? 1.3 * pop(u, 0, pd) : 1.3 - .3 * k) : 1 + .25 * (1 - k); rot = o.r + sg * 20 * (1 - k); }
      return [x, y, sc, rot, sx, cl];
    }

    /* ---- layout: measured once per run/resize, never in the frame loop ---- */
    let Wc = 100, Hs = 100, HSC = 100;
    function lay(L) {
      const ks = L.k, gp = ks[0].sz * (L.gp != null ? L.gp : L.v ? .1 : .26);
      let tot = 0, mh = 0;
      ks.forEach(o => { tot += L.v ? o.h : o.w; mh = Math.max(mh, L.v ? o.w : o.h); });
      tot += gp * (ks.length - 1);
      let c = -tot / 2;
      ks.forEach(o => { const sp = L.v ? o.h : o.w; o.u = c + sp / 2; c += sp + gp; });
      const a = Math.abs(L.r) * Math.PI / 180, w = L.v ? mh : tot, h = L.v ? tot : mh;
      L.ew = w * Math.cos(a) + h * Math.sin(a); L.eh = w * Math.sin(a) + h * Math.cos(a);
    }
    function shr(L, f) {
      L.k.forEach(o => { o.sz *= f; o.w *= f; o.h *= f; for (const n of [o.e, o.a, o.b]) if (n) n.style.setProperty('--s', o.sz + 'cqw'); });
      lay(L);
    }
    const c2 = (x, a, b) => Math.max(a, Math.min(b, x));
    function fit() {
      kwHost.classList.add('meas');                       /* groups are display:none until their turn; show them for the measuring */
      const W = stg.offsetWidth / 100 || 1;
      Hs = (stg.offsetHeight / W) || 100; HSC = Hs;
      Wc = Math.max(100, (innerWidth || stg.offsetWidth) / (stg.offsetWidth || 1) * 100);
      const bs = 1 + Math.min(.35, (Wc - 100) / 220);     /* text may use the full width of a wide screen */
      LN.forEach(L => {
        L.k.forEach(o => {
          o.sz = L.s * bs;
          for (const n of [o.e, o.a, o.b]) if (n) n.style.setProperty('--s', o.sz + 'cqw');
          o.w = o.e.offsetWidth / W; o.h = o.e.offsetHeight / W;
        });
        lay(L);
        const f = Math.min(1, (Wc - 20) / L.ew, (Hs - 18) / L.eh);
        if (f < 1) shr(L, f);
        const mx = Math.max(0, Wc / 2 - 10 - L.ew / 2), my = Math.max(0, Hs / 2 - 9 - L.eh / 2);
        L.x = c2((L.xf - .5) * Wc, -mx, mx); L.y = c2((L.gf - .5) * Hs * .9, -my, my);
      });
      kwHost.classList.remove('meas');
      G.forEach(g => {
        const ls = g.L;
        for (let pass = 0; pass < 8; pass++) {            /* keep lines in a group clear of each other; if still crowded shrink a little */
          for (let it = 0; it < 16; it++) {
            let mv = false;
            for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
              const a = ls[i], b = ls[j], dx = b.x - a.x, dy = b.y - a.y, ox = (a.ew + b.ew) / 2 + 4 - Math.abs(dx), oy = (a.eh + b.eh) / 2 + 4 - Math.abs(dy);
              if (ox > 0 && oy > 0) {
                mv = true;
                if (oy < ox) { const s = dy < 0 ? -1 : 1; a.y -= s * oy / 2; b.y += s * oy / 2; }
                else { const s = dx < 0 ? -1 : 1; a.x -= s * ox / 2; b.x += s * ox / 2; }
              }
            }
            ls.forEach(L => {
              const mx = Math.max(0, Wc / 2 - 10 - L.ew / 2), my = Math.max(0, Hs / 2 - 9 - L.eh / 2);
              L.x = c2(L.x, -mx, mx); L.y = c2(L.y, -my, my);
            });
            if (!mv) break;
          }
          let cr = false;
          for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++)
            if ((ls[i].ew + ls[j].ew) / 2 + 4 > Math.abs(ls[i].x - ls[j].x) && (ls[i].eh + ls[j].eh) / 2 + 4 > Math.abs(ls[i].y - ls[j].y)) cr = true;
          if (!cr) break;
          ls.forEach(L => shr(L, .92));
        }
      });
      LN.forEach(L => {
        const a = L.r * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        L.k.forEach(o => {
          o.x = L.x + (L.v ? -o.u * sa : o.u * ca); o.y = L.y + (L.v ? o.u * ca : o.u * sa);
          const sg = o.x < 0 ? -1 : 1, Hh = Hs / 2, m = o.m;
          if (m === 'rise') { o.S = [o.x * .5, Hh + 16]; o.C = [(o.S[0] + o.x) / 2 - sg * 26, (o.S[1] + o.y) / 2]; }
          else if (m === 'arc') { o.S = [sg * (Wc / 2 + 8), -Hh - 14]; o.C = [(o.S[0] + o.x) / 2 - sg * 22, (o.S[1] + o.y) / 2 + 8]; }
          else if (m === 'drop') o.S = [o.x, -Hh - 14];
          else if (m === 'whip') o.S = [sg * (Wc / 2 + 22), o.y];
          else if (m === 'wipe') o.S = [o.x - 30, o.y];
          else if (m === 'flip') { o.S = [sg * (Wc / 2 + 2), o.y]; o.C = [(o.S[0] + o.x) / 2, o.y - 8]; }
          else o.S = [0, 0], o.C = [o.x / 2, o.y / 2 - 10];
        });
      });
      /* one small shared background canvas, scaled up by css */
      bgC.width = Math.min(640, innerWidth);
      bgC.height = Math.round(bgC.width * innerHeight / innerWidth);
      bgStep = -1;
      if (lastT >= 0) frame(lastT);                        /* resizing a canvas clears it; positions changed too */
    }

    /* Expanding concentric rings, drawn into one small canvas at 30 fps. A
       full-screen css ring pattern repainted every frame dropped Firefox to single digits. */
    let bgStep = -1, lastT = -1;
    function drawBg(t) {
      if (!bgX) return;
      const k = Math.floor(t * (liteMode ? 15 : 30));
      if (k === bgStep) return;
      bgStep = k;
      const w = bgC.width, h = bgC.height, vm = Math.min(w, h) / 100;
      const cx = w * (.5 + .02 * Math.sin(t * 1.3)), cy = h * (.42 + .02 * Math.cos(t * 1.1));
      const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) / vm, po = (t * 6) % 8;
      bgX.clearRect(0, 0, w, h);
      bgX.strokeStyle = 'rgba(255,255,255,.42)';
      bgX.lineWidth = 2.6 * vm;
      bgX.beginPath();
      for (let r = po - 8; r < R; r += 8) {                 /* a white band [r, r + 2.6) every 8 vmin, moving outward */
        const rm = (r + 1.3) * vm;
        if (rm <= 0) continue;
        bgX.moveTo(cx + rm, cy);
        bgX.arc(cx, cy, rm, 0, 6.2832);
      }
      bgX.stroke();
    }

    /* --mk in cqw units, read once per run/resize (not per frame) */
    let mkw = 34;
    const readMkw = () => {
      const v = parseFloat(getComputedStyle(stg).getPropertyValue('--mk'));
      if (v) mkw = v;
    };

    function setLite() {
      if (liteMode) return;
      liteMode = true;
      overlay.classList.add('lite');
    }

    const TR = [[0, 1], [.03, .4], [.06, .2]];             /* [delay, opacity] of the word and its two smear trails */
    function drawTok(o, t, tt, dp) {
      const g = o.g;
      if (tt < o.t0) { S(o.e, 'opacity', '0'); S(o.a, 'opacity', '0'); if (o.b) S(o.b, 'opacity', '0'); return; }
      /* held, then a smooth ease-out */
      const eu = seg(tt, g.ex + (o.k % 6) * .03, EXIT), ee = 1 - Math.pow(1 - eu, 3), sgn = o.x < 0 ? -1 : 1;
      const exx = sgn * 16 * ee, exy = -13 * ee, exs = 1 - .14 * ee, exa = 1 - ee;
      if (o.m === 'slice') {                               /* two halves slide together, then it is ONE whole word */
        const k = ez(clamp((tt - o.t0) / (o.d * 1.25))), off = 1 - k, ld = off < .015;
        S(o.e, 'clipPath', ld ? 'none' : 'polygon(-15% -30%,115% -30%,115% 42%,-15% 62%)');
        S(o.a, 'clipPath', 'polygon(-15% 66%,115% 46%,115% 130%,-15% 130%)');
        const hv = [[o.e, -70, -26, 1], [o.a, 70, 26, ld ? 0 : 1]];
        for (const [el, dx, dy, vis] of hv) {
          S(el, 'transform', `translate(-50%,-50%) translate(${(o.x + dx * off + g.dr[0] * dp + exx).toFixed(2)}cqw,${(o.y + dy * off + g.dr[1] * dp + exy).toFixed(2)}cqw) rotate(${(o.r + g.dr[2] * dp).toFixed(2)}deg) scale(${((1 + .15 * off) * exs).toFixed(3)})`);
          S(el, 'opacity', (vis * exa).toFixed(3));
        }
        return;
      }
      const moving = tt < o.t0 + o.d * 1.25 + .2;
      for (let j = 0; j < 3; j++) {
        const el = j === 0 ? o.e : j === 1 ? o.a : o.b, dl = TR[j][0];
        if (j && (liteMode || !moving)) { S(el, 'opacity', '0'); S(el, 'willChange', 'auto'); continue; }
        const r = raw(o, tt - dl);
        if (!r) { S(el, 'opacity', '0'); continue; }
        const r2 = raw(o, tt - dl - .016) || r, vx = r[0] - r2[0], vy = r[1] - r2[1], sp = Math.hypot(vx, vy) / .016, va = Math.atan2(vy, vx), st = 1 + clamp(sp / 450, 0, 1.4);
        if (dl && sp < 80) { S(el, 'opacity', '0'); continue; }
        if (j) S(el, 'willChange', 'transform');
        const x = r[0] + g.dr[0] * dp + exx, y = r[1] + g.dr[1] * dp + Math.sin(t * 3 + o.k) * .25 + exy, rot = r[3] + g.dr[2] * dp + Math.sin(t * 2.3 + o.k) * .8;
        S(el, 'transform', `translate(-50%,-50%) translate(${x.toFixed(2)}cqw,${y.toFixed(2)}cqw) rotate(${va.toFixed(3)}rad) scale(${st.toFixed(3)},${(1 / (1 + (st - 1) * .35)).toFixed(3)}) rotate(${(-va).toFixed(3)}rad) rotate(${rot.toFixed(2)}deg) scale(${(r[2] * r[4] * exs).toFixed(3)},${(r[2] * exs).toFixed(3)})`);
        S(el, 'clipPath', r[5] || 'none');
        S(el, 'opacity', (TR[j][1] * exa).toFixed(3));
      }
    }

    function drawText(t) {
      const tt = liteMode ? Math.floor(t * 30) / 30 : t;   /* lite mode moves the text on twos, like the reference */
      for (let i = 0; i < pt.length; i++) S(pt[i], 'opacity', '0');
      for (const g of G) {
        const on = t >= g.t0 - .4 && t < g.t1;
        if (g.on !== on) { g.on = on; g.c.classList.toggle('on', on); }
        if (!on) continue;
        const dp = drift(clamp((tt - g.t0) / (g.ex - g.t0)));
        for (const o of g.k) {
          drawTok(o, t, tt, dp);
          if (liteMode || o.m === 'wipe' || o.m === 'slice') continue;
          const u = (tt - o.t0) / .4;
          if (u < 0 || u >= 1) continue;
          const sl = (o.k % 6) * 6, k = ez(u);
          for (let j = 0; j < 6; j++) {
            const a = j * Math.PI / 3 + o.k * .9, dd = (7 + o.sz * .25) * k;
            put(pt[sl + j], (1 - u) * (1 + .6 * (j % 2)), o.x + Math.cos(a) * dd, o.y + Math.sin(a) * dd, 45 + j * 30, .9 * (1 - u));
          }
        }
      }
    }

    let fcur = 0, fprev = 0, fts = 0;
    function frame(t) {
      lastT = t;
      /* scene A: shape-face countdown. visibility, not display: scene B is laid out
         once at the start instead of on the first frame of the cut (that was a hitch) */
      const inA = t < BEAT0 + .02, inB = t >= BEAT0 - .15;
      S(A, 'visibility', inA ? 'visible' : 'hidden'); S(B, 'visibility', inB ? 'visible' : 'hidden');
      /* compositor layers are built half a second early, while nothing shows yet */
      flag(overlay, 'sb', t >= BEAT0 - .6);
      flag(overlay, 'cut', inB);
      flag(overlay, 'chg', t >= 4.3);
      if (inA) {
        const mp = 1 - Math.pow(1 - seg(t, 2.306, .3), 3);   /* the face shapes fly into the mascot's spot instead of flashing away */
        const pf = (id, s, x = 0, y = 0, r = 0, o) => { const p = AP[id]; put(sh[id], s * (1 - mp), x + (50 - p[0]) * mp, y + (30 - p[1]) * (HSC / 100) * mp, r + mp * 40, o); };
        pf('t1', pop(t, .192, .3)); pf('t2', pop(t, .192, .3));
        pf('d1', pop(t, .343, .3)); pf('d2', pop(t, .343, .3));
        const ep = pop(t, .494, .4), ew = t > .85 ? Math.sin((t - .85) * 15) * 11 * Math.exp(-(t - .85) * 2.6) : 0, eo = t >= .494 ? 1 : 0;
        pf('e1', 1, 0, (1 - ep) * -18, -14 + ew, eo);
        pf('e2', 1, 0, (1 - ep) * -18, 14 - ew, eo);
        const k = clamp(Math.floor((t - 1.4) / .302), 0, 2), off = t < 1.4 || t >= 2.306;
        const dgt = off ? '' : String(3 - k), dg = sh.dg;
        if (dg._t !== dgt) { dg._t = dgt; dg.textContent = dgt; }
        pf('dg', off ? 0 : pop(t, 1.4 + k * .302, .22));
        const g = t >= 2.306, d1 = sh.d1, d2 = sh.d2;
        if (d1._g !== g) {
          d1._g = g;
          d1.className = 'a dot' + (g ? ' go' : ''); d2.className = d1.className;
          d1.textContent = g ? 'G' : ''; d2.textContent = g ? 'O' : '';
        }
      }

      /* scene B: mascot, phrases, title */
      if (inB) {
        const ph = (((t - G0) % BEAT) + BEAT) % BEAT, bp = t >= BEAT0 ? Math.exp(-7 * ph / BEAT) : 0;
        let gi = -1;
        for (let i = 0; i < G.length; i++) if (G[i].t0 <= t) gi = i;
        /* the mascot's expression changes ON EVERY BEAT; the last phrase cycles twice as fast and lands on ^w^ */
        const bn = Math.floor((t - G0) / BEAT);
        const face = t >= TT ? 2 : gi < 0 ? 0 : gi === G.length - 1 ? Math.floor((t - G0) / (BEAT / 2)) % 3 : ((bn % 3) + 3) % 3;
        if (face !== fcur) { fprev = fcur; fcur = face; fts = t; }
        faces.forEach((n, i) => {                         /* faces cross-fade instead of swapping */
          const w = i === fcur ? seg(t, fts, .06) : i === fprev ? 1 - seg(t, fts, .06) : 0;
          S(n, 'opacity', w.toFixed(2));
        });
        const wave = t >= TT ? Math.sin((t - TT) * 14) * 7 * Math.exp(-(t - TT) * 1.2) : 0;
        const pu = gi < 0 ? 0 : Math.exp(-14 * ph), pre = t < TT ? 1 : 0, s0 = pop(t, BEAT0 - .15, .5) * (1 + .15 * pu * pre), cr = seg(t, TE, .18), jp = seg(t, TE + .18, .62);
        const sy = s0 * (1 + .04 * bp) * (1 - .2 * cr) * (1 + .25 * jp), sx = s0 * (1 - .025 * bp) * (1 + .12 * cr) * (1 - .1 * jp);
        const mY = -2 * bp + 1.5 * cr * (1 - jp) - Math.pow(jp, 2.2) * (HSC * .3 + 34);   /* beat bob + crouch + jump out the top */
        S(mk, 'transform', `translate(-50%,-50%) translate(0cqw,${mY.toFixed(2)}cqw) rotate(${wave.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`);
        S(mk, 'opacity', s0 > .01 ? '1' : '0');

        /* the background lifts away upward after the mascot (transform only, no clipping) */
        if (t >= LIFT) { flag(overlay, 'lift', true); S(overlay, 'transform', `translateY(${(-wipeE(seg(t, LIFT, .75)) * 101).toFixed(2)}%)`); }
        else S(overlay, 'transform', 'none');

        letters.forEach((e, i) => {
          const p = pop(t, TT + i * .07, .4), w = Math.sin(t * 3 + i * .7) * .7 * seg(t, TT + .6, .6);
          S(e, 'transform', `translateY(${((1 - p) * -6 + w).toFixed(2)}cqw) scale(${p.toFixed(3)})`);
          S(e, 'opacity', p > .01 ? '1' : '0');
        });
        put(ttl, 1, 0, 0, 0, t >= TT ? 1 : 0);
        put(subEl, pop(t, TT + .7, .4));
        chips.forEach((c, i) => {
          const cp = pop(t, TT + .9 + i * .3, .35), on = cp > .9 ? 1 : 0;
          S(c, 'transform', `translateY(${(Math.sin(t * 2 + i * 1.3) * .4 * on).toFixed(2)}cqw) rotate(${([-3, 2][i] + Math.sin(t * 1.6 + i) * on).toFixed(2)}deg) scale(${cp.toFixed(3)})`);
          S(c, 'opacity', cp > .01 ? '1' : '0');
        });

        /* rings behind everything, drifting the other way from the camera for depth */
        S(sw, 'opacity', (.9 * seg(t, BEAT0 - .25, .45) * (1 - .6 * seg(t, TT, .5))).toFixed(3));
        drawBg(t);
        let cc = [0, 0, 0, 1];
        { let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1].t) i++;
          const a = CAMK[i], b = CAMK[i + 1], u = clamp((t - a.t) / (b.t - a.t)), s3 = u * u * (3 - 2 * u);
          cc = a.c.map((v, j) => v + (b.c[j] - v) * s3); }
        S(stg, 'transform', `translate(-50%,-50%) translate(${cc[0].toFixed(3)}%,${cc[1].toFixed(3)}%) rotate(${cc[2].toFixed(3)}deg) scale(${cc[3].toFixed(4)})`);
        S(sw, 'transform', `translate(${(-cc[0] * 1.3).toFixed(3)}%,${(-cc[1] * 1.3).toFixed(3)}%) scale(${(1 + (cc[3] - 1) * .5).toFixed(4)})`);

        drawText(t);

        if (t >= TE + .9) land();   /* the background has lifted: the page's own mascot drops in (js/landing.js) */
        els.forEach((e, i) => {
          const a = t * 1.7 + i * 2.094, z = Math.sin(a), pp = pop(t, TT + .4 + i * .15, .4) * (1 - seg(t, TE, .15));
          S(e, 'zIndex', z > 0 ? '3' : '1');
          put(e, pp * (.85 + .3 * z), Math.cos(a) * mkw * .66, z * mkw * .19, 0, pp > .01 ? .55 + .45 * (z * .5 + .5) : 0);
        });
        const rs = t >= TT ? TT : BEAT0, rq = seg(t, rs, .7);
        put(rg, .4 + rq * 1.8, 0, 0, 0, t >= rs && rq < 1 ? (1 - rq) * .8 : 0);
      }

      /* buttons: Start pops after the title, goes away as the mascot crouches */
      const gp = pop(t, TT + 1.4, .4), on = t >= TT + 1.4 && t < TE + .3;
      S(go, 'opacity', gp > .01 && t < TE + .3 ? '1' : '0');
      S(go, 'transform', `translateX(-50%) scale(${gp.toFixed(3)})`);
      /* visibility (not just pointer-events) so the CTA is unfocusable until it
         pops, which keeps introSkip the first tab stop (a11y gate A0) */
      S(go, 'visibility', on ? 'visible' : 'hidden');
      if (go._on !== on) { go._on = on; go.classList.toggle('on', on); }
    }

    /* faces cost zero bytes until playback is certain (chapter routes never fetch
       them). They are DECODED before the first swap so no frame pays for it. */
    function loadFaces() {
      for (const f of faces) {
        if (f.src) continue;
        f.decoding = 'async'; f.src = IMG[f.id];
        if (f.decode) f.decode().catch(() => {});
      }
      overlay.querySelectorAll('.gh').forEach(g => { if (!g.src) g.src = IMG.fo; });   /* same url: no second download */
    }

    return { frame, fit, readMkw, loadFaces, setLite, TT, TE, END };
  }

  let E = null;                    /* the running engine; dropped when the overlay goes */
  let liteMode = false, duration = 0;
  const engine = () => {
    if (!E && !removed) { E = makeEngine(); duration = E.END; }
    return E;
  };

  let fitRaf = 0;
  function refit() {
    if (fitRaf) return;
    fitRaf = requestAnimationFrame(() => { fitRaf = 0; if (E) { E.readMkw(); E.fit(); } });
  }

  let landed = false, started = false;
  function land() {
    if (landed) return;
    landed = true;
    document.dispatchEvent(new CustomEvent('emc:intro-land', { detail: { played: started } }));   /* played=false: skipped/bypassed before the first frame -> no landing sequence */
  }

  function finish() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    unlockPage();                   /* page is usable while the overlay fades */
    land();
    if (!overlay.classList.contains('done')) {
      overlay.classList.add('done');
      document.dispatchEvent(new CustomEvent('emc:intro-done'));
    }
  }

  let t0 = 0, tShift = 0, pauseStart = 0, lastNow = 0, ema = 16, slow = 0;
  function step(now) {
    const t = (now - t0 - tShift) / 1000;
    if (t >= E.END) { E.frame(E.END); finish(); return; }
    /* adaptive quality: sustained slow frames drop the extras */
    if (lastNow && t > 1 && !liteMode) {
      ema = ema * .9 + (now - lastNow) * .1;
      slow = ema > 28 ? slow + 1 : 0;
      if (slow > 18) E.setLite();
    }
    lastNow = now;
    E.frame(t);
    raf = requestAnimationFrame(step);
  }
  const whenReady = () => (window.EMC_KINETIC ? window.EMC_KINETIC.ready() : (document.fonts && document.fonts.ready) || Promise.resolve());
  function run() {
    if (raf) cancelAnimationFrame(raf);
    overlay.classList.remove('done');
    /* the lettering font is preloaded, so this wait is a few ms at most */
    whenReady().then(() => {
      if (removed || !overlay.isConnected) return;
      const e = engine();
      e.loadFaces(); e.readMkw(); e.fit();
      if (window.EMC && (window.EMC.lowTier || window.EMC.saveData) || (navigator.hardwareConcurrency || 8) <= 2) e.setLite();
      const reducedMotion = window.EMC && window.EMC.reducedMotion;
      if (reducedMotion) { e.frame(e.TT + 2); return; }  /* static end frame */
      landed = false; started = true;
      /* the clock starts after the first frame has painted: locking the page and
         building the overlay's layers must not eat the start of the timeline */
      e.frame(0);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(now => {
          t0 = now; tShift = 0; pauseStart = 0; lastNow = 0;
          step(now);
        });
      });
    });
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
      pauseStart = 0; lastNow = 0;
      if (!raf && !overlay.classList.contains('done') && E) raf = requestAnimationFrame(step);
    }
  }
  /* ------------------------------------------------------------ engine end */

  function removeIntro() {
    if (removed) return;
    land();                         /* an intro that never played (skipped / bypassed) still hands the page back */
    removed = true;
    document.dispatchEvent(new CustomEvent('emc:intro-gone'));
    playing = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (fitRaf) { cancelAnimationFrame(fitRaf); fitRaf = 0; }
    clearTimers();
    removeListeners();
    unlockPage();
    overlay.remove();
    E = null;                       /* releases the engine and everything it held */
  }

  function dismissIntro() {
    if (removed) return;
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

    /* Escape is the one documented keyboard shortcut (also announced on the
       Skip button via aria-keyshortcuts). Every other key and click is ignored. */
    function skipOnEscape(event) {
      if (event.key === 'Escape') dismissIntro();
    }

    lockPage();
    addListener(document, 'keydown', skipOnEscape);
    addListener(q('#introSkip'), 'click', dismissIntro);
    addListener(go, 'click', dismissIntro);       /* navigation proceeds; overlay fades */
    addListener(document, 'visibilitychange', onVis);
    addListener(window, 'resize', refit);
    addListener(document, 'emc:intro-done', () => {
      schedule(removeIntro, EXIT_BUFFER_MS);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

    /* dev tuning freeze: ?t=5.5 draws one frame, no clock, no auto-dismiss */
    const freeze = new URLSearchParams(location.search).get('t');
    if (freeze !== null) { whenReady().then(() => { if (removed || !overlay.isConnected) return; const e = engine(); e.loadFaces(); e.readMkw(); e.fit(); e.frame(+freeze); }); return; }

    run();
    /* reduced motion: the static end frame is the whole show — clear fast */
    if (reducedMotion) { schedule(dismissIntro, REDUCED_MOTION_MS); return; }
    /* safety net in case the rAF clock or the done event ever gets interrupted */
    schedule(() => { if (playing) dismissIntro(); }, SAFETY_MS);
    schedule(() => { if (!removed) removeIntro(); }, SAFETY_MS + EXIT_BUFFER_MS + 200);
  }

  /* Only the bare landing page shows the intro, on every load. */
  if (!isHomeRoute()) {
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
        rafs: (raf ? 1 : 0) + (fitRaf ? 1 : 0),
        inert: inertedNodes.length,
        lite: liteMode,
        duration
      };
    },
    dismiss: dismissIntro
  };
})();
