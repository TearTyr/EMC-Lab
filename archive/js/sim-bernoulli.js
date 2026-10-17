/* Sim — Bernoulli visualiser. Two scenes in one canvas: an aerofoil in a wind stream (lift from the top/bottom speed difference) and a venturi pipe (continuity + the pressure drop in the throat). All numbers come from P + 1/2 rho v^2 = const and A1 v1 = A2 v2. Flat art only. */
(function () {
  const canvas = document.getElementById('sim-bernoulli');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { CONST, clamp, fixed, eng, unit, arrow, label, Stage, bindRange, bindSegment, setText, throttle } = EMC;

  const state = {
    mode: 'wing',
    v: 15,            // m/s free-stream wind (wing mode)
    aoa: 6,           // deg angle of attack (wing mode)
    flow: 0.5,        // m/s in the wide section (pipe mode)
    ratio: 0.5,       // d2/d1 throat ratio (pipe mode)
    particles: []
  };
  const WING_AREA = 12;          // m^2, a light aircraft wing
  const D1 = 0.10;               // m, wide-section diameter

  /* ---- physics ----------------------------------------------------------- */
  function wingPhys() {
    const rho = CONST.RHO_AIR;
    const a = state.aoa * Math.PI / 180;
    const sTop = 1 + 0.20 + 1.5 * Math.sin(a);       // camber + angle speed-up
    const sBot = 1 - 0.6 * Math.sin(a);
    let vTop = state.v * sTop, vBot = state.v * sBot;
    const stalled = state.aoa > 15;
    const near = state.aoa > 10 && !stalled;
    const sep = stalled ? Math.max(0.15, 1 - (state.aoa - 15) / 5) : 1;  // separated flow kills lift
    const dP = 0.5 * rho * (vTop * vTop - vBot * vBot) * sep;
    return { vTop: vTop * (stalled ? 0.8 : 1), vBot, dP, lift: dP * WING_AREA, stalled, near, sep };
  }
  function pipePhys() {
    const rho = CONST.RHO_WATER;
    const v1 = state.flow;
    const v2 = v1 / (state.ratio * state.ratio);      // continuity: A2/A1 = ratio^2
    const dP = 0.5 * rho * (v2 * v2 - v1 * v1);
    const dh = dP / (rho * CONST.G);                  // metres of water column
    return { v1, v2, dP, dh, A1: Math.PI * D1 * D1 / 4, Q: Math.PI * D1 * D1 / 4 * v1 };
  }

  /* ---- particles ----------------------------------------------------------- */
  /* seeded=true fills the whole canvas on first paint so the scene is never
     empty; respawns enter from just off the left edge. */
  function spawnParticle(w, h, pipe, seeded) {
    return pipe
      ? { x: seeded ? Math.random() * w : -10, y: 0.3 + Math.random() * 0.4 }
      : { x: seeded ? Math.random() * w : -10 - Math.random() * 30, y: 0.12 + Math.random() * 0.76 };
  }
  function ensureParticles(w, h) {
    const n = EMC.lowTier ? 30 : 46;
    while (state.particles.length < n) state.particles.push(spawnParticle(w, h, state.mode === 'pipe', true));
  }

  /* ---- wing scene ------------------------------------------------------------ */
  function wingScene(ctx, w, h, st, dt, p) {
    const cx = w * 0.5, cy = h * 0.52, chord = Math.min(w * 0.42, 300);
    const a = state.aoa * Math.PI / 180;

    // aerofoil polygon (cambered ellipse nose, flat-ish tail), rotated by aoa
    const prof = t => {                                 // t 0..1 along the chord
      const thick = 0.16 * Math.sin(Math.PI * Math.pow(t, 0.7));
      const camber = 0.07 * Math.sin(Math.PI * t);
      return { top: -(thick + camber), bot: thick * 0.7 - camber };
    };
    const rot = (tx, ty) => ({                          // chord coords -> canvas
      x: cx + (tx - 0.5) * chord * Math.cos(a) - ty * chord * Math.sin(a),
      y: cy + (tx - 0.5) * chord * Math.sin(a) + ty * chord * Math.cos(a)
    });
    ctx.save();
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
    ctx.beginPath();
    const N = 26;
    let first = rot(0, prof(0).top);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i <= N; i++) { const q = rot(i / N, prof(i / N).top); ctx.lineTo(q.x, q.y); }
    for (let i = N; i >= 0; i--) { const q = rot(i / N, prof(i / N).bot); ctx.lineTo(q.x, q.y); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, `AoA ${fixed(state.aoa, 0)}°`, rot(0.12, 0.24).x, rot(0.12, 0.24).y, { color: '#f6d36b', size: 11 });

    // stream particles: faster over the top, slower underneath; jitter when stalled
    ensureParticles(w, h);
    const pxScale = chord / 260;
    ctx.save();
    ctx.fillStyle = '#a8d3e0';
    for (const q of state.particles) {
      const above = q.y < 0.5;
      const span = clamp((q.x - (cx - chord * 0.6)) / (chord * 1.2), 0, 1);
      const bump = Math.sin(Math.PI * span);            // influence envelope over the wing
      const speedUp = above ? (1 + (p.sep < 1 ? 0.1 : 0.45) * bump) : (1 - 0.12 * bump);
      q.x += state.v * pxScale * 3.4 * speedUp * dt;
      const dy = above ? -0.10 * bump : 0.045 * bump;
      const jitter = p.stalled && above && span > 0.45 ? (Math.sin(st.t * 30 + q.y * 90) * 0.02) : 0;
      const yy = (q.y + dy + jitter) * h;
      ctx.globalAlpha = 0.55 + 0.35 * bump;
      ctx.beginPath(); ctx.arc(q.x, yy, 2.1, 0, Math.PI * 2); ctx.fill();
      if (q.x > w + 12) Object.assign(q, spawnParticle(w, h, false, false));
    }
    ctx.restore();

    // speed / pressure captions + lift arrow
    label(ctx, 'fast flow · LOW pressure', cx + chord * 0.1, cy - chord * 0.34, { color: '#b5d777', size: 11.5, weight: '700' });
    label(ctx, 'slower flow · HIGHER pressure', cx + chord * 0.1, cy + chord * 0.36, { color: '#a8d3e0', size: 11.5, weight: '700' });
    const liftPx = clamp(p.lift / 40, 0, h * 0.3);
    if (liftPx > 6) {
      arrow(ctx, cx, cy - 10, cx, cy - 10 - liftPx, { color: '#b5d777', width: 4, head: 12 });
      label(ctx, `LIFT ${eng(p.lift, 3)} N`, cx + 14, cy - 16 - liftPx, { color: '#b5d777', size: 12, weight: '800', align: 'left' });
    }
    if (p.stalled) label(ctx, '⚠ STALL — the flow has separated', w / 2, h - 26, { color: '#fca5a5', size: 12.5, weight: '800' });
  }

  /* ---- pipe scene --------------------------------------------------------------- */
  function pipeScene(ctx, w, h, st, dt, p) {
    const y0 = h * 0.56, R = h * 0.16;                  // wide-section half-height
    const x0 = w * 0.08, x1 = w * 0.92;
    const t0 = w * 0.38, t1 = w * 0.62;                 // throat span
    const radiusAt = x => {
      if (x < t0) return R;
      if (x > t1) return R;
      if (x < (t0 + t1) / 2) {
        const s = (x - t0) / ((t1 - t0) / 2);
        return R + (R * state.ratio - R) * Math.sin(s * Math.PI / 2);
      }
      const s = (x - (t0 + t1) / 2) / ((t1 - t0) / 2);
      return R * state.ratio + (R - R * state.ratio) * Math.sin(s * Math.PI / 2);
    };
    // walls
    ctx.save();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) { const y = y0 - radiusAt(x); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) { const y = y0 + radiusAt(x); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(168,211,224,.10)';
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) { const y = y0 - radiusAt(x); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x, y0 + radiusAt(x));
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // particles: x-speed follows continuity v(x) = Q/A(x)
    ensureParticles(w, h);
    const vOf = x => { const r = radiusAt(x) / R; return p.v1 / (r * r); };
    ctx.save();
    ctx.fillStyle = '#f6d36b';
    const pxPerM = 60;
    for (const q of state.particles) {
      q.x += vOf(q.x) * pxPerM * 2.2 * dt;
      if (q.x > x1 + 8) Object.assign(q, spawnParticle(w, h, true, false));
      const r = radiusAt(clamp(q.x, x0, x1)) * 0.82;
      ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.arc(q.x, y0 + (q.y * 2 - 1) * r, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // manometer tubes over the wide section and the throat
    const tube = (x, heightFrac, txtP, txtV) => {
      const top = y0 - radiusAt(x) - 8;
      const th = h * 0.30 * heightFrac;
      ctx.save();
      ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
      ctx.strokeRect(x - 7, top - th, 14, th);
      ctx.fillStyle = 'rgba(168,211,224,.5)';
      ctx.fillRect(x - 5, top - th + 2, 10, th - 4);
      ctx.restore();
      label(ctx, txtV, x, top - th - 26, { color: '#f6d36b', size: 11, weight: '700' });
      label(ctx, txtP, x, top - th - 12, { color: '#a8d3e0', size: 10.5, weight: '700' });
    };
    const hFrac = clamp(p.dh / 0.6, 0.05, 1);            // scale: 0.6 m of water = full tube
    tube(w * 0.22, 0.95, `v₁ = ${fixed(p.v1, 2)} m/s`, 'P₁ (higher)');
    tube(w * 0.5, 0.95 - hFrac * 0.75, `v₂ = ${fixed(p.v2, 2)} m/s`, 'P₂ (lower)');
    label(ctx, `Δh = ${fixed(p.dh * 100, 1)} cm of water`, w * 0.5, y0 + R + 22, { color: '#b5d777', size: 11.5, weight: '700' });
    label(ctx, 'the throat column stands lower — faster flow, lower pressure', w / 2, h - 10,
      { color: 'rgba(148,163,184,.85)', size: 10.5, weight: '600' });
  }

  /* ---- main render ------------------------------------------------------------- */
  const stage = new Stage(canvas, (ctx, w, h, st, dt) => {
    ctx.clearRect(0, 0, w, h);
    const p = state.mode === 'wing' ? wingPhys() : pipePhys();
    if (state.mode === 'wing') wingScene(ctx, w, h, st, dt || 0.016, p);
    else pipeScene(ctx, w, h, st, dt || 0.016, p);
    updateReadouts(p);
  }, { animate: true });

  /* ---- readouts ---------------------------------------------------------------- */
  const el = id => document.getElementById(id);
  const readoutsLive = throttle(() => updateReadouts(), 15);
  function updateReadouts(p) {
    const wing = state.mode === 'wing';
    const q = p || (wing ? wingPhys() : pipePhys());
    setText(el('bern-l1'), wing ? 'free-stream v' : 'v in wide section');
    setText(el('bern-l2'), wing ? 'v over the top' : 'v in the throat');
    setText(el('bern-l3'), wing ? 'ΔP (top vs bottom)' : 'ΔP (wide vs throat)');
    setText(el('bern-l4'), wing ? `lift · ${WING_AREA} m² wing` : 'manometer Δh');
    setText(el('bern-v1'), `${fixed(q.v1 ?? state.v, 2)} m/s`);
    setText(el('bern-v2'), `${fixed(q.v2 ?? q.vTop, 2)} m/s`);
    const dP = wing ? q.dP : q.dP;
    setText(el('bern-dp'), unit(dP, 'Pa', 3));
    setText(el('bern-extra'), wing ? unit(q.lift, 'N', 3) : `${fixed(q.dh * 100, 1)} cm`);
    if (el('bern-state')) {
      el('bern-state').textContent = wing
        ? (q.stalled ? 'STALLED — flow separated' : q.near ? 'near stall — smooth flow ending' : 'attached flow')
        : 'continuity: A₁v₁ = A₂v₂';
    }
    if (el('bern-sub')) {
      el('bern-sub').textContent = wing
        ? `v_top = ${fixed(q.vTop, 1)} m/s > v_bot = ${fixed(q.vBot, 1)} m/s · ΔP = ½ρ(v_top² − v_bot²) = ${eng(q.dP, 3)} Pa · lift = ΔP × ${WING_AREA} m² = ${eng(q.lift, 3)} N`
        : `v₂ = v₁·(d₁/d₂)² = ${fixed(q.v1, 2)} × ${fixed(1 / (state.ratio * state.ratio), 2)} = ${fixed(q.v2, 2)} m/s · ΔP = ½ρ(v₂² − v₁²) = ${eng(q.dP, 3)} Pa`;
    }
  }

  /* ---- controls ------------------------------------------------------------------ */
  bindRange('bern-v', 'bern-vv', v => { state.v = v; stage.invalidate(); updateReadouts(); }, v => `${fixed(v, 0)} m/s`);
  bindRange('bern-aoa', 'bern-aoav', v => { state.aoa = v; stage.invalidate(); updateReadouts(); }, v => `${fixed(v, 0)}°`);
  bindRange('bern-flow', 'bern-flowv', v => { state.flow = v; stage.invalidate(); updateReadouts(); }, v => `${fixed(v, 2)} m/s`);
  bindRange('bern-ratio', 'bern-ratiov', v => { state.ratio = v; stage.invalidate(); updateReadouts(); }, v => `d₂ = ${fixed(v * D1 * 100, 1)} cm`);

  function syncVisibility() {
    const wing = state.mode === 'wing';
    ['bern-ctl-v', 'bern-ctl-aoa'].forEach(id => { const n = el(id); if (n) n.style.display = wing ? '' : 'none'; });
    ['bern-ctl-flow', 'bern-ctl-ratio'].forEach(id => { const n = el(id); if (n) n.style.display = wing ? 'none' : ''; });
  }
  bindSegment('bern-mode', v => { state.mode = v; state.particles.length = 0; syncVisibility(); stage.invalidate(); updateReadouts(); });
  syncVisibility();
  updateReadouts();
  }
})();
