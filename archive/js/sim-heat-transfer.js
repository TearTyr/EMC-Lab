/* Sim — heat transfer lab. Three scenes in one canvas: CONDUCTION (diffusion along a rod, flux q = kA*DeltaT/L), CONVECTION (circulating particles driven by a bottom heater) and RADIATION (inverse-square intensity absorbed by matt-black vs shiny plates). Flat art only: solid buckets of colour, no smooth blends. */
(function () {
  const canvas = document.getElementById('sim-heat-transfer');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { CONST, clamp, fixed, eng, unit, arrow, label, Stage, bindRange, bindSegment, setText, throttle } = EMC;

  const MATERIALS = {
    copper: { k: 401, name: 'copper', rate: 0.45 },
    iron:   { k: 80,  name: 'iron',   rate: 0.26 },
    glass:  { k: 1.0, name: 'glass',  rate: 0.08 },
    wood:   { k: 0.15, name: 'wood',   rate: 0.04 }
  };
  const ROD = { A: 1e-4, L: 0.4, N: 20, ambient: 20 };

  const state = {
    mode: 'conduction',
    material: 'copper',
    Thot: 300,            // degC, held hot end
    power: 800,           // W, heater / radiator output
    dist: 1,              // m, radiation distance
    T: new Array(ROD.N).fill(ROD.ambient),
    parts: []
  };
  state.T[0] = state.Thot;

  /* ---- colour buckets for temperature (flat steps, never a blend) --------- */
  const BUCKETS = [
    [40, '#6f9db3'], [100, '#b5d777'], [200, '#f6d36b'], [400, '#ef9f68'], [Infinity, '#ef6f8e']
  ];
  const heatColor = T => (BUCKETS.find(b => T <= b[0]) || BUCKETS[4])[1];

  /* ---- physics ------------------------------------------------------------- */
  function stepConduction(dt) {
    const a = MATERIALS[state.material].rate * clamp(dt * 60, 0, 2);
    const T = state.T;
    T[0] = state.Thot;
    T[ROD.N - 1] = ROD.ambient;                     // both ends are reservoirs
    for (let i = ROD.N - 2; i >= 1; i--) {
      T[i] += a * (T[i - 1] + T[i + 1] - 2 * T[i]);
    }
  }
  const flux = () => {
    const k = MATERIALS[state.material].k;
    return k * ROD.A * (state.T[0] - state.T[ROD.N - 1]) / ROD.L;
  };
  const intensity = () => state.power / (4 * Math.PI * state.dist * state.dist);

  /* ---- particles (convection) ----------------------------------------------- */
  const PARTS = EMC.lowTier ? 42 : 70;
  function ensureParts() {
    while (state.parts.length < PARTS) {
      state.parts.push({ x: Math.random() * 2 - 1, y: Math.random() });   // x in [-1,1], y 0 top .. 1 bottom
    }
  }

  /* ---- scenes ------------------------------------------------------------------ */
  function conductionScene(ctx, w, h, st, dt) {
    stepConduction(dt);
    const rodL = w * 0.62, rodH = Math.min(h * 0.15, 54);
    const x0 = (w - rodL) / 2, y0 = h * 0.30;
    const cw = rodL / ROD.N;

    // flame (flat triangles) at the hot end, heatsink at the cold end
    ctx.save();
    ctx.fillStyle = '#f6d36b';
    ctx.beginPath();
    ctx.moveTo(x0 - 26, y0 + rodH); ctx.lineTo(x0 - 8, y0 - 12); ctx.lineTo(x0 - 2, y0 + rodH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef6f8e';
    ctx.beginPath();
    ctx.moveTo(x0 - 20, y0 + rodH); ctx.lineTo(x0 - 11, y0 + 4); ctx.lineTo(x0 - 5, y0 + rodH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f9db3';
    ctx.fillRect(x0 + rodL + 6, y0 - 6, 20, rodH + 12);
    ctx.restore();
    label(ctx, `${fixed(state.Thot, 0)} °C`, x0 - 14, y0 + rodH + 18, { color: '#f6d36b', size: 11.5, weight: '700' });
    label(ctx, `${ROD.ambient} °C`, x0 + rodL + 16, y0 + rodH + 18, { color: '#a8d3e0', size: 11.5, weight: '700' });

    // rod cells + vibrating atoms (amplitude grows with temperature)
    for (let i = 0; i < ROD.N; i++) {
      const T = state.T[i];
      ctx.save();
      ctx.fillStyle = heatColor(T);
      ctx.fillRect(x0 + i * cw + 1, y0, cw - 2, rodH);
      ctx.restore();
      const amp = clamp(T / 500, 0, 1) * rodH * 0.28;
      const jy = y0 + rodH / 2 + Math.sin(st.t * (6 + T / 40) + i * 2.4) * amp;
      const jx = x0 + i * cw + cw / 2 + Math.cos(st.t * (5 + T / 50) + i) * amp * 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(20,22,28,.85)';
      ctx.beginPath(); ctx.arc(jx, jy, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // temperature profile under the rod
    const gy = h * 0.60, gh = h * 0.26, gx0 = x0, gw = rodL;
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(gx0, gy, gw, gh);
    ctx.strokeStyle = '#e8eefb'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    const Tmax = Math.max(state.Thot, 100);
    for (let i = 0; i < ROD.N; i++) {
      const px = gx0 + (i / (ROD.N - 1)) * gw;
      const py = gy + gh - (state.T[i] / Tmax) * gh;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    label(ctx, 'temperature profile along the rod', gx0 + gw / 2, gy + gh + 14, { color: '#7b8db0', size: 10.5 });
    label(ctx, `${MATERIALS[state.material].name} · k = ${MATERIALS[state.material].k} W/(m·K)`, w / 2, 16,
      { color: '#f6d36b', size: 12, weight: '700' });
  }

  function convectionScene(ctx, w, h, st, dt) {
    ensureParts();
    const px = w * 0.14, py = h * 0.12, pw = w * 0.72, ph = h * 0.70;

    // pot
    ctx.save();
    ctx.fillStyle = 'rgba(168,211,224,.10)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
    // heater bar, brightness buckets with power
    const hb = clamp((state.power - 200) / 1800, 0, 1);
    ctx.fillStyle = hb > 0.66 ? '#ef6f8e' : hb > 0.33 ? '#ef9f68' : '#f6d36b';
    ctx.fillRect(px + pw * 0.32, py + ph - 10, pw * 0.36, 10);
    ctx.restore();
    label(ctx, `heater ${state.power} W`, px + pw / 2, py + ph + 16, { color: '#f6d36b', size: 11.5, weight: '700' });

    // circulation field: rise in the middle, sink at the walls, loop along top/bottom
    const S = 0.28 * (0.5 + state.power / 2000);
    const field = (x, y) => {                        // x in [-1,1], y 0 top .. 1 bottom
      const rise = Math.cos(Math.PI * x / 2) ** 2;   // 1 centre -> 0 walls
      const vy = S * (0.4 - rise);                   // negative = up near centre
      const out = Math.sign(x || 1) * (0.55 * (1 - y) - 0.45 * y);
      return { vx: S * out * 0.8, vy };
    };
    // local temperature: hot near the heater, cool at the top corners
    const tempAt = (x, y) => 20 + (35 + 45 * state.power / 2000) *
      Math.exp(-((x * 1.5) ** 2 + ((1 - y) * 1.6) ** 2)) + 10 * (1 - y) * 0;

    ctx.save();
    for (const q of state.parts) {
      const f = field(q.x, q.y);
      q.x += f.vx * dt * 3.4; q.y += f.vy * dt * 3.4;
      if (q.x > 0.97) q.x = 0.97; if (q.x < -0.97) q.x = -0.97;
      if (q.y > 0.97) q.y = 0.05; if (q.y < 0.02) q.y = 0.05;      // wrap the loop
      if (Math.abs(q.x) > 0.9 && q.y < 0.06) q.y = 0.1;
      const T = tempAt(q.x, q.y);
      ctx.fillStyle = heatColor(T);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(px + (q.x + 1) / 2 * pw, py + q.y * ph, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // circulation arrows
    const ax = px + pw / 2;
    arrow(ctx, ax, py + ph * 0.75, ax, py + ph * 0.35, { color: '#ef9f68', width: 2.6, head: 9 });
    arrow(ctx, ax + pw * 0.1, py + ph * 0.14, ax + pw * 0.34, py + ph * 0.14, { color: '#ef9f68', width: 2.2, head: 8 });
    arrow(ctx, px + pw * 0.9, py + ph * 0.3, px + pw * 0.9, py + ph * 0.7, { color: '#a8d3e0', width: 2.2, head: 8 });
    arrow(ctx, px + pw * 0.3, py + ph * 0.86, px + pw * 0.12, py + ph * 0.86, { color: '#a8d3e0', width: 2.2, head: 8 });
    label(ctx, 'hot fluid rises (less dense)', ax + 10, py + ph * 0.5, { color: '#ef9f68', size: 11, align: 'left', weight: '700' });
    label(ctx, 'cool fluid sinks', px + pw * 0.86, py + ph * 0.5, { color: '#a8d3e0', size: 11, align: 'right', weight: '700' });
  }

  function radiationScene(ctx, w, h, st) {
    const sx = w * 0.14, sy = h * 0.5, dPx = (w * 0.62) * (state.dist / 3);
    const plateX = sx + Math.max(dPx, w * 0.22);
    const I = intensity();

    // source: flat disc with tick rays
    ctx.save();
    ctx.fillStyle = '#f6d36b';
    ctx.beginPath(); ctx.arc(sx, sy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f6d36b'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + st.t * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 28, sy + Math.sin(a) * 28);
      ctx.lineTo(sx + Math.cos(a) * 35, sy + Math.sin(a) * 35);
      ctx.stroke();
    }
    ctx.restore();
    label(ctx, `radiator ${state.power} W`, sx, sy + 52, { color: '#f6d36b', size: 11.5, weight: '700' });

    // plates: matt black (alpha .9) and shiny (alpha .1)
    const plates = [
      { y: sy - h * 0.22, fill: '#3a3d45', a: 0.9, name: 'matt black · α = 0.9' },
      { y: sy + h * 0.22, fill: '#e2e8f0', a: 0.1, name: 'shiny · α = 0.1' }
    ];
    for (const pl of plates) {
      // rays to the plate
      ctx.save();
      ctx.strokeStyle = 'rgba(246,211,107,.8)'; ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 26, sy + i * 5);
        ctx.lineTo(plateX - 8, pl.y + i * 7);
        ctx.stroke();
      }
      if (pl.a < 0.5) {                              // the shiny one reflects
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(168,211,224,.8)';
        for (let i = -1; i <= 1; i += 2) {
          ctx.beginPath();
          ctx.moveTo(plateX - 8, pl.y + i * 8);
          ctx.lineTo(plateX - 70, pl.y + i * 26);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = pl.fill; ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
      ctx.fillRect(plateX - 8, pl.y - 26, 14, 52);
      ctx.strokeRect(plateX - 8, pl.y - 26, 14, 52);
      ctx.restore();
      label(ctx, pl.name, plateX + 16, pl.y - 12, { color: '#e8eefb', size: 11, align: 'left', weight: '700' });
      label(ctx, `absorbs ${eng(pl.a * I, 3)} W/m²`, plateX + 16, pl.y + 10, { color: heatColor(pl.a * I * 2), size: 11, align: 'left', weight: '700' });
    }

    // distance marker
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(sx, h - 26); ctx.lineTo(plateX, h - 26); ctx.stroke();
    ctx.restore();
    label(ctx, `d = ${fixed(state.dist, 2)} m`, (sx + plateX) / 2, h - 14, { color: '#a9bad6', size: 11 });
    label(ctx, `I = P/(4πd²) = ${eng(I, 3)} W/m² here`, w / 2, 16, { color: '#f6d36b', size: 12, weight: '700' });
  }

  /* ---- stage ------------------------------------------------------------------ */
  const stage = new Stage(canvas, (ctx, w, h, st, dt) => {
    ctx.clearRect(0, 0, w, h);
    const d = dt || 0.016;
    if (state.mode === 'conduction') conductionScene(ctx, w, h, st, d);
    else if (state.mode === 'convection') convectionScene(ctx, w, h, st, d);
    else radiationScene(ctx, w, h, st);
    readoutsLive();               // capped at 15 Hz; controls below call updateReadouts() directly
  }, { animate: true });

  /* ---- readouts ------------------------------------------------------------------ */
  const el = id => document.getElementById(id);
  const readoutsLive = throttle(() => updateReadouts(), 15);
  function updateReadouts() {
    const set = (l, v, lt, vt) => { setText(el(l), lt); if (v) setText(el(v), vt); };
    if (state.mode === 'conduction') {
      const k = MATERIALS[state.material].k;
      set('ht-r1l', 'ht-r1', 'hot end', `${fixed(state.T[0], 0)} \u00B0C`);
      set('ht-r2l', 'ht-r2', 'cold end', `${fixed(state.T[ROD.N - 1], 0)} \u00B0C`);
      set('ht-r3l', 'ht-r3', 'heat flux q', unit(flux(), 'W', 3));
      set('ht-r4l', 'ht-r4', `k \u00B7 ${MATERIALS[state.material].name}`, `${k} W/(m\u00B7K)`);
      setText(el('ht-sub'),
        `q = k\u00B7A\u00B7\u0394T/L = ${k} \u00D7 1\u00D710\u207B\u2074 m\u00B2 \u00D7 ${fixed(state.T[0] - state.T[ROD.N - 1], 0)} K / ${ROD.L} m = ${eng(flux(), 3)} W`);
      setText(el('ht-note'),
        'Conduction: energy hops atom-to-atom through direct contact \u2014 the material never moves. Metals lead by orders of magnitude because their free electrons carry energy too. Watch the profile relax to its straight steady state.');
    } else if (state.mode === 'convection') {
      set('ht-r1l', 'ht-r1', 'heater power', `${state.power} W`);
      set('ht-r2l', 'ht-r2', 'circulation', state.power > 1400 ? 'vigorous' : state.power > 700 ? 'moderate' : 'gentle');
      set('ht-r3l', 'ht-r3', 'hot region', 'bottom centre');
      set('ht-r4l', 'ht-r4', 'cool region', 'top & sides');
      setText(el('ht-sub'),
        'more power \u2192 faster plume \u2192 more energy carried per second (the loop itself is the conveyor belt)');
      setText(el('ht-note'),
        'Convection: the fluid itself moves and carries the energy with it. Heated fluid expands, becomes less dense and rises; cooler fluid sinks to replace it \u2014 a circulation loop. This is why radiators sit under windows and freezers chill from the top.');
    } else {
      const I = intensity();
      set('ht-r1l', 'ht-r1', 'intensity at d', unit(I, 'W/m\u00B2', 3));
      set('ht-r2l', 'ht-r2', 'absorbed \u00B7 matt black', unit(0.9 * I, 'W/m\u00B2', 3));
      set('ht-r3l', 'ht-r3', 'absorbed \u00B7 shiny', unit(0.1 * I, 'W/m\u00B2', 3));
      set('ht-r4l', 'ht-r4', 'distance d', `${fixed(state.dist, 2)} m`);
      setText(el('ht-sub'),
        `I = P/(4\u03C0d\u00B2) = ${state.power} / (4\u03C0 \u00D7 ${fixed(state.dist, 2)}\u00B2) = ${eng(I, 3)} W/m\u00B2 \u2014 halve d and I quadruples (inverse square)`);
      setText(el('ht-note'),
        'Radiation: energy carried by electromagnetic waves \u2014 the only mechanism that crosses a vacuum, which is how sunlight reaches Earth. Matt black surfaces absorb (and emit) best; shiny surfaces reflect most of what hits them.');
    }
  }

  /* ---- controls -------------------------------------------------------------------- */
  function syncVisibility() {
    const show = (id, on) => { const n = el(id); if (n) n.style.display = on ? '' : 'none'; };
    show('ht-ctl-hot', state.mode === 'conduction');
    show('ht-ctl-material', state.mode === 'conduction');
    show('ht-ctl-power', state.mode !== 'conduction');
    show('ht-ctl-dist', state.mode === 'radiation');
  }
  bindSegment('ht-mode', v => { state.mode = v; syncVisibility(); stage.setIdle(false); stage.invalidate(); updateReadouts(); });
  bindSegment('ht-material', v => { state.material = v; converged = false; stage.setIdle(false); updateReadouts(); });
  bindRange('ht-hot', 'ht-hotv', v => { state.Thot = v; converged = false; stage.setIdle(false); updateReadouts(); }, v => `${v} °C`);
  bindRange('ht-power', 'ht-powerv', v => { state.power = v; stage.setIdle(false); stage.invalidate(); updateReadouts(); }, v => `${v} W`);
  bindRange('ht-dist', 'ht-distv', v => { state.dist = v; stage.invalidate(); updateReadouts(); }, v => `${fixed(v, 2)} m`);
  syncVisibility();
  updateReadouts();
  }
})();
