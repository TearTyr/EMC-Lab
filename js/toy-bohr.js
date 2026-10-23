/* Bohr Tuner — Lesson 2 tiny toy. The electron orbits because the Coulomb
   pull IS the centripetal force: k e²/r² = mₑ v²/r, so v = √(k e²/(mₑ r)).
   Tune r (slider or drag) and the speed readout follows from the equation;
   at r = 5.29×10⁻¹¹ m it lands on the lecture's 2.19×10⁶ m/s and earns a
   star. The orbit is drawn at a CONSTANT honest slow-down factor (the same
   pattern as the Lorentz sim), so faster electrons visibly circle faster. */
(function () {
  const canvas = document.getElementById('toy-bohr');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { CONST, clamp, arrow, label, eng, unit } = EMC;
    const K = CONST.K, e = CONST.E, me = CONST.M_ELECTRON;
    const R0 = 5.29e-11;                       // the lecture's Bohr radius

    const state = { r: R0, theta: 0, starred: true, touched: false, drag: false };
    /* starred starts true so merely loading the page cannot 'win';
       the first real adjustment re-arms it. */
    const v = () => Math.sqrt(K * e * e / (me * state.r));
    const Fc = () => K * e * e / (state.r * state.r);
    const T = () => 2 * Math.PI * state.r / v();
    const VIS_PERIOD0 = 2.4;                   // s per orbit at r = R0
    const SLOW = () => VIS_PERIOD0 / T();      // constant honest factor

    const el = id => document.getElementById(id);
    function readouts() {
      if (el('bo-v')) el('bo-v').textContent = unit(v(), 'm/s', 3);
      if (el('bo-f')) el('bo-f').textContent = unit(Fc(), 'N', 3);
      if (el('bo-t')) el('bo-t').textContent = unit(T(), 's', 3);
      if (el('bo-slow')) el('bo-slow').textContent = `visual time ≈ 1/${eng(SLOW(), 2)} of real`;
      const sub = el('bo-sub');
      if (sub) sub.innerHTML = `v = √(k e²/(mₑ r)) = √((8.99×10<sup>9</sup>)(1.602×10<sup>−19</sup>)² ÷ (9.109×10<sup>−31</sup> × ${eng(state.r, 3)})) = <b>${eng(v(), 3)} m/s</b>`;
      const hit = Math.abs(state.r - R0) / R0 < 0.01;
      const vEl = el('bo-v');
      if (vEl) vEl.className = 'stat-value hl-cyan' + (hit ? ' val-hit' : '');
      if (hit && !state.starred) {
        state.starred = true;
        EMC.toast('\u2605 Lecture speed! r = 5.29×10⁻¹¹ m gives v = 2.19×10⁶ m/s — you tuned the Bohr atom.');
        try {
          const all = JSON.parse(EMC.store.get('emc.stars.v1') || '{}');
          all.bohr = { 'bo-speed': true };
          EMC.store.set('emc.stars.v1', JSON.stringify(all));
        } catch (err) { /* cosmetic */ }
        const disc = el('bo-discover');
        if (disc) disc.hidden = false;
      }
      if (!hit) state.starred = false;
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const Rp = clamp(40 + (state.r - 2e-11) / 1e-10 * 95, 34, 150);   // display radius
      ctx.save();
      ctx.strokeStyle = 'rgba(168,211,224,.4)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      /* proton */
      EMC.chargeGlyph(ctx, cx, cy, 16, +e);
      label(ctx, 'p⁺', cx, cy + 30, { color: '#fac0cd', size: 11 });
      /* electron */
      const ex = cx + Math.cos(state.theta) * Rp, ey = cy + Math.sin(state.theta) * Rp;
      const ux = -Math.sin(state.theta), uy = Math.cos(state.theta);        // tangential
      arrow(ctx, ex, ey, cx + (ex - cx) * 0.55, cy + (ey - cy) * 0.55, { color: '#f8aebe', width: 2.6, head: 9 });
      label(ctx, 'F (pull in)', (ex + cx) / 2 + 8, (ey + cy) / 2, { color: '#f8aebe', size: 10 });
      const vLen = clamp(24 + Math.log10(v() / 1e6) * 40, 20, 64);
      arrow(ctx, ex, ey, ex + ux * vLen, ey + uy * vLen, { color: '#b5d777', width: 3, head: 10 });
      label(ctx, `v = ${eng(v(), 3)} m/s`, ex + ux * (vLen + 18), ey + uy * (vLen + 18), { color: '#b5d777', size: 11, weight: '700' });
      EMC.chargeGlyph(ctx, ex, ey, 8, -e);
      label(ctx, `r = ${eng(state.r, 3)} m — drag the electron or use the slider`, w / 2, 16,
        { color: 'rgba(169,186,214,.85)', size: 11.5, weight: '500' });
    }

    const stage = new EMC.Stage(canvas, (ctx, w, h, _st, dt) => {
      state.theta += (2 * Math.PI / VIS_PERIOD0) * (v() / Math.sqrt(K * e * e / (me * R0))) * clamp(dt || 1 / 60, 0, 0.05);
      if (state.theta > Math.PI * 2) state.theta -= Math.PI * 2;
      render(ctx, w, h);
    }, { animate: true, intro: 320 });

    stage.onPointer(p => {
      const cx = stage.w / 2, cy = stage.h / 2;
      if (p.type === 'down') {
        const Rp = clamp(40 + (state.r - 2e-11) / 1e-10 * 95, 34, 150);
        const ex = cx + Math.cos(state.theta) * Rp, ey = cy + Math.sin(state.theta) * Rp;
        if (Math.hypot(p.x - ex, p.y - ey) < 30) { state.drag = true; canvas.classList.add('dragging'); }
      } else if (p.type === 'move' && state.drag) {
        const Rp = clamp(Math.hypot(p.x - cx, p.y - cy), 34, 150);
        state.r = clamp(2e-11 + (Rp - 40) / 95 * 1e-10, 2e-11, 1.2e-10);
        state.theta = Math.atan2(p.y - cy, p.x - cx);
        state.touched = true; state.starred = false;
        const s = el('bo-r'); if (s) s.value = String(+(state.r * 1e11).toFixed(2));
        readouts();
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    stage.bindRange('bo-r', 'bo-rv', v => { state.r = v * 1e-11; state.touched = true; state.starred = false; readouts(); },
      v => `${v.toFixed(2)}×10⁻¹¹ m`);

    readouts();
    stage.draw();
  }
})();
