/* Home page: progress dashboard driven by EMC.Progress, with JSON export/import so device-local progress can be carried to another machine, plus hero counters derived from the registry and the quiz bank — no advertised number on this page is hand-maintained. */
(function () {
  const { clamp, Progress } = EMC;

  /* ------------------------------------------------ hero: derived counts */
  /* Every count the hero advertises (chapters, simulations, quiz questions)
     is computed from the single sources of truth — EMC_REGISTRY and
     EMC_QUIZ — so the page cannot drift when content is added or removed.
     The HTML ships the current values as no-JS fallbacks; these overwrite
     them at boot. The old animated dipole canvas was removed in favour of
     the static KaTeX equation strip in index.html (no driver needed). */
  const REG = window.EMC_REGISTRY || {};
  const chapters = Array.isArray(REG.chapters) ? REG.chapters : [];
  const simCount = chapters.reduce((n, c) => n + (Array.isArray(c.sims) ? c.sims.length : 0), 0);
  const quizCount = (window.EMC_QUIZ && Array.isArray(EMC_QUIZ)) ? EMC_QUIZ.length : 0;

  /* 0–999 spelled out, lower-case ("twenty-four") — callers capitalise where
     the word opens a sentence. Returns null outside the supported range so
     the static fallback is left untouched rather than replaced by junk. */
  function numberToWords(n) {
    if (!Number.isInteger(n) || n < 0 || n > 999) return null;
    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
  }
  const cap = s => (s === null ? null : s.charAt(0).toUpperCase() + s.slice(1));

  const fill = (id, v) => {
    if (v === null || v === undefined) return;
    const n = document.getElementById(id);
    if (n !== null) n.textContent = String(v);
  };
  if (chapters.length) {
    fill('statChapters', chapters.length);
    fill('ledeChapters', numberToWords(chapters.length));
  }
  if (simCount) {
    fill('statSims', simCount);
    fill('ledeSims', numberToWords(simCount));
  }
  if (quizCount) {
    fill('statQuestions', quizCount);
    fill('ledeQuizN', quizCount);
    fill('quizCountWord', cap(numberToWords(quizCount)));   // opens the sentence
    fill('quizCountCta', quizCount);
    fill('quizCountFooter', quizCount);
  }

  /* ---------------------------------------------------------- dashboard */
  /* hero progress card (cosmic redesign): the same real saved progress as the
     dashboard below — overall percent bar, chapters studied, and the best
     quiz attempt expressed as questions-right out of the real bank size. */
  (function heroProgress() {
    const bar = document.getElementById('heroBar');
    if (!bar || !window.EMC_QUIZ) return;
    const p = Progress.read();
    const quizN = Array.isArray(EMC_QUIZ) ? EMC_QUIZ.length : 24;
    const pct = Progress.percent();
    const done = EMC.TOPICS.filter(t => p.topics[t]).length;
    const correct = Math.round((Number(p.quizBest) || 0) * quizN / 100);
    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    bar.style.width = Math.round(Math.min(100, Math.max(0, pct))) + '%';
    set('heroCount', Math.round(pct) + ' %');
    set('heroChap', done + ' / ' + EMC.TOPICS.length);
    set('heroQuiz', correct + ' / ' + quizN);
  })();

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
      const was = pill.textContent;
      pill.textContent = done ? 'completed' : 'not started';
      if (was !== pill.textContent) { pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop'); }
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

  /* Put every "Mark chapter as complete" button back in step with storage. The
     renderers live in common.js (UI.initTopicButtons) so the button markup is
     defined in exactly one place. */
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
      // Importing REPLACES the progress stored on this device - when there is
      // something to lose, ask first (issue #3 item 11).
      const cur = Progress.read();
      const hasProgress = cur.quizAttempts > 0 || cur.quizBest > 0 ||
        Object.keys(cur.topics).some(t => cur.topics[t]);
      if (hasProgress && typeof window.confirm === 'function' &&
          window.confirm('Importing replaces the progress saved on this device. Continue?') === false) {
        importFile.value = '';
        return;
      }
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
