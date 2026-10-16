/* Sim — Vector addition bench. Drag the arrowheads of A and B; the resultant R = A + B is recomposed live by components, shown as the parallelogram diagonal (or the closing side in tip-to-tail mode). Flat art only: solid fills, dashed guides, no fancy effects. */
(function () {
  const canvas = document.getElementById('sim-vector-add');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { clamp, fixed, arrow, label, Stage, bindSegment } = EMC;

  /* ---- state ----------------------------------------------------------- */
  const DEFAULTS = { A: { x: 3, y: 1 }, B: { x: 1, y: 3 } };
  const state = {
    A: { ...DEFAULTS.A },
    B: { ...DEFAULTS.B },
    mode: 'parallelogram',       // 'parallelogram' | 'tip' (tip-to-tail)
    drag: null                   // 'A' | 'B' | null
  };
  const R = () => ({ x: state.A.x + state.B.x, y: state.A.y + state.B.y });

  /* ---- coordinate mapping ---------------------------------------------- */
  const UNITS = 10;                                   // grid spans ±5 units
  function scale(w, h) { return Math.min(w, h) / UNITS; }
  function origin(w, h) { return { x: w / 2, y: h / 2 }; }
  const toPx = (v, o, s) => ({ x: o.x + v.x * s, y: o.y - v.y * s });   // y-up
  const toUnits = (px, o, s) => ({ x: (px.x - o.x) / s, y: (o.y - px.y) / s });

  /* ---- pointer: drag the arrowheads ------------------------------------- */
  const stage = new Stage(canvas, render, { animate: false });
  stage.onPointer(p => {
    const o = origin(stage.w, stage.h), s = scale(stage.w, stage.h);
    const tipA = toPx(state.A, o, s);
    const bTail = state.mode === 'tip' ? tipA : o;
    const tipB = { x: bTail.x + state.B.x * s, y: bTail.y - state.B.y * s };
    if (p.type === 'down') {
      const dA = Math.hypot(p.x - tipA.x, p.y - tipA.y);
      const dB = Math.hypot(p.x - tipB.x, p.y - tipB.y);
      state.drag = (dA < 30 && dA <= dB) ? 'A' : (dB < 30 ? 'B' : null);   // 30 px hit halo, generous for touch
      canvas.style.cursor = state.drag ? 'grabbing' : 'default';
    } else if (p.type === 'up' || p.type === 'leave') {
      state.drag = null; canvas.style.cursor = 'default';
    }
    if (state.drag && (p.type === 'down' || p.type === 'move')) {
      const u = toUnits({ x: p.x, y: p.y }, o, s);
      const v = { x: clamp(Math.round(u.x * 10) / 10, -5, 5), y: clamp(Math.round(u.y * 10) / 10, -5, 5) };
      if (state.drag === 'A') state.A = v;
      else state.B = v;                       // B is stored as a free vector in both modes
      refresh();
    }
  });

  /* ---- rendering --------------------------------------------------------- */
  function render(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const o = origin(w, h), s = scale(w, h);
    const r = R();

    // grid (1-unit squares) + axes
    ctx.save();
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      ctx.strokeStyle = i === 0 ? 'rgba(148,163,184,.5)' : 'rgba(148,163,184,.13)';
      const gx = o.x + i * s, gy = o.y - i * s;
      ctx.beginPath(); ctx.moveTo(gx, o.y - 5 * s); ctx.lineTo(gx, o.y + 5 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x - 5 * s, gy); ctx.lineTo(o.x + 5 * s, gy); ctx.stroke();
    }
    ctx.restore();
    label(ctx, 'x', o.x + 5 * s - 6, o.y + 14, { color: '#7b8db0', size: 11 });
    label(ctx, 'y', o.x + 12, o.y - 5 * s + 8, { color: '#7b8db0', size: 11 });

    const tipA = toPx(state.A, o, s);
    const tipB0 = toPx(state.B, o, s);
    const tipR = toPx(r, o, s);
    const bTail = state.mode === 'tip' ? tipA : o;
    const tipB = { x: bTail.x + state.B.x * s, y: bTail.y - state.B.y * s };

    // parallelogram guides (dashed)
    ctx.save();
    ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(213,184,216,.65)';
    if (state.mode === 'parallelogram') {
      ctx.beginPath(); ctx.moveTo(tipA.x, tipA.y); ctx.lineTo(tipR.x, tipR.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tipB0.x, tipB0.y); ctx.lineTo(tipR.x, tipR.y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tipB0.x, tipB0.y); ctx.stroke();  // ghost of B at the origin
    }
    // component projections of R
    ctx.strokeStyle = 'rgba(148,163,184,.55)';
    ctx.beginPath(); ctx.moveTo(tipR.x, tipR.y); ctx.lineTo(tipR.x, o.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tipR.x, tipR.y); ctx.lineTo(o.x, tipR.y); ctx.stroke();
    ctx.restore();
    label(ctx, `Rx ${fixed(r.x, 1)}`, (o.x + tipR.x) / 2, o.y + (r.y >= 0 ? 14 : -12), { color: '#a9bad6', size: 11 });
    label(ctx, `Ry ${fixed(r.y, 1)}`, tipR.x + (r.x >= 0 ? 26 : -26), (o.y + tipR.y) / 2, { color: '#a9bad6', size: 11 });

    // the three arrows: A cyan, B amber, resultant emerald
    arrow(ctx, o.x, o.y, tipA.x, tipA.y, { color: '#a8d3e0', width: 3, head: 11 });
    arrow(ctx, bTail.x, bTail.y, tipB.x, tipB.y, { color: '#f6d36b', width: 3, head: 11 });
    arrow(ctx, o.x, o.y, tipR.x, tipR.y, { color: '#b5d777', width: 3.6, head: 12 });

    // arrow labels
    const mid = (p, q, off) => ({ x: (p.x + q.x) / 2 + off.x, y: (p.y + q.y) / 2 + off.y });
    const la = mid(o, tipA, { x: -14, y: -10 });
    const lb = mid(bTail, tipB, { x: 14, y: -10 });
    label(ctx, 'A', la.x, la.y, { color: '#a8d3e0', size: 13, weight: '800' });
    label(ctx, 'B', lb.x, lb.y, { color: '#f6d36b', size: 13, weight: '800' });
    label(ctx, 'R = A + B', clamp(tipR.x + 12, 8, w - 78), clamp(tipR.y - 12, 14, h - 8),
      { color: '#b5d777', size: 12, weight: '800', align: 'left' });

    // drag handles
    [tipA, tipB].forEach((t, i) => {
      ctx.save();
      ctx.fillStyle = i === 0 ? '#a8d3e0' : '#f6d36b';
      ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });

    label(ctx, 'drag the arrowheads · grid = 1 unit', w / 2, h - 10,
      { color: 'rgba(148,163,184,.8)', size: 10.5, weight: '600' });
  }

  /* ---- readouts ----------------------------------------------------------- */
  const el = id => document.getElementById(id);
  const mag = v => Math.hypot(v.x, v.y);
  const ang = v => Math.atan2(v.y, v.x) * 180 / Math.PI;
  function updateReadouts() {
    const r = R();
    if (el('vec-Amag')) el('vec-Amag').textContent = `${fixed(mag(state.A), 2)} u`;
    if (el('vec-Aang')) el('vec-Aang').textContent = `${fixed(ang(state.A), 1)}°`;
    if (el('vec-Bmag')) el('vec-Bmag').textContent = `${fixed(mag(state.B), 2)} u`;
    if (el('vec-Bang')) el('vec-Bang').textContent = `${fixed(ang(state.B), 1)}°`;
    if (el('vec-Rx')) el('vec-Rx').textContent = fixed(r.x, 1);
    if (el('vec-Ry')) el('vec-Ry').textContent = fixed(r.y, 1);
    if (el('vec-Rmag')) el('vec-Rmag').textContent = `${fixed(mag(r), 2)} u`;
    if (el('vec-Rang')) el('vec-Rang').textContent = `${fixed(ang(r), 1)}°`;
    if (el('vec-sub')) {
      el('vec-sub').textContent =
        `Rx = Ax + Bx = ${fixed(state.A.x, 1)} + ${fixed(state.B.x, 1)} = ${fixed(r.x, 1)}` +
        `  ·  Ry = Ay + By = ${fixed(state.A.y, 1)} + ${fixed(state.B.y, 1)} = ${fixed(r.y, 1)}` +
        `  ·  |R| = √(Rx² + Ry²) = ${fixed(mag(r), 2)} u`;
    }
  }
  function refresh() { stage.invalidate(); updateReadouts(); }

  /* ---- controls ------------------------------------------------------------ */
  bindSegment('vec-mode', v => { state.mode = v; refresh(); });

  document.querySelectorAll('[data-vec-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [ax, ay, bx, by] = btn.dataset.vecPreset.split(',').map(Number);
      state.A = { x: ax, y: ay }; state.B = { x: bx, y: by };
      refresh();
      EMC.toast(`Preset: A = (${ax}, ${ay}), B = (${bx}, ${by})`);
    });
  });
  const reset = el('vec-reset');
  if (reset) reset.addEventListener('click', () => {
    state.A = { ...DEFAULTS.A }; state.B = { ...DEFAULTS.B }; refresh();
  });

  refresh();
  }
})();
