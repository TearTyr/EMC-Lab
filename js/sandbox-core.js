/* Sandbox core — the shared free-play engine behind the three lesson
   sandboxes (Tug-of-War Arena, Field Painter). One rule set for
   all: every object is draggable, every readout is computed per frame from
   F = k|q1q2|/r^2 (softened at close range so the sim can never blow up) and
   E(P) = SUM k q (P-r)/|P-r|^3 — nothing is animated by hand.
   The core owns: world<->screen mapping (pinch zoom + two-finger pan),
   toolbar/toggle wiring, undo/clear/random, wheel + long-press charge
   editing, release-mode integration with caps and edge bounce, trails,
   slow motion, force/field/line rendering, selection with component ghosts,
   predict-then-run prompts computed from the live state, optional star
   challenges detected from the physics, and share-codes in the URL hash.
   Pages provide markup only; every element is found through the per-instance
   prefix, so one core serves all three lessons without id collisions. */
(function () {
  const EMC = window.EMC;
  if (!EMC) return;
  const { CONST, clamp, arrow, label, chargeGlyph, eng, unit, roundRect } = EMC;
  const K = CONST.K;

  /* ---- physics helpers (also exported for the tiny toys) ---------------- */
  const SOFTEN = 0.04;          // softening = 4% of the world width ...
  const SOFT_MAX = 0.001;       // ... but never more than 1 mm: it only tames the
                                // r -> 0 singularity; lecture distances (0.10-0.70 m)
                                // stay exact to < 0.01%, so readouts match the slides
  const F_CAP = 1e4;            // newtons — arrows/readouts flag "maxed"
  const V_MAX = 30;             // m/s — release-mode speed cap (3 m world)
  const PUCK_MASS = 0.01;       // kg — the honest "play mass" of a puck
  const BALL_R = 0.07;          // m — conductor-ball radius for the image model

  const eps = worldM => Math.min(worldM * SOFTEN, SOFT_MAX);

  /* ---- pre-init input queue ------------------------------------------------
     Preset buttons are static markup; Sandbox.create() only binds them once
     the sandbox initialises (whenNear). A click that lands before that — an
     anchor jump straight to a panel plus a fast tap, or an automated driver —
     used to be dropped silently. Remember the latest unbound preset click per
     panel root and replay it once the real handler exists. The listener is
     registered once per document even though this script re-executes on every
     shell mount, and the queue lives on window so all executions share it. */
  if (!window.__emcSbPending) {
    window.__emcSbPending = new Map();          // root element -> preset id
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-sb-preset]');
      if (!b || b.dataset.sbBound) return;      // bound buttons take the normal path
      const root = b.closest('.sb-root');
      if (root) window.__emcSbPending.set(root, b.dataset.sbPreset);
    }, true);
  }

  /* Softened inverse-square magnitude between two point charges. */
  function pairF(qa, qb, rm, worldM) {
    const e2 = eps(worldM) * eps(worldM);
    return Math.min(K * Math.abs(qa * qb) / (rm * rm + e2), F_CAP);
  }

  /* Net field (N/C) at a world point from a list of charge objects. */
  function fieldAt(objects, xm, ym, worldM) {
    let ex = 0, ey = 0;
    const e2 = eps(worldM) * eps(worldM);
    for (const o of objects) {
      if (!o.q) continue;
      /* ISSUE #7.2: the ghost test charge FEELS E, never MAKES it — skip it
         as a source everywhere (fieldAt, traceLines seeds, forceOn). */
      if (o.type === 'test') continue;
      const dx = xm - o.x, dy = ym - o.y;
      const r2 = dx * dx + dy * dy + e2;
      const r = Math.sqrt(r2);
      const E = K * o.q / r2;                       // signed: source q
      ex += E * dx / r; ey += E * dy / r;
    }
    return { ex, ey, mag: Math.hypot(ex, ey) };
  }

  const Q_ADJ = { pos: 1, neg: 1, balloon: 1, sock: 1, ball: 1, rod: 1 };

  /* ---- share-code ------------------------------------------------------- */
  const TYPE_ID = { pos: 0, neg: 1, test: 2, balloon: 3, sock: 4, ball: 5, rod: 6, probe: 7 };
  const ID_TYPE = Object.keys(TYPE_ID);
  const TOG_CH = { arrows: 'a', lines: 'l', forces: 'f', numbers: 'n', trails: 't', slowmo: 's', release: 'r' };
  const CH_TOG = Object.keys(TOG_CH).reduce((m, k) => (m[TOG_CH[k]] = k, m), {});
  function encode(state) {
    try {
      const o = state.objects.map(ob => [TYPE_ID[ob.type] || 0,
        Math.round(ob.q * 1e15) / 1e15,
        Math.round(ob.x * 1e4) / 1e4, Math.round(ob.y * 1e4) / 1e4]);
      const t = Object.keys(state.toggles).filter(k => state.toggles[k] && TOG_CH[k]).map(k => TOG_CH[k]).join('');
      return btoa(encodeURIComponent(JSON.stringify({ v: 1, o, t })));
    } catch (e) { return ''; }
  }
  function decode(code) {
    try {
      const s = JSON.parse(decodeURIComponent(atob(code)));
      if (!s || s.v !== 1 || !Array.isArray(s.o)) return null;
      const objects = s.o.slice(0, 40).map(a => ({
        type: ID_TYPE[+a[0]] || 'pos',
        q: Number.isFinite(+a[1]) ? +a[1] : 0,
        x: +a[2] || 0, y: +a[3] || 0
      })).filter(o => Number.isFinite(o.x) && Number.isFinite(o.y));
      const toggleKeys = String(s.t || '').split('').map(c => CH_TOG[c]).filter(Boolean);
      return { objects, toggleKeys };
    } catch (e) { return null; }
  }

  /* ---- visual helpers ---------------------------------------------------- */
  const objRadius = (o, scale) => {
    const base = o.type === 'ball' ? 15 : o.type === 'balloon' ? 17 : o.type === 'sock' ? 14
      : o.type === 'rod' ? 12 : o.type === 'probe' ? 8 : o.type === 'test' ? 11
        : 12 + 8 * Math.cbrt(Math.abs(o.q) / 3e-6);
    return base * (o.wobble > 0 ? 1 + 0.16 * o.wobble : 1) * clamp(scale / 220, 0.7, 1.6);
  };
  const logLen = (F, maxLen) => {
    if (!(F > 0)) return 0;
    const n = clamp((Math.log10(F) + 9) / 13, 0, 1);
    return clamp(20 + n * maxLen, 20, maxLen + 20);
  };
  const magColor = mag => {
    const n = clamp((Math.log10(Math.max(mag, 1e-9)) + 1) / 9, 0, 1);
    return `hsl(${(205 - n * 205).toFixed(0)} 85% ${(58 + n * 8).toFixed(0)}%)`;
  };
  const dirWord = (fx, fy) => {
    if (!(Math.hypot(fx, fy) > 0)) return 'no net push';
    const a = (Math.atan2(fy, fx) * 180 / Math.PI + 360) % 360;
    const names = ['→ right', '↘ down-right', '↓ down', '↙ down-left', '← left', '↖ up-left', '↑ up', '↗ up-right'];
    return names[Math.round(a / 45) % 8];
  };

  /* ---- the factory ------------------------------------------------------- */
  function create(opts) {
    const canvas = document.getElementById(opts.canvasId);
    const root = document.getElementById(opts.rootId);
    if (!canvas || !root) return null;                 // page lacks this sandbox

    const WORLD_M = opts.worldM || 3;
    const MAX_OBJ = opts.maxObjects || 40;
    const prefix = opts.prefix;
    const gid = s => document.getElementById(prefix + '-' + s);   // runtime-built ids
    let worldH = WORLD_M * 0.6;                        // recomputed every frame

    const state = {
      objects: [],
      ruler: null,                                     // {x1,y1,x2,y2} metres
      tool: 'move',
      toggles: { arrows: false, lines: false, forces: true, numbers: true, trails: false, slowmo: false, release: false },
      newQ: 3e-6,                                      // |q| of the next stamped charge
      selected: null,
      dragging: null,
      hover: null,
      view: { scale: 1, ox: 0, oy: 0 },                // px = m*scale + o
      undo: [],
      maxed: false,
      lastInteract: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      predictShown: false,
      stars: {},
      _sheet: null
    };
    (opts.defaultToggles || []).forEach(t => { state.toggles[t] = true; });
    if (opts.ruler) state.ruler = { x1: WORLD_M * 0.2, y1: 9e9, x2: WORLD_M * 0.8, y2: 9e9 }; // y fixed on first resize

    let nextId = 1;
    const makeObj = (type, q, x, y) => ({ id: nextId++, type, q, x, y, vx: 0, vy: 0, wobble: 0, trail: [] });
    function seed(list) {
      state.objects = (list || []).map(o => makeObj(o.type, o.q || 0,
        clamp(o.x, 0.02, WORLD_M - 0.02), clamp(o.y, 0.02, Math.max(worldH, 0.1) - 0.02)));
    }

    /* -- world/screen mapping ---------------------------------------------- */
    /* `stage` is null only during the constructor's very first paint (Stage
       draws once while being built); render() therefore uses its own w. */
    let stage = null;
    const baseScale = () => Math.max(stage ? stage.w : 1, 1) / WORLD_M;
    const toPx = (x, y) => ({ x: x * state.view.scale + state.view.ox, y: y * state.view.scale + state.view.oy });
    const toM = (px, py) => ({ x: (px - state.view.ox) / state.view.scale, y: (py - state.view.oy) / state.view.scale });
    function resetView() {
      state.view = { scale: baseScale(), ox: 0, oy: 0 };
      worldH = Math.max(stage.h, 1) / baseScale();
      if (state.ruler && state.ruler.y1 > 1e6) { state.ruler.y1 = state.ruler.y2 = worldH * 0.85; }
    }

    function forceOn(o) {
      let fx = 0, fy = 0;
      for (const b of state.objects) {
        if (b === o || b.type === 'test') continue;   // #7.2: ghost never a source
        let dx = o.x - b.x, dy = o.y - b.y;
        let rm = Math.hypot(dx, dy);
        if (rm < 1e-6) {
          /* exact overlap: the softened magnitude is finite, but the direction
             is undefined — pick a deterministic push-apart axis so release
             mode can always separate the pair again. */
          rm = 1e-6; dx = rm; dy = 0;
        }
        if (o.q !== 0 && b.q !== 0) {
          const F = pairF(o.q, b.q, rm, WORLD_M);
          const s = o.q * b.q > 0 ? 1 : -1;            // repel along +d, attract along −d
          fx += s * F * dx / rm; fy += s * F * dy / rm;
        }
      }
      return { fx, fy, mag: Math.hypot(fx, fy) };
    }
    const fieldAtM = (xm, ym) => fieldAt(state.objects, xm, ym, WORLD_M);
    const netCharge = () => state.objects.reduce((s, o) => s + o.q, 0);

    const api = {
      get objects() { return state.objects; },
      get selected() { return state.selected; },
      get toggles() { return state.toggles; },
      get view() { return state.view; },
      get stage() { return stage; },
      get world() { return { w: WORLD_M, h: worldH }; },
      forceOn, fieldAtM, netCharge, toPx, toM, dirWord, state,
      detailOn: () => document.documentElement.dataset.detail !== 'off'
    };

    /* -- undo: snapshots are taken BEFORE each mutation ----------------------- */
    function snapshot() {
      state.undo.push(JSON.stringify(state.objects.map(o => [o.type, o.q, o.x, o.y])));
      if (state.undo.length > 30) state.undo.shift();
    }
    function undo() {
      const s = state.undo.pop();
      if (!s) { EMC.toast('Nothing to undo'); return; }
      try {
        const list = JSON.parse(s);
        state.objects = list.map(a => makeObj(a[0], a[1], a[2], a[3]));
        state.selected = null;
        refresh();
      } catch (e) { /* corrupt snapshot: ignore */ }
    }


    /* -- release-mode integration (semi-implicit Euler, capped) ------------------- */
    let lastT = 0;
    function stepPhysics(dt) {
      state.maxed = false;
      for (const o of state.objects) {
        if (state.dragging && o === state.dragging.ref) continue;
        if (o.type === 'probe') continue;
        if (o.type === 'test') {
          /* the ghost "leaf" rides the field: direction from E, speed from
             log|E| — a visualisation of the field flow, labelled as such. */
          const f = fieldAtM(o.x, o.y);
          if (f.mag > 0) {
            const sp = clamp((Math.log10(f.mag) + 2) * 0.9, 0.15, 5);
            o.x += f.ex / f.mag * sp * dt; o.y += f.ey / f.mag * sp * dt;
          }
        } else if (state.toggles.release && o.q !== 0) {
          const F = forceOn(o);
          if (F.mag >= F_CAP * 0.995) state.maxed = true;
          o.vx += F.fx / PUCK_MASS * dt; o.vy += F.fy / PUCK_MASS * dt;
          const sp = Math.hypot(o.vx, o.vy);
          if (sp > V_MAX) { o.vx *= V_MAX / sp; o.vy *= V_MAX / sp; }
          o.x += o.vx * dt; o.y += o.vy * dt;
        } else if (!state.toggles.release) {
          o.vx = o.vy = 0;
        }
        /* walls: bounce with 0.6 restitution; the flat squash is the wobble */
        const m = 0.03;
        if (o.x < m) { o.x = m; o.vx = Math.abs(o.vx) * 0.6; o.wobble = Math.max(o.wobble, 0.5); }
        if (o.x > WORLD_M - m) { o.x = WORLD_M - m; o.vx = -Math.abs(o.vx) * 0.6; o.wobble = Math.max(o.wobble, 0.5); }
        if (o.y < m) { o.y = m; o.vy = Math.abs(o.vy) * 0.6; o.wobble = Math.max(o.wobble, 0.5); }
        if (o.y > worldH - m) { o.y = worldH - m; o.vy = -Math.abs(o.vy) * 0.6; o.wobble = Math.max(o.wobble, 0.5); }
        if (state.toggles.trails) {
          o.trail.push({ x: o.x, y: o.y });
          if (o.trail.length > 120) o.trail.shift();
        } else if (o.trail.length) o.trail.length = 0;
      }
        const warn = gid('warn');
      if (warn) {
        const msg = state.maxed ? 'forces maxed — close-range softening is keeping the sim stable' : '';
        if (warn.textContent !== msg) warn.textContent = msg;
        warn.hidden = !msg;
      }
    }

    /* -- field-line tracing (world coords, px stepping) ------------------------- */
    function traceLines(ctx, w, h, lite) {
      const seeds = state.objects.filter(o => o.q > 0 && o.type !== 'test');
      const sources = seeds.length ? seeds : state.objects.filter(o => o.q < 0 && o.type !== 'test');
      const step = lite ? 3.4 : 2.6, maxSteps = lite ? 420 : 900;
      ctx.save(); ctx.lineWidth = 1.35; ctx.lineCap = 'round';
      for (const c of sources) {
        const p = toPx(c.x, c.y);
        const nLines = lite ? clamp(Math.round(1.5 * Math.abs(c.q) * 1e6), 6, 14)
          : clamp(Math.round(3 * Math.abs(c.q) * 1e6), 6, 26);
        const startR = objRadius(c, state.view.scale) + 3;
        const offset = c.q > 0 ? 0 : Math.PI / nLines;
        for (let i = 0; i < nLines; i++) {
          const a = offset + (i / nLines) * Math.PI * 2;
          let x = p.x + Math.cos(a) * startR, y = p.y + Math.sin(a) * startR;
          let hit = false;
          const heads = [];                       // direction arrowheads along this line
          let travelled = 0, nextHead = 46;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let s = 0; s < maxSteps; s++) {
            const m = toM(x, y);
            const f = fieldAtM(m.x, m.y);
            if (f.mag < 1e-9) break;
            const sgn = c.q > 0 ? 1 : -1;
            x += sgn * (f.ex / f.mag) * step; y += sgn * (f.ey / f.mag) * step;
            travelled += step;
            if (travelled >= nextHead) { heads.push([x, y, Math.atan2(f.ey, f.ex)]); nextHead += 88; }
            if (x < -40 || x > w + 40 || y < -40 || y > h + 40) break;
            ctx.lineTo(x, y);
            for (const other of state.objects) {
              if (other === c || !other.q || other.type === 'test' || Math.sign(other.q) === Math.sign(c.q)) continue;
              const o = toPx(other.x, other.y);
              if (Math.hypot(x - o.x, y - o.y) < objRadius(other, state.view.scale) + 2) { hit = true; break; }
            }
            if (hit) break;
          }
          ctx.strokeStyle = c.q > 0 ? 'rgba(248,174,190,.7)' : 'rgba(168,211,224,.7)';
          ctx.stroke();
          /* arrowheads point along E itself (toward −), whichever end the line was traced from */
          ctx.fillStyle = c.q > 0 ? 'rgba(250,192,205,.95)' : 'rgba(207,233,242,.95)';
          for (const hd of heads) {
            ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(hd[2]);
            ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.2); ctx.lineTo(-4, 3.2); ctx.closePath(); ctx.fill();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }

    function drawVectorGrid(ctx, w, h) {
      const step = w < 520 ? 46 : 38;
      ctx.save();
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          let onObj = false;
          for (const o of state.objects) {
            const p = toPx(o.x, o.y);
            if (Math.hypot(x - p.x, y - p.y) < objRadius(o, state.view.scale) + 6) { onObj = true; break; }
          }
          if (onObj) continue;
          const m = toM(x, y);
          const f = fieldAtM(m.x, m.y);
          if (f.mag <= 0) continue;
          const len = clamp(5 + (Math.log10(f.mag) + 3) * 2.6, 3, step * 0.48);
          const ux = f.ex / f.mag, uy = f.ey / f.mag;
          arrow(ctx, x - ux * len / 2, y - uy * len / 2, x + ux * len / 2, y + uy * len / 2,
            { color: magColor(f.mag), width: 1.5, head: 4.5 });
        }
      }
      ctx.restore();
    }

    /* -- object skins (all flat) ---------------------------------------------- */
    function neutralDisc(ctx, p, r) {
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#c9c6bb'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#3a3d45'; ctx.stroke();
    }
    function drawObject(ctx, o) {
      const p = toPx(o.x, o.y);
      const r = objRadius(o, state.view.scale);
      if (o.type === 'test') {
        ctx.save();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = '#f6d36b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        label(ctx, 'q₀', p.x, p.y + 1, { color: '#f6d36b', size: 11, weight: '800' });
      } else if (o.type === 'probe') {
        ctx.save();
        ctx.strokeStyle = '#b5d777'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x - r - 5, p.y); ctx.lineTo(p.x + r + 5, p.y);
        ctx.moveTo(p.x, p.y - r - 5); ctx.lineTo(p.x, p.y + r + 5);
        ctx.stroke(); ctx.restore();
      } else if (o.type === 'sock') {
        roundRect(ctx, p.x - r * 0.7, p.y - r, r * 1.4, r * 2, r * 0.5);
        ctx.fillStyle = o.q < 0 ? '#a8d3e0' : o.q > 0 ? '#f8aebe' : '#d5b8d8';
        ctx.fill();
        ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2; ctx.stroke();
        roundRect(ctx, p.x - r * 0.7, p.y - r, r * 1.4, r * 0.5, r * 0.25);
        ctx.fillStyle = 'rgba(23,24,28,.3)'; ctx.fill();
        if (o.q) label(ctx, o.q > 0 ? '+' : '−', p.x, p.y + r * 0.5, { color: '#17181c', size: 13, weight: '800' });
      } else if (o.type === 'rod') {
        roundRect(ctx, p.x - r * 2.1, p.y - r * 0.42, r * 4.2, r * 0.84, r * 0.4);
        ctx.fillStyle = '#d5b8d8'; ctx.fill();
        ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2; ctx.stroke();
        if (o.q) label(ctx, o.q > 0 ? '+' : '−', p.x, p.y + 1, { color: '#17181c', size: 12, weight: '800' });
      } else if (o.type === 'balloon') {
        ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.12, r, 0, Math.PI * 2);
        ctx.fillStyle = o.q < 0 ? '#a8d3e0' : o.q > 0 ? '#f8aebe' : '#e6e2d6';
        ctx.fill(); ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y + r - 3); ctx.lineTo(p.x + 4, p.y + r - 3); ctx.lineTo(p.x, p.y + r + 5);
        ctx.closePath(); ctx.fillStyle = '#3a3d45'; ctx.fill();
        if (o.q) label(ctx, o.q > 0 ? '+' : '−', p.x, p.y - r * 0.12, { color: '#17181c', size: 14, weight: '800' });
      } else if (o.q === 0) {
        neutralDisc(ctx, p, r);
        if (o.type === 'ball') {
          ctx.save(); ctx.strokeStyle = 'rgba(23,24,28,.4)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      } else {
        /* soft halo: a flat translucent disc sized by the charge, so strong sources read at a glance */
        ctx.save();
        ctx.fillStyle = o.q > 0 ? 'rgba(248,174,190,.13)' : 'rgba(168,211,224,.13)';
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.85, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        chargeGlyph(ctx, p.x, p.y, r, o.q, { pulse: o.wobble });
      }
      if (state.toggles.numbers && o.q && o.type !== 'test') {
        label(ctx, `${o.q > 0 ? '+' : '−'}${unit(Math.abs(o.q), 'C', 2)}`, p.x, p.y + r + 14,
          { color: o.q > 0 ? '#fac0cd' : '#cfe9f2', size: 10.5 });
      }
      if (state.selected === o) {
        ctx.save(); ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }

    /* -- main render ----------------------------------------------------------- */
    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      worldH = h * WORLD_M / Math.max(w, 1);           // world height in metres (zoom-independent)

      /* faint half-metre grid through the view transform */
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.07)'; ctx.lineWidth = 1;
      for (let gx = 0; gx <= WORLD_M; gx += 0.5) {
        const p = toPx(gx, 0);
        if (p.x >= -2 && p.x <= w + 2) { ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, h); ctx.stroke(); }
      }
      for (let gy = 0; gy <= worldH + 0.5; gy += 0.5) {
        const p = toPx(0, gy);
        if (p.y >= -2 && p.y <= h + 2) { ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(w, p.y); ctx.stroke(); }
      }
      ctx.restore();

      if (!state.objects.length) {
        label(ctx, opts.emptyText || 'Pick a tool and tap the canvas — everything you place is draggable',
          w / 2, h / 2, { color: 'rgba(169,186,214,.85)', size: 13, weight: '500' });
        return;
      }

      const lite = !!state.dragging || state.objects.length > 12 || EMC.lowTier;
      if (state.toggles.lines) traceLines(ctx, w, h, lite);
      if (state.toggles.arrows) drawVectorGrid(ctx, w, h);

      /* trails (flat colour, opacity steps only) */
      if (state.toggles.trails) {
        ctx.save(); ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (const o of state.objects) {
          if (o.trail.length < 2) continue;
          for (let i = 1; i < o.trail.length; i += 3) {
            const a = toPx(o.trail[i - 1].x, o.trail[i - 1].y);
            const b = toPx(o.trail[i].x, o.trail[i].y);
            const al = (0.06 + 0.3 * i / o.trail.length).toFixed(2);
            ctx.strokeStyle = o.q >= 0 ? `rgba(248,174,190,${al})` : `rgba(168,211,224,${al})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.restore();
      }

      /* force arrows: net on every charged object; dashed green per-pair
         ghosts for the selected one (Lesson 2's component story, live). */
      if (state.toggles.forces) {
        const maxLen = clamp(w * 0.13, 40, 110);
        for (const o of state.objects) {
          if (!o.q || o.type === 'test') continue;
          const F = forceOn(o);
          if (F.mag <= 0) continue;
          const p = toPx(o.x, o.y);
          const L = logLen(F.mag, maxLen);
          const ux = F.fx / F.mag, uy = F.fy / F.mag;
          const r = objRadius(o, state.view.scale);
          arrow(ctx, p.x + ux * (r + 3), p.y + uy * (r + 3), p.x + ux * (r + 3 + L), p.y + uy * (r + 3 + L),
            { color: F.mag >= F_CAP * 0.995 ? '#f6d36b' : '#f8aebe', width: 3.4, head: 11 });
          if (o === state.selected) {
            for (const b of state.objects) {
              if (b === o) continue;
              const dx = o.x - b.x, dy = o.y - b.y, rm = Math.hypot(dx, dy);
              if (rm < 1e-9) continue;
              let F2 = 0, s = 0;
              if (o.q !== 0 && b.q !== 0) { F2 = pairF(o.q, b.q, rm, WORLD_M); s = o.q * b.q > 0 ? 1 : -1; }
              if (!F2) continue;
              const L2 = logLen(F2, maxLen * 0.8);
              const ux2 = s * dx / rm, uy2 = s * dy / rm;
              arrow(ctx, p.x, p.y, p.x + ux2 * L2, p.y + uy2 * L2,
                { color: 'rgba(181,215,119,.85)', width: 2, head: 8, dash: [5, 4] });
            }
          }
        }
        /* the ghost shows F = q0·E on itself */
        const ghost = state.objects.find(o => o.type === 'test');
        if (ghost) {
          const f = fieldAtM(ghost.x, ghost.y);
          if (f.mag > 0) {
            const p = toPx(ghost.x, ghost.y);
            const L = clamp(10 + (Math.log10(f.mag) + 3) * 5, 12, 54);
            arrow(ctx, p.x, p.y, p.x + f.ex / f.mag * L, p.y + f.ey / f.mag * L,
              { color: '#f6d36b', width: 2.6, head: 9 });
          }
        }
      }

      /* ruler */
      if (state.ruler && state.ruler.y1 < 1e6) {
        const a = toPx(state.ruler.x1, state.ruler.y1), b = toPx(state.ruler.x2, state.ruler.y2);
        ctx.save();
        ctx.strokeStyle = 'rgba(246,211,107,.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        for (const e of [a, b]) {
          ctx.fillStyle = '#f6d36b'; ctx.beginPath(); ctx.arc(e.x, e.y, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#17181c'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.restore();
        const dm = Math.hypot(state.ruler.x2 - state.ruler.x1, state.ruler.y2 - state.ruler.y1);
        label(ctx, `${dm.toFixed(2)} m`, (a.x + b.x) / 2, (a.y + b.y) / 2 - 12, { color: '#f6d36b', size: 11.5, weight: '700' });
      }

      for (const o of state.objects) drawObject(ctx, o);

      if (Math.abs(state.view.scale / baseScale() - 1) > 0.02) {
        label(ctx, `zoom ${(state.view.scale / baseScale()).toFixed(1)}×`, w - 8, h - 10,
          { color: 'rgba(169,186,214,.8)', size: 10.5, align: 'right' });
      }
    }

    stage = new EMC.Stage(canvas, (ctx, w, h) => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const dt = lastT ? clamp((now - lastT) / 1000, 0, 0.033) : 1 / 60;
      lastT = now;
      if (state.toggles.release) stepPhysics(dt * (state.toggles.slowmo ? 0.25 : 1));
      for (const o of state.objects) if (o.wobble > 0) o.wobble = Math.max(0, o.wobble - 0.06);
      render(ctx, w, h);
      /* PERF: a still scene must not be re-traced at 60 fps. Field lines and
         the vector grid cost thousands of fieldAt() calls per frame, and with
         several sandboxes on one chapter page that froze the tab. Once nothing
         can change on its own, park the Stage's rAF chain; refresh() and the
         pointer/wheel/touch paths wake it again on any interaction. */
      if (stage && isSettled()) stage.setIdle(true);
    }, { animate: true, intro: opts.intro === undefined ? 480 : opts.intro });
    resetView();

    /* Nothing moves on its own: no release-mode physics, no ghost leaf riding
       the field, no wobble decay, no drag/pinch in progress, intro finished. */
    const bornAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const introMs = opts.intro === undefined ? 480 : opts.intro;
    function isSettled() {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (t - bornAt < introMs + 150) return false;
      if (state.toggles.release || state.dragging || pinching) return false;
      for (const o of state.objects) if (o.type === 'test' || o.wobble > 0) return false;
      return true;
    }

    /* -- readouts --------------------------------------------------------------- */
    function readouts() {
      const count = gid('count'); if (count) count.textContent = String(state.objects.length);
      const net = gid('net');
      if (net) {
        const nq = netCharge();
        net.textContent = nq === 0 ? '0 C' : `${nq < 0 ? '−' : '+'}${unit(Math.abs(nq), 'C', 2)}`;
        net.className = 'stat-value ' + (nq > 0 ? 'hl-rose' : nq < 0 ? 'hl-cyan' : '');
      }
      const sel = gid('sel'), sub = gid('sub'), easy = gid('sel-easy');
      const o = state.selected;
      if (o && (o.q || o.type === 'probe')) {
        if (o.type === 'probe' || o.type === 'ball' && o.q === 0) {
          const f = fieldAtM(o.x, o.y);
          if (sel) sel.textContent = unit(f.mag, 'N/C', 3);
          if (easy) easy.textContent = f.mag > 1e-6 ? `field here: ${dirWord(f.ex, f.ey)}` : 'dead calm — field is zero here';
          if (sub) sub.innerHTML = `E = Σ kqᵢ r̂ᵢ/rᵢ² = <b>${unit(f.mag, 'N/C', 3)}</b> · F on a +1 nC ghost here = ${unit(f.mag * 1e-9, 'N', 2)}`;
        } else {
          const F = forceOn(o);
          if (sel) sel.textContent = unit(F.mag, 'N', 3);
          if (easy) easy.textContent = F.mag > 0
            ? `${F.mag >= 10 ? 'strong' : F.mag >= 0.05 ? 'steady' : 'gentle'} push ${dirWord(F.fx, F.fy)}`
            : 'floating — no net push';
          if (sub) {
            const others = state.objects.filter(b => b !== o && b.q);
            sub.innerHTML = others.length
              ? `F on selected = Σ k·|q·qᵢ|/rᵢ² over ${others.length} charge${others.length > 1 ? 's' : ''} = <b>${unit(F.mag, 'N', 3)}</b> ${dirWord(F.fx, F.fy)}`
              : 'add another charge — one charge alone feels no Coulomb force';
          }
        }
      } else {
        if (sel) sel.textContent = '—';
        if (easy) easy.textContent = 'select an object to read its force';
        if (sub) sub.textContent = 'Tap any object: dashed green arrows are its individual pulls, the thick arrow is the vector sum.';
      }
      const warnEl = gid('warn');
      if (warnEl && !state.toggles.release) {
        let mx = 0;
        for (const o of state.objects) if (o.q) { const F = forceOn(o); if (F.mag > mx) mx = F.mag; }
        const msg = mx >= F_CAP * 0.995 ? 'forces maxed \u2014 close-range softening is keeping the sim stable' : '';
        if (warnEl.textContent !== msg) warnEl.textContent = msg;
        warnEl.hidden = !msg;
      }
      const tally = gid('tally');
      if (tally) {
        const nq = netCharge();
        tally.textContent = `Room total ${nq < 0 ? '−' : '+'}${unit(Math.abs(nq), 'C', 3)} — it never changes, whatever you do`;
      }
      if (opts.readouts) opts.readouts(api);
    }
    function refresh() { if (stage) stage.setIdle(false); stage.draw(); readouts(); checkChallenges(); }

    /* -- toolbar ----------------------------------------------------------------- */
    const TOOL_LABEL = {
      'add+': 'a + charge', 'add-': 'a − charge', test: 'the ghost test charge q₀', balloon: 'a balloon',
      sock: 'a sock', ball: 'a neutral metal ball', rod: 'an insulating rod', probe: 'an E probe', ruler: 'the ruler', erase: 'the eraser'
    };
    function setTool(t) {
      state.tool = t;
      root.querySelectorAll('[data-sb-tool]').forEach(b =>
        b.setAttribute('aria-pressed', String(b.dataset.sbTool === t)));
      const tip = gid('tip');
      if (tip) {
        tip.textContent = t === 'move' ? 'Drag anything — charges, the ghost, the probe, even the ruler’s ends. Long-press an object to edit it.'
          : t === 'erase' ? 'Tap an object to remove it.'
            : t === 'ruler' ? 'Tap two points to measure; drag the yellow ends to re-measure anything.'
              : `Tap the canvas to place ${TOOL_LABEL[t] || t}. Wheel or long-press edits its charge.`;
      }
      canvas.style.cursor = t === 'move' ? 'grab' : t === 'erase' ? 'not-allowed' : 'copy';
    }
    root.querySelectorAll('[data-sb-tool]').forEach(b =>
      stage.listen(b, 'click', () => { setTool(b.dataset.sbTool); touch(); }));
    root.querySelectorAll('[data-sb-act]').forEach(b => stage.listen(b, 'click', () => {
      const a = b.dataset.sbAct;
      touch();
      if (a === 'undo') undo();
      if (a === 'clear') { snapshot(); state.objects = []; state.selected = null; refresh(); }
      if (a === 'random') { snapshot(); randomScene(); refresh(); }
      if (a === 'copy') copyShare();
      if (a === 'predict') showPredict(true);
      if (a === 'why') showDiscovery();
    }));
    root.querySelectorAll('[data-sb-toggle]').forEach(b => stage.listen(b, 'change', () => {
      state.toggles[b.dataset.sbToggle] = b.checked; touch(); refresh();
    }));
    const qSlider = root.querySelector('[data-sb-q]');
    if (qSlider) stage.listen(qSlider, 'input', () => {
      state.newQ = (+qSlider.value || 3) * 1e-6;
      const v = gid('qv'); if (v) v.textContent = `${(+qSlider.value).toFixed(1)} µC`;
    });
    root.querySelectorAll('[data-sb-preset]').forEach(b => {
      b.dataset.sbBound = '1';                  // bound: the pre-init capture queue skips it
      stage.listen(b, 'click', () => {
      const p = (opts.presets || []).find(x => x.id === b.dataset.sbPreset);
      if (!p) return;
      snapshot();
      seed(typeof p.objects === 'function' ? p.objects({ w: WORLD_M, h: worldH }) : p.objects);
      if ('ruler' in p) state.ruler = p.ruler;
      if (p.zoom) {                                   // presets may zoom into small distances
        state.view.scale = baseScale() * p.zoom;
        state.view.ox = stage.w / 2 - (p.cx === undefined ? WORLD_M / 2 : p.cx) * state.view.scale;
        state.view.oy = stage.h / 2 - (p.cy === undefined ? worldH / 2 : p.cy) * state.view.scale;
      } else resetView();
      state.selected = null; refresh();
      EMC.toast(`Preset: ${p.label}`);
      touch();
      });
    });

    function randomScene() {
      const n = 2 * (2 + Math.floor(Math.random() * 3));   // even: pairs cancel exactly
      const list = [];
      for (let i = 0; i < n; i += 2) {
        const q = (0.5 + Math.random() * 5.5) * 1e-6;
        list.push({ type: 'pos', q, x: 0.15 + Math.random() * (WORLD_M - 0.3), y: 0.15 + Math.random() * (worldH - 0.3) });
        if (i + 1 < n) list.push({ type: 'neg', q: -q, x: 0.15 + Math.random() * (WORLD_M - 0.3), y: 0.15 + Math.random() * (worldH - 0.3) });
      }
      seed(list);                                        // net-neutral by construction
    }

    /* -- share code --------------------------------------------------------------- */
    function shareCode() { return encode(state); }
    function copyShare() {
      const code = shareCode();
      if (!code) return;
      /* #7.4a: the key carries the sandbox id so a code only ever loads into
         the sandbox it came from; #7.4b: links copied inside the homepage
         reader point at the chapter's standalone page, which is the only
         place a #s- hash can mount. */
      let base = location.pathname;
      if (/(^|\/)index\.html$/.test(base) || base === '/' || base === '') {
        const R = window.EMC_REGISTRY;
        const ch = R && R.chapters.find(c => (c.sims || []).indexOf(canvas.id) >= 0);
        if (ch) base = '/' + ch.path;
      }
      const url = location.origin + base + '#s-' + canvas.id + '=' + code;
      try { if (window.history && history.replaceState) history.replaceState(null, '', url); } catch (e) { /* file:// */ }
      const done = () => EMC.toast('Setup link copied to the clipboard');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url));
      } else fallbackCopy(url);
    }
    function fallbackCopy(url) {
      try { if (window.prompt) window.prompt('Copy this setup link:', url); } catch (e) { /* nothing to do */ }
    }

    /* -- challenges ------------------------------------------------------------------ */
    function loadStars() {
      try { state.stars = JSON.parse(EMC.store.get('emc.stars.v1') || '{}')[prefix] || {}; }
      catch (e) { state.stars = {}; }
    }
    function saveStars() {
      try {
        const all = JSON.parse(EMC.store.get('emc.stars.v1') || '{}');
        all[prefix] = state.stars;
        EMC.store.set('emc.stars.v1', JSON.stringify(all));
      } catch (e) { /* storage blocked: stars are cosmetic */ }
    }
    function buildChallenges() {
      const host = root.querySelector('[data-sb-chal]');
      if (!host) return;
      host.textContent = '';
      for (const ch of (opts.challenges || [])) {
        const wrap = document.createElement('span');
        wrap.className = 'sb-chal';
        const star = document.createElement('span');
        star.className = 'sb-star' + (state.stars[ch.id] ? ' got' : '');
        star.textContent = '\u2605'; star.setAttribute('aria-hidden', 'true');
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn btn-sm';
        btn.textContent = ch.text;
        stage.listen(btn, 'click', () => EMC.toast(`Hint: ${ch.hint}`));
        wrap.appendChild(star); wrap.appendChild(btn);
        host.appendChild(wrap);
        ch._star = star;
      }
      const why = document.createElement('button');
      why.type = 'button'; why.className = 'btn btn-sm'; why.textContent = 'What am I learning?';
      stage.listen(why, 'click', showDiscovery);
      host.appendChild(why);
    }
    function checkChallenges() {
      for (const ch of (opts.challenges || [])) {
        if (state.stars[ch.id]) continue;
        let won = false;
        try { won = !!ch.test(api); } catch (e) { won = false; }
        if (won) {
          state.stars[ch.id] = true; saveStars();
          if (ch._star) ch._star.classList.add('got');
          EMC.toast(`\u2605 ${ch.won || 'Challenge complete'}`);
          showDiscovery();
        }
      }
    }
    function showDiscovery() {
      const box = root.querySelector('[data-sb-discover]');
      if (!box || !opts.discovery) return;
      box.hidden = false;
      box.textContent = '';
      const s = document.createElement('span');
      s.textContent = 'You just showed that ' + opts.discovery.text + ' ';
      const a = document.createElement('a');
      a.className = 'link'; a.href = opts.discovery.href; a.textContent = 'Back to the Summary \u2192';
      box.appendChild(s); box.appendChild(a);
    }

    /* -- predict-then-run (computed from the live state, always skippable) -------- */
    function showPredict(force) {
      const box = root.querySelector('[data-sb-predict]');
      if (!box || state.predictShown) return;
      if (!force) {
        try { if (sessionStorage.getItem('emc.predict.off')) return; } catch (e) { /* ignore */ }
      }
      const charged = state.objects.filter(o => o.q);
      const ghost = state.objects.find(o => o.type === 'test');
      let q = null;
      if (ghost && charged.length) {
        const f = fieldAtM(ghost.x, ghost.y);
        if (f.mag > 1e-3) {
          const dirs = ['\u2192 right', '\u2193 down', '\u2190 left', '\u2191 up'];
          const a = (Math.atan2(f.ey, f.ex) * 180 / Math.PI + 360) % 360;
          const correct = dirs[Math.round(a / 90) % 4];
          q = {
            text: 'Predict, then run: let the ghost go right where it is. Which way does it accelerate?',
            opts: dirs, answer: correct,
            why: `E points ${correct} here, and a positive q\u2080 accelerates along E (F = q\u2080E).`
          };
        }
      }
      if (!q && charged.length >= 2) {
        q = {
          text: 'Predict, then run: drag two of these charges to twice their distance. The force between that pair becomes\u2026',
          opts: ['a quarter', 'a half', 'double'], answer: 'a quarter',
          why: 'F = k|q\u2081q\u2082|/r\u00B2 is inverse-square: 2\u00D7 r puts 2\u00B2 = 4 in the denominator.'
        };
      }
      if (!q) return;
      state.predictShown = true;
      box.hidden = false; box.textContent = '';
      const p = document.createElement('span'); p.className = 'sb-predict-q'; p.textContent = q.text;
      box.appendChild(p);
      const row = document.createElement('span'); row.className = 'btn-group';
      for (const o of q.opts) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = o;
        stage.listen(b, 'click', () => {
          const good = o === q.answer;
          box.textContent = '';
          const fb = document.createElement('span');
          fb.className = 'sb-predict-fb ' + (good ? 'good' : 'bad');
          fb.textContent = (good ? '\u2713 Right. ' : '\u2717 Not quite. ') + q.why;
          box.appendChild(fb);
          stage.timer(() => { box.hidden = true; state.predictShown = false; }, 4200);
        });
        row.appendChild(b);
      }
      const skip = document.createElement('button');
      skip.type = 'button'; skip.className = 'btn btn-sm'; skip.textContent = 'not now';
      stage.listen(skip, 'click', () => {
        box.hidden = true; state.predictShown = false;
        try { sessionStorage.setItem('emc.predict.off', '1'); } catch (e) { /* ignore */ }
      });
      row.appendChild(skip);
      box.appendChild(row);
    }
    const touch = () => { state.lastInteract = (typeof performance !== 'undefined' ? performance.now() : Date.now()); };
    stage.interval(() => {
      if (!state.predictShown && (typeof performance !== 'undefined' ? performance.now() : Date.now()) - state.lastInteract > 20000) showPredict(false);
    }, 2000);

    /* -- pointer: drag, stamp, select, long-press --------------------------------- */
    function hitTest(px, py) {
      let best = null, bd = 1e9;
      for (const o of state.objects) {
        const p = toPx(o.x, o.y);
        const d = Math.hypot(px - p.x, py - p.y);
        if (d < objRadius(o, state.view.scale) + 12 && d < bd) { bd = d; best = o; }
      }
      return best;
    }
    function hitRuler(px, py) {
      if (!state.ruler || state.ruler.y1 > 1e6) return null;
      const a = toPx(state.ruler.x1, state.ruler.y1), b = toPx(state.ruler.x2, state.ruler.y2);
      if (Math.hypot(px - a.x, py - a.y) < 16) return 'r1';
      if (Math.hypot(px - b.x, py - b.y) < 16) return 'r2';
      return null;
    }
    let lpTimer = 0, lpMoved = false, downAt = null;
    function closeSheet() {
      if (state._sheet) { state._sheet.remove(); state._sheet = null; }
    }
    function openSheet(o) {
      closeSheet();
      const sheet = document.createElement('div');
      sheet.className = 'sb-sheet';
      const title = document.createElement('b');
      title.textContent = o.type === 'ball' && !o.q ? 'Neutral metal ball'
        : `${o.type} \u00B7 ${o.q >= 0 ? '+' : '\u2212'}${unit(Math.abs(o.q), 'C', 2)}`;
      sheet.appendChild(title);
      const mk = (txt, fn) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = txt;
        b.addEventListener('click', () => { fn(); refresh(); });
        sheet.appendChild(b);
      };
      if (Q_ADJ[o.type]) {
        const bump = d => {
          snapshot();
          const s = Math.sign(o.q) || 1;
          o.q = s * clamp(Math.abs(o.q) + d, 0, 20e-6);
        };
        mk('flip sign', () => { snapshot(); o.q = -o.q; });
        mk('\u22120.5 \u00B5C', () => bump(-0.5e-6));
        mk('+0.5 \u00B5C', () => bump(+0.5e-6));
        mk('duplicate', () => {
          if (state.objects.length >= MAX_OBJ) { EMC.toast(`${MAX_OBJ} objects is the soft cap`, 'warn'); return; }
          snapshot();
          state.objects.push(makeObj(o.type, o.q, clamp(o.x + 0.2, 0.02, WORLD_M - 0.02), clamp(o.y + 0.15, 0.02, worldH - 0.02)));
        });
      }
      mk('delete', () => {
        snapshot();
        state.objects = state.objects.filter(x => x !== o);
        if (state.selected === o) state.selected = null;
        closeSheet(); refresh();
      });
      mk('done', closeSheet);
      root.appendChild(sheet);
      state._sheet = sheet;
    }

    stage.onPointer(p => {
      if (pinching) return;                              // multi-touch owns the gesture
      if (p.type === 'down') {
        touch(); closeSheet();
        downAt = { x: p.x, y: p.y };
        lpMoved = false;
        const rk = hitRuler(p.x, p.y);
        if (rk && state.tool !== 'erase') { state.dragging = { kind: rk, ref: state.ruler }; canvas.classList.add('dragging'); return; }
        const o = hitTest(p.x, p.y);
        if (state.tool === 'erase') {
          if (o) { snapshot(); state.objects = state.objects.filter(x => x !== o); if (state.selected === o) state.selected = null; refresh(); }
          return;
        }
        if (state.tool === 'ruler' && !o) {
          const m = toM(p.x, p.y);
          snapshot();
          if (!state.ruler || state.ruler.y1 > 1e6) state.ruler = { x1: m.x, y1: m.y, x2: m.x, y2: m.y };
          else { state.ruler.x2 = m.x; state.ruler.y2 = m.y; }
          refresh(); return;
        }
        if (o) {
          snapshot();                                    // pre-move state for undo
          state.selected = o;
          state.dragging = { kind: 'obj', ref: o };
          canvas.classList.add('grabbing'); canvas.classList.add('dragging');
          lpTimer = stage.timer(() => { if (!lpMoved) openSheet(o); }, 380);
          refresh();
          return;
        }
        /* empty space: stamp the current tool */
        const stampType = { 'add+': 'pos', 'add-': 'neg', test: 'test', balloon: 'balloon', sock: 'sock', ball: 'ball', rod: 'rod', probe: 'probe' }[state.tool];
        if (stampType) {
          if (state.objects.length >= MAX_OBJ) {
            EMC.toast(`${MAX_OBJ} objects is the soft cap \u2014 erase one first`, 'warn');
            return;
          }
          snapshot();
          const m = toM(p.x, p.y);
          const q = stampType === 'test' ? 1e-9 : (stampType === 'probe' || stampType === 'ball') ? 0
            : (state.tool === 'add-' ? -state.newQ : state.newQ);
          const no = makeObj(stampType, q, clamp(m.x, 0.03, WORLD_M - 0.03), clamp(m.y, 0.03, worldH - 0.03));
          state.objects.push(no);
          state.selected = no;
          refresh();
        } else if (state.tool === 'move') {
          state.selected = null; refresh();
        }
      } else if (p.type === 'move') {
        if (downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) > 8) {
          lpMoved = true;
          if (lpTimer) { stage.clearTimer(lpTimer); lpTimer = 0; }
        }
        if (state.dragging) {
          const m = toM(p.x, p.y);
          if (state.dragging.kind === 'obj') {
            const o = state.dragging.ref;
            o.x = clamp(m.x, 0.01, WORLD_M - 0.01); o.y = clamp(m.y, 0.01, worldH - 0.01);
            o.vx = o.vy = 0;
          } else {
            state.ruler[state.dragging.kind === 'r1' ? 'x1' : 'x2'] = m.x;
            state.ruler[state.dragging.kind === 'r1' ? 'y1' : 'y2'] = m.y;
          }
          stage.draw(); readouts();
        } else {
          const o = hitTest(p.x, p.y);
          if (o !== state.hover) {
            state.hover = o;
            canvas.classList.toggle('grab', !!o && state.tool === 'move');
          }
          const hov = gid('hover');
          if (hov) {
            if (o) {
              const f = fieldAtM(o.x, o.y);
              hov.textContent = `${o.type}${o.q ? ' ' + (o.q > 0 ? '+' : '\u2212') + unit(Math.abs(o.q), 'C', 2) : ''} \u00B7 E here ${unit(f.mag, 'N/C', 2)}`;
            } else {
              const m = toM(p.x, p.y);
              const f = fieldAtM(m.x, m.y);
              hov.textContent = `E at cursor: ${unit(f.mag, 'N/C', 2)} ${f.mag > 0 ? dirWord(f.ex, f.ey) : ''} \u00B7 F on +1 nC = ${unit(f.mag * 1e-9, 'N', 2)}`;
            }
          }
        }
      } else if (p.type === 'up' || p.type === 'leave') {
        if (lpTimer) { stage.clearTimer(lpTimer); lpTimer = 0; }
        if (state.dragging && state.dragging.kind === 'obj') {
          const o = state.dragging.ref;
          const F = forceOn(o);
          o.wobble = clamp(Math.log10(Math.max(F.mag, 1e-9)) / 6 + 0.5, 0, 1);  // bigger force, bigger thump
                if (opts.onUp) opts.onUp(api, o);
        }
        state.dragging = null; downAt = null;
        canvas.classList.remove('grabbing'); canvas.classList.remove('dragging');
        if (p.type === 'leave') { state.hover = null; canvas.classList.remove('grab'); }
        refresh();
      }
    });

    /* wheel over an object edits its charge magnitude (spec: scroll wheel) */
    stage.listen(canvas, 'wheel', e => {
      const r = canvas.getBoundingClientRect();
      const o = hitTest(e.clientX - r.left, e.clientY - r.top);
      if (!o || !Q_ADJ[o.type]) return;
      if (e.preventDefault) e.preventDefault();
      snapshot();
      const s = Math.sign(o.q) || 1;
      o.q = s * clamp(Math.abs(o.q) * (e.deltaY < 0 ? 1.1 : 0.9), 0, 20e-6);
      touch(); refresh();
    }, { passive: false });

    /* -- multi-touch: pinch zoom + two-finger pan ------------------------------- */
    let pinching = false, pinchD0 = 0, pinchS0 = 1, pinchMid0 = null;
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      stage.listen(canvas, 'touchstart', e => {
        if (e.touches && e.touches.length >= 2) {
          pinching = true;
          const a = e.touches[0], b = e.touches[1];
          pinchD0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          pinchS0 = state.view.scale;
          const r = canvas.getBoundingClientRect();
          pinchMid0 = { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top };
          canvas.style.touchAction = 'none';
          if (e.preventDefault) e.preventDefault();
        }
      }, { passive: false });
      stage.listen(canvas, 'touchmove', e => {
        if (pinching && e.touches && e.touches.length >= 2) {
          const a = e.touches[0], b = e.touches[1];
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          const r = canvas.getBoundingClientRect();
          const mid = { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top };
          const ns = clamp(pinchS0 * (d / Math.max(pinchD0, 1)), baseScale() * 0.6, baseScale() * 5);
          const wx = (pinchMid0.x - state.view.ox) / state.view.scale;
          const wy = (pinchMid0.y - state.view.oy) / state.view.scale;
          state.view.scale = ns;
          state.view.ox = mid.x - wx * ns; state.view.oy = mid.y - wy * ns;
          if (e.preventDefault) e.preventDefault();
          stage.draw();
        }
      }, { passive: false });
      const endPinch = () => {
        if (pinching) { pinching = false; canvas.style.touchAction = ''; touch(); refresh(); }
      };
      stage.listen(canvas, 'touchend', endPinch);
      stage.listen(canvas, 'touchcancel', endPinch);
    }

    /* -- keyboard access to the canvas ------------------------------------------
       Selecting, moving, adding and removing charges used to be pointer-only. With
       the canvas focused: [ and ] choose a charge, arrows move it (Shift = bigger
       steps), + / - add one, Delete removes it, Esc deselects. A hidden live region
       says what was chosen/changed. All of it goes through the same snapshot /
       refresh path as the pointer, so Undo and the readouts behave identically. */
    const KEY_STEP_M = 0.05, KEY_STEP_BIG_M = 0.25;
    let lastNudge = 0;
    const live = document.createElement('div');
    live.setAttribute('role', 'status');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    const keyHint = document.createElement('p');
    keyHint.className = 'tiny faint';
    keyHint.id = canvas.id + '-keys';
    keyHint.textContent = 'Keyboard: focus the canvas, then [ and ] choose a charge, arrow keys move it (Shift for bigger steps), + or − adds one, Delete removes it, Esc deselects.';
    const wrap = canvas.closest('.canvas-wrap');
    if (wrap && wrap.parentNode && !document.getElementById(keyHint.id)) { wrap.parentNode.insertBefore(keyHint, wrap); wrap.appendChild(live); }
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('aria-describedby', keyHint.id);
    canvas.setAttribute('aria-keyshortcuts', '[ ] ArrowUp ArrowDown ArrowLeft ArrowRight + - Delete Escape');

    function describe(o) {
      const i = state.objects.indexOf(o) + 1;
      const what = o.q ? `${o.q > 0 ? '+' : '\u2212'}${unit(Math.abs(o.q), 'C', 2)} ${o.type === 'pos' || o.type === 'neg' ? 'charge' : o.type}` : o.type;
      return `${what} at x = ${o.x.toFixed(2)} m, y = ${o.y.toFixed(2)} m (${i} of ${state.objects.length})`;
    }
    const say = text => { live.textContent = ''; live.textContent = text; };

    function keyAdd(sign) {
      if (state.objects.length >= MAX_OBJ) { EMC.toast(`${MAX_OBJ} objects is the soft cap \u2014 erase one first`, 'warn'); return; }
      snapshot();
      // land beside the selection (or mid-canvas) so the new charge is visible and not on top of another
      const at = state.selected || { x: WORLD_M / 2 - 0.2, y: worldH / 2 };
      const o = makeObj(sign > 0 ? 'pos' : 'neg', sign * state.newQ,
        clamp(at.x + (state.selected ? 0.25 : 0), 0.03, WORLD_M - 0.03), clamp(at.y, 0.03, worldH - 0.03));
      state.objects.push(o);
      state.selected = o;
      refresh();
      say(`Added ${describe(o)}`);
    }

    stage.listen(canvas, 'keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;           // Ctrl+Z etc. belong to the document handler
      const list = state.objects;
      let handled = true;
      if (e.key === ']' || e.key === '[') {
        if (!list.length) { say('No charges yet. Press plus or minus to add one.'); }
        else {
          const at = list.indexOf(state.selected);
          const next = e.key === ']' ? (at + 1) % list.length : (at <= 0 ? list.length - 1 : at - 1);
          state.selected = list[next];
          refresh();
          say(describe(state.selected));
        }
      } else if (e.key.indexOf('Arrow') === 0) {
        const o = state.selected;
        if (!o) { say('Nothing selected. Press ] to choose a charge.'); }
        else {
          const step = e.shiftKey ? KEY_STEP_BIG_M : KEY_STEP_M;
          const now = performance.now();
          if (now - lastNudge > 700) snapshot();                // one undo step per burst of nudges
          lastNudge = now;
          if (e.key === 'ArrowLeft') o.x -= step;
          if (e.key === 'ArrowRight') o.x += step;
          if (e.key === 'ArrowUp') o.y -= step;
          if (e.key === 'ArrowDown') o.y += step;
          o.x = clamp(o.x, 0.01, WORLD_M - 0.01); o.y = clamp(o.y, 0.01, worldH - 0.01);
          o.vx = o.vy = 0;
          refresh();
          say(describe(o));
        }
      } else if (e.key === '+' || e.key === '=') { keyAdd(1); }
      else if (e.key === '-' || e.key === '\u2212' || e.key === '_') { keyAdd(-1); }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        const o = state.selected;
        if (!o) { say('Nothing selected to delete.'); }
        else {
          snapshot();
          state.objects = state.objects.filter(x => x !== o);
          state.selected = null;
          refresh();
          say(`Removed. ${state.objects.length} left.`);
        }
      } else if (e.key === 'Escape') {
        if (state.selected) { state.selected = null; refresh(); say('Selection cleared.'); } else { handled = false; }
      } else { handled = false; }
      if (handled) e.preventDefault();
    });

    /* -- keyboard: ctrl/cmd+Z undo (only while this panel is on screen) ---------- */
    stage.listen(document, 'keydown', e => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'z') {
        const t = e.target;
        if (t && t.tagName && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
        if (!root.getBoundingClientRect) return;
        const r = root.getBoundingClientRect();
        if (!(r.top < window.innerHeight && r.bottom > 0)) return;
        if (e.preventDefault) e.preventDefault();
        undo();
      }
    });

    /* -- boot ------------------------------------------------------------------------- */
    loadStars();
    if (opts.ruler && !state.ruler) state.ruler = { x1: WORLD_M * 0.2, y1: 9e9, x2: WORLD_M * 0.8, y2: 9e9 };
    let shared = null;
    try {
      const h = (location.hash || '').match(new RegExp('[#&]s-' + canvas.id + '=([^&]+)'));
      if (h) shared = decode(h[1]);
    } catch (e) { shared = null; }
    if (shared && shared.objects.length) {
      seed(shared.objects);
      for (const k of shared.toggleKeys) {
        if (k in state.toggles) {
          state.toggles[k] = true;
          const cb = root.querySelector(`[data-sb-toggle="${k}"]`);
          if (cb) cb.checked = true;
        }
      }
      EMC.toast('Shared setup loaded from the link');
    } else {
      seed(opts.seed || []);
    }
    setTool('move');
    buildChallenges();
    refresh();

    /* Replay a preset clicked before this sandbox existed (pre-init queue at
       the top of this file). Runs last so the handler sees a fully built box. */
    const queued = window.__emcSbPending && window.__emcSbPending.get(root);
    if (queued) {
      window.__emcSbPending.delete(root);
      const qb = root.querySelector(`[data-sb-preset="${queued}"]`);
      if (qb) qb.click();
    }

    return {
      stage, state, api, refresh, shareCode,
      setTool,
      seed: list => { snapshot(); seed(list); refresh(); }
    };
  }

  window.EMC.Sandbox = { create, pairF, fieldAt, encode, decode, dirWord, logLen, magColor, objRadius, PUCK_MASS, F_CAP, V_MAX };
})();
