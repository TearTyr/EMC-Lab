/* EMC Lab mascot helper (Denki-chan).
   The header mascot is a real <button> beside the home link (never inside it).
   Click/Enter/Space opens a small, non-modal helper panel with a tip for the
   page you are on and shortcuts to the EXISTING tools. On the quiz there is
   nowhere to send you, so clicking Denki-chan turns her into a floating
   calculator instead: she leaves the header while it is open and the
   calculator flies back into her spot when it closes. Escape, an outside
   click, or moving focus away closes the helper panel (the calculator stays
   until you close it, so you can work a question beside it); nothing traps focus.
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
  const QUIZ = location.pathname.split('/').pop() === 'quiz.html';
  const reduced = () => !btn.animate || !!(window.EMC && window.EMC.reducedMotion);

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

  /* Calculator keys, five to a row like a scientific calculator:
     [label (html), what it types, css class, hover title] */
  const PAD = [
    ['k', 'k', 'fn', 'Coulomb constant, 8.99e9 N m^2/C^2'], ['e', 'e', 'fn', 'Elementary charge, 1.602e-19 C'], ['x<sup>2</sup>', '^2', 'fn', 'square'], ['√', 'sqrt(', 'fn', 'square root'], ['^', '^', 'fn', 'power'],
    ['(', '(', 'fn'], [')', ')', 'fn'], ['sin', 'sin(', 'fn', 'degrees'], ['cos', 'cos(', 'fn', 'degrees'], ['tan', 'tan(', 'fn', 'degrees'],
    ['7', '7', ''], ['8', '8', ''], ['9', '9', ''], ['DEL', 'DEL', 'del'], ['AC', 'AC', 'del'],
    ['4', '4', ''], ['5', '5', ''], ['6', '6', ''], ['×', '*', 'op'], ['÷', '/', 'op'],
    ['1', '1', ''], ['2', '2', ''], ['3', '3', ''], ['+', '+', 'op'], ['-', '-', 'op'],
    ['0', '0', ''], ['.', '.', ''], ['EXP', 'EXP', 'op', 'times ten to the power'], ['Ans', 'ans', 'op', 'the last answer'], ['=', '=', 'eq']
  ];

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
  panel.className = 'mascot-panel' + (QUIZ ? ' mp-float' : '');
  panel.id = 'mascotPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', QUIZ ? 'Denki-chan calculator' : 'Denki-chan helper');
  panel.tabIndex = -1;
  panel.hidden = true;
  panel.innerHTML = QUIZ
    ? '<div class="mp-head">' +
        '<img src="' + root + 'img/mascot-sparkle.png" width="28" height="28" alt="">' +
        '<b>Denki-chan <i>fx-EMC</i></b>' +
        '<button class="mp-close" type="button" aria-label="Close calculator">×</button>' +
      '</div>' +
      '<div class="mp-lcd"><input class="mp-expr" type="text" inputmode="none" autocomplete="off" spellcheck="false" aria-label="Calculator expression" placeholder="k*(2e-6)*(3e-6)/0.5^2">' +
        '<output class="mp-res" aria-live="polite"></output></div>' +
      '<div class="mp-pad" role="group" aria-label="Calculator keys">' +
        PAD.map(k => '<button type="button" class="' + k[2] + '" data-k="' + k[1] + '"' + (k[3] ? ' title="' + k[3] + '"' : '') + '>' + k[0] + '</button>').join('') + '</div>'
    : '<div class="mp-head">' +
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
  const listEl = panel.querySelector('.mp-links ul');   // both null on the quiz

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

  /* The calculator grows out of the header mascot and shrinks back into it:
     transform + opacity only, measured once per open/close. */
  let closing = false;
  function fly(inward) {
    const b = btn.getBoundingClientRect(), p = panel.getBoundingClientRect();
    const t = 'translate(' + (b.left + b.width / 2 - p.left - p.width / 2) + 'px,' + (b.top + b.height / 2 - p.top - p.height / 2) + 'px) scale(' + (b.width / p.width) + ')';
    return inward
      ? [{ transform: 'none', opacity: 1 }, { offset: .7, opacity: 1 }, { transform: t, opacity: 0 }]
      : [{ transform: t, opacity: 0 }, { offset: .3, opacity: 1 }, { transform: 'none', opacity: 1 }];
  }

  function open() {
    hideBubble();
    if (!QUIZ) { showTip(); renderShortcuts(); }
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    if (QUIZ) {
      btn.style.visibility = 'hidden';       // Denki-chan IS the calculator while it is open
      if (!reduced()) panel.animate(fly(false), { duration: 340, easing: 'cubic-bezier(.2,.9,.25,1.08)' });
      panel.querySelector('.mp-expr').focus({ preventScroll: true });   // an input, so the quiz's letter shortcuts stay out of the way
    } else panel.focus({ preventScroll: true });
  }

  function close(returnFocus) {
    if (!isOpen() || closing) return;
    const done = () => {
      closing = false;
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (QUIZ) {
        btn.style.visibility = '';
        if (!reduced()) btn.animate([{ transform: 'scale(.5)' }, { offset: .6, transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
      }
      if (returnFocus) btn.focus();
    };
    if (QUIZ && !reduced()) {
      closing = true;
      panel.animate(fly(true), { duration: 280, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).onfinish = done;
    } else done();
  }

  btn.addEventListener('click', () => { if (isOpen()) close(false); else open(); });
  panel.querySelector('.mp-close').addEventListener('click', () => close(true));
  if (!QUIZ) panel.querySelector('.mp-more').addEventListener('click', showTip);
  /* following a shortcut leaves the panel behind (the shell swaps chapters in
     place, so the page itself does not reload) */
  panel.addEventListener('click', e => { if (e.target.closest('a')) close(false); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !isOpen()) return;
    close(cluster.contains(document.activeElement));
  });
  /* the calculator is a tool you keep open beside the questions, so only the helper panel closes on an outside click or a tab away */
  document.addEventListener('click', e => {
    if (!QUIZ && isOpen() && !e.target.closest('.brand-cluster')) close(false);
  });
  /* keyboard users tabbing past the panel: it closes, no focus trap */
  cluster.addEventListener('focusout', e => {
    if (!QUIZ && isOpen() && e.relatedTarget && !cluster.contains(e.relatedTarget)) close(false);
  });
  /* a chapter switch on the home page changes what the tips/links should say */
  document.addEventListener('emc:view-shown', () => close(false));

  /* ------------------------------------------------------------- calculator */
  /* A tiny recursive-descent evaluator (no eval). Numbers take e-notation (1.6e-19); k and e are the
     site's constants; trig works in degrees. Unclosed brackets close themselves.
     shortcut: no implicit multiplication (2k is an error), type 2*k. */
  let ans = 0;
  function calc(src) {
    const C = (window.EMC && window.EMC.CONST) || { K: 8.99e9, E: 1.602176634e-19 };
    let text = String(src).toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '');
    text += ')'.repeat(Math.max(0, (text.match(/\(/g) || []).length - (text.match(/\)/g) || []).length));
    const t = text.match(/\d*\.?\d+(?:e[+-]?\d+)?|\d+\.|sqrt|sin|cos|tan|ans|[ke()+\-*\/^]/g) || [];
    if (!t.length || t.join('') !== text) throw new Error('syntax');
    const D = Math.PI / 180, F = { sqrt: Math.sqrt, sin: x => Math.sin(x * D), cos: x => Math.cos(x * D), tan: x => Math.tan(x * D) };
    let i = 0;
    const need = c => { if (t[i++] !== c) throw new Error('syntax'); };
    function prim() {
      const k = t[i++];
      if (k === undefined) throw new Error('syntax');
      if (k === '(') { const v = expr(); need(')'); return v; }
      if (F[k]) { if (t[i] !== '(') throw new Error('syntax'); const r = F[k](prim()); return Math.abs(r) < 1e-12 ? 0 : r; }   // cos(90) is 0, not 6e-17
      if (k === 'k') return C.K;
      if (k === 'e') return C.E;
      if (k === 'ans') return ans;
      const n = parseFloat(k);
      if (Number.isNaN(n)) throw new Error('syntax');
      return n;
    }
    const pow = () => { const b = prim(); if (t[i] === '^') { i++; return Math.pow(b, unary()); } return b; };
    const unary = () => { if (t[i] === '-') { i++; return -unary(); } return pow(); };
    function term() { let v = unary(); while (t[i] === '*' || t[i] === '/') { const o = t[i++], r = unary(); v = o === '*' ? v * r : v / r; } return v; }
    function expr() { let v = term(); while (t[i] === '+' || t[i] === '-') { const o = t[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; }
    const v = expr();
    if (i !== t.length || !Number.isFinite(v)) throw new Error('syntax');
    return v;
  }
  const fmt = v => {
    const a = Math.abs(v);
    return a !== 0 && (a >= 1e7 || a < 1e-4) ? v.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', 'e') : String(+v.toPrecision(10));
  };

  if (QUIZ) {
    const expr = panel.querySelector('.mp-expr'), res = panel.querySelector('.mp-res');
    const sel = () => {
      const a = expr.selectionStart === null ? expr.value.length : expr.selectionStart;
      return [a, expr.selectionEnd === null ? a : expr.selectionEnd];
    };
    const live = () => {                      // the answer shows as you type; half-typed input just shows nothing
      try { res.textContent = expr.value.trim() ? '= ' + fmt(calc(expr.value)) : ''; } catch (e) { res.textContent = ''; }
    };
    const equals = () => {
      try { ans = calc(expr.value); expr.value = fmt(ans); res.textContent = ''; } catch (e) { res.textContent = 'Check the expression'; }
    };
    panel.querySelector('.mp-pad').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = b.dataset.k, [a, z] = sel();
      if (k === '=') { equals(); return; }
      if (k === 'AC') { expr.value = ''; res.textContent = ''; return; }
      if (k === 'DEL') { if (a !== z) expr.setRangeText('', a, z, 'end'); else if (a > 0) expr.setRangeText('', a - 1, a, 'end'); }
      else expr.setRangeText(k === 'EXP' ? '×10^' : k, a, z, 'end');
      live();
    });
    expr.addEventListener('input', live);
    expr.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); equals(); } });

    /* arriving at the quiz: Denki-chan drops into the header once the title card has lifted */
    const calcLabel = 'Open Denki-chan’s calculator';
    btn.setAttribute('aria-label', calcLabel); btn.title = calcLabel;
    let started = false, failsafe = 0;
    function drop() {
      if (started) return;
      started = true; clearTimeout(failsafe);
      btn.style.opacity = '';
      btn.style.transformOrigin = '50% 100%';
      btn.animate([
        { offset: 0, transform: 'translateY(-130px) scale(.9, 1.16)', opacity: 0, easing: 'cubic-bezier(.5, 0, .9, .6)' },
        { offset: .34, transform: 'translateY(0) scale(1.24, .72)', opacity: 1, easing: 'cubic-bezier(.2, .8, .3, 1)' },
        { offset: .56, transform: 'translateY(-12px) scale(.95, 1.07)', opacity: 1, easing: 'cubic-bezier(.5, 0, .9, .6)' },
        { offset: .76, transform: 'translateY(0) scale(1.08, .92)', opacity: 1, easing: 'cubic-bezier(.2, .8, .3, 1)' },
        { offset: 1, transform: 'none', opacity: 1 }
      ], { duration: 760, fill: 'backwards' }).onfinish = () => { btn.style.transformOrigin = ''; };
    }
    if (!reduced()) {
      btn.style.opacity = '0';                // hidden until it drops
      failsafe = setTimeout(drop, 5000);      // a card that never clears can not hide the button for good
      const go = () => {
        const m = window.EMC_MOTION;
        if (m && m.state().card) document.addEventListener('emc:card-gone', drop, { once: true });
        else drop();
      };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    }
  }

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
