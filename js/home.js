/* Home page: animated travelling-wave hero (two superposed sine waves with oscillating medium particles, flat art) + progress dashboard driven by EMC.Progress, with JSON export/import so device-local progress can be carried to another machine. */
(function () {
  const { clamp, label, Progress } = EMC;

  /* ---------------------------------------------------------------- hero */
  const hero = document.getElementById('heroCanvas');
  if (hero) {
    /* Two travelling waves y = A sin(kx - wt): a bright primary and a faint
       harmonic ghost, plus dots that ride the primary wave to show that the
       MEDIUM only oscillates while the PATTERN travels. */
    const waves = [
      { A: 0.30, lambda: 0.34, f: 0.55, color: 'rgba(168,211,224,.95)', width: 2.6 },
      { A: 0.13, lambda: 0.17, f: 1.35, color: 'rgba(213,184,216,.55)', width: 1.8 }
    ];
    const waveY = (wv, xFrac, t, h) =>
      h / 2 - wv.A * h * Math.sin(2 * Math.PI * (xFrac / wv.lambda - wv.f * t));

    const stage = new EMC.Stage(hero, (ctx, w, h, st) => {
      ctx.clearRect(0, 0, w, h);
      const t = st.t;

      // equilibrium line
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(148,163,184,.28)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.restore();

      // the waves
      waves.forEach(wv => {
        ctx.save();
        ctx.strokeStyle = wv.color; ctx.lineWidth = wv.width;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let px = 0; px <= w; px += 3) {
          const y = waveY(wv, px / w, t, h);
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // medium particles riding the primary wave: they only move vertically
      const primary = waves[0];
      ctx.save();
      ctx.fillStyle = '#f6d36b';
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const xFrac = i / n;
        const y = waveY(primary, xFrac, t, h);
        ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(2 * Math.PI * (xFrac / primary.lambda - primary.f * t)));
        ctx.beginPath(); ctx.arc(xFrac * w, y, 3.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // direction of travel
      ctx.save();
      ctx.strokeStyle = 'rgba(232,238,251,.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      const ay = h * 0.14;
      ctx.beginPath(); ctx.moveTo(w * 0.72, ay); ctx.lineTo(w * 0.86, ay); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.86, ay); ctx.lineTo(w * 0.845, ay - 5);
      ctx.moveTo(w * 0.86, ay); ctx.lineTo(w * 0.845, ay + 5);
      ctx.stroke();
      ctx.restore();
      label(ctx, 'wave travels', w * 0.79, ay - 14, { color: 'rgba(169,186,214,.8)', size: 10.5, weight: '600' });
      label(ctx, 'particles only oscillate', w * 0.2, h * 0.86, { color: 'rgba(169,186,214,.65)', size: 10.5, weight: '600' });

      label(ctx, 'v = f\u03BB    \u00B7    Q = mc\u0394T    \u00B7    F_B = \u03C1Vg    \u00B7    V = IR', w / 2, h - 14,
        { color: 'rgba(169,186,214,.75)', size: 11.5, weight: '600' });
    }, { animate: true });

    // nothing to cache per size — the wave is analytic — but keep the redraw tidy
    let lastW = 0, lastH = 0;
    const checkSize = () => {
      const r = hero.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h;
        stage.resize(); stage.draw();
      }
    };
    window.addEventListener('resize', checkSize);
    checkSize();
  }

  /* ---------------------------------------------------------- dashboard */
  const ring = document.getElementById('ringFg');
  const RING_R = 58, RING_C = 2 * Math.PI * RING_R;
  if (ring) { ring.style.strokeDasharray = `${RING_C.toFixed(1)}`; ring.style.strokeDashoffset = String(RING_C); }

  const TOPIC_META = {
    vectors: { title: 'Measurement & vectors', href: 'topics/vectors.html' },
    fluids: { title: 'Fluids', href: 'topics/fluids.html' },
    heat: { title: 'Temperature & heat', href: 'topics/heat.html' },
    waves: { title: 'Waves & sound', href: 'topics/waves.html' },
    current: { title: 'Electricity', href: 'topics/current.html' }
  };

  function renderDashboard() {
    const p = Progress.read();
    const pct = Progress.percent();
    const setTxt = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };

    if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - clamp(pct, 0, 100) / 100));
    setTxt('ringPct', `${pct}%`);
    setTxt('dashPct', `${pct}% complete`);

    const doneCount = EMC.TOPICS.filter(t => p.topics[t]).length;
    const topicsLine = `${doneCount} of ${EMC.TOPICS.length} topics studied`;
    setTxt('dashTopicsDone', topicsLine);      // dashboard definition list
    setTxt('dashTopicsChip', topicsLine);      // chip above the topic grid
    setTxt('dashQuizBest', p.quizAttempts ? `${p.quizBest}%` : 'not attempted');
    setTxt('dashQuizAttempts', String(p.quizAttempts));
    setTxt('dashUpdated', p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '\u2014');

    EMC.TOPICS.forEach(t => {
      const pill = document.querySelector(`[data-topic-check="${t}"]`);
      if (!pill) return;
      const done = !!p.topics[t];
      pill.classList.toggle('done', done);
      pill.textContent = done ? 'completed' : 'not started';
      const link = document.querySelector(`[data-topic-link="${t}"]`);
      if (link) link.setAttribute('aria-label', `${TOPIC_META[t].title} — ${done ? 'completed' : 'not started'}`);
    });

    const notice = document.getElementById('storageNotice');
    if (notice && !EMC.store.available && !notice.innerHTML) {
      notice.hidden = false;
    }
    const status = document.getElementById('storageStatus');
    if (status) status.textContent = EMC.store.available
      ? 'enabled \u2014 your progress is saved in this browser'
      : 'unavailable \u2014 progress will not persist in this browser';
  }

  document.addEventListener('emc:progress', renderDashboard);
  document.addEventListener('emc:ready', renderDashboard);
  renderDashboard();

  /* Put every "Mark topic as complete" button back in step with storage. The
     renderers live in common.js (UI.initTopicButtons) so the button markup -
     cheering mascot included - is defined in exactly one place. */
  function refreshTopicButtons() {
    if (EMC.UI && EMC.UI.syncTopicButtons) EMC.UI.syncTopicButtons();
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    Progress.reset();
    renderDashboard();
    refreshTopicButtons();
    EMC.toast('Progress cleared');
  });

  /* -- export / import ----------------------------------------------------
     Progress is stored on this device only, so these two buttons are how a
     student carries it to another computer: Export downloads a small JSON
     snapshot, Import reads one back (validated by Progress.importJSON).    */
  const exportBtn = document.getElementById('exportProgress');
  if (exportBtn) exportBtn.addEventListener('click', () => {
    try {
      const blob = new Blob([Progress.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emc-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      EMC.toast('Progress file downloaded');
    } catch (err) {
      EMC.toast('Export is blocked in this browser', 'warn');
    }
  });

  const importBtn = document.getElementById('importProgress');
  const importFile = document.getElementById('importProgressFile');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const f = importFile.files && importFile.files[0];
      if (!f) return;
      const finish = (msg, ok) => {
        renderDashboard();
        refreshTopicButtons();
        EMC.toast(msg, ok ? 'ok' : 'warn');
      };
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const res = Progress.importJSON(String(reader.result));
          finish(res.message, res.ok);
        };
        reader.onerror = () => finish('Could not read that file', false);
        reader.readAsText(f);
      } catch (err) {
        finish('Import is blocked in this browser', false);
      }
      importFile.value = '';   // let the same file be imported again
    });
  }
})();
