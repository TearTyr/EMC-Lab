/* Sim — tone player: frequency vs pitch. A guarded WebAudio oscillator you can actually listen to, with a live oscilloscope (or a drawn waveform when audio is unavailable), a note ruler and the wavelength of the note in air, lambda = v_sound / f. Flat art only. */
(function () {
  const canvas = document.getElementById('sim-sound');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {

  const { CONST, clamp, fixed, label, arrow, Stage, bindRange, bindSegment } = EMC;

  const FMIN = 55, FMAX = 1760;
  const state = { f: 440, wave: 'sine', playing: false };

  /* ---- audio (lazily created on the first user gesture, fully guarded) ---- */
  const AC = window.AudioContext || window.webkitAudioContext || null;
  let actx = null, osc = null, gain = null, analyser = null, buf = null;

  function audioStart() {
    if (!AC) return false;
    try {
      if (!actx) {
        actx = new AC();
        analyser = actx.createAnalyser();
        analyser.fftSize = 2048;
        buf = new Uint8Array(analyser.fftSize);
        analyser.connect(actx.destination);
      }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      osc = actx.createOscillator();
      gain = actx.createGain();
      osc.type = state.wave;
      osc.frequency.value = state.f;
      gain.gain.value = 0.0001;
      osc.connect(gain); gain.connect(analyser);
      osc.start();
      gain.gain.linearRampToValueAtTime(0.08, actx.currentTime + 0.04);
      return true;
    } catch (e) { return false; }
  }
  function audioStop() {
    try {
      if (gain && actx) gain.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.05);
      if (osc) {
        osc.stop(actx.currentTime + 0.08);
        osc.onended = () => { try { osc && osc.disconnect(); } catch (e) {} try { gain && gain.disconnect(); } catch (e) {} };
      }
      // let the shared context sleep until the next gesture instead of
      // keeping the audio thread awake for silence
      if (actx && actx.state === 'running' && actx.suspend) actx.suspend();
    } catch (e) { /* already gone */ }
    osc = null; gain = null;
  }
  function audioSet() {
    if (osc) { try { osc.type = state.wave; osc.frequency.value = state.f; } catch (e) {} }
  }

  /* ---- note naming ---------------------------------------------------------- */
  const NAMES = ['C', 'C\u266F', 'D', 'D\u266F', 'E', 'F', 'F\u266F', 'G', 'G\u266F', 'A', 'A\u266F', 'B'];
  function noteOf(f) {
    const n = Math.round(69 + 12 * Math.log2(f / 440));          // MIDI number (A4 = 69)
    const name = NAMES[((n % 12) + 12) % 12];
    const octave = Math.floor(n / 12) - 1;
    const fRef = 440 * Math.pow(2, (n - 69) / 12);
    const cents = Math.round(1200 * Math.log2(f / fRef));
    return { text: `${name}${octave}`, cents };
  }

  /* ---- waveform maths (used for the drawn scope) ---------------------------- */
  function waveAt(phi) {                       // phi in cycles, output -1..1
    const t = phi - Math.floor(phi);
    switch (state.wave) {
      case 'square': return t < 0.5 ? 1 : -1;
      case 'sawtooth': return 2 * t - 1;
      case 'triangle': return 1 - 4 * Math.abs(t - 0.5);
      default: return Math.sin(2 * Math.PI * t);
    }
  }

  /* ---- stage ------------------------------------------------------------------ */
  const stage = new Stage(canvas, (ctx, w, h, st) => {
    stage.setIdle(!state.playing);      // the scope is static unless a tone is playing
    ctx.clearRect(0, 0, w, h);
    const scopeH = h * 0.52, sy = h * 0.30;

    // oscilloscope frame
    ctx.save();
    ctx.fillStyle = 'rgba(8,15,28,.9)';
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(w * 0.05, sy - scopeH / 2, w * 0.9, scopeH); ctx.fill(); ctx.stroke();
    ctx.restore();

    // trace: live analyser data when playing, else the pure maths
    const x0 = w * 0.05, sw = w * 0.9;
    ctx.save();
    ctx.strokeStyle = state.playing ? '#b5d777' : '#a8d3e0';
    ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath();
    let live = false;
    if (state.playing && analyser && buf) { try { analyser.getByteTimeDomainData(buf); live = true; } catch (e) { live = false; } }
    const cycles = 3;
    for (let i = 0; i <= sw; i += 2) {
      let v;
      if (live) {
        const idx = Math.floor((i / sw) * (buf.length - 1));
        v = (buf[idx] - 128) / 128 * 1.6;
      } else {
        v = waveAt((i / sw) * cycles + st.t * state.f * 0.25);
      }
      const y = sy - clamp(v, -1.2, 1.2) * scopeH * 0.42;
      i === 0 ? ctx.moveTo(x0 + i, y) : ctx.lineTo(x0 + i, y);
    }
    ctx.stroke();
    ctx.restore();
    label(ctx, live ? 'live microphone-free scope (AnalyserNode)' : `${state.wave} wave · drawn from y = f(2\u03C0ft)`,
      w / 2, sy + scopeH / 2 + 16, { color: '#7b8db0', size: 10.5, weight: '600' });

    // pitch ruler: log scale from FMIN to FMAX with note ticks
    const ry = h * 0.78, rx0 = w * 0.08, rw = w * 0.84;
    const fx = f => rx0 + rw * (Math.log2(f) - Math.log2(FMIN)) / (Math.log2(FMAX) - Math.log2(FMIN));
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(rx0 + rw, ry); ctx.stroke();
    ctx.restore();
    for (let midi = 33; midi <= 93; midi++) {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      if (f < FMIN || f > FMAX) continue;
      const isC = ((midi % 12) + 12) % 12 === 0;
      const x = fx(f);
      ctx.save();
      ctx.strokeStyle = isC ? 'rgba(232,238,251,.8)' : 'rgba(148,163,184,.4)';
      ctx.lineWidth = isC ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, ry - (isC ? 7 : 4)); ctx.lineTo(x, ry + (isC ? 7 : 4)); ctx.stroke();
      ctx.restore();
      if (isC) label(ctx, `C${Math.floor(midi / 12) - 1}`, x, ry + 18, { color: '#a9bad6', size: 10 });
    }
    // needle at the current frequency
    const nx = fx(clamp(state.f, FMIN, FMAX));
    arrow(ctx, nx, ry - 26, nx, ry - 8, { color: '#f6d36b', width: 2.6, head: 8 });
    const note = noteOf(state.f);
    label(ctx, `${note.text}${note.cents ? ` ${note.cents > 0 ? '+' : ''}${note.cents}\u00A2` : ''}`,
      nx, ry - 36, { color: '#f6d36b', size: 13, weight: '800' });
    label(ctx, 'lower pitch', rx0 + 4, ry + 34, { color: '#7b8db0', size: 10.5, align: 'left' });
    label(ctx, 'higher pitch', rx0 + rw - 4, ry + 34, { color: '#7b8db0', size: 10.5, align: 'right' });
    label(ctx, `${fixed(state.f, 0)} Hz`, w / 2, h - 8, { color: 'rgba(148,163,184,.9)', size: 11, weight: '700' });
  }, { animate: true });

  /* ---- readouts ------------------------------------------------------------------ */
  const el = id => document.getElementById(id);
  function setStatus(txt) { if (el('snd-status')) el('snd-status').textContent = txt; }
  function updateReadouts() {
    const note = noteOf(state.f);
    if (el('snd-note')) el('snd-note').textContent = `${note.text}${note.cents ? ` (${note.cents > 0 ? '+' : ''}${note.cents} cents)` : ' (exact)'}`;
    if (el('snd-lambda')) el('snd-lambda').textContent = `${fixed(CONST.V_SOUND / state.f, 2)} m`;
    if (el('snd-period')) el('snd-period').textContent = `${fixed(1000 / state.f, 2)} ms`;
    if (el('snd-sub')) {
      el('snd-sub').textContent =
        `\u03BB = v/f = ${CONST.V_SOUND} \u00F7 ${fixed(state.f, 0)} = ${fixed(CONST.V_SOUND / state.f, 2)} m in air at 20 \u00B0C` +
        `  \u00B7  one cycle every ${fixed(1000 / state.f, 1)} ms`;
    }
  }

  /* ---- controls -------------------------------------------------------------------- */
  const slider = el('snd-f');
  if (slider) slider.addEventListener('input', () => {
    state.f = parseFloat(slider.value);
    if (el('snd-fv')) el('snd-fv').textContent = `${fixed(state.f, 0)} Hz`;
    audioSet(); stage.invalidate(); updateReadouts();
  });
  bindSegment('snd-wave', v => { state.wave = v; audioSet(); stage.invalidate(); });

  const playBtn = el('snd-play');
  if (playBtn) playBtn.addEventListener('click', () => {
    if (!state.playing) {
      if (!audioStart()) {
        setStatus('Audio is not available in this browser \u2014 the waveform view still shows exactly what you would hear.');
        EMC.toast('Audio unavailable \u2014 look at the scope instead', 'warn');
        return;
      }
      state.playing = true;
      stage.setIdle(false);
      playBtn.textContent = 'Stop tone';
      playBtn.setAttribute('aria-pressed', 'true');
      setStatus(`playing ${fixed(state.f, 0)} Hz ${state.wave} \u2014 that is pitch ${noteOf(state.f).text}`);
    } else {
      audioStop();
      state.playing = false;
      stage.setIdle(true); stage.invalidate();
      playBtn.textContent = 'Play tone';
      playBtn.setAttribute('aria-pressed', 'false');
      setStatus('stopped \u2014 press Play to hear the pitch again');
    }
  });

  document.querySelectorAll('[data-snd-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = parseFloat(btn.dataset.sndPreset);
      state.f = clamp(f, FMIN, FMAX);
      if (slider) { slider.value = String(state.f); slider.dispatchEvent(new Event('input', { bubbles: true })); }
      audioSet(); stage.invalidate(); updateReadouts();
      EMC.toast(`Preset: ${btn.textContent.trim()} — ${fixed(state.f, 1)} Hz`);
    });
  });

  if (el('snd-fv')) el('snd-fv').textContent = `${fixed(state.f, 0)} Hz`;
  setStatus(AC ? 'ready \u2014 press Play to hear the tone' : 'audio unavailable in this browser \u2014 the scope still works');
  updateReadouts();
  }
})();
