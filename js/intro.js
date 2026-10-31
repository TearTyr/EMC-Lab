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
   The engine half is the friend's MAD-style recreation (test/emc-intro-test):
   one rAF timeline, BEAT0 3.5 s flash cut into the title card, BEAT 0.604 s
   (~99 BPM, measured from the reference track), six kinetic text phrases
   (V=IR, I=V/R, P=VI, R=R1+R2, sum V=0, OHM'S LAW) flying in on bezier paths
   with smear trails and sparks, a slow camera dolly, then the title, chips,
   orbiting electrons and the mascot jumping out. Reduced motion draws the
   static end frame; faces are fetched only when playback actually starts;
   ?t=<s> freezes a frame for tuning (dev).
   LETTERING (v10): every word is a sprite drawn once by js/kinetic.js (heavy
   serif, white fill, coral edge + stepped extrusion, rough edges) and then only
   moved; text motion runs on 30 fps "twos" like the reference; the first slam
   arrives oversized and cropped; long words type on glyph by glyph; scenes
   swap yellow rings -> pink burst -> torn red paper; slash bars cut between
   phrases.
   PERFORMANCE (why this is not a straight copy of the prototype):
   - every style write goes through a per-element cache (S), so a value that
     did not change costs nothing; hidden tokens are display:none and are not
     touched again until they are live;
   - no getComputedStyle / querySelector inside the frame loop (all refs and
     the --mk token are read once);
   - the full-viewport repeating-radial-gradient the prototype rewrote every
     frame is five pre-painted rings that only animate transform + opacity;
   - will-change is set only on the tokens that are on screen;
   - the faces are decoded before the first swap so no decode hitch;
   - an adaptive "lite" mode (no smear trails/sparks/rings, lighter text
     shadow) turns on from the start for low-tier devices and mid-run when the
     measured frame time stays above ~28 ms. */
(function () {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

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
  const PINK = '#f8aebe', INK = '#17181c';
  const q = sel => overlay.querySelector(sel);
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

  /* all refs read once */
  const A = q('#A'), B = q('#B'), fl = q('#fl'), go = q('#go'), mk = q('#mk'), ttl = q('#ttl');
  const stg = q('#st'), sw = q('#sw'), kwHost = q('#kw'), subEl = q('#sub'), rg = q('#rg');
  const burst = q('#burst'), paper = q('#paper'), slash = q('#slash');
  /* torn paper edge, generated once */
  if (paper) {
    const pp = [], N = 18;
    const j = (i, a) => Math.abs((Math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1);
    for (let i = 0; i <= N; i++) pp.push(`${(i / N * 100).toFixed(1)}% ${(1.5 + j(i, 1) * 4).toFixed(1)}%`);
    for (let i = 0; i <= 8; i++) pp.push(`${(100 - j(i, 2) * 2.5).toFixed(1)}% ${(8 + i / 8 * 84).toFixed(1)}%`);
    for (let i = N; i >= 0; i--) pp.push(`${(i / N * 100).toFixed(1)}% ${(98.5 - j(i, 3) * 4).toFixed(1)}%`);
    for (let i = 8; i >= 0; i--) pp.push(`${(j(i, 4) * 2.5).toFixed(1)}% ${(8 + i / 8 * 84).toFixed(1)}%`);
    paper.style.clipPath = `polygon(${pp.join(',')})`;
  }
  const t1 = q('#t1'), t2 = q('#t2'), d1 = q('#d1'), d2 = q('#d2'), e1 = q('#e1'), e2 = q('#e2'), dg = q('#dg');
  const faces = { sp: q('#sp'), fo: q('#fo'), hp: q('#hp') };
  const FC = ['sp', 'fo', 'hp'];
  const ghosts = [[7, 20, -12], [17, 68, 9], [93, 22, 12], [84, 72, -8], [50, 6, 0], [4, 88, 6]].map(([l, t, r], i) => {
    const s = document.createElement('img');
    s.className = 'a gh'; s.alt = ''; s.width = 409; s.height = 415; s.decoding = 'async';
    s.style.left = l + '%'; s.style.top = t + '%';
    q('#ghosts').appendChild(s);
    return { s, r, i };
  });
  const letters = [..."EMC Lab"].map(c => {
    const e = document.createElement('span');
    e.textContent = c === ' ' ? ' ' : c;
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
  /* expanding rings (the MAD's swirl): static geometry, transform/opacity only */
  const RINGS = 5;
  const rings = Array.from({ length: RINGS }, () => {
    const e = document.createElement('i');
    e.className = 'sr';
    sw.appendChild(e);
    return e;
  });
  const sparks = Array.from({ length: 36 }, (_, i) => {
    const e = document.createElement('i');
    e.className = 'a spk';
    e.style.cssText = 'left:50%;top:50%;z-index:7;background:' + (i % 2 ? '#fff' : PINK);
    stg.appendChild(e);
    return e;
  });

  /* ---- timeline: phrases, snapped to the beat grid -------------------- */
  const G0 = BEAT0 + (2.712 - 3);   /* beat grid origin measured from the reference */
  const HOLD = .35, EXIT = .28, LAND = .42, Q16 = BEAT / 4;
  const sn = a => G0 + Math.round((a - G0) / Q16) * Q16;
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
  const drift = bz(.4, 0, .2, 1), wipeE = bz(.5, 0, .2, 1);
  const ez = bz(.3, .6, .15, 1), wh = bz(.2, .9, .2, 1.12);
  const bq = (a, c, e, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * c + k * k * e;
  const c2 = (x, a, b) => Math.max(a, Math.min(b, x));
  const bo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 2.5) * Math.cos(x * Math.PI * 1.5); };

  /* groups: cam = camera keyframe, dr = drift [dx,dy,rot], L = lines, toks = [text, slam offset, entrance, duration] */
  const G = [
    { cam: [-2, -1, -1.2, 1.04], dr: [-1, 2, -1], L: [{ xf: .84, gf: .42, r: 5, s: 24, v: 1, toks: [["V", 0, 'slam', 0], ["=", .151, 'whip', .5], ["IR", .302, 'drop', .6]] }] },
    { cam: [2.5, 1, 1, 1.02], dr: [-1, -1, -1], L: [{ xf: .5, gf: .78, r: -8, s: 22, toks: [["I", 0, 'spin', .55], ["=", .151, 'flip', .5], ["V", .302, 'slice', .55], ["/R", .453, 'wipe', .45]] }] },
    { cam: [-1.5, -1.5, -1.2, 1.05], dr: [0, 2, 1], L: [{ xf: .84, gf: .42, r: 6, s: 24, v: 1, toks: [["P", 0, 'arc', .5], ["=", .151, 'elastic', .5], ["VI", .302, 'pop', .45]] }, { xf: .14, gf: .78, r: -6, s: 14, toks: [["watts", .453, 'type', .5]] }] },
    { cam: [2, .8, 1.2, 1.03], dr: [-1, 2, -1], L: [{ xf: .3, gf: .3, r: -6, s: 26, toks: [["R", 0, 'pop', .5], ["=", .151, 'arc', .5]] }, { xf: .5, gf: .74, r: 4, s: 24, toks: [["R_1", .453, 'whip', .5], ["+", .604, 'spin', .55], ["R_2", .755, 'flip', .5]] }, { xf: .86, gf: .3, r: 8, s: 30, toks: [["Ω", .906, 'elastic', .5]] }] },
    { cam: [-2.5, -.8, -1, 1.045], dr: [0, 2, 0], L: [{ xf: .5, gf: .3, r: -5, s: 26, toks: [["ΣV", 0, 'slice', .55], ["=", .151, 'wipe', .5], ["0", .302, 'drop', .5]] }, { xf: .5, gf: .72, r: 4, s: 26, toks: [["ΣI", .604, 'elastic', .5], ["=", .755, 'rise', .5], ["0", .906, 'whip', .5]] }] },
    { cam: [0, -1, .8, 1.05], dr: [0, 1, 1], L: [{ xf: .5, gf: .1, r: -5, s: 20, toks: [["OHM’S", 0, 'type', .5], ["LAW", .302, 'type', .4]] }, { xf: .32, gf: .66, r: -6, s: 20, toks: [["CIRCUIT", .604, 'type', .6]] }, { xf: .68, gf: .86, r: 5, s: 20, toks: [["BUILDER", .755, 'type', .6]] }] }
  ];
  let cur = BEAT0;
  G.forEach(g => {
    g.t0 = cur;
    let last = 0;
    g.L.forEach(L => L.toks.forEach(k => { k.t = sn(g.t0 + k[1]); last = Math.max(last, k.t + LAND); }));
    g.ex = last + HOLD;
    g.t1 = g.ex + EXIT + .18;
    cur = sn(g.t1 - .22);
  });
  const TT = cur;            /* the title slams in once the last phrase has eased out */
  const TE = TT + 2.0;       /* mascot crouch + jump */
  const END = TE + 1;        /* engine timeline length (s) */
  const CAMK = [{ t: BEAT0, c: [0, 0, 0, 1] }, ...G.map(g => ({ t: (g.t0 + g.ex) / 2, c: g.cam })), { t: TT + .9, c: [0, 0, 0, 1] }];

  /* each word is ONE sprite canvas (built by js/kinetic.js once fonts are ready);
     a "slice" word gets a second canvas for the other half */
  const kws = [], LN = [];
  G.forEach(g => g.L.forEach(L => {
    L.g = g; L.k = []; LN.push(L);
    L.toks.forEach(tk => {
      const [h, , m, d] = tk;
      const o = { e: null, a: null, text: h, g, L, t0: tk.t, x: 0, y: 0, r: L.r, k: kws.length, m, d, S: [0, 0], C: [0, 0], sz: L.s, w: 0, h: 0, u: 0, on: false, n: [...h.replace(/_\d/g, 'x')].length, sp: null, px: 0 };
      L.k.push(o); kws.push(o);
    });
  }));
  /* build every sprite once; the font is waited for first, so lettering is never drawn in a fallback face */
  let built = false;
  function build() {
    if (built || !window.EMC_KINETIC) return;
    built = true;
    const stageW = stg.offsetWidth || 600, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    kws.forEach(o => {
      /* sprite resolution follows the on-screen size so big words stay crisp */
      const px = Math.max(96, Math.min(360, Math.ceil(o.L.s * 1.15 / 100 * stageW * dpr)));
      o.sp = window.EMC_KINETIC.sprite(o.text, px);
      o.px = px;
      const mkc = src => {
        const c = document.createElement('canvas');
        c.className = 'a kc'; c.width = src.width; c.height = src.height; c.style.display = 'none'; c.style.left = '50%'; c.style.top = '50%';
        c.getContext('2d').drawImage(src, 0, 0);
        kwHost.appendChild(c);
        return c;
      };
      o.e = mkc(o.sp.canvas);
      if (o.m === 'slice') o.a = mkc(o.sp.canvas);
    });
  }
  const sizeTok = o => {
    if (!o.sp) return;                                       /* sprites not built (no canvas): nothing to size */
    const k = o.sz / o.px;                                  /* cqw per sprite pixel */
    for (const n of [o.e, o.a]) if (n) { n.style.width = (o.sp.cw * k).toFixed(3) + 'cqw'; n.style.height = (o.sp.ch * k).toFixed(3) + 'cqw'; }
    o.w = o.sp.w * k; o.h = o.sz * .9;
  };

  /* entrances: eleven distinct moves, tuned soft */
  function raw(o, t) {
    const u = t - o.t0;
    if (u < 0) return null;
    const m = o.m, pd = m === 'pop' ? .12 : 0, tt = clamp((u - pd) / (o.d * 1.25 || 1)), k = ez(tt), sg = o.x < 0 ? -1 : 1;
    let x = o.x, y = o.y, sc = 1, rot = o.r, sx = 1, cl = '';
    if (m === 'slam') { const z = 1 - Math.pow(1 - clamp(u / .13), 3); sc = 1 + 4.2 * (1 - z); rot = o.r + sg * 16 * (1 - z); y = o.y + 6 * (1 - z); }   /* arrives huge and cropped, shrinks into place in ~4 frames */
    else if (m === 'type') {                                                /* long words type on glyph by glyph, then settle */
      const n = Math.max(1, o.n), kk = Math.min(1, Math.floor(clamp(u / (o.d * .8)) * n + .001) / n);
      cl = kk >= 1 ? '' : `inset(-30% ${((1 - kk) * 100 + 4).toFixed(1)}% -30% -15%)`;
      sc = 1 + .22 * (1 - clamp(u / (o.d * .8 + .12))); rot = o.r + sg * 5 * (1 - k); y = o.y + 1.5 * (1 - k);
    }
    else if (m === 'drop') { y = o.S[1] + (o.y - o.S[1]) * bo(tt); rot = o.r + sg * 8 * (1 - k); }
    else if (m === 'whip') { x = o.S[0] + (o.x - o.S[0]) * wh(tt); rot = o.r + sg * 6 * (1 - k); }
    else if (m === 'wipe') { x = o.S[0] + (o.x - o.S[0]) * k; y = o.y + 2 * (1 - k); cl = `inset(-30% ${((1 - k) * 125 - 15).toFixed(1)}% -30% -15%)`; }
    else if (m === 'elastic') { sc = 1 - Math.exp(-7 * tt) * Math.cos(tt * 10); rot = o.r + sg * 18 * (1 - k); }
    else if (m === 'spin') { x = bq(o.S[0], o.C[0], o.x, k); y = bq(o.S[1], o.C[1], o.y, k); sc = .15 + .85 * k; rot = o.r + sg * 360 * (1 - k); }
    else if (m === 'flip') { x = bq(o.S[0], o.C[0], o.x, k); sx = Math.abs(Math.cos((1 - k) * Math.PI)); rot = o.r + sg * 8 * (1 - k); }
    else { x = bq(o.S[0], o.C[0], o.x, k); y = bq(o.S[1], o.C[1], o.y, k); sc = m === 'pop' ? (u < pd ? 1.3 * pop(u, 0, pd) : 1.3 - .3 * k) : 1 + .25 * (1 - k); rot = o.r + sg * 20 * (1 - k); }
    return [x, y, sc, rot, sx, cl];
  }

  /* layout: measured ONCE (and on resize), never inside the frame loop */
  let HSC = 100;
  function lay(L) {
    const ks = L.k, gp = ks[0].sz * (L.gp != null ? L.gp : L.v ? .1 : .26);
    let tot = 0, mh = 0;
    ks.forEach(o => { tot += L.v ? o.h : o.w; mh = Math.max(mh, L.v ? o.w : o.h); });
    tot += gp * (ks.length - 1);
    let c = -tot / 2;
    ks.forEach(o => { const sp = L.v ? o.h : o.w; o.u = c + sp / 2; c += sp + gp; });
    const a = Math.abs(L.r) * Math.PI / 180, w = L.v ? mh : tot, h = L.v ? tot : mh;
    L.ew = w * Math.cos(a) + h * Math.sin(a);
    L.eh = w * Math.sin(a) + h * Math.cos(a);
  }
  function shr(L, f) {
    L.k.forEach(o => { o.sz *= f; sizeTok(o); });
    lay(L);
  }
  function fit() {
    const W = stg.offsetWidth / 100 || 1, Hs = (stg.offsetHeight / W) || 100;
    HSC = Hs;
    const Wc = Math.max(100, (window.innerWidth || stg.offsetWidth) / (stg.offsetWidth || 1) * 100), bs = 1 + Math.min(.35, (Wc - 100) / 220);
    /* sprite boxes are known from their pixel size: no DOM measuring at all */
    LN.forEach(L => L.k.forEach(o => { o.sz = L.s * bs; sizeTok(o); }));
    LN.forEach(L => {
      lay(L);
      const f = Math.min(1, (Wc - 20) / L.ew, (Hs - 18) / L.eh);
      if (f < 1) shr(L, f);
      const mx = Math.max(0, Wc / 2 - 10 - L.ew / 2), my = Math.max(0, Hs / 2 - 9 - L.eh / 2);
      L.x = c2((L.xf - .5) * Wc, -mx, mx);
      L.y = c2((L.gf - .5) * Hs * .9, -my, my);
    });
    G.forEach(g => {
      const ls = g.L;
      for (let pass = 0; pass < 8; pass++) {   /* keep lines in a group clear of each other; if still crowded shrink a little */
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
        for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
          if ((ls[i].ew + ls[j].ew) / 2 + 4 > Math.abs(ls[i].x - ls[j].x) && (ls[i].eh + ls[j].eh) / 2 + 4 > Math.abs(ls[i].y - ls[j].y)) cr = true;
        }
        if (!cr) break;
        ls.forEach(L => shr(L, .92));
      }
    });
    LN.forEach(L => {
      const a = L.r * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      L.k.forEach(o => {
        o.x = L.x + (L.v ? -o.u * sa : o.u * ca);
        o.y = L.y + (L.v ? o.u * ca : o.u * sa);
        const sg = o.x < 0 ? -1 : 1, Hh = Hs / 2, m = o.m;
        if (m === 'rise') { o.S = [o.x * .5, Hh + 16]; o.C = [(o.S[0] + o.x) / 2 - sg * 26, (o.S[1] + o.y) / 2]; }
        else if (m === 'arc') { o.S = [sg * (Wc / 2 + 8), -Hh - 14]; o.C = [(o.S[0] + o.x) / 2 - sg * 22, (o.S[1] + o.y) / 2 + 8]; }
        else if (m === 'drop') { o.S = [o.x, -Hh - 14]; }
        else if (m === 'whip') { o.S = [sg * (Wc / 2 + 22), o.y]; }
        else if (m === 'wipe') { o.S = [o.x - 30, o.y]; }
        else if (m === 'flip') { o.S = [sg * (Wc / 2 + 2), o.y]; o.C = [(o.S[0] + o.x) / 2, o.y - 8]; }
        else { o.S = [0, 0]; o.C = [o.x / 2, o.y / 2 - 10]; }
      });
    });
  }

  /* camera + --mk token, read once */
  let mkw = 34;
  const readMkw = () => {
    const v = parseFloat(getComputedStyle(stg).getPropertyValue('--mk'));
    if (v) mkw = v;
  };
  let fitRaf = 0;
  function refit() {
    if (fitRaf) return;
    fitRaf = requestAnimationFrame(() => { fitRaf = 0; if (!removed) { readMkw(); fit(); } });
  }

  /* lite mode: no sparks, rings or extra particles (the lettering sprites are already cheap) */
  let lite = false;
  function setLite() {
    if (lite) return;
    lite = true;
    overlay.classList.add('lite');
    sparks.forEach(e => S(e, 'opacity', '0'));
    rings.forEach(e => S(e, 'opacity', '0'));
  }

  const hideTok = o => {
    for (const n of [o.e, o.a]) if (n) { S(n, 'opacity', '0'); S(n, 'display', 'none'); S(n, 'willChange', 'auto'); }
  };

  let landed = false;
  function land() {
    if (landed) return;
    landed = true;
    document.dispatchEvent(new CustomEvent('emc:intro-land'));
  }

  const spUsed = new Uint8Array(36);
  function frame(t) {
    const tk = Math.floor(t * 30) / 30;          /* text/background motion runs on 30 fps "twos" like the reference */
    /* scene A: shape-face countdown */
    const inA = t < BEAT0 + .02, inB = t >= BEAT0;
    S(A, 'display', inA ? '' : 'none'); S(B, 'display', inB ? '' : 'none');
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

    /* scene B: title card */
    if (inB) {
      const bp = Math.exp(-7 * ((((t - G0) % BEAT) + BEAT) % BEAT) / BEAT);
      let gi = -1;
      for (let i = 0; i < G.length; i++) if (G[i].t0 <= t) gi = i;
      /* new face per text group; the last group cycles through all and lands on the happy face */
      const face = t >= TT ? 'hp' : gi < 0 ? 'sp' : gi === G.length - 1 ? FC[Math.floor((t - G[gi].t0) / .1) % 3] : FC[gi % 3];
      for (const id of FC) S(faces[id], 'display', id === face ? '' : 'none');
      const wave = t >= TT ? Math.sin((t - TT) * 14) * 7 * Math.exp(-(t - TT) * 1.2) : 0;
      const pu = gi < 0 ? 0 : Math.exp(-14 * (t - G[gi].t0)), pre = t < TT ? 1 : 0;
      const s0 = pop(t, BEAT0, .5) * (1 + .15 * pu * pre), cr = seg(t, TE, .18), jp = seg(t, TE + .18, .62);
      const sy = s0 * (1 + .04 * bp) * (1 - .2 * cr) * (1 + .25 * jp), sx = s0 * (1 - .025 * bp) * (1 + .12 * cr) * (1 - .1 * jp);
      const mY = -2 * bp + 1.5 * cr * (1 - jp) - Math.pow(jp, 2.2) * (HSC * .3 + 34);   /* beat bob + crouch + jump out the top */
      S(mk, 'transform', `translate(-50%,-50%) translate(0cqw,${mY.toFixed(2)}cqw) rotate(${wave.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`);
      S(mk, 'opacity', s0 > .01 ? '1' : '0');
      S(overlay, 'clipPath', t >= TE + .2 ? `inset(0 0 ${(wipeE(seg(t, TE + .2, .75)) * 100).toFixed(2)}% 0)` : 'none');   /* background lifts away upward after the mascot */
      const gO = .16 * seg(t, BEAT0, .8);
      ghosts.forEach(({ s, r, i }) => put(s, 1, Math.sin(t * .6 + i) * 1.2, Math.cos(t * .5 + i * 2) * 1.5, r, gO));
      letters.forEach((e, i) => {
        const p = pop(t, TT + i * .07, .4), w = Math.sin(t * 3 + i * .7) * .7 * seg(t, TT + .6, .6);
        S(e, 'transform', `translateY(${((1 - p) * -6 + w).toFixed(2)}cqw) scale(${p.toFixed(3)})`);
        S(e, 'opacity', p > .01 ? '1' : '0');
      });
      put(ttl, 1, 0, 0, 0, t >= TT ? 1 : 0);
      put(subEl, pop(t, TT + .7, .4));
      chips.forEach((c, i) => {
        const cp = pop(t, TT + .9 + i * .3, .35), on = cp > .9 ? 1 : 0;
        S(c, 'transform', `translateY(${(Math.sin(t * 2 + i * 1.3) * .4 * on).toFixed(2)}cqw) rotate(${([-3, 2, -2][i] + Math.sin(t * 1.6 + i) * on).toFixed(2)}deg) scale(${cp.toFixed(3)})`);
        S(c, 'opacity', cp > .01 ? '1' : '0');
      });

      /* rings, camera, background drift */
      S(sw, 'opacity', (.9 * seg(t, BEAT0, .3) * (1 - .6 * seg(t, TT, .5))).toFixed(3));
      if (!lite) {
        for (let i = 0; i < RINGS; i++) {
          const p = ((t * .75 + i / RINGS) % 1);
          S(rings[i], 'transform', `scale(${(.06 + p * 1.5).toFixed(3)})`);
          S(rings[i], 'opacity', (Math.sin(p * Math.PI) * .9).toFixed(3));
        }
      }
      if (t >= TE + .95) land();   /* once the background has wiped clean the page's own mascot drops in (js/landing.js) */
      let cc = [0, 0, 0, 1];
      { let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1].t) i++;
        const a = CAMK[i], b = CAMK[i + 1], u = clamp((t - a.t) / (b.t - a.t)), s3 = u * u * (3 - 2 * u);
        cc = a.c.map((v, j) => v + (b.c[j] - v) * s3); }
      S(stg, 'transform', `translate(-50%,-50%) translate(${cc[0].toFixed(3)}%,${cc[1].toFixed(3)}%) rotate(${cc[2].toFixed(3)}deg) scale(${cc[3].toFixed(4)})`);   /* camera move */
      S(sw, 'transform', `translate(${(-cc[0] * 1.3).toFixed(3)}%,${(-cc[1] * 1.3).toFixed(3)}%) scale(${(1 + (cc[3] - 1) * .5).toFixed(4)})`);   /* background drifts the other way for depth */
      const pz = 1 + .025 * bp;

      /* sparks burst off every landing */
      if (!lite) {
        spUsed.fill(0);
        kws.forEach((o, i) => {
          if (o.m === 'wipe' || o.m === 'slice' || t >= o.g.t1) return;
          const u = (t - o.t0) / .4;
          if (u < 0 || u >= 1) return;
          const sl = (i % 6) * 6, k = ez(u);
          for (let j = 0; j < 6; j++) {
            const a = j * Math.PI / 3 + i * .9, dd = (7 + o.sz * .25) * k;
            put(sparks[sl + j], (1 - u) * (1 + .6 * (j % 2)), o.x + Math.cos(a) * dd, o.y + Math.sin(a) * dd, 45 + j * 30, .9 * (1 - u));
            spUsed[sl + j] = 1;
          }
        });
        for (let i = 0; i < 36; i++) if (!spUsed[i]) S(sparks[i], 'opacity', '0');
      }

      /* scene backgrounds: yellow rings -> pink burst -> torn red paper */
      const bO = gi >= 2 && gi <= 4 ? 1 : 0, pO = gi === 5 && t < TT ? 1 : 0;
      S(burst, 'opacity', bO ? '1' : '0');
      S(burst, 'transform', `translate(-50%,-50%) rotate(${(tk * 14).toFixed(2)}deg)`);
      S(paper, 'opacity', pO ? '1' : '0');
      S(paper, 'transform', `translate(-50%,-50%) rotate(${(-2 + Math.sin(tk * 2) * .6).toFixed(2)}deg) scale(${(pO ? Math.max(.01, pop(tk, G[5].t0, .3)) : 0.01).toFixed(3)})`);

      /* slash-bar cut between phrases */
      let sli = -1;
      for (let i = 1; i < G.length; i++) if (tk >= G[i].t0 && tk < G[i].t0 + .26) sli = i;
      if (sli < 0) S(slash, 'opacity', '0');
      else { const u = (tk - G[sli].t0) / .26, d = sli % 2 ? 1 : -1; put(slash, 1, d * (-150 + 300 * (1 - Math.pow(1 - u, 3))), [-6, 4, -2, 6, -4][sli - 1], d * -6, 1); }

      /* kinetic text: 30 fps "twos" (tk), only tokens that are on screen are touched */
      kws.forEach(o => {
        const g = o.g;
        if (!o.e) return;
        if (tk < o.t0 || t >= g.t1) { if (o.on) { hideTok(o); o.on = false; } return; }
        if (!o.on) { o.on = true; S(o.e, 'display', ''); S(o.e, 'willChange', 'transform, opacity'); }
        const dp = drift(clamp((tk - g.t0) / (g.ex - g.t0))), eu = seg(tk, g.ex + (o.k % 6) * .03, EXIT), ee = 1 - Math.pow(1 - eu, 3);
        const sgn = o.x < 0 ? -1 : 1, exx = sgn * 5 * ee, exy = -9 * ee, exs = 1 - .1 * ee, exa = 1 - ee;   /* held, then a smooth ease-out */
        if (o.m === 'slice') {
          const k = ez(clamp((tk - o.t0) / (o.d * 1.25))), off = 1 - k, ld = off < .015;   /* two halves slide together, then it is ONE whole word */
          S(o.a, 'display', '');
          S(o.e, 'clipPath', ld ? 'none' : 'polygon(-15% -30%,115% -30%,115% 42%,-15% 62%)');
          S(o.a, 'clipPath', 'polygon(-15% 66%,115% 46%,115% 130%,-15% 130%)');
          [[o.e, -70, -26, 1], [o.a, 70, 26, ld ? 0 : 1]].forEach(([el, dx, dy, vis]) => {
            S(el, 'transform', `translate(-50%,-50%) translate(${(o.x + dx * off + g.dr[0] * dp + exx).toFixed(2)}cqw,${(o.y + dy * off + g.dr[1] * dp + exy).toFixed(2)}cqw) rotate(${(o.r + g.dr[2] * dp).toFixed(2)}deg) scale(${((1 + .15 * off) * exs * pz).toFixed(3)})`);
            S(el, 'opacity', (vis * exa).toFixed(3));
          });
          return;
        }
        const r = raw(o, tk);
        if (!r) { S(o.e, 'opacity', '0'); return; }
        const r2 = raw(o, tk - .034) || r, vx = r[0] - r2[0], vy = r[1] - r2[1], sp = Math.hypot(vx, vy) / .034, va = Math.atan2(vy, vx), st = 1 + clamp(sp / 520, 0, 1.2);   /* stretch along the travel direction = the reference's smear */
        const x = r[0] + g.dr[0] * dp + exx, y = r[1] + g.dr[1] * dp + exy, rot = r[3] + g.dr[2] * dp;
        S(o.e, 'transform', `translate(-50%,-50%) translate(${x.toFixed(2)}cqw,${y.toFixed(2)}cqw) rotate(${va.toFixed(3)}rad) scale(${st.toFixed(3)},${(1 / (1 + (st - 1) * .35)).toFixed(3)}) rotate(${(-va).toFixed(3)}rad) rotate(${rot.toFixed(2)}deg) scale(${(r[2] * r[4] * exs * pz).toFixed(3)},${(r[2] * exs * pz).toFixed(3)})`);
        S(o.e, 'clipPath', r[5] || 'none');
        S(o.e, 'opacity', exa.toFixed(3));
      });

      /* drifting charges, orbiting electrons, burst ring */
      const H = innerHeight, dt = Math.max(0, t - 4.3), nPts = lite ? 6 : 16;
      for (let i = 0; i < pts.length; i++) {
        const { e, p, v, w } = pts[i];
        if (i >= nPts) { S(e, 'opacity', '0'); continue; }
        const yy = 1.06 - ((p + v * dt) % 1.12);
        S(e, 'transform', `translate(-50%,-50%) translate(${(Math.sin(t * .8 + w) * 2).toFixed(2)}vw,${(yy * H).toFixed(1)}px) rotate(${(t * 20 + w * 30).toFixed(1)}deg)`);
        S(e, 'opacity', t < 4.3 ? '0' : (.5 * seg(t, 4.3, .8) * clamp(Math.min(yy * 8, (1.06 - yy) * 8))).toFixed(3));
      }
      els.forEach((e, i) => {
        const a = t * 1.7 + i * 2.094, z = Math.sin(a), pp = pop(t, TT + .4 + i * .15, .4);
        S(e, 'zIndex', z > 0 ? '3' : '1');
        put(e, pp * (.85 + .3 * z), Math.cos(a) * mkw * .66, z * mkw * .19, 0, pp > .01 ? .55 + .45 * (z * .5 + .5) : 0);
      });
      const rs = t >= TT ? TT : BEAT0, rq = seg(t, rs, .7);
      put(rg, .4 + rq * 1.8, 0, 0, 0, t >= rs && rq < 1 ? (1 - rq) * .8 : 0);
    }

    /* flashes + buttons */
    S(fl, 'opacity', clamp(1 - Math.abs(t - (BEAT0 + .02)) / .18).toFixed(3));
    const gp = pop(t, TT + 1.4, .4), on = t >= TT + 1.4;
    S(go, 'opacity', gp > .01 ? '1' : '0');
    S(go, 'transform', `translateX(-50%) scale(${gp.toFixed(3)})`);
    /* visibility (not just pointer-events) so the CTA is unfocusable until it
       pops — keeps introSkip the first tab stop (a11y gate A0) */
    S(go, 'visibility', on ? 'visible' : 'hidden');
    if (go._on !== on) { go._on = on; go.classList.toggle('on', on); }
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

  /* faces cost zero bytes until playback is certain (chapter routes never fetch
     them). They are DECODED before the first swap so no frame pays for it. */
  function loadFaces() {
    for (const id of FC) { faces[id].decoding = 'async'; faces[id].src = IMG[id]; }
    for (const g of ghosts) g.s.src = IMG.fo;
    if (!faces.sp.decode) return;
    FC.forEach(id => { faces[id].decode().catch(() => {}); });
  }

  let t0 = 0, tShift = 0, pauseStart = 0, lastNow = 0, ema = 16, slow = 0;
  function step(now) {
    const t = (now - t0 - tShift) / 1000;
    if (t >= END) { frame(END); finish(); return; }
    /* adaptive quality: sustained slow frames drop the heavy extras */
    if (lastNow && t > 1 && !lite) {
      ema = ema * .9 + (now - lastNow) * .1;
      slow = ema > 28 ? slow + 1 : 0;
      if (slow > 18) setLite();
    }
    lastNow = now;
    frame(t);
    raf = requestAnimationFrame(step);
  }
  const whenReady = () => (window.EMC_KINETIC ? window.EMC_KINETIC.ready() : Promise.resolve());
  function run() {
    if (raf) cancelAnimationFrame(raf);
    overlay.classList.remove('done');
    loadFaces();
    /* the lettering font is waited for (font-display:block + preload keep this to a few ms) */
    whenReady().then(() => {
      if (removed || !overlay.isConnected) return;
      try { build(); } catch (err) { /* no canvas support: the intro just plays without the lettering */ }
      readMkw(); fit();
      if (window.EMC && (window.EMC.lowTier || window.EMC.saveData) || (navigator.hardwareConcurrency || 8) <= 2) setLite();
      if (window.EMC && window.EMC.reducedMotion) { frame(TT + 2); return; }  /* static end frame */
      t0 = performance.now(); tShift = 0; pauseStart = 0; lastNow = 0;
      landed = false;
      raf = requestAnimationFrame(step);
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
      if (!raf && !overlay.classList.contains('done')) raf = requestAnimationFrame(step);
    }
  }
  /* ------------------------------------------------------------ engine end */

  function removeIntro() {
    if (removed) return;
    land();                         /* an intro that never played (skipped / bypassed) still hands the page back */
    removed = true;
    playing = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (fitRaf) { cancelAnimationFrame(fitRaf); fitRaf = 0; }
    clearTimers();
    removeListeners();
    unlockPage();
    overlay.remove();
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
    if (freeze !== null) { loadFaces(); whenReady().then(() => { if (removed || !overlay.isConnected) return; try { build(); } catch (err) { /* no canvas */ } readMkw(); fit(); frame(+freeze); }); return; }

    run();
    /* reduced motion: the static end frame is the whole show — clear fast */
    if (reducedMotion) { schedule(dismissIntro, REDUCED_MOTION_MS); return; }
    /* safety net in case the rAF clock or the done event ever gets interrupted */
    schedule(() => { if (playing) dismissIntro(); }, END * 1000 + 1400);
    schedule(() => { if (!removed) removeIntro(); }, END * 1000 + EXIT_BUFFER_MS + 1600);
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
        lite,
        duration: END
      };
    },
    dismiss: dismissIntro
  };
})();
