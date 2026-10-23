/* Dipole Builder — Lesson 3 tiny toy. Two opposite charges joined by a
   stretchy bond: pull them apart, squeeze them, spin the pair, flip the
   polarity. Field lines are re-traced live from E(P) = Σ kq r̂/r² (the same
   integrator as the Field Painter), and the readout prints the field at a
   fixed point on the bisector — so stretching the bond shows the far field
   rearranging itself in real time. */
(function () {
  const canvas = document.getElementById('toy-dipole');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, arrow, label, eng, unit } = EMC;
    const WORLD = 2.4;                          // metres across

    const state = { sep: 0.7, ang: 0, q: 5, flip: 1 };   // µC magnitude
    const el = id => document.getElementById(id);

    const charges = () => {
      const cx = WORLD / 2, cy = WORLD * 0.44;
      const dx = Math.cos(state.ang) * state.sep / 2, dy = Math.sin(state.ang) * state.sep / 2;
      const s = state.flip;
      return [
        { q: s * state.q * 1e-6, x: cx - dx, y: cy - dy },
        { q: -s * state.q * 1e-6, x: cx + dx, y: cy + dy }
      ];
    };
    const fieldAt = (cs, xm, ym) => EMC.Sandbox.fieldAt(cs, xm, ym, WORLD);

    function readouts() {
      const cs = charges();
      /* fixed probe point: 0.75 m "above" the dipole centre on the bisector */
      const cx = WORLD / 2, cy = WORLD * 0.44;
      const px = cx + Math.sin(state.ang) * 0.75, py = cy - Math.cos(state.ang) * 0.75;
      const f = fieldAt(cs, px, py);
      if (el('dp-e')) el('dp-e').textContent = unit(f.mag, 'N/C', 3);
      if (el('dp-dir')) el('dp-dir').textContent = f.mag > 0 ? EMC.Sandbox.dirWord(f.ex, f.ey) : '—';
      const sub = el('dp-sub');
      if (sub) sub.innerHTML = `E(bisector point) = |Σ kqᵢ r̂ᵢ/rᵢ²| = <b>${eng(f.mag, 3)} N/C</b> for q = ±${state.q.toFixed(1)} µC, d = ${state.sep.toFixed(2)} m`;
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const sc = w / WORLD;
      const cs = charges();
      const px = p => ({ x: p.x * sc, y: p.y * sc });

      /* field lines (integrated along E, seeded on the positive charge) */
      const pos = cs[0].q > 0 ? cs[0] : cs[1];
      ctx.save(); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      const nL = 16, step = 2.6;
      for (let i = 0; i < nL; i++) {
        const a0 = (i / nL) * Math.PI * 2;
        let x = px(pos).x + Math.cos(a0) * 16, y = px(pos).y + Math.sin(a0) * 16;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 700; s++) {
          const m = { x: x / sc, y: y / sc };
          const f = fieldAt(cs, m.x, m.y);
          if (f.mag < 1e-9) break;
          x += f.ex / f.mag * step; y += f.ey / f.mag * step;
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) break;
          ctx.lineTo(x, y);
          const neg = cs[0].q > 0 ? cs[1] : cs[0];
          if (Math.hypot(x - px(neg).x, y - px(neg).y) < 14) break;
        }
        ctx.strokeStyle = 'rgba(248,174,190,.65)';
        ctx.stroke();
      }
      ctx.restore();

      /* bond */
      const A = px(cs[0]), B = px(cs[1]);
      ctx.save();
      ctx.strokeStyle = 'rgba(213,184,216,.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.restore();
      label(ctx, `d = ${state.sep.toFixed(2)} m`, (A.x + B.x) / 2 + 16, (A.y + B.y) / 2 - 12,
        { color: '#d5b8d8', size: 10.5, weight: '700' });

      /* bisector probe point + its E arrow */
      const cx = WORLD / 2, cy = WORLD * 0.44;
      const pX = (cx + Math.sin(state.ang) * 0.75) * sc, pY = (cy - Math.cos(state.ang) * 0.75) * sc;
      const f = fieldAt(cs, pX / sc, pY / sc);
      if (f.mag > 0) {
        const L = clamp(12 + (Math.log10(f.mag) + 3) * 6, 12, 52);
        arrow(ctx, pX, pY, pX + f.ex / f.mag * L, pY + f.ey / f.mag * L, { color: '#f6d36b', width: 2.6, head: 9 });
      }
      ctx.save();
      ctx.strokeStyle = '#f6d36b'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(pX, pY, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      label(ctx, 'bisector point', pX, pY - 16, { color: '#f6d36b', size: 10 });

      for (const c of cs) {
        const p = px(c);
        EMC.chargeGlyph(ctx, p.x, p.y, 15, c.q);
      }
      label(ctx, 'drag the sliders — lines re-trace from the real superposition every frame',
        w / 2, 14, { color: 'rgba(169,186,214,.8)', size: 10.5, weight: '500' });
    }

    const stage = new EMC.Stage(canvas, render, { intro: 320 });

    stage.bindRange('dp-sep', 'dp-sepv', v => { state.sep = v; readouts(); stage.draw(); }, v => `${v.toFixed(2)} m`);
    stage.bindRange('dp-ang', 'dp-angv', v => { state.ang = v * Math.PI / 180; readouts(); stage.draw(); }, v => `${v.toFixed(0)}°`);
    stage.bindRange('dp-q', 'dp-qv', v => { state.q = v; readouts(); stage.draw(); }, v => `${v.toFixed(1)} µC`);
    const flip = el('dp-flip');
    if (flip) stage.listen(flip, 'click', () => {
      state.flip = -state.flip;
      flip.setAttribute('aria-pressed', String(state.flip < 0));
      readouts(); stage.draw();
    });

    readouts();
    stage.draw();
  }
})();
