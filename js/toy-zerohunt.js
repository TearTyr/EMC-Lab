/* Zero-Field Hunt — Lesson 3 tiny toy. A treasure map: two or three mystery
   charges hide under a fog of faint field arrows. Drag the E-meter probe —
   the chip plays hot and cold in FLAT colour steps (never a gradient) and a
   star pops when |E| drops under the zero threshold. "New hunt" re-seeds a
   random like-charge layout; "show me" reveals the answer, because a hint
   must never block play. The lesson lands by itself: E = 0 means the vectors
   cancelled, not that the space is empty. */
(function () {
  const canvas = document.getElementById('toy-zerohunt');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, arrow, label, eng } = EMC;
    const WORLD = 2.4;
    const ZERO_T = 250, WARM_T = 2500, COOL_T = 25000;   // N/C thresholds

    const state = { charges: [], probe: { x: WORLD * 0.5, y: WORLD * 0.78 }, drag: false, won: false, revealed: false };
    const el = id => document.getElementById(id);

    function newHunt() {
      const n = 2 + Math.floor(Math.random() * 2);
      const sign = Math.random() < 0.5 ? 1 : -1;
      const qs = [];
      for (let i = 0; i < n; i++) qs.push(sign * (2 + Math.floor(Math.random() * 6)) * 1e-6);
      /* spread them out; keep a real null point inside the map */
      state.charges = qs.map((q, i) => ({
        q,
        x: 0.5 + (i - (n - 1) / 2) * (0.55 + Math.random() * 0.25),
        y: WORLD * (0.3 + Math.random() * 0.25)
      }));
      state.won = false; state.revealed = false;
      state.probe = { x: WORLD * 0.5, y: WORLD * 0.78 };
      readouts(); stage.draw();
    }

    const fieldAt = (xm, ym) => EMC.Sandbox.fieldAt(state.charges, xm, ym, WORLD);

    function readouts() {
      const f = fieldAt(state.probe.x, state.probe.y);
      if (el('zh-e')) el('zh-e').textContent = eng(f.mag, 3) + ' N/C';
      const chip = el('zh-chip');
      if (chip) {
        const band = f.mag < ZERO_T ? 'zero' : f.mag < WARM_T ? 'warm' : f.mag < COOL_T ? 'cool' : 'cold';
        chip.className = 'zh-chip zh-' + band;
        chip.textContent = band === 'zero' ? '\u2605 ZERO — you found the still point!'
          : band === 'warm' ? 'warm… very close' : band === 'cool' ? 'cool — keep sweeping' : 'cold — the field is strong here';
      }
      if (f.mag < ZERO_T && !state.won) {
        state.won = true;
        EMC.toast('\u2605 Zero-field point found! The charges are still there — their vectors just cancel.');
        try {
          const all = JSON.parse(EMC.store.get('emc.stars.v1') || '{}');
          all.zerohunt = Object.assign(all.zerohunt || {}, { 'zh-find': true });
          EMC.store.set('emc.stars.v1', JSON.stringify(all));
        } catch (err) { /* cosmetic */ }
        const disc = el('zh-discover');
        if (disc) disc.hidden = false;
      }
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const sc = Math.min(w, h * (WORLD / (WORLD * 0.9))) / WORLD;
      const ox = (w - WORLD * sc) / 2, oy = (h - WORLD * 0.9 * sc) / 2;
      const P = m => ({ x: ox + m.x * sc, y: oy + m.y * sc });

      /* the fog: faint arrows everywhere, honest E at each cell */
      const step = w < 520 ? 46 : 38;
      ctx.save();
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          const m = { x: (x - ox) / sc, y: (y - oy) / sc };
          const f = fieldAt(m.x, m.y);
          if (f.mag <= 0) continue;
          const len = clamp(3 + (Math.log10(f.mag) + 2) * 1.7, 2, step * 0.42);
          arrow(ctx, x - f.ex / f.mag * len / 2, y - f.ey / f.mag * len / 2,
            x + f.ex / f.mag * len / 2, y + f.ey / f.mag * len / 2,
            { color: 'rgba(168,211,224,.28)', width: 1.2, head: 3.5 });
        }
      }
      ctx.restore();

      /* mystery charges: identical grey discs — sign and size are the secret */
      for (const c of state.charges) {
        const p = P(c);
        ctx.save();
        ctx.beginPath(); ctx.arc(p.x, p.y, state.revealed ? 13 : 10, 0, Math.PI * 2);
        ctx.fillStyle = state.revealed ? (c.q > 0 ? '#f8aebe' : '#a8d3e0') : '#6b6f7a';
        ctx.fill(); ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        if (state.revealed) label(ctx, `${c.q > 0 ? '+' : '−'}${eng(Math.abs(c.q), 2)}C`, p.x, p.y + 24,
          { color: c.q > 0 ? '#fac0cd' : '#cfe9f2', size: 10 });
        else label(ctx, '?', p.x, p.y + 1, { color: '#17181c', size: 11, weight: '800' });
      }

      /* the E-meter probe */
      const pp = P(state.probe);
      const f = fieldAt(state.probe.x, state.probe.y);
      if (f.mag > ZERO_T) {
        const L = clamp(10 + (Math.log10(f.mag) + 2) * 5, 10, 46);
        arrow(ctx, pp.x, pp.y, pp.x + f.ex / f.mag * L, pp.y + f.ey / f.mag * L,
          { color: '#f6d36b', width: 2.4, head: 8 });
      } else {
        ctx.save();
        ctx.strokeStyle = '#b5d777'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        label(ctx, '\u2605', pp.x, pp.y + 1, { color: '#b5d777', size: 12, weight: '800' });
      }
      ctx.save();
      ctx.strokeStyle = '#b5d777'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pp.x - 12, pp.y); ctx.lineTo(pp.x + 12, pp.y);
      ctx.moveTo(pp.x, pp.y - 12); ctx.lineTo(pp.x, pp.y + 12);
      ctx.stroke(); ctx.restore();
      label(ctx, 'drag the probe — sweep until the arrows vanish', w / 2, 14,
        { color: 'rgba(169,186,214,.85)', size: 11, weight: '500' });
      state._P = P; state._sc = sc;
    }

    const stage = new EMC.Stage(canvas, render, { intro: 320 });

    stage.onPointer(p => {
      if (!state._P) return;
      const m = { x: (p.x - (stage.w - WORLD * state._sc) / 2) / state._sc, y: (p.y - (stage.h - WORLD * 0.9 * state._sc) / 2) / state._sc };
      if (p.type === 'down') {
        const pp = state._P(state.probe);
        if (Math.hypot(p.x - pp.x, p.y - pp.y) < 30) { state.drag = true; canvas.classList.add('dragging'); }
      } else if (p.type === 'move' && state.drag) {
        state.probe.x = clamp(m.x, 0.05, WORLD - 0.05);
        state.probe.y = clamp(m.y, 0.05, WORLD * 0.9 - 0.05);
        readouts(); stage.draw();
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    const nb = el('zh-new');
    if (nb) stage.listen(nb, 'click', () => { newHunt(); EMC.toast('New hunt — two or three mystery charges are hiding'); });
    const rv = el('zh-reveal');
    if (rv) stage.listen(rv, 'click', () => {
      state.revealed = true; stage.draw();
      /* mark the analytic null point for two charges: closer to the smaller one */
      EMC.toast('Revealed. For two like charges the zero sits between them, nearer the smaller |q|.');
    });

    newHunt();
  }
})();
