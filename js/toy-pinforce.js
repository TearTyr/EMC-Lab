/* Pin the Force — Lesson 2 tiny toy. Drag charge B along the rail and the
   F(r) hyperbola traces itself live underneath, with ghost markers at 2r and
   3r printing the exact ratios (¼, 1/9). The curve is recomputed every frame
   from F = k|qA·qB|/r² — the inverse square is seen, not memorised. */
(function () {
  const canvas = document.getElementById('toy-pinforce');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { CONST, clamp, arrow, label, eng, unit } = EMC;
    const K = CONST.K;

    const R_MIN = 0.05, R_MAX = 1.2;          // metres shown on the rail/axis
    const state = { qA: 4, qB: -6, r: 0.30, drag: false };   // µC

    const F = r => K * Math.abs(state.qA * state.qB) * 1e-12 / (r * r);
    const el = id => document.getElementById(id);

    function readouts() {
      if (el('pf-r')) el('pf-r').textContent = `${state.r.toFixed(3)} m`;
      if (el('pf-f')) el('pf-f').textContent = unit(F(state.r), 'N', 3);
      if (el('pf-ratio')) el('pf-ratio').textContent = `F(2r)/F(r) = ${(F(state.r * 2) / F(state.r)).toFixed(3)} · F(3r)/F(r) = ${(F(state.r * 3) / F(state.r)).toFixed(3)}`;
      const sub = el('pf-sub');
      if (sub) sub.innerHTML = `F = (8.99×10<sup>9</sup>) × |${state.qA.toFixed(1)} µC × ${state.qB.toFixed(1)} µC| ÷ (${state.r.toFixed(3)})² = <b>${eng(F(state.r), 3)} N</b>`;
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const railY = h * 0.20, gx = w * 0.08, gw = w * 0.86, gy = h * 0.34, gh = h * 0.52;
      const rx = r => gx + (clamp(r, R_MIN, R_MAX) - R_MIN) / (R_MAX - R_MIN) * gw;

      /* --- the rail: A pinned left, B draggable --- */
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(gx, railY); ctx.lineTo(gx + gw, railY); ctx.stroke();
      ctx.restore();
      const ax = gx, bxp = rx(state.r);
      arrow(ctx, ax + 18, railY, bxp - 18, railY, { color: state.qA * state.qB < 0 ? '#b5d777' : '#f8aebe', width: 3, head: 10 });
      arrow(ctx, bxp - 18, railY + 14, ax + 18, railY + 14, { color: state.qA * state.qB < 0 ? '#b5d777' : '#f8aebe', width: 3, head: 10 });
      EMC.chargeGlyph(ctx, ax, railY, 15, state.qA * 1e-6);
      EMC.chargeGlyph(ctx, bxp, railY, 15, state.qB * 1e-6);
      label(ctx, 'A (pinned)', ax, railY - 30, { color: '#fac0cd', size: 10.5 });
      label(ctx, 'B — drag me', bxp, railY - 30, { color: '#cfe9f2', size: 10.5 });
      label(ctx, `r = ${state.r.toFixed(2)} m`, (ax + bxp) / 2, railY + 34, { color: '#cbd5e1', size: 11.5 });

      /* --- live F(r) curve, log-scaled y over 0.01..200 N --- */
      const yOf = Fv => gy + gh - clamp((Math.log10(Math.max(Fv, 1e-3)) + 2) / (Math.log10(200) + 2), 0, 1) * gh;
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      ctx.restore();
      label(ctx, 'F (N, log)', gx - 6, gy + 6, { color: '#9a988e', size: 10, align: 'right' });
      label(ctx, 'r (m)', gx + gw, gy + gh + 14, { color: '#9a988e', size: 10, align: 'right' });
      ctx.save();
      ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const r = R_MIN + (R_MAX - R_MIN) * i / 120;
        const X = rx(r), Y = yOf(F(r));
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.restore();

      /* current point + 2r/3r ghosts with the exact ratios */
      const pts = [[state.r, '#f6d36b', 'F'], [state.r * 2, '#b5d777', '¼'], [state.r * 3, '#d5b8d8', '1/9']];
      for (const [r, col, tag] of pts) {
        if (r > R_MAX) continue;
        const X = rx(r), Y = yOf(F(r));
        ctx.save();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, tag === 'F' ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#17181c'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
        label(ctx, tag === 'F' ? `F = ${eng(F(r), 2)} N` : `${tag}·F`, X, Y - 14, { color: col, size: 10.5, weight: '700' });
      }
      label(ctx, 'the first centimetres hold almost all the force — the tail is flat forever',
        w / 2, h - 8, { color: 'rgba(169,186,214,.7)', size: 10.5, weight: '500' });
    }

    const stage = new EMC.Stage(canvas, render, { intro: 320 });

    const gx = () => stage.w * 0.08, gw = () => stage.w * 0.86;
    stage.onPointer(p => {
      if (p.type === 'down') {
        const bxp = gx() + (clamp(state.r, R_MIN, R_MAX) - R_MIN) / (R_MAX - R_MIN) * gw();
        if (Math.hypot(p.x - bxp, p.y - stage.h * 0.20) < 40 || p.y < stage.h * 0.3) {
          state.drag = true; canvas.classList.add('dragging');
        }
      } else if (p.type === 'move' && state.drag) {
        state.r = clamp(R_MIN + (p.x - gx()) / gw() * (R_MAX - R_MIN), R_MIN, R_MAX);
        readouts(); stage.draw();
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    stage.bindRange('pf-qa', 'pf-qav', v => { state.qA = v; readouts(); stage.draw(); }, v => `${v > 0 ? '+' : ''}${v.toFixed(1)} µC`);
    stage.bindRange('pf-qb', 'pf-qbv', v => { state.qB = v; readouts(); stage.draw(); }, v => `${v > 0 ? '+' : ''}${v.toFixed(1)} µC`);

    readouts();
    stage.draw();
  }
})();
