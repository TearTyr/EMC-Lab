/* Ohm's law calculator — brief R2, rebuilt from the ground up
   (docs/spec/r1-r2-ground-up-plan.md §3): change R and V, SEE I. One loop on
   canvas (battery → resistor → ammeter bead), charge dots crawl at a speed
   proportional to the current, and the whole control set is two sliders with
   exact-value inputs plus lecture presets. Everything the v1 bench carried
   beyond I = V/R (chart, rating, meter range, electron toggle) is cut. */
(function () {
  const canvas = document.getElementById('sim-ohm');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, unit, eng } = EMC;
    const el = id => document.getElementById(id);
    const state = { V: 12, R: 4 };

    const current = () => (state.R > 0 ? state.V / state.R : 0);

    function readouts() {
      const I = current(), P = state.V * I;
      if (el('ohm-I')) el('ohm-I').textContent = unit(I, 'A', 3);
      if (el('ohm-P')) el('ohm-P').textContent = unit(P, 'W', 3);
      const work = `I = V/R = ${state.V.toFixed(1)} V / ${state.R.toFixed(1)} Ω = <b>${unit(I, "A", 3)}</b> · P = VI = <b>${unit(P, "W", 3)}</b>`;
      if (el('ohm-sub')) el('ohm-sub').innerHTML = work;
      if (el('ohm-sub-plain')) el('ohm-sub-plain').textContent =
        `Current = voltage ÷ resistance = ${state.V.toFixed(1)} ÷ ${state.R.toFixed(1)} = ${unit(I, 'A', 3)}. Power = voltage × current = ${unit(P, 'W', 3)}.`;
    }

    function setV(v, from) {
      state.V = clamp(v, 0, 24);
      if (el('ohm-Vv')) el('ohm-Vv').textContent = `${state.V.toFixed(1)} V`;
      if (from !== 'range' && el('ohm-V')) el('ohm-V').value = state.V;
      if (from !== 'num' && el('ohm-Vnum')) el('ohm-Vnum').value = +state.V.toFixed(1);
      readouts(); stage.draw();
    }
    function setR(v, from) {
      state.R = clamp(v, 1, 100);
      if (el('ohm-Rv')) el('ohm-Rv').textContent = `${state.R.toFixed(1)} Ω`;
      if (from !== 'range' && el('ohm-R')) el('ohm-R').value = state.R;
      if (from !== 'num' && el('ohm-Rnum')) el('ohm-Rnum').value = +state.R.toFixed(1);
      readouts(); stage.draw();
    }

    /* one rectangular loop; dots crawl the perimeter at a speed ∝ I */
    function render(ctx, w, h, stage) {
      ctx.clearRect(0, 0, w, h);
      const m = Math.min(w, h) * 0.14;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
      const I = current();
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#3a3d45';
      EMC.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 18); ctx.stroke();

      /* battery (left edge): long plate / short plate */
      const bx = x0, by = (y0 + y1) / 2;
      ctx.strokeStyle = '#f6d36b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(bx - 14, by - 22); ctx.lineTo(bx + 14, by - 22); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(bx - 7, by + 2); ctx.lineTo(bx + 7, by + 2); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(bx - 14, by + 22); ctx.lineTo(bx + 14, by + 22); ctx.stroke();
      ctx.fillStyle = '#f6d36b'; ctx.font = '700 13px G8321, system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(`${state.V.toFixed(1)} V`, bx - 22, by);

      /* resistor (top edge): zigzag */
      const rx = (x0 + x1) / 2, ry = y0;
      ctx.strokeStyle = '#f8aebe'; ctx.lineWidth = 3.5; ctx.beginPath();
      const zw = 74, zh = 13, n = 6;
      ctx.moveTo(rx - zw / 2, ry);
      for (let i = 0; i < n; i++) ctx.lineTo(rx - zw / 2 + zw * (i + .5) / n, ry + (i % 2 ? zh : -zh));
      ctx.lineTo(rx + zw / 2, ry); ctx.stroke();
      ctx.fillStyle = '#f8aebe'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${state.R.toFixed(1)} Ω`, rx, ry - 18);

      /* ammeter bead (right edge) carrying the live I */
      const ax = x1, ay = (y0 + y1) / 2;
      ctx.fillStyle = '#17181c'; ctx.beginPath(); ctx.arc(ax, ay, 21, 0, 7); ctx.fill();
      ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, 21, 0, 7); ctx.stroke();
      ctx.fillStyle = '#a8d3e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 12px G8321, system-ui, sans-serif';
      ctx.fillText(unit(I, 'A', 2), ax, ay);

      /* charge dots: one current, one flow — speed ∝ I, frozen at I = 0 */
      const per = 2 * ((x1 - x0) + (y1 - y0));
      const speed = clamp(I, 0, 6) * 46;                 // px/s along the wire
      const t = performance.now() / 1000;
      const gap = 34, count = Math.floor(per / gap);
      ctx.fillStyle = '#e9ff47';
      for (let i = 0; i < count; i++) {
        let d = (i * gap + t * speed) % per;
        const p = perimeterPoint(d, x0, y0, x1, y1);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, 7); ctx.fill();
      }
      if (I === 0) {
        ctx.fillStyle = '#b9b7ae'; ctx.font = '700 14px G8321, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('no voltage → no current', (x0 + x1) / 2, (y0 + y1) / 2);
      }
    }
    function perimeterPoint(d, x0, y0, x1, y1) {
      const wt = x1 - x0, hr = y1 - y0;
      if (d < wt) return { x: x0 + d, y: y0 };
      d -= wt; if (d < hr) return { x: x1, y: y0 + d };
      d -= hr; if (d < wt) return { x: x1 - d, y: y1 };
      d -= wt; return { x: x0, y: y1 - d };
    }

    const stage = new EMC.Stage(canvas, render, { animate: true });
    stage.bindRange('ohm-V', 'ohm-Vv', v => setV(v, 'range'), v => `${v.toFixed(1)} V`);
    stage.bindRange('ohm-R', 'ohm-Rv', v => setR(v, 'range'), v => `${v.toFixed(1)} Ω`);
    const numIn = (node, set, get) => stage.listen(node, 'input', e => {
      const v = parseFloat(e.target.value);
      if (!isFinite(v)) { e.target.value = get(); return; }   // junk: previous value restored
      set(v, 'num');
      if (Math.abs(parseFloat(e.target.value) - get()) > 1e-9) e.target.value = get();  // clamped: show the truth
    });
    if (el('ohm-Vnum')) numIn(el('ohm-Vnum'), setV, () => +state.V.toFixed(1));
    if (el('ohm-Rnum')) numIn(el('ohm-Rnum'), setR, () => +state.R.toFixed(1));
    document.querySelectorAll('[data-ohm-preset]').forEach(btn => {
      stage.listen(btn, 'click', () => {
        const [v, r] = btn.getAttribute('data-ohm-preset').split(',').map(Number);
        setV(v); setR(r);
      });
    });
    readouts(); stage.draw();
  }
})();
