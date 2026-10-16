/* Sim — travelling wave bench. y(x,t) = A sin(kx - omega t) with k = 2*pi/lambda and omega = 2*pi*f, drawn as a transverse wave or a longitudinal (compression) wave. The wave speed is always computed, never assumed: v = f * lambda. Flat art only. */
(function () {
  const canvas = document.getElementById('sim-wave');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { clamp, fixed, arrow, label, Stage, bindRange, bindSegment } = EMC;

  const state = {
    A: 8,            // cm
    f: 1,            // Hz
    lambda: 2,       // m
    type: 'transverse',
    particles: true,
    paused: false,
    phase: 0         // accumulated cycles
  };

  const PX_PER_M = () => 90;
  const phys = () => ({ v: state.f * state.lambda, T: state.f > 0 ? 1 / state.f : Infinity, k: 2 * Math.PI / state.lambda, omega: 2 * Math.PI * state.f });

  const stage = new Stage(canvas, (ctx, w, h, st, dt) => {
    ctx.clearRect(0, 0, w, h);
    if (!state.paused) state.phase += (dt || 0.016) * state.f;
    const p = phys();
    const mid = h * 0.52;
    const Apx = clamp(state.A * 2.6, 6, h * 0.34);
    const yAt = xM => mid - Apx * Math.sin(p.k * xM - 2 * Math.PI * state.phase);

    if (state.type === 'transverse') {
      // equilibrium axis
      ctx.save();
      ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.restore();

      // the travelling curve
      ctx.save();
      ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 2.8; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let px = 0; px <= w; px += 3) {
        const y = yAt(px / PX_PER_M());
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.restore();

      // medium particles: they bob vertically only — the wave travels, the medium does not
      if (state.particles) {
        ctx.save();
        ctx.fillStyle = '#f6d36b';
        const n = Math.floor(w / 26);
        for (let i = 0; i <= n; i++) {
          const px = i * 26;
          ctx.beginPath(); ctx.arc(px, yAt(px / PX_PER_M()), 3.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // amplitude + wavelength markers
      const xCrest = ((Math.PI / 2 + 2 * Math.PI * state.phase) / p.k) * PX_PER_M();
      const x0 = ((xCrest % (state.lambda * PX_PER_M())) + state.lambda * PX_PER_M()) % (state.lambda * PX_PER_M());
      const x1 = x0 + state.lambda * PX_PER_M();
      if (x1 < w - 30) {
        ctx.save();
        ctx.strokeStyle = '#b5d777'; ctx.lineWidth = 1.8; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(x0, mid + Apx + 22); ctx.lineTo(x1, mid + Apx + 22); ctx.stroke();
        ctx.restore();
        arrow(ctx, x0 + 8, mid + Apx + 22, x0, mid + Apx + 22, { color: '#b5d777', width: 1.8, head: 6 });
        arrow(ctx, x1 - 8, mid + Apx + 22, x1, mid + Apx + 22, { color: '#b5d777', width: 1.8, head: 6 });
        label(ctx, `λ = ${fixed(state.lambda, 2)} m`, (x0 + x1) / 2, mid + Apx + 36, { color: '#b5d777', size: 11.5, weight: '700' });
      }
      const crestY = mid - Apx;
      ctx.save();
      ctx.strokeStyle = '#f8aebe'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x0 + 14, mid); ctx.lineTo(x0 + 14, crestY); ctx.stroke();
      ctx.restore();
      label(ctx, `A = ${fixed(state.A, 0)} cm`, x0 + 22, (mid + crestY) / 2, { color: '#f8aebe', size: 11.5, align: 'left', weight: '700' });

      arrow(ctx, w - 90, mid - Apx - 20, w - 24, mid - Apx - 20, { color: '#e8eefb', width: 2.4, head: 9 });
      label(ctx, `v = ${fixed(p.v, 2)} m/s`, w - 57, mid - Apx - 36, { color: '#e8eefb', size: 12, weight: '800' });
    } else {
      // LONGITUDINAL: rows of dots displaced along x — compressions and rarefactions
      const rows = 4, gap = 15;
      const disp = xM => Apx * 0.55 * Math.sin(p.k * xM - 2 * Math.PI * state.phase);
      ctx.save();
      for (let r = 0; r < rows; r++) {
        const y = mid - (rows - 1) * gap / 2 + r * gap;
        for (let px = 6; px < w - 6; px += gap) {
          const xM = px / PX_PER_M();
          const dx = disp(xM);
          // density cue: dots crowd where the displacement gradient is negative
          const grad = Math.cos(p.k * xM - 2 * Math.PI * state.phase);
          ctx.globalAlpha = clamp(0.55 + 0.4 * (-grad), 0.25, 1);
          ctx.fillStyle = grad < -0.3 ? '#f6d36b' : '#a8d3e0';
          ctx.beginPath(); ctx.arc(px + dx, y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      // label one compression and one rarefaction
      const xComp = ((-Math.PI / 2 + 2 * Math.PI * state.phase) / p.k) * PX_PER_M();
      const xc = ((xComp % (state.lambda * PX_PER_M())) + state.lambda * PX_PER_M()) % (state.lambda * PX_PER_M());
      label(ctx, 'compression', clamp(xc + state.lambda * PX_PER_M() / 2, 60, w - 60), mid + (rows - 1) * gap / 2 + 24, { color: '#f6d36b', size: 11.5, weight: '700' });
      label(ctx, 'rarefaction', clamp(xc + state.lambda * PX_PER_M(), 60, w - 60), mid + (rows - 1) * gap / 2 + 24, { color: '#a8d3e0', size: 11.5, weight: '700' });
      arrow(ctx, w - 90, mid - (rows - 1) * gap / 2 - 24, w - 24, mid - (rows - 1) * gap / 2 - 24, { color: '#e8eefb', width: 2.4, head: 9 });
      label(ctx, `v = ${fixed(p.v, 2)} m/s`, w - 57, mid - (rows - 1) * gap / 2 - 40, { color: '#e8eefb', size: 12, weight: '800' });
    }

    label(ctx, state.type === 'transverse'
      ? 'medium moves ↑↓ · wave travels →'
      : 'medium moves ↔ · wave travels →',
      w / 2, h - 10, { color: 'rgba(148,163,184,.85)', size: 10.5, weight: '600' });
  }, { animate: true });

  /* ---- readouts --------------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const p = phys();
    if (el('wave-v')) el('wave-v').textContent = `${fixed(p.v, 2)} m/s`;
    if (el('wave-T')) el('wave-T').textContent = `${fixed(p.T, 2)} s`;
    if (el('wave-omega')) el('wave-omega').textContent = `${fixed(p.omega, 2)} rad/s`;
    if (el('wave-sub')) {
      el('wave-sub').textContent =
        `v = f × λ = ${fixed(state.f, 2)} Hz × ${fixed(state.lambda, 2)} m = ${fixed(p.v, 2)} m/s` +
        `  ·  T = 1/f = ${fixed(p.T, 2)} s`;
    }
  }
  function refresh() { updateReadouts(); }

  /* ---- controls ------------------------------------------------------------------ */
  bindRange('wave-A', 'wave-Av', v => { state.A = v; stage.invalidate(); refresh(); }, v => `${fixed(v, 0)} cm`);
  bindRange('wave-f', 'wave-fv', v => { state.f = v; stage.invalidate(); refresh(); }, v => `${fixed(v, 2)} Hz`);
  bindRange('wave-lam', 'wave-lamv', v => { state.lambda = v; stage.invalidate(); refresh(); }, v => `${fixed(v, 2)} m`);
  bindSegment('wave-type', v => { state.type = v; stage.invalidate(); });

  const partBox = el('wave-particles');
  if (partBox) partBox.addEventListener('change', () => { state.particles = partBox.checked; });
  const pauseBtn = el('wave-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseBtn.setAttribute('aria-pressed', String(state.paused));
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
  });

  refresh();
  }
})();
