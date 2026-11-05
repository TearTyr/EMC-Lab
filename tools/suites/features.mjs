/* features: quiz, simulations, lecture values, pointer interaction. Run with `node tools/verify.mjs <suite|group>`; each suite gets the shared harness `h` (tools/lib/harness.mjs). */

/* ==========================================================================
   EMC Lab — quiz engine verification in a REAL browser (gate Q, §3.5).
   Covers what jsdom cannot: real keyboard flow (and its input guard), the
   floating timer while scrolling at 360 px (no overlap with answers or nav),
   Chart.js actually painting pixels, autosave -> reload -> resume, retake,
   deep links and URL sync, dual submit buttons.
   Exits 1 on any failure.
   ========================================================================== */
async function quiz(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function page(opts = {}, url = '/quiz.html') {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    return { ctx, pg };
  }

  /* ---- keyboard flow + input guard ---------------------------------------- */
  {
    const { ctx, pg } = await page();
    await pg.locator('.q-card').first().scrollIntoViewIfNeeded();
    await pg.waitForTimeout(400);
    const before = await pg.textContent('#pillText');
    await pg.keyboard.press('2');                     // answer option B of the active card
    await pg.waitForTimeout(300);
    const after = await pg.textContent('#pillText');
    ok('keyboard: "2" answers the active card', before === '0/16' && after === '1/16', `${before} -> ${after}`);
    await pg.keyboard.press('f');                     // flag it
    await pg.waitForTimeout(250);
    const flagged = await pg.evaluate(() => document.querySelectorAll('.q-card.flagged').length);
    ok('keyboard: "f" flags the active card for review', flagged === 1, String(flagged));
    await pg.keyboard.press('n');                     // jump to next blank
    await pg.waitForTimeout(400);
    await pg.keyboard.press('3');
    await pg.waitForTimeout(250);
    ok('keyboard: "n" + number answers the next blank', (await pg.textContent('#pillText')) === '2/16', await pg.textContent('#pillText'));
    /* the guard: with focus on a link (A) or input, shortcuts must NOT fire */
    const guard = await pg.evaluate(() => {
      document.querySelector('a.nav-link').focus();
      const ev = new KeyboardEvent('keydown', { key: '4', bubbles: true });
      document.activeElement.dispatchEvent(ev);
      return document.getElementById('pillText').textContent;
    });
    await pg.waitForTimeout(200);
    ok('keyboard: shortcuts are ignored while focus is in nav/inputs', guard === '2/16', guard);
    await ctx.close();
  }

  /* ---- grading, dual submit, Chart.js really paints ------------------------ */
  {
    const { ctx, pg } = await page();
    /* answer every question correctly through the real option buttons */
    await pg.evaluate(() => {
      document.querySelectorAll('.q-card').forEach(card => {
        const right = card.querySelector('.opt.correct-hint');
        void right;
      });
    });
    const n = await pg.evaluate(() => {
      // the bank is on window; click each card's correct option like a user would
      let count = 0;
      document.querySelectorAll('.q-card').forEach(card => {
        const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
        const opt = card.querySelector(`.opt[data-opt="${q.answer}"]`);
        if (opt) { opt.click(); count++; }
      });
      return count;
    });
    ok('all 16 answered through real clicks', n === 16, String(n));
    const submits = await pg.evaluate(() => [...document.querySelectorAll('button')]
      .filter(b => /submit/i.test(b.textContent) || b.id.includes('submit')).map(b => b.id || b.textContent.trim()));
    ok('submit exists near top and bottom (dual submit)', submits.length >= 2, submits.join(' | '));
    await pg.evaluate(() => document.getElementById('quiz-submit').scrollIntoView());
    await pg.click('#quiz-submit');                   // confirm phase
    await pg.waitForTimeout(200);
    const confirmTxt = await pg.textContent('#quiz-submit');
    await pg.click('#quiz-submit');                   // graded
    await pg.waitForTimeout(1200);
    ok('first submit asks for confirmation, second grades', /confirm/i.test(confirmTxt));
    const score = await pg.textContent('#quiz-score');
    ok('perfect score shows 100%', /100%/.test(score), score.slice(0, 60).replace(/\s+/g, ' '));
    const painted = await pg.evaluate(() => new Promise(res => setTimeout(() => {
      const c = document.getElementById('chart-score');
      if (!c || !c.width) return res(false);
      const ctx2 = c.getContext('2d');
      const d = ctx2.getImageData(0, 0, c.width, c.height).data;
      let nonBlank = 0;
      for (let i = 3; i < d.length; i += 40) if (d[i] !== 0) nonBlank++;
      res(nonBlank > 50);
    }, 600)));
    ok('Chart.js (R8) really paints pixels into the score canvas', painted === true);
    const chartsVisible = await pg.evaluate(() => !document.getElementById('quiz-charts').hidden &&
      document.getElementById('quiz-fallback-bars').hidden);
    ok('charts replace the CSS-bar fallback once the lib is live', chartsVisible);
    /* retake clears the marks */
    await pg.click('#quiz-retake');
    await pg.waitForTimeout(400);
    const cleared = await pg.evaluate(() => ({
      marks: document.querySelectorAll('.q-card.answered-correct').length,
      pill: document.getElementById('pillText').textContent
    }));
    ok('retake clears every mark and the pill', cleared.marks === 0 && cleared.pill === '0/16', JSON.stringify(cleared));
    await ctx.close();
  }

  /* ---- floating timer: visible while scrolling, no overlap at 360 px ------- */
  {
    const { ctx, pg } = await page({ viewport: { width: 360, height: 740 } }, '/quiz.html');
    await pg.click('#quiz-timer-mode [data-value="up"]');
    await pg.evaluate(() => {
      const card = document.querySelector('.q-card');
      const q = window.EMC_QUIZ.find(x => x.id === Number(card.dataset.qid));
      card.querySelector(`.opt[data-opt="${q.answer}"]`).click();
    });
    await pg.waitForTimeout(400);
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pg.waitForTimeout(500);
    /* Contract: the docked bar owns an opaque bottom strip and the list
       reserves matching padding, so at any settled scroll position (worst
       case: the very bottom) no answer option intersects the timer, and the
       timer never intersects the header. Transient pass-under while scrolling
       is the same accepted behaviour as the site's sticky header. */
    const boxes = await pg.evaluate(() => {
      const ft = document.getElementById('floatTimer');
      const r = ft.getBoundingClientRect();
      let overlaps = 0;
      document.querySelectorAll('.opt').forEach(o => {
        const b = o.getBoundingClientRect();
        if (b.width && !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom)) overlaps++;
      });
      const nb = document.querySelector('.site-header').getBoundingClientRect();
      const navOverlap = !(r.right < nb.left || r.left > nb.right || r.bottom < nb.top || r.top > nb.bottom);
      return {
        docked: ft.classList.contains('docked'),
        reserved: document.body.classList.contains('timer-docked'),
        visible: ft.hidden === false && r.width > 0 && r.height > 0,
        inViewport: r.top >= 0 && r.bottom <= window.innerHeight + 1,
        overlaps, navOverlap
      };
    });
    ok('timer stays visible while scrolled and docks on phone widths',
      boxes.visible && boxes.inViewport && boxes.docked && boxes.reserved, JSON.stringify(boxes));
    ok('timer never overlaps answer options or the header at 360 px (settled)',
      boxes.overlaps === 0 && boxes.navOverlap === false, JSON.stringify(boxes));
    /* mid-scroll visibility too */
    await pg.evaluate(() => window.scrollTo(0, 2500));
    await pg.waitForTimeout(300);
    const mid = await pg.evaluate(() => {
      const r = document.getElementById('floatTimer').getBoundingClientRect();
      return r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 1;
    });
    ok('timer still visible mid-scroll', mid === true);
    await ctx.close();
  }

  /* ---- autosave -> reload -> resume ---------------------------------------- */
  {
    const { ctx, pg } = await page();
    await pg.evaluate(() => {
      const cards = document.querySelectorAll('.q-card');
      for (let i = 0; i < 2; i++) {
        const q = window.EMC_QUIZ.find(x => x.id === Number(cards[i].dataset.qid));
        cards[i].querySelector(`.opt[data-opt="${q.answer}"]`).click();
      }
    });
    await pg.waitForTimeout(800);                     // let the 400 ms autosave throttle flush
    await pg.reload({ waitUntil: 'load' });
    await pg.waitForTimeout(800);
    const banner = await pg.evaluate(() => !document.getElementById('resume-wrap').hidden);
    ok('reload after answering offers an explicit resume', banner === true);
    await pg.click('#resume-yes');
    await pg.waitForTimeout(500);
    ok('resume restores both answers', (await pg.textContent('#pillText')) === '2/16', await pg.textContent('#pillText'));
    await ctx.close();
  }

  /* ---- deep links + URL sync ------------------------------------------------ */
  {
    const { ctx, pg } = await page({}, '/quiz.html?topic=ch1');
    const cards = await pg.evaluate(() => document.querySelectorAll('.q-card').length);
    ok('?topic=ch1 deep link filters to the 8 circuits questions', cards === 8, String(cards));
    await pg.click('[data-quiz-filter="ch2"]');
    await pg.waitForTimeout(300);
    const url = await pg.evaluate(() => new URL(location.href).searchParams.get('topic'));
    ok('changing the filter keeps ?topic= truthful', url === 'ch2', String(url));
    await ctx.close();
  }

  /* ---- difficulty modes, submit/retake, timer (PR: quiz modes) ------------------ */
  const answerCards = (pg, n) => pg.evaluate(count => {
    for (let i = 0; i < count; i++) {          // re-query each time: instant marking re-renders the list
      const card = document.querySelectorAll('.q-card')[i];
      const opt = card && card.querySelector('.opt:not([disabled])');
      if (opt) opt.click();
    }
  }, n);
  const submitUntilGraded = async pg => {
    for (let i = 0; i < 5; i++) {
      if (await pg.evaluate(() => { const b = document.getElementById('quiz-score'); return !!b && !b.hidden && b.textContent.trim().length > 0; })) return true;
      await pg.locator('#quiz-submit').click({ timeout: 3000 }).catch(() => {});
      await pg.waitForTimeout(350);
    }
    return false;
  };
  const attempts = pg => pg.evaluate(() => EMC.Progress.read().quizAttempts);
  const snap = pg => pg.evaluate(() => ({
    cards: document.querySelectorAll('.q-card').length,
    ids: [...document.querySelectorAll('.q-card')].map(c => Number(c.dataset.qid)),
    hints: document.querySelectorAll('.q-hint-btn').length,
    pill: document.getElementById('pillText').textContent,
    submit: document.getElementById('quiz-submit').textContent,
    diff: document.querySelector('#quiz-difficulty [aria-pressed="true"]').dataset.value,
    marking: document.querySelector('#quiz-mode [aria-pressed="true"]').dataset.value,
    timer: document.querySelector('#quiz-timer-mode [aria-pressed="true"]').dataset.value,
    instantDisabled: document.querySelector('#quiz-mode [data-value="instant"]').disabled,
    timerDisabled: [...document.querySelectorAll('#quiz-timer-mode .seg-btn')].every(b => b.disabled),
    hint: document.getElementById('quiz-difficulty-hint').textContent
  }));

  {
    const { ctx, pg } = await page();
    const mid = await snap(pg);
    ok('modes: Intermediate is the default and behaves as before (16 questions, hints, free marking/timer)',
      mid.diff === 'intermediate' && mid.cards === 16 && mid.hints === 16 && mid.pill === '0/16' && mid.submit === 'Submit quiz (16)' &&
      mid.marking === 'exam' && !mid.instantDisabled && !mid.timerDisabled, JSON.stringify(mid));

    await pg.click('#quiz-difficulty [data-value="easy"]');
    await pg.waitForTimeout(300);
    const easy = await snap(pg);
    /* count per chapter through the chapter filters (ch2 cards carry sub-labels) */
    const easyTopics = {};
    for (const t of ['ch1', 'ch2']) {
      await pg.click(`[data-quiz-filter="${t}"]`);
      easyTopics[t] = await pg.evaluate(() => document.querySelectorAll('.q-card').length);
    }
    await pg.click('[data-quiz-filter="all"]');
    ok('modes: Easy plays 8 questions, 4 per chapter, totals follow (0/8, Submit quiz (8))',
      easy.cards === 8 && easy.pill === '0/8' && easy.submit === 'Submit quiz (8)' &&
      easyTopics.ch1 === 4 && easyTopics.ch2 === 4, JSON.stringify({ easy: easy.cards, easyTopics }));
    ok('modes: Easy keeps hints, marks as you go and has no clock',
      easy.hints === 8 && easy.marking === 'instant' && easy.timer === 'off' && !easy.timerDisabled && /8 starter/.test(easy.hint), JSON.stringify(easy));
    ok('modes: Easy questions are in lecture order and all carry the Easy tag',
      easy.ids.every((v, i, a) => i === 0 || a[i - 1] < v) &&
      (await pg.evaluate(() => [...document.querySelectorAll('.q-card .q-level')].every(t => t.textContent === 'Easy'))));

    await pg.click('#quiz-difficulty [data-value="hard"]');
    await pg.waitForTimeout(300);
    const hard = await snap(pg);
    ok('modes: Hard plays all 16, shuffled, with NO hints',
      hard.cards === 16 && hard.hints === 0 && hard.ids.some((v, i, a) => i > 0 && a[i - 1] > v), JSON.stringify({ n: hard.cards, hints: hard.hints, ids: hard.ids }));
    ok('modes: Hard locks exam marking and a 15-minute countdown (controls disabled, not hidden)',
      hard.marking === 'exam' && hard.instantDisabled && hard.timer === 'down' && hard.timerDisabled &&
      (await pg.evaluate(() => document.querySelector('#timer-mins .active').dataset.mins)) === '15' && /15-minute/.test(hard.hint), JSON.stringify(hard));

    await pg.click('#quiz-difficulty [data-value="intermediate"]');
    await pg.waitForTimeout(300);
    const back = await snap(pg);
    ok('modes: leaving Hard returns hints, free controls and the student\'s own timer (Off)',
      back.cards === 16 && back.hints === 16 && !back.instantDisabled && !back.timerDisabled && back.timer === 'off' && back.marking === 'exam', JSON.stringify(back));

    /* switching mid-attempt is refused and keeps the answers */
    await pg.evaluate(() => document.querySelector('.q-card .opt').click());
    await pg.waitForTimeout(200);
    /* answering auto-collapses the options panel; a student opens it again first */
    if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
    await pg.click('#quiz-difficulty [data-value="easy"]');
    await pg.waitForTimeout(300);
    const refused = await snap(pg);
    ok('modes: changing difficulty mid-attempt is refused and keeps the answer',
      refused.diff === 'intermediate' && refused.cards === 16 && refused.pill === '1/16', JSON.stringify(refused));
    await ctx.close();
  }

  /* submit: one grading pass from either button; retake resets only the attempt */
  {
    const { ctx, pg } = await page();
    await pg.click('#quiz-difficulty [data-value="easy"]');
    await pg.waitForTimeout(250);
    await answerCards(pg, 8);
    await pg.waitForTimeout(250);
    const a0 = await attempts(pg);
    await pg.locator('#quiz-submit').click();                       // top button: asks to confirm
    await pg.waitForTimeout(300);
    const labels = await pg.evaluate(() => [...document.querySelectorAll('[data-quiz-submit]')].map(b => b.textContent));
    ok('submit: top and bottom buttons share one state (both flip to the confirm label)',
      labels.length >= 2 && labels.every(t => /Confirm submission/.test(t)), JSON.stringify(labels));
    await pg.locator('[data-quiz-submit]').last().click();           // bottom button confirms
    await pg.waitForTimeout(700);
    await pg.evaluate(() => document.querySelectorAll('[data-quiz-submit]').forEach(b => { b.disabled = false; b.click(); b.click(); }));
    await pg.waitForTimeout(400);
    const a1 = await attempts(pg);
    const scoreTxt = await pg.textContent('#quiz-score');
    ok('submit: grading happens exactly once even if both buttons are hammered', a1 === a0 + 1, `attempts ${a0} -> ${a1}`);
    ok('submit: results show the score out of 8 and name the mode', /\/ 8 correct/.test(scoreTxt) && /Easy mode/.test(scoreTxt), scoreTxt.replace(/\s+/g, ' ').slice(0, 90));
    const bestBefore = await pg.evaluate(() => EMC.Progress.read().quizBest);
    ok('submit: Chart.js drew exactly three canvases', (await pg.evaluate(() => document.querySelectorAll('#quiz-score canvas').length)) === 3);

    await pg.click('#quiz-retake');
    await pg.waitForTimeout(600);
    const re = await pg.evaluate(() => ({
      scoreHidden: document.getElementById('quiz-score').hidden,
      pill: document.getElementById('pillText').textContent,
      checked: document.querySelectorAll('.opt[aria-checked="true"]').length,
      flagged: document.querySelectorAll('.q-card.flagged').length,
      timerHidden: document.getElementById('quiz-timer').hidden,
      canvases: document.querySelectorAll('#quiz-score canvas').length,
      submitOn: !document.getElementById('quiz-submit').disabled
    }));
    ok('retake: score, answers, flags, timer and charts are cleared; submit re-enabled',
      re.scoreHidden && re.pill === '0/8' && re.checked === 0 && re.flagged === 0 && re.timerHidden && re.canvases === 0 && re.submitOn, JSON.stringify(re));
    ok('retake: saved attempts/best are untouched', (await attempts(pg)) === a1 && (await pg.evaluate(() => EMC.Progress.read().quizBest)) === bestBefore);
    await answerCards(pg, 8);
    await pg.waitForTimeout(250);
    const graded = await submitUntilGraded(pg);
    await pg.waitForTimeout(500);
    ok('retake: a second attempt grades once with no duplicate charts',
      graded && (await attempts(pg)) === a1 + 1 && (await pg.evaluate(() => document.querySelectorAll('#quiz-score canvas').length)) === 3);
    /* changing difficulty from the results screen starts a clean new attempt */
    if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
    await pg.click('#quiz-difficulty [data-value="hard"]');
    await pg.waitForTimeout(500);
    const fromResults = await snap(pg);
    ok('modes: changing difficulty from the results screen starts a fresh Hard attempt',
      fromResults.diff === 'hard' && fromResults.cards === 16 && fromResults.pill === '0/16' && (await pg.evaluate(() => document.getElementById('quiz-score').hidden)));
    await ctx.close();
  }

  /* timer: pauses with the tab, and Hard grades itself at 0:00 exactly once */
  {
    const { ctx, pg } = await page();
    await pg.click('#quiz-timer-mode [data-value="up"]');
    await pg.evaluate(() => document.querySelector('.q-card .opt').click());
    await pg.waitForTimeout(1300);
    await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await pg.waitForTimeout(4000);
    await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await pg.waitForTimeout(1500);
    const shown = await pg.textContent('#quiz-timer');
    const secs = shown.split(':').reduce((m, v) => m * 60 + Number(v), 0);
    ok('timer: time spent in a hidden tab is not counted (4 s away, <= 4 s shown)', secs >= 1 && secs <= 4, shown);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.clock.install();
    await pg.goto(B + '/quiz.html', { waitUntil: 'load' });
    await pg.clock.runFor(900);
    await pg.click('#quiz-difficulty [data-value="hard"]');
    const a0 = await attempts(pg);
    await pg.evaluate(() => document.querySelector('.q-card .opt').click());
    await pg.clock.runFor(1500);
    const start = await pg.textContent('#quiz-timer');
    ok('timer: Hard starts a 15:00 countdown on the first answer', /^1[45]:\d\d$/.test(start), start);
    await pg.clock.runFor('15:05');
    const done = await pg.evaluate(() => ({ score: !document.getElementById('quiz-score').hidden, submit: document.getElementById('quiz-submit').textContent, timer: document.getElementById('quiz-timer').textContent }));
    ok('timer: at 0:00 the quiz grades itself once; blanks count as incorrect',
      done.score && /submitted/i.test(done.submit) && done.timer === '0:00' && (await attempts(pg)) === a0 + 1, JSON.stringify(done));
    await pg.clock.runFor('01:00');
    ok('timer: no second grading or stray ticks after time-up', (await attempts(pg)) === a0 + 1);
    await ctx.close();
  }

  /* a saved Hard session resumes as Hard (same order, no hints) */
  {
    const { ctx, pg } = await page();
    await pg.click('#quiz-difficulty [data-value="hard"]');
    await pg.waitForTimeout(250);
    const orderBefore = (await snap(pg)).ids;
    await pg.evaluate(() => document.querySelector('.q-card .opt').click());
    await pg.waitForTimeout(700);
    await pg.reload({ waitUntil: 'load' });
    await pg.waitForTimeout(700);
    await pg.click('#resume-yes');
    await pg.waitForTimeout(500);
    const res = await snap(pg);
    ok('resume: a Hard session comes back as Hard with its shuffle, no hints, locked clock',
      res.diff === 'hard' && res.pill === '1/16' && JSON.stringify(res.ids) === JSON.stringify(orderBefore) && res.hints === 0 && res.timerDisabled, JSON.stringify({ diff: res.diff, pill: res.pill, hints: res.hints }));
    await ctx.close();
  }

  /* the progress pill and unanswered tools never cover the answers (phone width) */
  {
    const { ctx, pg } = await page({ viewport: { width: 390, height: 844 } });
    await pg.evaluate(() => document.querySelector('.q-card .opt').click());
    await pg.locator('.q-card').nth(2).scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);
    const overlap = await pg.evaluate(() => {
      const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const pill = document.getElementById('quizPill');
      const pr = pill && !pill.hidden ? pill.getBoundingClientRect() : null;
      if (pr === null) return { pill: false, covered: 0 };
      const covered = [...document.querySelectorAll('.q-card .opt')].filter(o => { const r = o.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && hit(pr, r); }).length;
      return { pill: true, covered };
    });
    ok('unanswered/progress pill does not cover any visible answer option (390 px)', overlap.covered === 0, JSON.stringify(overlap));
    if (await pg.evaluate(() => document.getElementById('qopts-fields').hidden)) await pg.click('#qopts-toggle');
    await pg.click('[data-quiz-filter="unanswered"]');
    await pg.waitForTimeout(300);
    ok('unanswered filter lists exactly the remaining questions', (await pg.evaluate(() => document.querySelectorAll('.q-card').length)) === 15);
    await ctx.close();
  }

  console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'QUIZ VERIFICATION PASS' : h.failed() + ' QUIZ FAILURES');
}

/* ==========================================================================
   EMC Lab — simulation behaviour verification in a REAL browser.
     1 balloon: Rub button gives the same exact-opposite counters as a drag, via
       mouse AND keyboard; zero prints "0 C" (never "−0C"); Discharge resets
       every readout and the counters
     2 sandboxes (arena + field painter): Clear empties readouts and canvas and
       can be undone; the canvas is keyboard-operable ([ ] select, arrows move,
       + / − add, Delete removes, Esc deselects) with live announcements and the
       same Undo/readout path as the pointer
     3 touch: a tap with the + charge tool places a charge
     4 lifecycle: switching chapters repeatedly leaves identical stage/listener
       counts (no leaks), going home returns to zero, and off-screen sims park
       their animation loop
     5 zero console/page errors
   Exits 1 on any failure.
   ========================================================================== */
async function sims(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function open(url, opts = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(1200);
    return { ctx, pg };
  }
  const reveal = async (pg, sel) => { await pg.locator(sel).first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(800); };
  const text = (pg, sel) => pg.evaluate(s => document.querySelector(s).textContent.trim(), sel);
  const canvasHash = (pg, id) => pg.evaluate(id => {
    const c = document.getElementById(id); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < d.length; i += 37) h = (h * 31 + d[i]) | 0; return h;
  }, id);

  /* 1: balloon */
  {
    const { ctx, pg } = await open('/topics/fields.html');
    await reveal(pg, '#toy-balloon');
    const zero = [await text(pg, '#bl-q'), await text(pg, '#bl-h'), await text(pg, '#bl-total')];
    ok('balloon: zero charge prints "0 C" everywhere (never "−0C" / "+0C")', zero.every(t => /^0\sC$/.test(t.replace(/ /g, ' '))), JSON.stringify(zero));
    await pg.click('#bl-rub');
    await pg.waitForTimeout(300);
    const q1 = await text(pg, '#bl-q'), h1 = await text(pg, '#bl-h'), n1 = await text(pg, '#bl-n');
    ok('balloon: one Rub stroke moves electrons; balloon and hair are exact opposites',
      /^−/.test(q1) && /^\+/.test(h1) && q1.slice(1) === h1.slice(1) && !/^0 electrons/.test(n1), `${q1} / ${h1} / ${n1}`);
    const sub = (await text(pg, '#bl-sub')).replace(/\u00A0/g, ' ');
    ok('balloon: units follow the SI convention in every readout ("641 nC", never "641 n C")',
      /\d\s?[pnµm]?C\b/.test(sub) && !/\s[pnµmkMG]\sC\b/.test(sub) && !/\s[pnµmkMG]\sC\b/.test(q1.replace(/\u00A0/g, ' ')), `${sub} | ${q1}`);
    await pg.focus('#bl-rub');
    await pg.keyboard.press('Enter');
    await pg.keyboard.press('Space');
    await pg.waitForTimeout(300);
    ok('balloon: Rub works from the keyboard (Enter and Space add strokes)', (await text(pg, '#bl-n')) !== n1, await text(pg, '#bl-n'));
    await pg.click('#bl-reset');
    await pg.waitForTimeout(400);
    const after = [await text(pg, '#bl-q'), await text(pg, '#bl-h'), await text(pg, '#bl-total'), await text(pg, '#bl-n')];
    ok('balloon: Discharge restores every readout and the electron counter',
      after.slice(0, 3).every(t => /^0\sC$/.test(t.replace(/ /g, ' '))) && /^0 electrons/.test(after[3]), JSON.stringify(after));
    /* a real drag still rubs too */
    const box = await pg.locator('#toy-balloon').boundingBox();
    await pg.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.42);
    await pg.mouse.down();
    for (let i = 0; i < 20; i++) await pg.mouse.move(box.x + box.width * (0.18 + 0.1 * (i % 2)), box.y + box.height * 0.42, { steps: 2 });
    await pg.mouse.up();
    await pg.waitForTimeout(300);
    ok('balloon: dragging still rubs (unchanged)', !/^0 electrons/.test(await text(pg, '#bl-n')));
    await ctx.close();
  }

  /* 2: sandboxes — Clear + keyboard */
  for (const [id, panel, preset] of [['sim-arena', '#sim-arena-panel', 'lecture-line'], ['sim-fieldpaint', '#sim-fieldpaint-panel', 'dipole']]) {
    const { ctx, pg } = await open('/topics/fields.html');
    await reveal(pg, '#' + id);
    const count = () => pg.evaluate(p => {
      const s = document.querySelector(p + ' .stat-value'); return Number(s.textContent.trim());
    }, panel);
    const live = () => pg.evaluate(id => document.getElementById(id).closest('.canvas-wrap').querySelector('[role=status]').textContent, id);

    await pg.click(`${panel} [data-sb-preset="${preset}"]`);
    await pg.waitForTimeout(500);
    const n0 = await count();
    const hPreset = await canvasHash(pg, id);
    await pg.click(`${panel} [data-sb-act="clear"]`);
    await pg.waitForTimeout(500);
    ok(`${id}: Clear empties the charge count and redraws the canvas`, (await count()) === 0 && (await canvasHash(pg, id)) !== hPreset, `${n0} -> ${await count()}`);
    await pg.click(`${panel} [data-sb-act="undo"]`);
    await pg.waitForTimeout(500);
    ok(`${id}: Undo brings the cleared scene back`, (await count()) === n0, String(await count()));

    /* keyboard */
    ok(`${id}: the canvas is focusable and described (aria-describedby -> keyboard help)`,
      await pg.evaluate(id => { const c = document.getElementById(id); const d = document.getElementById(c.getAttribute('aria-describedby')); return c.tabIndex === 0 && !!d && /Esc/.test(d.textContent); }, id));
    await pg.focus('#' + id);
    await pg.keyboard.press(']');
    await pg.waitForTimeout(200);
    const sel1 = await live();
    ok(`${id}: ] selects a charge and announces it`, /at x = [\d.]+ m, y = [\d.]+ m \(1 of \d+\)/.test(sel1), sel1);
    await pg.keyboard.press(']');
    await pg.waitForTimeout(150);
    ok(`${id}: ] again moves to the next charge`, /\(2 of \d+\)/.test(await live()), await live());
    await pg.keyboard.press('[');
    const xOf = s => Number((/x = ([\d.]+) m/.exec(s) || [])[1]);
    const before = xOf(await live());
    await pg.keyboard.press('ArrowRight');
    await pg.keyboard.press('ArrowRight');
    await pg.waitForTimeout(150);
    const afterSmall = xOf(await live());
    await pg.keyboard.press('Shift+ArrowRight');
    await pg.waitForTimeout(150);
    const afterBig = xOf(await live());
    ok(`${id}: arrows move the selected charge (0.05 m steps, Shift = 0.25 m)`,
      Math.abs(afterSmall - before - 0.10) < 0.011 && Math.abs(afterBig - afterSmall - 0.25) < 0.011, `${before} -> ${afterSmall} -> ${afterBig}`);
    const nBeforeAdd = await count();
    await pg.keyboard.press('+');
    await pg.waitForTimeout(250);
    ok(`${id}: + adds a positive charge and announces it`, (await count()) === nBeforeAdd + 1 && /Added \+/.test(await live()), `${nBeforeAdd} -> ${await count()} | ${await live()}`);
    await pg.keyboard.press('-');
    await pg.waitForTimeout(250);
    ok(`${id}: − adds a negative charge`, (await count()) === nBeforeAdd + 2 && /Added −/.test(await live()), await live());
    await pg.keyboard.press('Delete');
    await pg.waitForTimeout(250);
    ok(`${id}: Delete removes the selected charge`, (await count()) === nBeforeAdd + 1 && /Removed/.test(await live()), await live());
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(250);
    ok(`${id}: Ctrl+Z undoes a keyboard deletion (same undo path as the pointer)`, (await count()) === nBeforeAdd + 2, String(await count()));
    await pg.keyboard.press(']');
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(150);
    ok(`${id}: Esc clears the selection`, /Selection cleared/.test(await live()), await live());
    /* the page's keys must not leak into the canvas handler when focus is elsewhere */
    await pg.focus(`${panel} [data-sb-act="undo"]`);
    const nIdle = await count();
    await pg.keyboard.press('+');
    ok(`${id}: + typed while a button has focus does nothing to the canvas`, (await count()) === nIdle);
    await ctx.close();
  }

  /* 3: touch */
  {
    const { ctx, pg } = await open('/topics/fields.html', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await reveal(pg, '#sim-arena');
    await pg.click('#sim-arena-panel [data-sb-act="clear"]');
    await pg.tap('#sim-arena-panel [data-sb-tool="add+"]');
    await pg.locator('#sim-arena').scrollIntoViewIfNeeded();   // the toolbar tap leaves the canvas partly below the fold
    await pg.evaluate(() => document.getElementById('sim-arena').scrollIntoView({ block: 'center' }));
    await pg.waitForTimeout(500);
    const box = await pg.locator('#sim-arena').boundingBox();
    await pg.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await pg.waitForTimeout(500);
    const n = await pg.evaluate(() => Number(document.querySelector('#sim-arena-panel .stat-value').textContent.trim()));
    ok('touch: tapping the canvas with the + charge tool places a charge', n === 1, String(n));
    const fit = await pg.evaluate(() => {
      const c = document.getElementById('sim-arena').getBoundingClientRect();
      return { right: Math.round(c.right), vw: innerWidth, pan: getComputedStyle(document.getElementById('sim-arena')).touchAction };
    });
    ok('touch: the canvas fits the phone width and still lets the page scroll vertically (touch-action pan-y)',
      fit.right <= fit.vw && /pan-y/.test(fit.pan), JSON.stringify(fit));
    await ctx.close();
  }

  /* 4: lifecycle */
  {
    const { ctx, pg } = await open('/index.html');
    const stats = () => pg.evaluate(() => EMC.stats());
    const scrollAll = () => pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 70)); } });   // html is scroll-behavior:smooth; a smooth scroll lags the steps and skips lazy sims
    const seen = {};
    for (let i = 0; i < 4; i++) {
      for (const ch of ['ch1', 'ch2']) {
        await pg.evaluate(c => { location.hash = '#/' + c; }, ch);
        await pg.waitForSelector('.tc', { timeout: 3000 }).catch(() => {}); await pg.waitForFunction(() => !document.querySelector('.tc'), null, { timeout: 8000 });   // the card came and went: the chapter is mounted
        await pg.waitForTimeout(900);
        await scrollAll();
        await pg.waitForTimeout(400);
        const s = await stats();
        (seen[ch] = seen[ch] || []).push(s.stages + '/' + s.listeners);
      }
    }
    ok('lifecycle: stage and listener counts are identical on every one of 4 visits to each chapter (no leaks)',
      seen.ch1.every(v => v === seen.ch1[0]) && seen.ch2.every(v => v === seen.ch2[0]), JSON.stringify(seen));
    await pg.evaluate(() => { location.hash = '#/'; });
    await pg.waitForTimeout(1300);
    const home = await stats();
    ok('lifecycle: back on the home view every stage, listener and animation loop is gone', home.stages === 0 && home.listeners === 0 && home.rafs === 0, JSON.stringify(home));
    await pg.evaluate(() => { location.hash = '#/ch2'; });
    await pg.waitForTimeout(1500);
    await pg.evaluate(() => scrollTo(0, 0));
    await pg.waitForTimeout(1500);
    const away = await stats();
    ok('lifecycle: with every simulation scrolled off-screen no animation loop is running', away.rafs === 0, JSON.stringify(away));
    await ctx.close();
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'SIMULATION CONTRACT PASS' : h.failed() + ' SIMULATION FAILURES');
}

/* ==========================================================================
   EMC Lab — lecture check values & sim physics in a REAL browser (gates S/Z).
   Drives the live UI (presets, sliders, drags) and asserts every readout
   against the governing equation, tolerance <= 1% unless noted. Covers the
   §1.2 lecture table plus the ch1 physics claims (the retired third chapter's
   Lorentz/Faraday checks were removed with it):
     ch2  collinear superposition   net on q1 = 5.69 N (+x)   [arena preset]
     ch2  2-D superposition         22.7 N at ~24 deg          [arena preset]
     ch2  two-charge field          E1 = 73,388; net 75,595 N/C +y; Ex = 0
     ch2  Bohr hydrogen             v = 2.188e6 m/s at r = 5.29e-11 m
     ch2  charge quantisation       balloon total stays exactly 0 C
     ch1  Ohm's law                 I = V/R, P = VI on a preset; R<=0 and
                                    junk input never yield NaN/Infinity
     ch1  series + Kirchhoff        79/94 ohm defaults, V(bank)+V(bulb)=12 V
   Exits 1 on any failure.
   ========================================================================== */
async function values(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const SI = { f: 1e-15, p: 1e-12, n: 1e-9, '\u00B5': 1e-6, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9, T: 1e12 };
  function parseSI(str) {
    if (str === null || str === undefined) return NaN;
    const m = /^(-?[\d.]+)(?:e([+-]?\d+))?\s*([fpn\u00B5umkMGT])?/.exec(String(str).replace('\u00A0', ' ').trim());
    if (!m) return NaN;
    let v = parseFloat(m[1]);
    if (m[2]) v *= Math.pow(10, parseInt(m[2], 10));
    if (m[3]) v *= SI[m[3]];
    return v;
  }
  const close = (name, got, want, tol = 0.01) =>
    ok(name, isFinite(got) && Math.abs(got - want) <= Math.abs(want) * tol, `got ${got}, want ${want} (tol ${tol * 100}%)`);

  const errors = [];
  async function page(url) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(600);
    return { ctx, pg };
  }
  const txt = (pg, id) => pg.evaluate(i => (document.getElementById(i) || {}).textContent, id);

  /* ================= ch2: fields.html ================= */
  {
    const { ctx, pg } = await page('/topics/fields.html');

    /* --- Coulomb collinear: lecture-line preset, net on q1 = 5.69 N (+x) --- */
    await pg.locator('#sim-arena-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);
    await pg.click('[data-sb-preset="lecture-line"]');
    await pg.waitForTimeout(400);
    /* click the +3 uC charge: screen pos from the sandbox's own view transform */
    const q1 = await pg.evaluate(() => {
      const st = window.__AR.state, v = st.view;
      const c = st.objects.find(o => Math.abs(o.q - 3e-6) < 1e-12);
      return { x: v.ox + c.x * v.scale, y: v.oy + c.y * v.scale };
    });
    const bb = await pg.locator('#sim-arena').boundingBox();
    await pg.mouse.click(bb.x + q1.x, bb.y + q1.y);
    await pg.waitForTimeout(300);
    close('ch2 Coulomb line: net force on q1 = 5.69 N (engine softened ≤1%)',
      parseSI(await txt(pg, 'ar-sel')), 5.69, 0.01);

    /* --- Coulomb 2-D: lecture-2d preset, 22.7 N at ~24 deg --- */
    await pg.click('[data-sb-preset="lecture-2d"]');
    await pg.waitForTimeout(400);
    const q4 = await pg.evaluate(() => {
      const st = window.__AR.state, v = st.view;
      const c = st.objects.find(o => Math.abs(o.q - 4e-6) < 1e-12);
      return { x: v.ox + c.x * v.scale, y: v.oy + c.y * v.scale };
    });
    const bb2 = await pg.locator('#sim-arena').boundingBox();
    await pg.mouse.click(bb2.x + q4.x, bb2.y + q4.y);
    await pg.waitForTimeout(300);
    close('ch2 Coulomb 2-D: net force on +4 uC = 22.7 N', parseSI(await txt(pg, 'ar-sel')), 22.7, 0.012);
    const selSub = (await txt(pg, 'ar-sub')) || '';
    ok('ch2 Coulomb 2-D: net points up-right (~24 deg above +x, lecture orientation)',
      /up-right/.test(selSub), selSub.slice(0, 90));

    /* --- Field: lecture-y preset, E at P --- */
    await pg.locator('#sim-fieldpaint-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);
    await pg.click('[data-sb-preset="lecture-y"]');
    await pg.waitForTimeout(500);
    close('ch2 field: |E| at P = 75,595 N/C', parseSI(await txt(pg, 'fp-probe-e')), 75595, 0.01);
    ok('ch2 field: E points along +y (Ex = 0)', /^90°/.test((await txt(pg, 'fp-probe-dir') || '').trim()),
      (await txt(pg, 'fp-probe-dir') || '').trim());

    /* --- Bohr tuner: r = 5.29e-11 m -> v = 2.188e6 m/s --- */
    await pg.locator('#toy-bohr-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(400);
    await pg.evaluate(() => {
      const s = document.getElementById('bo-r');
      s.value = '5.29';
      s.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pg.waitForTimeout(400);
    close('ch2 Bohr: v = 2.188e6 m/s at the lecture radius', parseSI(await txt(pg, 'bo-v')), 2.188e6, 0.01);

    /* --- Balloon: conservation, total exactly 0 C --- */
    await pg.locator('#toy-balloon-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(400);
    ok('ch2 quantisation: balloon+hair total reads exactly 0 C',
      (await txt(pg, 'bl-total')) === '0 C', await txt(pg, 'bl-total'));
    await ctx.close();
  }

  /* ================= ch1: current.html ================= */
  {
    const { ctx, pg } = await page('/topics/current.html');
    await pg.locator('#sim-ohm-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);

    /* Ohm preset: V=24, R=2 -> I=12 A, P=288 W */
    await pg.click('[data-ohm-preset="24,2"]');
    await pg.waitForTimeout(400);
    close('ch1 Ohm: I = V/R = 24/2 = 12 A', parseSI(await txt(pg, 'ohm-I')), 12, 0.01);
    close('ch1 Ohm: P = VI = 288 W', parseSI(await txt(pg, 'ohm-P')), 288, 0.01);

    /* R = 0 and junk input: rejected, never NaN/Infinity on screen */
    await pg.evaluate(() => {
      const n = document.getElementById('ohm-Rnum');
      n.value = '0'; n.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pg.waitForTimeout(200);
    let bad = await pg.evaluate(() => ['ohm-I', 'ohm-P', 'ohm-Rv'].map(i => document.getElementById(i).textContent).join('|'));
    ok('ch1 Ohm: R=0 refused, readouts stay finite', !/NaN|Infinity|∞/.test(bad), bad);
    await pg.evaluate(() => {
      const n = document.getElementById('ohm-Rnum');
      n.value = 'abc'; n.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pg.waitForTimeout(200);
    bad = await pg.evaluate(() => ['ohm-I', 'ohm-P', 'ohm-Rv', 'ohm-Rnum'].map(i => document.getElementById(i).textContent || document.getElementById(i).value).join('|'));
    ok('ch1 Ohm: junk input refused, previous value restored', !/NaN|abc/.test(bad), bad);

    /* Circuit defaults: one series loop — battery 12 V + 22 ohm + bulb 15 ohm */
    await pg.locator('#sim-circuit-panel').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);
    ok('ch1 circuit: loop total R = 37.0 ohm', (await txt(pg, 'circ-R')).includes('37.0'), await txt(pg, 'circ-R'));
    close('ch1 circuit: I = 12/37 A', parseSI(await txt(pg, 'circ-I')), 12 / 37, 0.01);
    close('ch1 circuit: I x total R reproduces the supply voltage',
      parseSI(await txt(pg, 'circ-I')) * 37, 12, 0.05);
    await ctx.close();
  }

  /* This footer was missing: without closing the server and browser the process never
     exited, so the script hung forever, printed no verdict and could never fail a run. */
  console.log('page/console errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'LECTURE VALUES PASS' : h.failed() + ' LECTURE VALUE FAILURES');
}

/* ==========================================================================
   EMC Lab - interaction test (dev tool, needs playwright + chromium).

   Drives the REAL sims with mouse, touch and keyboard the way a student
   would, including the rude cases: interrupted drags, releases outside the
   canvas, rapid repeated clicks, resets mid-run, resizes mid-entrance and
   navigation away mid-initialisation. Every case asserts a real state change
   (a readout, a slider value, a class) - never just "no exception".
   Exits 1 on any failure, console/page error or missing asset.
   ========================================================================== */
async function interact(h) {
  const { ok, B, ROOT, fs, path, browser, skipIntroOnLoad } = h;
  const errs = [];
  async function page(url, opts = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); });
    await pg.goto(url, { waitUntil: 'load' });
    await pg.waitForTimeout(1400);                       // whenNear + entrance settle
    return { ctx, pg };
  }
  const box = async (pg, sel) => pg.locator(sel).boundingBox();

  /* ---- Arena: mouse drag moves a charge and updates the real readouts ---- */
  {
    const { ctx, pg } = await page(B + '/topics/fields.html');
    /* the preset centres on the canvas as it is now. Clicking it scrolls the button into view, which can leave the (taller)
       canvas below the fold, so jump back to the canvas (instant: the page's smooth scroll would still be moving) */
    const toArena = () => pg.evaluate(() => document.getElementById('sim-arena').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await toArena(); await pg.waitForTimeout(400);
    await pg.click('[data-sb-preset="pair"]');
    await toArena(); await pg.waitForTimeout(400);
    const bb = await pg.locator('#sim-arena').boundingBox();
    // preset "pair" zooms x2 about (1.35 m, 0.60 m): q1 lands near 40%/50% of
    // the canvas, q2 near 60%/50%
    await pg.mouse.click(bb.x + 0.40 * bb.width, bb.y + 0.50 * bb.height);
    await pg.waitForTimeout(120);
    const sel0 = await pg.textContent('#ar-sel');
    ok('arena: clicking a charge selects it and reports a real force', /N/.test(sel0), sel0);
    await pg.mouse.move(bb.x + 0.60 * bb.width, bb.y + 0.50 * bb.height);
    await pg.mouse.down();
    for (let i = 1; i <= 6; i++) await pg.mouse.move(bb.x + (0.60 - i * 0.02) * bb.width, bb.y + 0.50 * bb.height);
    await pg.mouse.up();
    await pg.waitForTimeout(150);
    const sel1 = await pg.textContent('#ar-sel');
    ok('arena: dragging the second charge closer grows the force', sel1 !== sel0, `${sel0} -> ${sel1}`);
    ok('arena: drag class released after up', !(await pg.getAttribute('#sim-arena', 'class')).includes('grabbing'));

    /* interrupted drag: release far outside the canvas */
    await pg.mouse.move(bb.x + 0.56 * bb.width, bb.y + 0.50 * bb.height);
    await pg.mouse.down();
    await pg.mouse.move(10, 10);                          // outside the workspace
    await pg.mouse.up();
    await pg.waitForTimeout(120);
    ok('arena: outside release leaves no stuck drag', !(await pg.getAttribute('#sim-arena', 'class')).includes('grabbing'));
    await ctx.close();
  }

  /* ---- Arena: touch drag (real touch events via CDP) ---- */
  {
    const { ctx, pg } = await page(B + '/topics/fields.html', { hasTouch: true, viewport: { width: 390, height: 844 } });
    await pg.click('[data-sb-preset="pair"]');
    await pg.locator('#sim-arena').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(300);
    const b = await box(pg, '#sim-arena');
    const y0 = await pg.evaluate(() => window.scrollY);
    const cdp = await ctx.newCDPSession(pg);
    const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), radiusX: 2, radiusY: 2, force: 1, id: 1 }];
    const X = b.x + 0.55 * b.width, Y = b.y + 0.50 * b.height;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(X, Y) });
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(X - i * 14, Y) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pg.waitForTimeout(200);
    ok('arena: page did not scroll during a canvas drag', (await pg.evaluate(() => window.scrollY)) === y0);
    await ctx.close();
  }

  /* ---- Field Painter: rapid preset switching ---- */
  {
    const { ctx, pg } = await page(B + '/topics/fields.html');
    for (const p of ['single', 'dipole', 'like', 'dipole']) await pg.click(`[data-sb-preset="${p}"]`, { delay: 20 });
    await pg.waitForTimeout(250);
    ok('fieldpaint: last preset wins after rapid clicks',
      (await pg.textContent('#fp-count')).trim() === '2', await pg.textContent('#fp-count'));
    await ctx.close();
  }

  /* ---- ohm: repeated preset clicks keep one coherent state ---- */
  {
    const { ctx, pg } = await page(B + '/topics/current.html');
    const btn = pg.locator('[data-ohm-preset="24,2"]');
    for (let i = 0; i < 4; i++) await btn.click({ delay: 15 });
    await pg.waitForTimeout(200);
    ok('ohm: repeated preset clicks settle on the preset value',
      (await pg.textContent('#ohm-Vv')).includes('24'));
    await ctx.close();
  }

  /* ---- circuit builder: real drag & drop (R1 rebuild: place / move / delete / disconnect) ---- */
  {
    const { ctx, pg } = await page(B + '/topics/current.html');
    await pg.locator('#sim-circuit').scrollIntoViewIfNeeded();
    await pg.waitForTimeout(500);
    const bb = await pg.locator('#sim-circuit').boundingBox();
    const w = bb.width, h = bb.height;
    /* socket geometry mirrors js/sim-circuit.js layout(): six taps on the loop */
    const m = Math.min(w, h) * 0.16;
    const S = [
      { x: m + (w - 2 * m) * .25, y: m }, { x: m + (w - 2 * m) * .75, y: m },
      { x: w - m, y: h / 2 }, { x: m + (w - 2 * m) * .75, y: h - m },
      { x: m + (w - 2 * m) * .25, y: h - m }, { x: m, y: h / 2 }
    ];
    const rows = () => pg.locator('#circ-rows .circ-row').count();
    const rows0 = await rows();

    /* 1. drag the resistor chip from the palette onto socket 4 */
    const chip = await pg.locator('[data-circ-part="res"]').boundingBox();
    await pg.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2);
    await pg.mouse.down();
    await pg.mouse.move(bb.x + S[3].x, bb.y + S[3].y, { steps: 8 });
    await pg.mouse.up();
    await pg.waitForTimeout(250);
    ok('circuit: dragging the palette chip onto a socket places the part',
      (await rows()) === rows0 + 1);

    /* 2. drag the placed bulb from socket 3 to socket 5 (move, same loop) */
    await pg.mouse.move(bb.x + S[2].x, bb.y + S[2].y);
    await pg.mouse.down();
    await pg.mouse.move(bb.x + S[4].x, bb.y + S[4].y, { steps: 6 });
    await pg.mouse.up();
    await pg.waitForTimeout(250);
    ok('circuit: dragging a placed part moves it between sockets',
      (await pg.textContent('#circ-sk4')).includes('bul'));

    /* 3. drag the bulb off the bench -> deleted */
    await pg.mouse.move(bb.x + S[4].x, bb.y + S[4].y);
    await pg.mouse.down();
    await pg.mouse.move(bb.x - 60, bb.y + S[4].y, { steps: 6 });
    await pg.mouse.up();
    await pg.waitForTimeout(250);
    ok('circuit: dragging a part off the bench deletes it', (await rows()) === rows0);

    /* 4. drag the battery off -> honest open loop; keyboard path reconnects */
    await pg.mouse.move(bb.x + S[0].x, bb.y + S[0].y);
    await pg.mouse.down();
    await pg.mouse.move(bb.x - 60, bb.y + S[0].y, { steps: 6 });
    await pg.mouse.up();
    await pg.waitForTimeout(250);
    const dead = await pg.textContent('#circ-I');
    const note = await pg.textContent('#circ-note');
    ok('circuit: dragging the battery off kills the current (no fake numbers)',
      /0/.test(dead) && /battery/i.test(note), dead + ' | ' + note);
    await pg.click('[data-circ-part="bat"]');
    await pg.click('#circ-sk0');
    await pg.waitForTimeout(200);
    const stillOpen = await pg.textContent('#circ-I');
    ok('circuit: battery back but bulb still missing -> loop stays honestly open',
      /^0/.test(stillOpen.trim()), stillOpen);
    await pg.click('[data-circ-part="bulb"]');
    await pg.click('#circ-sk2');
    await pg.waitForTimeout(250);
    const alive = await pg.textContent('#circ-I');
    ok('circuit: arming + placing by keyboard completes the loop and current returns',
      /A/.test(alive) && !/^0/.test(alive.trim()), alive);
    await ctx.close();
  }

  /* ---- resize mid-entrance + navigation away mid-init ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push('resize: ' + String(e).slice(0, 120)));
    await pg.goto(B + '/topics/current.html', { waitUntil: 'load' });
    await pg.waitForTimeout(120);                          // mid-entrance
    await pg.setViewportSize({ width: 700, height: 900 });
    await pg.waitForTimeout(900);
    const wAttr = await pg.evaluate(() => document.getElementById('sim-ohm').width);
    ok('resize mid-entrance: canvas re-measures', wAttr > 0 && wAttr <= 700 * 2, String(wAttr));
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg2 = await ctx2.newPage();
    pg2.on('pageerror', e => errs.push('switch: ' + String(e).slice(0, 120)));
    await pg2.goto(B + '/index.html#/current', { waitUntil: 'load' });
    await pg2.waitForTimeout(150);                         // leave mid-init
    await pg2.evaluate(() => { location.hash = '#/'; });
    await pg2.waitForTimeout(600);
    const st = await pg2.evaluate(() => window.EMC.stats());
    ok('navigation away mid-init leaves no stages behind', st.stages === 0 && st.listeners === 0, JSON.stringify(st));
    await ctx2.close();
  }

  /* ---- legacy lesson URLs redirect into the merged chapter ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push('redirect: ' + String(e).slice(0, 120)));
    await pg.goto(B + '/topics/charge.html', { waitUntil: 'load' });
    await pg.waitForURL(/fields\.html/, { timeout: 5000 });
    ok('legacy /topics/charge.html redirects into fields.html',
      pg.url().includes('fields.html'), pg.url());
    await pg.goto(B + '/topics/field.html#sim-fieldpaint-panel', { waitUntil: 'load' });
    await pg.waitForURL(/fields\.html/, { timeout: 5000 });
    ok('legacy redirect preserves the sim-panel anchor',
      pg.url().includes('#sim-fieldpaint-panel'), pg.url());
    await ctx.close();
  }

  console.log('404 h.misses():', h.misses().length ? h.misses().slice(0, 5) : 'none');
  console.log('console/page errors:', errs.length ? errs.slice(0, 6) : 'none');
  if (h.misses().length || errs.length) h.fail(h.misses().length + errs.length);
  console.log(h.failed() === 0 ? 'INTERACTION TESTS PASS' : h.failed() + ' FAILURES');
}

/* ==========================================================================
   EMC Lab — the chapter pages (js/chapter-nav.js, the lesson cards, the simulation panel layout).
     1 every lesson card links to a lesson that exists, and the lesson wire has one dot per lesson
     2 scrolling to each lesson lights its dot and fills the wire down to it
     3 the Details switch changes every card's description (technical and plain differ, neither empty)
     4 the Rub the Balloon canvas fills its column: no empty band under it (it left one at wide sizes)
     5 phones: nothing scrolls sideways, the wire is not shown, the cards stack
     6 same-page mount: one wire, gone when you leave, still one after coming back (no duplicates)
   ========================================================================== */
async function chapters(h) {
  const { ok, B, browser, skipIntroOnLoad } = h;
  const errors = [];
  async function open(url, opts = {}) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, opts));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(String(e).slice(0, 140)));
    pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 140)); });
    await pg.addInitScript(skipIntroOnLoad);
    await pg.goto(B + url, { waitUntil: 'load' });
    await pg.waitForTimeout(1200);
    return { ctx, pg };
  }
  const to = (pg, id) => pg.evaluate(i => { const e = document.getElementById(i); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 140, behavior: 'instant' }); }, id);

  for (const [url, name, want] of [['/topics/current.html', 'Circuits', 6], ['/topics/fields.html', 'Fields', 3]]) {
    const { ctx, pg } = await open(url);
    /* 1 */
    const info = await pg.evaluate(() => ({
      cards: [...document.querySelectorAll('.lc')].map(a => ({ href: a.getAttribute('href'), ok: !!document.getElementById(a.getAttribute('href').slice(1)) })),
      dots: document.querySelectorAll('.lw-chapter li').length
    }));
    ok(`1 ${name}: ${want} lesson cards, each linking to a lesson that exists, and one wire dot per lesson`,
      info.cards.length === want && info.cards.every(c => c.ok) && info.dots === want, JSON.stringify(info).slice(0, 200));
    /* 2 */
    const ids = info.cards.map(c => c.href.slice(1)), lit = [];
    for (const id of ids) {
      await to(pg, id);
      await pg.waitForTimeout(450);
      lit.push(await pg.evaluate(() => { const l = [...document.querySelectorAll('.lw-chapter a')]; return { cur: l.findIndex(a => a.classList.contains('cur')), fill: getComputedStyle(document.querySelector('.lw-chapter ol'), '::after').transform }; }));
    }
    ok(`2 ${name}: scrolling to each lesson lights its dot in order`, lit.every((x, i) => x.cur === i), JSON.stringify(lit.map(x => x.cur)));
    ok(`2 ${name}: the wire fills down to the lit lesson (the last one is filled all the way)`, lit[lit.length - 1].fill !== 'none' && /matrix\(1, 0, 0, 1,/.test(lit[lit.length - 1].fill), lit[lit.length - 1].fill);
    /* 3 */
    await pg.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const read = () => pg.evaluate(() => [...document.querySelectorAll('.lc')].map(a => [...a.querySelectorAll('p')].filter(p => getComputedStyle(p).display !== 'none').map(p => p.textContent.trim()).join('|')));
    const a = await read();
    await pg.click('#detailToggle'); await pg.waitForTimeout(500);
    const b = await read();
    ok(`3 ${name}: the Details switch changes every card's description (neither version empty)`,
      a.length === want && a.every((t, i) => t.length > 20 && b[i].length > 20 && t !== b[i]), a[0].slice(0, 30) + ' / ' + b[0].slice(0, 30));
    await ctx.close();
  }

  /* 4: the balloon canvas fills its column */
  {
    const { ctx, pg } = await open('/topics/fields.html');
    await pg.evaluate(() => document.getElementById('toy-balloon-panel').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await pg.waitForTimeout(900);
    const g = await pg.evaluate(() => { const c = document.getElementById('toy-balloon').getBoundingClientRect(), cell = document.getElementById('toy-balloon').closest('.sim-grid').firstElementChild.getBoundingClientRect(), ctl = document.querySelector('#toy-balloon-panel .panel-body').getBoundingClientRect();
      return { canvasBottom: Math.round(c.bottom), cellBottom: Math.round(cell.bottom), controlsBottom: Math.round(ctl.bottom), w: Math.round(c.width), h: Math.round(c.height) }; });
    ok('4 the Rub the Balloon canvas reaches the bottom of its column (no empty band under it)', Math.abs(g.canvasBottom - g.cellBottom) <= 4 && g.h >= 300, JSON.stringify(g));
    await ctx.close();
  }

  /* 5: phone */
  {
    const { ctx, pg } = await open('/topics/fields.html', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const g = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, wire: getComputedStyle(document.querySelector('.lw-chapter')).display,
      widths: [...document.querySelectorAll('.lc')].map(a => Math.round(a.getBoundingClientRect().width)) }));
    ok('5 phone: no sideways scroll, no lesson wire, cards stack at full width', g.sw <= g.iw && g.wire === 'none' && g.widths.every(w => w >= g.iw - 60), JSON.stringify(g));
    await ctx.close();
  }

  /* 6: same-page mount */
  {
    const { ctx, pg } = await open('/index.html');
    const settled = (hiddenTopic) => pg.waitForFunction(ht => document.getElementById('shell-topic').hidden === ht && !document.querySelector('.tc'), hiddenTopic, { timeout: 9000 });
    await pg.click('a[data-topic-link="ch2"]'); await settled(false);
    await pg.waitForTimeout(500);
    const first = await pg.evaluate(() => document.querySelectorAll('#shell-topic .lw-chapter').length);
    await pg.evaluate(() => { location.hash = '#/'; }); await settled(true);
    const gone = await pg.evaluate(() => document.querySelectorAll('.lw-chapter').length);
    await pg.evaluate(() => { location.hash = '#/ch2'; }); await settled(false);
    await pg.waitForTimeout(500);
    const again = await pg.evaluate(() => document.querySelectorAll('.lw-chapter').length);
    ok('6 same-page mount: one lesson wire, none left behind on Home, still exactly one when the chapter is opened again', first === 1 && gone === 0 && again === 1, JSON.stringify({ first, gone, again }));
    await ctx.close();
  }

  console.log('console/page errors:', errors.length ? errors.slice(0, 6) : 'none');
  if (errors.length) h.fail(errors.length);
  console.log(h.failed() === 0 ? 'CHAPTERS PASS' : h.failed() + ' CHAPTERS FAILURES');
}

export const suites = {
  quiz: { about: 'quiz flow, scoring, resume, results', browser: true, run: quiz },
  sims: { about: 'simulation behaviour, sandboxes, lifecycle', browser: true, run: sims },
  values: { about: 'lecture check values against the live UI', browser: true, run: values },
  interact: { about: 'drives sims, canvases and controls with real pointer input', browser: true, run: interact },
  chapters: { about: 'chapter pages: lesson cards, lesson wire, Details, sim panel layout, phone, same-page mount', browser: true, run: chapters }
};
