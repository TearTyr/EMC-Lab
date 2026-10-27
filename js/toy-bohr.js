/* Bohr Tuner — Lesson 2 tiny toy. The electron orbits because the Coulomb
   pull IS the centripetal force: k e²/r² = mₑ v²/r, so v = √(k e²/(mₑ r)).
   Tune r (slider or drag) and the speed readout follows from the equation;
   at r = 5.29×10⁻¹¹ m it lands on the lecture's 2.19×10⁶ m/s and earns a
   star. The orbit is drawn at ONE constant slow-down factor, so the picture
   keeps the real physics: the period grows as r^(3/2), so a larger orbit is
   visibly slower and a smaller one faster.
   Visual pass: guide rings at ½, 1, 1.5 and 2 a₀ (the lecture radius is the
   bright one and locks green when you hit it), a fading orbit trail, a halo
   on the electron, a v/v₀ meter, and a small snap so the lecture radius is
   reachable by dragging (1 px of drag is ~1.05×10⁻¹² m, i.e. 2 % of a₀).
   FIXES: the angular speed used to scale with v instead of v/r, and the
   "slow-down" note was printed inverted ("1/10¹⁶ of real"). */
(function () {
  const canvas = document.getElementById('toy-bohr');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { CONST, clamp, arrow, label, eng, unit } = EMC;
    const K = CONST.K, e = CONST.E, me = CONST.M_ELECTRON;
    const R0 = 5.29e-11;                       // the lecture's Bohr radius
    const R_MIN = 2e-11, R_MAX = 1.2e-10;
    const PINK = '#f8aebe', CYAN = '#a8d3e0', LIME = '#b5d777';

    const state = { r: R0, theta: 0, starred: true, touched: false, drag: false };
    /* starred starts true so merely loading the page cannot 'win';
       the first real adjustment re-arms it. */
    const v = () => Math.sqrt(K * e * e / (me * state.r));
    const v0 = Math.sqrt(K * e * e / (me * R0));
    const Fc = () => K * e * e / (state.r * state.r);
    const T = () => 2 * Math.PI * state.r / v();
    const T0 = 2 * Math.PI * R0 / v0;
    const VIS_PERIOD0 = 2.4;                   // s per orbit at r = R0
    const SLOW = VIS_PERIOD0 / T0;             // ONE constant: drawn seconds per real second

    /* 1.6×10¹⁶ style numbers */
    const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    const sci = (x, sig = 2) => {
      let ex = Math.floor(Math.log10(x)), m = x / Math.pow(10, ex);
      if (Number(m.toFixed(sig - 1)) >= 10) { m /= 10; ex += 1; }
      return `${m.toFixed(sig - 1)}×10${String(ex).split('').map(c => SUP[c] || c).join('')}`;
    };
    const dispR = r => clamp(40 + (r - R_MIN) / 1e-10 * 95, 34, 150);   // world radius → pixels
    const hitLecture = () => Math.abs(state.r - R0) / R0 < 0.01;

    const el = id => document.getElementById(id);
    function readouts() {
      if (el('bo-v')) el('bo-v').textContent = unit(v(), 'm/s', 3);
      if (el('bo-f')) el('bo-f').textContent = unit(Fc(), 'N', 3);
      if (el('bo-t')) el('bo-t').textContent = unit(T(), 's', 3);
      if (el('bo-slow')) el('bo-slow').textContent = `animation runs ≈ ${sci(SLOW, 2)}× slower than reality (one constant factor)`;
      const sub = el('bo-sub');
      if (sub) sub.innerHTML = `v = √(k e²/(mₑ r)) = √((8.99×10<sup>9</sup>)(1.602×10<sup>−19</sup>)² ÷ (9.109×10<sup>−31</sup> × ${unit(state.r, 'm', 3)})) = <b>${unit(v(), 'm/s', 3)}</b>`;
      const hit = hitLecture();
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
      const cx = w / 2, cy = h / 2 + 4;
      const Rp = dispR(state.r);
      const hit = hitLecture();

      /* guide rings in units of a₀; the lecture radius is the bright one */
      [[0.5, '½ a₀'], [1, 'a₀'], [1.5, '1½ a₀'], [2, '2 a₀']].forEach(([k, name]) => {
        const rr = dispR(k * R0);
        const lecture = k === 1;
        ctx.save();
        ctx.setLineDash(lecture ? [6, 5] : [2, 6]);
        ctx.lineWidth = lecture ? 1.8 : 1.2;
        ctx.strokeStyle = lecture ? (hit ? LIME : 'rgba(248,174,190,.6)') : 'rgba(168,211,224,.22)';
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        label(ctx, lecture && hit ? 'a₀ ✓ lecture radius' : name, cx + rr * 0.7071 + 4, cy - rr * 0.7071 - 2,
          { color: lecture ? (hit ? LIME : '#fac0cd') : 'rgba(169,186,214,.5)', size: lecture ? 11 : 10, weight: lecture ? '700' : '500', align: 'left', halo: false });
      });

      /* the electron's current orbit */
      ctx.save();
      ctx.strokeStyle = 'rgba(168,211,224,.75)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      /* fading trail behind the electron (angular speed sign is +) */
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineWidth = 4;
      const SEG = 9, SPAN = 0.9;
      for (let i = 0; i < SEG; i++) {
        const a1 = state.theta - SPAN * (i / SEG), a0 = state.theta - SPAN * ((i + 1) / SEG);
        ctx.strokeStyle = `rgba(181,215,119,${(0.5 * (1 - i / SEG)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(cx, cy, Rp, a0, a1); ctx.stroke();
      }
      ctx.restore();

      /* proton */
      ctx.fillStyle = 'rgba(248,174,190,.14)';
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill();
      EMC.chargeGlyph(ctx, cx, cy, 16, +e);
      label(ctx, 'p⁺', cx, cy + 32, { color: '#fac0cd', size: 11 });

      /* electron + force and velocity arrows */
      const ex = cx + Math.cos(state.theta) * Rp, ey = cy + Math.sin(state.theta) * Rp;
      const ux = -Math.sin(state.theta), uy = Math.cos(state.theta);        // tangential
      ctx.fillStyle = 'rgba(168,211,224,.18)';
      ctx.beginPath(); ctx.arc(ex, ey, 17, 0, Math.PI * 2); ctx.fill();
      arrow(ctx, ex, ey, cx + (ex - cx) * 0.55, cy + (ey - cy) * 0.55, { color: PINK, width: 2.6, head: 9 });
      label(ctx, 'F (pull in)', (ex + cx) / 2 - ux * 18, (ey + cy) / 2 - uy * 18, { color: PINK, size: 10 });
      const vLen = clamp(24 + Math.log10(v() / 1e6) * 40, 20, 64);
      arrow(ctx, ex, ey, ex + ux * vLen, ey + uy * vLen, { color: LIME, width: 3, head: 10 });
      label(ctx, `v = ${unit(v(), 'm/s', 3)}`, ex + ux * (vLen + 18), ey + uy * (vLen + 18), { color: LIME, size: 11, weight: '700' });
      EMC.chargeGlyph(ctx, ex, ey, 8, -e);

      /* header + live meters */
      label(ctx, `r = ${unit(state.r, 'm', 3)} — drag the electron or use the slider`, w / 2, 16,
        { color: 'rgba(169,186,214,.85)', size: 11.5, weight: '500' });
      label(ctx, `r = ${(state.r / R0).toFixed(2)} a₀`, 14, h - 34, { color: 'rgba(169,186,214,.9)', size: 11.5, weight: '600', align: 'left' });
      label(ctx, `v / v₀ = ${(v() / v0).toFixed(2)}  (v ∝ 1/√r)`, 14, h - 16, { color: hit ? LIME : 'rgba(169,186,214,.9)', size: 11.5, weight: '600', align: 'left' });
    }

    const stage = new EMC.Stage(canvas, (ctx, w, h, _st, dt) => {
      /* ω_drawn = 2π / (VIS_PERIOD0 · T/T0): T ∝ r^(3/2), so ω ∝ v/r */
      const omega = 2 * Math.PI / VIS_PERIOD0 * (T0 / T());
      state.theta += omega * clamp(dt || 1 / 60, 0, 0.05);
      if (state.theta > Math.PI * 2) state.theta -= Math.PI * 2;
      render(ctx, w, h);
    }, { animate: true, intro: 320 });

    stage.onPointer(p => {
      const cx = stage.w / 2, cy = stage.h / 2 + 4;
      if (p.type === 'down') {
        const Rp = dispR(state.r);
        const ex = cx + Math.cos(state.theta) * Rp, ey = cy + Math.sin(state.theta) * Rp;
        if (Math.hypot(p.x - ex, p.y - ey) < 30) { state.drag = true; canvas.classList.add('dragging'); }
      } else if (p.type === 'move' && state.drag) {
        const Rp = clamp(Math.hypot(p.x - cx, p.y - cy), 34, 150);
        let r = clamp(R_MIN + (Rp - 40) / 95 * 1e-10, R_MIN, R_MAX);
        if (Math.abs(r - R0) / R0 < 0.03) r = R0;             // magnetic snap to the lecture radius
        state.r = r;
        state.theta = Math.atan2(p.y - cy, p.x - cx);
        state.touched = true; state.starred = false;
        const s = el('bo-r'); if (s) s.value = String(+(state.r * 1e11).toFixed(2));
        readouts();
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    let primed = false;   /* bindRange fires once at bind time; that call is not the user */
    stage.bindRange('bo-r', 'bo-rv', v => { state.r = v * 1e-11; if (primed) { state.touched = true; state.starred = false; } readouts(); },
      v => `${v.toFixed(2)}×10⁻¹¹ m`);
    primed = true;

    readouts();
    stage.draw();
  }
})();
