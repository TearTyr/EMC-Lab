/* EMC Lab intro controller + v10 "kinetic text" engine (Override-style lettering).
   Lifecycle contract: the intro plays on EVERY full load or refresh of the
   bare landing page (no seen-flag of any kind: no sessionStorage, no
   localStorage, no in-memory flag). It never runs on chapter hash routes or
   other pages, is cancelled by a fatal boot, and waits for the loader's single
   completion event. Only the Skip button, the Start button or Escape end it
   early; clicks and keys elsewhere do nothing. While it plays the rest of the
   page is `inert` (no click-through, no focus behind the overlay); the page is
   handed back the moment playback ends or is skipped, and the overlay is then
   removed with zero timers/listeners left.
   The engine half: one rAF timeline that only SCHEDULES (flash cut at BEAT0 3.5 s,
   BEAT 0.604 s ~99 BPM measured from the reference track). Six phrases, each one
   whole equation in one centred line under the mascot, type on in place character
   by character; backgrounds swap yellow rings -> pink burst -> torn paper; title,
   chips, orbiting electrons; the mascot crouches and jumps out, the title whips
   after it and the overlay lifts away.
   Reduced motion draws the static end frame; faces are fetched only when playback
   actually starts; ?t=<s> freezes a frame for tuning (dev).
   PERFORMANCE: characters, charges and exits are CSS animations on the compositor,
   rings and the burst share one small canvas; every word is laid
   out once and only toggled; the lettering is never transformed at rest, so it
   stays sharp; style writes go through a per-element cache; nothing queries or
   measures the DOM in the frame loop; the engine closure is dropped with the
   overlay. Low-tier devices and sustained slow frames switch to a lite mode. */
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
  const BEAT0 = 3.5, BEAT = .604;     /* ~99.4 BPM, measured from the reference audio */
  const IMG = {
    sp: 'img/mascot-face-sparkle.png',
    fo: 'img/mascot-face-focus.png',
    hp: 'img/mascot-face-happy.png'
  };
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

  /* The engine lives in one closure so that everything it holds (nodes, phrase
     tables, images) is released as soon as the overlay is removed. */
  function makeEngine() {
    const A = q('#A'), B = q('#B'), fl = q('#fl'), mk = q('#mk'), ttl = q('#ttl');
    const stg = q('#st'), sw = q('#sw'), kwHost = q('#kw'), subEl = q('#sub'), rg = q('#rg');
    const paper = q('#paper'), slash = q('#slash');
    const bgC = q('#bg'), bgX = bgC.getContext ? bgC.getContext('2d') : null;
    const t1 = q('#t1'), t2 = q('#t2'), d1 = q('#d1'), d2 = q('#d2'), e1 = q('#e1'), e2 = q('#e2'), dg = q('#dg');
    const faces = { sp: q('#sp'), fo: q('#fo'), hp: q('#hp') };
    const FC = ['sp', 'fo', 'hp'];
    const letters = [..."EMC Lab"].map(c => {
      const e = document.createElement('span');
      e.textContent = c === ' ' ? ' ' : c;
      ttl.appendChild(e);
      return e;
    });
    const chips = [...overlay.querySelectorAll('.chip')];
    const els = [...overlay.querySelectorAll('.el')];

    /* torn paper edge, generated once */
    {
      const pp = [], N = 18;
      const j = (i, a) => Math.abs((Math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1);
      for (let i = 0; i <= N; i++) pp.push(`${(i / N * 100).toFixed(1)}% ${(1.5 + j(i, 1) * 4).toFixed(1)}%`);
      for (let i = 0; i <= 8; i++) pp.push(`${(100 - j(i, 2) * 2.5).toFixed(1)}% ${(8 + i / 8 * 84).toFixed(1)}%`);
      for (let i = N; i >= 0; i--) pp.push(`${(i / N * 100).toFixed(1)}% ${(98.5 - j(i, 3) * 4).toFixed(1)}%`);
      for (let i = 8; i >= 0; i--) pp.push(`${(j(i, 4) * 2.5).toFixed(1)}% ${(8 + i / 8 * 84).toFixed(1)}%`);
      paper.style.clipPath = `polygon(${pp.join(',')})`;
    }

    /* drifting charges loop on the compositor (css), nothing per frame */
    Array.from({ length: 10 }, (_, i) => {
      const e = document.createElement('b');
      e.className = 'pt';
      e.textContent = i % 2 ? '+' : '−';
      e.style.cssText = `left:${(i * 37 + 11) % 97 + 1}%;color:${['#f8aebe', '#a8d3e0', '#b5d777'][i % 3]};font-size:${2.4 + (i % 4) * .7}vmin;--dur:${9 + (i % 5) * 2}s;--dl:-${(i * 1.9).toFixed(1)}s`;
      q('#px').appendChild(e);
    });

    /* ---- the phrases: each one is a whole equation that types on in place ---- */
    const G0 = BEAT0 + (2.712 - 3);          /* beat grid origin measured from the reference */
    const HOLD = .5, EXIT = .22, Q16 = BEAT / 4;
    const sn = a => G0 + Math.ceil((a - G0) / Q16 - 1e-6) * Q16;
    const P = [
      { l: ['V = IR'], step: Q16, bg: 'ring', cam: [-2, -1, -1.2, 1.04] },
      { l: ['I = V/R'], step: Q16, bg: 'ring', cam: [2.5, 1, 1, 1.02] },
      { l: ['P = VI'], step: Q16, bg: 'burst', cam: [-1.5, -1.5, -1.2, 1.05] },
      { l: ['R = R_1 + R_2'], step: Q16, bg: 'burst', cam: [2, .8, 1.2, 1.03] },
      { l: ['ΣV = 0', 'ΣI = 0'], step: Q16 * .75, bg: 'burst', cam: [-2.5, -.8, -1, 1.045] },
      { l: ["OHM'S LAW", 'CIRCUIT BUILDER'], step: Q16 / 2, bg: 'paper', cam: [0, -1, .8, 1.05] }
    ];
    let cur = sn(BEAT0);
    for (const p of P) {
      p.el = document.createElement('div');
      p.el.className = 'eq';
      p.ch = [];
      for (const line of p.l) {
        const l = document.createElement('div');
        l.className = 'eq-l';
        p.el.appendChild(l);
        p.ch.push(...window.EMC_KINETIC.split(l, line));
      }
      kwHost.appendChild(p.el);
      p.ch[0].classList.add('lead');
      p.t0 = cur;
      p.ex = cur + p.ch.length * p.step + HOLD;
      p.t1 = p.ex + EXIT;
      p.n = 0;
      cur = sn(p.t1 + .03);
    }
    const TT = cur;              /* the title lands once the last phrase has cleared */
    const TE = TT + 2.4;         /* crouch + jump (leaves Start readable and still for over a second) */
    const LIFT = TE + .35, END = TE + 1.1;
    const CAMK = [{ t: BEAT0, c: [0, 0, 0, 1] }, ...P.map(p => ({ t: (p.t0 + p.ex) / 2, c: p.cam })), { t: TT + .9, c: [0, 0, 0, 1] }];

    /* widest line of every phrase fits the screen; measured once, never in the frame loop */
    function fit() {
      const base = parseFloat(getComputedStyle(kwHost).fontSize) || 40, room = innerWidth * .92;
      for (const p of P) p.el.style.fontSize = '';
      const widths = P.map(p => Math.max(...[...p.el.children].map(l => l.scrollWidth)));
      P.forEach((p, i) => { if (widths[i] > room) p.el.style.fontSize = Math.floor(base * room / widths[i]) + 'px'; });
      /* one small shared background canvas (under 2 MB), scaled up by css */
      bgC.width = Math.min(960, innerWidth);
      bgC.height = Math.round(bgC.width * innerHeight / innerWidth);
      bgStep = -1;
      if (lastT >= 0) drawBg(lastT, bgKind);      /* resizing a canvas clears it */
    }

    /* Rings and the pink burst are drawn into that one canvas at 30 fps. Scaled
       ring layers and a rotating full-screen gradient were cheap in Chrome but
       dropped Firefox to single-digit frame rates; this costs the same everywhere. */
    let bgStep = -1, bgKind = 'ring', lastT = -1;
    function drawBg(t, kind) {
      if (!bgX) return;
      const k = Math.floor(t * 30);
      lastT = t;
      if (k === bgStep && kind === bgKind) return;
      bgStep = k; bgKind = kind;
      const w = bgC.width, h = bgC.height, cx = w / 2, cy = h * .3, R = Math.hypot(Math.max(cx, w - cx), h - cy) * 1.08;
      bgX.clearRect(0, 0, w, h);
      if (kind === 'burst') {
        bgX.fillStyle = '#f8aebe';
        bgX.fillRect(0, 0, w, h);
        bgX.fillStyle = '#e8507a';
        bgX.beginPath();
        const N = 26, a0 = liteMode ? 0 : t * .244;
        for (let i = 0; i < N; i++) {
          const a = a0 + i * 2 * Math.PI / N, b = a + Math.PI / N;
          bgX.moveTo(cx, cy);
          bgX.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          bgX.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R);
          bgX.closePath();
        }
        bgX.fill();
      } else if (!liteMode) {
        bgX.strokeStyle = '#fff';
        const unit = Math.min(w, h);
        for (let i = 0; i < 4; i++) {
          const p = (t * .75 + i / 4) % 1;
          bgX.globalAlpha = Math.sin(p * Math.PI) * .55;
          bgX.lineWidth = unit * (.012 + p * .05);
          bgX.beginPath();
          bgX.arc(cx, cy, Math.max(1, p * R * .92), 0, 6.2832);
          bgX.stroke();
        }
        bgX.globalAlpha = 1;
      }
    }

    /* --mk in cqw units, read once per run/resize (not per frame) */
    let mkw = 30;
    const readMkw = () => {
      const v = parseFloat(getComputedStyle(stg).getPropertyValue('--mk'));
      if (v) mkw = v;
    };

    function setLite() {
      if (liteMode) return;
      liteMode = true;
      overlay.classList.add('lite');
    }

    let active = -1;
    function drawText(t) {
      let a = -1;
      for (let i = 0; i < P.length; i++) if (t >= P[i].t0 && t < P[i].t1) a = i;
      if (a !== active) {
        if (active >= 0) S(P[active].el, 'visibility', 'hidden');
        active = a;
        if (a >= 0) S(P[a].el, 'visibility', 'visible');
      }
      if (a < 0) return;
      const p = P[a], n = Math.min(p.ch.length, Math.floor((t - p.t0) / p.step) + 1);
      if (n !== p.n) {
        for (let i = p.n; i < n; i++) p.ch[i].classList.add('on');
        if (p.n) p.ch[p.n - 1].classList.remove('cur');
        if (n < p.ch.length) p.ch[n - 1].classList.add('cur');
        p.n = n;
      }
      const out = t >= p.ex;
      if (p.out !== out) { p.out = out; p.el.classList.toggle('out', out); }
    }

    function flag(el, name, on) {
      const k = '_' + name;
      if (el[k] !== on) { el[k] = on; el.classList.toggle(name, on); }
    }

    function frame(t) {
      /* scene A: shape-face countdown */
      const inA = t < BEAT0 + .02, inB = t >= BEAT0;
      /* visibility, not display: scene B is laid out once at the start instead of
         on the first frame of the cut (that first layout was a visible hitch) */
      S(A, 'visibility', inA ? 'visible' : 'hidden'); S(B, 'visibility', inB ? 'visible' : 'hidden');
      /* compositor layers are built half a second early, while nothing shows yet, so the cut itself costs nothing */
      flag(overlay, 'sb', t >= BEAT0 - .6);
      flag(overlay, 'cut', inB);
      if (inA) {
        put(t1, pop(t, .3)); put(t2, pop(t, .5));
        put(d1, pop(t, .7)); put(d2, pop(t, .9));
        const ep = pop(t, 1.1, .45);
        const ew = t > 1.55 ? Math.sin((t - 1.55) * 15) * 11 * Math.exp(-(t - 1.55) * 2.6) : 0;
        const eo = t >= 1.1 ? 1 : 0;
        put(e1, 1, 0, (1 - ep) * -18, -14 + ew, eo);
        put(e2, 1, 0, (1 - ep) * -18, 14 - ew, eo);
        const k = clamp(Math.floor((t - 2.05) / .36), 0, 2), off = t < 2.05 || t >= 3.13;
        const dgt = off ? '' : String(3 - k);
        if (dg._t !== dgt) { dg._t = dgt; dg.textContent = dgt; }
        put(dg, off ? 0 : pop(t, 2.05 + k * .36, .25));
        const g = t >= 3.13;
        if (d1._g !== g) {
          d1._g = g;
          d1.className = 'a dot' + (g ? ' go' : ''); d2.className = d1.className;
          d1.textContent = g ? 'G' : ''; d2.textContent = g ? 'O' : '';
          d1._c = {}; d2._c = {};      /* className reset keeps inline styles; drop the cache so they re-apply */
        }
      }

      /* scene B: mascot, phrases, title */
      if (inB) {
        const bp = Math.exp(-7 * ((((t - G0) % BEAT) + BEAT) % BEAT) / BEAT);
        let gi = -1;
        for (let i = 0; i < P.length; i++) if (P[i].t0 <= t) gi = i;
        /* new face per phrase; the last one cycles through all and lands on the happy face */
        const face = t >= TT ? 'hp' : gi < 0 ? 'sp' : gi === P.length - 1 ? FC[Math.floor((t - P[gi].t0) / .1) % 3] : FC[gi % 3];
        for (const id of FC) S(faces[id], 'visibility', id === face ? 'visible' : 'hidden');
        const wave = t >= TT ? Math.sin((t - TT) * 14) * 7 * Math.exp(-(t - TT) * 1.2) : 0;
        const pu = gi < 0 ? 0 : Math.exp(-14 * (t - P[gi].t0)), pre = t < TT ? 1 : 0;
        const s0 = pop(t, BEAT0, .5) * (1 + .12 * pu * pre), cr = seg(t, TE, .18), jp = seg(t, TE + .18, .5);
        const sy = s0 * (1 + .04 * bp * pre) * (1 - .24 * cr) * (1 + .34 * jp), sx = s0 * (1 - .025 * bp * pre) * (1 + .16 * cr) * (1 - .16 * jp);
        const mY = -2 * bp * pre + 2.4 * cr * (1 - jp) - Math.pow(jp, 2.2) * 120;   /* beat bob + crouch + jump out the top */
        S(mk, 'transform', `translate(-50%,-50%) translate(0cqw,${mY.toFixed(2)}cqw) rotate(${wave.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`);
        S(mk, 'opacity', s0 > .01 ? '1' : '0');
        flag(overlay, 'jump', t >= TE + .18);
        flag(overlay, 'lift', t >= LIFT);
        /* the page mascot's background shows through as the overlay lifts away: transform only */
        S(overlay, 'transform', t >= LIFT ? `translateY(${(-wipeE(seg(t, LIFT, .7)) * 114).toFixed(2)}%)` : 'none');

        letters.forEach((e, i) => flag(e, 'on', t >= TT + i * .07));
        flag(ttl, 'out', t >= TE + .22);
        put(ttl, 1, 0, 0, 0, t >= TT ? 1 : 0);
        const leave = seg(t, TE + .3, .22);
        put(subEl, pop(t, TT + .7, .4), 0, -leave * 6, 0, t >= TT + .7 ? 1 - leave : 0);
        chips.forEach((c, i) => {
          const cp = pop(t, TT + .9 + i * .3, .35);
          S(c, 'transform', `rotate(${[-3, 2, -2][i]}deg) scale(${cp.toFixed(3)})`);
          S(c, 'opacity', cp > .01 ? (1 - leave).toFixed(3) : '0');
        });

        /* backgrounds: yellow rings -> pink burst -> torn paper */
        const bg = gi >= 0 && t < TT ? P[gi].bg : 'ring';
        S(sw, 'opacity', (bg === 'burst' ? 1 : .9 * seg(t, BEAT0, .3) * (1 - .6 * seg(t, TT, .5))).toFixed(3));
        drawBg(t, bg === 'burst' ? 'burst' : 'ring');
        const pO = bg === 'paper';
        S(paper, 'opacity', pO ? '1' : '0');
        S(paper, 'transform', `translate(-50%,-50%) rotate(-1.5deg) scale(${(pO ? Math.max(.01, pop(t, P[5].t0, .3)) : .01).toFixed(3)})`);

        /* slash-bar cut only where the scene changes */
        let sli = -1;
        for (const i of [2, 5]) if (t >= P[i].t0 && t < P[i].t0 + .26) sli = i;
        if (sli < 0) S(slash, 'opacity', '0');
        else { const u = (t - P[sli].t0) / .26, d = sli === 2 ? 1 : -1; put(slash, 1, d * (-150 + 300 * (1 - Math.pow(1 - u, 3))), sli === 2 ? -6 : 4, d * -6, 1); }

        let cc = [0, 0, 0, 1];
        { let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1].t) i++;
          const a = CAMK[i], b = CAMK[i + 1], u = clamp((t - a.t) / (b.t - a.t)), s3 = u * u * (3 - 2 * u);
          cc = a.c.map((v, j) => v + (b.c[j] - v) * s3); }
        /* the camera moves the mascot and background only: the lettering stays still and sharp */
        S(stg, 'transform', `translate(-50%,-50%) translate(${cc[0].toFixed(3)}%,${cc[1].toFixed(3)}%) rotate(${cc[2].toFixed(3)}deg) scale(${cc[3].toFixed(4)})`);
        S(sw, 'transform', `translate(${(-cc[0] * 1.3).toFixed(3)}%,${(-cc[1] * 1.3).toFixed(3)}%) scale(${(1 + (cc[3] - 1) * .5).toFixed(4)})`);

        drawText(t);

        if (t >= TE + .95) land();   /* the background has lifted: the page's own mascot drops in (js/landing.js) */
        els.forEach((e, i) => {
          const a = t * 1.7 + i * 2.094, z = Math.sin(a), pp = pop(t, TT + .4 + i * .15, .4) * (1 - seg(t, TE, .15));
          S(e, 'zIndex', z > 0 ? '3' : '1');
          put(e, pp * (.85 + .3 * z), Math.cos(a) * mkw * .66, z * mkw * .19, 0, pp > .01 ? .55 + .45 * (z * .5 + .5) : 0);
        });
        const rs = t >= TT ? TT : BEAT0, rq = seg(t, rs, .7);
        put(rg, .4 + rq * 1.8, 0, 0, 0, t >= rs && rq < 1 ? (1 - rq) * .8 : 0);
      }

      /* flashes + buttons */
      S(fl, 'opacity', clamp(1 - Math.abs(t - (BEAT0 + .02)) / .18).toFixed(3));
      const gp = pop(t, TT + 1.4, .4), on = t >= TT + 1.4 && t < TE + .3;
      S(go, 'opacity', gp > .01 && t < TE + .3 ? '1' : '0');
      S(go, 'transform', `translateX(-50%) scale(${gp.toFixed(3)})`);
      /* visibility (not just pointer-events) so the CTA is unfocusable until it
         pops — keeps introSkip the first tab stop (a11y gate A0) */
      S(go, 'visibility', on ? 'visible' : 'hidden');
      if (go._on !== on) { go._on = on; go.classList.toggle('on', on); }
    }

    /* faces cost zero bytes until playback is certain (chapter routes never fetch
       them). They are DECODED before the first swap so no frame pays for it. */
    function loadFaces() {
      for (const id of FC) { faces[id].decoding = 'async'; faces[id].src = IMG[id]; }
      if (!faces.sp.decode) return;
      FC.forEach(id => { faces[id].decode().catch(() => {}); });
    }

    return { frame, fit, readMkw, loadFaces, setLite, TT, TE, END };
  }

  const wipeE = (() => {
    const f = (t, p, q_) => 3 * (1 - t) * (1 - t) * t * p + 3 * (1 - t) * t * t * q_ + t * t * t;
    return x => { x = clamp(x); let t = x; for (let i = 0; i < 8; i++) { const dx = f(t, .5, .2) - x, ds = 3 * (1 - t) * (1 - t) * .5 + 6 * (1 - t) * t * (.2 - .5) + 3 * t * t * (1 - .2); if (Math.abs(ds) < 1e-5) break; t -= dx / ds; } return f(clamp(t), 0, 1); };
  })();

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
  const whenReady = () => (window.EMC_KINETIC ? window.EMC_KINETIC.ready() : Promise.resolve());
  function run() {
    if (raf) cancelAnimationFrame(raf);
    overlay.classList.remove('done');
    /* the lettering font is preloaded, so this wait is a few ms at most */
    whenReady().then(() => {
      if (removed || !overlay.isConnected || !window.EMC_KINETIC) return;
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
    if (freeze !== null) { whenReady().then(() => { if (removed || !overlay.isConnected || !window.EMC_KINETIC) return; const e = engine(); e.loadFaces(); e.readMkw(); e.fit(); e.frame(+freeze); }); return; }

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
