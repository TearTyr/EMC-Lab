/* Sim — interactive thermometer. Drag the column or use the slider: the mercury height maps linearly to temperature and the °C / °F / K conversions are recomputed live from °F = °C×9/5 + 32 and K = °C + 273.15. Flat art only. */
(function () {
  const canvas = document.getElementById('sim-thermometer');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { clamp, fixed, label, Stage } = EMC;

  const TMIN = -80, TMAX = 250;
  const state = { T: 20 };

  const toF = C => C * 9 / 5 + 32;
  const toK = C => C + 273.15;

  /* ---- geometry ------------------------------------------------------------ */
  function geom(w, h) {
    const cx = w * 0.30;
    const bulbR = Math.min(26, h * 0.09);
    const bulbY = h - bulbR - 14;
    const topY = 26;
    const tubeW = 15;
    const yOf = T => bulbY - 6 - ((T - TMIN) / (TMAX - TMIN)) * (bulbY - 6 - topY);
    return { cx, bulbR, bulbY, topY, tubeW, yOf, TOfY: y => TMIN + ((bulbY - 6 - y) / (bulbY - 6 - topY)) * (TMAX - TMIN) };
  }

  let dragging = false;
  const stage = new Stage(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const G = geom(w, h);
    const yT = G.yOf(clamp(state.T, TMIN, TMAX));

    // tube + bulb outline
    ctx.save();
    ctx.fillStyle = 'rgba(8,15,28,.94)';
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.rect(G.cx - G.tubeW / 2, G.topY, G.tubeW, G.bulbY - G.topY + 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(G.cx, G.bulbY, G.bulbR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // mercury: bulb always full, column up to yT (flat rose fill)
    ctx.fillStyle = '#f8aebe';
    ctx.beginPath(); ctx.arc(G.cx, G.bulbY, G.bulbR - 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(G.cx - 4.5, yT, 9, G.bulbY - yT + 6);
    ctx.restore();

    // scale ticks every 10 degC, labelled every 50
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.55)'; ctx.lineWidth = 1;
    for (let T = TMIN; T <= TMAX; T += 10) {
      const y = G.yOf(T), big = T % 50 === 0;
      ctx.beginPath();
      ctx.moveTo(G.cx + G.tubeW / 2 + 3, y);
      ctx.lineTo(G.cx + G.tubeW / 2 + (big ? 13 : 7), y);
      ctx.stroke();
      if (big) label(ctx, `${T}°`, G.cx + G.tubeW / 2 + 18, y, { color: '#a9bad6', size: 10.5, align: 'left' });
    }
    ctx.restore();

    // landmark markers
    const marker = (T, text, color) => {
      if (T < TMIN || T > TMAX) return;
      const y = G.yOf(T);
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = color; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(G.cx - 42, y); ctx.lineTo(G.cx + G.tubeW / 2 + 44, y); ctx.stroke();
      ctx.restore();
      label(ctx, text, G.cx - 46, y, { color, size: 10.5, align: 'right', weight: '700' });
    };
    marker(0, 'water freezes', '#a8d3e0');
    marker(37, 'body 37 °C', '#f6d36b');
    marker(100, 'water boils', '#f8aebe');
    marker(-40, '°C = °F', '#b5d777');

    // the reading, big, next to the column top
    label(ctx, `${fixed(state.T, 1)} °C`, G.cx, yT - 14, { color: '#e8eefb', size: 15, weight: '800' });

    // conversion panel on the right
    const px = w * 0.58, py = h * 0.24;
    label(ctx, 'CONVERSIONS', px, py - 34, { color: '#7b8db0', size: 11, align: 'left', weight: '700' });
    label(ctx, `°F = ${fixed(state.T, 1)} × 9/5 + 32 = ${fixed(toF(state.T), 1)} °F`,
      px, py, { color: '#f6d36b', size: 12.5, align: 'left', weight: '700' });
    label(ctx, `K  = ${fixed(state.T, 1)} + 273.15 = ${fixed(toK(state.T), 2)} K`,
      px, py + 26, { color: '#a8d3e0', size: 12.5, align: 'left', weight: '700' });
    label(ctx, `absolute zero: −273.15 °C = 0 K`,
      px, py + 62, { color: 'rgba(148,163,184,.85)', size: 11, align: 'left', weight: '600' });
    label(ctx, 'drag the column, or use the slider', w / 2, h - 8,
      { color: 'rgba(148,163,184,.8)', size: 10.5, weight: '600' });
  }, { animate: false });

  /* ---- pointer: drag along the tube ---------------------------------------- */
  stage.onPointer(p => {
    const G = geom(stage.w, stage.h);
    if (p.type === 'down') {
      dragging = Math.abs(p.x - G.cx) < 60;
    } else if (p.type === 'up' || p.type === 'leave') {
      dragging = false;
    }
    if (dragging && (p.type === 'down' || p.type === 'move')) {
      setT(G.TOfY(p.y));
    }
  });

  /* ---- readouts ---------------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function setT(T) {
    state.T = clamp(Math.round(T * 2) / 2, TMIN, TMAX);   // snap to 0.5 deg
    const sl = el('thermo-T');
    if (sl && parseFloat(sl.value) !== state.T) sl.value = String(state.T);
    const num = el('thermo-Tnum');
    if (num && document.activeElement !== num) num.value = String(state.T);
    if (el('thermo-Tv')) el('thermo-Tv').textContent = `${fixed(state.T, 1)} °C`;
    if (el('thermo-C')) el('thermo-C').textContent = `${fixed(state.T, 1)} °C`;
    if (el('thermo-F')) el('thermo-F').textContent = `${fixed(toF(state.T), 1)} °F`;
    if (el('thermo-K')) el('thermo-K').textContent = `${fixed(toK(state.T), 2)} K`;
    if (el('thermo-sub')) {
      el('thermo-sub').textContent =
        `°F = ${fixed(state.T, 1)} × 9/5 + 32 = ${fixed(toF(state.T), 1)}   ·   K = ${fixed(state.T, 1)} + 273.15 = ${fixed(toK(state.T), 2)}`;
    }
    if (el('thermo-note')) {
      const T = state.T;
      el('thermo-note').textContent =
        T <= -78.5 ? 'Colder than sublimating dry ice (−78.5 °C) — welcome to the deep cold.'
        : Math.abs(T + 40) < 2 ? '−40° is the unique point where the Celsius and Fahrenheit scales read the same number.'
        : Math.abs(T) < 2 ? '0 °C: the freezing point of water — one of the two fixed points the scales were built from.'
        : Math.abs(T - 37) < 2 ? '37 °C: normal human body temperature (98.6 °F).'
        : Math.abs(T - 100) < 2 ? '100 °C: water boils at sea-level pressure. Lower on a mountain — boiling point tracks pressure.'
        : T > 200 ? 'Hotter than most kitchen ovens. Lead melts at 327 °C, just off the top of this scale.'
        : 'Drag the column or move the slider — all three scales update together.';
    }
    stage.invalidate();
  }

  /* ---- controls -------------------------------------------------------------------- */
  const slider = el('thermo-T');
  if (slider) slider.addEventListener('input', () => setT(parseFloat(slider.value)));
  const num = el('thermo-Tnum');
  if (num) num.addEventListener('change', () => {
    const v = parseFloat(num.value);
    if (isFinite(v)) setT(v); else num.value = String(state.T);
  });
  document.querySelectorAll('[data-thermo-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      setT(parseFloat(btn.dataset.thermoPreset));
      EMC.toast(`Preset: ${fixed(state.T, 1)} °C`);
    });
  });

  setT(state.T);
  }
})();
