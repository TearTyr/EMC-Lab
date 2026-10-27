/* EMC Lab mascot helper (Denki-chan).
   The header mascot is a real <button> beside the home link (never inside it).
   Click/Enter/Space opens a small, non-modal helper panel with a tip for the
   page you are on and shortcuts to the EXISTING tools (it never ships a
   calculator of its own). Escape, an outside click, or moving focus away
   closes it; nothing traps focus.
   The same mascot also "talks": other scripts announce a moment with
     document.dispatchEvent(new CustomEvent('emc:mascot', { detail: { kind, pct } }))
   and a short bubble appears for a few seconds (aria-live, never blocks
   pointer input). Kinds: 'quiz' (needs pct) and 'chapter-done'. */
(function () {
  const btn = document.getElementById('mascotBtn');
  const cluster = btn && btn.closest('.brand-cluster');
  if (!btn || !cluster) return;

  const REG = window.EMC_REGISTRY || { chapters: [], resolve: () => null };
  const root = location.pathname.indexOf('/topics/') >= 0 ? '../' : '';
  const BUBBLE_MS = 4500;

  /* ---------------------------------------------------------------- content */
  /* Tips per view. Three each so reopening feels fresh; the picker below
     never shows the same one twice in a row. Facts match the lessons. */
  const TIPS = {
    home: [
      'New here? Start with Chapter 1 — circuits are the base for everything after.',
      'The Details switch in the top bar swaps full technical explanations for simpler ones.',
      'The quiz saves your best score on this device only. Take it whenever you like.'
    ],
    ch1: [
      'Ohm’s law links three things: V = I × R. Cover the one you want and solve for it.',
      'In series the current is shared; in parallel the voltage is shared.',
      'Build a circuit and watch what adding one more resistor does to the current.'
    ],
    ch2: [
      'Like charges repel and opposite charges attract.',
      'Coulomb’s force falls with the square of distance: double the gap, a quarter of the force.',
      'The electric field points the way a positive test charge would be pushed.'
    ],
    quiz: [
      'Stuck? Rule out two options first, then choose between the rest.',
      'Flag a question to come back to it before you submit.',
      'The explanations after submitting are worth a read, even for right answers.'
    ]
  };

  /* Titles for the simulations the registry lists. The registry owns WHICH
     tools exist; this only gives them readable names. */
  const TOOL_NAMES = {
    'sim-ohm': 'Ohm’s law calculator',
    'sim-circuit': 'Circuit builder',
    'toy-balloon': 'Balloon & charge',
    'sim-arena': 'Coulomb arena',
    'toy-bohr': 'Bohr atom',
    'sim-fieldpaint': 'Field painter'
  };

  /* Short reactions. Several per moment, never the same twice in a row. */
  const SAYINGS = {
    'quiz-high': ['Electrifying — great score!', 'Strong result. Skim the misses below.', 'You really know this stuff!'],
    'quiz-mid': ['Solid effort. The explanations below will fill the gaps.', 'Getting there — review what you missed.', 'Good progress. One more go?'],
    'quiz-low': ['Everyone starts somewhere. The explanations will help.', 'Not yet — read the notes, then retake it.', 'Keep going; it clicks with practice.'],
    'chapter-done': ['Chapter complete. Nice work!', 'Another one down. Onward!', 'Done and saved. Well played!']
  };

  /* -------------------------------------------------------------- selection */
  const lastPicked = {};     // key -> index shown last, so repeats are avoided
  function pickIndex(key, count) {
    if (count < 2) return 0;
    let i = Math.floor(Math.random() * count);
    if (i === lastPicked[key]) i = (i + 1) % count;
    lastPicked[key] = i;
    return i;
  }

  /* Which "view" the reader is on: the quiz, a chapter, or home. On the home
     page the shell swaps chapters in place, so this reads the hash each time. */
  function currentView() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file === 'quiz.html') return 'quiz';
    const byFile = REG.chapters.find(c => c.path.split('/').pop() === file);
    if (byFile) return byFile.id;
    const m = /^#\/([\w-]+)/.exec(location.hash || '');
    const ch = m && REG.resolve ? REG.resolve(m[1]) : null;
    return ch ? ch.id : 'home';
  }

  /* Shortcuts: a chapter view lists that chapter's tools; elsewhere it offers
     the first tool of each chapter, plus the quiz. */
  function shortcutsFor(view) {
    const links = [];
    const toolLink = (ch, simId) => ({
      text: TOOL_NAMES[simId] || simId,
      href: root + ch.path + '#' + simId + '-panel'
    });
    const chapter = REG.chapters.find(c => c.id === view);
    if (chapter) {
      chapter.sims.forEach(id => links.push(toolLink(chapter, id)));
    } else {
      REG.chapters.forEach(ch => { if (ch.sims.length) links.push(toolLink(ch, ch.sims[0])); });
    }
    if (view !== 'quiz') links.push({ text: 'Take the quiz', href: root + 'quiz.html' });
    return links;
  }

  /* ------------------------------------------------------------------ panel */
  const panel = document.createElement('div');
  panel.className = 'mascot-panel';
  panel.id = 'mascotPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Denki-chan helper');
  panel.tabIndex = -1;
  panel.hidden = true;
  panel.innerHTML =
    '<div class="mp-head">' +
      '<img src="' + root + 'img/mascot-sparkle.png" width="34" height="34" alt="">' +
      '<b>Denki-chan says</b>' +
      '<button class="mp-close" type="button" aria-label="Close helper">×</button>' +
    '</div>' +
    '<p class="mp-tip"></p>' +
    '<button class="mp-more" type="button">Another tip</button>' +
    '<div class="mp-links"><span class="mp-sub">Jump to</span><ul></ul></div>' +
    '<p class="mp-keys">Press Esc to close.</p>';
  cluster.appendChild(panel);

  const tipEl = panel.querySelector('.mp-tip');
  const listEl = panel.querySelector('.mp-links ul');

  function showTip() {
    const view = currentView();
    const tips = TIPS[view] || TIPS.home;
    tipEl.textContent = tips[pickIndex('tip-' + view, tips.length)];
  }

  function renderShortcuts() {
    listEl.textContent = '';
    shortcutsFor(currentView()).forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  function isOpen() { return !panel.hidden; }

  function open() {
    hideBubble();
    showTip();
    renderShortcuts();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    panel.focus({ preventScroll: true });
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus();
  }

  btn.addEventListener('click', () => { if (isOpen()) close(false); else open(); });
  panel.querySelector('.mp-close').addEventListener('click', () => close(true));
  panel.querySelector('.mp-more').addEventListener('click', showTip);
  /* following a shortcut leaves the panel behind (the shell swaps chapters in
     place, so the page itself does not reload) */
  panel.addEventListener('click', e => { if (e.target.closest('a')) close(false); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !isOpen()) return;
    close(cluster.contains(document.activeElement));
  });
  document.addEventListener('click', e => {
    if (isOpen() && !e.target.closest('.brand-cluster')) close(false);
  });
  /* keyboard users tabbing past the panel: it closes, no focus trap */
  cluster.addEventListener('focusout', e => {
    if (isOpen() && e.relatedTarget && !cluster.contains(e.relatedTarget)) close(false);
  });
  /* a chapter switch on the home page changes what the tips/links should say */
  document.addEventListener('emc:view-shown', () => close(false));

  /* ----------------------------------------------------------------- bubble */
  const bubble = document.createElement('div');
  bubble.className = 'mascot-say';
  bubble.id = 'mascotSay';
  bubble.setAttribute('role', 'status');      // polite live region
  bubble.hidden = true;
  cluster.appendChild(bubble);
  let bubbleTimer = 0;

  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = 0;
    bubble.hidden = true;
  }

  function say(key) {
    const lines = SAYINGS[key];
    if (!lines || isOpen()) return;          // never talk over the open panel
    clearTimeout(bubbleTimer);
    bubble.textContent = lines[pickIndex('say-' + key, lines.length)];
    bubble.hidden = false;
    bubbleTimer = setTimeout(hideBubble, BUBBLE_MS);
  }

  document.addEventListener('emc:mascot', e => {
    const d = e.detail || {};
    if (d.kind === 'chapter-done') say('chapter-done');
    else if (d.kind === 'quiz') say(d.pct >= 80 ? 'quiz-high' : d.pct >= 50 ? 'quiz-mid' : 'quiz-low');
  });
})();
