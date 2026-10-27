/* Ohm's law calculator — brief R2, rebuilt from the ground up
   (docs/spec/r1-r2-ground-up-plan.md §3): change R and V, SEE I. One loop on
   canvas (battery → resistor → ammeter), charge dots crawl at a speed
   proportional to the current, and the whole control set is two sliders with
   exact-value inputs plus lecture presets.
   Visual pass: the wire energises with the current, the resistor warms with
   P = VI, the ammeter carries a gauge ring, chevrons show the conventional
   current direction, and on wide canvases a live I–V graph plots the straight
   line I = V/R with the operating point — so slope = 1/R is SEEN, not told.
   Everything is derived per frame from the two state numbers; the readout
   ids, slider ids and preset buttons are unchanged. */
(function () {
  const canvas = document.getElementById('sim-ohm');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, unit, eng, label, arrow } = EMC;
    const el = id => document.getElementById(id);
    const state = { V: 12, R: 4 };
    const V_MAX = 24, R_MIN = 1, R_MAX = 100;

    const AMBER = '#f6d36b', PINK = '#f8aebe', CYAN = '#a8d3e0', LIME = '#e9ff47';
    const WIRE = '#3a3d45', WIRE_DK = '#25272d', MUTED = 'rgba(169,186,214,.85)';

    const current = () => (state.R > 0 ? state.V / state.R : 0);

    function readouts() {
      const I = current(), P = state.V * I;
      if (el('ohm-I')) el('ohm-I').textContent = unit(I, 'A', 3);
      if (el('ohm-P')) el('ohm-P').textContent = unit(P, 'W', 3);
      const work = `I = V/R = ${state.V.toFixed(1)} V / ${state.R.toFixed(1)} Ω = <b>${unit(I, 'A', 3)}</b> · P = VI = <b>${unit(P, 'W', 3)}</b>`;
      if (el('ohm-sub')) el('ohm-sub').innerHTML = work;
      if (el('ohm-sub-plain')) el('ohm-sub-plain').textContent =
        `Current = voltage ÷ resistance = ${state.V.toFixed(1)} ÷ ${state.R.toFixed(1)} = ${unit(I, 'A', 3)}. Power = voltage × current = ${unit(P, 'W', 3)}.`;
    }

    /* any state change wakes the Stage (it parks itself when I = 0) */
    function changed() {
      readouts();
      if (stage) { stage.setIdle(false); stage.draw(); }
    }
    function setV(v, from) {
      state.V = clamp(v, 0, V_MAX);
      if (el('ohm-Vv')) el('ohm-Vv').textContent = `${state.V.toFixed(1)} V`;
      if (from !== 'range' && el('ohm-V')) el('ohm-V').value = state.V;
      if (from !== 'num' && el('ohm-Vnum')) el('ohm-Vnum').value = +state.V.toFixed(1);
      changed();
    }
    function setR(v, from) {
      state.R = clamp(v, R_MIN, R_MAX);
      if (el('ohm-Rv')) el('ohm-Rv').textContent = `${state.R.toFixed(1)} Ω`;
      if (from !== 'range' && el('ohm-R')) el('ohm-R').value = state.R;
      if (from !== 'num' && el('ohm-Rnum')) el('ohm-Rnum').value = +state.R.toFixed(1);
      changed();
    }

    /* ---- small drawing helpers ------------------------------------------ */
    /* erase a gap in the wire so a part sits IN the conductor, not on top */
    function wireGap(ctx, x, y, len, vertical) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 12; ctx.lineCap = 'butt';
      ctx.beginPath();
      if (vertical) { ctx.moveTo(x, y - len / 2); ctx.lineTo(x, y + len / 2); }
      else { ctx.moveTo(x - len / 2, y); ctx.lineTo(x + len / 2, y); }
      ctx.stroke();
      ctx.restore();
    }
    function chevron(ctx, x, y, ang, a) {
      if (a <= 0.02) return;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = `rgba(233,255,71,${a.toFixed(3)})`;
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(3, 0); ctx.lineTo(-5, 6); ctx.stroke();
      ctx.restore();
    }
    function perimeterPoint(d, x0, y0, x1, y1) {
      const wt = x1 - x0, hr = y1 - y0;
      if (d < wt) return { x: x0 + d, y: y0 };
      d -= wt; if (d < hr) return { x: x1, y: y0 + d };
      d -= hr; if (d < wt) return { x: x1 - d, y: y1 };
      d -= wt; return { x: x0, y: y1 - d };
    }
    /* 1-2-5 ceiling so graph axes always land on friendly numbers */
    function niceCeil(x) {
      if (!(x > 0)) return 1;
      const e = Math.pow(10, Math.floor(Math.log10(x)));
      const f = x / e;
      const ladder = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
      return ladder.find(l => f <= l + 1e-9) * e;
    }

    /* ---- the loop ---------------------------------------------------------- */
    function drawLoop(ctx, lw, h, I, P) {
      const m = Math.min(lw, h) * 0.15;
      const x0 = m + 6, y0 = m, x1 = lw - m - 4, y1 = h - m;
      const live = clamp(I / 6, 0, 1);                       // 0..1 "how energised"
      const bx = x0, by = (y0 + y1) / 2;                      // battery (left edge)
      const rx = (x0 + x1) / 2, ry = y0;                      // resistor (top edge)
      const ax = x1, ay = (y0 + y1) / 2;                      // ammeter (right edge)
      const zw = Math.min(84, (x1 - x0) * 0.3), zh = 13;

      /* wire: dark rail, lighter core, amber energy overlay that follows I */
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      EMC.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 18);
      ctx.lineWidth = 7; ctx.strokeStyle = WIRE_DK; ctx.stroke();
      ctx.lineWidth = 3.2; ctx.strokeStyle = WIRE; ctx.stroke();
      if (live > 0.01) {
        ctx.lineWidth = 3.2; ctx.strokeStyle = `rgba(246,211,107,${(0.12 + 0.5 * live).toFixed(3)})`; ctx.stroke();
      }
      ctx.restore();
      wireGap(ctx, bx, by, 66, true);
      wireGap(ctx, rx, ry, zw + 14, false);
      wireGap(ctx, ax, ay, 56, true);

      /* ---- battery: long plate = +, short plate = − ---- */
      ctx.save();
      ctx.strokeStyle = AMBER; ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(bx - 15, by - 22); ctx.lineTo(bx + 15, by - 22); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(bx - 8, by - 6); ctx.lineTo(bx + 8, by - 6); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(bx - 15, by + 10); ctx.lineTo(bx + 15, by + 10); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(bx - 8, by + 26); ctx.lineTo(bx + 8, by + 26); ctx.stroke();
      ctx.restore();
      label(ctx, '+', bx + 24, by - 22, { color: PINK, size: 13, weight: '800', halo: false });
      label(ctx, '−', bx + 24, by + 26, { color: CYAN, size: 14, weight: '800', halo: false });
      label(ctx, `${state.V.toFixed(1)} V`, bx + 40, by + 2, { color: AMBER, size: 13, weight: '700', align: 'left' });

      /* ---- resistor: warms with P (flat opacity steps, no gradient) ---- */
      const heat = clamp(Math.sqrt(P / 400), 0, 1);
      if (heat > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(248,174,190,${(0.1 + 0.32 * heat).toFixed(3)})`;
        EMC.roundRect(ctx, rx - zw / 2 - 8, ry - zh - 8, zw + 16, zh * 2 + 16, 10); ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = PINK; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      const n = 6;
      ctx.moveTo(rx - zw / 2 - 6, ry); ctx.lineTo(rx - zw / 2, ry);
      for (let i = 0; i < n; i++) ctx.lineTo(rx - zw / 2 + zw * (i + 0.5) / n, ry + (i % 2 ? zh : -zh));
      ctx.lineTo(rx + zw / 2, ry); ctx.lineTo(rx + zw / 2 + 6, ry);
      ctx.stroke();
      ctx.restore();
      label(ctx, `R = ${state.R.toFixed(1)} Ω`, rx, ry - 26, { color: PINK, size: 13, weight: '700' });
      label(ctx, `drop ${state.V.toFixed(1)} V`, rx, ry + 30, { color: MUTED, size: 10.5, weight: '500' });

      /* ---- ammeter: ring gauge on a log scale, value in the middle ---- */
      const gr = 25;
      ctx.save();
      ctx.fillStyle = '#17181c';
      ctx.beginPath(); ctx.arc(ax, ay, gr, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.strokeStyle = '#2e3138';
      ctx.beginPath(); ctx.arc(ax, ay, gr - 2, 0.75 * Math.PI, 2.25 * Math.PI); ctx.stroke();
      const frac = I > 0 ? clamp((Math.log10(I) + 1.5) / 3, 0.02, 1) : 0;   // 30 mA … 30 A
      if (frac > 0) {
        ctx.strokeStyle = CYAN;
        ctx.beginPath(); ctx.arc(ax, ay, gr - 2, 0.75 * Math.PI, (0.75 + 1.5 * frac) * Math.PI); ctx.stroke();
      }
      ctx.restore();
      label(ctx, unit(I, 'A', 2), ax, ay - 1, { color: CYAN, size: 11.5, weight: '700', halo: false });
      label(ctx, 'ammeter', ax, ay + gr + 13, { color: MUTED, size: 10, weight: '500' });

      /* ---- conventional-current chevrons (clockwise from the + plate) ---- */
      const ca = live > 0 ? 0.35 + 0.5 * live : 0;
      chevron(ctx, x0 + (x1 - x0) * 0.2, y0, 0, ca);
      chevron(ctx, x0 + (x1 - x0) * 0.8, y0, 0, ca);
      chevron(ctx, x1, y0 + (y1 - y0) * 0.2, Math.PI / 2, ca);
      chevron(ctx, x1, y0 + (y1 - y0) * 0.8, Math.PI / 2, ca);
      chevron(ctx, x0 + (x1 - x0) * 0.3, y1, Math.PI, ca);
      chevron(ctx, x0 + (x1 - x0) * 0.7, y1, Math.PI, ca);
      chevron(ctx, x0, y0 + (y1 - y0) * 0.14, -Math.PI / 2, ca);
      chevron(ctx, x0, y0 + (y1 - y0) * 0.86, -Math.PI / 2, ca);

      /* ---- charge dots: one current, one flow; speed ∝ I; hidden inside parts ---- */
      const per = 2 * ((x1 - x0) + (y1 - y0));
      const speed = clamp(I, 0, 6) * 46;                    // px/s along the wire
      const t = performance.now() / 1000;
      const gap = 34, count = Math.floor(per / gap);
      for (let i = 0; i < count; i++) {
        const d = (i * gap + t * speed) % per;
        const p = perimeterPoint(d, x0, y0, x1, y1);
        if (Math.abs(p.x - bx) < 20 && Math.abs(p.y - by) < 36) continue;
        if (Math.abs(p.y - ry) < 18 && Math.abs(p.x - rx) < zw / 2 + 8) continue;
        if (Math.hypot(p.x - ax, p.y - ay) < gr + 4) continue;
        ctx.fillStyle = 'rgba(233,255,71,.16)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = LIME;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill();
      }

      /* the oversized answer, in the middle of the loop */
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const big = clamp(Math.min(x1 - x0, y1 - y0) * 0.17, 20, 34);
      if (I === 0) {
        label(ctx, 'no voltage → no current', cx, cy, { color: '#b9b7ae', size: 14, weight: '700' });
      } else if (x1 - x0 > 190 && y1 - y0 > 130) {
        label(ctx, 'I = V ÷ R', cx, cy - big * 1.15, { color: MUTED, size: 12, weight: '600', halo: false });
        label(ctx, unit(I, 'A', 3), cx, cy, { color: CYAN, size: big, weight: '800', halo: false });
        label(ctx, `P = VI = ${unit(P, 'W', 3)}`, cx, cy + big * 1.1, { color: AMBER, size: 12.5, weight: '700', halo: false });
      }
      /* legend */
      label(ctx, 'dots & chevrons: conventional current (+ → −)', x0, h - 8,
        { color: MUTED, size: 10, weight: '500', align: 'left', baseline: 'alphabetic' });
    }

    /* ---- the I–V graph (wide canvases only) ------------------------------- */
    function drawGraph(ctx, gx, gy, gw, gh, I) {
      const padL = 46, padR = 14, padT = 26, padB = 34;
      const px = gx + padL, py = gy + padT, pw = gw - padL - padR, ph = gh - padT - padB;
      if (pw < 60 || ph < 60) return;
      const yMax = niceCeil(V_MAX / state.R);

      /* card */
      ctx.save();
      ctx.fillStyle = 'rgba(34,36,43,.55)';
      EMC.roundRect(ctx, gx, gy, gw, gh, 14); ctx.fill();
      ctx.strokeStyle = '#2e3138'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      label(ctx, 'I–V graph', gx + gw / 2, gy + 14, { color: '#e8eefb', size: 12, weight: '700', halo: false });

      const X = v => px + (v / V_MAX) * pw;
      const Y = i => py + ph - (i / yMax) * ph;

      /* grid + ticks */
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.14)'; ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const gxk = px + pw * k / 4, gyk = py + ph * k / 4;
        ctx.beginPath(); ctx.moveTo(gxk, py); ctx.lineTo(gxk, py + ph); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, gyk); ctx.lineTo(px + pw, gyk); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(169,186,214,.55)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.lineTo(px + pw, py + ph); ctx.stroke();
      ctx.restore();
      for (let k = 0; k <= 4; k++) {
        label(ctx, String(V_MAX * k / 4), px + pw * k / 4, py + ph + 12, { color: MUTED, size: 10, weight: '500', halo: false });
        label(ctx, eng(yMax * (4 - k) / 4, 2).replace('\u00A0', ''), px - 6, py + ph * k / 4,
          { color: MUTED, size: 10, weight: '500', align: 'right', halo: false });
      }
      label(ctx, 'V (volts)', px + pw / 2, gy + gh - 8, { color: MUTED, size: 10.5, weight: '600', halo: false });
      ctx.save();
      ctx.translate(gx + 11, py + ph / 2); ctx.rotate(-Math.PI / 2);
      label(ctx, 'I (amps)', 0, 0, { color: MUTED, size: 10.5, weight: '600', halo: false });
      ctx.restore();

      /* the line I = V/R, and the filled run from 0 → V */
      ctx.save();
      ctx.strokeStyle = 'rgba(168,211,224,.35)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(V_MAX), Y(V_MAX / state.R)); ctx.stroke();
      ctx.strokeStyle = CYAN; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(state.V), Y(I)); ctx.stroke();
      /* operating-point guides */
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(246,211,107,.65)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(X(state.V), py + ph); ctx.lineTo(X(state.V), Y(I)); ctx.lineTo(px, Y(I)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = AMBER; ctx.strokeStyle = '#17181c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(state.V), Y(I), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();

      /* labels: point readout and slope */
      const right = X(state.V) < px + pw * 0.62;
      label(ctx, `${state.V.toFixed(1)} V, ${unit(I, 'A', 2)}`, X(state.V) + (right ? 10 : -10), Math.max(py + 8, Y(I) - 14),
        { color: AMBER, size: 11, weight: '700', align: right ? 'left' : 'right' });
      label(ctx, `slope = 1/R = ${unit(1 / state.R, 'S', 2)}`, px + pw - 2, py + ph - 10,
        { color: CYAN, size: 10.5, weight: '600', align: 'right' });
    }

    function render(ctx, w, h, stg) {
      ctx.clearRect(0, 0, w, h);
      const I = current(), P = state.V * I;
      const wide = w >= 620;
      const gw = wide ? Math.round(w * 0.36) : 0;
      const lw = w - gw;
      drawLoop(ctx, lw, h, I, P);
      if (wide) drawGraph(ctx, lw + 4, Math.round(h * 0.07), gw - 10, Math.round(h * 0.86), I);
      /* nothing moves at I = 0: park the loop until a slider wakes it */
      if (I === 0 && stg && stg.setIdle && stg.intro() >= 1) stg.setIdle(true);
    }

    const stage = new EMC.Stage(canvas, render, { animate: true, intro: 280 });
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
