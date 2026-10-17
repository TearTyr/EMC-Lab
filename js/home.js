/* Home page: animated travelling-wave hero (two superposed sine waves with oscillating medium particles, flat art) + progress dashboard driven by EMC.Progress, with JSON export/import so device-local progress can be carried to another machine. */
(function () {
  const { CONST, clamp, chargeGlyph, label, Progress } = EMC;
  const k = CONST.K;

  /* ---------------------------------------------------------------- hero */
  const hero = document.getElementById('heroCanvas');
  if (hero) {
    const dipole = [
      { q: 5, nx: 0.34, ny: 0.5 },
      { q: -5, nx: 0.66, ny: 0.5 }
    ];
    const PX_PER_M = 260;
    let lines = [];                       // cached polylines (canvas px)

    function fieldAt(x, y, w, h) {
      let ex = 0, ey = 0;
      for (const c of dipole) {
        const dxm = (x - c.nx * w) / PX_PER_M;
        const dym = (y - c.ny * h) / PX_PER_M;
        const r2 = dxm * dxm + dym * dym;
        if (r2 < 1e-6) continue;
        const r = Math.sqrt(r2);
        const E = k * (c.q * 1e-6) / r2;
        ex += E * dxm / r; ey += E * dym / r;
      }
      return { ex, ey, mag: Math.hypot(ex, ey) };
    }

    /* Trace the field lines once so the animation loop only has to stroke them. */
    function buildLines(w, h) {
      lines = [];
      const seeds = dipole.filter(c => c.q > 0);
      const step = 3, maxSteps = 700;
      for (const c of seeds) {
        const cx = c.nx * w, cy = c.ny * h;
        const n = 16;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          let x = cx + Math.cos(a) * 14, y = cy + Math.sin(a) * 14;
          const pts = [[x, y]];
          for (let s = 0; s < maxSteps; s++) {
            const f = fieldAt(x, y, w, h);
            if (f.mag < 1e-9) break;
            x += (f.ex / f.mag) * step; y += (f.ey / f.mag) * step;
            pts.push([x, y]);
            if (x < -30 || x > w + 30 || y < -30 || y > h + 30) break;
            let stop = false;
            for (const o of dipole) {
              if (o.q > 0) continue;
              if (Math.hypot(x - o.nx * w, y - o.ny * h) < 14) { stop = true; break; }
            }
            if (stop) break;
          }
          if (pts.length > 4) lines.push(pts);
        }
      }
    }

    const stage = new EMC.Stage(hero, (ctx, w, h, st) => {
      ctx.clearRect(0, 0, w, h);
      if (!lines.length) buildLines(w, h);

      // animated flow along the cached lines
      ctx.save();
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.setLineDash([7, 11]);
      ctx.lineDashOffset = -st.t * 26;
      lines.forEach((pts, i) => {
        ctx.strokeStyle = `hsla(${186 + (i % 5) * 6} 90% 66% / ${0.30 + 0.12 * Math.sin(st.t * 1.4 + i)})`;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      });
      ctx.restore();

      // the two charges breathe gently
      const pulse = 0.18 * Math.sin(st.t * 1.6);
      dipole.forEach(c => {
        chargeGlyph(ctx, c.nx * w, c.ny * h, 15, c.q, { pulse });
      });
      label(ctx, 'E = k q / r\u00B2    \u00B7    F = k q1 q2 / r\u00B2', w / 2, h - 16,
        { color: 'rgba(169,186,214,.75)', size: 11.5, weight: '600' });
    }, { animate: true });

    // Rebuild the cached line geometry only when the canvas size really changes.
    let lastW = 0, lastH = 0;
    const checkSize = () => {
      const r = hero.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h; lines = [];
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

  const TOPIC_META = EMC_REGISTRY.chapters.reduce((o, c) => (o[c.id] = { title: c.title, href: c.path }, o), {});

  function renderDashboard() {
    const p = Progress.read();
    const pct = Progress.percent();
    const setTxt = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };

    if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - clamp(pct, 0, 100) / 100));
    setTxt('ringPct', `${pct}%`);
    setTxt('dashPct', `${pct}% complete`);

    const doneCount = EMC.TOPICS.filter(t => p.topics[t]).length;
    const topicsLine = `${doneCount} of ${EMC.TOPICS.length} chapters studied`;
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
