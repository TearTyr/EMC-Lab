/* Quiz engine: exam/instant marking, automatic scoring with per-topic breakdown and grade bands, timer + per-question splits, streak counter, keyboard flow, Chart.js analytics (vendored in vendor/chart/) with a CSS-bar fallback if the library fails to load, ?topic= deep links, progress persisted through EMC.Progress. */
(function () {
  const host = document.getElementById('quiz-questions');
  if (!host || !window.EMC_QUIZ) return;

  const { Progress, toast } = EMC;
  const BANK = window.EMC_QUIZ.slice();
  // Four options per question, so exactly four key labels. (A stray 'E' here used
  // to print an empty fifth key chip on the keyboard hint row.)
  const KEYS = ['A', 'B', 'C', 'D'];

  /* ---- state ---------------------------------------------------------- */
  let activeCharts = [];          // Chart.js instances (destroyed on re-grade)
  let timerHandle = 0;            // 1 s ticker for the quiz clock

  /* Denki-chan reaction faces for graded feedback (inline SVG, no library) */
  const FACE_HAPPY = '<svg class="mreact" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M20 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M34 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M27 37 q3 3 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/></svg>';
  const FACE_OOPS = '<svg class="mreact" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><circle cx="23" cy="29" r="2.4" fill="#2b2d33"/><circle cx="37" cy="29" r="2.4" fill="#2b2d33"/><path d="M26 39 q4 -3 8 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/><path d="M46 18 q3 5 0 7 q-3 -2 0 -7" fill="#a8d3e0"/></svg>';

  const S = {
    order: BANK.slice(),          // current question order (shuffle changes this)
    filter: 'all',                // 'all' | topic id | 'wrong' | 'unanswered'
    answers: new Map(),           // question id -> chosen option index
    marked: new Map(),            // question id -> true/false (only once graded)
    submitted: false,
    instant: false,
    blankWarned: false,
    enterPhase: 'enter',          // first paint gets the staggered entrance, later swaps a shorter fade
    t0: 0,                 // quiz clock start (ms, 0 = not started)
    lastMark: 0,           // timestamp of the previously answered question
    times: new Map(),      // question id -> seconds spent on it
    streak: 0,             // live streak (instant mode)
    bestStreak: 0,         // longest consecutive-correct run (question order)
    totalTime: 0,          // seconds, frozen at submit
    activeCard: null       // card nearest the viewport centre (keyboard target)
  };

  const el = id => document.getElementById(id);
  const visible = () => S.order.filter(q => {
    if (S.filter === 'all') return true;
    if (S.filter === 'wrong') return S.marked.get(q.id) === false;
    if (S.filter === 'unanswered') return !S.answers.has(q.id);
    return q.topic === S.filter;
  });

  /* ---- rendering ------------------------------------------------------- */
  function questionHTML(q, index) {
    const chosen = S.answers.has(q.id) ? S.answers.get(q.id) : -1;
    const isMarked = S.marked.has(q.id);
    const correct = S.marked.get(q.id);
    const ch = (window.EMC_REGISTRY || {}).chapter ? EMC_REGISTRY.chapter(q.topic) : null;
    const topicClass = (ch && ch.tagClass) || '';

    const opts = q.options.map((text, i) => {
      let cls = 'opt';
      if (isMarked) {
        if (i === q.answer) cls += ' correct';
        else if (i === chosen) cls += ' wrong';
      }
      // worded marks: U+2713/U+2717 are absent from several common font stacks
      const mark = isMarked && i === q.answer ? '<span class="mark">correct</span>'
        : isMarked && i === chosen ? '<span class="mark">your answer</span>' : '';
      return `<button type="button" class="${cls}" role="radio" data-opt="${i}"
                aria-checked="${i === chosen}" ${isMarked ? 'disabled' : ''}>
                <span class="key">${KEYS[i]}</span><span>${text}</span>${mark}</button>`;
    }).join('');

    let fb = '';
    if (isMarked) {
      const secs = S.times.get(q.id);
      fb = `<div class="feedback ${correct ? 'good' : 'bad'}">
              ${correct ? FACE_HAPPY : FACE_OOPS}
              <span><b>${correct ? 'Correct.' : 'Not quite.'}</b> ${q.explain}${
                secs ? ` <span class="tiny faint">(answered in ${secs}s)</span>` : ''}</span>
            </div>`;
    } else if (chosen >= 0) {
      fb = `<div class="feedback">Answer recorded: <b>${KEYS[chosen]}</b>. ${
        S.instant ? '' : 'It will be marked when you submit the quiz.'}</div>`;
    }

    const cardClass = isMarked ? (correct ? 'answered-correct' : 'answered-wrong') : (chosen >= 0 ? 'answered' : '');
    // Entrance motion: the first paint staggers cards in; every later repaint
    // (filter, shuffle, grading) uses a short cross-fade instead. The delay
    // lives in a custom property so CSS owns the animation entirely.
    const enterCls = S.enterPhase === 'enter' ? 'q-enter' : 'q-swap';
    const enterStyle = S.enterPhase === 'enter' ? ` style="--qi:${Math.min(index, 9)}"` : '';
    return `<article class="q-card ${cardClass} ${enterCls}" data-qid="${q.id}" id="q-${q.id}"${enterStyle}>` +
      `<div class="q-head">
        <span class="q-num">${index + 1}</span>
        <div style="min-width:0">
          <p class="q-text">${q.q}</p>
          <span class="tag ${topicClass} q-topic">${q.label}</span>
        </div>
      </div>
      <div class="opts" role="radiogroup" aria-label="Answer options for question ${index + 1}">${opts}</div>
      ${fb}
    </article>`;
  }

  function render() {
    const list = visible();
    if (!list.length) {
      host.innerHTML = `<div class="card center muted">No questions match this filter
        ${S.filter === 'wrong' ? '(nothing was incorrect \u2014 well done!)'
          : S.filter === 'unanswered' ? '(every question already has an answer \u2014 nice work!)' : ''}.</div>`;
    } else {
      host.innerHTML = list.map((q, i) => questionHTML(q, i)).join('');
    }
    S.enterPhase = 'swap';           // the staggered entrance plays exactly once
    renderMeta();
  }

  /* Answered-count bar, counters in the sticky panel. */
  function renderMeta() {
    const list = visible();
    // Progress always spans the FULL bank: filters are views, not denominators,
    // so the bar and the "x of y answered" line never shrink with a filter.
    const answered = S.order.filter(q => S.answers.has(q.id)).length;
    const total = S.order.length;
    const pct = total ? (answered / total) * 100 : 0;
    if (el('quiz-progress-fill')) el('quiz-progress-fill').style.width = pct.toFixed(1) + '%';
    if (el('quiz-progress-text')) el('quiz-progress-text').textContent = `${answered} of ${total} answered`;
    if (el('quiz-count')) el('quiz-count').textContent = String(list.length);   // label already says "Questions"

    // live score while in instant mode
    if (S.instant && el('quiz-live')) {
      const marked = list.filter(q => S.marked.has(q.id));
      const right = marked.filter(q => S.marked.get(q.id) === true).length;
      el('quiz-live').hidden = marked.length === 0;
      el('quiz-live').textContent = `\u00A0\u00B7 Marked so far: ${right}/${marked.length}`;
    } else if (el('quiz-live')) {
      el('quiz-live').hidden = true;
    }

    const submitBtns = document.querySelectorAll('[data-quiz-submit]');
    submitBtns.forEach(b => {
      // one shared workflow: every submit control mirrors the same state
      b.disabled = S.submitted;
      b.textContent = S.submitted ? 'Quiz submitted' : `Submit quiz (${total})`;
    });
  }

  /* ---- clock, streaks, keyboard ---------------------------------------- */
  const fmtTime = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  function startTimer() {
    if (S.t0) return;
    S.t0 = performance.now(); S.lastMark = S.t0;
    const elT = el('quiz-timer');
    if (elT) elT.hidden = false;
    // the floating panel surfaces the same single clock - no second timer
    const ft = el('floatTimer');
    if (ft) { ft.hidden = false; ft.classList.add('show'); ftPlace(); }
    const hint = el('floatTimerHint');
    if (hint) hint.textContent = 'since your first answer';
    timerHandle = setInterval(() => {
      if (elT && S.t0 && !S.submitted) elT.textContent = fmtTime(Math.round((performance.now() - S.t0) / 1000));
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerHandle); timerHandle = 0;
    if (S.t0) S.totalTime = Math.round((performance.now() - S.t0) / 1000);
  }
  function recordTime(qid) {
    if (!S.t0) return;
    const now = performance.now();
    S.times.set(qid, Math.max(1, Math.round((now - S.lastMark) / 1000)));
    S.lastMark = now;
  }
  function bumpStreak(correct) {
    S.streak = correct ? S.streak + 1 : 0;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    const elS = el('quiz-streak');
    if (elS) { elS.hidden = S.streak < 2; elS.textContent = `streak \u00D7${S.streak}`; }
  }

  /* ---- floating timer panel: position, drag, keys, minimise -------------
     One panel, one clock (S.t0). The panel is position:fixed at 0,0 and moved
     with a transform, so scrolling never touches it and moving it costs one
     compositor-friendly property. ftPos === null means "default slot"
     (bottom-right corner); any drag or arrow-key nudge stores explicit px. */
  const ftPanel = el('floatTimer');
  const ftHandle = el('floatTimerHandle');
  const FT_GAP = 14;
  let ftPos = null;
  function ftRect() { return ftPanel.getBoundingClientRect(); }
  function ftClamp(p) {
    const r = ftRect();
    const maxX = Math.max(FT_GAP, window.innerWidth - r.width - FT_GAP);
    const maxY = Math.max(FT_GAP, window.innerHeight - r.height - FT_GAP);
    return { x: Math.min(Math.max(FT_GAP, p.x), maxX), y: Math.min(Math.max(FT_GAP, p.y), maxY) };
  }
  function ftDefault() {
    const r = ftRect();
    return { x: Math.max(FT_GAP, window.innerWidth - r.width - FT_GAP - 4),
             y: Math.max(FT_GAP, window.innerHeight - r.height - FT_GAP) };
  }
  function ftPlace() {
    if (!ftPanel) return;
    const p = ftPos ? ftClamp(ftPos) : ftDefault();
    ftPos = p;
    ftPanel.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
  }
  if (ftPanel && ftHandle) {
    /* pointer + touch drag (the handle only, so page scroll and text
       selection elsewhere are untouched; buttons inside stay clickable) */
    ftHandle.addEventListener('pointerdown', e => {
      if (e.target.closest('.ft-btn')) return;
      const r = ftRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      ftPanel.classList.add('dragging');
      if (ftHandle.setPointerCapture) { try { ftHandle.setPointerCapture(e.pointerId); } catch (err) { /* older engines */ } }
      const move = ev => { ftPos = ftClamp({ x: ev.clientX - dx, y: ev.clientY - dy }); ftPlace(); };
      const end = () => {
        ftPanel.classList.remove('dragging');
        ftHandle.removeEventListener('pointermove', move);
        ftHandle.removeEventListener('pointerup', end);
        ftHandle.removeEventListener('pointercancel', end);
      };
      ftHandle.addEventListener('pointermove', move);
      ftHandle.addEventListener('pointerup', end);
      ftHandle.addEventListener('pointercancel', end);
      e.preventDefault();          // no text selection while dragging
    });
    /* keyboard repositioning: arrows nudge, Shift = big step, Home = default */
    ftHandle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 80 : 24;
      const cur = ftPos ? ftClamp(ftPos) : ftDefault();
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (delta) { ftPos = ftClamp({ x: cur.x + delta[0], y: cur.y + delta[1] }); ftPlace(); e.preventDefault(); return; }
      if (e.key === 'Home') { ftPos = null; ftPlace(); e.preventDefault(); }
    });
    const minBtn = el('floatTimerMin');
    if (minBtn) minBtn.addEventListener('click', () => {
      const min = ftPanel.classList.toggle('min');
      minBtn.setAttribute('aria-pressed', String(min));
      minBtn.setAttribute('aria-label', min ? 'Expand timer panel' : 'Minimize timer panel');
      const icMin = minBtn.querySelector('.ic-min'), icPlus = minBtn.querySelector('.ic-plus');
      if (icMin) icMin.hidden = min;
      if (icPlus) icPlus.hidden = !min;
      requestAnimationFrame(ftPlace);        // re-clamp for the new size
    });
    const resetBtn = el('floatTimerReset');
    if (resetBtn) resetBtn.addEventListener('click', () => { ftPos = null; ftPlace(); });
    window.addEventListener('resize', ftPlace);   // stay inside a changed viewport
  }
  function computeBestStreak() {
    let run = 0, best = 0;
    for (const q of S.order) {
      if (S.marked.get(q.id) === true) { run++; best = Math.max(best, run); } else run = 0;
    }
    return best;
  }
  function initKeyboardAndFocus() {
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(entries => {
        for (const en of entries) if (en.isIntersecting && en.intersectionRatio >= 0.4) S.activeCard = en.target;
      }, { threshold: [0.4, 0.7] });
      const watch = () => host.querySelectorAll('.q-card').forEach(c => io.observe(c));
      watch();
      new MutationObserver(watch).observe(host, { childList: true });
    }
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && /INPUT|TEXTAREA|SELECT|SUMMARY|BUTTON/.test(t.tagName)) return;
      const card = S.activeCard;
      // NB: explicit null checks here and below, never bang-negation. Tailwind
      // scans this file for class names, and a negated identifier reads as an
      // "important" utility candidate, which compiles a phantom variant of the
      // component class into css/site.css. tools/smoke-test.mjs guards this.
      if (card === null || card === undefined) return;
      const key = e.key.toLowerCase();
      const idx = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key)
        : 'abcd'.indexOf(key) >= 0 ? 'abcd'.indexOf(key) : -1;
      if (idx >= 0 && !S.submitted) {
        const opt = card.querySelectorAll('.opt:not([disabled])')[idx];
        if (opt) { opt.click(); e.preventDefault(); }
      } else if (e.key === 'Enter' && !S.submitted) {
        const sb = el('quiz-submit'); if (sb && !sb.disabled) { sb.click(); e.preventDefault(); }
      } else if (key === 'n' && !S.submitted) {
        const blank = visible().find(q => !S.answers.has(q.id));
        if (blank) EMC.scrollToEl(document.getElementById(`q-${blank.id}`));
        e.preventDefault();
      }
    });
  }

  /* ---- answering ------------------------------------------------------- */
  host.addEventListener('click', e => {
    const btn = e.target.closest('.opt');
    if (btn === null || btn.disabled) return;
    const card = btn.closest('.q-card');
    const qid = Number(card.dataset.qid);
    const q = BANK.find(x => x.id === qid);
    if (!q || S.marked.has(qid)) return;

    S.answers.set(qid, Number(btn.dataset.opt));
    startTimer();
    recordTime(qid);

    if (S.instant) {
      const right = S.answers.get(qid) === q.answer;
      S.marked.set(qid, right);
      bumpStreak(right);
      render();
      if (right) {
        const winOpt = document.querySelector(`#q-${qid} .opt.correct`);
        if (winOpt) winOpt.classList.add('burst');
        toast(S.streak >= 3 ? `Correct \u2014 streak \u00D7${S.streak}!` : 'Correct!');
      }
      EMC.scrollToEl(document.getElementById(`q-${qid}`));
      // the re-render replaced the clicked (now disabled) button: keep keyboard
      // users anchored by moving focus to the graded feedback
      const fbNow = document.querySelector(`#q-${qid} .feedback`);
      if (fbNow) { fbNow.setAttribute('tabindex', '-1'); fbNow.focus({ preventScroll: true }); }
    } else {
      // light-touch update: no full re-render, so scroll position is preserved
      card.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-checked', String(b === btn)));
      // one-shot electrical ring on the chosen option (CSS owns the keyframes;
      // the reflow trick restarts it without ever stacking animations)
      btn.classList.remove('pick');
      void btn.offsetWidth;
      btn.classList.add('pick');
      let fb = card.querySelector('.feedback');
      if (!fb) { fb = document.createElement('div'); fb.className = 'feedback'; card.appendChild(fb); }
      fb.innerHTML = `Answer recorded: <b>${KEYS[S.answers.get(qid)]}</b>. It will be marked when you submit the quiz.`;
      card.classList.add('answered');
      renderMeta();
    }
  });

  /* keyboard: arrow keys move between options inside a group */
  host.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const btn = e.target.closest('.opt');
    if (btn === null) return;
    const group = Array.from(btn.parentElement.querySelectorAll('.opt:not([disabled])'));
    const i = group.indexOf(btn);
    const next = group[(i + (e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1) + group.length) % group.length];
    if (next) { next.focus(); e.preventDefault(); }
  });

  /* ---- scoring --------------------------------------------------------- */
  const BANDS = [
    { min: 90, text: 'Outstanding', cls: 'accent-emerald', note: 'You have this material mastered \u2014 try explaining Lenz\u2019s law to someone else.' },
    { min: 75, text: 'Strong', cls: 'accent-cyan', note: 'Solid understanding. Review the questions you missed and re-run the relevant simulation.' },
    { min: 60, text: 'Getting there', cls: 'accent-amber', note: 'You know the core ideas. Work through the wrong answers below, then retake the quiz.' },
    { min: 40, text: 'Keep practising', cls: 'accent-amber', note: 'Re-read the tutorial sections flagged by your wrong answers and use the simulations to build intuition.' },
    { min: 0, text: 'Time to revisit', cls: 'accent-rose', note: 'Start again with Topic 1 and work through the simulations slowly \u2014 the concepts build on each other.' }
  ];
  const bandFor = pct => BANDS.find(b => pct >= b.min);

  function submit() {
    if (S.submitted) return;          // one grading pass per attempt, from any control
    // The score always covers the FULL bank: a topic filter is a revision aid,
    // not a way to shrink the denominator. Blanks count as incorrect.
    const blanks = S.order.filter(q => !S.answers.has(q.id));

    // One-time guard so a stray click cannot silently cost marks.
    if (blanks.length && !S.blankWarned) {
      S.blankWarned = true;
      toast(`${blanks.length} question${blanks.length === 1 ? ' is' : 's are'} still blank (across all topics) \u2014 click Submit again to grade them as incorrect`, 'warn');
      // jump to the first blank one the user can actually see
      S.filter = 'all'; syncFilterButtons(); render();
      const first = document.getElementById(`q-${blanks[0].id}`);
      if (first) {
        EMC.scrollToEl(first);
        if (first.animate) {
          try {
            first.animate(
              [{ boxShadow: '0 0 0 0 rgba(251,191,36,0)' },
               { boxShadow: '0 0 0 4px rgba(251,191,36,.55)' },
               { boxShadow: '0 0 0 0 rgba(251,191,36,0)' }],
              { duration: 1400, iterations: 2 }
            );
          } catch (err) { /* Web Animations API unavailable - not critical */ }
        }
      }
      return;
    }

    S.submitted = true;
    stopTimer();
    S.filter = 'all';
    syncFilterButtons();
    S.order.forEach(q => { S.marked.set(q.id, S.answers.has(q.id) && S.answers.get(q.id) === q.answer); });
    if (!S.instant) S.bestStreak = computeBestStreak();
    render();

    // grading disables the option buttons and the submit button; a focused
    // disabled control drops keyboard users to <body>, so hand focus to the
    // score card instead
    const scoreBox = el('quiz-score');
    if (scoreBox) {
      if (!scoreBox.hasAttribute('tabindex')) scoreBox.setAttribute('tabindex', '-1');
      scoreBox.focus({ preventScroll: true });
    }

    // record FIRST so the score card can quote the updated best/attempts
    const scored = S.order.slice();
    const right = scored.filter(q => S.marked.get(q.id) === true).length;
    const pct = scored.length ? Math.round((right / scored.length) * 100) : 0;
    Progress.recordQuiz(pct);
    document.dispatchEvent(new CustomEvent('emc:progress', { detail: Progress.read() }));
    showScore();
  }

  function showScore() {
    const box = el('quiz-score');
    if (!box) return;
    const scored = S.order.slice();          // the full bank was graded on submit
    const right = scored.filter(q => S.marked.get(q.id) === true).length;
    const total = scored.length;
    const pct = total ? Math.round((right / total) * 100) : 0;
    const band = bandFor(pct);
    const prog = Progress.read();

    // per-chapter breakdown (registry order)
    const topics = EMC_REGISTRY.chapters.map(c => c.id);
    const rows = topics.map(t => {
      const qs = scored.filter(q => q.topic === t);
      if (!qs.length) return '';
      const ok = qs.filter(q => S.marked.get(q.id) === true).length;
      const p = Math.round((ok / qs.length) * 100);
      const lbl = qs[0].label;
      return `<div class="grid gap-2 items-center" style="grid-template-columns:minmax(120px,1fr) 2fr auto">
                <span class="small muted">${lbl}</span>
                <span class="progress-track"><span class="progress-fill" style="width:${p}%"></span></span>
                <span class="mono small">${ok}/${qs.length}</span>
              </div>`;
    }).join('');

    box.hidden = false;
    box.classList.remove('score-enter');
    void box.offsetWidth;               // restart the entrance on every retake
    box.classList.add('score-enter');
    // The home dashboard promises that a pass (>= 70%) ticks all five topics.
    // Say so out loud at the moment it happens instead of letting it be silent.
    const passNote = pct >= 70
      ? `<p class="tiny faint" style="margin:.9rem 0 0">Scoring 70% or more also marks all three chapters
           as studied on your dashboard \u2014 a pass means the whole course has been covered.
           Un-tick any topic with the button at the end of its page if you would rather keep
           working on it.</p>`
      : '';

    box.innerHTML = `
      <div class="score-card">
        <div>
          <div class="grade ${band.cls}">${pct}%</div>
          <div class="small muted mono">${right} / ${total} correct</div>
        </div>
        <div class="score-bar">
          <div class="tag ${pct >= 75 ? 'tag-emerald' : pct >= 50 ? 'tag-amber' : 'tag-rose'}">${band.text}</div>
          <p class="small muted" style="margin:.5rem 0 .8rem">${band.note}</p>
          <div class="progress-track" style="margin-bottom:.9rem"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div id="quiz-fallback-bars" style="display:grid;gap:.4rem">${rows}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" id="quiz-charts">
        <div class="card card-flat">
          <span class="tag tag-emerald">This attempt</span>
          <div style="height:170px;position:relative"><canvas id="chart-score" role="img"
            aria-label="Doughnut chart of correct versus incorrect answers"></canvas></div>
        </div>
        <div class="card card-flat">
          <span class="tag tag-cyan">Score by topic</span>
          <div style="height:170px;position:relative"><canvas id="chart-topics" role="img"
            aria-label="Bar chart of the percentage score in each topic"></canvas></div>
        </div>
        <div class="card card-flat">
          <span class="tag tag-amber">Attempt history</span>
          <div style="height:170px;position:relative"><canvas id="chart-history" role="img"
            aria-label="Line chart of the score across recent quiz attempts"></canvas></div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="tag">time ${fmtTime(S.totalTime)}</span>
        <span class="tag tag-amber">best streak \u00D7${S.bestStreak}</span>
        <span class="tag tag-cyan">${total ? Math.round(S.totalTime / total) : 0}s per question</span>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <button class="btn btn-primary" id="quiz-retake" type="button">Retake the quiz</button>
        <button class="btn" id="quiz-wrong" type="button">Review incorrect only</button>
        <a class="btn btn-ghost" href="index.html">Back to the home page</a>
        <span class="tiny faint self-center">Best score: ${prog.quizBest}% \u00B7 attempts: ${prog.quizAttempts}</span>
      </div>
      ${passNote}`;

    const wrongCount = scored.filter(q => S.marked.get(q.id) === false).length;
    const wrongBtn = el('quiz-wrong');
    if (wrongBtn) {
      if (!wrongCount) { wrongBtn.disabled = true; wrongBtn.textContent = 'No incorrect answers'; }
      wrongBtn.addEventListener('click', () => {
        S.filter = S.filter === 'wrong' ? 'all' : 'wrong';
        syncFilterButtons();
        render();
        EMC.scrollToEl(host, { behavior: 'smooth', block: 'start' });
      });
    }
    const retake = el('quiz-retake');
    if (retake) retake.addEventListener('click', () => {
      S.answers.clear(); S.marked.clear(); S.submitted = false; S.blankWarned = false;
      S.t0 = 0; S.lastMark = 0; S.times.clear(); S.streak = 0; S.bestStreak = 0; S.totalTime = 0;
      clearInterval(timerHandle); timerHandle = 0;
      const elT = el('quiz-timer'); if (elT) { elT.hidden = true; elT.textContent = '0:00'; }
      const ft = el('floatTimer');
      if (ft) { ft.hidden = true; ft.classList.remove('show', 'min', 'dragging'); ftPos = null; }
      const minB = el('floatTimerMin');
      if (minB) { minB.setAttribute('aria-pressed', 'false'); minB.setAttribute('aria-label', 'Minimize timer panel'); }
      const hint = el('floatTimerHint'); if (hint) hint.textContent = 'starts on your first answer';
      const elS = el('quiz-streak'); if (elS) elS.hidden = true;
      S.filter = 'all'; syncFilterButtons();
      activeCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
      activeCharts = [];
      box.hidden = true;
      render();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* ignore */ }
      toast('Quiz reset \u2014 good luck!');
    });

    renderScoreCharts(right, total, scored);
    EMC.scrollToEl(box);
  }

  /* ---- Chart.js score visualisation (CSS-bar fallback if it is missing) --
     The ~68 KB gzip library is no longer parser-blocking: it is injected the
     first time a score card needs it (or used directly when window.Chart
     already exists, e.g. in tests). Until it arrives, the dependency-free
     CSS bars show the same breakdown. */
  const chartScript = document.querySelector('script[src*="js/quiz"]');
  const CHART_SRC = ((chartScript && chartScript.getAttribute('src')) || 'js/quiz.js')
    .replace(/js\/[^/]+$/, '') + 'vendor/chart/chart.umd.min.js';
  let chartLibState = typeof window.Chart === 'function' ? 'ready' : 'unloaded';
  const pendingChart = [];
  function withChart(done) {
    if (chartLibState === 'ready') { done(window.Chart); return; }
    if (chartLibState === 'failed') { done(null); return; }
    if (chartLibState === 'loading') { pendingChart.push(done); return; }
    chartLibState = 'loading';
    pendingChart.push(done);
    const s = document.createElement('script');
    s.defer = true;
    s.src = CHART_SRC;
    s.onload = () => { chartLibState = typeof window.Chart === 'function' ? 'ready' : 'failed'; flushPending(); };
    s.onerror = () => { chartLibState = 'failed'; flushPending(); };
    document.head.appendChild(s);
  }
  function flushPending() { const q = pendingChart.splice(0); q.forEach(fn => fn(chartLibState === 'ready' ? window.Chart : null)); }

  function renderScoreCharts(right, total, scored) {
    // tear down previous instances now; show CSS bars until the lib is ready
    activeCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
    activeCharts = [];
    const chartsHost = el('quiz-charts');
    const fallback = el('quiz-fallback-bars');
    if (!chartsHost) return;
    chartsHost.hidden = true;
    if (fallback) fallback.hidden = false;
    withChart(C => { if (C) drawScoreCharts(C, right, total, scored); });
  }

  function drawScoreCharts(C, right, total, scored) {
    activeCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
    activeCharts = [];
    const chartsHost = el('quiz-charts');
    const fallback = el('quiz-fallback-bars');
    chartsHost.hidden = false;
    if (fallback) fallback.hidden = true;   // the charts supersede the bars
    C.defaults.color = '#a9bad6';
    C.defaults.borderColor = 'rgba(148,163,184,.14)';

    // 1. doughnut: correct vs incorrect
    activeCharts.push(new C(el('chart-score'), {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Incorrect'],
        datasets: [{
          data: [right, total - right],
          backgroundColor: ['#b5d777', '#f87171'],
          borderColor: '#0c1526', borderWidth: 3, hoverOffset: 6
        }]
      },
      options: {
        maintainAspectRatio: false, cutout: '66%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    }));

    // 2. horizontal bars: percentage per topic
    // short axis labels: the full names clip on narrow canvases
    const topics = EMC_REGISTRY.chapters.map(c => c.id);
    const SHORT_TOPIC = topics.reduce((o, id) => (o[id] = EMC_REGISTRY.chapter(id).short || id, o), {});
    const labels = [], vals = [];
    topics.forEach(t => {
      const qs = scored.filter(q => q.topic === t);
      if (!qs.length) return;
      labels.push(SHORT_TOPIC[t] || qs[0].label);
      vals.push(Math.round((qs.filter(q => S.marked.get(q.id) === true).length / qs.length) * 100));
    });
    activeCharts.push(new C(el('chart-topics'), {
      type: 'bar',
      data: { labels, datasets: [{ data: vals, backgroundColor: '#a8d3e0', borderRadius: 5, maxBarThickness: 18 }] },
      options: {
        indexAxis: 'y', maintainAspectRatio: false,
        scales: { x: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
        plugins: { legend: { display: false } }
      }
    }));

    // 3. line: score across attempts (from stored history)
    const hist = Progress.read().quizHistory || [];
    activeCharts.push(new C(el('chart-history'), {
      type: 'line',
      data: {
        labels: hist.map((h, i) => '#' + (i + 1)),
        datasets: [{
          label: 'score %', data: hist.map(h => h.pct),
          borderColor: '#f6d36b', backgroundColor: 'rgba(251,191,36,.16)',
          fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: '#f6d36b'
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
        plugins: { legend: { display: false } }
      }
    }));
  }

  /* ---- toolbar --------------------------------------------------------- */
  const TOPIC_IDS = EMC_REGISTRY.chapters.map(c => c.id);
  const TOPIC_NAMES = TOPIC_IDS.reduce((o, id) => (o[id] = EMC_REGISTRY.chapter(id).title, o), {});

  /* Keep ?topic= in the address bar truthful: every topic page's "Quiz this
     topic" button deep-links here, and changing the filter by hand updates the
     URL too, so the view is always shareable/bookmarkable. */
  function syncURL() {
    if (!window.history || !window.history.replaceState) return;
    try {
      const u = new URL(window.location.href);
      if (TOPIC_IDS.includes(S.filter)) u.searchParams.set('topic', S.filter);
      else u.searchParams.delete('topic');
      window.history.replaceState(null, '', u.toString());
    } catch (err) { /* file:// or a locked-down history API: harmless */ }
  }

  /* Read the deep link once at boot. Anything unrecognised is ignored so a
     hand-edited URL can never put the quiz in an impossible state. */
  function topicFromURL() {
    try {
      const t = new URLSearchParams(window.location.search).get('topic');
      return TOPIC_IDS.indexOf(t) >= 0 ? t : null;
    } catch (err) { return null; }
  }

  function syncFilterButtons() {
    document.querySelectorAll('[data-quiz-filter]').forEach(b => {
      const on = b.dataset.quizFilter === S.filter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    syncURL();
  }

  document.querySelectorAll('[data-quiz-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      S.filter = btn.dataset.quizFilter;
      if (S.filter !== 'wrong') S.blankWarned = false;
      syncFilterButtons();
      render();
    });
  });

  const shuffleBtn = el('quiz-shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
    // Fisher-Yates shuffle of the question order
    const a = S.order.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    S.order = a;
    render();
    toast('Questions shuffled');
  });

  const modeGroup = el('quiz-mode');
  if (modeGroup) EMC.bindSegment(modeGroup, v => {
    S.instant = v === 'instant';
    if (S.instant && !S.submitted) {
      // mark everything already answered so switching modes is not confusing
      S.order.forEach(q => {
        if (S.answers.has(q.id) && !S.marked.has(q.id)) {
          S.marked.set(q.id, S.answers.get(q.id) === q.answer);
        }
      });
    }
    render();
    toast(S.instant ? 'Instant mode: answers are marked as you go' : 'Exam mode: nothing is marked until you submit');
  });

  /* Top and bottom controls, one workflow: every [data-quiz-submit] button
     calls the same submit(), and renderMeta() keeps their labels and disabled
     states in lockstep - there is exactly one submission path. */
  document.querySelectorAll('[data-quiz-submit]').forEach(b => b.addEventListener('click', submit));

  /* ---- header stats ---------------------------------------------------- */
  const prog = Progress.read();
  if (el('quiz-best')) el('quiz-best').textContent = prog.quizBest ? `${prog.quizBest}%` : '\u2014';
  if (el('quiz-attempts')) el('quiz-attempts').textContent = String(prog.quizAttempts);
  if (el('quiz-total')) el('quiz-total').textContent = String(BANK.length);
  if (el('quiz-total-end')) el('quiz-total-end').textContent = String(BANK.length);

  /* ---- boot ------------------------------------------------------------ */
  const deepTopic = topicFromURL();
  if (deepTopic) {
    S.filter = deepTopic;
    toast(`Filtered to ${TOPIC_NAMES[deepTopic]} \u2014 your score still covers all ${BANK.length} questions`);
  }
  syncFilterButtons();
  render();
  initKeyboardAndFocus();
})();
