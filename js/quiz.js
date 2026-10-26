/* Quiz engine: exam/instant marking, automatic scoring with per-chapter breakdown, weak-area summary and grade bands, optional timer (Off / Practice count-up / Challenge count-down with a gentle auto-submit), question navigator + flag-for-review, autosave & resume, submit confirmation, per-question splits, streak counter, keyboard flow, Chart.js analytics (vendored in vendor/chart/) with a CSS-bar fallback if the library fails to load, ?topic= deep links, progress persisted through EMC.Progress. */
(function () {
  const host = document.getElementById('quiz-questions');
  if (!host || !window.EMC_QUIZ) return;

  const { Progress, toast, store, Prefs } = EMC;
  const BANK = window.EMC_QUIZ.slice();
  // Four options per question, so exactly four key labels. (A stray 'E' here used
  // to print an empty fifth key chip on the keyboard hint row.)
  const KEYS = ['A', 'B', 'C', 'D'];

  /* ---- state ---------------------------------------------------------- */
  let activeCharts = [];          // Chart.js instances (destroyed on re-grade)
  let timerHandle = 0;            // 1 s ticker for the quiz clock
  let confirmHandle = 0;          // auto-cancel for the "click again" submit phase
  let saveHandle = 0;             // autosave throttle
  let resumePending = false;      // a saved session is waiting for a choice

  /* Graded-feedback badges: flat word chips (the site fonts lack reliable
     \u2713/\u2717 glyphs, and state must never ride on colour alone). */
  /* Denki-chan cheers beside the word badge on a pass (aria-hidden: the words
     carry the state, the mascot carries the personality). */
  const CHEER = '';
  const FACE_HAPPY = '<span class="fbadge fbadge-ok" aria-hidden="true">Correct</span>';
  const FACE_OOPS = '<span class="fbadge fbadge-no" aria-hidden="true">Not quite</span>';

  /* A tiny pastel confetti puff over the score card when the attempt passes.
     CSS owns the motion (one-shot, ends transparent); under reduced motion it
     is simply never rendered. */
  const CONFETTI_COLORS = ['#f8aebe', '#f6d36b', '#b5d777', '#a8d3e0', '#d5b8d8'];
  function confettiHTML() {
    if (EMC.reducedMotion) return '';
    let out = '';
    for (let i = 0; i < 14; i++) {
      const cx = Math.round((i / 13 - 0.5) * 260);
      const left = 6 + Math.round((i * 88) / 13);
      out += `<i style="left:${left}%;--cx:${cx}px;--cd:${((i % 7) * 0.05).toFixed(2)}s;--cc:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}"></i>`;
    }
    return `<span class="confetti" aria-hidden="true">${out}</span>`;
  }

  /* Pager chip glyphs - every chip state reads as colour AND icon, so the
     strip never relies on hue alone (answered: emerald check in the corner,
     flagged: amber flag in the other corner, current: sky tick under number) */
  const CHIP_CHECK = '<svg class="chip-ic chip-ic-done" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.4 4.1 7.5 8 2.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHIP_FLAG = '<svg class="chip-ic chip-ic-flag" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9M3 2.2h6.2l-1.4 2 1.4 2H3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const S = {
    order: BANK.slice(),          // current question order (shuffle changes this)
    filter: 'all',                // 'all' | chapter id (ch1/ch2) | 'wrong' | 'unanswered' | 'flagged'
    answers: new Map(),           // question id -> chosen option index
    marked: new Map(),            // question id -> true/false (only once graded)
    flagged: new Set(),           // question ids flagged for review before submit
    submitted: false,
    instant: false,
    blankWarned: false,
    confirmAsk: false,            // gentle "click again to confirm" submit phase
    enterPhase: 'enter',          // first paint gets the staggered entrance, later swaps a shorter fade
    timerMode: 'off',             // 'off' (calm default) | 'up' practice | 'down' challenge
    timerMins: 10,                // challenge duration: 10 / 15 / 20
    t0: 0,                 // current visible clock segment start (ms, 0 = stopped/paused)
    baseMs: 0,             // banked ACTIVE milliseconds - the clock pauses with the tab
    clockOn: false,        // the quiz clock has been started by an answer
    lastMark: 0,           // timestamp of the previously answered question
    times: new Map(),      // question id -> seconds spent on it
    optOrder: new Map(),   // question id -> display permutation of [0,1,2,3] (reshuffled per attempt)
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
    if (S.filter === 'flagged') return S.flagged.has(q.id);
    return q.topic === S.filter;
  });

  /* The bank's answer key is skewed (A/B/C/D = 7/12/4/1 - always picking B
     would score 50%), so every attempt shuffles each question's display order
     (issue #3 item 10). data-opt keeps the ORIGINAL index, so answers,
     autosave, marking and the 1-4 hotkeys are untouched; only the A-D labels
     and the visual order move. */
  function buildOptOrder() {
    S.optOrder = new Map();
    for (const q of BANK) {
      const a = [0, 1, 2, 3];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      S.optOrder.set(q.id, a);
    }
  }
  /* The A-D label an original option index is wearing in this attempt. */
  function displayKey(qid, optIdx) {
    const order = S.optOrder.get(qid);
    const d = order ? order.indexOf(optIdx) : -1;
    return KEYS[d >= 0 ? d : optIdx];
  }

  /* ---- rendering ------------------------------------------------------- */
  function questionHTML(q, index) {
    const chosen = S.answers.has(q.id) ? S.answers.get(q.id) : -1;
    const isMarked = S.marked.has(q.id);
    const correct = S.marked.get(q.id);
    const ch = (window.EMC_REGISTRY || {}).chapter ? EMC_REGISTRY.chapter(q.topic) : null;
    const topicClass = (ch && ch.tagClass) || '';

    const order = S.optOrder.get(q.id) || [0, 1, 2, 3];
    const opts = order.map((o, d) => {
      let cls = 'opt';
      if (isMarked) {
        if (o === q.answer) cls += ' correct';
        else if (o === chosen) cls += ' wrong';
      }
      // worded marks: U+2713/U+2717 are absent from several common font stacks
      const mark = isMarked && o === q.answer ? '<span class="mark">correct</span>'
        : isMarked && o === chosen ? '<span class="mark">your answer</span>' : '';
      return `<button type="button" class="${cls}" role="radio" data-opt="${o}"
                aria-checked="${o === chosen}" ${isMarked ? 'disabled' : ''}>
                <span class="key">${KEYS[d]}</span><span>${q.options[o]}</span>${mark}</button>`;
    }).join('');

    let fb = '';
    if (isMarked) {
      // per-question splits stay hidden while the optional timer is off: calm by default
      const secs = S.timerMode === 'off' ? undefined : S.times.get(q.id);
      fb = `<div class="feedback ${correct ? 'good' : 'bad'}">
              ${correct ? FACE_HAPPY : FACE_OOPS}
              <span><b>${correct ? 'Correct.' : 'Not quite.'}</b> ${q.explain}${
                secs ? ` <span class="tiny faint">(answered in ${secs}s)</span>` : ''}</span>
            </div>`;
    } else if (chosen >= 0) {
      fb = `<div class="feedback">Answer recorded: <b>${displayKey(q.id, chosen)}</b>. ${
        S.instant ? '' : 'It will be marked when you submit the quiz.'}</div>`;
    }

    const cardClass = isMarked ? (correct ? 'answered-correct' : 'answered-wrong') : (chosen >= 0 ? 'answered' : '');
    const isFlagged = S.flagged.has(q.id);
    // Entrance motion: the first paint staggers cards in; every later repaint
    // (filter, shuffle, grading) uses a short cross-fade instead. The delay
    // lives in a custom property so CSS owns the animation entirely.
    const enterCls = S.enterPhase === 'enter' ? 'q-enter' : 'q-swap';
    const enterStyle = S.enterPhase === 'enter' ? ` style="--qi:${Math.min(index, 9)}"` : '';
    return `<article class="q-card ${cardClass}${isFlagged ? ' flagged' : ''} ${enterCls}" data-qid="${q.id}" id="q-${q.id}"${enterStyle}>` +
      `<div class="q-head">
        <span class="q-num">${index + 1}</span>
        <div style="min-width:0">
          <p class="q-text">${q.q}</p>
          <span class="tag ${topicClass} q-topic">${q.label}</span>
          <span class="tag q-level${q.level === 'full' ? ' q-level-full' : ''}">${q.level === 'full' ? 'Full' : 'Easy'}</span>${q.hint ? `
          <button type="button" class="q-hint-btn" data-hint="${q.id}" aria-expanded="false" aria-controls="hint-${q.id}">hint</button>
          <span class="tiny faint q-hint-text" id="hint-${q.id}" hidden>${q.hint}</span>` : ''}
        </div>
        <button type="button" class="q-flag${isFlagged ? ' on' : ''}" data-flag="${q.id}" aria-pressed="${isFlagged}"
                title="Flag for review" aria-label="${isFlagged ? 'Remove the review flag from' : 'Flag'} question ${index + 1}">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9M3 2.2h6.2l-1.4 2 1.4 2H3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
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
          : S.filter === 'unanswered' ? '(every question already has an answer \u2014 nice work!)'
          : S.filter === 'flagged' ? '(nothing flagged yet \u2014 tap the little flag on a question, or press F, to review it later)' : ''}.</div>`;
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
      b.textContent = S.submitted ? 'Quiz submitted'
        : S.confirmAsk ? 'Confirm submission'
        : `Submit quiz (${total})`;
    });

    // The two-step confirm says how many questions are still blank. The button
    // label stays short ("Confirm submission"), the hint line carries count.
    const blanks = total - answered;
    document.querySelectorAll('[data-submit-hint]').forEach(h => {
      if (S.submitted || (S.confirmAsk === false && (S.blankWarned === false || blanks === 0))) {
        h.hidden = true; h.textContent = '';
      } else if (S.confirmAsk === true) {
        h.hidden = false;
        h.textContent = `No unanswered questions \u00B7 click Submit again to confirm \u2014 answers lock in`;
      } else {
        h.hidden = false;
        h.textContent = `${blanks} of ${total} unanswered \u00B7 blanks grade as incorrect \u00B7 click Submit again to grade`;
      }
    });

    // the always-visible pill mirrors the SAME single progress state
    const pill = el('quizPill');
    if (pill !== null && pill !== undefined) {
      pill.hidden = S.submitted;
      const pText = el('pillText');
      if (pText !== null && pText !== undefined) pText.textContent = `${answered}/${total}`;
      const pFlags = el('pillFlags');
      if (pFlags !== null && pFlags !== undefined) pFlags.hidden = S.flagged.size === 0;
      const pCount = el('pillFlagCount');
      if (pCount !== null && pCount !== undefined) pCount.textContent = String(S.flagged.size);
    }
    syncQuizChrome();
    renderNav();
  }

  /* ---- compact chrome while an attempt is running ------------------------
     Phase-1 layout: the stat tiles and the open Options field grid are
     pre-quiz affordances. Once the attempt starts (any answer, flag, running
     clock, or a saved session waiting on the resume choice) they step away so
     the first question card sits inside the first viewport. A manual
     expand/collapse by the student is never fought over. */
  let optsTouched = false;
  function quizInProgress() {
    return !S.submitted && (S.answers.size > 0 || S.flagged.size > 0 || S.clockOn || resumePending);
  }
  function setOptsOpen(open) {
    const body = el('qopts-fields');
    const tog = el('qopts-toggle');
    if (body === null || body === undefined || tog === null || tog === undefined) return;
    // NB: spelled as an explicit comparison - tailwind scans this file, and a
    // negated bare identifier here would compile to a phantom important util.
    body.hidden = open === false;
    tog.setAttribute('aria-expanded', String(open));
  }
  function syncQuizChrome() {
    const inProg = quizInProgress();
    const stats = el('quiz-stats');
    if (stats !== null && stats !== undefined) stats.hidden = inProg;
    if (inProg && !optsTouched) setOptsOpen(false);
    const sum = el('qopts-summary');
    if (sum !== null && sum !== undefined) {
      const mode = S.instant ? 'Instant feedback' : 'Exam mode';
      const timer = S.timerMode === 'up' ? 'Practice timer'
        : S.timerMode === 'down' ? `Challenge ${S.timerMins} min` : 'Timer off';
      const filter = S.filter === 'all' ? 'All chapters'
        : S.filter === 'unanswered' ? 'Unanswered only'
        : S.filter === 'flagged' ? 'Flagged only'
        : S.filter === 'wrong' ? 'Incorrect only'
        : (TOPIC_NAMES[S.filter] || 'All chapters');
      sum.textContent = `${mode} \u00B7 ${filter} \u00B7 ${timer}`;
    }
  }

  /* ---- clock, streaks, keyboard ----------------------------------------
     ONE internal clock (S.t0) powers everything: the Practice count-up, the
     Challenge count-down, per-question splits and the results time tag. With
     the timer Off (the calm default) the clock still runs internally but
     nothing time-related is displayed and the float panel stays hidden. */
  const fmtTime = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  /* The quiz clock counts ACTIVE time only: hidden/closed tabs bank the time
     and pause (issue #3 item 12 - a day-old resume must never auto-grade a
     challenge). elapsed = banked ms + the current visible segment. */
  const elapsedMs = () => S.baseMs + (S.t0 ? performance.now() - S.t0 : 0);
  const elapsedSec = () => elapsedMs() / 1000;

  document.addEventListener('visibilitychange', () => {
    if (S.submitted || S.clockOn === false) return;
    if (document.hidden) {
      if (S.t0) { S.baseMs += performance.now() - S.t0; S.t0 = 0; }
      flushSession();                  // the tab may never come back
    } else if (S.t0 === 0) {
      S.t0 = performance.now(); S.lastMark = S.t0;
    }
  });

  function tickTimer() {
    if (S.t0 === 0 || S.submitted || S.timerMode === 'off') return;
    const elT = el('quiz-timer');
    if (S.timerMode === 'down') {
      const remaining = Math.round(S.timerMins * 60 - elapsedSec());
      if (elT !== null && elT !== undefined) elT.textContent = fmtTime(Math.max(0, remaining));
      const ft = el('floatTimer');
      // soft amber in the last minute - a colour shift, not an alarm
      if (ft !== null && ft !== undefined) ft.classList.toggle('warn', remaining <= 60 && remaining > 0);
      if (remaining <= 0) {
        stopTick();
        if (elT !== null && elT !== undefined) elT.textContent = '0:00';
        timeUp();
      }
    } else if (elT !== null && elT !== undefined) {
      elT.textContent = fmtTime(Math.round(elapsedSec()));
    }
  }
  function startTick() {
    if (timerHandle) return;
    timerHandle = setInterval(tickTimer, 1000);
    tickTimer();                        // paint the right value immediately
  }
  function stopTick() { clearInterval(timerHandle); timerHandle = 0; }

  /* On phone-width screens the floating panel would sit on top of the answer
     options (§3.5 forbids that), so it docks as an opaque full-width bottom
     bar and the question list reserves matching padding — same contract as
     the sticky header: the widget owns its strip, no answer is ever
     permanently covered. Wider screens keep the draggable panel. */
  function ftDock() {
    const ft = el('floatTimer');
    if (ft === null || ft === undefined) return;
    const dock = window.innerWidth < 480;
    ft.classList.toggle('docked', dock);
    document.body.classList.toggle('timer-docked', dock && ft.hidden === false);
  }
  function showTimerPanel() {
    const ft = el('floatTimer');
    if (ft === null || ft === undefined) return;
    ft.hidden = false; ft.classList.add('show'); ftDock(); ftPlace();
    const title = ft.querySelector('.ft-title');
    if (title !== null && title !== undefined) title.textContent = S.timerMode === 'down' ? 'Remaining' : 'Elapsed';
    const hint = el('floatTimerHint');
    if (hint !== null && hint !== undefined) {
      hint.textContent = S.timerMode === 'down'
        ? `${S.timerMins} min challenge \u00B7 grades itself at 0:00`
        : 'since your first answer';
    }
  }
  function hideTimerPanel() {
    document.body.classList.remove('timer-docked');
    const ft = el('floatTimer');
    if (ft === null || ft === undefined) return;
    ft.hidden = true; ft.classList.remove('show', 'warn');
  }
  function startTimer() {
    if (S.t0 === 0) {
      S.t0 = performance.now(); S.lastMark = S.t0;
    }
    S.clockOn = true;
    const elT = el('quiz-timer');
    if (elT !== null && elT !== undefined) elT.hidden = S.timerMode === 'off';
    if (S.timerMode !== 'off') { showTimerPanel(); startTick(); }
    saveSession();
  }
  function stopTimer() {
    stopTick();
    if (S.clockOn) S.totalTime = Math.round(elapsedMs() / 1000);
  }
  function timeUp() {
    if (S.submitted) return;
    toast('Time\u2019s up \u2014 grading your quiz now; blanks count as incorrect', 'warn');
    gradeNow();
  }
  /* The Timer segment: Off / Practice / Challenge, persisted as a preference
     so the quiz opens the way the student last liked it. */
  function applyTimerMode(mode, quiet) {
    S.timerMode = mode === 'up' || mode === 'down' ? mode : 'off';
    Prefs.set('quizTimerMode', S.timerMode);
    const mins = el('timer-mins');
    if (mins !== null && mins !== undefined) mins.hidden = S.timerMode !== 'down';
    if (S.submitted) return;
    if (S.timerMode === 'off') {
      stopTick();
      hideTimerPanel();
      const elT = el('quiz-timer');
      if (elT !== null && elT !== undefined) elT.hidden = true;
    } else if (S.t0) {
      const elT = el('quiz-timer');
      if (elT !== null && elT !== undefined) elT.hidden = false;
      showTimerPanel(); startTick();
    } else {
      hideTimerPanel();               // armed but calm: appears on the first answer
    }
    if (quiet !== true) {
      toast(S.timerMode === 'off' ? 'Timer off \u2014 no clock, no pressure'
        : S.timerMode === 'up' ? 'Practice timer: counts up from your first answer'
        : `Challenge timer: ${S.timerMins} minutes, then the quiz grades itself`);
    }
    saveSession();
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

  /* ---- flag for review ---------------------------------------------------
     Flags are light-touch review markers: they never change grading, they show
     on the card, in the navigator strip and as a count in the progress pill,
     and the "Flagged" filter collects them before submitting. */
  function toggleFlag(qid) {
    if (S.submitted) return;
    if (resumePending) dismissResume(false);
    if (S.flagged.has(qid)) S.flagged.delete(qid); else S.flagged.add(qid);
    const on = S.flagged.has(qid);
    const card = document.getElementById(`q-${qid}`);
    if (card !== null && card !== undefined) {
      card.classList.toggle('flagged', on);
      const btn = card.querySelector('.q-flag');
      if (btn !== null && btn !== undefined) {
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', String(on));
      }
    }
    renderMeta();                            // pill count + navigator chip
    if (S.filter === 'flagged') render();    // the view's membership changed
    saveSession();
  }

  /* ---- question navigator ------------------------------------------------
     One chip per question in the current order, always the FULL bank (filters
     are views): answered chips tint emerald, flagged chips grow an amber dot,
     and the card nearest the viewport centre wears a sky ring. */
  function renderNav() {
    const nav = el('qnav');
    if (nav === null || nav === undefined) return;
    const curId = (S.activeCard !== null && S.activeCard !== undefined) ? Number(S.activeCard.dataset.qid) : 0;
    nav.innerHTML = S.order.map((q, i) => {
      const cls = ['qnav-chip'];
      const done = S.answers.has(q.id);
      const flag = S.flagged.has(q.id);
      const cur = q.id === curId;
      if (done) cls.push('done');
      if (flag) cls.push('flag');
      if (cur) cls.push('cur');
      // state reads twice on purpose: tint AND glyph, so colour is never the
      // only channel (answered = emerald check, flagged = amber flag,
      // current = sky ring + sky tick under the number)
      const icons = `${done ? CHIP_CHECK : ''}${flag ? CHIP_FLAG : ''}${cur ? '<i class="chip-cur" aria-hidden="true"></i>' : ''}`;
      const state = `${done ? ', answered' : ''}${flag ? ', flagged' : ''}${cur ? ', current question' : ''}`;
      return `<button type="button" class="${cls.join(' ')}" data-goto="${q.id}" aria-label="Question ${i + 1}${state}">${i + 1}${icons}</button>`;
    }).join('');
    syncNavArrows(curId);
  }
  function syncNavArrows(curId) {
    const idx = S.order.findIndex(q => q.id === curId);
    const prev = el('qnav-prev');
    if (prev !== null && prev !== undefined) prev.disabled = idx <= 0;
    const next = el('qnav-next');
    if (next !== null && next !== undefined) next.disabled = idx >= S.order.length - 1;
    // the mobile dock mirrors the same arrows and reads the position aloud-free
    const dPrev = document.querySelector('.qnav-dock-prev');
    if (dPrev !== null && dPrev !== undefined) dPrev.disabled = idx <= 0;
    const dNext = document.querySelector('.qnav-dock-next');
    if (dNext !== null && dNext !== undefined) dNext.disabled = idx >= S.order.length - 1;
    const pos = el('qnav-dock-pos');
    if (pos !== null && pos !== undefined) {
      pos.textContent = idx < 0 ? `\u2014 / ${S.order.length}` : `${idx + 1} / ${S.order.length}`;
    }
  }
  function updateNavCur(qid) {
    const nav = el('qnav');
    if (nav === null || nav === undefined) return;
    nav.querySelectorAll('.qnav-chip.cur').forEach(c => {
      c.classList.remove('cur');
      const tick = c.querySelector('.chip-cur');
      if (tick !== null && tick !== undefined) tick.remove();
      c.setAttribute('aria-label', (c.getAttribute('aria-label') || '').replace(', current question', ''));
    });
    const chip = nav.querySelector(`[data-goto="${qid}"]`);
    if (chip !== null && chip !== undefined) {
      chip.classList.add('cur');
      if (chip.querySelector('.chip-cur') === null) chip.insertAdjacentHTML('beforeend', '<i class="chip-cur" aria-hidden="true"></i>');
      chip.setAttribute('aria-label', `${chip.getAttribute('aria-label') || ''}, current question`);
    }
    syncNavArrows(qid);
  }
  /* Set by gotoQuestion, read by the active-card observer (see
     initKeyboardAndFocus): while a programmatic jump is in flight, the
     observer must not fight it for the active-card targeting. */
  let lastJump = 0;
  function gotoQuestion(qid, whip) {
    const inView = visible().some(q => q.id === qid);
    if (inView === false) {                  // jumping beats filtering: show it
      S.filter = 'all'; syncFilterButtons(); render();
    }
    const target = document.getElementById(`q-${qid}`);
    if (target !== null && target !== undefined) {
      lastJump = performance.now();
      EMC.scrollToEl(target);
      /* phase 8: explicit user jumps (arrows, chips, keyboard) land with the
         reference's squash-whip; observer retargeting never animates. */
      S.activeCard = target;                 // state first, motion never gates it
      updateNavCur(qid);
      if (whip && window.EMC_MOTION) window.EMC_MOTION.whip(target);
    }
  }
  function navStep(delta) {
    const curId = (S.activeCard !== null && S.activeCard !== undefined) ? Number(S.activeCard.dataset.qid) : 0;
    let idx = S.order.findIndex(q => q.id === curId);
    if (idx < 0) idx = delta > 0 ? -1 : S.order.length;
    const target = S.order[Math.min(Math.max(idx + delta, 0), S.order.length - 1)];
    if (target !== null && target !== undefined) gotoQuestion(target.id, true);
  }

  /* ---- autosave / resume --------------------------------------------------
     Every answer, flag and preference writes one small session document (400 ms
     throttle) through the same safe store as the rest of the site. A refresh
     OFFERS to resume - never a silent restore - and submitting, retaking or
     choosing "Start fresh" clears it. */
  const SESSION_KEY = 'emc.quiz.session.v1';
  /* Bank fingerprint (§3.5): a saved session may only resume against the
     exact bank it was started on. Numeric ids COLLIDE across curations
     (old bank 1..35 vs current 1..24 mean different questions), so neither
     the ids nor the count alone can detect staleness — the fingerprint
     mixes every id with its question length. */
  function bankFingerprint() {
    let h = BANK.length | 0;
    for (const q of BANK) { h = (h * 31 + q.id) | 0; h = (h * 31 + String(q.q).length) | 0; }
    return 'b' + h;
  }
  let staleSessionCleared = false;
  function writeSession() {
    if (S.submitted) return;
    // While the resume banner is up the stored session is the user's PENDING
    // choice - a background save of the empty boot state must never wipe it
    // (issue #3 item 4).
    if (resumePending) return;
    if (S.answers.size === 0 && S.flagged.size === 0) { store.remove(SESSION_KEY); return; }
    try {
      store.set(SESSION_KEY, JSON.stringify({
        v: 3,
        bank: bankFingerprint(),
        answers: [...S.answers],
        marked: [...S.marked],
        flagged: [...S.flagged],
        order: S.order.map(q => q.id),
        optOrder: [...S.optOrder],
        instant: S.instant,
        filter: S.filter,
        baseMs: elapsedMs(),          // ACTIVE time only - pauses with the tab
        clockOn: S.clockOn,
        timerMode: S.timerMode,
        timerMins: S.timerMins
      }));
    } catch (err) { /* storage full or locked - the quiz itself still works */ }
  }
  function saveSession() {
    if (S.submitted || resumePending) return;
    if (saveHandle) return;
    saveHandle = setTimeout(() => { saveHandle = 0; writeSession(); }, 400);
  }
  function flushSession() {
    if (saveHandle) { clearTimeout(saveHandle); saveHandle = 0; }
    writeSession();
  }
  function readSession() {
    try {
      const raw = store.get(SESSION_KEY);
      if (raw === null || raw === undefined) return null;
      const d = JSON.parse(raw);
      if (d === null || typeof d !== 'object') return null;
      if (d.v !== 3 || d.bank !== bankFingerprint()) {
        /* Explicit stale-bank handling: drop it, keep the quiz honest, and
           tell the reader why their resume offer disappeared. */
        store.remove(SESSION_KEY);
        staleSessionCleared = true;
        return null;
      }
      if (Array.isArray(d.answers) === false || d.answers.length === 0) return null;
      const ids = new Set(BANK.map(q => q.id));
      const answers = new Map(d.answers
        .filter(a => Array.isArray(a) && ids.has(a[0]))
        .map(a => [Number(a[0]), Number(a[1])]));
      if (answers.size === 0) return null;
      return { d, answers };
    } catch (err) { return null; }          // corrupt JSON is simply ignored
  }
  function dismissResume(clearStorage) {
    resumePending = false;
    const wrap = el('resume-wrap');
    if (wrap !== null && wrap !== undefined) wrap.hidden = true;
    if (clearStorage === true) store.remove(SESSION_KEY);
    syncQuizChrome();
  }
  function syncSegQuiet(group, value) {
    if (group === null || group === undefined) return;
    group.querySelectorAll('.seg-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
  }
  function syncMinsChips() {
    document.querySelectorAll('#timer-mins [data-mins]').forEach(x => {
      const on = Number(x.dataset.mins) === S.timerMins;
      x.classList.toggle('active', on);
      x.setAttribute('aria-pressed', String(on));
    });
  }
  function applySession(d, answers) {
    S.answers = answers;
    S.marked = new Map(Array.isArray(d.marked) ? d.marked.filter(m => Array.isArray(m)).map(m => [Number(m[0]), m[1] === true]) : []);
    S.flagged = new Set(Array.isArray(d.flagged) ? d.flagged.filter(x => typeof x === 'number') : []);
    if (Array.isArray(d.order)) {
      const byId = new Map(BANK.map(q => [q.id, q]));
      const order = d.order.map(id => byId.get(id)).filter(q => q !== undefined);
      if (order.length === BANK.length) S.order = order;
    }
    // the saved display permutation keeps A/B/C/D labels matching the answers
    if (Array.isArray(d.optOrder)) {
      const ids = new Set(BANK.map(q => q.id));
      const restored = d.optOrder
        .filter(pair => Array.isArray(pair) && ids.has(pair[0]) && Array.isArray(pair[1]) && pair[1].length === 4)
        .map(pair => [Number(pair[0]), pair[1].map(Number)]);
      if (restored.length === BANK.length) S.optOrder = new Map(restored);
    }
    S.instant = d.instant === true;
    syncSegQuiet(el('quiz-mode'), S.instant ? 'instant' : 'exam');
    if (typeof d.filter === 'string') S.filter = d.filter;
    if ([10, 15, 20].indexOf(Number(d.timerMins)) >= 0) S.timerMins = Number(d.timerMins);
    syncMinsChips();
    syncSegQuiet(el('quiz-timer-mode'), d.timerMode === 'up' || d.timerMode === 'down' ? d.timerMode : 'off');
    applyTimerMode(d.timerMode, true);
    if (d.clockOn === true && Number(d.baseMs) > 0) {
      // resume the ACTIVE-time clock where it left off; the time the page was
      // closed simply never happened (a stale challenge must not auto-grade)
      S.baseMs = Number(d.baseMs);
      S.clockOn = true;
      S.t0 = performance.now();
      S.lastMark = S.t0;
      if (S.timerMode !== 'off') {
        const elT = el('quiz-timer');
        if (elT !== null && elT !== undefined) elT.hidden = false;
        showTimerPanel(); startTick();
      }
    }
    syncFilterButtons();
    render();
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
      if (icPlus) icPlus.hidden = min === false;   // explicit: a bang-negated identifier compiles to a phantom !utility
      requestAnimationFrame(ftPlace);        // re-clamp for the new size
    });
    const resetBtn = el('floatTimerReset');
    if (resetBtn) resetBtn.addEventListener('click', () => { ftPos = null; ftPlace(); });
    window.addEventListener('resize', () => { ftDock(); ftPlace(); });   // stay inside a changed viewport
  }
  function computeBestStreak() {
    let run = 0, best = 0;
    for (const q of S.order) {
      if (S.marked.get(q.id) === true) { run++; best = Math.max(best, run); } else run = 0;
    }
    return best;
  }
  function initKeyboardAndFocus() {
    /* Programmatic jumps (nav chips, prev/next, the 'n' shortcut) own the
       active-card targeting: their smooth scroll crosses IO thresholds on the
       way and the observer used to overwrite the jump target mid-flight, so
       the number keys answered the wrong card (a11y-verify A8). IO stays in
       charge for free user scrolling outside the jump window. */
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(entries => {
        if (performance.now() - lastJump < 900) return;
        // several cards can cross a threshold in one batch (fast scrolls, chip
        // jumps): keep the DEEPEST intersection so the ring settles on the card
        // actually centred in the viewport, not the last one to notify
        let best = null;
        for (const en of entries) {
          if (en.isIntersecting && en.intersectionRatio >= 0.4 &&
              (best === null || en.intersectionRatio > best.intersectionRatio)) best = en;
        }
        if (best !== null) {
          S.activeCard = best.target;
          updateNavCur(Number(best.target.dataset.qid));
        }
      }, { threshold: [0.4, 0.7] });
      const watch = () => host.querySelectorAll('.q-card').forEach(c => io.observe(c));
      watch();
      new MutationObserver(watch).observe(host, { childList: true });
    }
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      // A is in the exclusion list on purpose: when focus sits on a link (the
      // skip link, nav, pager …), Enter belongs to the link. Hijacking it here
      // would both break keyboard navigation and fire an unintended submit.
      if (t && /INPUT|TEXTAREA|SELECT|SUMMARY|BUTTON|A/.test(t.tagName)) return;
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
        /* gotoQuestion re-targets the active card EXPLICITLY: the observer
           fires on threshold crossings only, so jumping to a card that is
           already on screen would leave the number keys answering the
           previous card (found by a11y-verify A8). */
        if (blank) gotoQuestion(blank.id);
        e.preventDefault();
      } else if (key === 'f' && !S.submitted) {
        toggleFlag(Number(card.dataset.qid));   // flag the question on screen
        e.preventDefault();
      }
    });
  }

  /* ---- answering ------------------------------------------------------- */
  host.addEventListener('click', e => {
    const hintBtn = e.target.closest('.q-hint-btn');
    if (hintBtn !== null) {
      // hints are optional scaffolding: reveal in place, never block answering
      const panel = document.getElementById('hint-' + hintBtn.dataset.hint);
      if (panel !== null) {
        // explicit branches: a negated identifier in this file would be
        // scanned by Tailwind into a phantom important-variant utility
        if (panel.hidden) { panel.hidden = false; hintBtn.setAttribute('aria-expanded', 'true'); }
        else { panel.hidden = true; hintBtn.setAttribute('aria-expanded', 'false'); }
      }
      return;
    }
    const flagBtn = e.target.closest('.q-flag');
    if (flagBtn !== null) { toggleFlag(Number(flagBtn.dataset.flag)); return; }
    const btn = e.target.closest('.opt');
    if (btn === null || btn.disabled) return;
    const card = btn.closest('.q-card');
    const qid = Number(card.dataset.qid);
    const q = BANK.find(x => x.id === qid);
    if (!q || S.marked.has(qid)) return;

    if (resumePending) dismissResume(false);   // answering IS choosing "fresh"
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
      fb.innerHTML = `Answer recorded: <b>${displayKey(qid, S.answers.get(qid))}</b>. It will be marked when you submit the quiz.`;
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
      const flagNote = S.flagged.size ? ` \u00B7 ${S.flagged.size} flagged for review` : '';
      toast(`${blanks.length} question${blanks.length === 1 ? ' is' : 's are'} still blank (across all topics)${flagNote} \u2014 click Submit again to grade them as incorrect`, 'warn');
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

    // Nothing blank: ask once, gently, before answers lock in. The buttons
    // flip to "Confirm submission" and calm back down after five seconds.
    if (blanks.length === 0 && !S.confirmAsk) {
      S.confirmAsk = true;
      renderMeta();
      toast(S.flagged.size
        ? `Submit for grading? Your ${S.flagged.size} flagged question${S.flagged.size === 1 ? '' : 's'} grade as they are \u2014 click Submit again to confirm`
        : 'Submit for grading? Click Submit again to confirm \u2014 answers lock in');
      clearTimeout(confirmHandle);
      confirmHandle = setTimeout(() => {
        if (!S.submitted) { S.confirmAsk = false; renderMeta(); }
      }, 5000);
      return;
    }

    gradeNow();
  }

  function gradeNow() {
    clearTimeout(confirmHandle);
    S.confirmAsk = false;
    S.submitted = true;
    stopTimer();
    store.remove(SESSION_KEY);        // the attempt is over: nothing to resume
    dismissResume(false);
    S.filter = 'all';
    syncFilterButtons();
    S.order.forEach(q => { S.marked.set(q.id, S.answers.has(q.id) && S.answers.get(q.id) === q.answer); });
    if (!S.instant) S.bestStreak = computeBestStreak();
    render();

    // the challenge timer's amber state must not survive into the results
    const ft = el('floatTimer');
    if (ft !== null && ft !== undefined) ft.classList.remove('warn');

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

    // per-chapter breakdown (registry order) + the weak-area summary line
    const topics = EMC_REGISTRY.chapters.map(c => c.id);
    const topicStats = topics.map(t => {
      const qs = scored.filter(q => q.topic === t);
      if (!qs.length) return null;
      const okN = qs.filter(q => S.marked.get(q.id) === true).length;
      const ch = EMC_REGISTRY.chapter(t);
      return { id: t, n: qs.length, ok: okN, pct: Math.round((okN / qs.length) * 100),
               label: ch ? ch.title : qs[0].label, path: ch ? ch.path : 'index.html' };
    }).filter(s => s !== null);
    const rows = topicStats.map(s => `<div class="grid gap-2 items-center" style="grid-template-columns:minmax(120px,1fr) 2fr auto">
                <span class="small muted">${s.label}</span>
                <span class="progress-track"><span class="progress-fill" style="width:${s.pct}%"></span></span>
                <span class="mono small">${s.ok}/${s.n}</span>
              </div>`).join('');
    const weak = topicStats.filter(s => s.pct < 70).sort((a, b) => a.pct - b.pct);
    const weakRow = weak.length === 0
      ? `<p class="small muted" style="margin:.75rem 0 0">${pct === 100
          ? 'Every chapter at 100% \u2014 flawless!'
          : 'No weak spots this time \u2014 every chapter is at 70% or above.'}</p>`
      : `<p class="small muted" style="margin:.75rem 0 0">Weakest ${weak.length === 1 ? 'area' : 'areas'}:
          ${weak.map(s => `${s.label} (${s.ok}/${s.n})`).join(' \u00B7 ')} \u2014
          <a class="link" href="${weak[0].path}">revisit ${weak[0].label}</a></p>`;

    // time tags only appear when the student actually opted into a timer
    const usedTimer = S.timerMode !== 'off';
    const timeTags = usedTimer
      ? `<span class="tag">${S.timerMode === 'down' ? 'challenge time' : 'time'} ${fmtTime(S.totalTime)}</span>` : '';
    const perQTag = usedTimer
      ? `<span class="tag tag-cyan">${total ? Math.round(S.totalTime / total) : 0}s per question</span>` : '';
    const passed = pct >= 70;
    const cheer = passed ? `<div class="score-cheer">${CHEER}${FACE_HAPPY}</div>` : '';
    const confetti = passed ? confettiHTML() : '';

    box.hidden = false;
    box.classList.remove('score-enter');
    void box.offsetWidth;               // restart the entrance on every retake
    box.classList.add('score-enter');
    // The home dashboard promises that a pass (>= 70%) ticks both chapters.
    // Say so out loud at the moment it happens instead of letting it be silent.
    const passNote = pct >= 70
      ? `<p class="tiny faint" style="margin:.9rem 0 0">Scoring 70% or more also marks both chapters
           as studied on your dashboard \u2014 a pass means the whole course has been covered.
           Un-tick any chapter with the button at the end of its page if you would rather keep
           working on it.</p>`
      : '';

    box.innerHTML = `
      ${confetti}
      <div class="score-card">
        <div>
          <div class="grade ${band.cls}">${pct}%</div>
          <div class="small muted mono">${right} / ${total} correct</div>
        </div>
        ${cheer}
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
          <span class="tag tag-cyan">Score by chapter</span>
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
        ${timeTags}
        <span class="tag tag-amber">best streak \u00D7${S.bestStreak}</span>
        ${perQTag}
      </div>
      ${weakRow}
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
      S.answers.clear(); S.marked.clear(); S.flagged.clear();
      S.submitted = false; S.blankWarned = false; S.confirmAsk = false;
      clearTimeout(confirmHandle);
      S.t0 = 0; S.lastMark = 0; S.times.clear(); S.streak = 0; S.bestStreak = 0; S.totalTime = 0;
      S.baseMs = 0; S.clockOn = false;
      buildOptOrder();               // a fresh attempt gets a fresh shuffle
      store.remove(SESSION_KEY);
      dismissResume(false);
      clearInterval(timerHandle); timerHandle = 0;
      const elT = el('quiz-timer'); if (elT) { elT.hidden = true; elT.textContent = '0:00'; }
      const ft = el('floatTimer');
      if (ft) { ft.hidden = true; ft.classList.remove('show', 'min', 'dragging', 'warn'); ftPos = null; }
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
      if (!t) return null;
      if (TOPIC_IDS.indexOf(t) >= 0) return t;
      /* Legacy deep links (?topic=charge, ?topic=current, ?topic=magind …)
         resolve through the registry alias map onto the owning chapter. */
      const ch = EMC_REGISTRY.resolve ? EMC_REGISTRY.resolve(t) : null;
      return (ch && TOPIC_IDS.indexOf(ch.id) >= 0) ? ch.id : null;
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
      saveSession();
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
    saveSession();
    toast('Questions shuffled');
  });

  /* Options panel: manual open/close is a deliberate choice - once touched,
     the auto-collapse on "quiz started" stops overriding the student. */
  const optsToggle = el('qopts-toggle');
  if (optsToggle) optsToggle.addEventListener('click', () => {
    optsTouched = true;
    setOptsOpen(optsToggle.getAttribute('aria-expanded') !== 'true');
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
    saveSession();
    toast(S.instant ? 'Instant mode: answers are marked as you go' : 'Exam mode: nothing is marked until you submit');
  });

  /* ---- optional timer controls + question navigator wiring --------------- */
  const timerGroup = el('quiz-timer-mode');
  if (timerGroup) EMC.bindSegment(timerGroup, v => { applyTimerMode(v, false); syncQuizChrome(); });

  document.querySelectorAll('#timer-mins [data-mins]').forEach(b => {
    b.addEventListener('click', () => {
      S.timerMins = Number(b.dataset.mins);
      Prefs.set('quizTimerMins', S.timerMins);
      syncMinsChips();
      const ft = el('floatTimer');
      if (S.timerMode === 'down' && S.t0 && !S.submitted) {
        showTimerPanel();               // refresh the hint + remaining readout
        startTick();
      } else if (ft !== null && ft !== undefined && ft.hidden === false) {
        showTimerPanel();
      }
      saveSession();
    });
  });

  const navEl = el('qnav');
  if (navEl !== null && navEl !== undefined) {
    navEl.addEventListener('click', e => {
      const chip = e.target.closest('.qnav-chip');
      if (chip === null) return;
      gotoQuestion(Number(chip.dataset.goto), true);
    });
  }
  const prevBtn = el('qnav-prev');
  if (prevBtn !== null && prevBtn !== undefined) prevBtn.addEventListener('click', () => navStep(-1));
  const nextBtn = el('qnav-next');
  if (nextBtn !== null && nextBtn !== undefined) nextBtn.addEventListener('click', () => navStep(1));
  // mobile dock mirrors the same two arrows (one workflow, two placements)
  const dockPrev = document.querySelector('.qnav-dock-prev');
  if (dockPrev !== null && dockPrev !== undefined) dockPrev.addEventListener('click', () => navStep(-1));
  const dockNext = document.querySelector('.qnav-dock-next');
  if (dockNext !== null && dockNext !== undefined) dockNext.addEventListener('click', () => navStep(1));

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
  buildOptOrder();                    // shuffle this attempt's A-D display order
  // optional timer: restore the saved preference (calm default: Off)
  const savedMins = Number(Prefs.get('quizTimerMins', 10));
  S.timerMins = [10, 15, 20].indexOf(savedMins) >= 0 ? savedMins : 10;
  syncMinsChips();
  const savedMode = Prefs.get('quizTimerMode', 'off');
  syncSegQuiet(timerGroup, savedMode === 'up' || savedMode === 'down' ? savedMode : 'off');
  applyTimerMode(savedMode, true);

  const deepTopic = topicFromURL();
  if (deepTopic) {
    S.filter = deepTopic;
    toast(`Filtered to ${TOPIC_NAMES[deepTopic]} \u2014 your score still covers all ${BANK.length} questions`);
  }

  // a saved in-progress attempt OFFERS to resume - never a silent restore
  const saved = readSession();
  if (saved === null && staleSessionCleared) {
    toast('Saved session from an older question bank was cleared \u2014 starting fresh');
  }
  if (saved !== null) {
    const wrap = el('resume-wrap');
    if (wrap !== null && wrap !== undefined) {
      const sum = el('resume-summary');
      if (sum !== null && sum !== undefined) {
        const nA = saved.answers.size;
        const nF = Array.isArray(saved.d.flagged) ? saved.d.flagged.length : 0;
        sum.textContent = `You had ${nA} of ${BANK.length} answered${nF ? ` and ${nF} flagged` : ''} \u2014 pick up where you left off?`;
      }
      wrap.hidden = false;
      resumePending = true;
      const yes = el('resume-yes');
      if (yes !== null && yes !== undefined) yes.addEventListener('click', () => {
        applySession(saved.d, saved.answers);
        if (deepTopic) { S.filter = deepTopic; syncFilterButtons(); render(); }
        dismissResume(false);
        toast('Welcome back \u2014 quiz resumed');
      });
      const no = el('resume-no');
      if (no !== null && no !== undefined) no.addEventListener('click', () => {
        dismissResume(true);
        toast('Fresh quiz \u2014 the saved session was cleared');
      });
    }
  }

  syncFilterButtons();
  render();
  initKeyboardAndFocus();
})();
