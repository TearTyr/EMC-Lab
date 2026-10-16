/* Sim — Archimedes bench. An object of adjustable density and volume settles in a tank: floats with submerged fraction rho_obj/rho_fluid, or sinks and receives a normal force from the floor. Every readout comes from F_B = rho_f * V_sub * g. Flat art only. */
(function () {
  const canvas = document.getElementById('sim-archimedes');
  if (!canvas) return;

  const { CONST, clamp, fixed, eng, arrow, label, Stage, bindRange, bindSegment, damp } = EMC;
  const g = CONST.G;

  /* ---- state ------------------------------------------------------------- */
  const state = {
    rhoObj: 600,          // kg/m^3
    volL: 2,              // litres
    rhoF: 1000,           // kg/m^3 (fluid segment)
    shape: 'cube',
    y: 0,                 // centre depth below the waterline, metres (+ = down)
    dragging: false
  };
  const TANK_DEPTH = 1.1;                       // metres of water, surface to floor

  const phys = () => {
    const V = state.volL / 1000;                // m^3
    const s = Math.cbrt(V);                     // cube side, m (ball uses the same envelope)
    const W = state.rhoObj * V * g;
    const floats = state.rhoObj < state.rhoF - 0.5;
    const neutral = Math.abs(state.rhoObj - state.rhoF) <= 0.5;
    const f = clamp(state.rhoObj / state.rhoF, 0, 1);          // submerged fraction at rest
    const yEq = floats || neutral ? (f - 0.5) * s : TANK_DEPTH - s / 2;
    // instantaneous submerged fraction from the current position
    const depthSub = clamp(state.y + s / 2, 0, s);
    const fNow = neutral || !floats ? (state.y >= yEq - 1e-6 ? (floats ? f : 1) : depthSub / s) : depthSub / s;
    const FB = state.rhoF * V * clamp(fNow, 0, 1) * g;
    const atRest = Math.abs(state.y - yEq) < 1e-3;
    const onFloor = !floats && !neutral && atRest;
    const N = onFloor ? Math.max(0, W - FB) : 0;
    return { V, s, W, FB, N, floats, neutral, f, fNow: clamp(fNow, 0, 1), yEq, atRest, onFloor };
  };

  /* ---- geometry ------------------------------------------------------------ */
  function geom(w, h) {
    const l = w * 0.18, r = w * 0.82, t = h * 0.06, b = h * 0.94;
    const surface = t + (b - t) * 0.16;
    return { l, r, t, b, surface, pxPerM: (b - surface) / TANK_DEPTH, cx: (l + r) / 2 };
  }

  let vy = 0;
  const stage = new Stage(canvas, (ctx, w, h, st, dt) => {
    const p = phys();
    // settle towards equilibrium (spring-damper, only when not dragged)
    if (!state.dragging) {
      const k = 26, c = 9;
      const a = k * (p.yEq - state.y) - c * vy;
      vy += a * (dt || 0.016);
      state.y += vy * (dt || 0.016);
      if (Math.abs(p.yEq - state.y) < 1e-4 && Math.abs(vy) < 1e-3) { state.y = p.yEq; vy = 0; }
    }
    render(ctx, w, h, st, p);
    updateReadouts();
  }, { animate: true });

  function render(ctx, w, h, st, p) {
    ctx.clearRect(0, 0, w, h);
    const G = geom(w, h);
    const sPx = p.s * G.pxPerM;
    const cy = G.surface + state.y * G.pxPerM;

    // tank + water (flat translucent fill)
    ctx.save();
    ctx.fillStyle = 'rgba(168,211,224,.14)';
    ctx.fillRect(G.l, G.surface, G.r - G.l, G.b - G.surface);
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(G.l, G.t); ctx.lineTo(G.l, G.b); ctx.lineTo(G.r, G.b); ctx.lineTo(G.r, G.t);
    ctx.stroke();
    // waterline
    ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(G.l, G.surface); ctx.lineTo(G.r, G.surface); ctx.stroke();
    // depth ruler
    ctx.strokeStyle = 'rgba(148,163,184,.4)'; ctx.lineWidth = 1;
    for (let d = 0.2; d < TANK_DEPTH; d += 0.2) {
      const yy = G.surface + d * G.pxPerM;
      ctx.beginPath(); ctx.moveTo(G.l + 4, yy); ctx.lineTo(G.l + 16, yy); ctx.stroke();
      label(ctx, `${fixed(d, 1)} m`, G.l + 22, yy, { color: '#7b8db0', size: 9.5, align: 'left' });
    }
    ctx.restore();
    label(ctx, `${state.rhoF} kg/m³ fluid`, G.r - 8, G.surface - 10, { color: '#a8d3e0', size: 11, align: 'right' });

    // the object
    const submergedTop = Math.max(cy - sPx / 2, G.surface);
    ctx.save();
    ctx.fillStyle = '#f6f1e5'; ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2;
    if (state.shape === 'cube') {
      ctx.beginPath(); ctx.rect(G.cx - sPx / 2, cy - sPx / 2, sPx, sPx); ctx.fill(); ctx.stroke();
      if (submergedTop < cy + sPx / 2) {                 // submerged part tinted
        ctx.fillStyle = 'rgba(168,211,224,.45)';
        ctx.fillRect(G.cx - sPx / 2, submergedTop, sPx, cy + sPx / 2 - submergedTop);
      }
    } else {
      ctx.beginPath(); ctx.arc(G.cx, cy, sPx / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(G.cx, cy, sPx / 2, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(168,211,224,.45)';
      ctx.fillRect(G.cx - sPx, submergedTop, sPx * 2, cy + sPx);
      ctx.restore();
    }
    ctx.restore();
    label(ctx, `${state.rhoObj} kg/m³`, G.cx, cy, { color: '#2b2d33', size: 11.5, weight: '800' });

    // force arrows: weight down, buoyancy up, normal up (at the floor)
    const fScale = 26 / Math.max(p.W, 1);                 // px per newton, relative to W
    arrow(ctx, G.cx, cy, G.cx, cy + p.W * fScale + 14, { color: '#f8aebe', width: 3 });
    label(ctx, `W ${eng(p.W, 3)} N`, G.cx + 14, cy + p.W * fScale + 22, { color: '#f8aebe', size: 11, align: 'left' });
    if (p.FB > 0.01) {
      arrow(ctx, G.cx, cy, G.cx, cy - p.FB * fScale - 14, { color: '#a8d3e0', width: 3 });
      label(ctx, `F_B ${eng(p.FB, 3)} N`, G.cx - 14, cy - p.FB * fScale - 22, { color: '#a8d3e0', size: 11, align: 'right' });
    }
    if (p.N > 0.01) {
      arrow(ctx, G.cx + sPx * 0.7, G.b - 4, G.cx + sPx * 0.7, G.b - 4 - p.N * fScale - 10, { color: '#f6d36b', width: 2.6 });
      label(ctx, `N ${eng(p.N, 3)} N`, G.cx + sPx * 0.7 + 12, G.b - 16, { color: '#f6d36b', size: 11, align: 'left' });
    }

    label(ctx, state.dragging ? 'release to let it settle' : 'drag the block up or down',
      w / 2, h - 10, { color: 'rgba(148,163,184,.8)', size: 10.5, weight: '600' });
  }

  /* ---- pointer: drag the object -------------------------------------------- */
  stage.onPointer(p => {
    const G = geom(stage.w, stage.h);
    const ph = phys();
    const sPx = ph.s * G.pxPerM;
    const cy = G.surface + state.y * G.pxPerM;
    if (p.type === 'down') {
      const hit = Math.abs(p.x - G.cx) < sPx && Math.abs(p.y - cy) < sPx;
      state.dragging = hit; vy = 0;
      canvas.style.cursor = hit ? 'grabbing' : 'default';
    } else if (p.type === 'move' && state.dragging) {
      state.y = clamp((p.y - G.surface) / G.pxPerM, -ph.s * 0.9, TANK_DEPTH - ph.s / 2);
    } else if (p.type === 'up' || p.type === 'leave') {
      state.dragging = false; canvas.style.cursor = 'default';
    }
  });

  /* ---- readouts --------------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const p = phys();
    if (el('arch-weight')) el('arch-weight').textContent = `${eng(p.W, 3)} N`;
    if (el('arch-buoy')) el('arch-buoy').textContent = `${eng(p.FB, 3)} N`;
    const net = p.W - p.FB - p.N;
    if (el('arch-net')) {
      el('arch-net').textContent = p.atRest
        ? (p.floats || p.neutral ? '0 N — balanced' : `0 N — floor holds ${eng(p.N, 3)} N`)
        : `${eng(Math.abs(net), 3)} N ${net > 0 ? '↓' : '↑'}`;
    }
    if (el('arch-subfr')) el('arch-subfr').textContent = `${fixed(p.fNow * 100, 1)} %`;
    if (el('arch-vsub')) el('arch-vsub').textContent = `${fixed(p.fNow * state.volL, 2)} L`;
    if (el('arch-state')) {
      el('arch-state').textContent = p.neutral ? 'neutrally buoyant' : (p.floats ? 'floats' : 'sinks');
    }
    if (el('arch-explain')) {
      el('arch-explain').textContent = p.floats || p.neutral
        ? `Floating: the block settles until it displaces its own weight — submerged fraction = ρobj/ρfluid = ${state.rhoObj}/${state.rhoF} = ${fixed(p.f * 100, 1)}%, so F_B = W = ${eng(p.W, 3)} N.`
        : `Sinking: fully submerged it displaces ${fixed(state.volL, 2)} L, so F_B = ρfluid·V·g = ${state.rhoF} × ${fixed(p.V, 4)} × ${fixed(g, 2)} = ${eng(state.rhoF * p.V * g, 3)} N < W = ${eng(p.W, 3)} N. On the floor the missing ${eng(p.N, 3)} N comes from the normal force.`;
    }
  }
  function refresh() { updateReadouts(); }

  /* ---- controls ------------------------------------------------------------------ */
  bindRange('arch-rho', 'arch-rhov', v => { state.rhoObj = v; refresh(); }, v => `${v} kg/m³`);
  bindRange('arch-vol', 'arch-volv', v => { state.volL = v; refresh(); }, v => `${fixed(v, 1)} L`);
  bindSegment('arch-fluid', v => { state.rhoF = Number(v); state.y = phys().yEq; vy = 0; refresh(); });
  bindSegment('arch-shape', v => { state.shape = v; refresh(); });

  // start at equilibrium
  state.y = phys().yEq;
  refresh();
})();
