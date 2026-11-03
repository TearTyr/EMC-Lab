/* EMC Lab — the lesson wire on a chapter page.
   A slim wire at the left edge of wide screens, built from the page's own lesson headings (h2 with an id and a
   number like "1.2" or "2.1"): one dot per lesson, the one being read lit, the wire filled down to it, the title
   sliding out on hover or focus. Links are plain anchors, so it works without the rest of the page's scripts.
   Narrower screens get no wire (the lesson cards at the top of the page do the same job).
   Rules kept (see .claude/rules/motion.md): transform and opacity only (css); layout is read inside an
   IntersectionObserver callback, never in a scroll or frame loop; no scroll listener and no timers; the observer
   disconnects itself once the chapter is gone (the shell replaces the page's markup when you leave).
   This file runs again on every same-page chapter mount, so it does nothing a second time for the same header. */
(function () {
  const head = document.querySelector('.ch-head');
  if (!head || head.__lessonWire) return;
  head.__lessonWire = true;

  const heads = [...document.querySelectorAll('h2.h-sec[id], .lesson-section h2.h-topic[id]')].map(h => {
    const m = h.textContent.replace(/\s+/g, ' ').trim().match(/^(\d+\.\d+)\s*[·.:-]?\s*(.+)$/);
    return m ? { el: h, id: h.id, num: m[1], title: m[2] } : null;
  }).filter(Boolean);
  if (heads.length < 2) return;

  const nav = document.createElement('nav');
  nav.className = 'lw-chapter';
  nav.setAttribute('aria-label', 'Lessons in this chapter');
  nav.style.setProperty('--n', heads.length);
  const ol = document.createElement('ol');
  const links = heads.map(h => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    const dot = document.createElement('i'); dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    const b = document.createElement('b'); b.textContent = h.num;
    label.append(b, ' ' + h.title);
    a.append(dot, label);
    li.appendChild(a); ol.appendChild(li);
    return a;
  });
  nav.appendChild(ol);
  head.insertAdjacentElement('afterend', nav);

  let cur = -1;
  function mark() {
    if (!nav.isConnected) { if (io) io.disconnect(); return; }               /* the chapter was replaced */
    const line = window.innerHeight * 0.4;
    let idx = -1;
    heads.forEach((h, i) => { if (h.el.getBoundingClientRect().top < line) idx = i; });
    if (idx === cur) return;
    cur = idx;
    nav.style.setProperty('--i', Math.max(0, idx));
    nav.classList.toggle('on', idx >= 0);
    links.forEach((a, i) => { a.classList.toggle('cur', i === idx); a.classList.toggle('done', i < idx); if (i === idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  }
  /* the observer only says "a heading crossed the screen"; where everything is is read here, once per crossing */
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(mark, { rootMargin: '0px 0px -60% 0px', threshold: [0, 1] }) : null;
  if (io) {
    heads.forEach(h => io.observe(h.el));
    /* and the top and bottom of the page (before the first lesson, after the last) */
    io.observe(head);
  }
  mark();
})();
