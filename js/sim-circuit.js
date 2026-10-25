/* Sim 2 - circuit builder (topics/current.html). Exact series/parallel/combination solve with per element V, I, P; animated charge flow whose density tracks branch current; resistors clickable on canvas. */
(function () {
  const canvas = document.getElementById('sim-circuit');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { clamp, lerp, label, eng, unit, fixed } = EMC;

  /* ---- state ---------------------------------------------------------- */
  /* Drag-and-drop bench (brief R1): every resistor lives in a wiring LANE —
     'series' (the top wire) or 'parallel' (a vertical branch). Dragging a
     resistor between lanes REWIRES the circuit; dragging it off the bench
     deletes it; the battery and the bulb can be dragged off (disconnect) and
     back on from the palette. The topology segment control is a shortcut that
     moves every resistor at once; state.topology is the derived label. */
  const LIMITS = { series: [1, 4], parallel: [2, 4], combo: [3, 3] };
  const MAX_R = 4;
  const state = {
    topology: 'series',
    V: 12,
    resistors: [10, 22, 47],
    lanes: ['series', 'series', 'series'],
    batteryIn: true,
    bulbR: 15,
    includeBulb: true,
    selected: 0
  };
  const drag = { active: null };        // {kind:'R'|'battery'|'bulb', idx, x, y}

  function syncTopology() {
    const n = state.lanes.length;
    const ser = state.lanes.filter(l => l === 'series').length;
    state.topology = n === 0 ? 'series' : ser === n ? 'series' : ser === 0 ? 'parallel' : 'combo';
    document.querySelectorAll('#circ-topology .seg-btn').forEach(b => {
      const on = b.dataset.value === state.topology;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const addBtn = document.getElementById('circ-add');
    if (addBtn) addBtn.disabled = state.resistors.length >= MAX_R;
  }

  /* ---- circuit analysis ------------------------------------------------ */
  /* Lane-general series-parallel reduction (the brief's "circuit reduction"):
     R(eq) = ΣR(series) + 1/Σ(1/R(parallel)); exact per-element V/I/P follow.
     Battery dragged off => no EMF => everything is honestly zero. No
     resistors AND bulb bypassed => a short: flagged, never Infinity/NaN. */
  function analyze() {
    const R = state.resistors.slice(), lanes = state.lanes;
    const ser = [], par = [];
    R.forEach((r, i) => (lanes[i] === 'parallel' ? par : ser).push({ r, i }));
    const Rser = ser.reduce((a, c) => a + c.r, 0);
    const sumG = par.reduce((a, c) => a + 1 / c.r, 0);
    const Rpar = par.length ? 1 / sumG : 0;
    const Rbank = Rser + Rpar;

    let breakdown;
    if (!R.length) breakdown = 'no resistors connected \u2014 wires only';
    else if (!par.length) breakdown = `R(eq) = ${R.map(r => fixed(r, 0)).join(' + ')} = ${fixed(Rbank, 2)} \u03A9`;
    else if (!ser.length) breakdown = `1/R(eq) = ${R.map(r => `1/${fixed(r, 0)}`).join(' + ')} = ${fixed(sumG, 4)} S  \u21D2  R(eq) = ${fixed(Rbank, 2)} \u03A9`;
    else {
      const parTxt = par.length === 2
        ? `R\u209A = (${fixed(par[0].r, 0)} \u00D7 ${fixed(par[1].r, 0)}) / (${fixed(par[0].r, 0)} + ${fixed(par[1].r, 0)}) = ${fixed(Rpar, 2)} \u03A9`
        : `1/R\u209A = ${par.map(c => `1/${fixed(c.r, 0)}`).join(' + ')} = ${fixed(sumG, 4)} S  \u21D2  R\u209A = ${fixed(Rpar, 2)} \u03A9`;
      breakdown = `${parTxt}   \u21D2   R(eq) = ${fixed(Rser, 2)} + ${fixed(Rpar, 2)} = ${fixed(Rbank, 2)} \u03A9`;
    }

    const Rbulb = state.includeBulb ? state.bulbR : 0;
    const Rtotal = Rbank + Rbulb;
    const short = !(Rtotal > 0.01);
    const Veff = state.batteryIn ? state.V : 0;
    const Itotal = short ? 0 : Veff / Rtotal;
    const Vbank = Itotal * Rbank;
    const Vpar = Itotal * Rpar;
    const Vbulb = Itotal * Rbulb;
    const Pbulb = Itotal * Itotal * Rbulb;
    const per = R.map((r, i) => lanes[i] === 'parallel'
      ? { i, r, I: Vpar / r, V: Vpar, P: (Vpar * Vpar) / r }
      : { i, r, I: Itotal, V: Itotal * r, P: Itotal * Itotal * r });
    return { Rbank, Rtotal, Itotal, Vbank, Vbulb, Pbulb, per, breakdown, short };
  }

  /* ---- layout ---------------------------------------------------------- */
  /* * Builds the geometry for the current topology. * @returns {{frame:Object, comps:Array, paths:Array, hits:Array}} * comps: components to draw; paths: {points, current} for charge animation; * hits: clickable rectangles mapped to resistor indices. */
  function buildLayout(w, h, A) {
    const bx = Math.max(40, w * 0.075), rx = w - Math.max(40, w * 0.075);
    const ty = Math.max(38, h * 0.16), by = h - Math.max(40, h * 0.17);
    const bulbX = bx + (rx - bx) * 0.16;
    const frame = { bx, rx, ty, by, bulbX };
    const comps = [], hits = [], paths = [];

    comps.push({ type: 'battery', x: bx, y: (ty + by) / 2, V: state.V, connected: state.batteryIn });
    hits.push({ kind: 'battery', idx: -1, x: bx - 32, y: (ty + by) / 2 - 36, w: 64, h: 80 });
    if (state.includeBulb) {
      comps.push({ type: 'bulb', x: bulbX, y: by, P: A.Pbulb });
      hits.push({ kind: 'bulb', idx: -1, x: bulbX - 26, y: by - 26, w: 52, h: 52 });
    }

    const serIdx = [], parIdx = [];
    state.resistors.forEach((r, i) => (state.lanes[i] === 'parallel' ? parIdx : serIdx).push(i));

    if (serIdx.length) {
      const x0 = bx + 64, x1 = parIdx.length ? bx + (rx - bx) * 0.50 : rx - 30;
      serIdx.forEach((ri, k) => {
        const x = lerp(x0, x1, (k + 0.5) / serIdx.length);
        const p = A.per[ri];
        comps.push({ type: 'R', x, y: ty, angle: 0, idx: ri, R: p.r, I: p.I, V: p.V });
        hits.push({ kind: 'R', idx: ri, x: x - 52, y: ty - 26, w: 104, h: 52 });
      });
    }
    if (parIdx.length) {
      const x0 = serIdx.length ? bx + (rx - bx) * 0.58 : bx + (rx - bx) * 0.34;
      const x1 = rx - 26;
      parIdx.forEach((ri, k) => {
        const x = lerp(x0, x1, (k + 0.5) / parIdx.length);
        const p = A.per[ri];
        comps.push({ type: 'R', x, y: (ty + by) / 2, angle: Math.PI / 2, idx: ri, R: p.r, I: p.I, V: p.V });
        comps.push({ type: 'node', x, y: ty }); comps.push({ type: 'node', x, y: by });
        hits.push({ kind: 'R', idx: ri, x: x - 24, y: (ty + by) / 2 - 46, w: 48, h: 92 });
        paths.push({ points: [[x, ty], [x, by]], current: p.I });   // branch current, vertical run
      });
    }
    paths.unshift({ points: [[bx, ty], [rx, ty], [rx, by], [bx, by], [bx, ty]], current: A.Itotal });

    if (drag.active && drag.active.kind === 'R') {
      comps.push({ type: 'zone', y0: 0, y1: h * 0.55, text: 'drop on the top wire \u2192 SERIES' });
      comps.push({ type: 'zone', y0: h * 0.55, y1: h, text: 'drop low \u2192 PARALLEL branch' });
      comps.push({ type: 'zone', off: true, y0: 0, y1: h, text: 'drag off the bench \u2192 remove' });
    }
    if (!state.resistors.length) {
      comps.push({ type: 'note', x: (bx + rx) / 2, y: (ty + by) / 2, text: 'no resistors \u2014 drag one from the palette' });
    } else if (serIdx.length && parIdx.length) {
      comps.push({ type: 'note', x: bx + (rx - bx) * 0.30, y: ty + 40, text: 'in series with the parallel bank' });
    }
    return { frame, comps, paths, hits };
  }

  /* ---- component painters --------------------------------------------- */
  function drawWires(ctx, F) {
    ctx.save();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(F.bx, F.ty); ctx.lineTo(F.rx, F.ty); ctx.lineTo(F.rx, F.by);
    ctx.lineTo(F.bx, F.by); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawResistor(ctx, x, y, angle, R, selected, hot) {
    const w = 58, h = 12, lead = 16;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    if (selected) {
      ctx.save();
      ctx.strokeStyle = 'rgba(34,211,238,.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
      EMC.roundRect(ctx, -w / 2 - lead - 6, -h - 8, w + 2 * lead + 12, 2 * h + 16, 8);
      ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = hot ? '#fac0cd' : '#e2e8f0';
    ctx.lineWidth = hot ? 3.2 : 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (hot) { ctx.strokeStyle = '#f8aebe'; }
    ctx.beginPath();
    ctx.moveTo(-w / 2 - lead, 0); ctx.lineTo(-w / 2, 0);
    const peaks = 5, pw = w / peaks;
    for (let i = 0; i < peaks; i++) {
      const sx = -w / 2 + i * pw;
      ctx.lineTo(sx + pw * 0.25, -h); ctx.lineTo(sx + pw * 0.75, h); ctx.lineTo(sx + pw, 0);
    }
    ctx.lineTo(w / 2 + lead, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawBattery(ctx, x, y, V, connected) {
    ctx.save();
    if (connected === false) {
      ctx.setLineDash([5, 5]); ctx.globalAlpha = 0.45;
    }
    ctx.strokeStyle = '#e8eefb'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 14, y - 10); ctx.lineTo(x + 14, y - 10); ctx.stroke();
    ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 2); ctx.lineTo(x + 7, y - 2); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 14, y + 8); ctx.lineTo(x + 14, y + 8); ctx.stroke();
    ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(x - 7, y + 16); ctx.lineTo(x + 7, y + 16); ctx.stroke();
    label(ctx, '+', x + 21, y - 12, { color: '#f8aebe', size: 13, weight: '800' });
    label(ctx, connected === false ? 'drag me back on' : `${fixed(V, 1)} V`, x - 8, y + 38,
      { color: connected === false ? '#7b8db0' : '#f6d36b', size: 12, weight: '700', align: 'center' });
    ctx.restore();
  }

  function drawBulb(ctx, x, y, P) {
    const b = clamp(P / 3, 0, 1);      // 3 W = reference "full brightness"
    const r = 15;
    ctx.save();
    if (b > 0.02) {
      ctx.fillStyle = `rgba(246,211,107,${0.05 + b * 0.17})`;
      ctx.beginPath(); ctx.arc(x, y, r * (1.8 + b * 1.7), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = `rgba(246,211,107,${0.14 + b * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = b > 0.02 ? `hsl(${45 - b * 22} 100% ${58 + b * 34}%)` : '#7b8db0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.7); ctx.lineTo(x - r * 0.2, y - r * 0.2);
    ctx.lineTo(x + r * 0.2, y + r * 0.2); ctx.lineTo(x + r * 0.7, y - r * 0.7);
    ctx.stroke();
    ctx.restore();
    label(ctx, `bulb ${fixed(state.bulbR, 0)}\u03A9`, x, y + r + 17, { color: '#a9bad6', size: 10.5, weight: '600' });
  }

  function drawNode(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#93a7c8';
    ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  /* Animated charge flow along a polyline. Density + speed scale with current. */
  function drawFlow(ctx, points, current, Imax, t) {
    if (!(current > 0)) return;
    const lens = []; let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const l = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
      lens.push(l); total += l;
    }
    if (total <= 0) return;
    const frac = clamp(current / (Imax || current), 0.05, 1);
    const n = Math.round(clamp(4 + 24 * frac, 4, 28));
    const speed = clamp(50 + 320 * frac, 30, 380);     // px per second
    const phase = (t * speed / total) % 1;
    ctx.save();
    ctx.fillStyle = '#f6d36b';
    for (let i = 0; i < n; i++) {
      let d = (((i / n) + phase) % 1) * total, px = points[0][0], py = points[0][1];
      for (let s = 0; s < lens.length; s++) {
        if (d <= lens[s]) {
          const k = lens[s] === 0 ? 0 : d / lens[s];
          px = points[s][0] + (points[s + 1][0] - points[s][0]) * k;
          py = points[s][1] + (points[s + 1][1] - points[s][1]) * k;
          break;
        }
        d -= lens[s];
      }
      ctx.beginPath(); ctx.arc(px, py, 2.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- main render ----------------------------------------------------- */
  let lastHits = [];
  function render(ctx, w, h, stage) {
    ctx.clearRect(0, 0, w, h);
    const A = analyze();
    const L = buildLayout(w, h, A);
    lastHits = L.hits;

    drawWires(ctx, L.frame);
    // charge flow (drawn under the components so symbols stay legible)
    for (const p of L.paths) drawFlow(ctx, p.points, p.current, A.Itotal, stage.t);

    for (const c of L.comps) {
      if (c.type === 'R') {
        drawResistor(ctx, c.x, c.y, c.angle, c.R, c.idx === state.selected, c.V * c.I > 2);
        const vertical = Math.abs(c.angle) > 0.1;
        const lx = vertical ? c.x + 34 : c.x;
        const ly = vertical ? c.y - 4 : c.y - 26;
        label(ctx, `R${c.idx + 1} = ${fixed(c.R, 0)} \u03A9`, lx, ly,
          { color: c.idx === state.selected ? '#cfe9f2' : '#cfe9f2', size: 11.5, weight: '700',
            align: vertical ? 'left' : 'center' });
        label(ctx, `I = ${eng(c.I, 2)} A`, lx, ly + (vertical ? 16 : -16),
          { color: '#f6d36b', size: 10.5, weight: '600', align: vertical ? 'left' : 'center' });
      } else if (c.type === 'battery') drawBattery(ctx, c.x, c.y, c.V, c.connected);
      else if (c.type === 'bulb') drawBulb(ctx, c.x, c.y, c.P);
      else if (c.type === 'node') drawNode(ctx, c.x, c.y);
      else if (c.type === 'note') label(ctx, c.text, c.x, c.y, { color: 'rgba(148,163,184,.75)', size: 10.5, weight: '500' });
      else if (c.type === 'zone' && !c.off) {
        ctx.save();
        ctx.fillStyle = 'rgba(34,211,238,.05)';
        ctx.fillRect(0, c.y0, w, c.y1 - c.y0);
        ctx.strokeStyle = 'rgba(34,211,238,.25)'; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(0, c.y1); ctx.lineTo(w, c.y1); ctx.stroke();
        label(ctx, c.text, w / 2, (c.y0 + c.y1) / 2 - (c.y0 === 0 ? -18 : 8),
          { color: 'rgba(167,243,208,.8)', size: 11, weight: '700', align: 'center' });
        ctx.restore();
      }
    }

    // the dragged component rides with the pointer
    if (drag.active) {
      const d = drag.active;
      ctx.save(); ctx.globalAlpha = 0.85;
      if (d.kind === 'R') drawResistor(ctx, d.x, d.y, 0, state.resistors[d.idx], true, false);
      else if (d.kind === 'battery') drawBattery(ctx, d.x, d.y, state.V, true);
      else if (d.kind === 'bulb') drawBulb(ctx, d.x, d.y, 0);
      ctx.restore();
      if (d.x < 0 || d.y < 0 || d.x > w || d.y > h) {
        label(ctx, 'release to disconnect', clamp(d.x, 70, w - 70), clamp(d.y, 16, h - 8),
          { color: '#f8aebe', size: 11.5, weight: '800', align: 'center' });
      }
    }

    // headline numbers on the canvas
    label(ctx, `I(total) = ${eng(A.Itotal, 3)} A`, w / 2, h - 12,
      { color: '#cfe9f2', size: 12.5, weight: '800' });
    label(ctx, `R(eq) = ${fixed(A.Rbank, 2)} \u03A9`, w - 12, 16,
      { color: '#a7f3d0', size: 12, weight: '800', align: 'right' });
  }

  const stage = new EMC.Stage(canvas, render, { animate: true, intro: 480 });

  /* prefers-reduced-motion parks the rAF loop, which also parks the drifting
     charge carriers. Any deliberate interaction with the bench - a topology
     click, a slider, a drag - is a request for motion, so it starts the loop
     (no-op when it is already running). Issue #3 item 2. */
  const benchSection = canvas.closest('section') || canvas.parentElement;
  if (benchSection) {
    ['pointerdown', 'input', 'click'].forEach(ev =>
      stage.listen(benchSection, ev, () => stage.start(), { passive: true }));
  }

  /* ---- HTML readouts + resistor table ---------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const A = analyze();
    const set = (id, v) => { if (el(id)) el(id).textContent = v; };
    set('circ-req', `${fixed(A.Rbank, 2)} \u03A9`);
    set('circ-rtotal', A.short ? 'SHORT (\u2248 0 \u03A9)' : `${fixed(A.Rtotal, 2)} \u03A9`);
    set('circ-itotal', A.short ? '\u221E would flow \u2014 add R!' : state.batteryIn ? unit(A.Itotal, 'A', 3) : '0.00 A (no battery)');
    // 3 significant figures so that Kirchhoff's voltage law visibly adds up:
    // V(bank) + V(bulb) must equal the supply voltage on screen.
    set('circ-vbank', unit(A.Vbank, 'V', 3));
    set('circ-vbulb', state.includeBulb ? unit(A.Vbulb, 'V', 3) : 'bypassed');
    set('circ-pbulb', state.includeBulb ? unit(A.Pbulb, 'W', 3) : '\u2014');
    set('circ-ptotal', unit(state.V * A.Itotal, 'W', 3));
    set('circ-breakdown', A.breakdown);
    /* Detail Mode parity (§3.2.3): plain words for the same reduction. */
    set('circ-breakdown-plain', A.short
      ? 'Nothing but wire between the battery terminals — a short circuit. Add a resistor or the bulb.'
      : (state.topology === 'series' ? 'One path: the resistances add up'
        : state.topology === 'parallel' ? 'Side-by-side paths: every extra one lowers the total'
        : 'Simplify the parallel group first, then add the series resistors')
      + (A.short ? '' : ` \u2014 the bank behaves like a single ${fixed(A.Rbank, 2)} \u03A9 resistor.`));

    const tb = el('circ-table');
    if (tb) {
      // the table header already states the units, so the cells hold plain
      // 3-significant-figure numbers in those units (never prefixed strings)
      const n3 = v => String(Number(v.toPrecision(3)));
      tb.innerHTML = A.per.map(p =>
        `<tr><td class="txt">R${p.i + 1}</td><td>${n3(p.r)}</td><td>${n3(p.V)}</td>` +
        `<td>${n3(p.I)}</td><td>${n3(p.P)}</td></tr>`).join('') +
        (state.includeBulb
          ? `<tr><td class="txt">bulb</td><td>${n3(state.bulbR)}</td><td>${n3(A.Vbulb)}</td>` +
            `<td>${n3(A.Itotal)}</td><td>${n3(A.Pbulb)}</td></tr>` : '');
    }

    // per-row V/I/P readouts in the control list
    A.per.forEach(p => {
      const n = el(`circ-r${p.i}-info`);
      if (n) n.textContent = `V = ${eng(p.V, 3)} V   \u00B7   I = ${eng(p.I, 3)} A   \u00B7   P = ${eng(p.P, 3)} W`;
    });
    // rule reminder that changes with the actual wiring
    const rule = el('circ-rule');
    if (rule) {
      rule.innerHTML = !state.batteryIn
        ? '<b>No supply:</b> the battery is off the bench — without an EMF there is no current anywhere. Drag it back on (or press the Battery chip).'
        : A.short
        ? '<b>Short circuit:</b> wires only between the terminals — an ideal battery would drive infinite current. Real batteries melt; add resistance.'
        : {
        series: '<b>Series:</b> the same <b>current</b> flows through every resistor; voltages <b>divide</b> in proportion to R. R(eq) is always <b>larger</b> than the biggest single resistor.',
        parallel: '<b>Parallel:</b> every branch has the same <b>voltage</b>; currents <b>divide</b> (the smaller R gets more current). R(eq) is always <b>smaller</b> than the smallest branch.',
        combo: '<b>Combination:</b> simplify the parallel group first, then add the series resistors. The total current flows through the series ones, then splits between the branches.'
      }[state.topology];
    }
  }

  /* ---- control list (one row per resistor) ----------------------------- */
  function renderRows() {
    const host = el('circ-rows');
    if (!host) return;
    host.innerHTML = state.resistors.map((r, i) => `
      <div class="row-item${i === state.selected ? ' selected' : ''}" data-row="${i}">
        <span class="row-chip">R${i + 1}</span>
        <div style="min-width:0">
          <input class="range" type="range" min="1" max="100" step="1" value="${r}"
                 id="circ-r${i}" aria-label="Resistance of R${i + 1} in ohms">
          <div class="tiny faint mono" id="circ-r${i}-info">\u200B</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end">
          <span class="ctl-value" id="circ-r${i}-v">${fixed(r, 0)} \u03A9</span>
          <div style="display:flex;gap:.3rem;align-items:center">
            <button class="btn btn-sm" data-lane="${i}" aria-label="R${i + 1} is wired in ${state.lanes[i]}; move it to the other lane">${state.lanes[i]}</button>
            <button class="btn btn-sm btn-danger" data-del="${i}" aria-label="Remove R${i + 1} from the circuit">\u00D7</button>
          </div>
        </div>
      </div>`).join('');

    // wire up the freshly created inputs
    state.resistors.forEach((r, i) => {
      const input = el(`circ-r${i}`);
      if (input) {
        stage.listen(input, 'input', () => {
          state.resistors[i] = parseFloat(input.value);
          const v = el(`circ-r${i}-v`); if (v) v.textContent = `${fixed(state.resistors[i], 0)} \u03A9`;
          refresh();
        });
      }
      const row = host.querySelector(`[data-row="${i}"]`);
      if (row) stage.listen(row, 'click', e => {
        if (e.target.closest('input,button')) return;
        state.selected = i; renderRows(); stage.invalidate();
      });
    });
    host.querySelectorAll('[data-del]').forEach(b => {
      stage.listen(b, 'click', () => removeResistor(Number(b.dataset.del)));
    });
    host.querySelectorAll('[data-lane]').forEach(b => {
      stage.listen(b, 'click', () => {
        const i = Number(b.dataset.lane);
        state.lanes[i] = state.lanes[i] === 'series' ? 'parallel' : 'series';
        syncTopology(); renderRows(); refresh();
        EMC.toast(`R${i + 1} rewired into ${state.lanes[i]}`);
      });
    });
  }

  function refresh() { stage.invalidate(); updateReadouts(); syncPalette(); }

  /* ---- palette: drag chips onto the bench, or click/Enter (a11y path) ---- */
  function addResistor(lane) {
    if (state.resistors.length >= MAX_R) { EMC.toast('The bench holds four resistors'); return; }
    state.resistors.push(20);
    state.lanes.push(lane || (state.topology === 'parallel' ? 'parallel' : 'series'));
    state.selected = state.resistors.length - 1;
    syncTopology(); renderRows(); refresh();
    EMC.toast('Resistor placed — drag it between lanes to rewire');
  }
  function setBattery(on) {
    state.batteryIn = !!on;
    refresh(); stage.start();
  }
  function setBulb(on) {
    state.includeBulb = !!on;
    const cb = el('circ-includeBulb'); if (cb) cb.checked = state.includeBulb;
    const sl = el('circ-bulbR'); if (sl) sl.disabled = !state.includeBulb;
    refresh(); stage.start();
  }
  function syncPalette() {
    const pal = el('circ-palette');
    if (!pal) return;
    pal.querySelectorAll('[data-circ-chip]').forEach(c => {
      const k = c.dataset.circChip;
      if (k === 'battery') { c.setAttribute('aria-pressed', String(state.batteryIn)); c.classList.toggle('chip-off', !state.batteryIn); }
      if (k === 'bulb') { c.setAttribute('aria-pressed', String(state.includeBulb)); c.classList.toggle('chip-off', !state.includeBulb); }
      if (k === 'resistor') c.disabled = state.resistors.length >= MAX_R;
    });
  }
  const palette = el('circ-palette');
  if (palette) {
    palette.querySelectorAll('[data-circ-chip]').forEach(chip => {
      const k = chip.dataset.circChip;
      stage.listen(chip, 'click', () => {
        if (k === 'resistor') addResistor();
        else if (k === 'battery') { setBattery(!state.batteryIn); EMC.toast(state.batteryIn ? 'Battery connected' : 'Battery disconnected'); }
        else { setBulb(!state.includeBulb); EMC.toast(state.includeBulb ? 'Bulb connected' : 'Bulb bypassed'); }
      });
      /* pointer drag: chip -> bench. A floating ghost follows the pointer; the
         drop is honoured only over the canvas (resistors pick their lane by
         drop height). Clicks below the drag threshold keep the a11y path. */
      let down = false, sx = 0, sy = 0, ghost = null;
      stage.listen(chip, 'pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY; });
      stage.listen(window, 'pointermove', e => {
        if (!down) return;
        if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
          ghost = document.createElement('div');
          ghost.className = 'circ-drag-ghost';
          ghost.textContent = chip.textContent.trim();
          document.body.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.left = (e.clientX + 12) + 'px';
          ghost.style.top = (e.clientY + 12) + 'px';
        }
      }, { passive: true });
      stage.listen(window, 'pointerup', e => {
        if (!down) return;
        down = false;
        if (!ghost) return;               // it was a click — the click handler owns it
        ghost.remove(); ghost = null;
        const r = canvas.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!over) return;
        if (k === 'resistor') addResistor((e.clientY - r.top) > r.height * 0.55 ? 'parallel' : 'series');
        else if (k === 'battery') { setBattery(true); EMC.toast('Battery connected'); }
        else { setBulb(true); EMC.toast('Bulb connected'); }
      });
    });
  }

  /* ---- buttons --------------------------------------------------------- */
  const topo = el('circ-topology');
  if (topo) stage.bindSegment(topo, value => {
    /* a wiring shortcut: move every resistor into the chosen lane layout */
    if (value === 'combo') {
      while (state.resistors.length < 3) state.resistors.push(state.resistors.length === 1 ? 33 : 68);
      state.resistors = state.resistors.slice(0, 3);
      state.lanes = ['series', 'parallel', 'parallel'];
    } else {
      while (state.resistors.length < LIMITS[value][0]) state.resistors.push(20);
      state.lanes = state.resistors.map(() => value);
    }
    state.selected = clamp(state.selected, 0, Math.max(0, state.resistors.length - 1));
    syncTopology(); renderRows(); refresh();
  });

  const addBtn = el('circ-add');
  if (addBtn) stage.listen(addBtn, 'click', () => addResistor());

  stage.bindRange('circ-V', 'circ-Vv', v => { state.V = v; refresh(); }, v => `${fixed(v, 1)} V`);
  stage.bindRange('circ-bulbR', 'circ-bulbv', v => { state.bulbR = v; refresh(); }, v => `${fixed(v, 0)} \u03A9`);
  const bulbToggle = el('circ-includeBulb');
  if (bulbToggle) stage.listen(bulbToggle, 'change', () => {
    state.includeBulb = bulbToggle.checked;
    const s = el('circ-bulbR'); if (s) s.disabled = !state.includeBulb;
    refresh();
  });

  /* ---- drag & drop on the canvas (brief R1: place / move / delete /
         connect resistors, battery and bulb) ------------------------------ */
  function removeResistor(i) {
    if (i < 0 || i >= state.resistors.length) return;
    state.resistors.splice(i, 1); state.lanes.splice(i, 1);
    state.selected = clamp(state.selected, 0, Math.max(0, state.resistors.length - 1));
    syncTopology(); renderRows(); refresh();
    EMC.toast('Resistor removed from the bench');
  }
  stage.onPointer(p => {
    const hitAt = (x, y) => lastHits.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (p.type === 'down') {
      const hit = hitAt(p.x, p.y);
      if (!hit) return;
      if (hit.kind === 'R') { state.selected = hit.idx; renderRows(); }
      drag.active = { kind: hit.kind, idx: hit.idx, x: p.x, y: p.y, x0: p.x, y0: p.y };
      canvas.classList.add('dragging');
      stage.start(); stage.invalidate();
    } else if (p.type === 'move') {
      if (drag.active) {
        drag.active.x = p.x; drag.active.y = p.y;
        stage.invalidate();
      } else {
        canvas.style.cursor = hitAt(p.x, p.y) ? 'grab' : 'default';
      }
    } else if (p.type === 'leave') {
      /* Pointer capture keeps delivering move/up outside the canvas, so a
         leave during a drag must NOT cancel it — drag-off-the-bench IS the
         delete/disconnect gesture. */
      if (!drag.active) canvas.style.cursor = 'default';
    } else if (p.type === 'up') {
      if (!drag.active) return;
      const d = drag.active;
      const outside = p.x < -4 || p.y < -4 || p.x > stage.w + 4 || p.y > stage.h + 4;
      drag.active = null;
      canvas.classList.remove('dragging');
      const clickLike = Math.hypot(p.x - d.x0, p.y - d.y0) < 6;
      if (d.kind === 'R') {
        if (outside) removeResistor(d.idx);
        else if (clickLike) {
          /* a tap selects and reveals the row — but NEVER scroll mid-drag: a
             smooth-scroll while the pointer is down moves the bench out from
             under the gesture (found by the interaction test). */
          EMC.scrollToEl(document.querySelector(`[data-row="${d.idx}"]`), { behavior: 'smooth', block: 'nearest' });
        } else {
          const lane = p.y > stage.h * 0.55 ? 'parallel' : 'series';
          if (state.lanes[d.idx] !== lane) {
            state.lanes[d.idx] = lane;
            syncTopology(); renderRows();
            EMC.toast(lane === 'series' ? 'R rewired onto the series wire' : 'R rewired into a parallel branch');
          }
        }
      } else if (d.kind === 'battery' && outside) {
        state.batteryIn = false; syncPalette();
        EMC.toast('Battery disconnected \u2014 no EMF, no current');
      } else if (d.kind === 'bulb' && outside) {
        setBulb(false);
        EMC.toast('Bulb removed from the circuit');
      }
      refresh(); stage.start();
    }
  });

  /* ---- predict-then-run challenge -------------------------------------- Each challenge is answered by the SIMULATOR itself: we snapshot the state, apply a hypothetical change, re-run analyze(), and compare total currents. So the "correct" answer can never drift from the physics. */
  const chal = { text: el('circ-chal-text'), opts: el('circ-chal-opts'),
                 fb: el('circ-chal-fb'), tryBtn: el('circ-chal-try'),
                 current: null };

  function snapshot() {
    return { topology: state.topology, resistors: state.resistors.slice(), lanes: state.lanes.slice(),
             batteryIn: state.batteryIn, bulbR: state.bulbR, includeBulb: state.includeBulb, V: state.V };
  }
  function hypothesize(mut) {
    const keep = snapshot();
    mut(state);
    const result = analyze();
    Object.assign(state, keep);
    state.resistors = keep.resistors;
    state.lanes = keep.lanes;
    return result;
  }
  const DIRS = ['increase', 'decrease', 'stay the same'];
  function dirOf(a, b) {
    if (Math.abs(b - a) < 1e-9) return 2;
    return b > a ? 0 : 1;
  }
  function buildChallenges() {
    const A = analyze();
    const list = [];
    const other = { series: 'parallel', parallel: 'series', combo: 'series' }[state.topology];
    if (!(state.topology === 'combo') && state.resistors.length >= 2) {
      const H = hypothesize(st => {
        st.topology = other;
        st.lanes = st.lanes.map(() => (other === 'parallel' ? 'parallel' : 'series'));
        if (other === 'combo') st.lanes = st.lanes.map((l, i) => (i === 0 ? 'series' : 'parallel'));
      });
      list.push({
        text: `Predict: rewire the bank from <b>${state.topology}</b> to <b>${other}</b> (same resistors, bulb still in circuit). The total current from the battery will…`,
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `R<sub>eq</sub> goes ${state.topology === 'series' ? 'down (parallel branches add paths)' : 'up (one long path again)'}: ${fixed(A.Rbank, 2)} \u03A9 \u2192 ${fixed(H.Rbank, 2)} \u03A9, so the total current will ${DIRS[dirOf(A.Itotal, H.Itotal)]}.`,
        apply: () => { const b = document.querySelector(`#circ-topology [data-value="${other}"]`); if (b) b.click(); }
      });
    }
    if (Math.max(...state.resistors, state.bulbR) <= 50) {
      const H = hypothesize(st => { st.resistors = st.resistors.map(r => r * 2); st.bulbR *= 2; });
      list.push({
        text: 'Predict: <b>double every resistance</b> in the circuit (bank and bulb). The total current will…',
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `Ohm's law with V fixed: I = V/R, and every R doubled, so the total current will ${DIRS[dirOf(A.Itotal, H.Itotal)]} — exactly ${fixed(A.Itotal / H.Itotal, 2)}× here.`,
        apply: () => { state.resistors = state.resistors.map(r => r * 2); state.bulbR *= 2; renderRows(); refresh(); }
      });
    }
    if (state.includeBulb) {
      const H = hypothesize(st => { st.includeBulb = false; });
      list.push({
        text: 'Predict: <b>bypass the bulb</b> (uncheck “include the bulb”). The total current will…',
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `Removing a series resistance lowers R<sub>total</sub> from ${fixed(A.Rtotal, 2)} Ω to ${fixed(H.Rtotal, 2)} Ω, so the total current must ${DIRS[dirOf(A.Itotal, H.Itotal)]}.`,
        apply: () => { const c = el('circ-includeBulb'); if (c) { c.checked = false; c.dispatchEvent(new Event('change')); } }
      });
    }
    return list;
  }
  let chalList = [], chalIdx = 0, chalDone = false;
  function showChallenge(i) {
    chalList = buildChallenges();
    chalIdx = ((i % chalList.length) + chalList.length) % chalList.length;
    chalDone = false;
    const c = chalList[chalIdx];
    chal.current = c;
    if (chal.text) chal.text.innerHTML = c.text;
    if (chal.fb) { chal.fb.className = 'feedback is-hidden'; chal.fb.innerHTML = ''; }
    if (chal.tryBtn) chal.tryBtn.hidden = true;
    if (chal.opts) {
      chal.opts.innerHTML = DIRS.map((d, k) =>
        `<button class="btn btn-sm" type="button" data-k="${k}" aria-pressed="false">${d}</button>`).join('');
      chal.opts.querySelectorAll('button').forEach(b => stage.listen(b, 'click', () => {
        if (chalDone) return;
        chalDone = true;
        const k = Number(b.dataset.k);
        const ok = k === c.answer;
        chal.opts.querySelectorAll('button').forEach(x => {
          x.disabled = true;
          if (Number(x.dataset.k) === c.answer) x.classList.add('btn-primary');
          if (x === b && !ok) x.classList.add('btn-danger');
        });
        if (chal.fb) {
          chal.fb.className = 'feedback ' + (ok ? 'good' : 'bad');
          chal.fb.innerHTML = `<span><b>${ok ? 'Good prediction.' : 'Not quite.'}</b> ${c.explain}</span>`;
        }
        if (chal.tryBtn) chal.tryBtn.hidden = false;
      }));
    }
  }
  if (chal.text) {
    showChallenge(0);
    const newBtn = el('circ-chal-new');
    if (newBtn) stage.listen(newBtn, 'click', () => showChallenge(chalIdx + 1));
    if (chal.tryBtn) stage.listen(chal.tryBtn, 'click', () => { if (chal.current) chal.current.apply(); });
  }

  /* ---- boot ------------------------------------------------------------ */
  renderRows();
  syncTopology();
  refresh();
  if (typeof window !== 'undefined') window.__CIRC = { state, analyze, stage };   // test hook
  }
})();
