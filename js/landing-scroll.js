/* EMC Lab — landing page scroll behaviour (home page only).
   The page reads in order: statement, live preview, lesson chooser, simulations, quiz call.
     #about     the statement lights up word by word as it scrolls through the screen
     #preview   the two live demos grow out of the page as they arrive
     #learn     wide screens: the section pins, a wire fills, the mascot rides down it and the seven
                lessons change in turn. The syllabus beside it is a chooser: pointing at (or focusing)
                a lesson previews it, clicking jumps the scroll to it.
     #sims      wide screens: the section pins and the six cards slide sideways with the scroll; the
                mascot's face, the counter and the dots follow the card in view
     #quiz-call the two words of "Test yourself" slide together
     #lsBg      one fixed canvas behind the page: a dipole's field lines that turn with the scroll
   Phones, short windows and reduced motion get a plain stacked list and a native swipe carousel; reduced
   motion also gets every final state at once and a still canvas. Without JS nothing is hidden.
   Rules kept (see .claude/rules/motion.md): transform and opacity only; layout is measured on resize, when
   the page's size changes (ResizeObserver) and when a section arrives, never while scrolling; one passive
   window scroll listener, attached only while one of these sections is in view; one rAF per scroll frame,
   never a loop; hidden home view (a chapter is open) is skipped; keyboard focus on a card or lesson moves
   the page to it; starts after the intro (EMC.afterIntro). The CSS is the landing block at the end of
   css/input.css (html.ls-fx, html.ls-story, html.ls-pin, html.ls-io). */
(function () {
  if (window.__emcLandScroll) return;
  window.__emcLandScroll = 1;

  const html = document.documentElement;
  const byId = id => document.getElementById(id);
  const learn = byId('learnTrack'), simsTrack = byId('simsTrack');
  const about = byId('about'), preview = byId('preview'), quizCall = byId('quiz-call'), sims = byId('sims');
  if (!learn && !simsTrack && !about) return;

  const wide = window.matchMedia ? matchMedia('(min-width: 900px) and (min-height: 560px)') : null;
  const reduced = () => !!(window.EMC && window.EMC.reducedMotion);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = () => (reduced() ? 'instant' : 'smooth');
  /* html { scroll-behavior: smooth } turns 'auto' into a smooth scroll, so jumps say 'instant' */
  const jump = y => window.scrollTo({ top: y, behavior: 'instant' });

  let headerH = 58, vh = 800, listening = false, raf = 0, resizeRaf = 0, carouselRaf = 0, started = false;
  let fx = false, io = null, stopIo = null, ro = null, mode = '';
  const listeners = [];
  function on(target, type, fn, opts) { target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); }

  /* writes go through a per-element cache so an unchanged value is never set again */
  const last = new WeakMap();
  function put(el, prop, v) {
    if (!el) return;
    let c = last.get(el);
    if (!c) { c = {}; last.set(el, c); }
    if (c[prop] === v) return;
    c[prop] = v;
    el.style[prop] = v;
  }
  function unput(el, ...props) { if (!el) return; const c = last.get(el); props.forEach(p => { el.style[p] = ''; if (c) delete c[p]; }); }

  /* --------------------------------------------------------------- statement */
  const W = { el: about && about.querySelector('[data-st-words]'), words: [], top: 0, lit: -1 };
  if (W.el) {
    /* split once into word spans; the text and its order do not change */
    const parts = W.el.textContent.trim().split(/\s+/);
    W.el.textContent = '';
    parts.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'st-w';
      s.textContent = w;
      W.el.appendChild(s);
      if (i < parts.length - 1) W.el.appendChild(document.createTextNode(' '));
      W.words.push(s);
    });
  }
  function updateWords(y) {
    if (!W.el) return;
    /* lit from when the heading's top reaches 85% of the screen until it reaches 35% */
    const p = clamp((y + vh * 0.85 - W.top) / (vh * 0.5), 0, 1);
    const n = Math.round(p * W.words.length);
    if (n === W.lit) return;
    W.lit = n;
    W.words.forEach((s, i) => s.classList.toggle('lit', i < n));
  }

  /* ----------------------------------------------------------------- preview */
  const V = { panels: preview ? [...preview.querySelectorAll('.pv-panel')] : [], tops: [] };
  function updatePreview(y) {
    V.panels.forEach((el, i) => {
      const t = clamp((y + vh - V.tops[i] - vh * 0.06 * i) / (vh * 0.55), 0, 1);
      const e = 1 - (1 - t) * (1 - t);                                   /* ease out */
      put(el, 'transform', t >= 1 ? 'none' : 'translate3d(0,' + ((1 - e) * 70).toFixed(1) + 'px,0) scale(' + (0.88 + 0.12 * e).toFixed(4) + ')');
    });
  }

  /* --------------------------------------------------------------- quiz call */
  const Q = { w1: quizCall && quizCall.querySelector('.qc-w1'), w2: quizCall && quizCall.querySelector('.qc-w2'),
    face: quizCall && quizCall.querySelector('.qc-mascot'), top: 0 };
  function updateQuiz(y) {
    if (!Q.w1) return;
    const t = clamp((y + vh - Q.top) / (vh * 0.8), 0, 1), e = 1 - Math.pow(1 - t, 3);
    put(Q.w1, 'transform', t >= 1 ? 'none' : 'translate3d(' + (-(1 - e) * 34).toFixed(2) + 'vw,0,0)');
    put(Q.w2, 'transform', t >= 1 ? 'none' : 'translate3d(' + ((1 - e) * 34).toFixed(2) + 'vw,0,0)');
    put(Q.face, 'transform', t >= 1 ? 'none' : 'translate3d(0,' + ((1 - e) * 40).toFixed(1) + 'px,0) rotate(' + ((1 - e) * -18).toFixed(1) + 'deg) scale(' + (0.6 + 0.4 * e).toFixed(3) + ')');
  }

  /* ------------------------------------------------------- background canvas */
  const C = { el: byId('lsBg'), ctx: null, w: 0, h: 0, dpr: 1, from: 0, to: 1, g: -1, alpha: '' };
  if (C.el && C.el.getContext) C.ctx = C.el.getContext('2d');
  const bgOn = () => !!(C.ctx && fx && wide && wide.matches);       /* wide screens only: a phone gets no extra full-screen layer */
  function sizeCanvas() {
    if (!bgOn()) return;
    C.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(innerWidth * C.dpr), h = Math.round(innerHeight * C.dpr);
    if (w !== C.w || h !== C.h) { C.w = C.el.width = w; C.h = C.el.height = h; C.g = -1; }
  }
  /* field lines of a dipole (+ pink, − sky) traced from seeds round the positive charge */
  function drawCanvas(g) {
    if (!C.ctx || !C.w) return;
    const P = (window.EMC && EMC.PALETTE) || {};
    const light = html.dataset.theme === 'light';
    const ctx = C.ctx, W2 = C.w, H2 = C.h, s = Math.min(W2, H2);
    const ang = -0.5 + g * Math.PI * 1.15, sep = s * (0.2 + 0.1 * Math.sin(g * Math.PI));
    const cx = W2 * (0.62 - 0.24 * g), cy = H2 * 0.52;
    const q = [{ x: cx - Math.cos(ang) * sep, y: cy - Math.sin(ang) * sep, s: 1 }, { x: cx + Math.cos(ang) * sep, y: cy + Math.sin(ang) * sep, s: -1 }];
    ctx.clearRect(0, 0, W2, H2);
    ctx.lineWidth = Math.max(1, C.dpr);
    ctx.lineCap = 'round';
    const lines = 16, step = s * 0.012, maxSteps = 260, r0 = s * 0.02;
    for (let k = 0; k < lines; k++) {
      const a = (k / lines) * Math.PI * 2;
      let x = q[0].x + Math.cos(a) * r0, y = q[0].y + Math.sin(a) * r0;
      ctx.strokeStyle = k % 2 ? (light ? P.skyDeep : P.sky) : (light ? P.coral : P.pink);
      ctx.globalAlpha = light ? 0.2 : 0.26;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let n = 0; n < maxSteps; n++) {
        let ex = 0, ey = 0;
        for (const c of q) { const dx = x - c.x, dy = y - c.y, d2 = dx * dx + dy * dy + 1, d = Math.sqrt(d2); ex += c.s * dx / (d2 * d); ey += c.s * dy / (d2 * d); }
        const m = Math.hypot(ex, ey) || 1;
        x += ex / m * step; y += ey / m * step;
        ctx.lineTo(x, y);
        if (x < -s * 0.2 || y < -s * 0.2 || x > W2 + s * 0.2 || y > H2 + s * 0.2) break;
        if (Math.hypot(x - q[1].x, y - q[1].y) < r0) break;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = light ? 0.35 : 0.45;
    q.forEach(c => { ctx.fillStyle = c.s > 0 ? (light ? P.coral : P.pink) : (light ? P.skyDeep : P.sky); ctx.beginPath(); ctx.arc(c.x, c.y, s * 0.018, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  function updateCanvas(y) {
    if (!bgOn()) return;                                                  /* phones, short windows, reduced motion: no canvas (css hides it) */
    /* fades in as the statement arrives and out after the quiz call; turns with the scroll on wide screens */
    const a = clamp((y + vh - C.from) / (vh * 0.6), 0, 1) * clamp((C.to - y) / (vh * 0.6), 0, 1);
    put(C.el, 'opacity', a.toFixed(3));
    if (a <= 0) return;
    const g = Math.round(clamp((y - C.from + vh) / Math.max(1, C.to - C.from), 0, 1) * 400) / 400;
    if (g !== C.g) { C.g = g; drawCanvas(g); }
  }

  /* ---------------------------------------------------------------- lessons */
  const S = { el: learn, pinned: false, ok: false, inView: false, top: 0, range: 1, lineH: 0, i: -1, pick: -1, pickAt: -1, shown: -1,
    stops: [], nodes: [], btns: [], fill: null, mascot: null };
  if (learn) {
    S.stops = [...learn.querySelectorAll('.stop')];
    S.nodes = [...learn.querySelectorAll('.lw-nodes li')];
    S.fill = byId('lwFill'); S.mascot = byId('lwMascot');
    /* the syllabus is built from the lessons themselves: one source for every title */
    S.nodes.forEach((n, i) => {
      const st = S.stops[i];
      if (!st) return;
      n.style.top = (S.nodes.length > 1 ? i / (S.nodes.length - 1) * 100 : 0).toFixed(2) + '%';
      n.dataset.ch = st.dataset.ch || '';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lw-btn';
      b.setAttribute('aria-controls', st.id);
      const num = document.createElement('span'); num.className = 'lw-n'; num.textContent = String(i + 1).padStart(2, '0');
      const tt = document.createElement('span'); tt.className = 'lw-t'; tt.textContent = st.querySelector('.stop-title').textContent;
      b.append(num, tt);
      n.appendChild(b);
      S.btns.push(b);
    });
  }
  function showStop() {
    const i = S.pick >= 0 ? S.pick : S.i;
    if (i === S.shown) return;
    S.shown = i;
    S.stops.forEach((s, j) => s.classList.toggle('on', j === i));
    S.btns.forEach((b, j) => { b.classList.toggle('on', j === i); if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }
  function setStop(i) {
    S.i = i;
    if (S.pick >= 0 && i !== S.pickAt) S.pick = -1;                    /* scrolling on to another lesson ends a preview */
    S.nodes.forEach((n, j) => n.classList.toggle('done', j <= i));
    showStop();
  }
  function pick(i) { if (!S.pinned || i < 0) return; S.pick = i; S.pickAt = S.i; showStop(); }
  function storyY(i) { return S.top - headerH + (S.stops.length > 1 ? i / (S.stops.length - 1) : 0) * S.range; }
  function updateStory(y) {
    if (!S.ok) return;
    const n = S.stops.length, p = clamp((y + headerH - S.top) / S.range, 0, 1);
    put(S.fill, 'transform', 'scaleY(' + p.toFixed(4) + ')');
    put(S.mascot, 'transform', 'translate3d(0,' + (p * S.lineH).toFixed(1) + 'px,0)');
    const idx = Math.round(p * (n - 1));
    if (idx !== S.i) setStop(idx);
  }
  function goStop(i) { S.pick = -1; jump(storyY(i)); updateStory(window.scrollY); showStop(); }

  /* ------------------------------------------------------------- scroller */
  const P = { el: simsTrack, pinned: false, ok: false, inView: false, top: 0, range: 1, shift: 0, i: -1, cards: [], dots: [], view: null, rail: null,
    mascot: null, count: null, prev: null, next: null };
  if (simsTrack) {
    P.view = byId('simsView'); P.rail = byId('simsRail');
    P.cards = [...simsTrack.querySelectorAll('.sim-card')];
    P.dots = [...simsTrack.querySelectorAll('.sims-dots i')];
    P.mascot = byId('simsMascot'); P.count = byId('simsCount'); P.prev = byId('simsPrev'); P.next = byId('simsNext');
  }
  function setCard(i) {
    P.i = i;
    const n = P.cards.length;
    P.cards.forEach((c, j) => c.classList.toggle('on', j === i));
    P.dots.forEach((d, j) => d.classList.toggle('on', j === i));
    if (P.count) P.count.textContent = (i + 1) + ' / ' + n;
    if (P.prev) P.prev.disabled = i <= 0;
    if (P.next) P.next.disabled = i >= n - 1;
    const face = P.cards[i] && P.cards[i].dataset.face;
    if (P.mascot && face) { const src = 'img/mascot-face-' + face + '.png'; if (P.mascot.getAttribute('src') !== src) P.mascot.setAttribute('src', src); }
  }
  function cardY(i) { return P.top - headerH + (P.cards.length > 1 ? i / (P.cards.length - 1) : 0) * P.range; }
  function updateScroller(y) {
    if (!P.ok) return;
    const n = P.cards.length, p = clamp((y + headerH - P.top) / P.range, 0, 1);
    put(P.rail, 'transform', 'translate3d(' + (-p * P.shift).toFixed(1) + 'px,0,0)');
    const idx = Math.round(p * (n - 1));
    if (idx !== P.i) setCard(idx);
  }
  /* native carousel: the active card is the one the snap settled on */
  function updateCarousel() {
    const v = P.view, n = P.cards.length;
    if (!v || P.pinned || n < 2) return;
    const step = P.cards[1].getBoundingClientRect().left - P.cards[0].getBoundingClientRect().left;
    let idx = Math.round(v.scrollLeft / Math.max(1, step));
    if (v.scrollLeft + v.clientWidth >= v.scrollWidth - 3) idx = n - 1;
    idx = clamp(idx, 0, n - 1);
    if (idx !== P.i) setCard(idx);
  }
  function goCard(i) {
    i = clamp(i, 0, P.cards.length - 1);
    if (P.pinned && P.ok) window.scrollTo({ top: cardY(i), behavior: smooth() });
    else P.cards[i].scrollIntoView({ behavior: smooth(), inline: 'start', block: 'nearest' });
  }

  /* ------------------------------------------------------- modes + layout */
  const usable = el => !!el && el.offsetParent !== null;          /* false while a chapter is open and the home view is hidden */
  const docTop = el => el.getBoundingClientRect().top + window.scrollY;
  function measure() {
    const hd = document.querySelector('.site-header');
    headerH = (hd && hd.offsetHeight) || 58;
    vh = window.innerHeight || 800;
    if (W.el && usable(W.el)) W.top = docTop(W.el);
    /* the panels carry transforms: measure their (untransformed) wrapper instead */
    const grid = preview && preview.querySelector('.pv-grid');
    if (grid && usable(grid)) { const g = docTop(grid); V.tops = V.panels.map(p => g + p.offsetTop); }
    if (quizCall && usable(quizCall)) Q.top = docTop(quizCall);
    if (C.el && about && usable(about) && bgOn()) {
      C.from = docTop(about);
      C.to = quizCall ? docTop(quizCall) + quizCall.offsetHeight - vh * 0.4 : document.documentElement.scrollHeight;
      sizeCanvas();
    }
    S.ok = !!learn && usable(learn);
    if (S.ok) {
      const stick = learn.querySelector('.learn-stick'), line = learn.querySelector('.lw-line');
      S.top = docTop(learn);
      S.range = Math.max(1, learn.offsetHeight - stick.offsetHeight);
      S.lineH = S.mascot && line ? Math.max(0, line.offsetHeight - S.mascot.offsetHeight) : 0;
    }
    P.ok = !!simsTrack && usable(simsTrack);
    if (P.ok) {
      const stick = simsTrack.querySelector('.sims-stick');
      P.top = docTop(simsTrack);
      P.range = Math.max(1, simsTrack.offsetHeight - stick.offsetHeight);
      /* the last card must end inside the view's padding, not under it */
      const cs = getComputedStyle(P.view);
      const inner = P.view.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      P.shift = Math.max(0, P.rail.scrollWidth - inner);
    }
  }
  const SECTIONS = [about, preview, learn, simsTrack, quizCall].filter(Boolean);
  const inView = new Set();
  function frame() {
    const y = window.scrollY;
    if (fx) {
      if (inView.has(about)) updateWords(y);
      if (inView.has(preview)) updatePreview(y);
      if (inView.has(quizCall)) updateQuiz(y);
      updateCanvas(y);
    }
    if (S.pinned && inView.has(learn)) updateStory(y);
    if (P.pinned && inView.has(simsTrack)) updateScroller(y);
  }
  function scheduleFrame() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); }); }
  function scheduleCarousel() { if (!carouselRaf) carouselRaf = requestAnimationFrame(() => { carouselRaf = 0; updateCarousel(); }); }
  function listen(yes) {
    if (yes === listening) return;
    listening = yes;
    if (yes) window.addEventListener('scroll', scheduleFrame, { passive: true });
    else window.removeEventListener('scroll', scheduleFrame);
  }
  function syncListening() {
    const home = SECTIONS.some(usable);
    listen(home && ((fx && (inView.has(about) || inView.has(preview) || inView.has(quizCall) || inView.has(learn) || inView.has(simsTrack))) ||
      (S.pinned && inView.has(learn)) || (P.pinned && inView.has(simsTrack))));
  }

  function apply() {
    const pin = !!wide && wide.matches && !reduced();
    const next = (pin ? 'pin' : 'flat') + (reduced() ? '-rm' : '');
    const changed = next !== mode;
    mode = next;
    fx = !reduced();
    S.pinned = pin && !!learn; P.pinned = pin && !!simsTrack;
    html.classList.toggle('ls-fx', fx);
    html.classList.toggle('ls-story', S.pinned);
    html.classList.toggle('ls-pin', P.pinned);
    if (changed) {
      /* leaving a mode: drop what it wrote so the other mode starts clean */
      if (!S.pinned) { S.pick = -1; S.i = -1; S.shown = -1; S.stops.forEach(s => s.classList.remove('on')); S.btns.forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-current'); }); unput(S.fill, 'transform'); unput(S.mascot, 'transform'); }
      if (!P.pinned && P.rail) { unput(P.rail, 'transform'); if (P.view) P.view.scrollLeft = 0; }
      if (!fx) {
        W.lit = -1; W.words.forEach(s => s.classList.remove('lit'));
        V.panels.forEach(p => unput(p, 'transform'));
        [Q.w1, Q.w2, Q.face].forEach(e => unput(e, 'transform'));
      }
      C.g = -1;
    }
    measure();
    if (S.pinned) updateStory(window.scrollY);
    if (simsTrack) { if (P.pinned) updateScroller(window.scrollY); else { if (P.i < 0) setCard(0); updateCarousel(); } }
    if (fx) { W.lit = -1; updateWords(window.scrollY); updatePreview(window.scrollY); updateQuiz(window.scrollY); }
    if (bgOn()) updateCanvas(window.scrollY);
    syncListening();
  }
  function onResize() { if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; apply(); }); }
  function redrawCanvas() { if (bgOn() && C.g >= 0) drawCanvas(C.g); }

  /* ------------------------------------------------------------------ init */
  function init() {
    if (started) return;
    started = true;
    if (learn) {
      /* stacked layouts: lessons come in as they reach the lower part of the screen */
      if ('IntersectionObserver' in window) {
        html.classList.add('ls-io');
        stopIo = new IntersectionObserver(entries => {
          for (const e of entries) if (e.isIntersecting) { e.target.classList.add('seen'); stopIo.unobserve(e.target); }
        }, { rootMargin: '0px 0px -18% 0px' });
        S.stops.forEach(s => stopIo.observe(s));
      }
      on(learn.querySelector('.learn-stops'), 'focusin', e => {         /* keyboard: bring the focused lesson on screen */
        if (!S.pinned || !S.ok) return;
        const i = S.stops.indexOf(e.target.closest('.stop'));
        if (i >= 0 && i !== S.shown) goStop(i);
      });
      const list = byId('lwNodes');
      if (list) {
        on(list, 'pointerover', e => { const b = e.target.closest && e.target.closest('.lw-btn'); if (b && e.pointerType !== 'touch') pick(S.btns.indexOf(b)); });
        on(list, 'focusin', e => { const b = e.target.closest && e.target.closest('.lw-btn'); if (b) pick(S.btns.indexOf(b)); });
        on(list, 'click', e => { const b = e.target.closest && e.target.closest('.lw-btn'); if (b && S.pinned && S.ok) goStop(S.btns.indexOf(b)); });
      }
    }
    if (simsTrack) {
      if (P.prev) on(P.prev, 'click', () => goCard(P.i - 1));
      if (P.next) on(P.next, 'click', () => goCard(P.i + 1));
      on(P.view, 'scroll', () => {
        if (P.pinned) { if (P.view.scrollLeft) P.view.scrollLeft = 0; return; }   /* a focus jump must not shift the pinned rail */
        scheduleCarousel();
      }, { passive: true });
      on(P.rail, 'focusin', e => {
        const i = P.cards.indexOf(e.target.closest('.sim-card'));
        if (i < 0) return;
        if (P.pinned && P.ok && i !== P.i) { jump(cardY(i)); updateScroller(window.scrollY); }
      });
    }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target);
          if (e.target === simsTrack && sims) sims.classList.toggle('ls-live', e.isIntersecting);   /* the card art only animates here */
        }
        measure(); frame();
        syncListening();
      }, { rootMargin: '120px 0px 120px 0px' });
      SECTIONS.forEach(s => io.observe(s));
    } else { SECTIONS.forEach(s => inView.add(s)); if (sims) sims.classList.add('ls-live'); }
    on(window, 'resize', onResize);
    if (wide && wide.addEventListener) { wide.addEventListener('change', onResize); listeners.push([wide, 'change', onResize]); }
    on(document, 'emc:view-shown', onResize);                            /* the home view came back from a chapter */
    on(document, 'emc:theme', redrawCanvas);
    on(window, 'load', onResize);                                        /* fonts and equations have settled the layout above */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    /* anything that changes the page's height (Details switch, equations, an opened panel) moves the tracks */
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(onResize); ro.observe(document.body); }
    apply();
  }

  function destroy() {
    listen(false);
    for (const [t, type, fn, opts] of listeners) t.removeEventListener(type, fn, opts);
    listeners.length = 0;
    if (io) io.disconnect();
    if (stopIo) stopIo.disconnect();
    if (ro) ro.disconnect();
    for (const r of [raf, resizeRaf, carouselRaf]) if (r) cancelAnimationFrame(r);
    raf = resizeRaf = carouselRaf = 0;
    html.classList.remove('ls-fx', 'ls-story', 'ls-pin', 'ls-io');
    if (sims) sims.classList.remove('ls-live');
  }

  /* after the intro and the landing sequence: nothing here may stall the timeline */
  if (window.EMC && typeof window.EMC.afterIntro === 'function') window.EMC.afterIntro(init); else init();

  window.EMC_LANDSCROLL = {
    state() {
      return { story: S.pinned, pin: P.pinned, fx, listening, rafs: (raf ? 1 : 0) + (resizeRaf ? 1 : 0) + (carouselRaf ? 1 : 0),
        card: P.i, stop: S.i, shown: S.shown, lit: W.lit, words: W.words.length, started };
    },
    goCard, goStop, destroy
  };
})();
